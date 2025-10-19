import './globals.css'
import DatabaseInitializer from './components/DatabaseInitializer'

export const metadata = {
  title: 'UK Property Investment Analysis',
  description: 'Analyze UK investment properties with detailed insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen">
        <DatabaseInitializer />
        {children}
      </body>
    </html>
  )
}
