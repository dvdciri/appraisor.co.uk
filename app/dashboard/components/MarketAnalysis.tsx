'use client'

import { useState, useMemo } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface MarketStatistics {
  outcode: {
    count_of_properties: number
    count_total_properties_sold_last_12_months: number
    average_price_properties_sold_last_12_months: number
    sales_yearly: Array<{
      year: number
      count_of_sales: number
      average_price: number
    }>
    sales_monthly: Array<{
      year: number
      month: number
      count_of_sales: number
      average_price: number
    }>
    sales_price_bracket: Array<{
      price_bracket_index: number
      price_bracket_name: string
      count_of_sales: number
    }>
    detached_statistics?: PropertyTypeStatistics
    semi_detached_statistics?: PropertyTypeStatistics
    terraced_statistics?: PropertyTypeStatistics
    flat_statistics?: PropertyTypeStatistics
  }
  local_authority: {
    count_of_properties: number
    count_total_properties_sold_last_12_months: number
    average_price_properties_sold_last_12_months: number
    sales_yearly: Array<{
      year: number
      count_of_sales: number
      average_price: number
    }>
    sales_monthly: Array<{
      year: number
      month: number
      count_of_sales: number
      average_price: number
    }>
    sales_price_bracket: Array<{
      price_bracket_index: number
      price_bracket_name: string
      count_of_sales: number
    }>
    detached_statistics?: PropertyTypeStatistics
    semi_detached_statistics?: PropertyTypeStatistics
    terraced_statistics?: PropertyTypeStatistics
    flat_statistics?: PropertyTypeStatistics
  }
  national: {
    count_of_properties: number
    count_total_properties_sold_last_12_months: number
    average_price_properties_sold_last_12_months: number
    sales_yearly: Array<{
      year: number
      count_of_sales: number
      average_price: number
    }>
    sales_monthly: Array<{
      year: number
      month: number
      count_of_sales: number
      average_price: number
    }>
    sales_price_bracket: Array<{
      price_bracket_index: number
      price_bracket_name: string
      count_of_sales: number
    }>
    detached_statistics?: PropertyTypeStatistics
    semi_detached_statistics?: PropertyTypeStatistics
    terraced_statistics?: PropertyTypeStatistics
    flat_statistics?: PropertyTypeStatistics
  }
}

interface PropertyTypeStatistics {
  property_type: string
  count_of_properties: number
  average_price_properties_sold_last_12_months: number
  count_total_properties_sold_last_12_months: number
  sales_yearly: Array<{
    year: number
    count_of_sales: number
    average_price: number
  }>
  sales_monthly: Array<{
    year: number
    month: number
    count_of_sales: number
    average_price: number
  }>
  sales_price_bracket: Array<{
    price_bracket_index: number
    price_bracket_name: string
    count_of_sales: number
  }>
}

interface MarketAnalysisProps {
  marketStatistics: MarketStatistics | null
}

type TabType = 'historical' | 'current' | 'comparison'
type PropertyType = 'all' | 'detached' | 'semi_detached' | 'terraced' | 'flat'

const MarketAnalysis = ({ marketStatistics }: MarketAnalysisProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('historical')
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType>('all')

  // Show loading state if no data
  if (!marketStatistics) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-100">Market Analysis</h2>
            <p className="text-sm text-gray-400">Loading market data...</p>
          </div>
        </div>
        <div className="bg-gray-800/20 rounded-lg p-8 border border-gray-600/20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-bg-subtle border-t-accent mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Loading Market Data</h3>
          <p className="text-gray-400">
            Fetching market statistics for this property location...
          </p>
        </div>
      </div>
    )
  }

  // Helper function to get data based on property type selection
  const getDataForPropertyType = (geography: 'outcode' | 'local_authority' | 'national') => {
    const baseData = marketStatistics[geography]
    
    if (selectedPropertyType === 'all') {
      return baseData
    }
    
    const propertyTypeKey = `${selectedPropertyType}_statistics` as keyof typeof baseData
    return baseData[propertyTypeKey] || baseData
  }

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Helper function to format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Get current data for the selected property type
  const outcodeData = getDataForPropertyType('outcode')
  const localAuthorityData = getDataForPropertyType('local_authority')
  const nationalData = getDataForPropertyType('national')

  // Check if we have valid data
  const hasValidData = outcodeData && outcodeData.sales_yearly && outcodeData.sales_yearly.length > 0

  // Calculate key metrics
  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1
  const currentYearData = outcodeData.sales_yearly.find(d => d.year === currentYear)
  const lastYearData = outcodeData.sales_yearly.find(d => d.year === lastYear)
  
  const yoyChange = currentYearData && lastYearData 
    ? ((currentYearData.average_price - lastYearData.average_price) / lastYearData.average_price * 100)
    : 0

  const peakYear = outcodeData.sales_yearly.reduce((peak, current) => 
    current.average_price > peak.average_price ? current : peak
  )

  if (!hasValidData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-100">Market Analysis</h2>
            <p className="text-sm text-gray-400">Market data not available</p>
          </div>
        </div>
        <div className="bg-gray-800/20 rounded-lg p-8 border border-gray-600/20 text-center">
          <div className="text-4xl mb-4 opacity-50">📊</div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">No Market Data Available</h3>
          <p className="text-gray-400">
            Market statistics are not available for this property location or property type.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Property Type Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">Market Analysis</h2>
          <p className="text-sm text-gray-400">
            {selectedPropertyType === 'all' 
              ? 'All property types' 
              : `${selectedPropertyType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} properties`
            }
          </p>
        </div>
        
        {/* Property Type Filter */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Properties', shortLabel: 'All' },
            { key: 'detached', label: 'Detached', shortLabel: 'Detached' },
            { key: 'semi_detached', label: 'Semi-Detached', shortLabel: 'Semi' },
            { key: 'terraced', label: 'Terraced', shortLabel: 'Terraced' },
            { key: 'flat', label: 'Flats', shortLabel: 'Flats' }
          ].map((type) => (
            <button
              key={type.key}
              onClick={() => setSelectedPropertyType(type.key as PropertyType)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedPropertyType === type.key
                  ? 'bg-purple-500/20 text-purple-100 border border-purple-400/30'
                  : 'bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 border border-transparent'
              }`}
              title={type.label}
            >
              <span className="hidden sm:inline">{type.label}</span>
              <span className="sm:hidden">{type.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/20 rounded-lg p-4 border border-gray-600/20">
          <div className="text-2xl font-bold text-gray-100">{formatCurrency(outcodeData.average_price_properties_sold_last_12_months)}</div>
          <div className="text-sm text-gray-400">Avg Price (12m)</div>
        </div>
        <div className="bg-gray-800/20 rounded-lg p-4 border border-gray-600/20">
          <div className="text-2xl font-bold text-gray-100">{formatNumber(outcodeData.count_total_properties_sold_last_12_months)}</div>
          <div className="text-sm text-gray-400">Sales (12m)</div>
        </div>
        <div className="bg-gray-800/20 rounded-lg p-4 border border-gray-600/20">
          <div className={`text-2xl font-bold ${yoyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">YoY Change</div>
        </div>
        <div className="bg-gray-800/20 rounded-lg p-4 border border-gray-600/20">
          <div className="text-2xl font-bold text-gray-100">{formatNumber(outcodeData.count_of_properties)}</div>
          <div className="text-sm text-gray-400">Total Properties</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800/20 rounded-lg p-1 border border-gray-600/20">
        {[
          { key: 'historical', label: 'Historical Trends', icon: '📈' },
          { key: 'current', label: 'Current Market', icon: '📊' },
          { key: 'comparison', label: 'Geographic Comparison', icon: '🗺️' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-purple-500/20 text-purple-100'
                : 'text-gray-300 hover:text-gray-100 hover:bg-gray-500/10'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800/20 rounded-lg p-6 border border-gray-600/20 min-h-[400px]">
        {activeTab === 'historical' && (
          <HistoricalTrends 
            outcodeData={outcodeData}
            localAuthorityData={localAuthorityData}
            nationalData={nationalData}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />
        )}
        
        {activeTab === 'current' && (
          <CurrentMarket 
            outcodeData={outcodeData}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />
        )}
        
        {activeTab === 'comparison' && (
          <GeographicComparison 
            outcodeData={outcodeData}
            localAuthorityData={localAuthorityData}
            nationalData={nationalData}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />
        )}
      </div>
    </div>
  )
}

// Historical Trends Component
const HistoricalTrends = ({ 
  outcodeData, 
  localAuthorityData, 
  nationalData, 
  formatCurrency, 
  formatNumber 
}: {
  outcodeData: any
  localAuthorityData: any
  nationalData: any
  formatCurrency: (amount: number) => string
  formatNumber: (num: number) => string
}) => {
  // Get last 10 years of data for better visualization
  const currentYear = new Date().getFullYear()
  const startYear = currentYear - 9
  const recentData = outcodeData.sales_yearly.filter((d: any) => d.year >= startYear)
  
  // Get last 24 months of monthly data
  const recentMonthlyData = outcodeData.sales_monthly.slice(-24)

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-100">Price Trends Over Time</h3>
      
      {/* Yearly Price Chart */}
      <div className="bg-gray-900/30 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-200 mb-4">Average Price by Year (Last 10 Years)</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={recentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="year" 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number) => [formatCurrency(value), 'Average Price']}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="average_price" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-gray-900/30 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-200 mb-4">Recent Monthly Performance (Last 24 Months)</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={recentMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month" 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value, index) => {
                  const dataPoint = recentMonthlyData[index]
                  return dataPoint ? `${dataPoint.year}-${value.toString().padStart(2, '0')}` : value
                }}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number) => [formatCurrency(value), 'Average Price']}
                labelFormatter={(label, payload) => {
                  const data = payload?.[0]?.payload
                  return data ? `${data.year}-${data.month.toString().padStart(2, '0')}` : label
                }}
              />
              <Line 
                type="monotone" 
                dataKey="average_price" 
                stroke="#EC4899" 
                strokeWidth={2}
                dot={{ fill: '#EC4899', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#EC4899', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900/30 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-200 mb-2">Peak Performance</h5>
          <div className="text-lg font-semibold text-green-400">
            {formatCurrency(Math.max(...recentData.map((d: any) => d.average_price)))}
          </div>
          <div className="text-sm text-gray-400">
            Highest price in last 10 years
          </div>
        </div>
        <div className="bg-gray-900/30 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-200 mb-2">Average Growth</h5>
          <div className="text-lg font-semibold text-blue-400">
            {((recentData[recentData.length - 1]?.average_price / recentData[0]?.average_price - 1) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">
            10-year compound growth
          </div>
        </div>
      </div>
    </div>
  )
}

// Current Market Component
const CurrentMarket = ({ 
  outcodeData, 
  formatCurrency, 
  formatNumber 
}: {
  outcodeData: any
  formatCurrency: (amount: number) => string
  formatNumber: (num: number) => string
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-100">Current Market Overview</h3>
      
      {/* Price Distribution */}
      <div className="bg-gray-900/30 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-200 mb-4">Price Distribution (Last 12 Months)</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={outcodeData.sales_price_bracket}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="price_bracket_name" 
                stroke="#9CA3AF"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number) => [value, 'Sales']}
                labelFormatter={(label) => `Price Range: ${label}`}
              />
              <Bar 
                dataKey="count_of_sales" 
                fill="#8B5CF6"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/30 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-200 mb-2">Market Activity</h5>
          <div className="text-lg font-semibold text-gray-100">
            {formatNumber(outcodeData.count_total_properties_sold_last_12_months)} sales
          </div>
          <div className="text-sm text-gray-400">
            Last 12 months
          </div>
        </div>
        <div className="bg-gray-900/30 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-200 mb-2">Average Price</h5>
          <div className="text-lg font-semibold text-gray-100">
            {formatCurrency(outcodeData.average_price_properties_sold_last_12_months)}
          </div>
          <div className="text-sm text-gray-400">
            Last 12 months
          </div>
        </div>
        <div className="bg-gray-900/30 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-200 mb-2">Market Share</h5>
          <div className="text-lg font-semibold text-gray-100">
            {((outcodeData.count_total_properties_sold_last_12_months / outcodeData.count_of_properties) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">
            Of total properties
          </div>
        </div>
      </div>
    </div>
  )
}

// Geographic Comparison Component
const GeographicComparison = ({ 
  outcodeData, 
  localAuthorityData, 
  nationalData, 
  formatCurrency, 
  formatNumber 
}: {
  outcodeData: any
  localAuthorityData: any
  nationalData: any
  formatCurrency: (amount: number) => string
  formatNumber: (num: number) => string
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-100">Geographic Comparison</h3>
      
      {/* Price Comparison Chart */}
      <div className="bg-gray-900/30 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-200 mb-4">Average Prices by Geography</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { 
                geography: 'Outcode', 
                average_price: outcodeData.average_price_properties_sold_last_12_months,
                sales: outcodeData.count_total_properties_sold_last_12_months
              },
              { 
                geography: 'Local Authority', 
                average_price: localAuthorityData.average_price_properties_sold_last_12_months,
                sales: localAuthorityData.count_total_properties_sold_last_12_months
              },
              { 
                geography: 'National', 
                average_price: nationalData.average_price_properties_sold_last_12_months,
                sales: nationalData.count_total_properties_sold_last_12_months
              }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="geography" 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number) => [formatCurrency(value), 'Average Price']}
                labelFormatter={(label) => `Geography: ${label}`}
              />
              <Bar 
                dataKey="average_price" 
                fill="#8B5CF6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-gray-900/30 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-200 mb-4">Market Statistics Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600/30">
                <th className="text-left py-2 text-gray-300">Geography</th>
                <th className="text-right py-2 text-gray-300">Avg Price</th>
                <th className="text-right py-2 text-gray-300">Sales (12m)</th>
                <th className="text-right py-2 text-gray-300">Total Properties</th>
              </tr>
            </thead>
            <tbody className="text-gray-100">
              <tr className="border-b border-gray-700/30">
                <td className="py-2 font-medium">Outcode</td>
                <td className="py-2 text-right">{formatCurrency(outcodeData.average_price_properties_sold_last_12_months)}</td>
                <td className="py-2 text-right">{formatNumber(outcodeData.count_total_properties_sold_last_12_months)}</td>
                <td className="py-2 text-right">{formatNumber(outcodeData.count_of_properties)}</td>
              </tr>
              <tr className="border-b border-gray-700/30">
                <td className="py-2 font-medium">Local Authority</td>
                <td className="py-2 text-right">{formatCurrency(localAuthorityData.average_price_properties_sold_last_12_months)}</td>
                <td className="py-2 text-right">{formatNumber(localAuthorityData.count_total_properties_sold_last_12_months)}</td>
                <td className="py-2 text-right">{formatNumber(localAuthorityData.count_of_properties)}</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">National</td>
                <td className="py-2 text-right">{formatCurrency(nationalData.average_price_properties_sold_last_12_months)}</td>
                <td className="py-2 text-right">{formatNumber(nationalData.count_total_properties_sold_last_12_months)}</td>
                <td className="py-2 text-right">{formatNumber(nationalData.count_of_properties)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default MarketAnalysis
