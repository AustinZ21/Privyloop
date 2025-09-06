# Token Management System

## Overview

The token management system provides secure, database-backed verification token handling with TTL enforcement, automatic revocation, and idempotency support.

## Architecture

### Database Schema

The `verification` table handles all verification tokens with the following key features:

```typescript
// Enhanced verification table with constraints
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(), // email address
  value: text("value").notNull(), // token value
  purpose: varchar("purpose", { length: 50 }).notNull().default('email_verification'),
  status: varchar("status", { length: 20 }).notNull().default('active'),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
  revokedAt: timestamp("revokedAt"),
  usedAt: timestamp("usedAt"),
}, (table) => ({
  // Only one active token per user+purpose combination
  uniqueActiveToken: unique("verification_user_purpose_active_unique")
    .on(table.userId, table.purpose).where(table.status.eq('active')),
  // Efficient token lookups
  tokenValueIdx: index("verification_value_idx").on(table.value),
  // Cleanup query optimization
  statusExpiresIdx: index("verification_status_expires_idx").on(table.status, table.expiresAt),
}));
```

### Token States

- **active**: Token is valid and can be used
- **used**: Token has been consumed (single use)
- **expired**: Token has passed its TTL
- **revoked**: Token was explicitly revoked

## Token Lifecycle

### 1. Token Creation (`issueVerificationToken`)

```typescript
const token = await tokenManager.issueVerificationToken(email, 'email_verification');
```

**Process:**
1. Generate cryptographically secure 32-byte hex token
2. Set 15-minute TTL from creation time
3. Revoke any existing active tokens for same user+purpose
4. Insert new token with `active` status
5. Database constraint ensures only one active token per user+purpose

### 2. Token Validation (`validateAndConsumeToken`)

```typescript
const result = await tokenManager.validateAndConsumeToken(token, 'email_verification');
// Returns: { valid: boolean, email?: string, expired?: boolean }
```

**Process:**
1. Look up token by value and purpose
2. Check if token exists and is `active`
3. Verify expiration time
4. Mark token as `used` and set `usedAt` timestamp
5. Return validation result with email

### 3. Token Cleanup

**Automatic Expiration:**
```typescript
await tokenManager.cleanupExpiredTokens();
```
- Marks expired `active` tokens as `expired`
- Should be run as scheduled job every 5-15 minutes

**Manual Revocation:**
```typescript
await tokenManager.revokeAllUserTokens(userId);
```
- Revokes all active tokens for a user (e.g., on password change)

## Security Features

### Database-Level Constraints

1. **Cascading Deletion**: Tokens deleted when user is deleted
2. **Indexed Lookups**: Efficient token validation and cleanup queries
3. **Composite Index**: Optimized queries for user+purpose+status combinations

### Application-Level Security

1. **Cryptographic Tokens**: 32-byte random tokens (256-bit entropy)
2. **Short TTL**: 15-minute expiration window
3. **Single Use**: Tokens automatically marked as used when consumed
4. **Atomic Revocation**: Database transactions ensure only one active token per user+purpose
5. **Automatic Cleanup**: Expired tokens marked for audit trail preservation

### Rate Limiting Integration

The verification endpoint includes:
- 3 requests per hour per IP+email combination
- Idempotency key support (15-minute cache window)
- Cached rate limit responses

## API Integration

### Send Verification Endpoint

```typescript
POST /api/auth/send-verification
Headers: { 
  "Content-Type": "application/json",
  "X-Idempotency-Key": "optional-unique-key" // prevents duplicate sends
}
Body: { "email": "user@example.com" }
```

**Features:**
- Automatic token revocation for previous active tokens
- Rate limiting with cached responses
- Idempotency support for preventing duplicate emails
- Database-backed token storage

### Token Validation

```typescript
// In verify-email endpoint
import { validateVerificationToken } from '../send-verification/route';

const isValid = await validateVerificationToken(token, email);
```

## Error Handling

### Token Validation Errors

- **Token not found**: `{ valid: false }`
- **Token expired**: `{ valid: false, expired: true }`
- **Token valid**: `{ valid: true, email: "user@email.com" }`

### Database Constraint Violations

- Duplicate active tokens prevented by unique constraint
- Graceful handling of concurrent token requests

## Performance Considerations

### Indexes

- `verification_value_idx`: Fast token lookup by value
- `verification_status_expires_idx`: Efficient cleanup queries
- Unique constraint index: Prevents duplicate active tokens

### Cleanup Strategy

- **Scheduled cleanup**: Run `cleanupExpiredTokens()` every 5-15 minutes
- **Memory cleanup**: In-memory rate limiter and idempotency cache cleaned every 10 minutes
- **Database growth**: Expired/used tokens remain for audit purposes

## Migration from Previous System

The new system replaces:
- In-memory token storage → Database storage
- 24-hour TTL → 15-minute TTL (more secure)
- Manual token management → Automatic revocation
- No idempotency → Full idempotency support

## Testing

```typescript
import { createTokenManager } from '@privyloop/core/services/token-management';
import { createTestScenario } from '@privyloop/core/database/testing';

const db = getTestDb();
const tokenManager = createTokenManager(db);

// Test token lifecycle
const token = await tokenManager.issueVerificationToken('test@example.com');
const result = await tokenManager.validateAndConsumeToken(token, 'email_verification');
expect(result.valid).toBe(true);
```

## Monitoring

Track the following metrics:
- Token creation rate
- Token validation success/failure rates
- Expired token cleanup frequency
- Rate limiting trigger frequency
- Database constraint violations

## Security Considerations

1. **Token Entropy**: 256-bit cryptographic randomness
2. **TTL Security**: Short 15-minute window reduces attack surface
3. **Single Use**: Prevents token replay attacks
4. **Automatic Revocation**: Prevents token accumulation
5. **Database Constraints**: Prevents race conditions and duplicate tokens