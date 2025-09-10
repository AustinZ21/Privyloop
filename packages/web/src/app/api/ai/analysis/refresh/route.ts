/**
 * POST /api/ai/analysis/refresh
 *
 * Admin-protected endpoint to force refresh ai_analysis
 * Body: { templateId?: string, platformId?: string }
 * Header: x-ai-admin-token: <AI_ADMIN_TOKEN>
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@privyloop/core/database';
import { privacyTemplates } from '@privyloop/core/database/schema';
import { and, desc, eq } from 'drizzle-orm';
import { AIAnalysisService } from '@privyloop/core/services';

export async function POST(request: NextRequest) {
  const adminToken = request.headers.get('x-ai-admin-token');
  if (!process.env.AI_ADMIN_TOKEN || adminToken !== process.env.AI_ADMIN_TOKEN) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing admin token' } }, { status: 401 });
  }

  const db = getDb();
  const ai = new AIAnalysisService(db);
  try {
    const body = await request.json().catch(() => ({}));
    const { templateId, platformId } = body || {};

    if (!templateId && !platformId) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'templateId or platformId required' } }, { status: 400 });
    }

    let tpl: any | undefined;
    if (templateId) {
      [tpl] = await db.select().from(privacyTemplates).where(eq(privacyTemplates.id, templateId)).limit(1);
    } else {
      [tpl] = await db
        .select()
        .from(privacyTemplates)
        .where(and(eq(privacyTemplates.platformId, platformId), eq(privacyTemplates.isActive, true)))
        .orderBy(desc(privacyTemplates.createdAt))
        .limit(1);
    }

    if (!tpl) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } }, { status: 404 });
    }

    const updated = await ai.refreshTemplateAnalysis(tpl.id);
    if (!updated) {
      return NextResponse.json({ success: false, error: { code: 'REFRESH_FAILED', message: 'Unable to refresh analysis' } }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { templateId: updated.id, platformId: updated.platformId, version: updated.version, aiAnalysis: updated.aiAnalysis } });
  } catch (error) {
    console.error('AI analysis refresh failed:', error);
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Refresh failed' } }, { status: 500 });
  }
}
