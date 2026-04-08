import { NextRequest, NextResponse } from 'next/server'
import { taskStore, type WebTaskStatus } from '../store'

export async function GET(_: NextRequest, context: { params: { id: string } }) {
  const task = taskStore.get(context.params.id)
  if (!task) {
    return NextResponse.json({ error: 'task not found' }, { status: 404 })
  }
  return NextResponse.json({ task })
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  const task = taskStore.get(context.params.id)
  if (!task) {
    return NextResponse.json({ error: 'task not found' }, { status: 404 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    status?: WebTaskStatus
    result?: unknown
    error?: string
  }

  task.status = body.status || task.status
  if (body.result !== undefined) task.result = body.result
  if (body.error !== undefined) task.error = body.error
  task.updatedAt = new Date().toISOString()

  return NextResponse.json({ task })
}
