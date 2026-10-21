import { Alert, Snackbar, type AlertColor } from '@mui/material'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { registerErrorInterceptor } from '../api/client'

type Notify = (message: string, severity?: AlertColor) => void

interface Notification {
  message: string
  severity: AlertColor
}

const NotificationContext = createContext<Notify | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<Notification | null>(null)

  // Failures from the shared axios interceptor have no severity of their own, so 'error' is the default.
  const notify = useCallback<Notify>(
    (msg, severity = 'error') => setNotification({ message: msg, severity }),
    [],
  )

  useEffect(() => registerErrorInterceptor(notify), [notify])

  const handleClose = () => setNotification(null)

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Snackbar open={notification !== null} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={notification?.severity ?? 'error'} variant="filled">
          {notification?.message}
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
