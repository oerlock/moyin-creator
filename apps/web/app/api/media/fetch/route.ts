import { NextRequest, NextResponse } from 'next/server'

const MAX_BYTES = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string }
    const target = body?.url

    if (!target) {
      return NextResponse.json({ error: 'missing url' }, { status: 400 })
    }

    if (!/^https?:\/\//.test(target)) {
      return NextResponse.json({ error: 'only http(s) url is supported' }, { status: 400 })
    }

    const response = await fetch(target)
    if (!response.ok) {
      return NextResponse.json({ error: `upstream status ${response.status}` }, { status: 502 })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const buffer = Buffer.from(await response.arrayBuffer())

    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'file too large (>10MB)' }, { status: 413 })
    }

    const dataUrl = `data:${contentType};base64,${buffer.toString('base64')}`
    return NextResponse.json({ dataUrl })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'media fetch failed' },
      { status: 500 },
    )
  }
}
