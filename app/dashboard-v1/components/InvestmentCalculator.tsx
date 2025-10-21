'use client'

import { useEffect, useState, useRef } from 'react'
import { saveCalculatorData, loadCalculatorData, type CalculatorData } from '../../../lib/persistence'

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

export default function InvestmentCalculator({ uprn }: { uprn: string }) {
  // State for active tab
  const [activeTab, setActiveTab] = useState<'purchase' | 'refurbishment' | 'funding' | 'exit' | 'kpi'>('purchase')
  
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
    auctionFees: '',
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
  
  // Track if we've loaded data to prevent overwriting on mount
  const hasLoadedData = useRef(false)

  // Load calculator data when UPRN changes
  useEffect(() => {
    if (!uprn) return
    
    // Reset flag when property changes
    hasLoadedData.current = false
    
    const loadData = async () => {
      const savedData = await loadCalculatorData(uprn)
      
      if (savedData) {
        // Load saved data (defaults are already set when property was first searched)
        setPurchaseType(savedData.purchaseType)
        setIncludeFeesInLoan(savedData.includeFeesInLoan)
        setBridgingDetails(savedData.bridgingDetails)
        setExitStrategy(savedData.exitStrategy)
        setRefinanceDetails(savedData.refinanceDetails)
        setSaleDetails(savedData.saleDetails)
        setRefurbItems(savedData.refurbItems)
        setFundingSources(savedData.fundingSources)
        setInitialCosts(savedData.initialCosts)
        setPurchaseFinance(savedData.purchaseFinance)
        setMonthlyIncome(savedData.monthlyIncome)
        setMonthlyExpenses(savedData.monthlyExpenses)
        setPropertyValue(savedData.propertyValue)
        
        // Use setTimeout to ensure state updates have completed before allowing saves
        setTimeout(() => {
          hasLoadedData.current = true
        }, 0)
      } else {
        // No saved data found - this shouldn't happen as defaults are created on search
        // Allow saves immediately
        hasLoadedData.current = true
      }
    }
    
    loadData()
  }, [uprn])

  // Save calculator data whenever any state changes (but only after initial load)
  useEffect(() => {
    if (!uprn || !hasLoadedData.current) return
    
    const calculatorData: CalculatorData = {
      purchaseType,
      includeFeesInLoan,
      bridgingDetails,
      exitStrategy,
      refinanceDetails,
      saleDetails,
      refurbItems,
      fundingSources,
      initialCosts,
      purchaseFinance,
      monthlyIncome,
      monthlyExpenses,
      propertyValue
    }
    
    const saveData = async () => {
      await saveCalculatorData(uprn, calculatorData)
    }
    saveData()
  }, [
    uprn,
    purchaseType,
    includeFeesInLoan,
    bridgingDetails,
    exitStrategy,
    refinanceDetails,
    saleDetails,
    refurbItems,
    fundingSources,
    initialCosts,
    purchaseFinance,
    monthlyIncome,
    monthlyExpenses,
    propertyValue
  ])

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
    parseFloat(initialCosts.auctionFees || '0') + 
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

  // Calculate net monthly income
  const totalMonthlyExpenses = otherMonthlyExpenses + maintenanceAmount + managementAmount + calculatedMortgagePayment
  const netMonthlyIncome = totalMonthlyIncome - totalMonthlyExpenses

  // Calculate annual net income
  const annualNetIncome = netMonthlyIncome * 12

  // Calculate ROI
  const roi = totalInvestment > 0 ? (annualNetIncome / totalInvestment) * 100 : 0

  // Calculate yield
  const yieldPercent = purchasePriceNum > 0 ? (totalMonthlyIncome * 12 / purchasePriceNum) * 100 : 0

  // Calculate net yield
  const netYieldPercent = purchasePriceNum > 0 ? (netMonthlyIncome * 12 / purchasePriceNum) * 100 : 0

  // Calculate cash flow
  const cashFlow = netMonthlyIncome

  // Calculate total return for exit strategies
  const expectedGDV = parseFloat(refinanceDetails.expectedGDV || '0')
  const expectedSalePrice = parseFloat(saleDetails.expectedSalePrice || '0')
  const agencyFeePercent = parseFloat(saleDetails.agencyFeePercent || '0')
  const agencyFeeAmount = expectedSalePrice * (agencyFeePercent / 100)
  const saleLegalFees = parseFloat(saleDetails.legalFees || '0')
  const netSaleProceeds = expectedSalePrice - agencyFeeAmount - saleLegalFees

  // Calculate refinance details
  const newLoanLTV = parseFloat(refinanceDetails.newLoanLTV || '0')
  const newLoanAmount = expectedGDV * (newLoanLTV / 100)
  const refinanceBrokerFees = parseFloat(refinanceDetails.brokerFees || '0')
  const refinanceLegalFees = parseFloat(refinanceDetails.legalFees || '0')
  const netRefinanceProceeds = newLoanAmount - refinanceBrokerFees - refinanceLegalFees

  // Calculate total return based on exit strategy
  const totalReturn = exitStrategy === 'flip-sell' 
    ? netSaleProceeds - totalProjectCosts
    : exitStrategy === 'refinance-rent'
    ? netRefinanceProceeds - totalProjectCosts
    : 0

  // Calculate total return percentage
  const totalReturnPercent = totalProjectCosts > 0 ? (totalReturn / totalProjectCosts) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'purchase', label: 'Purchase', icon: '🏠' },
            { id: 'refurbishment', label: 'Refurbishment', icon: '🔨' },
            { id: 'funding', label: 'Funding', icon: '💰' },
            { id: 'exit', label: 'Exit Strategy', icon: '🚪' },
            { id: 'kpi', label: 'KPI', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Purchase Tab */}
      {activeTab === 'purchase' && (
        <div className="space-y-6">
          <CalculatorSection title="Purchase Details" icon="🏠">
            <div className="space-y-4">
              <InputRow
                label="Purchase Price"
                value={purchaseFinance.purchasePrice}
                onChange={(value) => handleCurrencyChange(value, (val) => setPurchaseFinance(prev => ({ ...prev, purchasePrice: val })))}
                icon="💷"
              />
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-300">Purchase Type:</span>
                <div className="flex gap-2">
                  {[
                    { value: 'mortgage', label: 'Mortgage', icon: '🏦' },
                    { value: 'cash', label: 'Cash', icon: '💵' },
                    { value: 'bridging', label: 'Bridging', icon: '🌉' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setPurchaseType(type.value as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                        purchaseType === type.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <span className="mr-1">{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {isMortgage && (
                <>
                  <InputRow
                    label="LTV %"
                    value={purchaseFinance.ltv}
                    onChange={(value) => setPurchaseFinance(prev => ({ ...prev, ltv: value }))}
                    icon="📊"
                  />
                  <CalculatorRow
                    label="Loan Amount"
                    value={formatCurrencyDisplay(baseLoanAmount.toString())}
                    percentage={`${ltvNum}%`}
                  />
                  <CalculatorRow
                    label="Deposit Required"
                    value={formatCurrencyDisplay(depositAmount.toString())}
                    percentage={`${(100 - ltvNum).toFixed(1)}%`}
                  />
                  <InputRow
                    label="Interest Rate %"
                    value={purchaseFinance.interestRate}
                    onChange={(value) => setPurchaseFinance(prev => ({ ...prev, interestRate: value }))}
                    icon="📈"
                  />
                  <InputRow
                    label="Product Fee %"
                    value={purchaseFinance.productFee}
                    onChange={(value) => setPurchaseFinance(prev => ({ ...prev, productFee: value }))}
                    icon="💳"
                  />
                  <CalculatorRow
                    label="Product Fee Amount"
                    value={formatCurrencyDisplay(productFeeAmount.toString())}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="includeFeesInLoan"
                      checked={includeFeesInLoan}
                      onChange={(e) => setIncludeFeesInLoan(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="includeFeesInLoan" className="text-sm text-gray-300">
                      Include fees in loan
                    </label>
                  </div>
                  <CalculatorRow
                    label="Final Loan Amount"
                    value={formatCurrencyDisplay(finalLoanAmount.toString())}
                    percentage={`${effectiveLTV.toFixed(1)}% LTV`}
                    isTotal
                  />
                </>
              )}

              {isBridging && (
                <>
                  <InputRow
                    label="Gross Loan %"
                    value={bridgingDetails.grossLoanPercent}
                    onChange={(value) => setBridgingDetails(prev => ({ ...prev, grossLoanPercent: value }))}
                    icon="📊"
                  />
                  <CalculatorRow
                    label="Gross Loan Amount"
                    value={formatCurrencyDisplay(grossLoanAmount.toString())}
                    percentage={`${grossLoanPercent}%`}
                  />
                  <CalculatorRow
                    label="Deposit Required"
                    value={formatCurrencyDisplay(depositAmount.toString())}
                    percentage={`${(100 - grossLoanPercent).toFixed(1)}%`}
                  />
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-300">Loan Type:</span>
                    <div className="flex gap-2">
                      {[
                        { value: 'serviced', label: 'Serviced' },
                        { value: 'retained', label: 'Retained' }
                      ].map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setBridgingDetails(prev => ({ ...prev, loanType: type.value as any }))}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                            bridgingDetails.loanType === type.value
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <InputRow
                    label="Monthly Interest %"
                    value={bridgingDetails.monthlyInterest}
                    onChange={(value) => setBridgingDetails(prev => ({ ...prev, monthlyInterest: value }))}
                    icon="📈"
                  />
                  <InputRow
                    label="Duration (months)"
                    value={bridgingDetails.duration}
                    onChange={(value) => setBridgingDetails(prev => ({ ...prev, duration: value }))}
                    icon="⏰"
                  />
                  <InputRow
                    label="Application Fee"
                    value={bridgingDetails.applicationFee}
                    onChange={(value) => handleCurrencyChange(value, (val) => setBridgingDetails(prev => ({ ...prev, applicationFee: val })))}
                    icon="💳"
                  />
                  <InputRow
                    label="Product Fee %"
                    value={purchaseFinance.productFee}
                    onChange={(value) => setPurchaseFinance(prev => ({ ...prev, productFee: value }))}
                    icon="💳"
                  />
                  <CalculatorRow
                    label="Product Fee Amount"
                    value={formatCurrencyDisplay(productFeeAmount.toString())}
                  />
                  {bridgingDetails.loanType === 'retained' && (
                    <CalculatorRow
                      label="Total Interest"
                      value={formatCurrencyDisplay(totalInterestAmount.toString())}
                    />
                  )}
                  <CalculatorRow
                    label="Net Advance"
                    value={formatCurrencyDisplay(netAdvance.toString())}
                    isTotal
                  />
                </>
              )}

              {isCashPurchase && (
                <CalculatorRow
                  label="Total Cash Required"
                  value={formatCurrencyDisplay(purchasePriceNum.toString())}
                  isTotal
                />
              )}
            </div>
          </CalculatorSection>

          <CalculatorSection title="Initial Costs" icon="💸">
            <div className="space-y-4">
              <InputRow
                label="Legal Fees"
                value={initialCosts.legal}
                onChange={(value) => handleCurrencyChange(value, (val) => setInitialCosts(prev => ({ ...prev, legal: val })))}
                icon="⚖️"
              />
              <InputRow
                label="Stamp Duty %"
                value={initialCosts.stampDutyPercent}
                onChange={(value) => setInitialCosts(prev => ({ ...prev, stampDutyPercent: value }))}
                icon="📄"
              />
              <CalculatorRow
                label="Stamp Duty Amount"
                value={formatCurrencyDisplay(stampDutyAmount.toString())}
                percentage={`${stampDutyPercent}%`}
              />
              <InputRow
                label="ILA"
                value={initialCosts.ila}
                onChange={(value) => handleCurrencyChange(value, (val) => setInitialCosts(prev => ({ ...prev, ila: val })))}
                icon="🔍"
              />
              <InputRow
                label="Broker Fees"
                value={initialCosts.brokerFees}
                onChange={(value) => handleCurrencyChange(value, (val) => setInitialCosts(prev => ({ ...prev, brokerFees: val })))}
                icon="🤝"
              />
              <InputRow
                label="Auction Fees"
                value={initialCosts.auctionFees}
                onChange={(value) => handleCurrencyChange(value, (val) => setInitialCosts(prev => ({ ...prev, auctionFees: val })))}
                icon="🔨"
              />
              <InputRow
                label="Finders Fee"
                value={initialCosts.findersFee}
                onChange={(value) => handleCurrencyChange(value, (val) => setInitialCosts(prev => ({ ...prev, findersFee: val })))}
                icon="🎯"
              />
              <CalculatorRow
                label="Total Initial Costs"
                value={formatCurrencyDisplay(totalInitialCosts.toString())}
                isTotal
              />
            </div>
          </CalculatorSection>

          <CalculatorSection title="Summary" icon="📋">
            <div className="space-y-4">
              <CalculatorRow
                label="Purchase Price"
                value={formatCurrencyDisplay(purchasePriceNum.toString())}
              />
              <CalculatorRow
                label="Initial Costs"
                value={formatCurrencyDisplay(totalInitialCosts.toString())}
              />
              <CalculatorRow
                label="Product Fee"
                value={formatCurrencyDisplay(productFeeAmount.toString())}
              />
              <CalculatorRow
                label="Total Investment"
                value={formatCurrencyDisplay(totalInvestment.toString())}
                isTotal
              />
            </div>
          </CalculatorSection>
        </div>
      )}

      {/* Refurbishment Tab */}
      {activeTab === 'refurbishment' && (
        <div className="space-y-6">
          <CalculatorSection title="Refurbishment Items" icon="🔨">
            <div className="space-y-4">
              {refurbItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateRefurbItem(item.id, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                    />
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <input
                        type="text"
                        value={item.amount}
                        onChange={(e) => handleCurrencyChange(e.target.value, (val) => updateRefurbItem(item.id, 'amount', val))}
                        placeholder="0.00"
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-right placeholder-gray-500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">£</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeRefurbItem(item.id)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    disabled={refurbItems.length === 1}
                  >
                    🗑️
                  </button>
                </div>
              ))}
              <button
                onClick={addRefurbItem}
                className="w-full py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors"
              >
                + Add Item
              </button>
              <CalculatorRow
                label="Total Refurbishment Costs"
                value={formatCurrencyDisplay(totalRefurbCosts.toString())}
                isTotal
              />
            </div>
          </CalculatorSection>
        </div>
      )}

      {/* Funding Tab */}
      {activeTab === 'funding' && (
        <div className="space-y-6">
          <CalculatorSection title="Funding Sources" icon="💰">
            <div className="space-y-4">
              {fundingSources.map((source, index) => (
                <div key={source.id} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Name</label>
                      <input
                        type="text"
                        value={source.name}
                        onChange={(e) => updateFundingSource(source.id, 'name', e.target.value)}
                        placeholder="e.g., Personal, Bank"
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Amount</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={source.amount}
                          onChange={(e) => handleCurrencyChange(e.target.value, (val) => updateFundingSource(source.id, 'amount', val))}
                          placeholder="0.00"
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-right placeholder-gray-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">£</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Interest Rate %</label>
                      <input
                        type="text"
                        value={source.interestRate}
                        onChange={(e) => updateFundingSource(source.id, 'interestRate', e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-right placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Duration (months)</label>
                      <input
                        type="text"
                        value={source.duration}
                        onChange={(e) => updateFundingSource(source.id, 'duration', e.target.value)}
                        placeholder="0"
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-right placeholder-gray-500"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => removeFundingSource(source.id)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      disabled={fundingSources.length === 1}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addFundingSource}
                className="w-full py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors"
              >
                + Add Funding Source
              </button>
              <CalculatorRow
                label="Total Funding Sources"
                value={formatCurrencyDisplay(totalFundingSources.toString())}
                isTotal
              />
            </div>
          </CalculatorSection>
        </div>
      )}

      {/* Exit Strategy Tab */}
      {activeTab === 'exit' && (
        <div className="space-y-6">
          <CalculatorSection title="Exit Strategy" icon="🚪">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-300">Strategy:</span>
                <div className="flex gap-2">
                  {[
                    { value: 'just-rent', label: 'Just Rent', icon: '🏠' },
                    { value: 'refinance-rent', label: 'Refinance & Rent', icon: '🔄' },
                    { value: 'flip-sell', label: 'Flip & Sell', icon: '💰' }
                  ].map((strategy) => (
                    <button
                      key={strategy.value}
                      onClick={() => setExitStrategy(strategy.value as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                        exitStrategy === strategy.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <span className="mr-1">{strategy.icon}</span>
                      {strategy.label}
                    </button>
                  ))}
                </div>
              </div>

              {exitStrategy === 'refinance-rent' && (
                <div className="space-y-4">
                  <InputRow
                    label="Expected GDV"
                    value={refinanceDetails.expectedGDV}
                    onChange={(value) => handleCurrencyChange(value, (val) => setRefinanceDetails(prev => ({ ...prev, expectedGDV: val })))}
                    icon="📈"
                  />
                  <InputRow
                    label="New Loan LTV %"
                    value={refinanceDetails.newLoanLTV}
                    onChange={(value) => setRefinanceDetails(prev => ({ ...prev, newLoanLTV: value }))}
                    icon="📊"
                  />
                  <CalculatorRow
                    label="New Loan Amount"
                    value={formatCurrencyDisplay(newLoanAmount.toString())}
                    percentage={`${newLoanLTV}%`}
                  />
                  <InputRow
                    label="Interest Rate %"
                    value={refinanceDetails.interestRate}
                    onChange={(value) => setRefinanceDetails(prev => ({ ...prev, interestRate: value }))}
                    icon="📈"
                  />
                  <InputRow
                    label="Broker Fees"
                    value={refinanceDetails.brokerFees}
                    onChange={(value) => handleCurrencyChange(value, (val) => setRefinanceDetails(prev => ({ ...prev, brokerFees: val })))}
                    icon="🤝"
                  />
                  <InputRow
                    label="Legal Fees"
                    value={refinanceDetails.legalFees}
                    onChange={(value) => handleCurrencyChange(value, (val) => setRefinanceDetails(prev => ({ ...prev, legalFees: val })))}
                    icon="⚖️"
                  />
                  <CalculatorRow
                    label="Net Refinance Proceeds"
                    value={formatCurrencyDisplay(netRefinanceProceeds.toString())}
                    isTotal
                  />
                </div>
              )}

              {exitStrategy === 'flip-sell' && (
                <div className="space-y-4">
                  <InputRow
                    label="Expected Sale Price"
                    value={saleDetails.expectedSalePrice}
                    onChange={(value) => handleCurrencyChange(value, (val) => setSaleDetails(prev => ({ ...prev, expectedSalePrice: val })))}
                    icon="💰"
                  />
                  <InputRow
                    label="Agency Fee %"
                    value={saleDetails.agencyFeePercent}
                    onChange={(value) => setSaleDetails(prev => ({ ...prev, agencyFeePercent: value }))}
                    icon="🏢"
                  />
                  <CalculatorRow
                    label="Agency Fee Amount"
                    value={formatCurrencyDisplay(agencyFeeAmount.toString())}
                    percentage={`${agencyFeePercent}%`}
                  />
                  <InputRow
                    label="Legal Fees"
                    value={saleDetails.legalFees}
                    onChange={(value) => handleCurrencyChange(value, (val) => setSaleDetails(prev => ({ ...prev, legalFees: val })))}
                    icon="⚖️"
                  />
                  <CalculatorRow
                    label="Net Sale Proceeds"
                    value={formatCurrencyDisplay(netSaleProceeds.toString())}
                    isTotal
                  />
                </div>
              )}
            </div>
          </CalculatorSection>
        </div>
      )}

      {/* KPI Tab */}
      {activeTab === 'kpi' && (
        <div className="space-y-6">
          <CalculatorSection title="Monthly Income" icon="💰">
            <div className="space-y-4">
              <InputRow
                label="Rent 1"
                value={monthlyIncome.rent1}
                onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyIncome(prev => ({ ...prev, rent1: val })))}
                icon="🏠"
              />
              <InputRow
                label="Rent 2"
                value={monthlyIncome.rent2}
                onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyIncome(prev => ({ ...prev, rent2: val })))}
                icon="🏠"
              />
              <InputRow
                label="Rent 3"
                value={monthlyIncome.rent3}
                onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyIncome(prev => ({ ...prev, rent3: val })))}
                icon="🏠"
              />
              <InputRow
                label="Rent 4"
                value={monthlyIncome.rent4}
                onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyIncome(prev => ({ ...prev, rent4: val })))}
                icon="🏠"
              />
              <InputRow
                label="Rent 5"
                value={monthlyIncome.rent5}
                onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyIncome(prev => ({ ...prev, rent5: val })))}
                icon="🏠"
              />
              <CalculatorRow
                label="Total Monthly Income"
                value={formatCurrencyDisplay(totalMonthlyIncome.toString())}
                isTotal
              />
            </div>
          </CalculatorSection>

          <CalculatorSection title="Monthly Expenses" icon="💸">
            <div className="space-y-4">
              <InputRow
                label="Service Charge"
                value={monthlyExpenses.serviceCharge}
                onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyExpenses(prev => ({ ...prev, serviceCharge: val })))}
                icon="🏢"
              />
              <InputRow
                label="Ground Rent"
                value={monthlyExpenses.groundRent}
                onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyExpenses(prev => ({ ...prev, groundRent: val })))}
                icon="🌱"
              />
              <InputRow
                label="Maintenance %"
                value={monthlyExpenses.maintenancePercent}
                onChange={(value) => setMonthlyExpenses(prev => ({ ...prev, maintenancePercent: value }))}
                icon="🔧"
              />
              <CalculatorRow
                label="Maintenance Amount"
                value={formatCurrencyDisplay(maintenanceAmount.toString())}
                percentage={`${maintenancePercent}%`}
              />
              <InputRow
                label="Management %"
                value={monthlyExpenses.managementPercent}
                onChange={(value) => setMonthlyExpenses(prev => ({ ...prev, managementPercent: value }))}
                icon="👥"
              />
              <CalculatorRow
                label="Management Amount"
                value={formatCurrencyDisplay(managementAmount.toString())}
                percentage={`${managementPercent}%`}
              />
              <InputRow
                label="Insurance"
                value={monthlyExpenses.insurance}
                onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyExpenses(prev => ({ ...prev, insurance: val })))}
                icon="🛡️"
              />
              {isMortgage && (
                <CalculatorRow
                  label="Mortgage Payment"
                  value={formatCurrencyDisplay(calculatedMortgagePayment.toString())}
                />
              )}
              <CalculatorRow
                label="Total Monthly Expenses"
                value={formatCurrencyDisplay(totalMonthlyExpenses.toString())}
                isTotal
              />
            </div>
          </CalculatorSection>

          <CalculatorSection title="Key Performance Indicators" icon="📊">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
                <div className="text-sm opacity-90 mb-2">Net Monthly Income</div>
                <div className="text-3xl font-bold">£{netMonthlyIncome.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                <div className="text-sm opacity-90 mb-2">Annual Net Income</div>
                <div className="text-3xl font-bold">£{annualNetIncome.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
                <div className="text-sm opacity-90 mb-2">ROI</div>
                <div className="text-3xl font-bold">{roi.toFixed(1)}%</div>
              </div>
              <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white">
                <div className="text-sm opacity-90 mb-2">Yield</div>
                <div className="text-3xl font-bold">{yieldPercent.toFixed(1)}%</div>
              </div>
              <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-6 text-white">
                <div className="text-sm opacity-90 mb-2">Net Yield</div>
                <div className="text-3xl font-bold">{netYieldPercent.toFixed(1)}%</div>
              </div>
              <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl p-6 text-white">
                <div className="text-sm opacity-90 mb-2">Cash Flow</div>
                <div className="text-3xl font-bold">£{cashFlow.toLocaleString()}</div>
              </div>
              {exitStrategy && exitStrategy !== 'just-rent' && (
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-6 text-white">
                  <div className="text-sm opacity-90 mb-2">Total Return</div>
                  <div className="text-3xl font-bold">£{totalReturn.toLocaleString()}</div>
                </div>
              )}
              {exitStrategy && exitStrategy !== 'just-rent' && (
                <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white">
                  <div className="text-sm opacity-90 mb-2">Total Return %</div>
                  <div className="text-3xl font-bold">{totalReturnPercent.toFixed(1)}%</div>
                </div>
              )}
            </div>
          </CalculatorSection>
        </div>
      )}
    </div>
  )
}
