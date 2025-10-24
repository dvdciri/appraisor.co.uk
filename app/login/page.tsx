'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect to search if already authenticated
  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (session) {
      router.push('/search')
      return
    }
  }, [session, status, router])

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/search' })
  }

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-bg-subtle border-t-accent"></div>
      </div>
    )
  }

  // Don't render if already authenticated (will redirect)
  if (session) {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Google Maps Static API Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(https://maps.googleapis.com/maps/api/staticmap?center=53.4808,-2.2426&zoom=12&size=3840x2160&maptype=roadmap&scale=2&style=feature:all|element:geometry|color:0x2d1b69&style=feature:water|element:geometry|color:0x1a0b3d&style=feature:road|element:geometry.fill|color:0x4c1d95&style=feature:all|element:labels.text.fill|color:0xffffff&style=feature:all|element:labels.text.stroke|color:0x000000&style=feature:landscape|element:geometry|color:0x1a0b3d&style=feature:poi|element:geometry|color:0x2d1b69&style=feature:transit|element:geometry|color:0x1a0b3d&style=feature:administrative|element:geometry|color:0x4c1d95&style=feature:administrative.country|element:labels.text.fill|color:0xffffff&style=feature:administrative.country|element:labels.text.stroke|color:0x000000&style=feature:administrative.land_parcel|element:labels.text.fill|color:0xffffff&style=feature:administrative.land_parcel|element:labels.text.stroke|color:0x000000&style=feature:landscape.natural|element:geometry|color:0x1a0b3d&style=feature:poi.business|element:geometry|color:0x2d1b69&style=feature:poi.park|element:geometry|color:0x2d1b69&style=feature:poi.park|element:labels.text.fill|color:0xffffff&style=feature:poi.park|element:labels.text.stroke|color:0x000000&style=feature:road.arterial|element:geometry|color:0x4c1d95&style=feature:road.highway|element:geometry|color:0x4c1d95&style=feature:road.highway.controlled_access|element:geometry|color:0x4c1d95&style=feature:road.local|element:labels.text.fill|color:0xffffff&style=feature:road.local|element:labels.text.stroke|color:0x000000&style=feature:transit.line|element:geometry|color:0x1a0b3d&style=feature:transit.station|element:geometry|color:0x2d1b69&style=feature:water|element:labels.text.fill|color:0xffffff&style=feature:water|element:labels.text.stroke|color:0x000000&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY})`,
          imageRendering: 'crisp-edges'
        }}
      />
      
      {/* Simple Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Main Content */}
      <main className="relative z-50 h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Login Form */}
          <div className="relative rounded-2xl p-8 shadow-2xl overflow-hidden">
            {/* Simple background for login box */}
            <div className="absolute inset-0 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'rgba(30, 15, 45, 0.6)' }} />
            
            {/* Content */}
            <div className="relative z-10 text-center">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-xl shadow-lg overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="Appraisor Logo"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl font-bold text-white mb-2">Welcome to Appraisor</h1>
              <p className="text-gray-300 text-sm mb-8">Sign in to access property analysis</p>
              
              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
