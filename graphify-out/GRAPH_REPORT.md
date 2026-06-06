# Graph Report - Privyloop  (2026-06-06)

## Corpus Check
- 140 files · ~148,694 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 688 nodes · 975 edges · 95 communities (87 shown, 8 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2415576a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]

## God Nodes (most connected - your core abstractions)
1. `TemplateSystemImpl` - 27 edges
2. `PlatformRegistry` - 23 edges
3. `GoogleScraper` - 22 edges
4. `LinkedInScraper` - 21 edges
5. `FacebookScraper` - 20 edges
6. `ScrapingEngine` - 19 edges
7. `FirecrawlService` - 18 edges
8. `TestHelpers` - 16 edges
9. `getDb()` - 13 edges
10. `EmailService` - 12 edges

## Surprising Connections (you probably didn't know these)
- `createAuth()` --calls--> `getDb()`  [INFERRED]
  packages/core/src/auth/index.ts → packages/core/src/database/connection.ts
- `main()` --calls--> `clearSeedData()`  [INFERRED]
  packages/core/scripts/db-seed.ts → packages/core/src/database/seeds/index.ts
- `setupDatabase()` --calls--> `getConnectionInfo()`  [INFERRED]
  packages/core/scripts/db-setup.ts → packages/core/src/database/connection.ts
- `GET()` --calls--> `getDb()`  [INFERRED]
  packages/web/src/app/api/ai/analysis/route.ts → packages/core/src/database/connection.ts
- `POST()` --calls--> `getDb()`  [INFERRED]
  packages/web/src/app/api/ai/analysis/refresh/route.ts → packages/core/src/database/connection.ts

## Communities (95 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (21): handleResendVerification(), doRedirect(), handleForgotPassword(), handleSocialLogin(), handleSubmit(), validateForm(), RecaptchaBadge(), doRedirect() (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (4): generateTemplateVersion(), TemplateSystemImpl, PerformanceTimer, isEqual()

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (25): GET(), getConnectionOptions(), closeConnection(), createConnection(), getConnectionInfo(), getDb(), testConnection(), initializeDatabase() (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (14): ScrapingEngine, isScrapingSuccess(), calculatePrivacyRisk(), countExtractedSettings(), detectChanges(), detectChangesFromPrevious(), ensureTemplateExists(), getPreviousSnapshot() (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (11): BasePlatformScraper, calculateConfidenceScore(), countExtractedElements(), FacebookContentScraper, getPlatformScrapers(), GoogleContentScraper, handleMessage(), handleScanRequest() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (8): handleAuthAction(), ProtectedRoute(), useAuthState(), DialogManagerClass, useDialogManager(), handleItemClick(), useRouter(), useSearchParams()

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (4): LinkedInScraper, createMockTemplate(), PerformanceTimer, scanPromise()

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (22): assessRiskLevel(), calculateConfidenceScore(), canScrape(), categorizeSettings(), countExpectedElements(), countExtractedElements(), createErrorResult(), createSuccessResult() (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (21): buildUrlFromPattern(), checkForPrivacyPage(), ensureContentScriptInjected(), generateScanId(), getAuthHeaders(), getPlatformConfigForUrl(), getPlatformConfigs(), getScanQueue() (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (4): buildTemplateAnalysisPrompt(), AIAnalysisService, GeminiClient, OpenAIClient

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (7): createAuth(), EmailService, createAuthLog(), generateCorrelationId(), logAuth(), maskEmail(), maskUrl()

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (7): useAuthRecaptcha(), usePasswordRecaptcha(), useRecaptcha(), isRecaptchaEnabled(), loadRecaptcha(), RecaptchaService, verifyRecaptcha()

### Community 17 - "Community 17"
Cohesion: 0.24
Nodes (9): canAddPrivacyCard(), createUser(), getUserById(), incrementPrivacyCardsUsed(), requestUserDeletion(), updateLastLogin(), updateUser(), updateUserSubscription() (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (3): togglePlatformStatus(), updatePlatform(), updatePlatformConfig()

### Community 20 - "Community 20"
Cohesion: 0.42
Nodes (12): detectPlatformForActiveTab(), formatRelative(), getUserId(), init(), initSettingsUI(), loadPlatformConfigs(), loadSettings(), qs() (+4 more)

### Community 22 - "Community 22"
Cohesion: 0.45
Nodes (11): detectPlatformForActiveTab(), getUserId(), init(), initSettingsUI(), loadPlatformConfigs(), loadSettings(), qs(), saveSettings() (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.47
Nodes (6): detectDeploymentMode(), getAuthFeatureFlags(), getFeatureFlags(), getPlatformConfig(), isFeatureEnabled(), withFeatureFlag()

### Community 24 - "Community 24"
Cohesion: 0.36
Nodes (7): getCurrentUser(), isAdmin(), validateAdminAccess(), DELETE(), GET(), POST(), PUT()

### Community 25 - "Community 25"
Cohesion: 0.48
Nodes (5): createTestPlatform(), createTestPrivacySnapshot(), createTestPrivacyTemplate(), createTestScenario(), createTestUser()

### Community 28 - "Community 28"
Cohesion: 0.38
Nodes (3): markTestStatus(), runAutoTests(), updateTestStatus()

### Community 30 - "Community 30"
Cohesion: 0.6
Nodes (3): getFallbackFeatureFlags(), getFeatureFlags(), isEnterpriseFeatureEnabled()

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TemplateSystemImpl` connect `Community 1` to `Community 3`, `Community 6`, `Community 8`, `Community 14`, `Community 21`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `PlatformRegistry` connect `Community 8` to `Community 24`, `Community 3`, `Community 6`, `Community 14`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `ScrapingEngine` connect `Community 3` to `Community 8`, `Community 6`, `Community 14`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._