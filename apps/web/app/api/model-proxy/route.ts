import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      url?: string
      method?: string
      headers?: Record<string, string>
      payload?: unknown
    }

    if (!body?.url) {
      return NextResponse.json({ error: 'missing target url' }, { status: 400 })
    }

    const method = (body.method || 'POST').toUpperCase()
    const upstream = await fetch(body.url, {
      method,
      headers: body.headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(body.payload ?? {}),
    })

    const text = await upstream.text()
    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8'

    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'content-type': contentType },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'proxy failed' },
      { status: 500 },
    )
  }
}
