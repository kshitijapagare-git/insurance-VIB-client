import { afterAll, afterEach, beforeAll } from 'vitest'
import { resetPolicyMocks } from './mocks/handlers'
import { server } from './mocks/server'
import '@testing-library/jest-dom/vitest'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  server.resetHandlers()
  resetPolicyMocks()
})

afterAll(() => server.close())
