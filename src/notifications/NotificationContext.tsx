import { Alert, Snackbar } from '@mui/material'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { registerErrorInterceptor } from '../api/client'

type Notify = (message: string) => void

const NotificationContext = createContext<Notify | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)

  const notify = useCallback<Notify>((msg) => setMessage(msg), [])

  useEffect(() => registerErrorInterceptor(notify), [notify])

  const handleClose = () => setMessage(null)

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Snackbar open={message !== null} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="error" variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  )
}

export function useNotify() {
  const notify = useContext(NotificationContext)
  if (!notify) throw new Error('useNotify must be used within NotificationProvider')
  return notify
}
