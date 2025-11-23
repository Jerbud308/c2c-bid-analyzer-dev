/**
 * Vitest global test setup
 *
 * This file runs before all tests and configures the testing environment,
 * including MSW for API mocking and testing library cleanup.
 */

import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

/**
 * Mock Service Worker server for intercepting HTTP requests
 */
export const server = setupServer(...handlers)

/**
 * Start MSW server before all tests
 * onUnhandledRequest: 'warn' - warns about unhandled requests instead of erroring
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
})

/**
 * Reset handlers and cleanup after each test
 * This ensures tests don't interfere with each other
 */
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

/**
 * Stop MSW server after all tests
 */
afterAll(() => {
  server.close()
})

/**
 * Mock environment variables for testing
 */
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-123')

/**
 * Mock import.meta.env for Vite environment variables
 */
;(globalThis as any).import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key-123',
      DEV: false
    }
  }
}
