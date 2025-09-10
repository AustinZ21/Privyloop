/**
 * AI Prompt Builders for Privacy Template Analysis (TASK-005)
 *
 * Produces concise, plain‑English explanations and a structured JSON analysis
 * for a platform's privacy settings template. Designed for Gemini models.
 */

import { type PrivacySettingsStructure } from '../../database/schema/privacy-templates';

export type PrivacyAIAnalysisOutput = {
  overallRiskScore: number; // 0-100
  privacyImpact: 'low' | 'medium' | 'high';
  keyRecommendations: string[]; // max 5, one sentence each
  categoryScores: Record<string, number>; // 0-100 per categoryId
  riskFactors: string[]; // terse phrases
  generatedAt: string; // ISO string
  modelUsed: string; // e.g. "gemini-2.5-pro"
  // Presentation fields (optional; useful for UI rendering)
  summary?: string; // 4-6 short lines, plain language
  categoryInsights?: Record<string, {
    title: string;
    whatItMeans: string; // simple explanation for users
    recommendedAction: string; // one sentence, actionable
  }>;
};

export function buildTemplateAnalysisPrompt(params: {
  platformName: string;
  platformSlug?: string;
  templateVersion?: string;
  settings: PrivacySettingsStructure;
  maxRecommendations?: number; // default 5
  modelHint?: string; // e.g. gemini-2.5-pro
}) {
  const {
    platformName,
    platformSlug,
    templateVersion,
    settings,
    maxRecommendations = 5,
    modelHint = 'gemini-2.5-pro',
  } = params;

  const outputSchema: PrivacyAIAnalysisOutput = {
    overallRiskScore: 0,
    privacyImpact: 'medium',
    keyRecommendations: [],
    categoryScores: {},
    riskFactors: [],
    generatedAt: new Date().toISOString(),
    modelUsed: modelHint,
    summary: '',
    categoryInsights: {},
  };

  // Single string prompt designed for text-only generation with a JSON result.
  // The client must append the JSON-serialized settings at the end.
  const prompt = [
    `You are a privacy settings explainer for end users.`,
    `Task: Analyze ${platformName} privacy settings and produce:`,
    `- A concise, plain-English summary`,
    `- A structured JSON analysis following the provided schema`,
    `Audience: non-technical users. Grade 7–9 reading level.`,
    `Style: short sentences, active voice, neutral tone. Avoid legal or vague language.`,
    `Scope: Use ONLY the data provided. If something is missing, mark as "Not detected".`,
    `Formatting rules:`,
    `- Output MUST be valid JSON only (no code fences, no prose outside JSON).`,
    `- Keep summary to 4–6 short lines (<= 110 words total).`,
    `- keyRecommendations: max ${maxRecommendations}, one sentence each, actionable.`,
    `- riskFactors: terse phrases (2–5 words), concrete.`,
    `Schema to follow exactly:`,
    JSON.stringify({
      overallRiskScore: 0,
      privacyImpact: 'low' as const,
      keyRecommendations: [''],
      categoryScores: { example_category_id: 0 },
      riskFactors: [''],
      generatedAt: new Date().toISOString(),
      modelUsed: modelHint,
      summary: 'One line per bullet, plain text.',
      categoryInsights: {
        example_category_id: {
          title: 'Readable category name',
          whatItMeans: 'Explain in simple language what this category covers.',
          recommendedAction: 'One sentence, specific next step.'
        }
      }
    }, null, 2),
    `Map categoryScores and categoryInsights keys to the provided settings.categories object IDs.`,
    platformSlug ? `Platform slug (hint): ${platformSlug}` : '',
    templateVersion ? `Template version (hint): ${templateVersion}` : '',
    `Input privacy settings (JSON):`,
    JSON.stringify(settings, null, 2),
    `Return ONLY the JSON result. Do not add any text before or after the JSON.`
  ].filter(Boolean).join('\n');

  return {
    prompt,
    outputSchema,
    meta: {
      platformName,
      platformSlug,
      templateVersion,
      modelHint,
      maxRecommendations,
    }
  };
}

export function buildDiffAnalysisPrompt(params: {
  platformName: string;
  previousSettings: PrivacySettingsStructure;
  currentSettings: PrivacySettingsStructure;
  modelHint?: string;
}) {
  const { platformName, previousSettings, currentSettings, modelHint = 'gemini-2.5-pro' } = params;

  const prompt = [
    `You are a privacy settings explainer for end users.`,
    `Task: Compare two versions of ${platformName} privacy settings and explain changes.`,
    `Audience: non-technical users. Grade 7–9 reading level.`,
    `Style: short sentences, active voice, neutral tone.`,
    `Scope: Use ONLY provided data.`,
    `Output MUST be valid JSON only (no prose).`,
    `Schema:`,
    JSON.stringify({
      summary: '3–4 short lines explaining the overall change',
      changes: [
        {
          path: 'categories.<id>.settings.<id>',
          change: 'added|removed|tightened|loosened|renamed|reworded',
          impact: 'low|medium|high',
          whatItMeans: 'Plain-English, one sentence',
          recommendation: 'One sentence action',
        }
      ]
    }, null, 2),
    `Previous settings (JSON):`,
    JSON.stringify(previousSettings, null, 2),
    `Current settings (JSON):`,
    JSON.stringify(currentSettings, null, 2),
    `Return ONLY the JSON result.`
  ].join('\n');

  return { prompt, meta: { platformName, modelHint } };
}

