export type PatientRecord = {
  patient_id: string
  bed_number?: string
  status?: string
  heart_rate: number
  temperature: number
  respiratory_rate: number
  spo2: number
  systolic_bp: number
  wbc: number
  lactate: number
  creatinine: number
}

export type AlertRecord = {
  alert_id: string
  patient_id: string
  risk_level: string
  priority: string
  message: string
  timestamp: string
  dismissed: boolean
  top_factors: string[]
}

export type PredictionResult = {
  patient_id: string
  timestamp: string
  risk_score: number
  risk_level: string
  alert: boolean
  priority: string
  model_version: string
  top_factors: string[]
  scores: {
    ensemble: number
    xgboost: number
    lstm: number
  }
}

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`
  }

  return ''
}

const getWebSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
  }

  return ''
}

const safeFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const base = getApiBaseUrl()
  if (!base) {
    throw new Error('API base URL is not configured')
  }

  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(errorText || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const getPatients = async (): Promise<PatientRecord[]> => {
  return safeFetch<PatientRecord[]>('/patients')
}

export const getAlerts = async (includeDismissed = false): Promise<AlertRecord[]> => {
  return safeFetch<AlertRecord[]>(`/alerts?include_dismissed=${includeDismissed}`)
}

export const dismissAlert = async (alertId: string): Promise<void> => {
  await safeFetch(`/alerts/${encodeURIComponent(alertId)}/dismiss`, {
    method: 'POST',
  })
}

export const createPredictionWebSocket = (
  onMessage: (message: unknown) => void,
  onOpen?: () => void,
  onClose?: () => void,
  onError?: (event: Event) => void,
) => {
  const url = getWebSocketUrl()
  if (!url) {
    throw new Error('WebSocket URL is not configured')
  }

  const socket = new WebSocket(url)

  socket.onopen = () => {
    onOpen?.()
  }

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data)
      onMessage(payload)
    } catch {
      onMessage(event.data)
    }
  }

  socket.onclose = () => {
    onClose?.()
  }

  socket.onerror = (event) => {
    onError?.(event)
  }

  return socket
}
