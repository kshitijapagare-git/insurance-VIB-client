import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export function registerErrorInterceptor(onError: (message: string) => void) {
  const id = apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? error.message)
        : 'Unexpected error'
      onError(message)
      return Promise.reject(error)
    },
  )
  return () => apiClient.interceptors.response.eject(id)
}
