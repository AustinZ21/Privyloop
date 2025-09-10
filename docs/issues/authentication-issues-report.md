# Authentication Issues Report

**Date**: 2025-09-06  
**Reporter**: User Testing  
**Status**: Investigation Complete, Fixes Pending  

## Executive Summary

Four critical authentication issues identified during user testing that prevent proper signup flow and email verification. Issues range from UX problems to database inconsistencies and OAuth configuration problems.

## Issue #1: Automatic Email Resend with Countdown Timer ❌ CRITICAL

### Description
Signup success page automatically sends verification email with 60-second countdown instead of providing manual resend option.

### Current Behavior
- User completes signup
- Automatically redirected to success page
- Email immediately sent without user consent
- 60-second countdown timer prevents manual resend
- User has no control over email sending timing

### Expected Behavior  
- Show success page with verification instructions
- Provide manual "Send Verification Email" button
- Allow user to choose when to send/resend emails
- Optional cooldown only after manual sends

### Root Cause
**File**: `packages/web/src/app/signup-success/SignupSuccessForm.tsx`  
**Lines**: 66-70  
```typescript
// Automatically send verification email on mount if email is provided
useEffect(() => {
  if (state.email && !state.lastSentAt) {
    handleResendVerification();
  }
}, [state.email]);
```

### Impact
- Poor user experience
- Unwanted email sending
- No user control over verification flow

### Fix Approach
1. Remove automatic email sending on component mount
2. Show instructions with manual "Send Verification Email" button
3. Implement cooldown only after manual user actions
4. Add proper loading states and user feedback

---

## Issue #2: Multiple Emails with Invalid Tokens ⚠️ HIGH

### Description
User receives multiple verification emails (3 total): one with broken link, two with "invalid-token" errors.

### Current Behavior
- User attempts signup
- Receives 3 verification emails
- First email has broken verification link (redirects to error)
- Additional emails contain tokens that return `{"code":"invalid-token","message":"invalid_token"}`

### Root Cause Analysis
Multiple potential causes identified:

1. **Race Conditions**: Automatic sending (Issue #1) + manual resends create multiple tokens
2. **Better Auth Token Management**: Improper token lifecycle management
3. **Email Service Duplication**: Email service may be sending duplicates
4. **Database Inconsistencies**: Two user tables may cause token conflicts

### Files to Investigate
- `packages/core/src/auth/index.ts` - Better Auth configuration
- `packages/core/src/services/email.ts` - Email service logic  
- `packages/web/src/app/api/auth/send-verification/route.ts` - Verification API
- `packages/core/src/database/schema/auth-tables.ts` - Verification table schema

### Fix Approach
1. **Add Debug Logging**: Implement comprehensive auth flow logging
2. **Token Lifecycle Review**: Audit Better Auth verification token generation
3. **Email Service Audit**: Prevent duplicate email sending
4. **Database Cleanup**: Resolve table conflicts (see Issue #4)
5. **Race Condition Prevention**: Ensure single token per verification attempt

---

## Issue #3: Social Login Bypassing OAuth Authorization ⚠️ HIGH  

### Description
GitHub and Google social login buttons redirect directly to dashboard without showing OAuth consent screen.

### Current Behavior
- User clicks "Sign up with GitHub/Google" 
- Directly redirected to dashboard (no OAuth popup)
- User account created in database
- Missing proper OAuth consent flow

### Expected Behavior
- Click social login button
- Redirect to OAuth provider (GitHub/Google)
- Show consent screen for app permissions  
- User grants/denies access
- Redirect back to app with authorization code
- Complete OAuth flow and create session

### Root Cause Analysis
Multiple potential causes:

1. **Previously Authorized**: User already granted consent to OAuth apps
2. **Missing Environment Variables**: CLIENT_ID/CLIENT_SECRET not properly configured
3. **Redirect URL Misconfiguration**: OAuth app settings incorrect
4. **Better Auth Configuration**: Social provider setup issues

### Files to Investigate
- `packages/core/src/auth/index.ts:35-52` - Social provider configuration
- `.env.local.example` - Environment variable templates
- OAuth app settings on GitHub/Google developer consoles

### Environment Variables to Check
```bash
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=  
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
OAUTH_REDIRECT_BASE_URL=https://<app-domain>
# Example callback paths (must match provider settings)
OAUTH_CALLBACK_PATH_GOOGLE=/api/auth/callback/google
OAUTH_CALLBACK_PATH_GITHUB=/api/auth/callback/github
```

### Fix Approach
1. **Environment Audit**: Verify all OAuth environment variables
2. **OAuth App Review**: Check GitHub/Google app configurations
3. **Redirect URL Validation**: Ensure correct callback URLs
4. **Better Auth Debug**: Enable OAuth flow logging
5. **PKCE & CSRF**: Enforce PKCE (S256), state, and nonce (OIDC) checks end-to-end
6. **Consent Prompt**: Verify prompt=consent (Google) when needed; test new accounts/incognito
7. **Callback Whitelist**: Restrict redirect URIs to exact allowlist
8. **Consent Screen Testing**: Test with fresh OAuth apps if needed

---

## Issue #4: Database Table Inconsistencies ❌ CRITICAL

### Description
Two separate user tables exist causing data fragmentation and foreign key conflicts.

### Current State
- **PrivyLoop Users Table** (`users`): Full user schema with subscription, preferences
- **Better Auth User Table** (`user`): Minimal auth-only schema
- Both tables active in database schema
- Account table references Better Auth `user` table only
- Data split between both tables

### Database Schema Conflict
**File**: `packages/core/src/database/schema/index.ts`
```typescript
export const schema = {
  users,        // PrivyLoop table (line 90)
  // ...
  user,         // Better Auth table (line 97)
  // NOTE: Consider renaming to 'users' to avoid reserved-word conflicts 
  session,
  account,      // References 'user' table only
  verification,
  // ...
}
```

### Impact
- User data fragmented across tables
- Foreign key constraint violations
- Authentication state inconsistencies  
- Database cleanup script issues

### Fix Approach Options

#### Option A: Single Unified Table (Recommended)
1. Extend Better Auth `user` table with PrivyLoop fields
2. Migrate existing data from `users` to enhanced `user` table
3. Update all references to use single table
4. Remove duplicate `users` table

#### Option B: Separate but Linked Tables  
1. Add foreign key relationship between tables
2. Ensure Better Auth uses `user` for authentication
3. Use `users` for application-specific data
4. Implement proper data synchronization

### Files Affected
- `packages/core/src/database/schema/users.ts` - PrivyLoop schema
- `packages/core/src/database/schema/auth-tables.ts` - Better Auth schema
- `packages/core/src/database/schema/index.ts` - Schema exports
- `packages/core/src/auth/index.ts` - Better Auth configuration
- Database migration scripts

---

## Priority & Impact Matrix

| Issue | Priority | User Impact | Technical Debt | Fix Complexity |
|-------|----------|-------------|----------------|----------------|
| #1 Automatic Resend | HIGH | High | Medium | Low |  
| #2 Invalid Tokens | HIGH | Critical | High | Medium |
| #3 OAuth Bypass | MEDIUM | Medium | Medium | Medium |
| #4 Database Tables | CRITICAL | High | Critical | High |

## Recommended Fix Order

1. **Issue #4 (Database)** - Foundation fix, enables proper debugging
2. **Issue #1 (Auto-resend)** - Quick UX improvement, reduces token conflicts  
3. **Issue #2 (Invalid Tokens)** - Core functionality fix
4. **Issue #3 (OAuth)** - Complete authentication experience

## Testing Requirements

### Pre-Fix Testing  
- [ ] Document current behavior with screenshots
- [ ] Export current database state
- [ ] Test all authentication flows with detailed logging

### Post-Fix Testing
- [ ] Email signup with manual verification
- [ ] Social login OAuth flow validation  
- [ ] Database consistency verification
- [ ] Cross-browser authentication testing
- [ ] Edge case testing (expired tokens, duplicate emails)

## Risk Assessment

**High Risk**: Database schema changes require careful migration  
**Medium Risk**: Better Auth configuration changes may affect existing sessions  
**Low Risk**: Frontend UX improvements are isolated changes

## Additional Recommendations

1. **Enhanced Logging**: Implement comprehensive auth flow logging for better debugging
2. **PII-Safe Logging**: Mask emails and never log raw tokens/codes; include correlation IDs
3. **Testing Suite**: Add automated tests for authentication flows
4. **Documentation**: Create authentication flow documentation for developers
5. **Retention**: Define log retention and access controls