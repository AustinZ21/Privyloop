# PrivyLoop E2E Test Suite

Comprehensive end-to-end testing suite for the PrivyLoop privacy platform using Playwright.

## Overview

This E2E test suite covers:
- **Authentication flows** (login, registration, logout)
- **Dashboard navigation** and user interface
- **Browser extension** functionality
- **Privacy scanning** features
- **Cross-browser compatibility**
- **Mobile responsiveness**

## Quick Start

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
npx playwright install

# Run all E2E tests
pnpm test:e2e

# Run tests with UI mode
pnpm test:e2e:ui

# Run tests in headed mode (visible browser)
pnpm test:e2e:headed

# Debug specific test
pnpm test:e2e:debug -- --grep "should login"
```

## Test Structure

```
tests/e2e/
├── auth/                 # Authentication tests
│   ├── login.spec.ts     # Login functionality
│   ├── register.spec.ts  # Registration flow
│   └── logout.spec.ts    # Logout behavior
├── dashboard/            # Dashboard tests
│   └── navigation.spec.ts # Navigation and UI
├── extension/            # Browser extension tests
│   └── privacy-scanner.spec.ts # Extension functionality
├── fixtures/             # Test data and selectors
│   ├── selectors.ts      # Centralized selectors
│   └── test-users.ts     # Test user data
└── utils/               # Test utilities
    └── test-helpers.ts  # Common test functions
```

## Test Categories

### Authentication Tests
- Login with valid/invalid credentials
- Registration with validation
- Email verification flow
- Password requirements
- Social authentication (if configured)
- Session management
- Logout functionality

### Dashboard Tests
- Navigation between pages
- User interface elements
- Search functionality
- Mobile responsiveness
- Permission-based access
- Error handling

### Browser Extension Tests
- Extension loading and initialization
- Privacy policy scanning
- Threat level assessment
- Privacy score calculation
- Settings persistence
- Dashboard integration

## Configuration

### Environment Variables
```bash
PLAYWRIGHT_BASE_URL=http://localhost:3030  # Application base URL
DATABASE_URL=postgresql://...              # Test database
BETTER_AUTH_SECRET=your-test-secret        # Auth secret for tests
```

### Playwright Configuration
The main configuration is in `playwright.config.ts`:
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile device testing
- Automatic test retry on CI
- Screenshot and video capture on failure
- HTML test reports

## Test Data Management

### Test Users
Predefined test users in `fixtures/test-users.ts`:
- `validUser`: For successful authentication tests
- `adminUser`: For admin functionality tests
- `invalidUser`: For negative testing scenarios

### Selectors
Centralized selectors in `fixtures/selectors.ts`:
- Data-testid based selectors for reliability
- Organized by feature/page
- Helper functions for complex selections

### Test Helpers
Common utilities in `utils/test-helpers.ts`:
- Form filling and validation
- Navigation helpers
- Authentication state management
- Error handling
- Screenshot capture

## Running Tests

### Local Development
```bash
# Run all tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e tests/e2e/auth/login.spec.ts

# Run tests matching pattern
pnpm test:e2e --grep "login"

# Run tests for specific browser
pnpm test:e2e --project=chromium

# Run in debug mode
pnpm test:e2e:debug
```

### CI/CD Integration
Tests automatically run on:
- Pull requests to main/develop branches
- Pushes to main/develop branches  
- Daily scheduled runs (2 AM UTC)
- Manual workflow dispatch

CI features:
- Multi-browser testing matrix
- Visual regression testing
- Test artifacts upload
- Failure screenshots and videos

## Browser Extension Testing

Extension tests require special setup:
- Extension loading from `packages/extension`
- Non-headless mode for extension API access
- Service worker communication
- Cross-origin testing capabilities

Example extension test:
```typescript
const pathToExtension = path.join(__dirname, '../../../packages/extension');
const context = await chromium.launchPersistentContext('', {
  headless: false,
  args: [`--load-extension=${pathToExtension}`]
});
```

## Best Practices

### Test Writing
1. **Use data-testid selectors** for reliability
2. **Test user scenarios**, not implementation details
3. **Handle async operations** properly with wait strategies
4. **Clean up test data** between tests
5. **Use descriptive test names** that explain the scenario

### Selector Strategy
```typescript
// Good - stable and descriptive
await page.locator('[data-testid="login-submit-button"]').click();

// Avoid - fragile and implementation-dependent
await page.locator('#form button.primary').click();
```

### Error Handling
```typescript
// Always handle potential failures
const errorExists = await helpers.elementExists('[data-testid="error"]');
if (errorExists) {
  await expect(page.locator('[data-testid="error"]')).toBeVisible();
}
```

## Debugging

### Common Issues
1. **Timing issues**: Use proper wait strategies
2. **Flaky selectors**: Verify elements are stable
3. **Authentication state**: Ensure proper login/logout
4. **Network issues**: Mock external dependencies

### Debug Tools
```bash
# Run with browser visible
pnpm test:e2e:headed

# Interactive debug mode
pnpm test:e2e:debug

# Generate trace files
pnpm test:e2e --trace on

# Update screenshots
pnpm test:e2e --update-snapshots
```

### Playwright Inspector
The Playwright Inspector provides:
- Step-by-step test execution
- DOM inspection at each step
- Console output and network requests
- Screenshot comparison tools

## Visual Testing

Visual regression tests compare screenshots:
- Baseline images stored in repository
- Automatic comparison on CI
- Diff generation for failures
- Manual approval workflow

## Mobile Testing

Tests include mobile viewports:
- iPhone 12, Pixel 5 emulation
- Touch interaction testing
- Responsive design validation
- Mobile-specific UI elements

## Performance Testing

Basic performance assertions:
- Page load times
- API response times
- Resource loading validation
- Core Web Vitals monitoring

## Maintenance

### Regular Tasks
- Update test data for changing requirements
- Review and update selectors for UI changes
- Maintain browser compatibility
- Update CI configuration for new environments

### Monitoring
- Test execution time trends
- Failure rate analysis
- Cross-browser compatibility issues
- CI resource usage optimization

## Troubleshooting

### Common Failures
- **Network timeouts**: Increase timeout values or improve wait conditions
- **Element not found**: Verify selectors and element visibility
- **Authentication issues**: Check test user data and auth configuration
- **Extension issues**: Verify extension build and loading

### Support
For issues or questions:
1. Check existing GitHub issues
2. Review test logs and screenshots
3. Run tests locally with debug mode
4. Contact the development team

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Add appropriate test data to fixtures
3. Update selectors file for new elements
4. Include both positive and negative scenarios
5. Add CI configuration if needed

### Test Requirements
- All new features require E2E test coverage
- Tests must pass on all supported browsers
- Mobile compatibility testing required
- Performance impact assessment needed