import { NextRequest, NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

async function proxyRequest(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url')
  if (!urlParam) {
    return NextResponse.json({ error: 'Missing ?url= parameter' }, { status: 400, headers: CORS_HEADERS })
  }

  try {
    const proxyHeadersRaw = req.headers.get('x-proxy-headers')
    let forwardHeaders: Record<string, string> = {}
    if (proxyHeadersRaw) {
      try {
        forwardHeaders = JSON.parse(proxyHeadersRaw)
      } catch {
        // ignore parse errors
      }
    }

    const response = await fetch(urlParam, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.arrayBuffer() : undefined,
    })

    const contentType = response.headers.get('content-type')
    const responseBody = await response.arrayBuffer()

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        ...CORS_HEADERS,
        ...(contentType ? { 'Content-Type': contentType } : {}),
      },
    })
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'unknown error'
    return NextResponse.json(
      { error: 'Proxy request failed', detail },
      {
        status: 502,
        headers: CORS_HEADERS,
      },
    )
  }
}

export async function GET(req: NextRequest) {
  return proxyRequest(req)
}

export async function POST(req: NextRequest) {
  return proxyRequest(req)
}

export async function PUT(req: NextRequest) {
  return proxyRequest(req)
}

export async function DELETE(req: NextRequest) {
  return proxyRequest(req)
}
