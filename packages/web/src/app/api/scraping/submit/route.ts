/**
 * Privacy Data Ingestion API Endpoint
 * Receives scraped privacy data from browser extension
 * POST /api/scraping/submit - Process and store privacy settings with template optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@privyloop/core/database';
import { ScrapingEngine } from '@privyloop/core/scraping/scraping-engine';
import { eq, desc, and } from 'drizzle-orm';
import { users, privacySnapshots } from '@privyloop/core/database/schema';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { AIAnalysisService } from '@privyloop/core/services';
// Simple deep equality check for JSON-like objects (arrays, objects, primitives)
function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (!isEqual(a[i], b[i])) return false;
      return true;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) if (!isEqual(a[k], b[k])) return false;
    return true;
  }
  // NaN equality
  return Number.isNaN(a) && Number.isNaN(b);
}

// Validate required environment variables
if (!process.env.FIRECRAWL_API_KEY) {
  console.error('FIRECRAWL_API_KEY environment variable is not set');
}

// Initialize database and scraping engine
const db = getDb();
const scrapingEngine = new ScrapingEngine(db, process.env.FIRECRAWL_API_KEY);


// Validation schema for incoming data
const privacyDataSchema = z.object({
  scanId: z.string().min(1),
  userId: z.string().min(1),
  platformId: z.string().uuid(),
  method: z.enum(['extension', 'firecrawl', 'ocr']),
  extractedSettings: z.record(z.record(z.any())),
  metadata: z.object({
    url: z.string().url(),
    userAgent: z.string().optional(),
    startTime: z.string(),
    endTime: z.string(),
    duration: z.number().positive(),
    elementsFound: z.number().nonnegative(),
    elementsExpected: z.number().positive(),
    confidenceScore: z.number().min(0).max(1),
  }),
});

/**
 * POST /api/scraping/submit
 * Process and store scraped privacy data with template optimization
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = privacyDataSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validation.error.errors,
        },
      }, { status: 400 });
    }

    const data = validation.data;

    // Verify user exists
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      }, { status: 404 });
    }

    // Create scraping context for processing
    const scrapingContext = {
      userId: data.userId,
      platformId: data.platformId,
      method: data.method,
      userAgent: data.metadata.userAgent,
    };

    // Create extracted privacy data object
    const extractedPrivacyData = {
      platformId: data.platformId,
      extractedSettings: data.extractedSettings,
      raw: {
        metadata: {
          url: data.metadata.url,
          userAgent: data.metadata.userAgent,
          scanId: data.scanId,
        },
      },
    };

    // Create successful scraping result
    const scrapingResult = {
      success: true,
      data: extractedPrivacyData,
      metadata: {
        scanId: data.scanId,
        startTime: new Date(data.metadata.startTime),
        endTime: new Date(data.metadata.endTime),
        duration: data.metadata.duration,
        method: data.method,
        userAgent: data.metadata.userAgent,
        completionRate: data.metadata.elementsExpected > 0 
          ? data.metadata.elementsFound / data.metadata.elementsExpected 
          : 1,
        confidenceScore: data.metadata.confidenceScore,
        elementsFound: data.metadata.elementsFound,
        elementsExpected: data.metadata.elementsExpected,
      },
    };

    // Process through scraping engine for template optimization
    await processScrapingResultWithTemplates(scrapingContext, scrapingResult);

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        scanId: data.scanId,
        message: 'Privacy data processed successfully',
        stats: {
          settingsExtracted: countExtractedSettings(data.extractedSettings),
          confidenceScore: data.metadata.confidenceScore,
          compressionApplied: true, // Template system provides compression
        },
      },
    });

  } catch (error) {
    console.error('Error processing privacy data:', error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Failed to process privacy data',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    }, { status: 500 });
  }
}

/**
 * Process scraping result with template optimization
 */
async function processScrapingResultWithTemplates(context: any, result: any) {
  try {
    const template = await ensureTemplateExists(context.platformId, result.data);
    const processedData = await processDataWithTemplate(template, result.data);
    const previousSnapshot = await getPreviousSnapshot(context.userId, context.platformId);
    const changes = await detectChangesFromPrevious(previousSnapshot, processedData.compressedSettings);
    const riskAssessment = await calculatePrivacyRisk(template, processedData.compressedSettings);
    
    await persistOptimizedSnapshot(context, result, template, processedData, changes, riskAssessment);

  } catch (error) {
    console.error('Error in template processing:', error);
    
    // Fallback: store raw data without template optimization
    await storeRawSnapshot(context, result);
  }
}

/**
 * Ensure template exists for platform, create if needed
 */
async function ensureTemplateExists(platformId: string, data: any) {
  const templateSystem = (scrapingEngine as any).templateSystem;
  const aiService = new AIAnalysisService(db);
  
  let template = await templateSystem.findMatchingTemplate(platformId, data);

  if (!template) {
    template = await templateSystem.createNewTemplate(platformId, data);
    console.log(`Created new template for platform ${platformId}:`, template.id);
  }

  // Ensure AI analysis (once per template)
  try {
    template = await aiService.analyzeTemplateIfMissing(template);
  } catch (err) {
    console.error('AI analysis generation failed (non-fatal):', err);
  }

  return template;
}

/**
 * Process extracted data using template compression
 */
async function processDataWithTemplate(template: any, data: any) {
  const templateSystem = (scrapingEngine as any).templateSystem;
  
  const compressedSettings = templateSystem.compressUserSettings(
    template,
    data.extractedSettings
  );

  const compressionStats = templateSystem.calculateCompressionStats(
    template,
    data.extractedSettings
  );

  console.log('Compression stats:', {
    originalSize: compressionStats.originalSize,
    compressedSize: compressionStats.compressedSize,
    compressionRatio: compressionStats.compressionRatio,
    savings: compressionStats.savings,
  });

  return {
    compressedSettings,
    compressionStats
  };
}

/**
 * Detect changes from previous snapshot
 */
async function detectChangesFromPrevious(
  previousSnapshot: any,
  currentSettings: Record<string, Record<string, any>>
) {
  if (!previousSnapshot) {
    return {};
  }

  return await detectChanges(previousSnapshot.userSettings, currentSettings);
}

/**
 * Persist optimized snapshot to database
 */
async function persistOptimizedSnapshot(
  context: any,
  result: any,
  template: any,
  processedData: any,
  changes: any,
  riskAssessment: any
) {
  await db.insert(privacySnapshots).values({
    userId: context.userId,
    platformId: context.platformId,
    templateId: template.id,
    userSettings: processedData.compressedSettings,
    scanId: result.metadata.scanId,
    scanMethod: context.method,
    changesSincePrevious: changes,
    hasChanges: Object.keys(changes).length > 0,
    scanStatus: 'completed',
    scanDurationMs: result.metadata.duration,
    completionRate: result.metadata.completionRate,
    confidenceScore: result.metadata.confidenceScore,
    riskScore: riskAssessment.riskScore,
    riskFactors: riskAssessment.riskFactors,
    recommendations: riskAssessment.recommendations,
    scannedAt: result.metadata.endTime,
  });
}

/**
 * Get user's previous privacy snapshot
 */
async function getPreviousSnapshot(userId: string, platformId: string) {
  const [previous] = await db
    .select()
    .from(privacySnapshots)
    .where(and(
      eq(privacySnapshots.userId, userId),
      eq(privacySnapshots.platformId, platformId)
    ))
    .orderBy(desc(privacySnapshots.scannedAt))
    .limit(1);

  return previous;
}

/**
 * Detect changes between snapshots
 */
async function detectChanges(
  previousSettings: Record<string, Record<string, any>>,
  currentSettings: Record<string, Record<string, any>>
): Promise<Record<string, Record<string, any>>> {
  const changes: Record<string, Record<string, any>> = {};

  for (const [categoryId, categorySettings] of Object.entries(currentSettings)) {
    const previousCategory = previousSettings[categoryId] || {};

    for (const [settingId, currentValue] of Object.entries(categorySettings)) {
      const previousValue = previousCategory[settingId];

      if (!isEqual(previousValue, currentValue)) {
        if (!changes[categoryId]) {
          changes[categoryId] = {};
        }

        changes[categoryId][settingId] = {
          oldValue: previousValue,
          newValue: currentValue,
          changeType: 'unknown', // Could be enhanced with ML-based change detection
          detectedAt: new Date().toISOString(),
        };
      }
    }
  }

  return changes;
}

/**
 * Calculate privacy risk score and generate recommendations
 */
async function calculatePrivacyRisk(template: any, userSettings: any) {
  let riskScore = 0;
  const riskFactors: string[] = [];
  const recommendations: { high: string[]; medium: string[]; low: string[] } = { high: [], medium: [], low: [] };

  try {
    const structure = template.settingsStructure;
    const decompressedSettings = (scrapingEngine as any).templateSystem
      .decompressUserSettings(template, userSettings);

    for (const [categoryId, category] of Object.entries(structure.categories)) {
      const userCategory = decompressedSettings[categoryId] || {};

      for (const [settingId, setting] of Object.entries((category as any).settings)) {
        const userValue = userCategory[settingId];
        const settingRisk = (setting as any).riskLevel;
        const settingName = (setting as any).name;

        // Calculate risk contribution
        let settingRiskScore = 0;
        if (settingRisk === 'high') settingRiskScore = 30;
        else if (settingRisk === 'medium') settingRiskScore = 15;
        else settingRiskScore = 5;

        // Adjust based on user setting (assuming true/enabled = higher risk)
        if (typeof userValue === 'boolean' && userValue) {
          riskScore += settingRiskScore;
          
          if (settingRisk === 'high') {
            riskFactors.push(`${settingName} is enabled`);
            recommendations.high.push(`Consider disabling "${settingName}" for better privacy`);
          } else if (settingRisk === 'medium') {
            riskFactors.push(`${settingName} may affect privacy`);
            recommendations.medium.push(`Review "${settingName}" setting based on your privacy preferences`);
          }
        }

        // Add setting-specific recommendations if available
        if ((setting as any).recommendation) {
          recommendations.low.push((setting as any).recommendation);
        }
      }
    }

    // Normalize risk score (0-100)
    riskScore = Math.min(Math.round(riskScore), 100);

  } catch (error) {
    console.error('Error calculating privacy risk:', error);
    riskScore = 50; // Default moderate risk if calculation fails
  }

  return { riskScore, riskFactors, recommendations };
}


/**
 * Store raw snapshot without template optimization (fallback)
 */
async function storeRawSnapshot(context: any, result: any) {
  console.log('Storing raw snapshot as fallback');
  // Ensure a template exists to satisfy FK
  const template = await ensureTemplateExists(context.platformId, result.data);

  await db.insert(privacySnapshots).values({
    userId: context.userId,
    platformId: context.platformId,
    templateId: template.id,
    userSettings: result.data.extractedSettings,
    scanId: result.metadata.scanId,
    scanMethod: context.method,
    scanStatus: 'completed',
    scanDurationMs: result.metadata.duration,
    completionRate: result.metadata.completionRate,
    confidenceScore: result.metadata.confidenceScore,
    scannedAt: result.metadata.endTime,
  });
}

/**
 * Count extracted settings
 */
function countExtractedSettings(settings: Record<string, Record<string, any>>): number {
  let count = 0;
  for (const categorySettings of Object.values(settings)) {
    count += Object.keys(categorySettings).length;
  }
  return count;
}

/**
 * GET /api/scraping/submit/:scanId
 * Get scan result by ID (for polling/status checking)
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const scanId = url.searchParams.get('scanId');

    if (!scanId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Scan ID is required',
        },
      }, { status: 400 });
    }

    // Find snapshot by scan ID
    const [snapshot] = await db
      .select({
        id: privacySnapshots.id,
        scanId: privacySnapshots.scanId,
        scanStatus: privacySnapshots.scanStatus,
        scanError: privacySnapshots.scanError,
        completionRate: privacySnapshots.completionRate,
        confidenceScore: privacySnapshots.confidenceScore,
        scannedAt: privacySnapshots.scannedAt,
        hasChanges: privacySnapshots.hasChanges,
        riskScore: privacySnapshots.riskScore,
      })
      .from(privacySnapshots)
      .where(eq(privacySnapshots.scanId, scanId))
      .limit(1);

    if (!snapshot) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'SCAN_NOT_FOUND',
          message: 'Scan not found',
        },
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        scanId: snapshot.scanId,
        status: snapshot.scanStatus,
        error: snapshot.scanError,
        completionRate: snapshot.completionRate,
        confidenceScore: snapshot.confidenceScore,
        scannedAt: snapshot.scannedAt?.toISOString(),
        hasChanges: snapshot.hasChanges,
        riskScore: snapshot.riskScore,
      },
    });

  } catch (error) {
    console.error('Error fetching scan status:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch scan status',
      },
    }, { status: 500 });
  }
}
