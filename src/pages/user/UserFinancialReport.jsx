import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, IndianRupee, ShieldCheck } from 'lucide-react'
import { userAPI } from '../../api/userAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const CY = new Date().getFullYear()

const fmt = (v) => {
  const n = Number(v ?? 0)
  if (isNaN(n)) return '—'
  if (n === 0)  return '₹ 0'
  return '₹\u00A0' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function UserFinancialReport() {
  const [year,       setYear]       = useState(CY)
  const [month,      setMonth]      = useState(new Date().getMonth() + 1) // 1-based
  const [loading,    setLoading]    = useState(true)
  const [collection, setCollection] = useState(0)
  const [expenses,   setExpenses]   = useState(0)
  const [bankBalance, setBankBalance] = useState(0)
  const [cashBalance, setCashBalance] = useState(0)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      // Use the dedicated monthly-summary endpoint which calls the identical
      // repository queries as Admin Dashboard (sumBankCollectedByYearAndMonth,
      // sumCashCollectedByYearAndMonth, sumPaidAmountByYearAndMonth).
      // This guarantees Bank/Cash Collection always matches Admin Dashboard
      // and Payment Tracking for the same month.
      const res = await userAPI.getMonthlySummary({ year, month })
      const d   = res.data?.data ?? res.data ?? {}
      setCollection(Number(d.totalCollection ?? 0))
      setBankBalance(Number(d.bankCollection  ?? 0))
      setCashBalance(Number(d.cashCollection  ?? 0))
      setExpenses(Number(d.totalExpense       ?? 0))
    } catch {
      toast.error('Could not load financial summary')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { fetchSummary() }, [fetchSummary])

  const balance = collection - expenses
  // bankBalance and cashBalance come from the API response above

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="section-title text-xl">Community Financial Summary</h1>
          <p className="section-subtitle">Monthly maintenance collection and expense overview for the community</p>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#1f7a8c]" />
          <span className="text-xs text-[#1f7a8c]">Read only</span>
          <button onClick={fetchSummary} className="btn-secondary flex items-center gap-1.5 ml-1">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="card py-3 px-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#1f7a8c] font-medium">Year</label>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="input-field w-24 text-sm">
            {[CY, CY - 1, CY - 2, CY - 3].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#1f7a8c] font-medium">Month</label>
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="input-field w-36 text-sm">
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary title */}
      <div className="text-center py-2">
        <p className="text-sm font-semibold text-[#022b3a]">
          Financial Summary — {MONTHS[month - 1]} {year}
        </p>
        <p className="text-xs text-[#1f7a8c] mt-0.5">R R Dhurya Owners Welfare Association</p>
      </div>

      {/* Two main cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Total Monthly Collection */}
        <div className="card card-hover flex flex-col items-center py-8 gap-3 border-t-4"
          style={{ borderTopColor: '#1f7a8c' }}>
          <div className="w-12 h-12 rounded-full bg-[#e1f5fe] flex items-center justify-center">
            <TrendingUp size={22} className="text-[#1f7a8c]" />
          </div>
          <p className="text-xs font-semibold text-[#1f7a8c] uppercase tracking-widest">
            Total Collection
          </p>
          <p className="text-3xl font-bold font-mono text-[#022b3a]">
            {fmt(collection)}
          </p>
          <p className="text-xs text-[#1f7a8c]">Payments received this month</p>
        </div>

        {/* Total Monthly Expenses */}
        <div className="card card-hover flex flex-col items-center py-8 gap-3 border-t-4"
          style={{ borderTopColor: '#e57373' }}>
          <div className="w-12 h-12 rounded-full bg-[#fce4ec] flex items-center justify-center">
            <TrendingDown size={22} className="text-red-500" />
          </div>
          <p className="text-xs font-semibold text-red-500 uppercase tracking-widest">
            Total Expenses
          </p>
          <p className="text-3xl font-bold font-mono text-[#022b3a]">
            {fmt(expenses)}
          </p>
          <p className="text-xs text-[#1f7a8c]">Association expenses this month</p>
        </div>
      </div>

      {/* Balance breakdown card */}
      <div className="card py-4 px-5 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-[#bfdbf7]">
          <div className="flex items-center gap-2">
            <IndianRupee size={16} className="text-[#022b3a]/50" />
            <span className="text-sm font-semibold text-[#022b3a]">Total Balance</span>
          </div>
          <span className={`text-xl font-bold font-mono ${balance >= 0 ? 'text-[#1f7a8c]' : 'text-red-500'}`}>
            {fmt(balance)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#1f7a8c]">Bank Collected Amount (UPI / NEFT / RTGS / Cheque etc.)</span>
          <span className="font-mono font-semibold text-[#022b3a]">{fmt(bankBalance)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#1f7a8c]">Cash Collected Amount</span>
          <span className="font-mono font-semibold text-[#022b3a]">{fmt(cashBalance)}</span>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[11px] text-[#1f7a8c]">
        Figures shown are for the selected month only.
      </p>
    </div>
  )
}