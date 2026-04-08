import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'Moyin Creator Next MVP',
  description: 'Next.js MVP shell for Moyin Creator',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
