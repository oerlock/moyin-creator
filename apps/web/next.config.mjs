import path from 'node:path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/__api_proxy',
        destination: '/api/__api_proxy',
      },
    ]
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(process.cwd(), '../../src'),
      '@opencut/ai-core/services/prompt-compiler': path.resolve(process.cwd(), '../../packages/core/src/services/prompt-compiler.ts'),
      '@opencut/ai-core/api/task-poller': path.resolve(process.cwd(), '../../packages/core/src/api/task-poller.ts'),
      '@opencut/ai-core/protocol': path.resolve(process.cwd(), '../../packages/core/src/protocol/index.ts'),
      '@opencut/ai-core': path.resolve(process.cwd(), '../../packages/core/src/index.ts'),
    }
    return config
  },
}

export default nextConfig
