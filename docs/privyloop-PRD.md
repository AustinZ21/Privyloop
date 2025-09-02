# 📋 loopwho - Product Requirements Document (PRD)

## Executive Summary

**Product Name**: loopwho
**Product Type**: Privacy Dashboard Web Application
**Target Market**: Privacy-conscious individuals and professionals
**Platform**: Web Application + Browser Extension
**Development Approach**: MVP leveraging MkSaaS boilerplate foundation

## 1. Product Vision & Goals

### Vision Statement
Empower users to understand and control their digital privacy across major platforms through automated monitoring and plain-English insights.

### Primary Goals
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

## 2. Target Audience

### Primary Users
- **Privacy-Conscious Professionals** (35-50 years old)
  - High digital footprint across multiple platforms
  - Limited time for manual privacy management
  - Value data security and transparency

- **Tech-Savvy Millennials** (25-40 years old)
  - Active on social media and cloud services
  - Interested in privacy but overwhelmed by complexity
  - Willing to use browser extensions and tools

### Secondary Users
- **Digital Rights Advocates**: Users who want comprehensive privacy auditing
- **Corporate Users**: Professionals managing business accounts across platforms

## 3. Core Features & Requirements

### 3.1 MVP Features (Must-Have)

#### User Onboarding & Authentication
- **Multi-Provider Login**: Email/password, Google OAuth, GitHub OAuth
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
  - **Tertiary**: Gemini Vision OCR for image-based privacy settings
- **Supported Platforms (MVP)**:
  - Google (Ads, Activity, Location, YouTube)
  - Microsoft (Privacy Dashboard, Xbox, Office 365)
  - Facebook/Meta (Privacy Settings, Ad Preferences)

#### Privacy Dashboard
- **Corporate Privacy Cards**: Individual cards for each connected platform (Google, Microsoft, Facebook, etc.)
- **Add Corporate Button**: Prominent button to connect new privacy platforms
- **Upgrade Prompts**: Dialog appears when free users try to add 3rd+ corporate card
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

### 3.2 Future Features (Post-MVP)

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

## 4. User Stories & Acceptance Criteria

### Epic 1: User Onboarding
**As a new user, I want to quickly set up my privacy monitoring so I can start tracking my digital footprint.**

#### User Story 1.1: Account Creation
- **Given** I am a new visitor to loopwho
- **When** I click "Sign Up" and complete the registration form
- **Then** I receive a verification email and can activate my account
- **And** I am guided to install the browser extension

#### User Story 1.2: First Corporate Card Connection
- **Given** I have an activated account and installed extension
- **When** I click "Add Corporate" button on my empty dashboard
- **Then** I see a list of supported platforms (Google, Microsoft, Facebook)
- **When** I click "Connect Google"
- **Then** I'm prompted with "Allow loopwho to check your Google privacy settings in the background?"
- **And** after clicking "Yes, check my settings", the extension opens Google's privacy page in a hidden tab
- **And** the extension automatically scans my Google privacy settings without me seeing the tab
- **And** I see a new Google corporate privacy card on my dashboard within 2 minutes

### Epic 2: Privacy Monitoring
**As an active user, I want to understand my current privacy settings and track changes over time.**

#### User Story 2.1: Privacy Dashboard View
- **Given** I have connected services to my account
- **When** I visit my dashboard
- **Then** I see all my privacy settings organized by platform and category
- **And** each setting has a plain-English explanation of its impact

#### User Story 2.2: Change Detection
- **Given** a platform has modified my privacy settings
- **When** the next scan occurs
- **Then** I see highlighted changes in my dashboard
- **And** I can view before/after comparisons of the modified settings

### Epic 3: Privacy Action
**As a privacy-conscious user, I want to easily modify my privacy settings based on recommendations.**

#### User Story 3.1: Privacy Recommendations
- **Given** I have privacy settings that could be improved
- **When** I view my dashboard
- **Then** I see AI-generated recommendations with risk assessments
- **And** I can click direct links to modify settings on the original platforms
- **And** I can optionally trigger a new background scan to verify my changes

#### User Story 3.2: Upgrade Flow (Free User Limit)
- **Given** I am a free user with 2 corporate cards already connected
- **When** I click "Add Corporate" button
- **Then** I see an upgrade dialog: "Free users can monitor 2 corporate platforms. Upgrade to Pro for unlimited monitoring."
- **And** I see pricing: "$7.8/month or $78/year for unlimited corporate cards"
- **When** I click "Upgrade to Pro", I'm taken to the payment page
- **And** after successful payment, I can add unlimited corporate cards

## 5. Technical Requirements

### 5.1 Database & Storage Requirements
- **Core (Opensource)**: Self-hosted PostgreSQL 15+ with local file storage
- **Enterprise**: Supabase PostgreSQL with TimescaleDB extension + Cloudflare R2 storage
- **Data Format**: Privacy content stored as structured Markdown files
- **Time-Series Data**: Change tracking and historical analysis (Enterprise only)

### 5.2 External Service Dependencies
- **AI Service**: Google Gemini API for privacy analysis and recommendations
- **Web Scraping**: Firecrawl API for fallback content extraction when DOM changes
- **Email Service**: SMTP/Nodemailer (Core) or Resend (Enterprise) for notifications
- **Payment Processing**: Stripe integration (Enterprise only) for subscription management

### 5.3 Performance Requirements
- **Dashboard Load Time**: < 2 seconds for initial page load
- **Extension Scan Time**: < 5 minutes per platform scan
- **API Response Time**: < 500ms for dashboard data queries
- **Uptime**: 99.5% availability target

### 5.2 Security Requirements
- **Data Encryption**: All privacy data encrypted at rest and in transit
- **No Credential Storage**: Extension uses session-based authentication only
- **GDPR Compliance**: User data deletion and export capabilities
- **Audit Trail**: Complete logging of all privacy data access

### 5.3 Scalability Requirements
- **User Capacity**: Support 10,000+ concurrent users in MVP
- **Data Storage**: Efficient storage of versioned privacy snapshots
- **API Rate Limiting**: Respect platform API limits and implement backoff strategies
- **Database Performance**: Sub-second query response times for dashboard views

### 5.4 Compatibility Requirements
- **Browser Support**: Chrome, Firefox, Edge (Manifest v3 compatible)
- **Extension Permissions**: `tabs`, `activeTab`, `storage` for background tab management
- **Platform Support**: Windows, macOS, Linux
- **Mobile Responsiveness**: Full functionality on mobile devices
- **Screen Readers**: WCAG 2.1 AA compliance for accessibility

## 6. Business Requirements

### 6.1 Monetization Strategy (Source-Available + Freemium)
- **Source-Available Code**: Full codebase visible on GitHub under Business Source License
- **Personal Use License**: Free for individuals, educational, and non-commercial use
- **Commercial Use Restriction**: Prevents competitors from offering paid competing services
- **Hosted Service**: Managed version at loopwho.com with freemium model
- **Subscription Tiers**:
  - **Free**: 2 corporate privacy cards, manual scans
  - **Pro ($7.8/month or $78/year)**: Unlimited corporate cards, automated daily scans
- **Self-Hosted**: Free for personal/non-commercial use with full features

### 6.2 Legal & Compliance
- **Terms of Service**: Clear data handling and user rights
- **Privacy Policy**: Transparent about own data collection practices
- **Platform Compliance**: Adherence to each platform's scraping policies
- **International Privacy Laws**: GDPR, CCPA, and other regional compliance

### 6.3 Support & Documentation
- **User Documentation**: Comprehensive help center and FAQs
- **Video Tutorials**: Step-by-step guides for setup and usage
- **Customer Support**: Email support with 24-hour response time
- **Community Forum**: User community for sharing privacy tips and strategies

## 7. Risk Assessment & Mitigation

### 7.1 Technical Risks
- **Platform Changes**: Privacy page layouts change frequently
  - *Mitigation*: Fallback OCR system and rapid update deployment
- **API Rate Limits**: Platforms may restrict automated access
  - *Mitigation*: Intelligent scheduling and user-distributed scanning
- **Extension Store Approval**: Browser stores may reject extension
  - *Mitigation*: Strict adherence to store policies and early submission

### 7.2 Business Risks
- **Legal Challenges**: Platforms may object to scraping activities
  - *Mitigation*: Legal review and compliance with terms of service
- **Market Competition**: Existing privacy tools may dominate
  - *Mitigation*: Focus on unique value proposition of automated plain-English insights
- **User Adoption**: Users may not trust browser extension
  - *Mitigation*: Transparent security practices and open-source components

## 8. Success Criteria & KPIs

### 8.1 MVP Success Metrics (3 months post-launch)
- **User Registration**: 1,000+ registered users
- **Extension Installs**: 850+ extension installations
- **Platform Connections**: 1,500+ total platform connections
- **User Retention**: 60% users active after 30 days
- **Privacy Actions**: 500+ users take action on recommendations

### 8.2 Growth Metrics (6 months post-launch)
- **User Base**: 5,000+ registered users
- **Revenue**: $5,000+ MRR (if premium features launched)
- **Platform Coverage**: 5+ major platforms supported
- **User Satisfaction**: 4.5+ average rating
- **Organic Growth**: 30% users acquired through referrals

### 8.3 Quality Metrics (Ongoing)
- **Scan Accuracy**: 95%+ accuracy in privacy setting detection
- **False Positives**: < 5% false change alerts
- **System Uptime**: 99.5%+ availability
- **Support Response**: < 24 hours average support response time

## 9. Dependencies & Assumptions

### 9.1 Technical Dependencies
- **MkSaaS Boilerplate**: Foundation for rapid development
- **Gemini API**: AI-powered privacy explanations
- **Supabase**: Database and authentication services
- **Cloudflare R2**: Storage for privacy snapshots
- **Browser Extension Stores**: Distribution platform approval

### 9.2 Business Assumptions
- **User Demand**: Significant demand for automated privacy monitoring
- **Platform Stability**: Major platforms maintain relatively stable privacy page structures
- **Legal Environment**: Current legal framework allows privacy monitoring tools
- **Technical Feasibility**: Browser extensions can reliably access and scrape privacy settings

### 9.3 Resource Assumptions
- **Development Team**: 2-3 developers for 4-month MVP development
- **Budget**: $50,000+ for development, infrastructure, and legal review
- **Timeline**: 4 months from development start to MVP launch
- **User Testing**: Access to 20+ beta users for testing and feedback

## 10. Acceptance Criteria

### 10.1 MVP Launch Readiness
- [ ] All core features implemented and tested
- [ ] Browser extension approved in Chrome Web Store
- [ ] Security audit completed with no critical vulnerabilities
- [ ] Legal review completed for all major markets
- [ ] Performance benchmarks met for dashboard and extension
- [ ] User documentation and support systems operational
- [ ] Analytics and monitoring systems implemented
- [ ] Beta testing completed with positive feedback

### 10.2 Feature Completeness
- [ ] User can register, verify email, and install extension
- [ ] User can connect and scan Google, Microsoft, and Facebook privacy settings
- [ ] Dashboard displays privacy settings with plain-English explanations
- [ ] Change detection works accurately with visual diff display
- [ ] AI recommendations provide actionable privacy improvements
- [ ] Direct links to platform privacy pages function correctly
- [ ] Historical privacy data is stored and accessible
- [ ] System handles errors gracefully with user-friendly messages

This PRD serves as the definitive guide for product development, ensuring all stakeholders understand the vision, requirements, and success criteria for the loopwho privacy dashboard MVP.
