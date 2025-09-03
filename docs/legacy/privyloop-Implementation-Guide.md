# 🚀 loopwho - Complete Implementation Guide

## Overview
This guide walks you through building loopwho from MkSaaS foundation to production launch. Each step includes specific commands, code examples, and verification steps.

**Timeline**: 12 weeks | **Budget**: $67K | **Result**: Production-ready privacy dashboard

---

## 📋 **Phase 0: Project Setup & Foundation (Week 1)**

### **Step 1: Get MkSaaS Foundation**
```bash
# 1. Download MkSaaS source code (from your lifetime access)
# - Log into your MkSaaS account
# - Download latest source ZIP file
# - Save as: mksaas-latest.zip

# 2. Create project structure
mkdir loopwho
cd loopwho

# 3. Extract MkSaaS foundation
unzip ../mksaas-latest.zip --strip-components=1

# 4. Remove original git history
rm -rf .git
rm -rf .github

# 5. Initialize fresh repository
git init
git add .
git commit -m "feat: initial commit based on MkSaaS boilerplate

- Next.js 15 foundation
- Better Auth integration
- Tailwind CSS setup
- Database configuration
- Basic component library

Licensed under Business Source License for loopwho"
```

### **Step 2: Set Up Development Environment**
```bash
# 1. Install dependencies
npm install
# or if using pnpm (recommended)
pnpm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Set up basic environment variables
# Edit .env.local with these minimal settings:
```

Create `.env.local`:
```bash
# Core Application
NEXT_PUBLIC_URL="http://localhost:3000"
DATABASE_URL="postgresql://postgres:password@localhost:5432/privacy_dashboard"

# Authentication
BETTER_AUTH_SECRET="your-32-char-random-string"
BETTER_AUTH_URL="http://localhost:3000"

# AI Services
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"

# Web Scraping
FIRECRAWL_API_KEY="your-firecrawl-api-key"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="Privacy Dashboard <noreply@yourdomain.com>"

# Development settings
NODE_ENV="development"
```

### **Step 3: Initial Cleanup & Customization**
```bash
# 1. Remove unnecessary MkSaaS features
rm -rf src/app/[locale]/(marketing)/blog
rm -rf src/app/[locale]/(marketing)/docs
rm -rf content/blog
rm -rf content/docs

# 2. Update package.json
# Edit package.json name and description:
```

Update `package.json`:
```json
{
  "name": "loopwho",
  "description": "Corporate privacy monitoring dashboard",
  "version": "0.1.0",
  "private": true,
  "license": "SEE LICENSE IN LICENSE.md"
}
```

### **Step 4: Create Initial Project Structure**
```bash
# Create loopwho-specific directories
mkdir -p src/components/corporate
mkdir -p src/components/privacy
mkdir -p src/components/extension
mkdir -p src/lib/privacy
mkdir -p src/lib/scraping
mkdir -p src/actions/corporate
mkdir -p extension/background
mkdir -p extension/content-scripts
mkdir -p extension/popup

# Test development server
pnpm dev
# Visit http://localhost:3000 - should show MkSaaS homepage
```

### **Step 5: Set Up Database**

#### **Core (Opensource) - Self-hosted PostgreSQL**
```bash
# Option 1: Docker Compose (recommended for development)
docker-compose up -d postgres

# Option 2: Local PostgreSQL installation
# Install PostgreSQL 15+ locally
DATABASE_URL="postgresql://postgres:password@localhost:5432/privacy_dashboard"

# Set up database schema
npx drizzle-kit generate
npx drizzle-kit migrate
```

#### **Enterprise - Supabase PostgreSQL + TimescaleDB**
```bash
# 1. Create Supabase project
# - Go to https://supabase.com
# - Create new project: "loopwho-enterprise"
# - Enable TimescaleDB extension in SQL Editor:
#   CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

# 2. Update .env.local with Supabase URL
DATABASE_URL="postgresql://postgres:[password]@[project].supabase.co:5432/postgres"
SUPABASE_URL="https://[project].supabase.co"
SUPABASE_ANON_KEY="[anon-key]"

# 3. Set up enterprise schema with TimescaleDB
npx drizzle-kit generate:enterprise
npx drizzle-kit migrate:enterprise
```

### **Step 6: Create Business Source License**
Create `LICENSE.md`:
```markdown
# Business Source License 1.1

**Licensed Work**: loopwho Privacy Dashboard
**Licensor**: [Your Name/Company]
**Additional Use Grant**: Personal, educational, and non-commercial use only
**Change Date**: January 1, 2029
**Change License**: Apache License 2.0

## Terms

The Licensor hereby grants you the right to copy, modify, create derivative works, redistribute, and make non-production use of the Licensed Work for personal, educational, and non-commercial purposes only.

Commercial use requires a separate commercial license from the Licensor.

For commercial licensing, contact: [your-email@example.com]
```

---

## 🗄️ **Phase 1: Database & Core Backend (Week 2)**

### **Step 7: Design Privacy Database Schema**
Create `src/db/schema/privacy.ts`:
```typescript
import { pgTable, uuid, varchar, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { users } from './auth'; // From MkSaaS

// Corporate privacy connections
export const corporateConnections = pgTable('corporate_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(), // 'google', 'microsoft', 'facebook'
  status: varchar('status', { length: 20 }).default('connected').notNull(),
  lastScanAt: timestamp('last_scan_at'),
  privacyData: jsonb('privacy_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Privacy scan results
export const scanResults = pgTable('scan_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  connectionId: uuid('connection_id').references(() => corporateConnections.id, { onDelete: 'cascade' }).notNull(),
  scanMethod: varchar('scan_method', { length: 20 }).notNull(), // 'dom', 'firecrawl', 'ocr'
  privacySettings: jsonb('privacy_settings').notNull(),
  aiSummary: varchar('ai_summary', { length: 2000 }),
  scanDuration: varchar('scan_duration'), // in milliseconds
  success: boolean('success').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User subscription info (simplified)
export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tier: varchar('tier', { length: 20 }).default('free').notNull(), // 'free', 'pro'
  stripeCustomerId: varchar('stripe_customer_id'),
  stripeSubscriptionId: varchar('stripe_subscription_id'),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### **Step 8: Generate and Run Migrations**
```bash
# Generate migration
npx drizzle-kit generate

# Apply migration
npx drizzle-kit migrate

# Verify tables created in Supabase dashboard
```

### **Step 9: Create Core Server Actions**
Create `src/actions/corporate/connect-corporate.ts`:
```typescript
'use server';

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { db } from "@/db";
import { corporateConnections } from "@/db/schema/privacy";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const action = createSafeActionClient();

const connectCorporateSchema = z.object({
  platform: z.enum(['google', 'microsoft', 'facebook']),
});

export const connectCorporate = action
  .schema(connectCorporateSchema)
  .action(async ({ parsedInput: { platform } }) => {
    const session = await auth();

    if (!session?.user?.id) {
      redirect('/auth/signin');
    }

    // Check if user already has this platform connected
    const existing = await db.query.corporateConnections.findFirst({
      where: (connections, { eq, and }) =>
        and(
          eq(connections.userId, session.user.id),
          eq(connections.platform, platform)
        ),
    });

    if (existing) {
      return { error: `${platform} is already connected` };
    }

    // Check free tier limits (2 platforms max)
    const userConnections = await db.query.corporateConnections.findMany({
      where: (connections, { eq }) => eq(connections.userId, session.user.id),
    });

    // TODO: Check user subscription tier
    if (userConnections.length >= 2) {
      return { error: 'Free tier limited to 2 corporate connections. Upgrade to Pro for unlimited.' };
    }

    // Create connection
    const [connection] = await db
      .insert(corporateConnections)
      .values({
        userId: session.user.id,
        platform,
        status: 'pending',
      })
      .returning();

    return { success: true, connectionId: connection.id };
  });
```

Create `src/actions/corporate/get-user-connections.ts`:
```typescript
'use server';

import { db } from "@/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getUserConnections() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const connections = await db.query.corporateConnections.findMany({
    where: (connections, { eq }) => eq(connections.userId, session.user.id),
    orderBy: (connections, { desc }) => desc(connections.createdAt),
  });

  return connections;
}
```

---

## 🎨 **Phase 2: Corporate Cards UI (Week 3)**

### **Step 10: Create Corporate Card Components**
Create `src/components/corporate/corporate-card.tsx`:
```tsx
'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, CheckCircle, Scan } from "lucide-react";

interface CorporateCardProps {
  platform: 'google' | 'microsoft' | 'facebook';
  status: 'connected' | 'pending' | 'error';
  lastScanAt?: Date;
  privacyScore?: number;
  onScanNow: () => void;
  onViewDetails: () => void;
}

const platformConfig = {
  google: {
    name: 'Google',
    logo: '🔍',
    color: 'bg-blue-50 border-blue-200',
  },
  microsoft: {
    name: 'Microsoft',
    logo: '🪟',
    color: 'bg-cyan-50 border-cyan-200',
  },
  facebook: {
    name: 'Facebook',
    logo: '📘',
    color: 'bg-blue-50 border-blue-200',
  },
};

const statusConfig = {
  connected: {
    badge: <Badge variant="default" className="bg-green-100 text-green-800">✅ Connected</Badge>,
    icon: <CheckCircle className="h-4 w-4 text-green-600" />,
  },
  pending: {
    badge: <Badge variant="secondary">⏳ Pending</Badge>,
    icon: <Clock className="h-4 w-4 text-yellow-600" />,
  },
  error: {
    badge: <Badge variant="destructive">❌ Error</Badge>,
    icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
  },
};

export function CorporateCard({
  platform,
  status,
  lastScanAt,
  privacyScore,
  onScanNow,
  onViewDetails,
}: CorporateCardProps) {
  const config = platformConfig[platform];
  const statusInfo = statusConfig[status];

  return (
    <Card className={`${config.color} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.logo}</span>
            <div>
              <h3 className="font-semibold">{config.name}</h3>
              {statusInfo.badge}
            </div>
          </div>
          {statusInfo.icon}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Privacy Score */}
          {privacyScore && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Privacy Score</span>
              <span className="font-medium">{privacyScore}/100</span>
            </div>
          )}

          {/* Last Scan */}
          {lastScanAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Scan</span>
              <span className="text-sm">{formatRelativeTime(lastScanAt)}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onScanNow}
              className="flex-1"
            >
              <Scan className="h-3 w-3 mr-1" />
              Scan Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewDetails}
              className="flex-1"
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else {
    return 'Just now';
  }
}
```

Create `src/components/corporate/add-corporate-card.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddCorporateModal } from './add-corporate-modal';

interface AddCorporateCardProps {
  onConnect: (platform: string) => void;
  disabled?: boolean;
}

export function AddCorporateCard({ onConnect, disabled }: AddCorporateCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <Button
            variant="ghost"
            className="h-full w-full flex flex-col gap-3"
            onClick={() => setShowModal(true)}
            disabled={disabled}
          >
            <Plus className="h-8 w-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              Add Corporate
            </span>
          </Button>
        </CardContent>
      </Card>

      <AddCorporateModal
        open={showModal}
        onOpenChange={setShowModal}
        onConnect={(platform) => {
          onConnect(platform);
          setShowModal(false);
        }}
      />
    </>
  );
}
```

### **Step 11: Create Dashboard Page**
Create `src/app/[locale]/(protected)/dashboard/page.tsx`:
```tsx
import { Suspense } from 'react';
import { getUserConnections } from '@/actions/corporate/get-user-connections';
import { DashboardContent } from '@/components/corporate/dashboard-content';

export default async function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Corporate Privacy Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor privacy settings across your corporate platforms
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg" />
      ))}
    </div>
  );
}
```

---

## 🔧 **Phase 3: Browser Extension Foundation (Week 4)**

### **Step 12: Create Extension Manifest**
Create `extension/manifest.json`:
```json
{
  "manifest_version": 3,
  "name": "loopwho Privacy Scanner",
  "version": "0.1.0",
  "description": "Automated corporate privacy settings monitoring",

  "permissions": [
    "tabs",
    "activeTab",
    "storage",
    "scripting"
  ],

  "host_permissions": [
    "https://myaccount.google.com/*",
    "https://account.microsoft.com/*",
    "https://www.facebook.com/settings/*"
  ],

  "background": {
    "service_worker": "background/service-worker.js"
  },

  "content_scripts": [
    {
      "matches": [
        "https://myaccount.google.com/*",
        "https://account.microsoft.com/*",
        "https://www.facebook.com/settings/*"
      ],
      "js": ["content-scripts/privacy-scraper.js"]
    }
  ],

  "action": {
    "default_popup": "popup/popup.html",
    "default_title": "loopwho Privacy Scanner"
  },

  "web_accessible_resources": [
    {
      "resources": ["content-scripts/*"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

### **Step 13: Create Background Service Worker**
Create `extension/background/service-worker.js`:
```javascript
// Background service worker for loopwho extension

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scanCorporate') {
    scanCorporatePrivacy(message.platform)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

async function scanCorporatePrivacy(platform) {
  console.log(`Starting privacy scan for ${platform}`);

  const config = getPlatformConfig(platform);

  // 1. Open privacy page in hidden tab
  const tab = await chrome.tabs.create({
    url: config.privacyUrl,
    active: false
  });

  try {
    // 2. Wait for page to load
    await waitForTabComplete(tab.id);

    // 3. Inject content script and scrape data
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: scrapePlatformPrivacySettings,
      args: [platform]
    });

    // 4. Process scraped data
    const privacyData = results[0].result;

    // 5. Send to web app
    await sendToWebApp(platform, privacyData);

    return privacyData;

  } finally {
    // 6. Always close the tab
    await chrome.tabs.remove(tab.id);
  }
}

function getPlatformConfig(platform) {
  const configs = {
    google: {
      privacyUrl: 'https://myaccount.google.com/privacy',
      selectors: {
        adPersonalization: '[data-key="ads"]',
        activityTracking: '[data-key="activity"]',
        locationHistory: '[data-key="location"]'
      }
    },
    microsoft: {
      privacyUrl: 'https://account.microsoft.com/privacy',
      selectors: {
        adPersonalization: '[data-testid="privacy-ads"]',
        diagnosticData: '[data-testid="privacy-diagnostics"]'
      }
    },
    facebook: {
      privacyUrl: 'https://www.facebook.com/settings/privacy/',
      selectors: {
        adSettings: '[data-testid="privacy_ad_settings"]',
        activityLog: '[data-testid="activity_log"]'
      }
    }
  };

  return configs[platform];
}

function waitForTabComplete(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
      if (updatedTabId === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}

async function sendToWebApp(platform, privacyData) {
  // Get user session from storage
  const storage = await chrome.storage.local.get(['userSession']);

  if (!storage.userSession) {
    throw new Error('User not authenticated');
  }

  // Send to web app API
  const response = await fetch('http://localhost:3000/api/extension/submit-scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${storage.userSession.token}`
    },
    body: JSON.stringify({
      platform,
      privacyData,
      scanMethod: 'dom',
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to submit scan: ${response.statusText}`);
  }

  return response.json();
}

// This function runs in the context of the page
function scrapePlatformPrivacySettings(platform) {
  const config = getPlatformConfigForContent(platform);
  const results = {};

  // Scrape privacy settings based on platform
  for (const [setting, selector] of Object.entries(config.selectors)) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        // Check if it's a toggle/switch
        const isToggle = element.querySelector('[role="switch"]') ||
                        element.querySelector('input[type="checkbox"]') ||
                        element.classList.contains('toggle');

        if (isToggle) {
          results[setting] = {
            type: 'toggle',
            enabled: element.getAttribute('aria-checked') === 'true' ||
                    element.classList.contains('enabled') ||
                    element.classList.contains('on'),
            text: element.textContent?.trim()
          };
        } else {
          results[setting] = {
            type: 'text',
            value: element.textContent?.trim()
          };
        }
      }
    } catch (error) {
      console.error(`Error scraping ${setting}:`, error);
      results[setting] = { error: error.message };
    }
  }

  return {
    platform,
    settings: results,
    timestamp: new Date().toISOString(),
    url: window.location.href
  };
}

function getPlatformConfigForContent(platform) {
  // Same config as above, but for content script context
  const configs = {
    google: {
      selectors: {
        adPersonalization: '[data-key="ads"], .ads-personalization',
        activityTracking: '[data-key="activity"], .web-app-activity',
        locationHistory: '[data-key="location"], .location-history'
      }
    },
    microsoft: {
      selectors: {
        adPersonalization: '[data-testid="privacy-ads"], .privacy-ads',
        diagnosticData: '[data-testid="privacy-diagnostics"], .diagnostic-data'
      }
    },
    facebook: {
      selectors: {
        adSettings: '[data-testid="privacy_ad_settings"], .ad-preferences',
        activityLog: '[data-testid="activity_log"], .activity-log'
      }
    }
  };

  return configs[platform];
}
```

---

## 🔌 **Phase 4: Extension Integration (Week 5)**

### **Step 14: Create Extension API Endpoints**
Create `src/app/api/extension/submit-scan/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scanResults, corporateConnections } from '@/db/schema/privacy';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const submitScanSchema = z.object({
  platform: z.enum(['google', 'microsoft', 'facebook']),
  privacyData: z.object({
    settings: z.record(z.any()),
    timestamp: z.string(),
    url: z.string(),
  }),
  scanMethod: z.enum(['dom', 'firecrawl', 'ocr']),
  timestamp: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, privacyData, scanMethod } = submitScanSchema.parse(body);

    // Find user's connection for this platform
    const connection = await db.query.corporateConnections.findFirst({
      where: (connections, { eq, and }) =>
        and(
          eq(connections.userId, session.user.id),
          eq(connections.platform, platform)
        ),
    });

    if (!connection) {
      return NextResponse.json({ error: 'Platform not connected' }, { status: 404 });
    }

    // Process privacy data with AI (simplified for now)
    const aiSummary = await generatePrivacySummary(privacyData.settings);

    // Store scan result
    const [scanResult] = await db
      .insert(scanResults)
      .values({
        connectionId: connection.id,
        scanMethod,
        privacySettings: privacyData,
        aiSummary,
        success: true,
      })
      .returning();

    // Update connection with latest scan time and data
    await db
      .update(corporateConnections)
      .set({
        lastScanAt: new Date(),
        privacyData: privacyData.settings,
        status: 'connected',
      })
      .where(eq(corporateConnections.id, connection.id));

    return NextResponse.json({
      success: true,
      scanId: scanResult.id,
      summary: aiSummary,
    });

  } catch (error) {
    console.error('Extension scan submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process scan' },
      { status: 500 }
    );
  }
}

async function generatePrivacySummary(settings: Record<string, any>): Promise<string> {
  // TODO: Integrate with Gemini API
  // For now, return a simple summary
  const settingCount = Object.keys(settings).length;
  const enabledCount = Object.values(settings).filter(
    (setting: any) => setting.enabled === true
  ).length;

  return `Found ${settingCount} privacy settings, ${enabledCount} are currently enabled.`;
}
```

### **Step 15: Create Extension Popup**
Create `extension/popup/popup.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      width: 300px;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .logo {
      font-size: 24px;
    }
    .title {
      font-weight: 600;
      font-size: 16px;
    }
    .status {
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
      text-align: center;
    }
    .status.connected {
      background: #f0f9ff;
      border: 1px solid #0ea5e9;
      color: #0369a1;
    }
    .status.disconnected {
      background: #fef2f2;
      border: 1px solid #f87171;
      color: #dc2626;
    }
    .platforms {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .platform {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }
    .platform-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .platform-name {
      font-weight: 500;
    }
    .scan-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .scan-btn:hover {
      background: #2563eb;
    }
    .scan-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    .open-dashboard {
      width: 100%;
      background: #059669;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      margin-top: 16px;
    }
    .open-dashboard:hover {
      background: #047857;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="logo">🔐</span>
    <span class="title">loopwho</span>
  </div>

  <div id="status" class="status disconnected">
    Checking connection...
  </div>

  <div class="platforms">
    <div class="platform">
      <div class="platform-info">
        <span>🔍</span>
        <span class="platform-name">Google</span>
      </div>
      <button class="scan-btn" onclick="scanPlatform('google')">Scan</button>
    </div>

    <div class="platform">
      <div class="platform-info">
        <span>🪟</span>
        <span class="platform-name">Microsoft</span>
      </div>
      <button class="scan-btn" onclick="scanPlatform('microsoft')">Scan</button>
    </div>

    <div class="platform">
      <div class="platform-info">
        <span>📘</span>
        <span class="platform-name">Facebook</span>
      </div>
      <button class="scan-btn" onclick="scanPlatform('facebook')">Scan</button>
    </div>
  </div>

  <button class="open-dashboard" onclick="openDashboard()">
    Open Dashboard
  </button>

  <script src="popup.js"></script>
</body>
</html>
```

Create `extension/popup/popup.js`:
```javascript
// Extension popup functionality

document.addEventListener('DOMContentLoaded', async () => {
  await checkConnection();
});

async function checkConnection() {
  const statusEl = document.getElementById('status');

  try {
    // Check if user is authenticated with web app
    const storage = await chrome.storage.local.get(['userSession']);

    if (storage.userSession) {
      statusEl.textContent = 'Connected to loopwho';
      statusEl.className = 'status connected';
    } else {
      statusEl.textContent = 'Not connected - Please login to loopwho';
      statusEl.className = 'status disconnected';
    }
  } catch (error) {
    statusEl.textContent = 'Connection error';
    statusEl.className = 'status disconnected';
  }
}

async function scanPlatform(platform) {
  const button = event.target;
  button.disabled = true;
  button.textContent = 'Scanning...';

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'scanCorporate',
      platform: platform
    });

    if (response.success) {
      button.textContent = 'Done ✓';
      setTimeout(() => {
        button.textContent = 'Scan';
        button.disabled = false;
      }, 2000);
    } else {
      button.textContent = 'Error';
      setTimeout(() => {
        button.textContent = 'Scan';
        button.disabled = false;
      }, 2000);
    }
  } catch (error) {
    console.error('Scan error:', error);
    button.textContent = 'Error';
    setTimeout(() => {
      button.textContent = 'Scan';
      button.disabled = false;
    }, 2000);
  }
}

function openDashboard() {
  chrome.tabs.create({
    url: 'http://localhost:3000/dashboard'
  });
}
```

---

## 🧠 **Phase 5: AI Integration (Week 6)**

### **Step 16: Integrate Gemini API**
Create `src/lib/ai/gemini-client.ts`:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class GeminiClient {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async generatePrivacySummary(privacySettings: Record<string, any>): Promise<string> {
    const prompt = `
Analyze these corporate privacy settings and provide a clear, user-friendly summary:

Privacy Settings:
${JSON.stringify(privacySettings, null, 2)}

Please provide:
1. A brief overview of the current privacy state
2. Key privacy concerns or recommendations
3. Simple actions the user can take to improve privacy

Keep the response under 200 words and use simple language.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      return 'Unable to generate privacy summary at this time.';
    }
  }

  async analyzePrivacyChanges(oldSettings: any, newSettings: any): Promise<string> {
    const prompt = `
Compare these privacy settings and explain what changed:

Previous Settings:
${JSON.stringify(oldSettings, null, 2)}

Current Settings:
${JSON.stringify(newSettings, null, 2)}

Explain:
1. What specific settings changed
2. Whether the changes improve or reduce privacy
3. What the user should know about these changes

Keep it concise and user-friendly.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      return 'Unable to analyze privacy changes at this time.';
    }
  }

  async generatePrivacyRecommendations(privacySettings: Record<string, any>): Promise<Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    action: string;
  }>> {
    const prompt = `
Based on these privacy settings, suggest specific improvements:

Privacy Settings:
${JSON.stringify(privacySettings, null, 2)}

Provide 3-5 specific recommendations in this JSON format:
[
  {
    "title": "Brief recommendation title",
    "description": "Clear explanation of why this matters",
    "priority": "high|medium|low",
    "action": "Specific step to take"
  }
]

Focus on the most impactful privacy improvements.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback if JSON parsing fails
      return [{
        title: "Review Privacy Settings",
        description: "Consider reviewing your privacy settings for better protection.",
        priority: "medium" as const,
        action: "Visit platform privacy settings"
      }];
    } catch (error) {
      console.error('Gemini API error:', error);
      return [];
    }
  }
}

export const geminiClient = new GeminiClient();
```

### **Step 17: Update Scan Processing**
Update `src/app/api/extension/submit-scan/route.ts`:
```typescript
import { geminiClient } from '@/lib/ai/gemini-client';

// Replace the generatePrivacySummary function:
async function generatePrivacySummary(settings: Record<string, any>): Promise<string> {
  try {
    return await geminiClient.generatePrivacySummary(settings);
  } catch (error) {
    console.error('AI summary generation failed:', error);
    const settingCount = Object.keys(settings).length;
    const enabledCount = Object.values(settings).filter(
      (setting: any) => setting.enabled === true
    ).length;

    return `Found ${settingCount} privacy settings, ${enabledCount} are currently enabled.`;
  }
}
```

---

## 💳 **Phase 6: Payment Integration (Week 7)**

### **Step 18: Set Up Enterprise Features (Optional)**

#### **Core Dependencies (Already installed)**
```bash
# Core MVP dependencies
npm install drizzle-orm postgres
npm install @google/generative-ai
npm install firecrawl-js
npm install nodemailer
npm install better-auth
npm install zod
```

#### **Enterprise Dependencies (When upgrading)**
```bash
# Install Stripe for payments
npm install stripe @stripe/stripe-js

# Add enterprise environment variables:
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Resend for professional email
RESEND_API_KEY="re_..."

# Cloudflare R2 for storage
CLOUDFLARE_R2_ACCOUNT_ID="..."
CLOUDFLARE_R2_ACCESS_KEY_ID="..."
CLOUDFLARE_R2_SECRET_ACCESS_KEY="..."
```

### **Step 19: Create Pricing Plans**
Create Stripe products in dashboard:
- **Pro Monthly**: $7.80/month
- **Pro Annual**: $78/year (10% discount)

### **Step 20: Implement Upgrade Flow**
Create `src/components/corporate/upgrade-modal.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import { createCheckoutSession } from '@/actions/payment/create-checkout-session';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null);

  const handleUpgrade = async (plan: 'monthly' | 'annual') => {
    setLoading(plan);

    try {
      const result = await createCheckoutSession({ plan });

      if (result.data?.url) {
        window.location.href = result.data.url;
      } else if (result.serverError) {
        alert('Payment setup failed. Please try again.');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Upgrade to Pro</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600">
              Monitor unlimited corporate privacy settings
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <span>Unlimited corporate platforms</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <span>Automated daily scans</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <span>AI-powered privacy insights</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <span>Priority email support</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-12 text-base"
              onClick={() => handleUpgrade('annual')}
              disabled={loading !== null}
            >
              {loading === 'annual' ? (
                'Processing...'
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span>Annual - $78/year</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Star className="h-3 w-3 mr-1" />
                    Save 17%
                  </Badge>
                </div>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 text-base"
              onClick={() => handleUpgrade('monthly')}
              disabled={loading !== null}
            >
              {loading === 'monthly' ? 'Processing...' : 'Monthly - $7.8/month'}
            </Button>
          </div>

          <div className="text-center">
            <button
              className="text-sm text-gray-500 hover:text-gray-700"
              onClick={() => onOpenChange(false)}
            >
              Maybe later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🚀 **Phase 7: Testing & Launch Preparation (Weeks 8-12)**

### **Step 21: Create Testing Suite**
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom

# Create basic tests
mkdir -p __tests__/components
mkdir -p __tests__/actions
```

### **Step 22: Prepare for Production**
```bash
# Update production environment variables
# Create production .env file with:
DATABASE_URL="production-postgresql-url"
BETTER_AUTH_SECRET="production-secret"
GEMINI_API_KEY="production-gemini-key"
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_URL="https://loopwho.com"
```

### **Step 23: Deploy Infrastructure**
```bash
# 1. Deploy database (Supabase)
# - Create production Supabase project
# - Run migrations: npx drizzle-kit migrate

# 2. Deploy application (Vercel)
vercel --prod

# 3. Configure domains and SSL
# 4. Set up monitoring and error tracking
```

### **Step 24: Browser Extension Store Submission**
```bash
# 1. Build extension for production
# 2. Create store listing materials
# 3. Submit to Chrome Web Store
# 4. Submit to Firefox Add-ons
```

### **Step 25: Launch Checklist**
- [ ] All tests passing
- [ ] Production deployment working
- [ ] Extension approved and published
- [ ] Payment processing tested
- [ ] Business Source License published
- [ ] Documentation complete
- [ ] Beta user feedback incorporated

---

## 🎯 **Success Metrics to Track**

### **Week 4 Goals:**
- [ ] Basic dashboard displaying corporate cards
- [ ] Extension can open tabs and inject scripts
- [ ] Database storing connection data

### **Week 8 Goals:**
- [ ] Complete privacy scanning for Google
- [ ] AI summaries generating correctly
- [ ] Upgrade flow working with Stripe

### **Week 12 Goals:**
- [ ] Extension published to stores
- [ ] 10+ beta users actively scanning
- [ ] Payment system processing transactions
- [ ] Open source repository published

---

This implementation guide provides a clear path from MkSaaS foundation to production launch. Each step includes specific code examples and verification points to ensure you're building the right features at the right time.

Ready to start building? Begin with Phase 0 and work through each step systematically! 🚀
