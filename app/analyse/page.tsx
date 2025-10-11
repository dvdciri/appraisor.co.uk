'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import { loadPropertyData, savePropertyData } from '../../lib/persistence'

// Calculator Components
function CalculatorSection({ title, children, className = "", icon }: { 
  title: string, 
  children: React.ReactNode, 
  className?: string,
  icon?: string 
}) {
  return (
    <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 animate-enter-subtle-delayed ${className}`}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-xl">
        <div className="flex items-center justify-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

function CalculatorRow({ label, value, percentage, isTotal = false, trend }: { 
  label: string, 
  value: string, 
  percentage?: string, 
  isTotal?: boolean,
  trend?: 'up' | 'down' | 'neutral'
}) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-400'
    if (trend === 'down') return 'text-red-400'
    return 'text-gray-400'
  }

  return (
    <div className={`group flex items-center justify-between py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] ${
      isTotal 
        ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-700/50 font-bold text-green-300 shadow-lg' 
        : 'bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30'
    }`}>
      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
      <div className="flex items-center gap-4">
        {percentage && (
          <span className={`text-xs px-2 py-1 rounded-full bg-gray-600/50 ${getTrendColor()}`}>
            {percentage}
          </span>
        )}
        <span className={`text-sm font-semibold ${isTotal ? 'text-green-300' : 'text-white'}`}>
          {value}
        </span>
      </div>
    </div>
  )
}

function InputRow({ 
  label, 
  value, 
  onChange, 
  percentage, 
  isTotal = false, 
  type = "text",
  icon
}: { 
  label: string, 
  value: string, 
  onChange: (value: string) => void, 
  percentage?: string, 
  isTotal?: boolean, 
  type?: string,
  icon?: string
}) {
  return (
    <div className={`group flex items-center justify-between py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] ${
      isTotal 
        ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-700/50 font-bold text-green-300 shadow-lg' 
        : 'bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30'
    }`}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-sm">{icon}</span>}
        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {percentage && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-600/50 text-gray-400">
            {percentage}
          </span>
        )}
        <div className="relative">
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-28 text-right text-sm font-semibold border rounded-lg px-3 py-2 transition-all duration-200 focus:scale-105 ${
              isTotal 
                ? 'bg-green-900/20 text-green-300 border-green-600 focus:border-green-500 focus:ring-2 focus:ring-green-500/20' 
                : 'bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-gray-500'
            }`}
            placeholder="0.00"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">£</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function InvestmentCalculator() {
  // State for purchase type toggle
  const [purchaseType, setPurchaseType] = useState<'mortgage' | 'cash' | 'bridging'>('mortgage')
  
  // State for fees inclusion toggle
  const [includeFeesInLoan, setIncludeFeesInLoan] = useState(false)
  
  // State for bridging-specific fields
  const [bridgingDetails, setBridgingDetails] = useState({
    loanType: 'serviced' as 'serviced' | 'retained',
    duration: '',
    grossLoanPercent: '',
    monthlyInterest: '',
    applicationFee: ''
  })
  
  // State for exit strategy
  const [exitStrategy, setExitStrategy] = useState<'just-rent' | 'refinance-rent' | 'flip-sell' | null>(null)
  
  // State for refinance details
  const [refinanceDetails, setRefinanceDetails] = useState({
    expectedGDV: '',
    newLoanLTV: '',
    interestRate: '',
    brokerFees: '',
    legalFees: ''
  })
  
  // State for sale details
  const [saleDetails, setSaleDetails] = useState({
    expectedSalePrice: '',
    agencyFeePercent: '',
    legalFees: ''
  })
  
  // State for refurbishment items
  const [refurbItems, setRefurbItems] = useState([
    { id: 1, description: '', amount: '' }
  ])
  
  // State for funding sources
  const [fundingSources, setFundingSources] = useState([
    { id: 1, name: 'Personal', amount: '', interestRate: '', duration: '' }
  ])
  
  // State to track which input is being actively edited
  const [editingInput, setEditingInput] = useState<string | null>(null)
  
  // Functions to manage refurbishment items
  const addRefurbItem = () => {
    const newId = Math.max(...refurbItems.map(item => item.id), 0) + 1
    setRefurbItems([...refurbItems, { id: newId, description: '', amount: '' }])
  }
  
  const removeRefurbItem = (id: number) => {
    if (refurbItems.length > 1) {
      setRefurbItems(refurbItems.filter(item => item.id !== id))
    }
  }
  
  const updateRefurbItem = (id: number, field: 'description' | 'amount', value: string) => {
    setRefurbItems(refurbItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }
  
  // Functions to manage funding sources
  const addFundingSource = () => {
    const newId = Math.max(...fundingSources.map(source => source.id), 0) + 1
    setFundingSources([...fundingSources, { id: newId, name: '', amount: '', interestRate: '', duration: '' }])
  }
  
  const removeFundingSource = (id: number) => {
    if (fundingSources.length > 1) {
      setFundingSources(fundingSources.filter(source => source.id !== id))
    }
  }
  
  const updateFundingSource = (id: number, field: 'name' | 'amount' | 'interestRate' | 'duration', value: string) => {
    setFundingSources(fundingSources.map(source => 
      source.id === id ? { ...source, [field]: value } : source
    ))
  }

  // State for all calculator values
  const [initialCosts, setInitialCosts] = useState({
    refurbRepair: '',
    legal: '',
    stampDutyPercent: '',
    ila: '',
    brokerFees: '',
    findersFee: ''
  })

  const [purchaseFinance, setPurchaseFinance] = useState({
    purchasePrice: '',
    deposit: '',
    ltv: '',
    loanAmount: '',
    productFee: '',
    interestRate: ''
  })

  const [monthlyIncome, setMonthlyIncome] = useState({
    rent1: '',
    rent2: '',
    rent3: '',
    rent4: '',
    rent5: ''
  })

  const [monthlyExpenses, setMonthlyExpenses] = useState({
    serviceCharge: '',
    groundRent: '',
    maintenancePercent: '',
    managementPercent: '',
    insurance: '',
    mortgagePayment: ''
  })

  const [propertyValue, setPropertyValue] = useState('')

  // Helper functions for currency formatting
  const formatCurrency = (value: string) => {
    if (!value || value === '') return ''
    const num = parseFloat(value.replace(/[£,]/g, ''))
    if (isNaN(num)) return ''
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  const parseCurrency = (value: string) => {
    return value.replace(/[£,]/g, '')
  }

  const handleCurrencyChange = (value: string, setter: (value: string) => void) => {
    const cleaned = parseCurrency(value)
    // Allow empty string or valid decimal numbers
    if (cleaned === '' || /^\d*\.?\d*$/.test(cleaned)) {
      setter(cleaned)
    }
  }

  // Format currency for display only (not during typing)
  const formatCurrencyDisplay = (value: string) => {
    if (!value || value === '') return ''
    const num = parseFloat(value)
    if (isNaN(num)) return value // Return original if not a number
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  // Calculate stamp duty amount
  const purchasePriceNum = parseFloat(parseCurrency(purchaseFinance.purchasePrice) || '0')
  const stampDutyPercent = parseFloat(initialCosts.stampDutyPercent || '0')
  const stampDutyAmount = purchasePriceNum > 0 && stampDutyPercent > 0 
    ? purchasePriceNum * (stampDutyPercent / 100) 
    : 0

  // Calculate totals (excluding stamp duty from initial costs since it's calculated separately)
  const otherInitialCosts = parseFloat(initialCosts.legal || '0') + 
    parseFloat(initialCosts.refurbRepair || '0') + 
    parseFloat(initialCosts.ila || '0') + 
    parseFloat(initialCosts.brokerFees || '0') + 
    parseFloat(initialCosts.findersFee || '0')
  
  const totalInitialCosts = otherInitialCosts + stampDutyAmount
  // Only include purchase price and deposit in purchase finance (exclude interest rate)
  const totalPurchaseFinance = purchasePriceNum
  
  // Calculate maintenance and management amounts
  const maintenancePercent = parseFloat(monthlyExpenses.maintenancePercent || '0')
  const managementPercent = parseFloat(monthlyExpenses.managementPercent || '0')
  const totalMonthlyIncome = Object.values(monthlyIncome).reduce((sum, val) => sum + parseFloat(val || '0'), 0)
  
  // Calculate maintenance and management amounts based on total income
  const maintenanceAmount = totalMonthlyIncome > 0 ? totalMonthlyIncome * (maintenancePercent / 100) : 0
  const managementAmount = totalMonthlyIncome > 0 ? totalMonthlyIncome * (managementPercent / 100) : 0

  // Derived finance values
  const ltvNum = parseFloat(purchaseFinance.ltv || '0')
  const productFeePercent = parseFloat(purchaseFinance.productFee || '0')
  
  // Determine purchase type
  const isCashPurchase = purchaseType === 'cash'
  const isBridging = purchaseType === 'bridging'
  const isMortgage = purchaseType === 'mortgage'
  
  // Calculate base loan amount (based on LTV of purchase price)
  const baseLoanAmount = isMortgage && purchasePriceNum > 0 && ltvNum >= 0
    ? purchasePriceNum * (ltvNum / 100)
    : 0
  
  // Bridging-specific calculations
  const grossLoanPercent = parseFloat(bridgingDetails.grossLoanPercent || '0')
  const grossLoanAmount = isBridging && purchasePriceNum > 0 && grossLoanPercent > 0
    ? purchasePriceNum * (grossLoanPercent / 100)
    : 0
  
  // Calculate deposit (remains constant regardless of fees)
  const depositAmount = isMortgage && purchasePriceNum > 0 && ltvNum >= 0
    ? purchasePriceNum - baseLoanAmount
    : isBridging && purchasePriceNum > 0 && grossLoanPercent > 0
    ? purchasePriceNum - grossLoanAmount
    : 0
  
  // Calculate product fee as percentage of loan amount (always calculate for display)
  const productFeeAmount = isBridging && grossLoanAmount > 0 && productFeePercent > 0
    ? grossLoanAmount * (productFeePercent / 100)
    : baseLoanAmount > 0 && productFeePercent > 0
    ? baseLoanAmount * (productFeePercent / 100)
    : 0
  
  const monthlyInterestRate = parseFloat(bridgingDetails.monthlyInterest || '0')
  const applicationFeeAmount = parseFloat(bridgingDetails.applicationFee || '0')
  const durationMonths = parseFloat(bridgingDetails.duration || '0')
  
  // Calculate total interest for retained bridging
  const totalInterestAmount = isBridging && bridgingDetails.loanType === 'retained' && grossLoanAmount > 0 && monthlyInterestRate > 0 && durationMonths > 0
    ? grossLoanAmount * (monthlyInterestRate / 100) * durationMonths
    : 0
  
  // Calculate net advance based on loan type
  const netAdvance = isBridging && grossLoanAmount > 0
    ? grossLoanAmount - productFeeAmount - applicationFeeAmount - totalInterestAmount
    : 0
  
  // Final loan amount including product fee (only when included in loan)
  const finalLoanAmount = isBridging 
    ? grossLoanAmount  // For bridging, use gross loan amount
    : baseLoanAmount + (includeFeesInLoan ? productFeeAmount : 0)  // For mortgage, use base + fees
  
  // Calculate effective LTV (loan + fees / purchase price)
  const effectiveLTV = purchasePriceNum > 0 ? (finalLoanAmount / purchasePriceNum) * 100 : 0
  
  // Calculate mortgage payment (interest only)
  const interestRate = parseFloat(purchaseFinance.interestRate || '0')
  const calculatedMortgagePayment = isMortgage && finalLoanAmount > 0 && interestRate > 0
    ? (finalLoanAmount * (interestRate / 100)) / 12  // Convert annual rate to monthly
    : 0
  
  // Separate fees that can be included in loan vs paid upfront
  const feesIncludedInLoan = includeFeesInLoan ? productFeeAmount : 0
  const feesPaidUpfront = totalInitialCosts // Only initial costs, product fee handled separately
  
  // Calculate total investment based on whether fees are included in loan
  const totalInvestment = feesPaidUpfront + totalPurchaseFinance + (!includeFeesInLoan ? productFeeAmount : 0)
  
  // Calculate total refurbishment costs from items
  const totalRefurbCosts = refurbItems.reduce((total, item) => {
    return total + parseFloat(item.amount || '0')
  }, 0)
  
  // Calculate total monthly expenses including calculated amounts
  const otherMonthlyExpenses = parseFloat(monthlyExpenses.serviceCharge || '0') + 
    parseFloat(monthlyExpenses.groundRent || '0') + 
    parseFloat(monthlyExpenses.insurance || '0')
  
  // Calculate amount needed to purchase (Purchase Costs + Cost of Finance)
  const amountNeededToPurchase = feesPaidUpfront + (isCashPurchase
    ? purchasePriceNum
    : isBridging
    ? (purchasePriceNum - netAdvance)
    : (depositAmount + (!includeFeesInLoan ? productFeeAmount : 0))
  )
  
  // Calculate total project costs
  const totalProjectCosts = amountNeededToPurchase + totalRefurbCosts
  
  // Calculate total funding sources
  const totalFundingSources = fundingSources.reduce((total, source) => {
    return total + parseFloat(source.amount || '0')
  }, 0)
  
  // Check if funding sources match total project costs
  const fundingMismatch = Math.abs(totalProjectCosts - totalFundingSources) > 0.01 // Allow for small rounding differences
  
  // Calculate total interest from funding sources
  const calculateFundingInterest = (months: number) => {
    return fundingSources.reduce((total, source) => {
      const amount = parseFloat(source.amount || '0')
      const rate = parseFloat(source.interestRate || '0') / 100
      const duration = parseFloat(source.duration || '0')
      if (amount > 0 && rate > 0 && duration > 0) {
        // Calculate interest for the given number of months
        const interestMonths = Math.min(months, duration)
        return total + (amount * rate * (interestMonths / 12))
      }
      return total
    }, 0)
  }
  
  // Calculate total interest for all funding sources (using their individual durations)
  const calculateTotalFundingInterest = () => {
    return fundingSources.reduce((total, source) => {
      const amount = parseFloat(source.amount || '0')
      const rate = parseFloat(source.interestRate || '0') / 100
      const duration = parseFloat(source.duration || '0')
      if (amount > 0 && rate > 0 && duration > 0) {
        // Calculate interest for the full duration of each source
        return total + (amount * rate * (duration / 12))
      }
      return total
    }, 0)
  }
  
  // Refinance calculations
  const expectedGDV = parseFloat(refinanceDetails.expectedGDV || '0')
  const newLoanLTV = parseFloat(refinanceDetails.newLoanLTV || '0')
  const newLoanAmount = expectedGDV > 0 && newLoanLTV > 0 ? expectedGDV * (newLoanLTV / 100) : 0
  const refinanceInterestRate = parseFloat(refinanceDetails.interestRate || '0')
  
  // Finance repayment calculation
  const financeRepaymentTotal = isCashPurchase 
    ? 0 
    : isBridging 
    ? grossLoanAmount 
    : finalLoanAmount
  
  // Refinance costs
  const brokerFeesAmount = parseFloat(refinanceDetails.brokerFees || '0')
  const legalFeesAmount = parseFloat(refinanceDetails.legalFees || '0')
  const refinanceCostsTotal = brokerFeesAmount + legalFeesAmount
  
  // Money left in the deal
  const totalFundingInterest = calculateTotalFundingInterest()
  const moneyLeftInDeal = newLoanAmount - financeRepaymentTotal - refinanceCostsTotal - totalProjectCosts - totalFundingInterest
  
  // Calculate refinance mortgage payment (interest only)
  const refinanceMortgagePayment = exitStrategy === 'refinance-rent' && newLoanAmount > 0 && refinanceInterestRate > 0
    ? (newLoanAmount * (refinanceInterestRate / 100)) / 12  // Refinance mortgage payment
    : 0
  
  // Sale calculations
  const expectedSalePrice = parseFloat(saleDetails.expectedSalePrice || '0')
  const agencyFeePercent = parseFloat(saleDetails.agencyFeePercent || '0')
  const agencyFeeAmount = expectedSalePrice > 0 && agencyFeePercent > 0 ? expectedSalePrice * (agencyFeePercent / 100) : 0
  const saleLegalFeesAmount = parseFloat(saleDetails.legalFees || '0')
  const saleCostsTotal = agencyFeeAmount + saleLegalFeesAmount
  
  // Total profit/loss calculation
  const totalProfitLoss = expectedSalePrice - financeRepaymentTotal - saleCostsTotal - totalProjectCosts - totalFundingInterest
  
  // Calculate total monthly expenses including calculated amounts
  const totalMonthlyExpenses = otherMonthlyExpenses + maintenanceAmount + managementAmount + calculatedMortgagePayment + refinanceMortgagePayment
  const netMonthlyIncome = totalMonthlyIncome - totalMonthlyExpenses
  const netYearlyIncome = netMonthlyIncome * 12
  
  // Calculate ROI metrics
  // For Refinance and Rent, use absolute value of money left in the deal instead of total project costs
  const investmentAmount = exitStrategy === 'refinance-rent' 
    ? Math.abs(moneyLeftInDeal) 
    : totalProjectCosts

  // Handle edge cases for ROCE calculation
  let roce = 0
  if (exitStrategy === 'refinance-rent') {
    if (moneyLeftInDeal >= 0) {
      // If money left is 0 or positive, we're getting money out, so ROCE is infinite
      roce = Infinity
    } else {
      // If money left is negative, we're putting money in, calculate ROCE using absolute value
      const absoluteMoneyLeft = Math.abs(moneyLeftInDeal)
      roce = absoluteMoneyLeft > 0 ? (netYearlyIncome / absoluteMoneyLeft * 100) : 0
    }
  } else {
    // For other exit strategies, use normal calculation
    roce = investmentAmount > 0 ? (netYearlyIncome / investmentAmount * 100) : 0
  }
  const annualYield = totalProjectCosts > 0 ? (totalMonthlyIncome * 12 / totalProjectCosts * 100) : 0
  
  const calculatedDeposit = isMortgage && purchasePriceNum > 0 && ltvNum >= 0
    ? formatCurrency(depositAmount.toString())
    : ''
  const calculatedLoan = isMortgage && purchasePriceNum > 0 && ltvNum >= 0
    ? formatCurrency(finalLoanAmount.toString())
    : ''

  return (
    <div className="space-y-8">
      {/* Main Calculator Sections */}
      <div className="space-y-8">
        {/* Purchase Section */}
        <div className="bg-gray-900 rounded-xl p-8 animate-enter-subtle">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <span className="text-4xl">🏠</span> Purchase Details
          </h2>
          
        {/* Initial Expenses & Purchase Finance - Side by Side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Initial Expenses */}
          <div className="bg-gray-800 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6">
              Costs
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-3 block font-medium">Stamp Duty</label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                  <input
                    type="text"
                          value={initialCosts.stampDutyPercent}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setInitialCosts(prev => ({ ...prev, stampDutyPercent: value }))
                            }
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="5.0"
                        />
                        <div className="text-xs text-gray-400 mt-1">%</div>
                </div>
                <div>
                  <input
                    type="text"
                          value={formatCurrency(stampDutyAmount.toString())}
                          readOnly
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-semibold opacity-90 cursor-not-allowed"
                    placeholder="£0.00"
                  />
                        <div className="text-xs text-gray-400 mt-1">Amount</div>
                </div>
              </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-3 block font-medium">Legal Fees</label>
                  <input
                    type="text"
                    value={editingInput === 'legal' ? initialCosts.legal : formatCurrency(initialCosts.legal)}
                    onChange={(e) => handleCurrencyChange(e.target.value, (val) => setInitialCosts(prev => ({ ...prev, legal: val })))}
                    onFocus={() => setEditingInput('legal')}
                    onBlur={() => setEditingInput(null)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="£0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-3 block font-medium">Broker Fees</label>
                  <input
                    type="text"
                    value={editingInput === 'brokerFees' ? initialCosts.brokerFees : formatCurrency(initialCosts.brokerFees)}
                    onChange={(e) => handleCurrencyChange(e.target.value, (val) => setInitialCosts(prev => ({ ...prev, brokerFees: val })))}
                    onFocus={() => setEditingInput('brokerFees')}
                    onBlur={() => setEditingInput(null)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="£0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-3 block font-medium">ILA</label>
                  <input
                    type="text"
                    value={editingInput === 'ila' ? initialCosts.ila : formatCurrency(initialCosts.ila)}
                    onChange={(e) => handleCurrencyChange(e.target.value, (val) => setInitialCosts(prev => ({ ...prev, ila: val })))}
                    onFocus={() => setEditingInput('ila')}
                    onBlur={() => setEditingInput(null)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="£0.00"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-3 block font-medium">Finders Fee</label>
                  <input
                    type="text"
                    value={editingInput === 'findersFee' ? initialCosts.findersFee : formatCurrency(initialCosts.findersFee)}
                    onChange={(e) => handleCurrencyChange(e.target.value, (val) => setInitialCosts(prev => ({ ...prev, findersFee: val })))}
                    onFocus={() => setEditingInput('findersFee')}
                    onBlur={() => setEditingInput(null)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="£0.00"
                  />
                </div>
              </div>
              
            </div>
            <div className="mt-6 pt-4 border-t border-gray-600">
              <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-green-400">Total Costs</span>
                  <span className="text-2xl font-bold text-green-400">£{feesPaidUpfront.toLocaleString()}</span>
                </div>
                
              </div>
            </div>
          </div>

          {/* Purchase Finance */}
          <div className="bg-gray-800 rounded-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                Finance
              </h3>
              {/* Purchase Type Selection */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-300">Type:</span>
                <div className="flex bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setPurchaseType('mortgage')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      purchaseType === 'mortgage'
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Mortgage
                  </button>
                  <button
                    onClick={() => setPurchaseType('bridging')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      purchaseType === 'bridging'
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Bridging
                  </button>
                  <button
                    onClick={() => setPurchaseType('cash')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      purchaseType === 'cash'
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Cash
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-3 block font-medium">Purchase Price</label>
                <input
                  type="text"
                  value={editingInput === 'purchasePrice' ? purchaseFinance.purchasePrice : formatCurrency(purchaseFinance.purchasePrice)}
                  onChange={(e) => handleCurrencyChange(e.target.value, (val) => setPurchaseFinance(prev => ({ ...prev, purchasePrice: val })))}
                  onFocus={() => setEditingInput('purchasePrice')}
                  onBlur={() => setEditingInput(null)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="£0.00"
                />
              </div>
              {isMortgage && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-300 mb-3 block font-medium">LTV %</label>
                      <input
                        type="text"
                        value={purchaseFinance.ltv}
                        onChange={(e) => setPurchaseFinance(prev => ({ ...prev, ltv: e.target.value }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="75"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-3 block font-medium">Deposit</label>
                      <input
                        type="text"
                        value={calculatedDeposit}
                        readOnly
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold opacity-90"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 mb-3 block font-medium">Loan Amount</label>
                    <input
                      type="text"
                      value={calculatedLoan}
                      readOnly
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold opacity-90"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-300 mb-3 block font-medium">Product Fee %</label>
                      <input
                        type="text"
                        value={purchaseFinance.productFee}
                        onChange={(e) => setPurchaseFinance(prev => ({ ...prev, productFee: e.target.value }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="1.5"
                      />
                      {/* Small toggle for including product fee in loan */}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Include in loan</span>
                        <button
                          onClick={() => setIncludeFeesInLoan(!includeFeesInLoan)}
                          className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                            includeFeesInLoan ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              includeFeesInLoan ? 'translate-x-3.5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                      {/* Show effective LTV when fees are included */}
                      {includeFeesInLoan && effectiveLTV > 0 && (
                        <div className="mt-1 text-xs text-blue-400">
                          Effective LTV: {effectiveLTV.toFixed(1)}%
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-3 block font-medium">Interest Rate %</label>
                      <input
                        type="text"
                        value={purchaseFinance.interestRate}
                        onChange={(e) => setPurchaseFinance(prev => ({ ...prev, interestRate: e.target.value }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="5.5"
                      />
                    </div>
                  </div>
                </>
              )}
              
              {/* Bridging-specific fields */}
              {isBridging && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-300 mb-3 block font-medium">Loan Type</label>
                      <select
                        value={bridgingDetails.loanType}
                        onChange={(e) => setBridgingDetails(prev => ({ ...prev, loanType: e.target.value as 'serviced' | 'retained' }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="serviced">Serviced</option>
                        <option value="retained">Retained</option>
                      </select>
            </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-3 block font-medium">Duration (months)</label>
                      <input
                        type="text"
                        value={bridgingDetails.duration}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setBridgingDetails(prev => ({ ...prev, duration: value }))
                          }
                        }}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="9"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-300 mb-3 block font-medium">Gross Loan</label>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            value={bridgingDetails.grossLoanPercent}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                setBridgingDetails(prev => ({ ...prev, grossLoanPercent: value }))
                              }
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            placeholder="75.0"
                          />
                          <div className="text-xs text-gray-400 mt-1">%</div>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={formatCurrency(grossLoanAmount.toString())}
                            readOnly
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-semibold opacity-90 cursor-not-allowed"
                            placeholder="£0.00"
                          />
                          <div className="text-xs text-gray-400 mt-1">Amount</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-300 mb-3 block font-medium">Product Fee %</label>
                      <input
                        type="text"
                        value={purchaseFinance.productFee}
                        onChange={(e) => setPurchaseFinance(prev => ({ ...prev, productFee: e.target.value }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="1.5"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-3 block font-medium">Monthly Interest %</label>
                      <input
                        type="text"
                        value={bridgingDetails.monthlyInterest}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setBridgingDetails(prev => ({ ...prev, monthlyInterest: value }))
                          }
                        }}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="0.85"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-300 mb-3 block font-medium">Application Fee</label>
                    <input
                      type="text"
                      value={editingInput === 'applicationFee' ? bridgingDetails.applicationFee : formatCurrency(bridgingDetails.applicationFee)}
                      onChange={(e) => handleCurrencyChange(e.target.value, (val) => setBridgingDetails(prev => ({ ...prev, applicationFee: val })))}
                      onFocus={() => setEditingInput('applicationFee')}
                      onBlur={() => setEditingInput(null)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="£0.00"
                    />
                  </div>
                  
                  {/* Net Advance Display */}
                  <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-400">Total Net Advance</span>
                      <span className="text-2xl font-bold text-green-400">£{netAdvance.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      <div className="flex justify-between">
                        <span>Gross Loan:</span>
                        <span>£{grossLoanAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Product Fee:</span>
                        <span>-£{productFeeAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Application Fee:</span>
                        <span>-£{applicationFeeAmount.toLocaleString()}</span>
                      </div>
                      {bridgingDetails.loanType === 'retained' && totalInterestAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Interest ({durationMonths} months):</span>
                          <span>-£{totalInterestAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Cost of Finance Total */}
            <div className="mt-6 pt-4 border-t border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-blue-400">Cost of Finance</span>
                <span className="text-2xl font-bold text-blue-400">
                  £{isCashPurchase 
                    ? purchasePriceNum.toLocaleString() 
                    : isBridging
                    ? (purchasePriceNum - netAdvance).toLocaleString()
                    : (depositAmount + (!includeFeesInLoan ? productFeeAmount : 0)).toLocaleString()
                  }
                </span>
              </div>
              {(isMortgage || isBridging) && (
                <div className="mt-2 text-sm text-gray-400">
                  {isMortgage && (
                    <>
                      <div className="flex justify-between">
                        <span>Deposit:</span>
                        <span>£{depositAmount.toLocaleString()}</span>
            </div>
                      {!includeFeesInLoan && productFeeAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Product Fee:</span>
                          <span>£{productFeeAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}
                  {isBridging && (
                    <>
                      <div className="flex justify-between">
                        <span>Purchase Price:</span>
                        <span>£{purchasePriceNum.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Net Advance:</span>
                        <span>-£{netAdvance.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
          </div>
        </div>

          {/* Amount needed to purchase - Purchase Section Total */}
          <div className="mt-8 pt-6 border-t border-gray-600 col-span-full">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-white">Amount needed to purchase</span>
              <span className="text-4xl font-bold text-white">
                £{amountNeededToPurchase.toLocaleString()}
              </span>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>Purchase Costs:</span>
                <span>£{feesPaidUpfront.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cost of Finance:</span>
                <span>£{(isCashPurchase 
                  ? purchasePriceNum 
                  : isBridging
                  ? (purchasePriceNum - netAdvance)
                  : (depositAmount + (!includeFeesInLoan ? productFeeAmount : 0))
                ).toLocaleString()}</span>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Refurbishment Section - only show when amount needed to purchase > 0 */}
        {amountNeededToPurchase > 0 ? (
        <div className="bg-gray-900 rounded-xl p-8 animate-enter-subtle-delayed">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">🔨</span> Refurbishment
            </h2>
            <button
              onClick={addRefurbItem}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              + Add Item
            </button>
          </div>
          
        
          
            <div className="space-y-4">
              {refurbItems.map((item, index) => (
                <div key={item.id} className="bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-300 mb-2 block">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateRefurbItem(item.id, 'description', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g., Kitchen renovation, Bathroom update, Flooring"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-300 mb-2 block">Amount</label>
                      <input
                        type="text"
                        value={editingInput === `refurb-${item.id}` ? item.amount : formatCurrency(item.amount)}
                        onChange={(e) => handleCurrencyChange(e.target.value, (val) => updateRefurbItem(item.id, 'amount', val))}
                        onFocus={() => setEditingInput(`refurb-${item.id}`)}
                        onBlur={() => setEditingInput(null)}
                        className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="£0.00"
                      />
                    </div>
                    {refurbItems.length > 1 && (
                      <button
                        onClick={() => removeRefurbItem(item.id)}
                        className="text-gray-400 hover:text-red-400 hover:bg-red-900/20 px-2 py-2 rounded-lg transition-colors text-sm"
                        title="Remove item"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
            <div className="mt-6 pt-4 border-t border-gray-500">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-white">Total Refurbishment Cost</span>
                <span className="text-3xl font-bold text-blue-400">£{totalRefurbCosts.toLocaleString()}</span>
              </div>
            </div>
        
        </div>
        ) : (
        <div className="bg-gray-900/30 rounded-xl p-8 opacity-50 border-2 border-dashed border-gray-600">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">🔨</span> Refurbishment
            </h2>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-400 text-lg">Enter purchase details above to unlock refurbishment planning</p>
          </div>
        </div>
        )}

        {/* Total Project Costs & Source of Funds Section - only show when amount needed to purchase > 0 */}
        {amountNeededToPurchase > 0 ? (
        <div className="bg-gray-900 rounded-xl p-8 animate-enter-subtle-delayed-2">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <span className="text-4xl">📊</span> Project Funding
          </h2>
          
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* Left Side - Total Project Costs */}
            <div className="bg-gray-800 rounded-xl p-8 xl:col-span-2">
              <h3 className="text-2xl font-bold text-white mb-6">
                Total Project Costs
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-gray-700 rounded-xl p-6">
                    <div className="text-lg font-semibold text-gray-300 mb-2">Acquisition Costs</div>
                    <div className="text-3xl font-bold text-white">£{amountNeededToPurchase.toLocaleString()}</div>
                    <div className="text-sm text-gray-400 mt-2">Amount needed to purchase</div>
                  </div>
                  <div className="bg-gray-700 rounded-xl p-6">
                    <div className="text-lg font-semibold text-gray-300 mb-2">Refurbishment Costs</div>
                    <div className="text-3xl font-bold text-white">£{totalRefurbCosts.toLocaleString()}</div>
                    <div className="text-sm text-gray-400 mt-2">Total refurbishment cost</div>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-white">Total Project Costs</span>
                    <span className="text-4xl font-bold text-blue-400">
                      £{totalProjectCosts.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    Acquisition + Refurbishment
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Source of Funds */}
            <div className="bg-gray-800 rounded-xl p-8 xl:col-span-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Source of Funds
                </h3>
                <button
                  onClick={addFundingSource}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                >
                  + Add Source
                </button>
              </div>
              
              <div className="space-y-4">
                {fundingSources.map((source, index) => (
                  <div key={source.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                      <div className="lg:col-span-4">
                        <label className="text-sm text-gray-300 mb-2 block">Source Name</label>
                        <input
                          type="text"
                          value={source.name}
                          onChange={(e) => updateFundingSource(source.id, 'name', e.target.value)}
                          className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="e.g., Personal, Investor 1, Bank Loan"
                        />
                      </div>
                      <div className="lg:col-span-3">
                        <label className="text-sm text-gray-300 mb-2 block">Amount</label>
                        <input
                          type="text"
                          value={editingInput === `funding-${source.id}` ? source.amount : formatCurrency(source.amount)}
                          onChange={(e) => handleCurrencyChange(e.target.value, (val) => updateFundingSource(source.id, 'amount', val))}
                          onFocus={() => setEditingInput(`funding-${source.id}`)}
                          onBlur={() => setEditingInput(null)}
                          className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="£0.00"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="text-sm text-gray-300 mb-2 block">Interest %</label>
                        <input
                          type="text"
                          value={source.interestRate}
                          onChange={(e) => updateFundingSource(source.id, 'interestRate', e.target.value)}
                          className="w-full bg-gray-600 border border-gray-500 rounded-lg px-2 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="text-sm text-gray-300 mb-2 block">Duration (mo)</label>
                        <input
                          type="text"
                          value={source.duration}
                          onChange={(e) => updateFundingSource(source.id, 'duration', e.target.value)}
                          className="w-full bg-gray-600 border border-gray-500 rounded-lg px-2 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="12"
                        />
                      </div>
                      <div className="lg:col-span-1 flex justify-end">
                        {fundingSources.length > 1 && (
                          <button
                            onClick={() => removeFundingSource(source.id)}
                            className="text-gray-400 hover:text-red-400 hover:bg-red-900/20 px-2 py-2 rounded-lg transition-colors text-sm self-end"
                            title="Remove source"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-green-400">Total Funding</span>
                  <span className="text-3xl font-bold text-green-400">£{totalFundingSources.toLocaleString()}</span>
                </div>
                
                {/* Funding Mismatch Warning */}
                {fundingMismatch && (
                  <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-red-400 font-medium">Funding Mismatch</span>
                    </div>
                    <p className="text-sm text-red-300 mt-1">
                      Total funding (£{totalFundingSources.toLocaleString()}) does not match total project costs (£{totalProjectCosts.toLocaleString()})
                    </p>
                    <p className="text-sm text-red-300">
                      Difference: £{Math.abs(totalProjectCosts - totalFundingSources).toLocaleString()}
                    </p>
                  </div>
                )}
                
                {/* Success Message */}
                {!fundingMismatch && totalFundingSources > 0 && (
                  <div className="mt-4 p-4 bg-green-900/20 border border-green-500 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-400 font-medium">Funding Balanced</span>
                    </div>
                    <p className="text-sm text-green-300 mt-1">
                      Total funding matches total project costs perfectly
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        ) : (
        <div className="bg-gray-900/30 rounded-xl p-8 opacity-50 border-2 border-dashed border-gray-600">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <span className="text-4xl">📊</span> Project Funding
          </h2>
          <div className="text-center py-8">
            <p className="text-gray-400 text-lg">Enter purchase details above to unlock project funding tools</p>
          </div>
        </div>
        )}

        {/* Exit Strategy Section - only show when amount needed to purchase > 0 */}
        {amountNeededToPurchase > 0 ? (
        <div className="bg-gray-900 rounded-xl p-8 animate-enter-subtle-delayed-3">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <span className="text-4xl">🚪</span> Exit Strategy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => {
                setExitStrategy('just-rent')
                setTimeout(() => {
                  document.getElementById('calculator-content')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  })
                }, 100)
              }}
              className={`p-6 rounded-xl border-2 transition-all ${
                exitStrategy === 'just-rent'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-xl font-bold text-white mb-2">Rent</h3>
              <p className="text-gray-400 text-sm">Hold the property and collect rental income</p>
            </button>
            
            <button
              onClick={() => {
                setExitStrategy('refinance-rent')
                setTimeout(() => {
                  document.getElementById('calculator-content')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  })
                }, 100)
              }}
              className={`p-6 rounded-xl border-2 transition-all ${
                exitStrategy === 'refinance-rent'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-white mb-2">Refinance and Rent</h3>
              <p className="text-gray-400 text-sm">Refinance to a mortgage and continue renting</p>
            </button>
            
            <button
              onClick={() => {
                setExitStrategy('flip-sell')
                setTimeout(() => {
                  document.getElementById('calculator-content')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  })
                }, 100)
              }}
              className={`p-6 rounded-xl border-2 transition-all ${
                exitStrategy === 'flip-sell'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-white mb-2">Sell</h3>
              <p className="text-gray-400 text-sm">Sell the property for profit</p>
            </button>
          </div>
        </div>
        ) : (
        <div className="bg-gray-900/30 rounded-xl p-8 opacity-50 border-2 border-dashed border-gray-600">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <span className="text-4xl">🚪</span> Exit Strategy
          </h2>
          <div className="text-center py-8">
            <p className="text-gray-400 text-lg">Enter purchase details above to unlock exit strategy options</p>
          </div>
        </div>
        )}

        {/* Rest of calculator - only show if exit strategy is selected */}
        {exitStrategy && (
          <div id="calculator-content">
            {/* Refinance Section - only show for refinance-rent */}
            {exitStrategy === 'refinance-rent' && (
              <div className="bg-gray-900 rounded-xl p-8 mb-8 animate-enter-subtle-delayed">
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                  <span className="text-4xl">🔄</span> Refinance
                </h2>

    
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Left Side - New Finance */}
                    <div className="flex">
                      <div className="bg-gray-800 rounded-xl p-6 w-full flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          Refinance Details
                        </h3>
                      <div className="space-y-4 flex-1">
                        {/* Expected Valuation */}
                        <div>
                          <label className="text-sm text-gray-300 mb-2 block">Expected Valuation</label>
                          <input
                            type="text"
                            value={editingInput === 'expectedGDV' ? refinanceDetails.expectedGDV : formatCurrency(refinanceDetails.expectedGDV)}
                            onChange={(e) => handleCurrencyChange(e.target.value, (val) => setRefinanceDetails(prev => ({ ...prev, expectedGDV: val })))}
                            onFocus={() => setEditingInput('expectedGDV')}
                            onBlur={() => setEditingInput(null)}
                            className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            placeholder="£0.00"
                          />
                        </div>
                        
                        {/* New Loan Amount (LTV) */}
                        <div>
                          <label className="text-sm text-gray-300 mb-2 block">New Loan Amount (LTV)</label>
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <input
                                  type="text"
                                  value={refinanceDetails.newLoanLTV}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                      setRefinanceDetails(prev => ({ ...prev, newLoanLTV: value }))
                                    }
                                  }}
                                  className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                  placeholder="75.0" 
                                />
                                <div className="text-xs text-gray-400 mt-1">%</div>
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={formatCurrency(newLoanAmount.toString())}
                                  readOnly
                                  className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm font-semibold opacity-90 cursor-not-allowed"
                                  placeholder="£0.00"
                                />
                                <div className="text-xs text-gray-400 mt-1">Amount</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Interest Rate */}
                        <div>
                          <label className="text-sm text-gray-300 mb-2 block">Interest Rate</label>
                          <input
                            type="text"
                            value={refinanceDetails.interestRate}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                setRefinanceDetails(prev => ({ ...prev, interestRate: value }))
                              }
                            }}
                            className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            placeholder="5.5"
                          />
                          <div className="text-xs text-gray-400 mt-1">% per annum</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                    {/* Right Side - Refinance Costs */}
                    <div className="flex">
                      <div className="bg-gray-800 rounded-xl p-6 w-full flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">
                          Costs
                        </h3>
                      <div className="space-y-4 flex-1">
                        <div>
                          <label className="text-sm text-gray-300 mb-2 block">Broker Fees</label>
                          <input
                            type="text"
                            value={editingInput === 'brokerFees' ? refinanceDetails.brokerFees : formatCurrency(refinanceDetails.brokerFees)}
                            onChange={(e) => handleCurrencyChange(e.target.value, (val) => setRefinanceDetails(prev => ({ ...prev, brokerFees: val })))}
                            onFocus={() => setEditingInput('brokerFees')}
                            onBlur={() => setEditingInput(null)}
                            className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            placeholder="£0.00"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-300 mb-2 block">Legal Fees</label>
                          <input
                            type="text"
                            value={editingInput === 'legalFees' ? refinanceDetails.legalFees : formatCurrency(refinanceDetails.legalFees)}
                            onChange={(e) => handleCurrencyChange(e.target.value, (val) => setRefinanceDetails(prev => ({ ...prev, legalFees: val })))}
                            onFocus={() => setEditingInput('legalFees')}
                            onBlur={() => setEditingInput(null)}
                            className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            placeholder="£0.00"
                          />
                        </div>
                        <div className="pt-4 border-t border-gray-500 mt-auto">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Total Costs:</span>
                            <span className="text-lg font-bold text-white">£{refinanceCostsTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                  
                  {/* Money Left in the Deal */}
                  <div className="mt-8 bg-gray-800 border-2 border-blue-500 rounded-xl p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">
                      Refinance Summary
                    </h3>
                    <div className="text-right">
                      <span className={`text-4xl font-bold ${moneyLeftInDeal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {moneyLeftInDeal >= 0 ? '+' : ''}£{Math.abs(moneyLeftInDeal).toLocaleString()}
                      </span>
                      <div className="text-sm text-gray-400 mt-1">
                        {moneyLeftInDeal >= 0 ? 'Surplus funds on refinance' : 'Shortfall funds on refinance'}
                      </div>
                    </div>
                  </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="text-sm text-gray-300 mb-2">New Loan Amount</div>
                        <div className="text-xl font-bold text-white">£{newLoanAmount.toLocaleString()}</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="text-sm text-gray-300 mb-2">
                          {isCashPurchase
                            ? 'Cash Purchase'
                            : isBridging
                            ? 'Purchase Bridging Repayment'
                            : 'Purchase Mortgage Repayment'
                          }
                        </div>
                        <div className="text-xl font-bold text-white">-£{financeRepaymentTotal.toLocaleString()}</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="text-sm text-gray-300 mb-2">Refinance Costs</div>
                        <div className="text-xl font-bold text-white">-£{refinanceCostsTotal.toLocaleString()}</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="text-sm text-gray-300 mb-2">Total Project Costs</div>
                        <div className="text-xl font-bold text-white">-£{totalProjectCosts.toLocaleString()}</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="text-sm text-gray-300 mb-2">Funding Interest</div>
                        <div className="text-xl font-bold text-white">-£{totalFundingInterest.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
    
              </div>
            )}
            
            {/* Sale Section - only show for flip-sell */}
            {exitStrategy === 'flip-sell' && (
              <div className="bg-gray-900 rounded-xl p-8 mb-8 animate-enter-subtle-delayed">
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                  <span className="text-4xl">💰</span> Sale
                </h2>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Left Side - Sale Details */}
                  <div className="flex">
                    <div className="bg-gray-800 rounded-xl p-6 w-full flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-4">
                        Sale Details
                      </h3>
                    <div className="space-y-4 flex-1">
                      {/* Expected Sale Price */}
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Expected Sale Price</label>
                        <input
                          type="text"
                          value={editingInput === 'expectedSalePrice' ? saleDetails.expectedSalePrice : formatCurrency(saleDetails.expectedSalePrice)}
                          onChange={(e) => handleCurrencyChange(e.target.value, (val) => setSaleDetails(prev => ({ ...prev, expectedSalePrice: val })))}
                          onFocus={() => setEditingInput('expectedSalePrice')}
                          onBlur={() => setEditingInput(null)}
                          className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="£0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                  {/* Right Side - Sale Costs */}
                  <div className="flex">
                    <div className="bg-gray-800 rounded-xl p-6 w-full flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-4">
                        Sale Costs
                      </h3>
                    <div className="space-y-4 flex-1">
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Agency Fee</label>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <input
                                type="text"
                                value={saleDetails.agencyFeePercent}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                    setSaleDetails(prev => ({ ...prev, agencyFeePercent: value }))
                                  }
                                }}
                                className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                placeholder="1.5"
                              />
                              <div className="text-xs text-gray-400 mt-1">%</div>
                            </div>
                            <div>
                              <input
                                type="text"
                                value={formatCurrency(agencyFeeAmount.toString())}
                                readOnly
                                className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm font-semibold opacity-90 cursor-not-allowed"
                                placeholder="£0.00"
                              />
                              <div className="text-xs text-gray-400 mt-1">Amount</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Legal Fees</label>
                        <input
                          type="text"
                          value={editingInput === 'saleLegalFees' ? saleDetails.legalFees : formatCurrency(saleDetails.legalFees)}
                          onChange={(e) => handleCurrencyChange(e.target.value, (val) => setSaleDetails(prev => ({ ...prev, legalFees: val })))}
                          onFocus={() => setEditingInput('saleLegalFees')}
                          onBlur={() => setEditingInput(null)}
                          className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="£0.00"
                        />
                      </div>
                      <div className="pt-4 border-t border-gray-500 mt-auto">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Total Sale Costs:</span>
                          <span className="text-lg font-bold text-white">£{saleCostsTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                {/* Total Profit/Loss */}
                <div className="mt-8 bg-gray-800 border-2 border-blue-500 rounded-xl p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">
                    Total Profit/Loss
                  </h3>
                  <span className={`text-4xl font-bold ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    £{totalProfitLoss.toLocaleString()}
                  </span>
                </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-sm text-gray-300 mb-2">Sale Price</div>
                      <div className="text-xl font-bold text-white">£{expectedSalePrice.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-sm text-gray-300 mb-2">
                        {isCashPurchase
                          ? 'Cash Purchase'
                          : isBridging
                          ? 'Purchase Bridging Repayment'
                          : 'Purchase Mortgage Repayment'
                        }
                      </div>
                      <div className="text-xl font-bold text-white">-£{financeRepaymentTotal.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-sm text-gray-300 mb-2">Sale Costs</div>
                      <div className="text-xl font-bold text-white">-£{saleCostsTotal.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-sm text-gray-300 mb-2">Total Project Costs</div>
                      <div className="text-xl font-bold text-white">-£{totalProjectCosts.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-sm text-gray-300 mb-2">Funding Interest</div>
                      <div className="text-xl font-bold text-white">-£{totalFundingInterest.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Rent Section - Hide for Sell exit strategy */}
            {exitStrategy !== 'flip-sell' && (
              <div className="bg-gray-900 rounded-xl p-8 animate-enter-subtle-delayed-2">
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                  <span className="text-4xl">🏠</span> Rent
                </h2>
                
                {/* Monthly Income & Expenses - Side by Side */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Monthly Income */}
                  <div className="bg-gray-800 rounded-xl p-8">
                    <h3 className="text-2xl font-bold text-white mb-6">
                      Monthly Income
                    </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-3 block font-medium">Unit 1 Rent</label>
                  <input
                    type="text"
                    value={editingInput === 'rent1' ? monthlyIncome.rent1 : formatCurrency(monthlyIncome.rent1)}
                    onChange={(e) => handleCurrencyChange(e.target.value, (val) => setMonthlyIncome(prev => ({ ...prev, rent1: val })))}
                    onFocus={() => setEditingInput('rent1')}
                    onBlur={() => setEditingInput(null)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    placeholder="£0.00"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-3 block font-medium">Unit 2 Rent</label>
                  <input
                    type="text"
                    value={editingInput === 'rent2' ? monthlyIncome.rent2 : formatCurrency(monthlyIncome.rent2)}
                    onChange={(e) => handleCurrencyChange(e.target.value, (val) => setMonthlyIncome(prev => ({ ...prev, rent2: val })))}
                    onFocus={() => setEditingInput('rent2')}
                    onBlur={() => setEditingInput(null)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    placeholder="£0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-3 block font-medium">Unit 3 Rent</label>
                  <input
                    type="text"
                    value={editingInput === 'rent3' ? monthlyIncome.rent3 : formatCurrency(monthlyIncome.rent3)}
                    onChange={(e) => handleCurrencyChange(e.target.value, (val) => setMonthlyIncome(prev => ({ ...prev, rent3: val })))}
                    onFocus={() => setEditingInput('rent3')}
                    onBlur={() => setEditingInput(null)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    placeholder="£0.00"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-3 block font-medium">Unit 4 Rent</label>
                  <input
                    type="text"
                    value={editingInput === 'rent4' ? monthlyIncome.rent4 : formatCurrency(monthlyIncome.rent4)}
                    onChange={(e) => handleCurrencyChange(e.target.value, (val) => setMonthlyIncome(prev => ({ ...prev, rent4: val })))}
                    onFocus={() => setEditingInput('rent4')}
                    onBlur={() => setEditingInput(null)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    placeholder="£0.00"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-3 block font-medium">Unit 5 Rent</label>
                <input
                  type="text"
                  value={editingInput === 'rent5' ? monthlyIncome.rent5 : formatCurrency(monthlyIncome.rent5)}
                  onChange={(e) => handleCurrencyChange(e.target.value, (val) => setMonthlyIncome(prev => ({ ...prev, rent5: val })))}
                  onFocus={() => setEditingInput('rent5')}
                  onBlur={() => setEditingInput(null)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  placeholder="£0.00"
                />
              </div>
              <div className="pt-6 border-t border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-green-400">Total Monthly Income</span>
                  <span className="text-3xl font-bold text-green-400">£{totalMonthlyIncome.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

                  {/* Monthly Expenses */}
                  <div className="bg-gray-800 rounded-xl p-8">
                    <h3 className="text-2xl font-bold text-white mb-6">
                      Monthly Expenses
                    </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-3 block font-medium">Service Charge</label>
                  <input
                    type="text"
                    value={editingInput === 'serviceCharge' ? monthlyExpenses.serviceCharge : formatCurrency(monthlyExpenses.serviceCharge)}
                    onChange={(e) => handleCurrencyChange(e.target.value, (val) => setMonthlyExpenses(prev => ({ ...prev, serviceCharge: val })))}
                    onFocus={() => setEditingInput('serviceCharge')}
                    onBlur={() => setEditingInput(null)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    placeholder="£0.00"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-3 block font-medium">Ground Rent</label>
                  <input
                    type="text"
                    value={editingInput === 'groundRent' ? monthlyExpenses.groundRent : formatCurrency(monthlyExpenses.groundRent)}
                    onChange={(e) => handleCurrencyChange(e.target.value, (val) => setMonthlyExpenses(prev => ({ ...prev, groundRent: val })))}
                    onFocus={() => setEditingInput('groundRent')}
                    onBlur={() => setEditingInput(null)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    placeholder="£0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-3 block font-medium">Maintenance</label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                  <input
                    type="text"
                          value={monthlyExpenses.maintenancePercent}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setMonthlyExpenses(prev => ({ ...prev, maintenancePercent: value }))
                            }
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          placeholder="5.0"
                        />
                        <div className="text-xs text-gray-400 mt-1">%</div>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={formatCurrency(maintenanceAmount.toString())}
                          readOnly
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-semibold opacity-90 cursor-not-allowed"
                    placeholder="£0.00"
                  />
                        <div className="text-xs text-gray-400 mt-1">Amount</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-3 block font-medium">Management</label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                  <input
                    type="text"
                          value={monthlyExpenses.managementPercent}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setMonthlyExpenses(prev => ({ ...prev, managementPercent: value }))
                            }
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          placeholder="10.0"
                        />
                        <div className="text-xs text-gray-400 mt-1">%</div>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={formatCurrency(managementAmount.toString())}
                          readOnly
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-semibold opacity-90 cursor-not-allowed"
                    placeholder="£0.00"
                  />
                        <div className="text-xs text-gray-400 mt-1">Amount</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`grid grid-cols-1 ${isCashPurchase ? 'sm:grid-cols-1' : 'sm:grid-cols-2'} gap-4`}>
                <div>
                  <label className="text-sm text-gray-300 mb-3 block font-medium">Insurance</label>
                  <input
                    type="text"
                    value={editingInput === 'insurance' ? monthlyExpenses.insurance : formatCurrency(monthlyExpenses.insurance)}
                    onChange={(e) => handleCurrencyChange(e.target.value, (val) => setMonthlyExpenses(prev => ({ ...prev, insurance: val })))}
                    onFocus={() => setEditingInput('insurance')}
                    onBlur={() => setEditingInput(null)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    placeholder="£0.00"
                  />
                </div>
                {(isMortgage || exitStrategy === 'refinance-rent') && (
                  <div>
                    <label className="text-sm text-gray-300 mb-3 block font-medium">Mortgage Payment (Interest Only)</label>
                    <input
                      type="text"
                      value={formatCurrency((calculatedMortgagePayment + refinanceMortgagePayment).toString())}
                      readOnly
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold opacity-90 cursor-not-allowed"
                      placeholder="£0.00"
                    />
                    <div className="mt-1 text-xs text-gray-400">
                      Calculated from loan amount and interest rate
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-6 border-t border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-red-400">Total Monthly Expenses</span>
                  <span className="text-3xl font-bold text-red-400">£{totalMonthlyExpenses.toLocaleString()}</span>
                </div>
              </div>
                    </div>
                  </div>
                </div>
                
                {/* Key Performance Indicators - Full Width */}
                <div className="bg-gray-800 rounded-xl p-8 mt-8 animate-enter-subtle-delayed-3">
                  <h3 className="text-2xl font-bold text-white mb-6">
                    Key Performance Indicators
                  </h3>
                  {/* Standard KPIs for Rent and Refinance exit strategies */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white animate-enter-subtle-delayed">
                      <div className="text-sm opacity-90 mb-2">Net Monthly Income</div>
                      <div className="text-3xl font-bold">£{netMonthlyIncome.toLocaleString()}</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white animate-enter-subtle-delayed-2">
                      <div className="text-sm opacity-90 mb-2">Net Yearly Income</div>
                      <div className="text-3xl font-bold">£{netYearlyIncome.toLocaleString()}</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white animate-enter-subtle-delayed-3">
                      <div className="text-sm opacity-90 mb-2">ROCE</div>
                      <div className="text-3xl font-bold">
                        {roce === Infinity ? '∞' : `${roce.toFixed(2)}%`}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white animate-enter-subtle-delayed">
                      <div className="text-sm opacity-90 mb-2">Annual Yield</div>
                      <div className="text-3xl font-bold">{annualYield.toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface PropertyData {
  data: any
}

export default function InvestPage() {
  const router = useRouter()
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Load persisted data on mount
  useEffect(() => {
    // Load property data
    const persistedPropertyData = loadPropertyData()
    if (persistedPropertyData) {
      setPropertyData(persistedPropertyData)
      setLoading(false)
    } else {
      // Load property data from API if not persisted
      loadPropertyDataFromAPI()
    }
  }, [])

  // Save property data when it changes
  useEffect(() => {
    if (propertyData) {
      savePropertyData(propertyData)
    }
  }, [propertyData])

  const loadPropertyDataFromAPI = async () => {
    try {
      const response = await fetch('/api/property', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ address: 'N/A', postcode: 'N/A' }) 
      })
      if (response.ok) {
        const data = await response.json()
        setPropertyData(data)
      } else {
        console.error('Failed to load property data')
      }
    } catch (error) {
      console.error('Error loading property data:', error)
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="min-h-screen w-full bg-gray-950">
      <Header 
        showBackButton={true}
        onBackClick={() => router.back()}
        backButtonText="Back"
        showHomeButton={true}
        onHomeClick={() => router.push('/')}
      />

      {/* Content - Scrollable */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Investment Calculator Title */}
          <div className="text-center animate-enter-subtle-delayed">
            <h2 className="text-3xl font-bold text-white mb-8">Investment Calculator</h2>
          </div>

          {/* Investment Calculator */}
          <div className="animate-enter-subtle-delayed-3">
            <InvestmentCalculator />
          </div>
        </div>
      </div>
    </div>
  )
}



