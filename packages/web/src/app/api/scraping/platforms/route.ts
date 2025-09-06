/**
 * Platform Configurations API Endpoint
 * Serves platform scraping configurations to browser extension
 * GET /api/scraping/platforms - Returns all active platform configurations
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@privyloop/core/database/config';
import { PlatformRegistry } from '@privyloop/core/scraping/platform-registry';
import { eq, and } from 'drizzle-orm';
import { platforms } from '@privyloop/core/database/schema';

// Initialize platform registry
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
        rateLimit: platform.scrapingConfig.rateLimit || {
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
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
    // TODO: Add authentication and admin role check
    // const user = await getCurrentUser(request);
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

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

    // Register platform using platform registry
    const platformId = await platformRegistry.registerPlatform({
      name: body.name,
      slug: body.slug,
      domain: body.domain,
      description: body.description || '',
      logoUrl: body.logoUrl,
      websiteUrl: body.websiteUrl,
      privacyPageUrls: body.privacyPageUrls,
      scrapingConfig: body.scrapingConfig,
      manifestPermissions: body.manifestPermissions || [],
      isActive: body.isActive ?? true,
      isSupported: body.isSupported ?? true,
      requiresAuth: body.requiresAuth ?? true,
      configVersion: body.configVersion || '1.0.0',
      lastUpdatedBy: 'api', // TODO: Use actual user ID
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
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
    // TODO: Add authentication and admin role check
    
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
      lastUpdatedBy: 'api', // TODO: Use actual user ID
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
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
    // TODO: Add authentication and admin role check
    
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
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

// Initialize on module load (for development)
if (process.env.NODE_ENV === 'development') {
  initializeDefaultPlatforms();
}