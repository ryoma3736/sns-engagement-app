import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { AuthButton } from '@/components/AuthButton'

export const metadata: Metadata = {
  title: 'SNS Engagement App - インプレッション最大化',
  description: 'SNSエンゲージメント戦略支援アプリ。他人が聞きたいことを発信し、プラットフォームに好まれる行動を可視化。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Providers>
          <div className="min-h-screen">
            {/* Navigation */}
            <nav className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">*</span>
                    <span className="text-xl font-bold text-white">SNS Boost</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <a href="/" className="text-white/70 hover:text-white transition">Dashboard</a>
                    <a href="/content" className="text-white/70 hover:text-white transition">Content</a>
                    <a href="/strategy" className="text-white/70 hover:text-white transition">Strategy</a>
                    <a href="/score" className="text-white/70 hover:text-white transition">Score</a>
                    <AuthButton showName />
                  </div>
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
