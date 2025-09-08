/**
 * Platform Configurations API Endpoint
 * Serves platform scraping configurations to browser extension
 * GET /api/scraping/platforms - Returns all active platform configurations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@privyloop/core/database';
import { PlatformRegistry } from '@privyloop/core/scraping/platform-registry';
import { eq, and } from 'drizzle-orm';
import { platforms } from '@privyloop/core/database/schema';
import { validateAdminAccess } from '../../../../lib/auth-helpers';

// Initialize platform registry
const db = getDb();
const platformRegistry = new PlatformRegistry(db);

/**
 * GET /api/scraping/platforms
 * Returns all active platform configurations for the browser extension
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const platformSlug = searchParams.get('platform');
    const activeOnly = searchParams.get('active') !== 'false';

    // Build query conditions
    const conditions = [];
    if (activeOnly) {
      conditions.push(eq(platforms.isActive, true));
      conditions.push(eq(platforms.isSupported, true));
    }
    
    if (platformSlug) {
      conditions.push(eq(platforms.slug, platformSlug));
    }

    // Query database
    const platformConfigs = await db
      .select({
        id: platforms.id,
        name: platforms.name,
        slug: platforms.slug,
        domain: platforms.domain,
        description: platforms.description,
        logoUrl: platforms.logoUrl,
        websiteUrl: platforms.websiteUrl,
        privacyPageUrls: platforms.privacyPageUrls,
        scrapingConfig: platforms.scrapingConfig,
        manifestPermissions: platforms.manifestPermissions,
        requiresAuth: platforms.requiresAuth,
        configVersion: platforms.configVersion,
        updatedAt: platforms.updatedAt,
      })
      .from(platforms)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(platforms.name);

    // Transform for extension use
    const extensionConfigs = platformConfigs.map(platform => ({
      id: platform.id,
      name: platform.name,
      slug: platform.slug,
      domain: platform.domain,
      description: platform.description,
      logoUrl: platform.logoUrl,
      websiteUrl: platform.websiteUrl,
      privacyPageUrls: platform.privacyPageUrls,
      scrapingConfig: platform.scrapingConfig,
      manifestPermissions: platform.manifestPermissions,
      requiresAuth: platform.requiresAuth,
      configVersion: platform.configVersion,
      lastUpdated: platform.updatedAt.toISOString(),
      
      // Add extension-specific metadata
      extensionConfig: {
        permissions: platform.manifestPermissions,
        rateLimit: platform.scrapingConfig?.rateLimit || {
          requestsPerMinute: 10,
          cooldownMinutes: 1,
        },
        version: platform.configVersion,
      },
    }));

    return NextResponse.json({
      success: true,
      data: extensionConfigs,
      meta: {
        count: extensionConfigs.length,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error fetching platform configurations:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'PLATFORM_CONFIG_ERROR',
        message: 'Failed to fetch platform configurations',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    }, { status: 500 });
  }
}

/**
 * POST /api/scraping/platforms
 * Register a new platform configuration (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: authResult.error 
      }, { status: authResult.error!.status });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'slug', 'domain', 'privacyPageUrls', 'scrapingConfig'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Missing required field: ${field}`,
          },
        }, { status: 400 });
      }
    }

    // Sanitize inputs with URL validation
    let sanitizedData;
    try {
      sanitizedData = {
        name: body.name.trim().substring(0, 100),
        slug: body.slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        domain: new URL(body.domain).hostname, // Validates URL format
        description: (body.description || '').trim().substring(0, 500),
        logoUrl: body.logoUrl ? new URL(body.logoUrl).toString() : undefined,
        websiteUrl: body.websiteUrl ? new URL(body.websiteUrl).toString() : undefined,
        privacyPageUrls: Array.isArray(body.privacyPageUrls) 
          ? body.privacyPageUrls.map((url: string) => new URL(url).toString()).slice(0, 10)
          : [],
        scrapingConfig: body.scrapingConfig, // Will be validated by platform registry
        manifestPermissions: Array.isArray(body.manifestPermissions) 
          ? body.manifestPermissions.filter((p: string) => typeof p === 'string').slice(0, 20)
          : [],
        isActive: Boolean(body.isActive),
        isSupported: Boolean(body.isSupported),
        requiresAuth: Boolean(body.requiresAuth),
        configVersion: (body.configVersion || '1.0.0').trim().substring(0, 20),
      };
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid URL format provided',
        },
      }, { status: 400 });
    }

    // Register platform using platform registry
    const platformId = await platformRegistry.registerPlatform({
      name: sanitizedData.name,
      slug: sanitizedData.slug,
      domain: sanitizedData.domain,
      description: sanitizedData.description,
      logoUrl: sanitizedData.logoUrl ?? null,
      websiteUrl: sanitizedData.websiteUrl ?? null,
      privacyPageUrls: sanitizedData.privacyPageUrls,
      scrapingConfig: sanitizedData.scrapingConfig,
      manifestPermissions: sanitizedData.manifestPermissions,
      isActive: sanitizedData.isActive,
      isSupported: sanitizedData.isSupported,
      requiresAuth: sanitizedData.requiresAuth,
      configVersion: sanitizedData.configVersion,
      lastUpdatedBy: authResult.user!.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: platformId,
        message: 'Platform registered successfully',
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error registering platform:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'PLATFORM_REGISTRATION_ERROR',
        message: 'Failed to register platform',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    }, { status: 500 });
  }
}

/**
 * PUT /api/scraping/platforms/:id
 * Update platform configuration (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: authResult.error 
      }, { status: authResult.error!.status });
    }
    
    const url = new URL(request.url);
    const platformId = url.searchParams.get('id');
    
    if (!platformId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Platform ID is required',
        },
      }, { status: 400 });
    }

    const body = await request.json();
    
    // Update platform using platform registry
    const updated = await platformRegistry.updatePlatform(platformId, {
      ...body,
      lastUpdatedBy: authResult.user!.id,
    });

    if (!updated) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PLATFORM_NOT_FOUND',
          message: 'Platform not found or update failed',
        },
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: platformId,
        message: 'Platform updated successfully',
      },
    });

  } catch (error) {
    console.error('Error updating platform:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'PLATFORM_UPDATE_ERROR',
        message: 'Failed to update platform',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    }, { status: 500 });
  }
}

/**
 * DELETE /api/scraping/platforms/:id
 * Deactivate platform configuration (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: authResult.error 
      }, { status: authResult.error!.status });
    }
    
    const url = new URL(request.url);
    const platformId = url.searchParams.get('id');
    
    if (!platformId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Platform ID is required',
        },
      }, { status: 400 });
    }

    // Deactivate platform using platform registry
    const deactivated = await platformRegistry.deactivatePlatform(platformId);

    if (!deactivated) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PLATFORM_NOT_FOUND',
          message: 'Platform not found or deactivation failed',
        },
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: platformId,
        message: 'Platform deactivated successfully',
      },
    });

  } catch (error) {
    console.error('Error deactivating platform:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'PLATFORM_DEACTIVATION_ERROR',
        message: 'Failed to deactivate platform',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    }, { status: 500 });
  }
}

/**
 * Initialize default platforms if none exist
 */
async function initializeDefaultPlatforms() {
  try {
    const existingPlatforms = await db.select({ id: platforms.id }).from(platforms).limit(1);
    
    if (existingPlatforms.length === 0) {
      console.log('No platforms found, initializing default configurations...');
      await platformRegistry.initializeDefaultPlatforms();
      console.log('Default platforms initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing default platforms:', error);
  }
}

// (Initialization can be triggered elsewhere; do not export from route modules.)
