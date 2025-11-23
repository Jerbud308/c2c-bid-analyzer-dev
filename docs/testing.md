# Testing Guide

Comprehensive testing documentation for the C2C Bid Analyzer.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The C2C Bid Analyzer uses a multi-layered testing approach to ensure code quality and catch bugs before production:

- **Unit Tests**: Test individual functions and modules in isolation
- **Integration Tests**: Test API interactions and data flow
- **E2E Tests**: Test complete user workflows (when frontend is implemented)

### Testing Stack

- **Vitest**: Fast, Vite-native test runner for unit and integration tests
- **Testing Library**: React component testing utilities
- **MSW (Mock Service Worker)**: API mocking for integration tests
- **Playwright**: End-to-end testing framework
- **GitHub Actions**: Automated CI/CD testing

## Quick Start

### Installation

```bash
# Install all dependencies including testing libraries
npm install
```

### Run All Tests

```bash
# Run unit and integration tests
npm test

# Run with coverage report
npm run test:coverage

# Run with interactive UI
npm run test:ui
```

### Run E2E Tests (requires frontend)

```bash
# Run E2E tests
npm run test:e2e

# Run with Playwright UI
npm run test:e2e:ui
```

## Test Types

### 1. Unit Tests

Test individual functions and utilities in isolation.

**Location**: `src/lib/__tests__/`

**Example**: Testing utility functions

```typescript
// src/lib/__tests__/utils.test.ts
describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1048576)).toBe('1.0 MB')
  })
})
```

### 2. Integration Tests

Test API client interactions with mocked backend responses.

**Location**: `src/lib/__tests__/`

**Example**: Testing API calls

```typescript
// src/lib/__tests__/api.test.ts
describe('API Client', () => {
  it('should upload PDF and return opportunity ID', async () => {
    const formData = createMockFormData()
    const result = await api.uploadBid(formData)

    expect(result.success).toBe(true)
    expect(result.opportunity_id).toBeDefined()
  })
})
```

### 3. Component Tests (Future)

Test React components in isolation.

**Location**: `src/components/__tests__/`

**Example**: Testing a component

```typescript
// src/components/__tests__/BidUpload.test.tsx
describe('BidUpload Component', () => {
  it('should render upload form', () => {
    render(<BidUpload />)
    expect(screen.getByText(/upload bid package/i)).toBeInTheDocument()
  })
})
```

### 4. E2E Tests

Test complete user flows from upload to analysis.

**Location**: `tests/e2e/`

**Example**: Testing upload flow

```typescript
// tests/e2e/upload-flow.spec.ts
test('should upload and view analysis', async ({ page }) => {
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', 'sample.pdf')
  await page.fill('input[name="title"]', 'Test Project')
  await page.click('button:has-text("Upload")')

  await expect(page.locator('text=View Analysis')).toBeVisible()
})
```

## Running Tests

### Watch Mode (Recommended for Development)

```bash
# Automatically rerun tests on file changes
npm test
```

### Single Run

```bash
# Run once and exit
npm test -- --run
```

### Run Specific Tests

```bash
# Run tests in a specific file
npm test -- src/lib/__tests__/api.test.ts

# Run tests matching a pattern
npm test -- --grep "upload"
```

### Visual Test Runner

```bash
# Open Vitest UI for interactive testing
npm run test:ui
```

### Coverage Report

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

## Writing Tests

### Test Structure

Use descriptive test names that explain what is being tested:

```typescript
describe('Component/Function Name', () => {
  describe('specific functionality', () => {
    it('should do something specific when condition', () => {
      // Arrange: Set up test data
      const input = 'test'

      // Act: Execute the code being tested
      const result = someFunction(input)

      // Assert: Verify the result
      expect(result).toBe('expected')
    })
  })
})
```

### Using Mock Data

Import reusable mock data from fixtures:

```typescript
import {
  mockOpportunity,
  mockAnalysis,
  createMockFormData
} from '@/test/fixtures/mockData'

it('should process opportunity', () => {
  const opportunity = createMockOpportunity({ title: 'Custom Title' })
  // Test with mock data
})
```

### Mocking API Responses

Use MSW to mock API responses:

```typescript
import { server } from '@/test/setup'
import { http, HttpResponse } from 'msw'

it('should handle server errors', async () => {
  // Override default handler for this test
  server.use(
    http.post('*/upload-bid-package', () => {
      return HttpResponse.json(
        { error: 'Server error' },
        { status: 500 }
      )
    })
  )

  await expect(api.uploadBid(formData)).rejects.toThrow()
})
```

### Testing Async Code

Always use async/await with API calls:

```typescript
it('should handle async operations', async () => {
  const result = await api.checkStatus('test-id')
  expect(result.processing_status).toBe('completed')
})
```

### Testing Error Scenarios

Test both success and failure paths:

```typescript
describe('error handling', () => {
  it('should handle 404 errors', async () => {
    server.use(errorHandlers.statusNotFound)

    await expect(api.checkStatus('invalid-id')).rejects.toThrow(ApiError)
    await expect(api.checkStatus('invalid-id')).rejects.toThrow(/not found/i)
  })
})
```

## Test Coverage

### Coverage Targets

We aim for **>80% code coverage** across the codebase:

- **Lines**: 80%+
- **Functions**: 80%+
- **Branches**: 80%+
- **Statements**: 80%+

### Viewing Coverage

```bash
# Generate and view coverage report
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory:

- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format (for CI tools)
- Terminal output shows summary

### Coverage Configuration

Coverage settings are in `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'lcov'],
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.test.ts',
    '**/*.test.tsx'
  ],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80
  }
}
```

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:

- **Push** to `main`, `develop`, or `claude/**` branches
- **Pull requests** to `main` or `develop`

### Workflow Jobs

1. **Unit & Integration Tests**
   - Runs on Node.js 18.x and 20.x
   - Generates coverage report
   - Uploads coverage to Codecov

2. **E2E Tests** (when frontend exists)
   - Runs Playwright tests
   - Uploads test reports as artifacts

3. **Lint** (when configured)
   - Runs ESLint checks

### Viewing CI Results

- Check the **Actions** tab in GitHub
- Coverage reports uploaded to Codecov
- Test artifacts available for download

### Local CI Simulation

```bash
# Run all checks like CI does
npm run type-check
npm run test:coverage
npm run lint  # (when configured)
npm run test:e2e  # (when frontend exists)
```

## Best Practices

### 1. Write Tests First (TDD)

Consider writing tests before implementation:

```typescript
// 1. Write the test
it('should calculate total price', () => {
  expect(calculateTotal([100, 200])).toBe(300)
})

// 2. Implement the function
export function calculateTotal(prices: number[]): number {
  return prices.reduce((sum, price) => sum + price, 0)
}
```

### 2. Test Behavior, Not Implementation

Focus on what the code does, not how it does it:

```typescript
// ✅ Good - tests behavior
it('should format file size to human-readable string', () => {
  expect(formatFileSize(1024)).toBe('1.0 KB')
})

// ❌ Bad - tests implementation details
it('should divide by 1024 and use toFixed(1)', () => {
  expect(formatFileSize(1024).includes('toFixed')).toBe(true)
})
```

### 3. Keep Tests Fast

- Mock external dependencies (APIs, databases)
- Use in-memory implementations where possible
- Avoid unnecessary waits or sleeps

### 4. One Assertion Per Test (Usually)

Make tests focused and easy to debug:

```typescript
// ✅ Good - focused test
it('should return success true', () => {
  expect(result.success).toBe(true)
})

it('should return opportunity ID', () => {
  expect(result.opportunity_id).toBeDefined()
})

// ⚠️ Acceptable - related assertions
it('should return valid upload response', () => {
  expect(result.success).toBe(true)
  expect(result.opportunity_id).toBeDefined()
  expect(result.document_id).toBeDefined()
})
```

### 5. Use Descriptive Test Names

```typescript
// ✅ Good
it('should return green for scores >= 80', () => {})

// ❌ Bad
it('works correctly', () => {})
```

### 6. Clean Up After Tests

Vitest automatically cleans up, but be mindful:

```typescript
afterEach(() => {
  cleanup() // React Testing Library cleanup
  server.resetHandlers() // Reset MSW handlers
})
```

### 7. Don't Test External Libraries

Trust that libraries like React, Supabase, etc. are tested:

```typescript
// ❌ Don't test library behavior
it('should call React.useState', () => {})

// ✅ Test your code that uses the library
it('should update state when button is clicked', () => {})
```

## Troubleshooting

### Tests Failing Locally but Passing in CI

- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version matches CI (18.x or 20.x)
- Clear test cache: `npm test -- --clearCache`

### MSW Not Intercepting Requests

- Ensure MSW server is started in `setup.ts`
- Check URL patterns match your requests
- Use `--` in patterns for wildcards: `*/functions/v1/upload`

### Import Errors

- Check path aliases in `tsconfig.json` and `vitest.config.ts`
- Ensure `@/*` resolves to `./src/*`

### Coverage Not Meeting Threshold

- Run `npm run test:coverage` to see which files need coverage
- Add tests for uncovered branches and functions
- Check `coverage/index.html` for detailed breakdown

### E2E Tests Timing Out

- Increase timeout in test: `test('...', { timeout: 60000 })`
- Check that dev server is running
- Verify baseURL in `playwright.config.ts`

### Environment Variables Not Working

- Check `src/test/setup.ts` for env mocking
- Use `import.meta.env` for Vite env vars
- Ensure `.env` files are loaded

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

## Questions?

If you encounter issues or have questions:

1. Check this documentation
2. Review existing tests for examples
3. Check test output and error messages
4. Review CI/CD logs in GitHub Actions
