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
    <div className={`bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl shadow-lg ${className}`}>
      <div className="px-4 py-3 border-b border-gray-500/30">
        <div className="flex items-center gap-2">
          {icon && <span className="text-sm">{icon}</span>}
          <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        </div>
      </div>
      <div className="p-4">
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
    <div className={`flex items-center justify-between py-2 px-3 rounded-md ${
      isTotal 
        ? 'bg-green-500/10 border border-green-500/30 font-semibold text-green-200' 
        : 'bg-gray-800/30 border border-gray-600/20'
    }`}>
      <span className="text-xs text-gray-300">{label}</span>
      <div className="flex items-center gap-3">
        {percentage && (
          <span className={`text-xs px-2 py-1 rounded-full bg-gray-600/50 ${getTrendColor()}`}>
            {percentage}
          </span>
        )}
        <span className={`text-xs font-medium ${isTotal ? 'text-green-200' : 'text-gray-100'}`}>
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
  icon,
  showCurrency = true,
  formatWithCommas = false
}: { 
  label: string, 
  value: string, 
  onChange: (value: string) => void, 
  percentage?: string, 
  isTotal?: boolean, 
  type?: string,
  icon?: string,
  showCurrency?: boolean,
  formatWithCommas?: boolean
}) {
  // Format currency with commas for display while typing
  const formatCurrencyWithCommas = (value: string) => {
    if (!value || value === '') return ''
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return num.toLocaleString('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }

  const displayValue = formatWithCommas ? formatCurrencyWithCommas(value) : value

  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors hover:bg-gray-700/20 ${
      isTotal 
        ? 'bg-green-500/10 border border-green-500/30 font-semibold text-green-200' 
        : 'bg-gray-800/30 border border-gray-600/20'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-300">{label}</span>
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
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            className={`w-24 text-right text-xs font-medium border rounded-md px-2 py-1 transition-all duration-200 focus:ring-1 ${
              isTotal 
                ? 'bg-green-900/20 text-green-200 border-green-600 focus:border-green-500 focus:ring-green-500/20' 
                : 'bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 placeholder-gray-500'
            }`}
            placeholder="0.00"
          />
          {showCurrency && (
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <span className="text-gray-500 text-xs">£</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PercentageAmountRow({ 
  label, 
  percentageValue, 
  onPercentageChange, 
  amountValue,
  onAmountChange,
  baseAmount,
  isTotal = false
}: { 
  label: string, 
  percentageValue: string, 
  onPercentageChange: (value: string) => void, 
  amountValue: string,
  onAmountChange: (value: string) => void,
  baseAmount: number,
  isTotal?: boolean
}) {
  // Format currency with commas for display while typing
  const formatCurrencyWithCommas = (value: string) => {
    if (!value || value === '') return ''
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return num.toLocaleString('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }

  const displayAmount = formatCurrencyWithCommas(amountValue)

  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors hover:bg-gray-700/20 ${
      isTotal 
        ? 'bg-green-500/10 border border-green-500/30 font-semibold text-green-200' 
        : 'bg-gray-800/30 border border-gray-600/20'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-300">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={percentageValue}
              onChange={(e) => onPercentageChange(e.target.value)}
              className={`w-16 text-right text-xs font-medium border rounded-md px-2 py-1 pr-6 transition-all duration-200 focus:ring-1 ${
                isTotal 
                  ? 'bg-green-900/20 text-green-200 border-green-600 focus:border-green-500 focus:ring-green-500/20' 
                  : 'bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 placeholder-gray-500'
              }`}
              placeholder="0"
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <span className="text-gray-500 text-xs">%</span>
            </div>
          </div>
          <span className="text-xs text-gray-400">=</span>
          <div className="relative">
            <input
              type="text"
              value={displayAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              className={`w-20 text-right text-xs font-medium border rounded-md px-2 py-1 pl-6 transition-all duration-200 focus:ring-1 ${
                isTotal 
                  ? 'bg-green-900/20 text-green-200 border-green-600 focus:border-green-500 focus:ring-green-500/20' 
                  : 'bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 placeholder-gray-500'
              }`}
              placeholder="0"
            />
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <span className="text-gray-500 text-xs">£</span>
            </div>
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
    grossLoanAmount: '',
    monthlyInterest: '',
    applicationFee: ''
  })
  
  // State for exit strategy
  const [exitStrategy, setExitStrategy] = useState<'just-rent' | 'refinance-rent' | 'flip-sell' | null>(null)
  
  // State for refinance details
  const [refinanceDetails, setRefinanceDetails] = useState({
    expectedGDV: '',
    newLoanLTV: '',
    newLoanAmount: '',
    interestRate: '',
    brokerFees: '',
    legalFees: ''
  })
  
  // State for sale details
  const [saleDetails, setSaleDetails] = useState({
    expectedSalePrice: '',
    agencyFeePercent: '',
    agencyFeeAmount: '',
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
    stampDutyAmount: '',
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
    productFeeAmount: '',
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
    maintenanceAmount: '',
    managementPercent: '',
    managementAmount: '',
    insurance: '',
    mortgagePayment: ''
  })

  const [propertyValue, setPropertyValue] = useState('')
  
  // Track if we've loaded data to prevent overwriting on mount
  const hasLoadedData = useRef(false)
  const isInitialMount = useRef(true)

  // Load calculator data when UPRN changes
  useEffect(() => {
    if (!uprn) return
    
    // Reset flags when property changes
    hasLoadedData.current = false
    isInitialMount.current = true
    
    const loadData = async () => {
      const savedData = await loadCalculatorData(uprn)
      
      if (savedData) {
        // Load saved data (defaults are already set when property was first searched)
        setPurchaseType(savedData.purchaseType)
        setIncludeFeesInLoan(savedData.includeFeesInLoan)
        setBridgingDetails({
          ...savedData.bridgingDetails,
          grossLoanAmount: (savedData.bridgingDetails as any)?.grossLoanAmount || ''
        })
        setExitStrategy(savedData.exitStrategy)
        setRefinanceDetails({
          ...savedData.refinanceDetails,
          newLoanAmount: (savedData.refinanceDetails as any)?.newLoanAmount || ''
        })
        setSaleDetails({
          ...savedData.saleDetails,
          agencyFeeAmount: (savedData.saleDetails as any)?.agencyFeeAmount || ''
        })
        setRefurbItems(savedData.refurbItems)
        setFundingSources(savedData.fundingSources)
        setInitialCosts({
          ...savedData.initialCosts,
          stampDutyAmount: (savedData.initialCosts as any)?.stampDutyAmount || ''
        })
        setPurchaseFinance({
          ...savedData.purchaseFinance,
          productFeeAmount: (savedData.purchaseFinance as any)?.productFeeAmount || ''
        })
        setMonthlyIncome(savedData.monthlyIncome)
        setMonthlyExpenses({
          ...savedData.monthlyExpenses,
          maintenanceAmount: (savedData.monthlyExpenses as any)?.maintenanceAmount || '',
          managementAmount: (savedData.monthlyExpenses as any)?.managementAmount || ''
        })
        setPropertyValue(savedData.propertyValue)
        
        // Use setTimeout to ensure state updates have completed before allowing saves
        setTimeout(() => {
          hasLoadedData.current = true
          isInitialMount.current = false
        }, 0)
      } else {
        // No saved data found - allow saves after a short delay to prevent immediate overwrite
        setTimeout(() => {
          hasLoadedData.current = true
          isInitialMount.current = false
        }, 100)
      }
    }
    
    loadData()
  }, [uprn])

  // Save calculator data whenever any state changes (but only after initial load and not on mount)
  useEffect(() => {
    if (!uprn || !hasLoadedData.current || isInitialMount.current) return
    
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
      isInitialMount.current = false
    }
  }

  // Format currency with commas for display while typing
  const formatCurrencyWithCommas = (value: string) => {
    if (!value || value === '') return ''
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return num.toLocaleString('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }

  // Wrapper functions for input handlers
  const handlePurchaseTypeChange = (value: 'mortgage' | 'cash' | 'bridging') => {
    setPurchaseType(value)
    isInitialMount.current = false
  }

  const handleExitStrategyChange = (value: 'just-rent' | 'refinance-rent' | 'flip-sell') => {
    setExitStrategy(value)
    isInitialMount.current = false
  }

  const handleIncludeFeesChange = (checked: boolean) => {
    setIncludeFeesInLoan(checked)
    isInitialMount.current = false
  }

  // Wrapper for non-currency setters
  const handleNonCurrencyChange = (setter: (value: any) => void, value: any) => {
    setter(value)
    isInitialMount.current = false
  }


  // Helper functions for percentage/amount conversion
  const handlePercentageChange = (percentageValue: string, baseAmount: number, setPercentage: (value: string) => void, setAmount: (value: string) => void) => {
    setPercentage(percentageValue)
    const percentage = parseFloat(percentageValue) || 0
    const calculatedAmount = baseAmount * (percentage / 100)
    setAmount(calculatedAmount.toString())
    isInitialMount.current = false
  }

  const handleAmountChange = (amountValue: string, baseAmount: number, setPercentage: (value: string) => void, setAmount: (value: string) => void) => {
    const cleaned = parseCurrency(amountValue)
    if (cleaned === '' || /^\d*\.?\d*$/.test(cleaned)) {
      setAmount(cleaned)
      const amount = parseFloat(cleaned) || 0
      const calculatedPercentage = baseAmount > 0 ? (amount / baseAmount) * 100 : 0
      setPercentage(calculatedPercentage.toString())
      isInitialMount.current = false
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

  // Auto-set exit strategy based on purchase type
  useEffect(() => {
    if (isInitialMount.current) return
    
    if (isMortgage) {
      // Mortgage can only be "Just Rent"
      setExitStrategy('just-rent')
    } else if (isBridging) {
      // Bridging cannot be "Just Rent", default to "Refinance & Rent"
      if (exitStrategy === 'just-rent') {
        setExitStrategy('refinance-rent')
      }
    }
    // Cash can have any exit strategy, no change needed
  }, [purchaseType, isMortgage, isBridging, exitStrategy])
  
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
  
  // Calculate cost of finance
  const costOfFinance = isCashPurchase 
    ? purchasePriceNum 
    : isBridging 
    ? (purchasePriceNum - netAdvance)
    : (depositAmount + (!includeFeesInLoan ? productFeeAmount : 0))
  
  // Calculate total project costs (Cost of Finance + Initial Costs + Refurbishment Costs)
  const totalProjectCosts = costOfFinance + totalInitialCosts + totalRefurbCosts
  
  // Calculate total funding sources
  const totalFundingSources = fundingSources.reduce((total, source) => {
    return total + parseFloat(source.amount || '0')
  }, 0)

  // Calculate funding gap/surplus
  const fundingGap = totalProjectCosts - totalFundingSources
  const isFundingShortfall = fundingGap > 0

  // Calculate net monthly income (will be updated after currentMortgagePayment is calculated)
  let totalMonthlyExpenses = otherMonthlyExpenses + maintenanceAmount + managementAmount + calculatedMortgagePayment
  let netMonthlyIncome = totalMonthlyIncome - totalMonthlyExpenses

  // Calculate annual net income (will be updated after final netMonthlyIncome is calculated)
  let annualNetIncome = netMonthlyIncome * 12


  // Calculate net yield
  const netYieldPercent = purchasePriceNum > 0 ? (netMonthlyIncome * 12 / purchasePriceNum) * 100 : 0

  // Calculate cash flow
  const cashFlow = netMonthlyIncome

  // Calculate total return for exit strategies
  const expectedGDV = parseFloat(refinanceDetails.expectedGDV || '0')
  const expectedSalePrice = parseFloat(saleDetails.expectedSalePrice || '0')

  // Calculate Yield - Gross annual income / purchase price (or refinance price for refinance deals)
  const basePrice = exitStrategy === 'refinance-rent' && expectedGDV > 0 ? expectedGDV : purchasePriceNum
  const yieldPercent = basePrice > 0 ? (totalMonthlyIncome * 12 / basePrice) * 100 : 0
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

  // Calculate ROCE (Return on Capital Employed) based on exit strategy
  let roce = 0
  if (exitStrategy === 'just-rent') {
    // For rent: Net Annual Income / total project costs
    roce = totalProjectCosts > 0 ? (annualNetIncome / totalProjectCosts) * 100 : 0
  } else if (exitStrategy === 'refinance-rent') {
    // ROCE will be calculated after moneyLeftInDeal is defined
    roce = 0
  } else if (exitStrategy === 'flip-sell') {
    // ROCE will be calculated after totalReturn is defined
    roce = 0
  }

  // Calculate mortgage payment based on exit strategy
  const currentMortgagePayment = exitStrategy === 'refinance-rent' && newLoanAmount > 0
    ? (newLoanAmount * (parseFloat(refinanceDetails.interestRate || '0') / 100)) / 12
    : calculatedMortgagePayment

  // Update total monthly expenses with correct mortgage payment
  totalMonthlyExpenses = otherMonthlyExpenses + maintenanceAmount + managementAmount + currentMortgagePayment
  netMonthlyIncome = totalMonthlyIncome - totalMonthlyExpenses
  annualNetIncome = netMonthlyIncome * 12

  // Calculate total return based on exit strategy
  const totalReturn = exitStrategy === 'flip-sell' 
    ? netSaleProceeds - totalProjectCosts
    : exitStrategy === 'refinance-rent'
    ? netRefinanceProceeds - totalProjectCosts
    : 0

  // Update ROCE calculation for flip-sell now that totalReturn is available
  if (exitStrategy === 'flip-sell') {
    // For flip: Net Profit / total project costs
    roce = totalProjectCosts > 0 ? (totalReturn / totalProjectCosts) * 100 : 0
  }

  // Calculate total return percentage
  const totalReturnPercent = totalProjectCosts > 0 ? (totalReturn / totalProjectCosts) * 100 : 0

  // Calculate total funding interest from all funding sources
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

  const totalFundingInterest = calculateTotalFundingInterest()

  // Calculate finance repayment total based on purchase type
  const financeRepaymentTotal = isCashPurchase 
    ? 0 
    : isBridging 
    ? grossLoanAmount 
    : finalLoanAmount

  // Calculate refinance costs total
  const refinanceCostsTotal = refinanceBrokerFees + refinanceLegalFees

  // Calculate money left in the deal (for refinance summary)
  const moneyLeftInDeal = newLoanAmount - financeRepaymentTotal - refinanceCostsTotal - totalProjectCosts - totalFundingInterest

  // Update ROCE calculation for refinance-rent now that moneyLeftInDeal is available
  if (exitStrategy === 'refinance-rent') {
    console.log('ROCE Debug - Refinance:', {
      newLoanAmount: newLoanAmount.toLocaleString(),
      financeRepaymentTotal: financeRepaymentTotal.toLocaleString(),
      refinanceCostsTotal: refinanceCostsTotal.toLocaleString(),
      totalProjectCosts: totalProjectCosts.toLocaleString(),
      totalFundingInterest: totalFundingInterest.toLocaleString(),
      moneyLeftInDeal: moneyLeftInDeal.toLocaleString(),
      annualNetIncome: annualNetIncome.toLocaleString()
    })
    
    // ROCE = Net Annual Income / |Capital Employed|
    // Capital Employed = |Money Left in Deal| (always use absolute value)
    const capitalEmployed = Math.abs(moneyLeftInDeal)
    roce = capitalEmployed > 0 ? (annualNetIncome / capitalEmployed) * 100 : 0
  }

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators - Always Displayed */}
      <CalculatorSection title="Key Performance Indicators" icon="📊">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {exitStrategy === 'flip-sell' ? (
            // For flip-sell, show net profit instead of income metrics
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <div className="text-xs text-green-300 mb-1">Net Profit</div>
              <div className="text-lg font-bold text-green-200">£{totalReturn.toLocaleString()}</div>
            </div>
          ) : (
            // For rent and refinance-rent, show income metrics
            <>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                <div className="text-xs text-green-300 mb-1">Net Monthly Income</div>
                <div className="text-lg font-bold text-green-200">£{netMonthlyIncome.toLocaleString()}</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                <div className="text-xs text-blue-300 mb-1">Net Annual Income</div>
                <div className="text-lg font-bold text-blue-200">£{annualNetIncome.toLocaleString()}</div>
              </div>
            </>
          )}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
            <div className="text-xs text-purple-300 mb-1">ROCE</div>
            <div className="text-lg font-bold text-purple-200">
              {`${roce.toFixed(1)}%`}
            </div>
          </div>
          {exitStrategy !== 'flip-sell' && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-center">
              <div className="text-xs text-orange-300 mb-1">Yield</div>
              <div className="text-lg font-bold text-orange-200">{yieldPercent.toFixed(1)}%</div>
            </div>
          )}
        </div>
      </CalculatorSection>

      {/* Tab Navigation */}
      <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4 shadow-lg">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'purchase', label: 'Purchase', icon: '🏠' },
            { id: 'refurbishment', label: 'Refurbishment', icon: '🔨' },
            { id: 'funding', label: 'Funding', icon: '💰' },
            { id: 'exit', label: 'Exit Strategy', icon: '🚪' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Purchase Tab */}
      {activeTab === 'purchase' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CalculatorSection title="Financing">
            <div className="space-y-3">
              <InputRow
                label="Purchase Price"
                value={purchaseFinance.purchasePrice}
                onChange={(value) => handleCurrencyChange(value, (val) => setPurchaseFinance(prev => ({ ...prev, purchasePrice: val })))}
                formatWithCommas={true}
              />

              <div className="h-4"></div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-300">Purchase Type:</span>
                <div className="flex gap-2">
                  {[
                    { value: 'mortgage', label: 'Mortgage' },
                    { value: 'cash', label: 'Cash' },
                    { value: 'bridging', label: 'Bridging' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handlePurchaseTypeChange(type.value as any)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                        purchaseType === type.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {isMortgage && (
                <>
                  <PercentageAmountRow
                    label="LTV"
                    percentageValue={includeFeesInLoan ? ((baseLoanAmount + productFeeAmount) / purchasePriceNum * 100).toFixed(1) : purchaseFinance.ltv}
                    onPercentageChange={(value) => {
                      if (!includeFeesInLoan) {
                        handlePercentageChange(value, purchasePriceNum, (val) => setPurchaseFinance(prev => ({ ...prev, ltv: val })), (val) => setPurchaseFinance(prev => ({ ...prev, loanAmount: val })))
                      }
                    }}
                    amountValue={includeFeesInLoan ? (baseLoanAmount + productFeeAmount).toString() : purchaseFinance.loanAmount}
                    onAmountChange={(value) => {
                      if (!includeFeesInLoan) {
                        handleAmountChange(value, purchasePriceNum, (val) => setPurchaseFinance(prev => ({ ...prev, ltv: val })), (val) => setPurchaseFinance(prev => ({ ...prev, loanAmount: val })))
                      }
                    }}
                    baseAmount={purchasePriceNum}
                  />
                  <PercentageAmountRow
                    label="Product Fee"
                    percentageValue={purchaseFinance.productFee}
                    onPercentageChange={(value) => handlePercentageChange(value, baseLoanAmount, (val) => setPurchaseFinance(prev => ({ ...prev, productFee: val })), (val) => setPurchaseFinance(prev => ({ ...prev, productFeeAmount: val })))}
                    amountValue={purchaseFinance.productFeeAmount}
                    onAmountChange={(value) => handleAmountChange(value, baseLoanAmount, (val) => setPurchaseFinance(prev => ({ ...prev, productFee: val })), (val) => setPurchaseFinance(prev => ({ ...prev, productFeeAmount: val })))}
                    baseAmount={baseLoanAmount}
                  />
                  <InputRow
                    label="Mortgage Rate %"
                    value={purchaseFinance.interestRate}
                    onChange={(value) => handleNonCurrencyChange((val) => setPurchaseFinance(prev => ({ ...prev, interestRate: val })), value)}
                    showCurrency={false}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="includeFeesInLoan"
                      checked={includeFeesInLoan}
                      onChange={(e) => handleIncludeFeesChange(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="includeFeesInLoan" className="text-xs text-gray-300">
                      Add fee to mortgage
                    </label>
                  </div>
                </>
              )}

              {isBridging && (
                <>
                  <PercentageAmountRow
                    label="Gross Loan"
                    percentageValue={bridgingDetails.grossLoanPercent}
                    onPercentageChange={(value) => handlePercentageChange(value, purchasePriceNum, (val) => setBridgingDetails(prev => ({ ...prev, grossLoanPercent: val })), (val) => setBridgingDetails(prev => ({ ...prev, grossLoanAmount: val })))}
                    amountValue={grossLoanAmount.toString()}
                    onAmountChange={(value) => handleAmountChange(value, purchasePriceNum, (val) => setBridgingDetails(prev => ({ ...prev, grossLoanPercent: val })), (val) => setBridgingDetails(prev => ({ ...prev, grossLoanAmount: val })))}
                    baseAmount={purchasePriceNum}
                  />
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-300">Loan Type:</span>
                    <div className="flex gap-2">
                      {[
                        { value: 'serviced', label: 'Serviced' },
                        { value: 'retained', label: 'Retained' }
                      ].map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setBridgingDetails(prev => ({ ...prev, loanType: type.value as any }))}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
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
                    showCurrency={false}
                  />
                  <InputRow
                    label="Duration (months)"
                    value={bridgingDetails.duration}
                    onChange={(value) => setBridgingDetails(prev => ({ ...prev, duration: value }))}
                    showCurrency={false}
                  />
                  <InputRow
                    label="Application Fee"
                    value={bridgingDetails.applicationFee}
                    onChange={(value) => handleCurrencyChange(value, (val) => setBridgingDetails(prev => ({ ...prev, applicationFee: val })))}
                    formatWithCommas={true}
                  />
                  <PercentageAmountRow
                    label="Product Fee"
                    percentageValue={purchaseFinance.productFee}
                    onPercentageChange={(value) => handlePercentageChange(value, grossLoanAmount, (val) => setPurchaseFinance(prev => ({ ...prev, productFee: val })), (val) => setPurchaseFinance(prev => ({ ...prev, productFeeAmount: val })))}
                    amountValue={purchaseFinance.productFeeAmount}
                    onAmountChange={(value) => handleAmountChange(value, grossLoanAmount, (val) => setPurchaseFinance(prev => ({ ...prev, productFee: val })), (val) => setPurchaseFinance(prev => ({ ...prev, productFeeAmount: val })))}
                    baseAmount={grossLoanAmount}
                  />
                  {bridgingDetails.loanType === 'retained' && (
                    <CalculatorRow
                      label="Total Interest"
                      value={formatCurrencyDisplay(totalInterestAmount.toString())}
                    />
                  )}
                  {bridgingDetails.loanType === 'serviced' && (
                    <CalculatorRow
                      label="Serviced Interest"
                      value={`£${(netAdvance * (parseFloat(bridgingDetails.monthlyInterest || '0') / 100)).toLocaleString()} PCM`}
                    />
                  )}
                  <div className="bg-gray-800/30 border border-gray-600/20 rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-200">Net Advance</span>
                      <span className="text-lg font-bold text-white">£{netAdvance.toLocaleString()}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center text-gray-400">
                        <span>Gross Loan</span>
                        <span>£{grossLoanAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-400">
                        <span>Application Fee</span>
                        <span>-£{parseFloat(bridgingDetails.applicationFee || '0').toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-400">
                        <span>Product Fee</span>
                        <span>-£{productFeeAmount.toLocaleString()}</span>
                      </div>
                      {bridgingDetails.loanType === 'retained' && (
                        <div className="flex justify-between items-center text-gray-400">
                          <span>Interest ({bridgingDetails.duration} months)</span>
                          <span>-£{totalInterestAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}


              {/* Cost of Finance Total */}
              <div className="mb-4">
                <div className="h-px bg-gray-500/30 -mx-4"></div>
                <div className="pt-4 space-y-2">
                  {isCashPurchase ? (
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>Purchase Price</span>
                      <span>£{purchasePriceNum.toLocaleString()}</span>
                    </div>
                  ) : isBridging ? (
                    <>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>Purchase Price</span>
                        <span>£{purchasePriceNum.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>Net Advance</span>
                        <span>-£{netAdvance.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>Deposit Required</span>
                        <span>£{depositAmount.toLocaleString()}</span>
                      </div>
                      {!includeFeesInLoan && productFeeAmount > 0 && (
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>Product Fee</span>
                          <span>£{productFeeAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-600/20">
                    <span className="text-sm font-medium text-blue-300">Cost of Finance</span>
                    <span className="text-lg font-bold text-blue-200">
                      £{isCashPurchase 
                        ? purchasePriceNum.toLocaleString() 
                        : isBridging 
                        ? (purchasePriceNum - netAdvance).toLocaleString()
                        : (depositAmount + (!includeFeesInLoan ? productFeeAmount : 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CalculatorSection>

          <CalculatorSection title="Initial Costs">
            <div className="space-y-3">
              <InputRow
                label="Legal Fees"
                value={initialCosts.legal}
                onChange={(value) => handleCurrencyChange(value, (val) => setInitialCosts(prev => ({ ...prev, legal: val })))}
                formatWithCommas={true}
              />
              <PercentageAmountRow
                label="Stamp Duty"
                percentageValue={initialCosts.stampDutyPercent}
                onPercentageChange={(value) => handlePercentageChange(value, purchasePriceNum, (val) => setInitialCosts(prev => ({ ...prev, stampDutyPercent: val })), (val) => setInitialCosts(prev => ({ ...prev, stampDutyAmount: val })))}
                amountValue={initialCosts.stampDutyAmount}
                onAmountChange={(value) => handleAmountChange(value, purchasePriceNum, (val) => setInitialCosts(prev => ({ ...prev, stampDutyPercent: val })), (val) => setInitialCosts(prev => ({ ...prev, stampDutyAmount: val })))}
                baseAmount={purchasePriceNum}
              />
              <InputRow
                label="ILA"
                value={initialCosts.ila}
                onChange={(value) => handleCurrencyChange(value, (val) => setInitialCosts(prev => ({ ...prev, ila: val })))}
                formatWithCommas={true}
              />
              <InputRow
                label="Broker Fees"
                value={initialCosts.brokerFees}
                onChange={(value) => handleCurrencyChange(value, (val) => setInitialCosts(prev => ({ ...prev, brokerFees: val })))}
                formatWithCommas={true}
              />
              <InputRow
                label="Auction Fees"
                value={initialCosts.auctionFees}
                onChange={(value) => handleCurrencyChange(value, (val) => setInitialCosts(prev => ({ ...prev, auctionFees: val })))}
                formatWithCommas={true}
              />
              <InputRow
                label="Finders Fee"
                value={initialCosts.findersFee}
                onChange={(value) => handleCurrencyChange(value, (val) => setInitialCosts(prev => ({ ...prev, findersFee: val })))}
                formatWithCommas={true}
              />
              <div className="mb-4">
                <div className="h-px bg-gray-500/30 -mx-4"></div>
                <div className="pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-300">Total</span>
                    <span className="text-lg font-bold text-blue-200">
                      £{totalInitialCosts.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CalculatorSection>
        </div>
      )}

      {/* Refurbishment Tab */}
      {activeTab === 'refurbishment' && (
        <div className="max-w-4xl">
          <CalculatorSection title="Refurbishment Items" icon="🔨">
            <div className="space-y-3">
              {refurbItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-600/20">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateRefurbItem(item.id, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm placeholder-gray-500"
                    />
                  </div>
                  <div className="w-28">
                    <div className="relative">
                      <input
                        type="text"
                        value={item.amount && !isNaN(parseFloat(item.amount)) ? parseFloat(item.amount).toLocaleString('en-GB', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2
                        }) : item.amount}
                        onChange={(e) => handleCurrencyChange(e.target.value, (val) => updateRefurbItem(item.id, 'amount', val))}
                        placeholder="0.00"
                        className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm text-right placeholder-gray-500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-xs">£</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeRefurbItem(item.id)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    disabled={refurbItems.length === 1}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={addRefurbItem}
                className="w-full py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors text-sm"
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
        <div className="max-w-6xl">
          <CalculatorSection title="Funding Sources" icon="💰">
            <div className="space-y-3">
              {fundingSources.map((source, index) => (
                <div key={source.id} className="p-3 bg-gray-800/30 rounded-lg border border-gray-600/20">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Name</label>
                      <input
                        type="text"
                        value={source.name}
                        onChange={(e) => updateFundingSource(source.id, 'name', e.target.value)}
                        placeholder="e.g., Personal, Bank"
                        className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Amount</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={source.amount && !isNaN(parseFloat(source.amount)) ? parseFloat(source.amount).toLocaleString('en-GB', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2
                          }) : source.amount}
                          onChange={(e) => handleCurrencyChange(e.target.value, (val) => updateFundingSource(source.id, 'amount', val))}
                          placeholder="0.00"
                          className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm text-right placeholder-gray-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-xs">£</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Interest Rate %</label>
                      <input
                        type="text"
                        value={source.interestRate}
                        onChange={(e) => updateFundingSource(source.id, 'interestRate', e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm text-right placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Duration (months)</label>
                      <input
                        type="text"
                        value={source.duration}
                        onChange={(e) => updateFundingSource(source.id, 'duration', e.target.value)}
                        placeholder="0"
                        className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm text-right placeholder-gray-500"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => removeFundingSource(source.id)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      disabled={fundingSources.length === 1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addFundingSource}
                className="w-full py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors text-sm"
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

          {/* Funding Reconciliation Section */}
          <CalculatorSection title="Funding Reconciliation" icon="⚖️">
            {/* Prominent Message Box */}
            <div className={`mb-6 p-4 rounded-lg border-2 ${
              isFundingShortfall 
                ? 'bg-red-500/10 border-red-500/50' 
                : 'bg-green-500/10 border-green-500/50'
            }`}>
              <div className="text-center">
                <div className={`text-2xl font-bold mb-2 ${
                  isFundingShortfall ? 'text-red-400' : 'text-green-400'
                }`}>
                  {isFundingShortfall 
                    ? `Additional Funding Needed: ${formatCurrencyDisplay(Math.abs(fundingGap).toString())}`
                    : fundingGap === 0 
                      ? 'Fully Funded'
                      : `Surplus: ${formatCurrencyDisplay(Math.abs(fundingGap).toString())}`
                  }
                </div>
                <div className={`text-sm ${
                  isFundingShortfall ? 'text-red-300' : 'text-green-300'
                }`}>
                  {isFundingShortfall 
                    ? 'Add more funding sources to cover project costs'
                    : fundingGap === 0
                      ? 'Your funding sources exactly match your project costs'
                      : 'You have more funding than needed for this project'
                  }
                </div>
              </div>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Project Costs Card */}
              <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
                <div className="text-sm text-gray-300 mb-3 font-semibold">Total Project Costs</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Cost of Finance</span>
                    <span className="text-white">{formatCurrencyDisplay(costOfFinance.toString())}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Initial Costs</span>
                    <span className="text-white">{formatCurrencyDisplay(totalInitialCosts.toString())}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Refurbishment Costs</span>
                    <span className="text-white">{formatCurrencyDisplay(totalRefurbCosts.toString())}</span>
                  </div>
                  <div className="border-t border-gray-600/30 pt-2 mt-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-gray-300">Total</span>
                      <span className="text-white">{formatCurrencyDisplay(totalProjectCosts.toString())}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Funding Sources Card */}
              <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
                <div className="text-sm text-gray-300 mb-3 font-semibold">Total Funding Sources</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">
                    {formatCurrencyDisplay(totalFundingSources.toString())}
                  </div>
                  <div className="text-xs text-gray-400">
                    {fundingSources.length} source{fundingSources.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Funding Gap/Surplus Card */}
              <div className={`rounded-lg p-4 border-2 ${
                isFundingShortfall 
                  ? 'bg-red-500/10 border-red-500/50' 
                  : 'bg-green-500/10 border-green-500/50'
              }`}>
                <div className={`text-sm mb-3 font-semibold ${
                  isFundingShortfall ? 'text-red-300' : 'text-green-300'
                }`}>
                  {isFundingShortfall ? 'Funding Gap' : 'Funding Surplus'}
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-2 ${
                    isFundingShortfall ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {isFundingShortfall ? '-' : '+'}{formatCurrencyDisplay(Math.abs(fundingGap).toString())}
                  </div>
                  <div className={`text-xs ${
                    isFundingShortfall ? 'text-red-300' : 'text-green-300'
                  }`}>
                    {isFundingShortfall ? 'Need more funding' : 'Overfunded'}
                  </div>
                </div>
              </div>
            </div>
          </CalculatorSection>
        </div>
      )}

      {/* Exit Strategy Tab */}
      {activeTab === 'exit' && (
        <div className="max-w-4xl">
          <CalculatorSection title="Exit Strategy" icon="🚪">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-300">Strategy:</span>
                  <div className="flex gap-2">
                    {[
                      { value: 'just-rent', label: 'Rent', disabled: isBridging },
                      { value: 'refinance-rent', label: 'Refinance & Rent', disabled: isMortgage },
                      { value: 'flip-sell', label: 'Sell', disabled: isMortgage }
                    ].map((strategy) => (
                      <button
                        key={strategy.value}
                        onClick={() => !strategy.disabled && handleExitStrategyChange(strategy.value as any)}
                        disabled={strategy.disabled}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                          exitStrategy === strategy.value
                            ? 'bg-blue-500 text-white'
                            : strategy.disabled
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {strategy.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Explanatory notes */}
                <div className="text-xs text-gray-500 space-y-1">
                  {isMortgage && (
                    <div>• Mortgage purchases can only use "Rent" strategy</div>
                  )}
                  {isBridging && (
                    <div>• Bridging loans require either refinancing or selling</div>
                  )}
                  {isCashPurchase && (
                    <div>• Cash purchases can use any exit strategy</div>
                  )}
                </div>
              </div>

              {exitStrategy === 'refinance-rent' && (
                <div className="space-y-3">
                  <InputRow
                    label="Expected GDV"
                    value={refinanceDetails.expectedGDV}
                    onChange={(value) => handleCurrencyChange(value, (val) => setRefinanceDetails(prev => ({ ...prev, expectedGDV: val })))}
                    formatWithCommas={true}
                  />
                  <PercentageAmountRow
                    label="New Loan LTV"
                    percentageValue={refinanceDetails.newLoanLTV}
                    onPercentageChange={(value) => handlePercentageChange(value, expectedGDV, (val) => setRefinanceDetails(prev => ({ ...prev, newLoanLTV: val })), (val) => setRefinanceDetails(prev => ({ ...prev, newLoanAmount: val })))}
                    amountValue={refinanceDetails.newLoanAmount}
                    onAmountChange={(value) => handleAmountChange(value, expectedGDV, (val) => setRefinanceDetails(prev => ({ ...prev, newLoanLTV: val })), (val) => setRefinanceDetails(prev => ({ ...prev, newLoanAmount: val })))}
                    baseAmount={expectedGDV}
                  />
                  <InputRow
                    label="Interest Rate %"
                    value={refinanceDetails.interestRate}
                    onChange={(value) => setRefinanceDetails(prev => ({ ...prev, interestRate: value }))}
                    showCurrency={false}
                  />
                  <InputRow
                    label="Broker Fees"
                    value={refinanceDetails.brokerFees}
                    onChange={(value) => handleCurrencyChange(value, (val) => setRefinanceDetails(prev => ({ ...prev, brokerFees: val })))}
                    formatWithCommas={true}
                  />
                  <InputRow
                    label="Legal Fees"
                    value={refinanceDetails.legalFees}
                    onChange={(value) => handleCurrencyChange(value, (val) => setRefinanceDetails(prev => ({ ...prev, legalFees: val })))}
                    formatWithCommas={true}
                  />
                </div>
              )}

              {exitStrategy === 'flip-sell' && (
                <div className="space-y-3">
                  <InputRow
                    label="Expected Sale Price"
                    value={saleDetails.expectedSalePrice}
                    onChange={(value) => handleCurrencyChange(value, (val) => setSaleDetails(prev => ({ ...prev, expectedSalePrice: val })))}
                    formatWithCommas={true}
                  />
                  <PercentageAmountRow
                    label="Agency Fee"
                    percentageValue={saleDetails.agencyFeePercent}
                    onPercentageChange={(value) => handlePercentageChange(value, expectedSalePrice, (val) => setSaleDetails(prev => ({ ...prev, agencyFeePercent: val })), (val) => setSaleDetails(prev => ({ ...prev, agencyFeeAmount: val })))}
                    amountValue={saleDetails.agencyFeeAmount}
                    onAmountChange={(value) => handleAmountChange(value, expectedSalePrice, (val) => setSaleDetails(prev => ({ ...prev, agencyFeePercent: val })), (val) => setSaleDetails(prev => ({ ...prev, agencyFeeAmount: val })))}
                    baseAmount={expectedSalePrice}
                  />
                  <InputRow
                    label="Legal Fees"
                    value={saleDetails.legalFees}
                    onChange={(value) => handleCurrencyChange(value, (val) => setSaleDetails(prev => ({ ...prev, legalFees: val })))}
                    formatWithCommas={true}
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

          {/* Refinance Summary Section - only for refinance-rent */}
          {exitStrategy === 'refinance-rent' && (
            <div className="bg-black/20 backdrop-blur-xl border-2 border-blue-500 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Refinance Summary
                </h3>
                <div className="text-right">
                  <span className={`text-4xl font-bold ${moneyLeftInDeal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {moneyLeftInDeal >= 0 ? '+' : '-'}£{Math.abs(moneyLeftInDeal).toLocaleString()}
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
          )}

          {/* Monthly Income & Expenses - Only show when exit strategy is selected and not flip-sell */}
          {exitStrategy && exitStrategy !== 'flip-sell' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Income Section */}
              <CalculatorSection title="Monthly Income" icon="💰">
                <div className="space-y-3">
                  <InputRow
                    label="Rent 1"
                    value={monthlyIncome.rent1}
                    onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyIncome(prev => ({ ...prev, rent1: val })))}
                    formatWithCommas={true}
                  />
                  <InputRow
                    label="Rent 2"
                    value={monthlyIncome.rent2}
                    onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyIncome(prev => ({ ...prev, rent2: val })))}
                    formatWithCommas={true}
                  />
                  <InputRow
                    label="Rent 3"
                    value={monthlyIncome.rent3}
                    onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyIncome(prev => ({ ...prev, rent3: val })))}
                    formatWithCommas={true}
                  />
                  <InputRow
                    label="Rent 4"
                    value={monthlyIncome.rent4}
                    onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyIncome(prev => ({ ...prev, rent4: val })))}
                    formatWithCommas={true}
                  />
                  <InputRow
                    label="Rent 5"
                    value={monthlyIncome.rent5}
                    onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyIncome(prev => ({ ...prev, rent5: val })))}
                    formatWithCommas={true}
                  />
                  <CalculatorRow
                    label="Total Monthly Income"
                    value={formatCurrencyDisplay(totalMonthlyIncome.toString())}
                    isTotal
                  />
                </div>
              </CalculatorSection>

              {/* Monthly Expenses Section */}
              <CalculatorSection title="Monthly Expenses" icon="💸">
                <div className="space-y-3">
                  <InputRow
                    label="Service Charge"
                    value={monthlyExpenses.serviceCharge}
                    onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyExpenses(prev => ({ ...prev, serviceCharge: val })))}
                    formatWithCommas={true}
                  />
                  <InputRow
                    label="Ground Rent"
                    value={monthlyExpenses.groundRent}
                    onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyExpenses(prev => ({ ...prev, groundRent: val })))}
                    formatWithCommas={true}
                  />
                  <PercentageAmountRow
                    label="Maintenance"
                    percentageValue={monthlyExpenses.maintenancePercent}
                    onPercentageChange={(value) => handlePercentageChange(value, totalMonthlyIncome, (val) => setMonthlyExpenses(prev => ({ ...prev, maintenancePercent: val })), (val) => setMonthlyExpenses(prev => ({ ...prev, maintenanceAmount: val })))}
                    amountValue={monthlyExpenses.maintenanceAmount}
                    onAmountChange={(value) => handleAmountChange(value, totalMonthlyIncome, (val) => setMonthlyExpenses(prev => ({ ...prev, maintenancePercent: val })), (val) => setMonthlyExpenses(prev => ({ ...prev, maintenanceAmount: val })))}
                    baseAmount={totalMonthlyIncome}
                  />
                  <PercentageAmountRow
                    label="Management"
                    percentageValue={monthlyExpenses.managementPercent}
                    onPercentageChange={(value) => handlePercentageChange(value, totalMonthlyIncome, (val) => setMonthlyExpenses(prev => ({ ...prev, managementPercent: val })), (val) => setMonthlyExpenses(prev => ({ ...prev, managementAmount: val })))}
                    amountValue={monthlyExpenses.managementAmount}
                    onAmountChange={(value) => handleAmountChange(value, totalMonthlyIncome, (val) => setMonthlyExpenses(prev => ({ ...prev, managementPercent: val })), (val) => setMonthlyExpenses(prev => ({ ...prev, managementAmount: val })))}
                    baseAmount={totalMonthlyIncome}
                  />
                  <InputRow
                    label="Insurance"
                    value={monthlyExpenses.insurance}
                    onChange={(value) => handleCurrencyChange(value, (val) => setMonthlyExpenses(prev => ({ ...prev, insurance: val })))}
                    formatWithCommas={true}
                  />
                  {(isMortgage || (exitStrategy === 'refinance-rent' && newLoanAmount > 0)) && (
                    <CalculatorRow
                      label="Mortgage Payment"
                      value={formatCurrencyDisplay(currentMortgagePayment.toString())}
                    />
                  )}
                  <CalculatorRow
                    label="Total Monthly Expenses"
                    value={formatCurrencyDisplay(totalMonthlyExpenses.toString())}
                    isTotal
                  />
                </div>
              </CalculatorSection>
            </div>
          )}
        </div>
      )}


    </div>
  )
}
