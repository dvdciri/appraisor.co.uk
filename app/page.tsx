'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Head from 'next/head'
import Image from 'next/image'

export default function LandingPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' })
        return
      }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/sendfox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })
      
      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        setEmail('') // Clear form after successful submission
      } else {
        setMessage({ type: 'error', text: data.error || 'Something went wrong. Please try again.' })
      }
    } catch (error) {
      console.error('Error submitting email:', error)
      setMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' })
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: '🔍', title: '45+ Data Points in One Search', description: 'Get instant access to comparables, market data, and key property metrics' },
    { icon: '🏚️', title: 'AI Refurbishment Estimator', description: 'Upload property photos and get AI-generated refurbishment cost estimates' },
    { icon: '💡', title: 'Multi-Exit Calculators with AI Assistant', description: 'Run scenarios for buy-to-let, flip, or resale with AI-driven guidance' },
    { icon: '📈', title: 'Market Insights', description: 'Stay ahead with local trends, price changes, and investment opportunities' },
    { icon: '⚠️', title: 'Environmental Risk Assessment', description: 'Automatically detect flood, contamination, and energy risks before you buy' },
    { icon: '🏠', title: 'Automatic Comparables & Valuations', description: 'See accurate comparables and AI-backed valuations in seconds' },
    { icon: '💳', title: 'Simple Pay-As-You-Go Pricing', description: 'No subscriptions, no hidden fees. You only pay for what you use with transparent credit-based pricing.', isFullWidth: true },
  ]

        return (
    <>
      <Head>
        <title>Appraisor - All Your UK Property Insights in One Search</title>
        <meta name="description" content="Get instant access to over 45 data points, automatic valuations, AI-driven insights, AI refurbishment estimator, and tools to help you buy and sell smarter. Pay-as-you-go credits, no subscription required." />
        <meta name="keywords" content="property analysis, UK property data, property valuation, AI refurbishment estimator, property investment, real estate insights, property comparables, market analysis" />
        <meta name="author" content="Appraisor" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Appraisor - All Your UK Property Insights in One Search" />
        <meta property="og:description" content="Get instant access to over 45 data points, automatic valuations, AI-driven insights, and tools to help you buy and sell smarter. Sign up for early access and get free credits." />
        <meta property="og:site_name" content="Appraisor" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Appraisor - All Your UK Property Insights in One Search" />
        <meta name="twitter:description" content="Get instant access to over 45 data points, automatic valuations, AI-driven insights, and tools to help you buy and sell smarter." />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Appraisor",
              "description": "All your UK property insights in one search. Get instant access to over 45 data points, automatic valuations, AI-driven insights, and tools to help you buy and sell smarter.",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "GBP",
                "description": "Pay-as-you-go credits, no subscription required"
              },
              "featureList": [
                "45+ Data Points in One Search",
                "AI Refurbishment Estimator", 
                "Multi-Exit Calculators with AI Assistant",
                "Market Insights",
                "Environmental Risk Assessment",
                "Automatic Comparables & Valuations"
              ]
            })
          }}
        />
      </Head>
      
      <div className="min-h-screen relative overflow-hidden">
      {/* Deep Space Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-purple-900" />
      
      {/* Nebula Core */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-700/60 via-purple-900/30 to-transparent" />
      
      {/* Swirling Nebula Effect */}
      <div 
        className="absolute inset-0 opacity-80"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 22% 32%, rgba(139, 92, 246, 0.45) 0%, transparent 55%),
            radial-gradient(ellipse 70% 45% at 78% 68%, rgba(59, 130, 246, 0.35) 0%, transparent 55%),
            radial-gradient(ellipse 75% 65% at 52% 18%, rgba(168, 85, 247, 0.3) 0%, transparent 55%),
            radial-gradient(ellipse 55% 85% at 12% 78%, rgba(236, 72, 153, 0.22) 0%, transparent 55%)
          `
        }}
      />
      
      {/* Animated Cosmic Dust */}
      <div 
        className="absolute inset-0 opacity-40 animate-pulse"
        style={{
          background: `
            radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.1), transparent),
            radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.05), transparent),
            radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.1), transparent),
            radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.05), transparent),
            radial-gradient(2px 2px at 160px 30px, rgba(255, 255, 255, 0.1), transparent)
          `,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 100px'
        }}
      />
      
      {/* Dark Nebula Clouds */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(ellipse 100% 60% at 0% 0%, rgba(0, 0, 0, 0.8) 0%, transparent 70%),
            radial-gradient(ellipse 80% 100% at 100% 100%, rgba(0, 0, 0, 0.6) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 50% 100%, rgba(0, 0, 0, 0.4) 0%, transparent 50%)
          `
        }}
      />
      
      {/* Cosmic Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-gradient-radial from-purple-500/30 via-purple-600/15 to-transparent animate-pulse" />
      <div className="absolute top-3/4 right-1/4 w-[24rem] h-[24rem] bg-gradient-radial from-blue-500/22 via-blue-600/10 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-[22rem] h-[22rem] bg-gradient-radial from-pink-500/18 via-pink-600/8 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Deep Space Overlay */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6" role="banner">
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-xl shadow-lg overflow-hidden" aria-label="Appraisor logo">
                <Image
                  src="/logo.png"
                  alt="Appraisor Logo"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-2xl font-bold text-white">Appraisor</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6 py-8" role="main">
          <div className="w-full max-w-4xl">
            <section className="text-center mb-12" aria-labelledby="hero-heading">
              {/* Hero Section */}
                <h1 id="hero-heading" className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                  All your UK property insights,
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    in one search.
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                  Appraisor gives you instant access to over 45 data points, automatic valuations, AI-driven insights, AI refurbishment estimator, and tools to help you buy and sell smarter.
                </p>

              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
                <p className="text-lg text-white mb-6">
                Get free credits when you sign up for early access!
                </p>
                
                {/* Email Capture Form */}
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3" aria-label="Sign up for early access">
                  <label htmlFor="email-input" className="sr-only">Email address</label>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    disabled={loading}
                    required
                    aria-describedby="email-help"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={loading ? 'Signing up, please wait' : 'Get free credits and early access'}
                  >
                    {loading ? 'Signing Up...' : 'Sign Up'}
                  </button>
                </form>
                <p id="email-help" className="sr-only">Enter your email address to receive free credits when we launch</p>

                {/* Message Display */}
                {message && (
                  <div className={`mt-4 p-3 rounded-lg text-sm ${
                    message.type === 'success' 
                      ? 'bg-green-500/20 border border-green-400/30 text-green-300' 
                      : 'bg-red-500/20 border border-red-400/30 text-red-300'
                  }`}>
                    {message.text}
                  </div>
                )}
              </div>
            </section>

            {/* Features Section */}
            <section className="text-center mb-8 mt-28" aria-labelledby="features-heading">
              <h2 id="features-heading" className="text-3xl font-bold text-white mb-4">What You'll Get</h2>
              <p className="text-gray-300 text-lg">Powerful tools to make smarter property decisions</p>
            </section>

            {/* Full Width Pricing Feature */}
            {features.find(f => f.isFullWidth) && (
              <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-6 hover:bg-black/30 transition-all duration-200 animate-enter-subtle mb-4 md:mb-8">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="text-3xl">💳</div>
                  <h3 className="text-lg font-semibold text-white">{features.find(f => f.isFullWidth)?.title}</h3>
                </div>
                <p className="text-gray-400 text-sm text-center leading-relaxed max-w-3xl mx-auto">
                  {features.find(f => f.isFullWidth)?.description}
                </p>
              </div>
            )}

            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8" role="list">
              {features.filter(f => !f.isFullWidth).map((feature, index) => (
                <article
                  key={index}
                  className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-6 hover:bg-black/30 transition-all duration-200 animate-enter-subtle"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  role="listitem"
                >
                  <div className="text-3xl mb-3" aria-hidden="true">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </article>
              ))}
            </div>
            
            {/* And Much More */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-full px-6 py-3">
                <span className="text-2xl" aria-hidden="true">✨</span>
                <span className="text-white font-medium">and much more...</span>
          </div>
        </div>
      </div>
    </main>

        {/* Footer */}
        <footer className="p-6 mt-8 text-center" role="contentinfo">
          <p className="text-gray-400 text-base mb-8">
            Built by Property Investors for Property Investors ❤️
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Questions? Contact us at{' '}
            <a 
              href="mailto:info@doorlyproperties.com" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
              aria-label="Contact us via email"
            >
              info@doorlyproperties.com
            </a>
          </p>
        </footer>
      </div>
    </div>
    </>
  )
}