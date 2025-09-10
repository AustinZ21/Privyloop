/**
 * GET /api/ai/analysis
 *
 * Returns AI analysis for a platform's active privacy template or a specific template.
 * Query params:
 *   - platformId: string (uuid)
 *   - templateId: string (uuid)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@privyloop/core/database';
import { privacyTemplates } from '@privyloop/core/database/schema';
import { and, desc, eq } from 'drizzle-orm';
import { AIAnalysisService } from '@privyloop/core/services';

export async function GET(request: NextRequest) {
  const db = getDb();
  const ai = new AIAnalysisService(db);
  try {
    const url = new URL(request.url);
    const platformId = url.searchParams.get('platformId');
    const templateId = url.searchParams.get('templateId');

    if (!platformId && !templateId) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'platformId or templateId is required' }
      }, { status: 400 });
    }

    let template: any | undefined;

    if (templateId) {
      [template] = await db
        .select()
        .from(privacyTemplates)
        .where(eq(privacyTemplates.id, templateId))
        .limit(1);
    } else if (platformId) {
      [template] = await db
        .select()
        .from(privacyTemplates)
        .where(and(eq(privacyTemplates.platformId, platformId), eq(privacyTemplates.isActive, true)))
        .orderBy(desc(privacyTemplates.createdAt))
        .limit(1);
    }

    if (!template) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Template not found' }
      }, { status: 404 });
    }

    // Ensure ai_analysis exists
    try {
      template = await ai.analyzeTemplateIfMissing(template);
    } catch (err) {
      console.error('AI analysis ensure failed (non-fatal):', err);
    }

    // Build a light category name map for UI friendliness
    const categories = (template.settingsStructure as any)?.categories || {};
    const categoryNameMap: Record<string, string> = {};
    for (const [id, cat] of Object.entries(categories)) {
      categoryNameMap[id] = (cat as any)?.name || id;
    }

    return NextResponse.json({
      success: true,
      data: {
        templateId: template.id,
        platformId: template.platformId,
        version: template.version,
        aiAnalysis: template.aiAnalysis,
        categoryNameMap,
      }
    });
  } catch (error) {
    console.error('Error fetching AI analysis:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch analysis' }
    }, { status: 500 });
  }
}
