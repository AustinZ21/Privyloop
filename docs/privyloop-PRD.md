# 📋 PrivyLoop - Product Requirements Document (PRD)

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Strategy](#2-product-vision--strategy)
3. [Market Analysis](#3-market-analysis)
4. [Product Features](#4-product-features)
5. [User Experience](#5-user-experience)
6. [Business Requirements](#6-business-requirements)
7. [Technical Architecture](#7-technical-architecture)
8. [Risk Management](#8-risk-management)
9. [Success Metrics](#9-success-metrics)
10. [Dependencies & Assumptions](#10-dependencies--assumptions)

---

## 1. Executive Summary

**Product Name**: PrivyLoop  
**Product Type**: Open Source Privacy Dashboard with Cloud Service  
**Target Market**: Privacy-conscious individuals, developers, and enterprises  
**Platform**: Web Application + Browser Extension  
**Deployment Options**: Self-hosted (unlimited, free) + Cloud service (freemium)

### Problem Statement
Users struggle to understand and manage their privacy settings across multiple digital platforms due to complex interfaces, frequent policy changes, and time-consuming manual auditing processes.

### Solution Overview
PrivyLoop provides automated privacy monitoring with plain-English explanations through two deployment models: a fully open source self-hosted version with unlimited features, and a managed cloud service with tiered pricing for users who prefer hosted solutions.

### Dual Deployment Strategy
- **Self-Hosted**: Open source monorepo, unlimited privacy cards, user provides own API keys, full feature access
- **Cloud Service**: Managed hosting with Free (3 cards), Pro ($4.99/mo), and Premium ($7.8/mo with AI agent) tiers

### Key Value Propositions
- **Automated Monitoring**: Background scanning eliminates manual privacy auditing
- **Plain-English Insights**: AI-powered explanations make complex settings understandable
- **Change Detection**: Real-time alerts when privacy settings are modified
- **Direct Action**: One-click links to modify settings on original platforms
- **Deployment Flexibility**: Choose between self-hosted control or managed convenience
- **Open Source Transparency**: Full codebase visibility and community contributions

---

## 2. Product Vision & Strategy

### Vision Statement
Empower users to understand and control their digital privacy across major platforms through automated monitoring and plain-English insights.

### Strategic Goals
1. **Transparency**: Make complex privacy settings understandable to average users
2. **Automation**: Eliminate manual privacy auditing across multiple platforms
3. **Awareness**: Track and notify users of privacy setting changes over time
4. **Control**: Provide direct links for users to modify their privacy settings

### Success Metrics
- **User Engagement**: 80% of users connect at least 2 services within first week
- **Retention**: 60% monthly active user retention after 3 months
- **Privacy Awareness**: 70% of users take action on at least one privacy recommendation
- **Extension Adoption**: 85% of registered users install the browser extension
- **User Satisfaction**: 4.5+ average rating on user feedback surveys

---

## 3. Market Analysis

### Primary Target Users
- **Privacy-Conscious Professionals** (35-50 years old)
  - High digital footprint across multiple platforms
  - Limited time for manual privacy management
  - Value data security and transparency

- **Tech-Savvy Millennials** (25-40 years old)
  - Active on social media and cloud services
  - Interested in privacy but overwhelmed by complexity
  - Willing to use browser extensions and tools

### Secondary Target Users
- **Digital Rights Advocates**: Users who want comprehensive privacy auditing
- **Corporate Users**: Professionals managing business accounts across platforms

---

## 4. Product Features

### 4.1 MVP Features (Must-Have)

#### User Onboarding & Authentication
- **Multi-Provider Login**: Email/password, Google OAuth, Microsoft OAuth, GitHub OAuth
- **Email Verification**: Required for account activation
- **Extension Installation Guide**: Step-by-step browser extension setup
- **Service Connection Wizard**: Guided process to connect first privacy-enabled service

#### Automated Privacy Settings Scanning
- **Background Tab Scanning**: Extension opens privacy pages in hidden tabs (`chrome.tabs.create({ active: false })`)
- **One-Time Consent Model**: Users grant permission once: "Yes, check my settings in the background"
- **Automated Tab Management**: Extension automatically opens → injects content script → scans DOM → closes tab
- **DOM Scraping Engine**: Extract privacy toggle states and text content from supported platforms
- **No Manual Navigation**: Users never need to manually visit privacy pages
- **Fallback Mechanisms**:
  - **Primary**: Direct DOM scraping via browser extension
  - **Secondary**: Firecrawl API when page structure changes
  - **Tertiary**: Gemini Vision OCR as fall-back for extracting privacy settings
- **Supported Platforms (MVP)**:
  - Google (Ads, Activity, Location, YouTube)
  - Facebook (Privacy Settings, Ad Preferences)
  - LinkedIn
  - OpenAI
  - Claude

#### Privacy Dashboard
- **Corporate Privacy Cards**: Individual cards for each connected platform 
- **Add Corporate Button**: Prominent button to connect new privacy platforms
- **Upgrade Prompts**: Dialog appears when free users try to add 4th+ corporate card
- **Settings Categorization**: Organized by privacy domain (Ads, Location, Data Sharing, etc.)
- **Plain English Explanations**: AI-generated summaries of technical privacy policies
- **Quick Action Links**: Direct links to official privacy pages for immediate changes
- **Connection Status**: Real-time indication of successful/failed scans on each card

#### Change Detection & History
- **Versioned Snapshots**: Store historical privacy setting states
- **Diff Visualization**: Highlight changes between scans with before/after comparison
- **Change Timeline**: Chronological view of all privacy modifications
- **Change Categories**: Classify changes as user-initiated vs. platform-initiated

#### AI-Powered Analysis
- **Gemini API Integration**: Generate user-friendly privacy setting explanations
- **Risk Assessment**: Classify privacy settings by risk level (Low/Medium/High)
- **Personalized Recommendations**: Suggest privacy improvements based on user behavior
- **Impact Analysis**: Explain consequences of different privacy choices

### 4.2 Future Features (Post-MVP)

#### Advanced Monitoring
- **Real-time Notifications**: Email/push alerts for privacy setting changes
- **Scheduled Scans**: Automated daily/weekly privacy audits
- **Bulk Actions**: Apply privacy changes across multiple platforms simultaneously

#### Enhanced Analytics
- **Privacy Score**: Aggregate privacy health score across all platforms
- **Platform Comparison**: Side-by-side privacy analysis between services
- **Industry Benchmarks**: Compare personal privacy settings against best practices

#### Social Features
- **Privacy Communities**: Share privacy configurations with trusted groups
- **Expert Recommendations**: Curated privacy settings from security professionals
- **Privacy News**: Updates on platform policy changes and their implications

---

## 5. User Experience

### 5.1 User Stories & Acceptance Criteria

#### Epic 1: User Onboarding
**As a new user, I want to quickly set up my privacy monitoring so I can start tracking my digital footprint.**

##### User Story 1.1: Account Creation
- **Given** I am a new visitor to privyloop
- **When** I click "Sign Up" and complete the registration form
- **Then** I receive a verification email and can activate my account
- **And** I am guided to install the browser extension

##### User Story 1.2: First Corporate Card Connection
- **Given** I have an activated account and installed extension
- **When** I click "Add Corporate" button on my empty dashboard
- **Then** I see a list of supported platforms
- **When** I click "Connect Google" 
- **Then** I'm prompted with "Allow privloop to check your Google privacy settings in the background?"
- **And** after clicking "Yes, check my settings", the extension opens Google's privacy page in a hidden tab
- **And** the extension automatically scans my Google privacy settings without me seeing the tab
- **And** I see a new Google corporate privacy card on my dashboard within a few minutes

#### Epic 2: Privacy Monitoring
**As an active user, I want to understand my current privacy settings and track changes over time.**

##### User Story 2.1: Privacy Dashboard View
- **Given** I have connected services to my account
- **When** I visit my dashboard
- **Then** I see all my privacy settings organized by platform and category
- **And** each setting has a plain-English explanation of its impact

##### User Story 2.2: Change Detection
- **Given** a platform has modified my privacy settings
- **When** the next scan occurs
- **Then** I see highlighted changes in my dashboard
- **And** I can view before/after comparisons of the modified settings

#### Epic 3: Privacy Action
**As a privacy-conscious user, I want to easily modify my privacy settings based on recommendations.**

##### User Story 3.1: Privacy Recommendations
- **Given** I have privacy settings that could be improved
- **When** I view my dashboard
- **Then** I see AI-generated recommendations with risk assessments
- **And** I can click direct links to modify settings on the original platforms
- **And** I can optionally trigger a new background scan to verify my changes

##### User Story 3.2: Upgrade Flow (Free User Limit)
- **Given** I am a free user with 3 corporate cards already connected
- **When** I click "Add Corporate" button
- **Then** I see an upgrade dialog: "Free users can monitor 3 corporate platforms. Upgrade to Pro for unlimited monitoring + advanced features."
- **And** I see pricing options: "Pro: $4.99/month or $49.99/year" and "Premium: $7.8/month or $78/year (includes AI assistant)"
- **When** I click "Upgrade to Pro", I'm taken to the payment page
- **And** after successful payment, I can add unlimited corporate cards and access advanced analytics

---

## 6. Business Requirements

### 6.1 Monetization Strategy (Open Source + Dual Revenue Model)

#### Open Source Self-Hosted
- **Business Source License**: Full codebase visible on GitHub under BSL 1.1
- **Personal Use**: Free forever for individuals, educational, and non-commercial use
- **Unlimited Features**: No card limits, full feature access with user-provided API keys
- **Community Driven**: Open to contributions, issues, and feature requests
- **Commercial Restriction**: Prevents direct commercial redistribution of hosted competing services

#### Cloud Managed Service
- **Hosted Service**: Fully managed version at privyloop.com with infrastructure included
- **Subscription Tiers**:
  - **Free**: 3 corporate privacy cards, basic dashboard, essential features
  - **Pro ($4.99/month or $49.99/year)**: Unlimited corporate cards, advanced analytics, priority support, automated daily scans
  - **Premium ($7.8/month or $78/year)**: All Pro features + AI privacy assistant with LangGraph, advanced workflows, custom integrations *(Phase 2)*
- **Enterprise**: Custom pricing for large organizations with SSO, compliance, and dedicated support

#### Revenue Streams
- **Primary**: Cloud service subscriptions (Pro/Premium tiers)
- **Secondary**: Enterprise licenses and custom implementations
- **Tertiary**: Professional services, consulting, and training

### 6.2 Legal & Compliance
- **Terms of Service**: Clear data handling and user rights
- **Privacy Policy**: Transparent about own data collection practices. On the page, it has two columns, one column for regular jargons and terms, one column using simple plain english one or two sentence explain what it means to user.
- **Platform Compliance**: Adherence to each platform's scraping policies
- **International Privacy Laws**: GDPR, CCPA, and other regional compliance

### 6.3 Support & Documentation
- **User Documentation**: Comprehensive help center and FAQs
- **Video Tutorials**: Step-by-step guides for setup and usage
- **Customer Support**: Email support with 24-hour response time
- **Community Forum**: User community for sharing privacy tips and strategies

---

## 7. Technical Architecture

### 7.1 Monorepo Structure & Deployment Models

#### Monorepo Organization
```
privyloop/
├── packages/
│   ├── core/                    # Open Source Core
│   │   ├── database/           # PostgreSQL schemas & migrations
│   │   ├── auth/               # Basic authentication + Nodemailer
│   │   ├── dashboard/          # Basic privacy dashboard (shared)
│   │   ├── scraping/           # Privacy scraping engine
│   │   └── storage/            # Local file-based storage
│   ├── enterprise/             # Cloud Service Extensions
│   │   ├── advanced-analytics/ # Usage trends, BI dashboards, Pro+ features
│   │   ├── payments/           # Stripe integration
│   │   ├── notifications/      # Resend email integration
│   │   └── integrations/       # Supabase, Cloudflare R2
│   ├── ai-agent/               # Phase 2: LangGraph + Inngest
│   │   ├── workflows/          # Inngest workflow definitions
│   │   ├── agents/             # LangGraph conversation agents
│   │   └── tools/              # AI agent tools & capabilities
│   ├── web/                    # Next.js Frontend (shared)
│   ├── extension/              # Browser Extension (shared)
│   └── shared/                 # Common utilities & types
├── deployments/
│   ├── self-hosted/            # Docker Compose for local deployment
│   ├── cloud/                  # Vercel + managed services
│   └── enterprise/             # Advanced deployment configs
└── docs/                       # Documentation & guides
```

#### Feature Flagging System
```typescript
// packages/shared/config.ts
export const features = {
  // Core features (always available)
  privacyScanning: true,
  basicDashboard: true,
  changeDetection: true,
  emailAuth: true, // Both have login/verification
  
  // Cloud service features
  unlimitedCards: env.DEPLOYMENT_TYPE === 'cloud' && env.SUBSCRIPTION_TIER !== 'free',
  advancedAnalytics: env.SUBSCRIPTION_TIER === 'pro' || env.SUBSCRIPTION_TIER === 'premium',
  aiAgent: env.SUBSCRIPTION_TIER === 'premium', // Phase 2
  
  // Infrastructure features
  managedDatabase: env.HOSTING_TYPE === 'cloud',
  objectStorage: env.HOSTING_TYPE === 'cloud',
  stripePayments: env.HOSTING_TYPE === 'cloud',
}
```

### 7.2 Technical Requirements

#### Database & Storage Requirements

**Self-Hosted Deployment**
- **Core Database**: Self-hosted PostgreSQL 15+ with built-in JSONB support
- **Storage**: Local file system for privacy templates and user diffs
- **Caching**: In-memory Node.js Map/LRU cache (no Redis dependency)
- **Sessions**: File-based or PostgreSQL session storage
- **Email**: Nodemailer with user-provided SMTP configuration
- **Scalability**: Optimized for personal/small team usage (10-100 users)

**Cloud Service Deployment**  
- **Managed Database**: Supabase PostgreSQL with TimescaleDB extension
- **Object Storage**: Cloudflare R2 for template-based storage optimization
- **Caching**: Upstash Redis for session management and query optimization
- **Email**: Resend for reliable transactional emails
- **Analytics**: Advanced time-series data for Pro/Premium tiers
- **Scalability**: Designed for thousands of concurrent users

#### External Service Dependencies
- **AI Service**: Google Gemini API for privacy analysis and recommendations
- **Web Scraping**: Firecrawl API for fallback content extraction when DOM changes, or extension fails
- **Email Service**: SMTP/Nodemailer (open source local deployment) and Resend (Enterprise) for notifications
- **Payment Processing**: Stripe integration (Enterprise only) for subscription management

#### Security Requirements
- **Data Encryption**: All user's platform privacy settings data encrypted at rest and in transit
- **No Credential Storage**: Extension uses session-based authentication only
- **GDPR Compliance**: User data deletion and export capabilities
- **Audit Trail**: Complete logging of all privacy data access

#### Scalability Requirements
- **User Capacity**: Support 10,000+ concurrent users in MVP
- **Data Storage**: Efficient storage of versioned privacy snapshots
- **API Rate Limiting**: Respect platform API limits and implement backoff strategies
- **Database Performance**: Sub-second query response times for dashboard views

#### Compatibility Requirements
- **Browser Support**: Chrome, Firefox, Edge (Manifest v3 compatible)
- **Platform Support**: Windows, macOS, Linux
- **Mobile Responsiveness**: Full functionality on mobile devices
- **Screen Readers**: WCAG 2.1 AA compliance for accessibility

#### Extension Security Architecture

**Dynamic Permission Management (Scalable Approach):**
```json
{
  "manifest_version": 3,
  "permissions": [
    "storage"           // Local extension preferences only
  ],
  "optional_permissions": [
    "https://*.google.com/*",      // Pattern-based, not hardcoded URLs
    "https://*.facebook.com/*",    // Covers all Facebook privacy pages
    "https://*.linkedin.com/*",    // Scales to new LinkedIn features
    "https://*.openai.com/*",      // Future-proof for new OpenAI pages
    "https://*.anthropic.com/*"    // Claude privacy settings
  ]
}
```

**Platform Registry System:**
- **Server-Side Platform Management**: Add new platforms via API without extension updates
- **Runtime Permission Requests**: Request access only when user connects specific platform
- **Pattern-Based URL Matching**: Flexible URL patterns instead of hardcoded endpoints
- **Plugin Architecture**: Modular platform-specific scraping modules

**Secure Data Transmission:**
- **End-to-End Encryption**: All privacy data encrypted using Web Crypto API before transmission
- **Certificate Pinning**: API communication uses pinned TLS certificates
- **Extension Authentication**: Unique extension ID verification with JWT tokens
- **Data Sanitization**: All DOM-extracted data sanitized before processing

**Content Security Policy:**
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; frame-ancestors 'none';",
    "sandbox": "sandbox allow-scripts allow-forms;"
  }
}
```

**Progressive Security Model:**
- **Platform-by-Platform Consent**: Request permissions only when user adds specific platform
- **Clear Permission Explanations**: Show users exactly what data will be accessed
- **Granular Access Control**: Users can revoke individual platform permissions
- **Minimal Data Extraction**: Collect only privacy toggle states, not full policy content
- **Isolated Content Scripts**: Run in isolated world to prevent page JavaScript interference

**Extension Store Compliance Preparation:**
- **Comprehensive Privacy Policy**: Detailed data handling documentation
- **Permission Justification Documentation**: Clear rationale for each requested permission
- **Security Audit Trail**: Third-party security review before submission
- **Regular Compliance Updates**: Maintain alignment with evolving store policies

### 7.3 Deployment Configurations

#### Self-Hosted Setup
```yaml
# deployments/self-hosted/docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/privyloop
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - FIRECRAWL_API_KEY=${FIRECRAWL_API_KEY}
      - SMTP_HOST=${SMTP_HOST}
    depends_on:
      - postgres
    
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=privyloop
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./storage:/app/storage
```

**Self-Hosted Characteristics:**
- 🚀 **One-command setup**: `docker-compose up -d`
- 🎯 **Minimal stack**: PostgreSQL + Next.js app only
- 🔑 **User-provided APIs**: Gemini, Firecrawl, SMTP
- 📁 **Local storage**: Templates and diffs on filesystem
- ⚡ **In-memory caching**: No Redis dependency

#### Cloud Service Infrastructure
**Managed Services Stack:**
- **Database**: Supabase PostgreSQL with TimescaleDB
- **Storage**: Cloudflare R2 for template-based optimization
- **Cache**: Upstash Redis for session management
- **Email**: Resend for transactional emails
- **Payments**: Stripe for subscription handling
- **AI Agent**: FastAPI service for LangGraph + Inngest *(Phase 2)*

**Scaling Strategy:**
- Start with simple Docker deployment
- Add Kubernetes only when serving 10K+ concurrent users
- Horizontal scaling through load balancers and multiple instances

### 7.2 Data Storage Strategy

#### Opensource Core Storage (OPTIMIZED)
**PostgreSQL (Hot Data)**:
- **User accounts and preferences**: Immediate access required
- **Platform connections**: User-platform relationship data
- **Platform privacy templates**: Shared templates across all users (95% storage reduction)
- **User privacy settings**: Only user-specific toggle states (tiny diffs)
- **Configuration data**: Platform settings and scraper versions

**Local File Storage (Template-Based)**:
- **Platform privacy templates**: Single shared template per platform version
  ```
  packages/core/storage/privacy-templates/
  ├── google/template-v2024-01-15.md          # Single source of truth
  ├── microsoft/template-v2024-01-15.md       # Shared across all users
  └── facebook/template-v2024-01-15.md        # No duplication
  ```
- **User setting diffs**: Tiny JSON files with only user's toggle states
  ```
  packages/core/storage/user-settings/
  ├── user123/google-settings.json            # ~1KB per user
  ├── user123/microsoft-settings.json         # Only personal toggles
  └── user123/facebook-settings.json          # No policy text
  ```
- **User data exports**: GDPR compliance data packages

#### Enterprise Storage Extensions (OPTIMIZED)
**Supabase PostgreSQL + TimescaleDB (Managed Database)**:
- **User settings history**: Efficient time-series queries for personal setting changes
- **Change events**: Distinguish user changes vs platform policy updates
- **Analytics data**: Usage patterns and trend analysis
- **Audit logs**: Complete change history for compliance
- **Automatic backups**: Managed backup and recovery
- **Scaling**: Automatic connection pooling and performance optimization

**Cloudflare R2 (Blob Storage - Template-Based)**:
- **Platform privacy templates**: Single template per platform version
  ```
  /templates/google/privacy-v2024-01-15.md      # Single source of truth
  /templates/microsoft/privacy-v2024-01-15.md   # Shared across all users
  ```
- **User setting histories**: Compressed time-series of user's personal changes
  ```
  /users/user123/settings-history/              # Only personal changes
  ├── google-2024-01.json.gz                    # Monthly compressed diffs
  ├── microsoft-2024-01.json.gz                 # 98% smaller than before
  ```
- **AI analysis cache**: Single analysis per platform template (not per user)
- **Backup data**: Redundant storage for critical privacy information

**Redis Cache (Enterprise)**:
- **Session data**: User authentication state
- **Dashboard data**: Frequently accessed privacy summaries
- **Change notifications**: Real-time notification queue
- **API rate limiting**: Request throttling data
- **Extension status**: Real-time connection status

#### Template-Based Data Flow (95% Storage Reduction)
```
1. 🏭 PLATFORM TEMPLATE PROCESSING (Once per platform version):
   1a. 🔍 Pre-scrape platform privacy policy
   1b. 📝 Save template: /templates/google/privacy-v2024-01-15.md
   1c. 🧠 Analyze with Gemini ONCE → Store in platform_privacy_templates
   1d. 🔄 Version and cache for all users

2. 👤 USER-SPECIFIC PROCESSING (Per user scan):
   2a. 🔍 Scrape user's personal toggle states only
   2b. 📊 Compare against current template version
   2c. 💾 Store only personal settings diff (~1KB vs ~50KB)
   2d. 🔄 Detect changes in user's personal settings

3. ⚠️  CHANGE DETECTION (Optimized):
   ├── 🏭 Platform policy changes: Update template → Notify all affected users
   ├── 👤 User setting changes: Compare personal diffs → Individual notifications
   ├── 📊 Insert into TimescaleDB (user_settings_history)
   ├── 🔔 Trigger appropriate notification type
   ├── 📱 Update user dashboard with template + personal diff
   └── 📧 Send targeted notifications
```

### 7.4 Technology Stack by Deployment

#### 🎨 Shared Frontend Stack (Both Deployments)
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | Next.js | 15.x | Full-stack React framework with App Router |
| **UI Framework** | React | 18.x | Component-based user interface |
| **UI Components** | shadCN/ui | Latest | Pre-built accessible components |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS framework |
| **State Management** | Zustand | 4.x | Lightweight state management |
| **Form Handling** | React Hook Form | 7.x | Performant forms with validation |
| **Data Fetching** | TanStack Query | 5.x | Server state management and caching |
| **Icons** | Lucide React | Latest | Consistent icon library |
| **Animation** | Framer Motion | 11.x | Smooth animations and transitions |
| **Charts** | Recharts | 2.x | Basic privacy score visualizations |

#### ⚙️ Core Backend Stack (Self-Hosted)
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Node.js | 20 LTS | JavaScript runtime environment |
| **Framework** | Next.js API Routes | 15.x | Server-side API endpoints |
| **Database ORM** | Drizzle ORM | Latest | Type-safe database operations |
| **Validation** | Zod | 3.x | Schema validation and TypeScript types |
| **Authentication** | Better Auth + Nodemailer | Latest | Multi-provider auth + email |
| **Task Scheduling** | Node-cron | Latest | Background privacy scans |
| **Rate Limiting** | Built-in middleware | - | Simple API rate limiting |
| **Logging** | Pino + Console/File | 4.x | Local logging output |
| **Caching** | Node.js Map/LRU | Built-in | In-memory caching |

#### 🚀 Enterprise Backend Extensions (Cloud Service)
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Database** | Supabase PostgreSQL + TimescaleDB | Latest | Managed database with time-series |
| **Email Service** | Resend | Latest | Reliable transactional emails |
| **Payment Processing** | Stripe | Latest | Subscription management |
| **Cache** | Upstash Redis | Latest | Serverless Redis caching |
| **Storage** | Cloudflare R2 | Latest | Object storage for templates |
| **Task Scheduling** | Vercel Cron Functions | Latest | Managed scheduled tasks |
| **Rate Limiting** | @upstash/ratelimit | Latest | Advanced rate limiting |
| **Logging** | Pino + Vercel Analytics | Latest | Cloud logging and monitoring |
| **Analytics** | Custom TimescaleDB queries | - | Advanced usage analytics |

#### 🗄️ Database & Storage Stack
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Core Database** | PostgreSQL | 15+ | Self-hosted relational database |
| **Enterprise Database** | Supabase PostgreSQL | Latest | Managed PostgreSQL with extensions |
| **Time-Series Extension** | TimescaleDB | 2.x | Efficient time-series data storage |
| **Blob Storage (self-hosted)** | Local File System | - | Template and user diff storage |
| **Blob Storage (Enterprise)** | Cloudflare R2 | Latest | Scalable object storage |
| **Cache (Cloud)** | Upstash Redis | Latest | Serverless Redis for cloud deployments |
| **Cache (Self-Hosted)** | Redis | 7.x | Self-hosted Redis for caching |
| **Database Migration** | Drizzle Kit | Latest | Database schema migrations |

#### 🔧 Browser Extension Stack (Security-Enhanced)
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Manifest** | Manifest v3 | Latest | Modern extension architecture with enhanced security |
| **Build Tool** | Vite | 5.x | Fast development and bundling |
| **Language** | TypeScript | 5.x | Type-safe extension development |
| **Content Scripts** | Vanilla JS/TS + DOMPurify | - | Secure DOM manipulation with sanitization |
| **Background Service** | Service Worker | - | Background processing with CSP enforcement |
| **Storage** | Chrome Storage API (Encrypted) | - | Encrypted local data persistence |
| **Messaging** | Chrome Runtime API + Web Crypto | - | Encrypted extension-webapp communication |
| **Platform Registry** | Dynamic JSON Config | - | Server-managed platform configurations |
| **Permission Management** | Chrome Permissions API | - | Runtime permission requests and revocation |
| **URL Pattern Matching** | RegExp-based Router | - | Flexible privacy page detection |
| **Security Policies** | Content Security Policy | - | XSS protection and script isolation |

#### 🤖 AI & External Services Stack
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **AI Processing** | Google Gemini API | 2.5 pro | Multimodal AI for text and image analysis |
| **Web Scraping** | Firecrawl API | Latest | Fallback content extraction |
| **Error Tracking** | Sentry | 7.x | Error monitoring and alerting |

#### 🧠 Phase 2: AI Agent Stack (Premium Tier)
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **AI Agent Runtime** | Python FastAPI | 3.11+ | High-performance AI agent backend |
| **Conversation Management** | LangGraph | Latest | Advanced conversation state management |
| **Workflow Orchestration** | Inngest | Latest | Multi-step job coordination and reliability |
| **Knowledge Integration** | Custom RAG Pipeline | - | Privacy knowledge base integration |
| **Search API** | Google Search API | Latest | Real-time privacy news and updates |
| **Agent Tools** | Custom function calling | - | Privacy analysis, recommendations, actions |
| **Hosting** | Render | Latest | Python service deployment |
| **Message Queue** | Inngest Events | Latest | Async agent task processing |

**AI Agent Architecture Preparation:**
- **Conversation Continuity**: LangGraph manages multi-turn conversations with context
- **Privacy Context Integration**: Agent has access to user's current privacy settings
- **Workflow Orchestration**: Inngest coordinates complex multi-step privacy tasks
- **Real-time Updates**: WebSocket integration for streaming agent responses
- **Extensible Tools**: Plugin architecture for adding new privacy platforms
- **Enterprise Features**: Advanced analytics integration and custom workflows

#### 🚀 Infrastructure & DevOps Stack
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Hosting (App)** | Vercel | Latest | Next.js application hosting |
| **Hosting (AI Agent)** | Render | Latest | Python FastAPI backend for LangGraph agent |
| **Database Hosting** | Supabase | Latest | Managed PostgreSQL hosting |
| **CDN** | Cloudflare | Latest | Global content delivery |
| **DNS** | Cloudflare | Latest | Domain management and security |
| **Container Runtime** | Docker | 24.x | Application containerization |
| **Container Orchestration** | Docker Compose | 2.x | Local development environment |
| **CI/CD** | GitHub Actions | Latest | Automated testing and deployment |
| **Monitoring** | Uptime Robot | Latest | Service availability monitoring |
| **SSL/TLS** | Let's Encrypt | Latest | Automatic HTTPS certificates |

#### 🛠️ Development & Tooling Stack
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Package Manager (Node.js)** | pnpm | 8.x | Fast, efficient package management |
| **Package Manager (Python)** | Poetry/pip | Latest | Python dependency management |
| **Language** | TypeScript | 5.x | Type-safe JavaScript development |
| **Language (AI Agent)** | Python | 3.11+ | AI agent backend development |
| **Code Formatting** | Prettier | 3.x | Consistent code formatting |
| **Linting** | ESLint | 8.x | Code quality and error detection |
| **Testing Framework** | Vitest | 1.x | Unit and integration testing |
| **E2E Testing** | Playwright | 1.x | End-to-end browser testing |
| **Type Checking** | TypeScript Compiler | 5.x | Static type checking |
| **Code Editor** | VS Code | Latest | Integrated development environment |
| **Version Control** | Git | Latest | Source code management |

#### 🔒 Security & Compliance Stack
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Authentication** | Better Auth | Latest | Secure multi-provider auth |
| **Session Management** | JWT + HTTP-only cookies | - | Secure session handling |
| **CSRF Protection** | Built-in Next.js | 15.x | Cross-site request forgery protection |
| **Rate Limiting** | Upstash Rate Limit | Latest | API abuse prevention |
| **Input Validation** | Zod | 3.x | Schema validation and sanitization |
| **SQL Injection Prevention** | Drizzle ORM | Latest | Parameterized queries |
| **XSS Protection** | Built-in React | 18.x | Cross-site scripting prevention |
| **Content Security Policy** | Next.js Headers | 15.x | Browser security policies |
| **Environment Secrets** | Vercel Environment Variables | - | Secure configuration management |

### 7.4 System Architecture Diagrams

#### System Architecture Overview

```mermaid
flowchart TB
    subgraph "User Layer"
        User[👤 User]
        Browser[🌐 Browser]
        Extension[🔧 Browser Extension]
    end

    subgraph "Frontend Layer"
        WebApp[📱 Next.js Web App]
        UI[🎨 shadCN UI Components]
        Auth[🔐 Better Auth Client]
    end

    subgraph "API Layer"
        ServerActions[⚡ Server Actions]
        APIRoutes[🛣️ API Routes]
        Middleware[🛡️ Middleware]
        Validation[✅ Zod Validation]
    end

    subgraph "Business Logic Layer"
        ScrapingEngine[🔍 Scraping Engine]
        DiffEngine[📊 Diff Engine]
        AIProcessor[🤖 AI Processor]
        CreditSystem[💰 Credit System]
        NotificationService[📧 Notification Service]
    end

    subgraph "Data Layer"
        DrizzleORM[🗄️ Drizzle ORM]
        CoreDB[(🐘 Self-hosted PostgreSQL - Core)]
        EnterpriseDB[(🚀 Supabase PostgreSQL + TimescaleDB - Enterprise)]
        LocalStorage[(📁 Local Markdown Files - Core)]
        BlobStorage[(☁️ Cloudflare R2 - Enterprise)]
    end

    subgraph "Future Scaling"
        Cache[⚡ Redis Cache]
        CDN[🌍 CDN Distribution]
        LoadBalancer[⚖️ Load Balancer]
    end

    subgraph "External Services"
        GeminiAPI[🧠 Google Gemini API]
        FirecrawlAPI[🕷️ Firecrawl API]
        StripeAPI[💳 Stripe API]
        ResendAPI[📧 Resend Email API]
        OCRService[👁️ OCR Service]
    end

    subgraph "Infrastructure"
        CDN[🌍 CDN]
        LoadBalancer[⚖️ Load Balancer]
        Monitoring[📊 Monitoring]
        Logging[📝 Logging]
    end

    %% User Interactions
    User --> Browser
    Browser --> Extension
    Browser --> WebApp
    Extension --> APIRoutes

    %% Frontend Flow
    WebApp --> UI
    WebApp --> Auth
    WebApp --> ServerActions

    %% API Processing
    ServerActions --> Validation
    APIRoutes --> Middleware
    Middleware --> Validation
    Validation --> ScrapingEngine
    Validation --> AIProcessor
    Validation --> CreditSystem

    %% Business Logic
    ScrapingEngine --> DiffEngine
    DiffEngine --> NotificationService
    AIProcessor --> GeminiAPI
    ScrapingEngine --> FirecrawlAPI
    ScrapingEngine --> OCRService

    %% Core Data Operations
    ServerActions --> DrizzleORM
    ScrapingEngine --> DrizzleORM
    AIProcessor --> DrizzleORM
    DrizzleORM --> CoreDB
    ScrapingEngine --> LocalStorage

    %% Enterprise Data Operations
    DrizzleORM --> EnterpriseDB
    ScrapingEngine --> BlobStorage

    %% Future Scaling Connections
    AIProcessor -.-> Cache
    WebApp -.-> CDN

    %% External Integrations
    CreditSystem --> StripeAPI
    NotificationService --> ResendAPI

    %% Infrastructure
    WebApp --> CDN
    APIRoutes --> LoadBalancer
    LoadBalancer --> Monitoring
    Monitoring --> Logging

    %% Styling
    classDef userLayer fill:#e1f5fe
    classDef frontendLayer fill:#f3e5f5
    classDef apiLayer fill:#e8f5e8
    classDef businessLayer fill:#fff3e0
    classDef dataLayer fill:#fce4ec
    classDef externalLayer fill:#f1f8e9
    classDef infraLayer fill:#e0f2f1

    class User,Browser,Extension userLayer
    class WebApp,UI,Auth frontendLayer
    class ServerActions,APIRoutes,Middleware,Validation apiLayer
    class ScrapingEngine,DiffEngine,AIProcessor,CreditSystem,NotificationService businessLayer
    class DrizzleORM,Database,TimescaleDB,BlobStorage,Cache dataLayer
    class GeminiAPI,FirecrawlAPI,StripeAPI,ResendAPI,OCRService externalLayer
    class CDN,LoadBalancer,Monitoring,Logging infraLayer
```

#### Extension Communication Flow
```mermaid
sequenceDiagram
    participant User
    participant Extension
    participant ContentScript
    participant Background
    participant WebApp
    participant API

    User->>Extension: Trigger Privacy Scan
    Extension->>Background: Schedule Scan Task
    Background->>ContentScript: Inject into Privacy Pages
    ContentScript->>ContentScript: Scrape Privacy Settings
    ContentScript->>Background: Return Scraped Data
    Background->>Background: Process & Validate Data
    Background->>WebApp: Send via Secure Channel
    WebApp->>API: Submit Privacy Snapshot
    API->>API: Store & Analyze Data
    API-->>WebApp: Confirm Storage
    WebApp-->>Extension: Update Scan Status
    Extension-->>User: Display Completion
```

#### AI Conversation Management

LangGraph-Centered Conversation Architecture
PrivyLoop uses **LangGraph as the primary conversation manager** for AI agent interactions, with database persistence for user history and cross-session continuity.

```mermaid
sequenceDiagram
    participant User
    participant Frontend[Next.js Frontend]
    participant Inngest[Inngest Workflow]
    participant LangGraph[LangGraph Agent]
    participant Database[Supabase DB]
    participant Gemini[Gemini 2.5 Pro]

    User->>Frontend: Send message
    Frontend->>Inngest: Trigger AI conversation workflow
    Inngest->>LangGraph: Route message with user context
    
    LangGraph->>LangGraph: Load conversation state
    LangGraph->>Database: Get user privacy context
    LangGraph->>Gemini: Process with full context
    Gemini-->>LangGraph: AI response
    
    LangGraph->>Database: Persist conversation turn
    LangGraph->>LangGraph: Update conversation state
    LangGraph-->>Inngest: Stream response
    Inngest-->>Frontend: Real-time message update
    Frontend-->>User: Display AI response
```

**Database Integration**:
- **LangGraph Memory**: Handles conversation flow, context windows, and agent state
- **Supabase Persistence**: Stores conversation history for user access and analytics
- **Conversation Continuity**: Users can resume conversations across sessions
- **Privacy Context Integration**: Agent has access to user's current privacy settings

---

## 8. Risk Management

### 8.1 Technical Risks
- **Platform Changes**: Privacy page layouts change frequently
  - *Mitigation*: Fallback Firecrawl and OCR system and rapid update deployment
- **API Rate Limits**: Platforms may restrict automated access
  - *Mitigation*: Intelligent scheduling and user-distributed scanning
- **Extension Store Approval**: Browser stores may reject extension
  - *Mitigation*: adherence to store policies and early submission

### 8.2 Business Risks
- **Legal Challenges**: Platforms may object to scraping activities
  - *Mitigation*: Legal review and compliance with terms of service
- **Market Competition**: Existing privacy tools may dominate
  - *Mitigation*: Focus on unique value proposition of automated plain-English insights
- **User Adoption**: Users may not trust browser extension
  - *Mitigation*: Transparent security practices and open-source components

---

## 9. Success Metrics

### 9.1 MVP Success Metrics (3 months post-launch)
- **User Registration**: 1,000+ registered users
- **Extension Installs**: 850+ extension installations
- **Platform Connections**: 150+ total platform connections
- **User Retention**: 60% users active after 30 days
- **Privacy Actions**: 500+ users take action on recommendations

### 9.2 Growth Metrics (6 months post-launch)
- **User Base**: 5,000+ registered users
- **Revenue**: $5,000+ MRR (if premium features launched)
- **Platform Coverage**: 5+ major platforms supported
- **User Satisfaction**: 4.5+ average rating
- **Organic Growth**: 30% users acquired through referrals

### 9.3 Quality Metrics (Ongoing)
- **Scan Accuracy**: 95%+ accuracy in privacy setting detection
- **False Positives**: < 5% false change alerts
- **System Uptime**: 99.5%+ availability
- **Support Response**: < 24 hours average support response time

---

## 10. Dependencies & Assumptions

### 10.1 Technical Dependencies
- **Gemini API**: AI-powered privacy explanations
- **Supabase**: Database and authentication services
- **Cloudflare R2**: Storage for privacy snapshots
- **Browser Extension Stores**: Distribution platform approval

### 10.2 Business Assumptions
- **User Demand**: Significant demand for automated privacy monitoring
- **Platform Stability**: Major platforms maintain relatively stable privacy page structures
- **Legal Environment**: Current legal framework allows privacy monitoring tools
- **Technical Feasibility**: Browser extensions can reliably access and scrape privacy settings

### 10.3 Resource Assumptions
- **Development Team**: 2-3 developers for 4-month MVP development
- **Budget**: $50,000+ for development, infrastructure, and legal review
- **Timeline**: 4 months from development start to MVP launch
- **User Testing**: Access to 20+ beta users for testing and feedback
