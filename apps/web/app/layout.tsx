import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '魔因漫创',
  description: 'AI 驱动的动漫/短剧分镜创作工具',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
