/**
 * Initial database schema migration
 * Creates all core tables for PrivyLoop with template-based optimization
 */

import { sql, type Database } from '../connection';
import type { Migration } from './index';

export const migration001: Migration = {
  id: '001',
  name: 'initial-schema',
  createdAt: new Date('2024-09-04'),
  
  up: async (db: Database) => {
    // Enable UUID extension
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL UNIQUE,
        email_verified BOOLEAN NOT NULL DEFAULT false,
        password_hash VARCHAR(255),
        providers JSONB NOT NULL DEFAULT '{}',
        subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free',
        subscription_status VARCHAR(20) DEFAULT 'active',
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        privacy_cards_used INTEGER NOT NULL DEFAULT 0,
        last_scan_at TIMESTAMP,
        preferences JSONB NOT NULL DEFAULT '{"notifications":{"email":true,"changeAlerts":true,"weeklyDigest":false},"scanning":{"frequency":"weekly","autoScan":true},"privacy":{"dataRetention":"1y","shareAnalytics":false}}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMP,
        gdpr_consent_at TIMESTAMP,
        data_export_requested_at TIMESTAMP,
        deletion_requested_at TIMESTAMP
      );
    `);

    // Create platforms table
    await db.execute(sql`
      CREATE TABLE platforms (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(50) NOT NULL UNIQUE,
        domain VARCHAR(255) NOT NULL,
        description TEXT,
        logo_url VARCHAR(500),
        website_url VARCHAR(500),
        privacy_page_urls JSONB NOT NULL,
        scraping_config JSONB NOT NULL,
        manifest_permissions JSONB NOT NULL DEFAULT '[]',
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_supported BOOLEAN NOT NULL DEFAULT true,
        requires_auth BOOLEAN NOT NULL DEFAULT true,
        config_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
        last_updated_by VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create privacy_templates table (template-based optimization)
    await db.execute(sql`
      CREATE TABLE privacy_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
        version VARCHAR(50) NOT NULL,
        template_hash VARCHAR(64) NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        settings_structure JSONB NOT NULL,
        ai_analysis JSONB,
        usage_count INTEGER NOT NULL DEFAULT 0,
        active_user_count INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        previous_version_id UUID REFERENCES privacy_templates(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR(100)
      );
    `);

    // Create user_platform_connections table
    await db.execute(sql`
      CREATE TABLE user_platform_connections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
        connection_name VARCHAR(100),
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_authorized BOOLEAN NOT NULL DEFAULT false,
        scan_enabled BOOLEAN NOT NULL DEFAULT true,
        scan_frequency VARCHAR(20) NOT NULL DEFAULT 'weekly',
        last_scan_id VARCHAR(100),
        last_scan_at TIMESTAMP,
        last_scan_status VARCHAR(20) NOT NULL DEFAULT 'never',
        last_scan_error TEXT,
        next_scheduled_scan TIMESTAMP,
        consecutive_failures INTEGER NOT NULL DEFAULT 0,
        max_consecutive_failures INTEGER NOT NULL DEFAULT 5,
        platform_settings JSONB NOT NULL DEFAULT '{}',
        preferences JSONB NOT NULL DEFAULT '{"notifications":{"changeAlerts":true,"scanResults":false,"failures":true},"scanning":{"includeInBulkScans":true,"priority":"medium"},"privacy":{"shareWithPlatform":false,"includeInAnalytics":false}}',
        connected_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_modified_at TIMESTAMP NOT NULL DEFAULT NOW(),
        disconnected_at TIMESTAMP,
        disconnection_reason VARCHAR(100)
      );
    `);

    // Create privacy_snapshots table (user-specific diffs)
    await db.execute(sql`
      CREATE TABLE privacy_snapshots (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
        template_id UUID NOT NULL REFERENCES privacy_templates(id) ON DELETE CASCADE,
        user_settings JSONB NOT NULL,
        scan_id VARCHAR(100),
        scan_method VARCHAR(20) NOT NULL DEFAULT 'extension',
        changes_since_previous JSONB NOT NULL DEFAULT '{}',
        has_changes BOOLEAN NOT NULL DEFAULT false,
        is_user_initiated BOOLEAN NOT NULL DEFAULT false,
        scan_status VARCHAR(20) NOT NULL DEFAULT 'completed',
        scan_error TEXT,
        scan_duration_ms INTEGER,
        completion_rate REAL DEFAULT 1.0,
        confidence_score REAL DEFAULT 1.0,
        risk_score INTEGER,
        risk_factors JSONB NOT NULL DEFAULT '[]',
        recommendations JSONB NOT NULL DEFAULT '{"high":[],"medium":[],"low":[]}',
        scanned_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        retention_policy VARCHAR(20) DEFAULT '1y',
        expires_at TIMESTAMP
      );
    `);

    // Create Better Auth tables
    await db.execute(sql`
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        token TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE accounts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at TIMESTAMP,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(provider, provider_account_id)
      );
    `);

    await db.execute(sql`
      CREATE TABLE verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (identifier, token)
      );
    `);

    // Create audit_logs table
    await db.execute(sql`
      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event_type VARCHAR(50) NOT NULL,
        event_category VARCHAR(30) NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        platform_id UUID REFERENCES platforms(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        resource_id VARCHAR(100),
        event_data JSONB NOT NULL DEFAULT '{}',
        success BOOLEAN NOT NULL DEFAULT true,
        error_message TEXT,
        status_code INTEGER,
        severity VARCHAR(20) NOT NULL DEFAULT 'info',
        sensitive_data BOOLEAN NOT NULL DEFAULT false,
        duration_ms INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        retention_policy VARCHAR(20) DEFAULT '1y',
        expires_at TIMESTAMP
      );
    `);

    // Create indexes for performance
    // Privacy templates indexes
    await db.execute(sql`
      CREATE INDEX privacy_templates_platform_version_idx ON privacy_templates(platform_id, version);
      CREATE INDEX privacy_templates_active_idx ON privacy_templates(platform_id, is_active);
      CREATE INDEX privacy_templates_hash_idx ON privacy_templates(template_hash);
    `);

    // User platform connections indexes
    await db.execute(sql`
      CREATE INDEX user_connections_user_platform_idx ON user_platform_connections(user_id, platform_id);
      CREATE INDEX user_connections_active_idx ON user_platform_connections(user_id, is_active);
      CREATE INDEX user_connections_scan_schedule_idx ON user_platform_connections(next_scheduled_scan);
      CREATE INDEX user_connections_scan_enabled_idx ON user_platform_connections(scan_enabled, next_scheduled_scan);
    `);

    // Privacy snapshots indexes
    await db.execute(sql`
      CREATE INDEX privacy_snapshots_user_platform_idx ON privacy_snapshots(user_id, platform_id);
      CREATE INDEX privacy_snapshots_user_scanned_idx ON privacy_snapshots(user_id, scanned_at);
      CREATE INDEX privacy_snapshots_changes_idx ON privacy_snapshots(has_changes, scanned_at);
      CREATE INDEX privacy_snapshots_template_idx ON privacy_snapshots(template_id);
      CREATE INDEX privacy_snapshots_retention_idx ON privacy_snapshots(expires_at);
    `);

    // Better Auth indexes
    await db.execute(sql`
      CREATE INDEX sessions_user_id_idx ON sessions(user_id);
      CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);
      CREATE INDEX sessions_token_idx ON sessions(token);
      CREATE INDEX accounts_user_id_idx ON accounts(user_id);
      CREATE INDEX accounts_provider_idx ON accounts(provider, provider_account_id);
      CREATE INDEX verification_tokens_expires_at_idx ON verification_tokens(expires_at);
    `);

    // Audit logs indexes
    await db.execute(sql`
      CREATE INDEX audit_logs_event_type_idx ON audit_logs(event_type, created_at);
      CREATE INDEX audit_logs_user_idx ON audit_logs(user_id, created_at);
      CREATE INDEX audit_logs_platform_idx ON audit_logs(platform_id, created_at);
      CREATE INDEX audit_logs_severity_idx ON audit_logs(severity, created_at);
      CREATE INDEX audit_logs_category_idx ON audit_logs(event_category, created_at);
      CREATE INDEX audit_logs_retention_idx ON audit_logs(expires_at);
    `);

    console.log('✅ Initial schema created with template-based optimization');
  },

  down: async (db: Database) => {
    // Drop tables in reverse order (due to foreign key constraints)
    await db.execute(sql`DROP TABLE IF EXISTS audit_logs CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS verification_tokens CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS accounts CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS sessions CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS privacy_snapshots CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS user_platform_connections CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS privacy_templates CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS platforms CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE;`);
    
    console.log('✅ Initial schema dropped');
  },
};