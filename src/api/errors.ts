import axios from 'axios'

/** Extracts the message the server actually sent, falling back to axios's own message. */
export function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Unexpected error'
  }

  const data = error.response?.data
  return typeof data?.message === 'string' ? data.message : error.message
}
