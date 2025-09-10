/**
 * AI Analysis Service
 * - Computes and persists ai_analysis for privacy_templates
 * - Uses Gemini when configured; otherwise falls back to a local heuristic
 */

import { and, desc, eq } from 'drizzle-orm';
import { type Database } from '../../database/connection';
import { privacyTemplates, platforms, type PrivacyTemplate } from '../../database/schema';
import { buildTemplateAnalysisPrompt, type PrivacyAIAnalysisOutput } from './analysis-prompt';
import { GeminiClient } from './gemini-client';
import { OpenAIClient } from './openai-client';

export class AIAnalysisService {
  private gemini: GeminiClient;
  private openai: OpenAIClient;

  constructor(private db: Database) {
    this.gemini = new GeminiClient(process.env.GEMINI_API_KEY);
    this.openai = new OpenAIClient(process.env.OPENAI_API_KEY);
  }

  /** Ensure a template has ai_analysis; no-op if already present. */
  async analyzeTemplateIfMissing(template: PrivacyTemplate): Promise<PrivacyTemplate> {
    if (template.aiAnalysis) return template;
    return await this.computeAndPersist(template);
  }

  /** Force refresh ai_analysis for a template by id. */
  async refreshTemplateAnalysis(templateId: string): Promise<PrivacyTemplate | null> {
    const [tpl] = await this.db
      .select()
      .from(privacyTemplates)
      .where(eq(privacyTemplates.id, templateId))
      .limit(1);
    if (!tpl) return null;
    return await this.computeAndPersist(tpl, true);
  }

  private async computeAndPersist(template: PrivacyTemplate, force = false): Promise<PrivacyTemplate> {
    const [platform] = await this.db
      .select({ id: platforms.id, name: platforms.name, slug: platforms.slug })
      .from(platforms)
      .where(eq(platforms.id, template.platformId))
      .limit(1);

    const platformName = platform?.name || 'Platform';
    const platformSlug = platform?.slug;

    const { prompt } = buildTemplateAnalysisPrompt({
      platformName,
      platformSlug,
      templateVersion: template.version,
      settings: template.settingsStructure as any,
      maxRecommendations: 5,
      modelHint: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
    });

    let analysis: PrivacyAIAnalysisOutput | null = null;

    if (this.gemini.isConfigured()) {
      try {
        const text = await this.gemini.generateText(prompt);
        analysis = this.safeParseJSON(text);
      } catch (err) {
        console.error('Gemini analysis failed; trying OpenAI fallback:', err);
        // Try OpenAI next
        analysis = await this.tryOpenAI(prompt, template, platformName);
      }
    } else if (this.openai.isConfigured()) {
      analysis = await this.tryOpenAI(prompt, template, platformName);
    } else {
      // No API keys: use heuristic to keep flow working in dev/tests
      analysis = this.localHeuristicAnalysis(template, platformName);
    }

    if (!analysis) {
      // Final fallback: minimal stub
      analysis = {
        overallRiskScore: 50,
        privacyImpact: 'medium',
        keyRecommendations: ['Review your privacy settings.'],
        categoryScores: {},
        riskFactors: ['Unknown risk'],
        generatedAt: new Date().toISOString(),
        modelUsed: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
        summary: 'We could not fully analyze these settings. Please review them manually.',
        categoryInsights: {},
      };
    }

    const [updated] = await this.db
      .update(privacyTemplates)
      .set({ aiAnalysis: analysis, updatedAt: new Date() })
      .where(eq(privacyTemplates.id, template.id))
      .returning();

    return updated ?? template;
  }

  private async tryOpenAI(prompt: string, template: PrivacyTemplate, platformName: string): Promise<PrivacyAIAnalysisOutput | null> {
    try {
      const text = await this.openai.generateText(prompt);
      const parsed = this.safeParseJSON(text);
      if (parsed) {
        // Ensure modelUsed reflects OpenAI model
        parsed.modelUsed = process.env.OPENAI_MODEL || 'gpt-5-mini';
        return parsed;
      }
    } catch (err) {
      console.error('OpenAI analysis failed; using heuristic:', err);
    }
    return this.localHeuristicAnalysis(template, platformName);
  }

  private safeParseJSON(text: string): PrivacyAIAnalysisOutput | null {
    try {
      // Try to extract JSON block if extra text appears
      const match = text.match(/\{[\s\S]*\}\s*$/);
      const json = match ? match[0] : text;
      const parsed = JSON.parse(json);
      // Minimal normalization
      if (typeof parsed.overallRiskScore === 'number') {
        parsed.overallRiskScore = Math.max(0, Math.min(100, Math.round(parsed.overallRiskScore)));
      }
      if (!parsed.generatedAt) parsed.generatedAt = new Date().toISOString();
      if (!parsed.modelUsed) parsed.modelUsed = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
      return parsed as PrivacyAIAnalysisOutput;
    } catch {
      return null;
    }
  }

  /** Simple local analysis using template risk metadata. */
  private localHeuristicAnalysis(template: PrivacyTemplate, platformName: string): PrivacyAIAnalysisOutput {
    const categories = template.settingsStructure?.categories || {};
    const scoreMap: Record<string, number> = {};
    const recs: string[] = [];
    const riskFactors: string[] = [];

    // Risk mapping per setting
    const riskWeight = (risk?: 'low' | 'medium' | 'high') =>
      risk === 'high' ? 85 : risk === 'medium' ? 60 : 30;

    for (const [catId, cat] of Object.entries(categories)) {
      const settings = (cat as any).settings || {};
      let total = 0;
      let count = 0;
      for (const [settingId, s] of Object.entries(settings)) {
        const r = riskWeight((s as any).riskLevel);
        total += r; count += 1;
        if ((s as any).riskLevel === 'high') {
          riskFactors.push(`${(s as any).name || settingId} high risk`);
        }
        if ((s as any).recommendation && recs.length < 5) {
          recs.push((s as any).recommendation as string);
        }
      }
      scoreMap[catId] = count > 0 ? Math.round(total / count) : 30;
    }

    const catScores = Object.values(scoreMap);
    const overall = catScores.length ? Math.round(catScores.reduce((a, b) => a + b, 0) / catScores.length) : 50;
    const impact = overall < 34 ? 'low' : overall < 67 ? 'medium' : 'high';

    const summaryLines: string[] = [
      `${platformName} privacy overview:`,
      overall >= 67 ? 'High data exposure risk.' : overall >= 34 ? 'Moderate privacy posture.' : 'Conservative privacy posture.',
      'Focus on the highest‑risk categories first.',
      'Apply the quick actions below to improve.'
    ];

    return {
      overallRiskScore: overall,
      privacyImpact: impact as 'low' | 'medium' | 'high',
      keyRecommendations: recs.slice(0, 5).length ? recs.slice(0, 5) : ['Review ad personalization settings', 'Limit activity tracking visibility'],
      categoryScores: scoreMap,
      riskFactors: riskFactors.slice(0, 6),
      generatedAt: new Date().toISOString(),
      modelUsed: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
      summary: summaryLines.join(' '),
      categoryInsights: undefined,
    };
  }
}
