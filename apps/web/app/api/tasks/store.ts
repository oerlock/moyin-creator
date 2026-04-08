export type WebTaskStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled'

export type TaskRecord = {
  id: string
  type: string
  status: WebTaskStatus
  createdAt: string
  updatedAt: string
  payload?: unknown
  result?: unknown
  error?: string
}

export const taskStore = new Map<string, TaskRecord>()
