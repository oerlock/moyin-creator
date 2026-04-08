import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'

import { taskStore, type TaskRecord } from './store'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    type?: string
    payload?: unknown
  }

  const id = randomUUID()
  const now = new Date().toISOString()

  const task: TaskRecord = {
    id,
    type: body.type || 'generic',
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    payload: body.payload,
  }

  taskStore.set(id, task)

  return NextResponse.json({ task })
}

export async function GET() {
  const tasks = Array.from(taskStore.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return NextResponse.json({ tasks })
}

