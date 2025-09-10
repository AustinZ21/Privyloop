#!/usr/bin/env node
/**
 * One‑shot AI analysis backfill for privacy templates
 *
 * Computes and persists ai_analysis for templates missing it (default),
 * or for all templates when --all is provided. Uses GEMINI_API_KEY when set;
 * otherwise falls back to heuristic analysis so the pipeline completes.
 */

import { getDb, closeConnection } from '../src/database/connection';
import { privacyTemplates } from '../src/database/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { AIAnalysisService } from '../src/services';

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

async function main() {
  const args = process.argv.slice(2);
  const forceAll = args.includes('--all');
  const delayArg = args.find(a => a.startsWith('--delay='));
  const limitArg = args.find(a => a.startsWith('--limit='));

  const delayMs = delayArg ? Math.max(0, parseInt(delayArg.split('=')[1], 10)) : 750;
  const limit = limitArg ? Math.max(1, parseInt(limitArg.split('=')[1], 10)) : undefined;

  console.log(`\n🔎 AI Backfill starting (mode=${forceAll ? 'all' : 'missing'}, delay=${delayMs}ms${limit ? `, limit=${limit}` : ''})`);

  const db = getDb();
  const ai = new AIAnalysisService(db, process.env.GEMINI_API_KEY);

  try {
    let templates: any[] = [];
    if (forceAll) {
      templates = await db.select().from(privacyTemplates).orderBy(desc(privacyTemplates.createdAt)).limit(limit ?? 1000000);
    } else {
      // Prefer SQL IS NULL to avoid type friction
      const rows = await db.execute(sql`SELECT * FROM privacy_templates WHERE ai_analysis IS NULL ORDER BY created_at DESC`);
      templates = limit ? rows.slice(0, limit) : rows;
    }

    if (!templates.length) {
      console.log('✅ Nothing to backfill — all templates already analyzed.');
      return;
    }

    console.log(`🧠 Backfilling analysis for ${templates.length} template(s)...`);
    let ok = 0, fail = 0;
    for (let i = 0; i < templates.length; i++) {
      const tpl = templates[i];
      process.stdout.write(`  [${i + 1}/${templates.length}] ${tpl.id} … `);
      try {
        if (forceAll) {
          await ai.refreshTemplateAnalysis(tpl.id);
        } else {
          await ai.analyzeTemplateIfMissing(tpl);
        }
        ok++;
        process.stdout.write('done\n');
      } catch (err) {
        fail++;
        process.stdout.write(`failed: ${(err as Error)?.message || err}\n`);
      }
      if (i < templates.length - 1 && delayMs > 0) await sleep(delayMs);
    }

    console.log(`\n✅ Backfill complete: ${ok} succeeded, ${fail} failed.`);
  } catch (err) {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

main();

