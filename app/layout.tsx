import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Oh Patrão!',
  description: 'Sistema de chamada de garçom e fechamento de conta',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#09090b' }}>
        {children}
      </body>
    </html>
  )
}
