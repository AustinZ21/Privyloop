# Codebase Atlas - Loop (MkSaaS Template)

## Quick Navigation

**For Teams & AI**: Jump to relevant sections based on your task:

### 🚀 **Getting Started & Setup**
- [Repo Overview](#repo-overview) - Project purpose and architecture overview
- [Tech Stack](#tech-stack--tooling) - Technologies and dependencies
- [Configuration Hub](#configuration--customization) - Website settings and customization
- [Environment Setup](#configuration-requirements) - Required environment variables

### 🔧 **Customization & Development**  
- [Website Configuration](#website-configuration-srcconfigwebsitetsx) - Central settings and toggles
- [Menu Configuration](#menu-configuration-patterns) - Navigation and menu systems
- [Component Customization](#component-customization-workflows) - UI components and theming
- [Directory Structure](#directory-structure) - Codebase organization

### 🏗️ **Architecture & Implementation**
- [Core Business Logic](#core-business-logic) - Key implementation files
- [API Interfaces](#http-apis) - Endpoints and server actions
- [Data Layer](#data-layer) - Database schema and relationships
- [Security Implementation](#security) - Authentication and protection measures

### 🎯 **Business Features**
- [User Authentication](#user-authentication--account-management) - Login and account features
- [Payment System](#subscription--payment-system) - Billing and subscriptions
- [AI Features](#ai-powered-features) - AI integrations and capabilities
- [Content Management](#content-management) - Blog, docs, and i18n

### 🚨 **Troubleshooting & References**
- [Known Issues](#known-issues--gotchas) - Common pitfalls and solutions
- [Risk Assessment](#risks--quick-wins) - Identified risks and improvements
- [Complex Integrations](#for-complex-integrations---reference-boilerplate-documentation) - Detailed setup references

### ⚡ **Quick Reference for Common Tasks**

**🎨 UI/Theme Modifications:**
- Change color scheme → [Theme Customization Process](#theme-customization-process)
- Add new components → [Component Creation Patterns](#component-creation-patterns)
- Modify navigation → [Menu Configuration Patterns](#menu-configuration-patterns)

**💰 Business Logic Changes:**
- Update pricing plans → [Pricing & Credit System](#pricing--credit-system)
- Modify user flows → [Critical User Flows](#critical-user-flows)
- Change feature flags → [Feature Toggles](#feature-toggles)

**🔧 Technical Integration:**
- Add new API routes → [HTTP APIs](#http-apis)
- Database modifications → [Data Layer](#data-layer)
- Third-party services → [Complex Integrations](#for-complex-integrations---reference-boilerplate-documentation)

**🌐 Content & Localization:**
- Add new language → [Internationalization](#internationalization-i18n)
- Modify email templates → [Email System](#email-system)
- Update legal pages → [Content Management](#content-management)

---

## Repo Overview

**Purpose**: Loop is a production-ready Next.js 15 SaaS boilerplate for building AI-powered applications with comprehensive features including authentication, payments, internationalization, and content management.

**Architecture Style**: Modular monolith with clear separation of concerns across features, utilizing Next.js App Router architecture

**Core Technology**: 
- Framework: Next.js 15 with App Router
- Runtime: Node.js 20 (Alpine Linux in Docker)
- Language: TypeScript
- Package Manager: pnpm

## Features (PM Language)

### User Authentication & Account Management
- **Multi-provider Login**: Users can sign up and log in using email/password, Google OAuth, or GitHub OAuth
- **Email Verification**: New users must verify their email addresses before accessing the platform
- **Password Recovery**: Users can reset forgotten passwords via email links
- **Profile Management**: Users can update their names, avatars, and account settings
- **Account Security**: Users can change passwords and delete their accounts with proper authentication

### Subscription & Payment System
- **Tiered Pricing Plans**: Three tiers available - Free, Pro (monthly/yearly), and Lifetime
- **Stripe Integration**: Secure payment processing for subscriptions and one-time purchases
- **Customer Portal**: Users can manage their subscriptions through Stripe's customer portal
- **Credit System**: Pay-per-use credits with various packages (Basic, Standard, Premium, Enterprise)
- **Usage Tracking**: Real-time credit balance display and transaction history

### AI-Powered Features
- **Image Generation**: Multiple AI provider support (OpenAI, Replicate, FAL, Fireworks, Google, DeepSeek)
- **Web Content Analysis**: Analyze and extract insights from web pages using Firecrawl integration
- **Text Processing**: AI-powered text generation and analysis capabilities
- **Model Selection**: Users can choose from different AI models and quality settings

### Content Management
- **Blog System**: MDX-powered blog with categories, pagination, and author profiles
- **Documentation**: Fumadocs-powered documentation with search and navigation
- **Internationalization**: Full support for English and Chinese languages
- **Dynamic Pages**: Legal pages (Terms, Privacy, Cookie Policy) with localization

### User Dashboard
- **Analytics Dashboard**: Interactive charts showing usage statistics and metrics
- **Settings Panel**: Comprehensive settings for profile, billing, credits, notifications, and security
- **Admin Panel**: User management interface for administrators with ban/unban capabilities
- **Credit Management**: View credit balance, purchase packages, and track transactions

### Marketing & Growth
- **Newsletter System**: Email subscription management with Resend integration
- **Waitlist Management**: Collect and manage early access signups
- **Contact Forms**: Integrated contact system with email notifications
- **Social Proof**: Testimonials, logo clouds, and statistics sections

### Developer Experience
- **UI Component Library**: Pre-built components using Radix UI and Tailwind CSS
- **Block System**: 100+ ready-to-use UI blocks for rapid development
- **Animation Library**: MagicUI components with modern animations
- **Theme System**: Light/dark mode with multiple theme variations

## Tech Stack & Tooling

### Frontend
- **Core**: Next.js 15.2.1, React 19, TypeScript 5.8.3
- **Styling**: Tailwind CSS 4.0.14, Tailwind Animate, tw-animate-css
- **UI Components**: Radix UI (complete suite), Shadcn UI patterns
- **State Management**: Zustand 5.0.3
- **Forms**: React Hook Form 7.54.2, Zod 4.0.14 validation
- **Animations**: Framer Motion 12.4.7, Canvas Confetti

### Backend & Infrastructure
- **Database**: PostgreSQL with Drizzle ORM 0.39.3
- **Authentication**: Better Auth 1.1.19 with social providers
- **Payments**: Stripe 17.6.0 with subscription management
- **Email**: Resend 4.4.1 for transactional emails and newsletters
- **Storage**: S3-compatible storage with s3mini 0.2.0
- **Background Jobs**: Inngest 3.40.1 for async processing

### AI & Integrations
- **AI Providers**: OpenAI, Replicate, FAL, Fireworks, Google Generative AI, DeepSeek, OpenRouter
- **Web Scraping**: Firecrawl 1.29.1 for content extraction
- **Analytics**: Support for Google Analytics, Umami, OpenPanel, Plausible, Ahrefs, Seline, DataFast
- **Chat**: Crisp SDK for customer support
- **Captcha**: Cloudflare Turnstile for bot protection

### Development Tools
- **Code Quality**: Biome 1.9.4 for linting and formatting
- **Content**: Fumadocs MDX 11.7.3 for documentation
- **Email Dev**: React Email 3.0.7 for template development
- **Database Tools**: Drizzle Kit 0.30.4 for migrations and studio

## Configuration & Customization

### Website Configuration (src/config/website.tsx)

**Core Configuration Hub**: Central configuration file controlling all major website settings, theming, features, and integrations.

**Key Configuration Areas**:

**Metadata & Branding**:
- **Theme Settings**: `defaultTheme` (default|blue|green|amber|neutral), `enableSwitch` for user theme selection
- **Mode Settings**: `defaultMode` (light|dark|system), `enableSwitch` for light/dark toggle
- **Images**: `ogImage`, `logoLight`, `logoDark` for branding and social sharing
- **Social Media**: Twitter, GitHub, Discord, LinkedIn, etc. profile links

**Feature Toggles**:
- `enableDiscordWidget`: Discord integration (deprecated, default: false)
- `enableCrispChat`: Customer support chat (default: true)
- `enableUpgradeCard`: Subscription upgrade prompts (default: true)
- `enableAffonsoAffiliate`: Affonso affiliate tracking (default: false)
- `enablePromotekitAffiliate`: Promotekit affiliate tracking (default: false)
- `enableDatafastRevenueTrack`: Revenue tracking (default: false)
- `enableTurnstileCaptcha`: Cloudflare Turnstile protection (default: false)

**Authentication Configuration**:
- `enableGoogleLogin`: Google OAuth provider toggle
- `enableGithubLogin`: GitHub OAuth provider toggle
- `enableCredentialLogin`: Email/password authentication toggle

**Pricing & Credit System**:
- **Price Plans**: Free, Pro (monthly/yearly), Lifetime with Stripe price IDs
- **Credit Configuration**: Enable/disable credits, registration gifts, expiration rules
- **Credit Packages**: Basic, Standard, Premium, Enterprise with pricing and credit amounts

**Service Integrations**:
- **Analytics**: Vercel Analytics, Speed Insights toggles
- **Routes**: Default login redirect paths
- **Internationalization**: Default locale, supported languages with flags
- **Blog**: Pagination size, related posts configuration
- **Email**: Provider settings (Resend), contact email
- **Newsletter**: Auto-subscription settings, provider configuration
- **Storage**: Provider settings (S3 compatibility)
- **Payment**: Provider settings (Stripe)

### Menu Configuration Patterns

**Navigation Architecture**: Modular menu system with role-based access and internationalization support.

**Navbar Configuration (src/config/navbar-config.tsx)**:
- **Structure**: `getNavbarLinks()` returns `NestedMenuItem[]` array
- **Features**: Dropdown menus with icons, external link support, nested navigation
- **Patterns**: Simple links, dropdown sections, icon integration
- **Example Structure**:
  - Features → Direct link
  - Pricing → Direct link  
  - Blocks → Dropdown with Hero, CTA, Feature sections
  - Resources → Dropdown with Blog, Docs, Support

**Footer Configuration (src/config/footer-config.tsx)**:
- **Structure**: `getFooterLinks()` returns categorized link sections
- **Organization**: Column-based layout with section headers
- **Categories**: Product links, Resource links, Company links, Legal pages
- **Pattern**: Each section has title and nested menu items

**Sidebar Configuration (src/config/sidebar-config.tsx)**:
- **Structure**: `getSidebarLinks()` for dashboard/admin navigation
- **Features**: Role-based visibility (`authorizeOnly` property), expandable sections
- **Authorization**: Admin-only sections, user role filtering
- **Icons**: Consistent icon system for navigation items

**Avatar Dropdown (src/config/avatar-config.tsx)**:
- **Structure**: `getAvatarLinks()` for user profile menu
- **Features**: Dashboard access, billing management, settings navigation
- **Integration**: Credit balance display, logout functionality

**Social Media Links (src/config/social-config.tsx)**:
- **Dynamic Generation**: Based on `website.tsx` social configuration
- **Auto-Population**: Only displays configured social platforms
- **Consistency**: Unified icon system and styling

### Component Customization Workflows

**UI Component Architecture**: Comprehensive component library with 100+ pre-built blocks and modern animation system.

**Core Component Libraries**:
- **Radix UI**: Accessible component primitives (Dialog, Select, Dropdown, etc.)
- **Shadcn/UI**: Design system components with consistent styling
- **MagicUI**: Advanced animations and interactive components
- **Tailark Components**: Additional UI blocks and patterns

**Block System (100+ Ready-to-Use Blocks)**:
- **Hero Sections**: Landing page headers with various layouts
- **Feature Sections**: Product feature showcases with icons and descriptions
- **CTA Blocks**: Call-to-action sections with different styles
- **Testimonial Blocks**: Social proof and customer feedback layouts
- **Pricing Blocks**: Subscription plan displays with feature comparisons
- **FAQ Blocks**: Expandable question/answer sections
- **Contact Blocks**: Contact forms and information displays
- **Footer Blocks**: Various footer layouts with link organization

**Component Creation Patterns**:
- **Location**: `src/components/` organized by feature domain
- **Structure**: Shared components in `/shared`, feature-specific in domain folders
- **Styling**: Tailwind CSS with consistent design tokens
- **TypeScript**: Full type safety with proper interface definitions
- **Accessibility**: WCAG compliance built into all components

**Animation Integration (MagicUI)**:
- **Import Pattern**: Individual component imports for bundle optimization
- **Animation Types**: Fade, slide, bounce, spin, scale transitions
- **Trigger Options**: Scroll-based, hover, click, and timed animations
- **Performance**: Hardware-accelerated transforms, frame rate optimization

**Theme Customization Process**:
1. **Color Schemes**: Modify CSS custom properties in globals.css
2. **Component Variants**: Extend Tailwind config for new color combinations
3. **Dark Mode**: Automatic dark mode support via CSS variables
4. **Typography**: Font family and sizing customization in Tailwind config
5. **Spacing**: Consistent spacing scale modification

**Component Modification Workflow**:
1. **Identify Component**: Locate in `src/components/` directory structure
2. **Check Dependencies**: Review imports and related components
3. **Modify Styling**: Update Tailwind classes or CSS variables
4. **Test Variants**: Verify light/dark mode compatibility
5. **Update Types**: Modify TypeScript interfaces if props change
6. **Document Changes**: Update component documentation if public API changes

## Architecture & Logic

### Directory Structure
- `src/app/` - Next.js App Router pages with internationalized routing
- `src/components/` - Reusable React components organized by feature domain
- `src/lib/` - Utility functions, authentication setup, and shared logic
- `src/db/` - Database schema definitions and migration files
- `src/actions/` - Server actions for API operations (Next.js 15 pattern)
- `src/stores/` - Zustand stores for client-side state management
- `src/hooks/` - Custom React hooks for common functionality
- `src/config/` - Application configuration files
- `src/i18n/` - Internationalization setup and routing
- `src/mail/` - Email templates and mail provider integration
- `src/payment/` - Stripe payment integration and types
- `src/credits/` - Credit system implementation
- `src/ai/` - AI feature implementations (image, text, etc.)
- `content/` - MDX content for blog and documentation
- `messages/` - Translation files for i18n

### Core Business Logic
- **Authentication Flow**: src/lib/auth.ts - Better Auth configuration with social providers
- **Payment Processing**: src/payment/provider/stripe.ts - Stripe webhook handling
- **Credit System**: src/credits/credits.ts - Credit allocation and consumption logic
- **Email System**: src/mail/index.ts - Email template rendering and sending
- **AI Integration**: src/ai/image/lib/provider-config.ts - Multi-provider AI configuration

### Routing Architecture
- Internationalized routing with [locale] parameter
- Protected routes under (protected) group
- Marketing routes under (marketing) group
- Authentication routes under auth/
- API routes under api/ with server actions pattern

## Interfaces

### HTTP APIs
- `POST /api/auth/[...all]` - Better Auth endpoints (login, register, verify, etc.)
- `POST /api/webhooks/stripe` - Stripe webhook handler for payment events
- `POST /api/generate-images` - AI image generation endpoint
- `POST /api/analyze-content` - Web content analysis endpoint
  - Scrapes URLs using Firecrawl
  - Analyzes content with AI models (DeepSeek, Google, OpenAI)
  - Automatically deducts credits from user balance
- `POST /api/storage/upload` - S3 file upload endpoint
- `GET /api/inngest` - Inngest webhook for background jobs
- `GET /api/search` - Search API for documentation
- `GET /api/hello` - Health check endpoint
- `GET /api/ping` - Simple ping endpoint

### Server Actions (src/actions/)
- User management: get-users.ts
- Subscription: get-active-subscription.ts, get-lifetime-status.ts
- Credits: get-credit-balance.ts, consume-credits.ts, get-credit-stats.ts
- Checkout: create-checkout-session.ts, create-credit-checkout-session.ts
- Newsletter: subscribe-newsletter.ts, unsubscribe-newsletter.ts
- Validation: validate-captcha.ts
- Messaging: send-message.ts

### CLI Commands
- `pnpm dev` - Development server
- `pnpm build` - Production build
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Apply migrations
- `pnpm db:studio` - Database GUI
- `pnpm email` - Email template development
- `pnpm lint` - Code linting
- `pnpm format` - Code formatting

## Data Layer

### Database Engine
- PostgreSQL (via DATABASE_URL environment variable)
- Drizzle ORM for type-safe database operations
- Connection pooling via postgres.js

### Core Data Entities

**User Management**:
- `user` table: Core user data with role, ban status, customer ID
- `session` table: Active user sessions with token management
- `account` table: OAuth and credential account linking
- `verification` table: Email verification tokens

**Payment & Subscriptions**:
- `payment` table: Subscription and payment records with Stripe IDs
- Status tracking, period management, trial support

**Credit System**:
- `user_credit` table: Current credit balance per user
- `credit_transaction` table: Credit purchase and consumption history
- Expiration date tracking and remaining amount management

### Data Relationships
- User -> Sessions (one-to-many)
- User -> Accounts (one-to-many)  
- User -> Payments (one-to-many)
- User -> Credits (one-to-one)
- User -> Credit Transactions (one-to-many)

### Database Indices
Optimized indices on:
- User IDs, customer IDs, roles
- Session tokens and user references
- Payment types, status, subscription IDs
- Credit transaction types and user IDs

## Events & Jobs

### Background Processing
- **Inngest Integration**: src/inngest/functions.ts
- Async job processing for long-running tasks
- Event-driven architecture support

### Webhook Events
- **Stripe Webhooks**: Payment events (subscription created, updated, deleted)
- Customer portal sessions
- Checkout completions

### Scheduled Tasks
- **Credit Distribution**: Daily job (`distribute-credits-daily`) runs at 1 AM Shanghai time
  - Cron: `TZ=Asia/Shanghai 0 1 * * *`
  - Distributes daily credit allowance to users
  - Defined in src/inngest/functions.ts
- Credit expiration processing
- Subscription renewal checks
- Newsletter campaigns (via Resend)

## Security

### Authentication & Authorization
- **Better Auth**: Secure session management with cookie caching
- OAuth 2.0 with Google and GitHub
- Email verification required for new accounts
- Password reset via secure email tokens
- Admin role-based access control
- **Server Action Security**: User validation checks in all server actions
  - Example: Payment actions verify `session.user.id === userId`
  - Prevents cross-user data access
  - Enforced at the action level (src/actions/)

### Data Protection
- Environment variable management for secrets
- Secure cookie configuration with httpOnly flags
- CSRF protection via Better Auth
- SQL injection prevention via Drizzle ORM parameterized queries

### Third-party Security
- Stripe webhook signature verification
- Cloudflare Turnstile CAPTCHA for forms
- OAuth state parameter validation
- API key management for AI providers

### Configuration Security
All sensitive data stored in environment variables:
- Database credentials
- OAuth client secrets
- API keys for services
- Webhook secrets

## Operations

### Build & Deployment
- **Docker Support**: Multi-stage Dockerfile for optimized production images
- Node.js 20 Alpine base image
- Next.js standalone output for minimal container size
- Environment-based configuration

### Deployment Platforms
- Vercel (vercel.json configuration)
- Cloudflare Pages support
- Docker container deployment
- Traditional Node.js hosting

### Monitoring & Analytics
Multiple analytics provider support:
- Vercel Analytics & Speed Insights
- Google Analytics
- Third-party analytics (Umami, OpenPanel, Plausible, etc.)

### Infrastructure
- CDN-ready static assets
- Image optimization configuration
- Database migration system
- Background job processing

## Critical User Flows

### User Registration Flow
1. User submits registration form → 
2. Server action creates user in Better Auth →
3. Verification email sent via Resend →
4. User clicks verification link →
5. Account activated, newsletter subscription created →
6. Initial credits allocated

### Payment Processing Flow
1. User initiates checkout (subscription/credits) →
2. Stripe checkout session created →
3. User completes payment on Stripe →
4. Webhook received at /api/webhooks/stripe →
5. Payment record created/updated →
6. Credits allocated or subscription activated →
7. Email confirmation sent

### Credit Consumption Flow
1. User triggers AI action →
2. consume-credits action checks balance →
3. If sufficient, deducts credits →
4. Creates transaction record →
5. Updates user_credit balance →
6. Returns success/failure to UI

## State Management

### Zustand Stores
- **users-store.ts**: Admin user list management, pagination, filtering
- **locale-store.ts**: Language preference persistence
- **payment-store.ts**: Subscription status, payment history cache
- **credits-store.ts**: Credit balance, transaction history, real-time updates

## Middleware Layer

### Request Processing Pipeline
- **src/middleware.ts**: Main middleware orchestrator
  - Authentication checks for protected routes
  - Locale detection and routing
  - Request logging and monitoring
- **src/i18n/routing.ts**: Internationalization middleware
  - Language detection from URL/headers
  - Redirect logic for default locale

## Testing

### Testing Strategy
- No automated test suite currently implemented
- Manual testing approach
- Development environment for testing

### Code Quality
- **Biome**: Linting and formatting enforcement
- TypeScript for type safety
- Zod for runtime validation
- ESLint configuration via Biome

## Configuration Requirements

### Required Environment Variables
**Database**:
- DATABASE_URL: PostgreSQL connection string

**Authentication**:
- BETTER_AUTH_URL: Auth service URL
- BETTER_AUTH_SECRET: Session encryption key
- GOOGLE_CLIENT_ID/SECRET: Google OAuth
- GITHUB_CLIENT_ID/SECRET: GitHub OAuth

**Payments**:
- STRIPE_SECRET_KEY: Stripe API key
- STRIPE_WEBHOOK_SECRET: Webhook signature verification
- STRIPE_PRICE_ID_*: Product price IDs

**AI Services**:
- OPENAI_API_KEY: OpenAI services
- REPLICATE_API_TOKEN: Replicate AI
- FAL_KEY: FAL AI service
- FIRECRAWL_API_KEY: Web scraping
- DEEPSEEK_API_KEY: DeepSeek AI
- GOOGLE_GENERATIVE_AI_API_KEY: Google AI

**Email**:
- RESEND_API_KEY: Email service
- EMAIL_FROM: Sender address

**Storage**:
- S3_ACCESS_KEY_ID: S3 credentials
- S3_SECRET_ACCESS_KEY: S3 secret
- S3_BUCKET_NAME: Storage bucket
- S3_REGION: AWS region

**Analytics** (Optional):
- GOOGLE_ANALYTICS_ID: Google Analytics
- UMAMI_URL/ID: Umami analytics
- Various other analytics providers

## Error Handling

### Error Boundaries
- **Global Error**: src/app/[locale]/error.tsx - Catches all unhandled errors
- **Component Error**: src/components/layout/error.tsx - Reusable error UI

### Server Action Patterns
- All actions use next-safe-action for type-safe error handling
- Consistent error response format: {error: string, code?: string}
- Zod validation on all inputs
- Try-catch blocks with proper error messages

## Email System

### Email Templates (src/mail/templates/)
- **verify-email.tsx**: Sent on user registration
- **forgot-password.tsx**: Password reset requests
- **contact-message.tsx**: Contact form submissions
- **subscribe-newsletter.tsx**: Newsletter welcome email

### Email Trigger Points
- User registration → Verification email
- Password reset request → Reset link email
- Contact form submission → Admin notification
- Newsletter signup → Welcome email
- Payment success → Receipt email (via Stripe)
- Credit purchase → Transaction receipt

## Development Workflow

### Initial Setup
1. Clone repository
2. Copy env.example to .env.local
3. Configure PostgreSQL database
4. Run `pnpm install`
5. Run `pnpm db:migrate` to setup database
6. Configure Stripe webhooks (use Stripe CLI for local dev)
7. Run `pnpm dev` to start development

### Common Development Tasks
- **Add new translation**: Edit messages/[locale].json
- **Create new API endpoint**: Add to src/app/api/
- **Add server action**: Create in src/actions/ with next-safe-action
- **Modify database**: Edit schema.ts, run db:generate then db:migrate
- **Test emails**: Run `pnpm email` for email development server
- **Add UI component**: Use components from src/components/ or create new
- **Update documentation**: Edit MDX files in content/docs/

## Performance Optimizations

### Caching Strategies
- Better Auth session caching in cookies
- Stripe customer data cached in database
- Static content cached via Next.js ISR
- Image optimization via Next.js Image component
- API responses cached where appropriate

### Database Optimizations
- Indexed foreign keys for fast lookups
- Connection pooling via postgres.js
- Efficient query patterns with Drizzle ORM
- Batch operations for bulk updates

### Frontend Optimizations
- Code splitting with dynamic imports
- Image lazy loading and optimization
- Bundle size optimization
- Prefetching for navigation

## For Complex Integrations - Reference Boilerplate Documentation

### When Atlas Information Isn't Sufficient

**This atlas covers architectural understanding and common modifications. For detailed step-by-step setup procedures and complex integrations, reference the comprehensive boilerplate documentation:**

### Environment & Initial Setup
- **Complete Environment Variables Setup** → `docs/boilerplate_doc.md#environment-variables`
- **Database Provider Configuration** → `docs/boilerplate_doc.md#database-setup`
- **Initial Project Setup Workflow** → `docs/boilerplate_doc.md#getting-started`

### Authentication & Security
- **OAuth Provider Setup (Google/GitHub)** → `docs/boilerplate_doc.md#authentication-setup`
- **Better Auth Advanced Configuration** → `docs/boilerplate_doc.md#auth-configuration`
- **Security Headers & CSRF Setup** → `docs/boilerplate_doc.md#security-configuration`

### Payment & Subscription Setup
- **Stripe Account Configuration** → `docs/boilerplate_doc.md#payment-setup`
- **Webhook Endpoint Setup** → `docs/boilerplate_doc.md#stripe-webhooks`
- **Subscription Plan Creation** → `docs/boilerplate_doc.md#subscription-configuration`
- **Customer Portal Configuration** → `docs/boilerplate_doc.md#customer-portal`

### Email & Communication
- **Resend API Setup & Domain Verification** → `docs/boilerplate_doc.md#email-setup`
- **Email Template Development** → `docs/boilerplate_doc.md#email-templates`
- **Newsletter Integration (Resend Audiences)** → `docs/boilerplate_doc.md#newsletter-setup`
- **Crisp Chat Integration** → `docs/boilerplate_doc.md#chatbox-setup`

### Storage & File Management
- **S3-Compatible Storage Setup** → `docs/boilerplate_doc.md#storage-setup`
- **File Upload Configuration** → `docs/boilerplate_doc.md#file-upload-workflow`
- **CDN & Asset Optimization** → `docs/boilerplate_doc.md#storage-optimization`

### AI & External Services
- **AI Provider API Key Setup** → `docs/boilerplate_doc.md#ai-features-setup`
- **OpenAI, Replicate, FAL Configuration** → `docs/boilerplate_doc.md#ai-providers`
- **Firecrawl Web Scraping Setup** → `docs/boilerplate_doc.md#content-analysis`

### Analytics & Monitoring
- **Google Analytics Setup** → `docs/boilerplate_doc.md#analytics-setup`
- **Multiple Analytics Providers** → `docs/boilerplate_doc.md#analytics-providers`
- **Vercel Analytics Configuration** → `docs/boilerplate_doc.md#vercel-analytics`
- **Performance Monitoring Setup** → `docs/boilerplate_doc.md#monitoring`

### Deployment & Production
- **Vercel Deployment Guide** → `docs/boilerplate_doc.md#vercel-deployment`
- **Cloudflare Workers Deployment** → `docs/boilerplate_doc.md#cloudflare-deployment`
- **Docker & Self-Hosting** → `docs/boilerplate_doc.md#docker-deployment`
- **Environment Variable Management** → `docs/boilerplate_doc.md#production-env-vars`

### Advanced Integrations
- **Background Jobs (Inngest)** → `docs/boilerplate_doc.md#background-jobs`
- **Cloudflare Turnstile Captcha** → `docs/boilerplate_doc.md#captcha-setup`
- **Affiliate System Integration** → `docs/boilerplate_doc.md#affiliates-setup`
- **Custom Domain Configuration** → `docs/boilerplate_doc.md#custom-domains`

### Internationalization & Localization
- **Adding New Languages** → `docs/boilerplate_doc.md#i18n-setup`
- **Translation File Management** → `docs/boilerplate_doc.md#translation-workflow`
- **Locale-Specific Configuration** → `docs/boilerplate_doc.md#locale-configuration`

### Development Workflow
- **IDE Setup (Cursor Documentation Panel)** → `docs/boilerplate_doc.md#ide-setup`
- **Local Development Environment** → `docs/boilerplate_doc.md#development-setup`
- **Testing & Quality Assurance** → `docs/boilerplate_doc.md#testing-workflow`

**Usage Pattern**: Start with atlas for understanding architecture and modification points, then reference specific boilerplate doc sections for detailed implementation procedures.

### Decision Framework: Atlas vs. Boilerplate Doc

**✅ Use Atlas For** (90% of customization tasks):
- Modifying existing features (pricing, navigation, themes)
- Understanding component relationships and dependencies
- Quick reference for file locations and patterns
- Business logic modifications and user flow changes
- Database schema understanding and minor modifications
- Configuration changes and feature toggle adjustments

**📚 Reference Boilerplate Doc For** (10% of tasks):
- Initial project setup from scratch
- Adding completely new third-party integrations
- Complex deployment and infrastructure setup
- Step-by-step provider configuration (Stripe, email, storage)
- Troubleshooting environment and deployment issues
- Advanced security configuration and compliance setup

## Known Issues & Gotchas

### Common Pitfalls
1. **Stripe Webhooks**: Must use raw body for signature verification
2. **Internationalization**: Always wrap text in translation functions
3. **Server Actions**: Must use 'use server' directive
4. **Database Migrations**: Never edit existing migrations, create new ones
5. **Environment Variables**: Some providers require specific formatting
6. **File Uploads**: S3 CORS configuration required for direct uploads
7. **Email Development**: Resend has rate limits in test mode
8. **TypeScript Paths**: Use @ alias for src/ imports
9. **Biome Config**: Some files excluded from linting (see biome.json)
10. **Next.js Caching**: Development vs production caching behavior differs

## Risks & Quick Wins

### Identified Risks

1. **No Automated Testing**: **CRITICAL** - Single most significant risk
   - No unit, integration, or E2E tests present
   - Complex payment and credit logic is fragile without tests
   - Makes safe modifications extremely difficult
2. **No Rate Limiting**: High risk - API endpoints and server actions vulnerable
   - No protection against denial-of-service attacks
   - Potential for brute-force attempts on authentication
3. **Secret Management**: High risk - Heavy reliance on process.env
   - Risk of exposure without secure management system
   - No validation of environment variables on startup
4. **Multiple AI Provider Dependencies**: Medium risk - Potential for API changes or service disruptions
5. **Complex Configuration**: Medium risk - Many environment variables required for full functionality
6. **Database Migration Management**: Low risk - Manual migration process could lead to inconsistencies

### Quick Wins

1. **Add Unit Tests for Server Actions**: **HIGHEST PRIORITY**
   - Start with testing framework (Vitest recommended)
   - Focus on server actions in src/actions/ (pure functions, easy to test)
   - Prioritize credit consumption and payment logic
2. **Implement API Rate Limiting**: 
   - Add @upstash/ratelimit or similar solution
   - Apply to API routes and server actions
   - Prevent abuse and protect against attacks
3. **Environment Variable Validation**:
   - Use Zod to parse and validate process.env on startup
   - Prevent app from starting with invalid configuration
   - Document all required variables
4. **CI Pipeline with Linting**:
   - Set up GitHub Actions to run `biome check .` on PRs
   - Maintain code quality standards
   - Add as pre-merge requirement
5. **Error Monitoring**: Add Sentry or similar error tracking service
6. **Database Backup Strategy**: Implement automated backup procedures
7. **Performance Monitoring**: Add Web Vitals tracking and performance budgets
8. **Security Headers**: Implement security headers middleware
9. **Documentation Enhancement**: Expand inline code documentation
10. **Dependency Updates**: Regular dependency updates with automated PRs