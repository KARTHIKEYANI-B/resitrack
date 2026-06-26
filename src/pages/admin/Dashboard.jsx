import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, IndianRupee, Home, CheckCircle,
  AlertCircle, RefreshCw, ArrowUpRight, ArrowDownRight,
  Building2, Banknote, Smartphone, Calendar
} from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

// ── Helpers ───────────────────────────────────────────────────────────────

const fmt = (n) => {
  const v = Number(n ?? 0)
  if (isNaN(v)) return '₹0'
  return '₹\u00A0' + v.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const pct = (n) => {
  const v = Number(n ?? 0)
  const color = v >= 0 ? 'text-green-600' : 'text-red-500'
  const Icon  = v >= 0 ? ArrowUpRight : ArrowDownRight
  // return (
  //   <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${color}`}>
  //     <Icon size={11} />
  //     {Math.abs(v).toFixed(1)}
  //   </span>
  // )
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function nowYM() {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

// ── Sub-components ────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#bfdbf7] rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="text-[#022b3a]/60 font-medium mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-[#022b3a] flex justify-between gap-6">
          <span className="text-[#022b3a]/60">{p.name}</span>
          <span className="font-mono font-semibold">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, growth, loading }) {
  return (
    <div className="rounded-xl border border-[#bfdbf7] bg-white p-4 flex flex-col gap-3 hover:border-[#1f7a8c] transition-all">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#1f7a8c] font-medium tracking-wide uppercase">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-[#f0f8fb] border border-[#bfdbf7] flex items-center justify-center">
          <Icon size={14} className="text-[#022b3a]/60" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-28 bg-[#e1e5f2] rounded-lg animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-[#022b3a] font-mono tracking-tight">{value}</p>
      )}
      {sub && !loading && (
        <div className="space-y-0.5">
          <p className="text-xs text-[#1f7a8c]">{sub}</p>
          {growth !== undefined && pct(growth)}
        </div>
      )}
    </div>
  )
}

function BalanceCard({ totalBalance, bankBalance, cashBalance, totalExpense, bankExpense, cashExpense, loading }) {
  return (
    <div className="rounded-xl border border-[#bfdbf7] bg-white p-4 flex flex-col gap-3 hover:border-[#1f7a8c] transition-all col-span-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#1f7a8c] font-medium tracking-wide uppercase">Available Balance</p>
        <div className="w-8 h-8 rounded-lg bg-[#f0f8fb] border border-[#bfdbf7] flex items-center justify-center">
          <IndianRupee size={14} className="text-[#022b3a]/60" />
        </div>
      </div>

      {loading ? (
        <div className="h-8 w-28 bg-[#e1e5f2] rounded-lg animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-[#022b3a] font-mono tracking-tight">{fmt(totalBalance)}</p>
      )}

      {!loading && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-2 border-t border-[#e1e5f2]">
          <div className="space-y-1">
            <p className="text-[10px] text-[#1f7a8c] uppercase tracking-wide font-medium flex items-center gap-1">
              <Smartphone size={10} /> Bank
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#022b3a]/60">Received</span>
              <span className="text-[11px] font-mono text-[#022b3a] font-semibold">
                {fmt(Number(bankBalance ?? 0) + Number(bankExpense ?? 0))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#022b3a]/60">Expenses</span>
              <span className="text-[11px] font-mono text-[#022b3a] font-semibold">{fmt(bankExpense)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[#e1e5f2] pt-1 mt-1">
              <span className="text-[11px] text-[#022b3a]/70 font-semibold">Bank Available Balance</span>
              <span className="text-[11px] font-mono font-bold text-[#022b3a]">
                {fmt(bankBalance)}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-[#1f7a8c] uppercase tracking-wide font-medium flex items-center gap-1">
              <Banknote size={10} /> Cash
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#022b3a]/60">Received</span>
              <span className="text-[11px] font-mono text-[#022b3a] font-semibold">
                {fmt(Number(cashBalance ?? 0) + Number(cashExpense ?? 0))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#022b3a]/60">Expenses</span>
              <span className="text-[11px] font-mono text-[#022b3a] font-semibold">{fmt(cashExpense)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[#e1e5f2] pt-1 mt-1">
              <span className="text-[11px] text-[#022b3a]/70 font-semibold">Cash Available Balance</span>
              <span className="text-[11px] font-mono font-bold text-[#022b3a]">
                {fmt(cashBalance)}
              </span>
            </div>
          </div>

          {/* <div className="col-span-2 flex items-center justify-between border-t border-[#e1e5f2] pt-2 mt-1">
            <span className="text-[11px] text-[#022b3a]/60">Total Expense (Bank + Cash)</span>
            <span className="text-[11px] font-mono text-red-500 font-semibold">{fmt(totalExpense)}</span>
          </div> */}
        </div>
      )}
    </div>
  )
}

// ── Month + Year selector ─────────────────────────────────────────────────
function MonthYearSelector({ selMonth, selYear, onMonthChange, onYearChange }) {
  const currentYear = nowYM().year
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1].filter(y => y > 2020)

  return (
    <div className="flex items-center gap-2 bg-white border border-[#bfdbf7] rounded-xl px-3 py-1.5 shadow-sm">
      <Calendar size={13} className="text-[#1f7a8c] flex-shrink-0" />
      <select
        value={selMonth}
        onChange={e => onMonthChange(Number(e.target.value))}
        className="text-xs font-medium text-[#022b3a] bg-transparent border-none outline-none cursor-pointer pr-1"
        aria-label="Select month"
      >
        {MONTH_NAMES.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>
      <span className="text-[#bfdbf7] select-none">|</span>
      <select
        value={selYear}
        onChange={e => onYearChange(Number(e.target.value))}
        className="text-xs font-medium text-[#022b3a] bg-transparent border-none outline-none cursor-pointer"
        aria-label="Select year"
      >
        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export default function Dashboard() {
  const { year: nowYear, month: nowMonth } = nowYM()

  // Selected month/year for stats cards (default = current month)
  const [selMonth,  setSelMonth]  = useState(nowMonth)
  const [selYear,   setSelYear]   = useState(nowYear)

  // Chart year is independent — shows full annual view
  const [chartYear, setChartYear] = useState(nowYear)

  const [stats,   setStats]   = useState(null)
  const [chart,   setChart]   = useState([])
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(false)

  const isCurrentMonth = selMonth === nowMonth && selYear === nowYear

  // Reload stats whenever selected month or year changes
  const loadStats = useCallback(async (showToast = false) => {
    setLoading(true)
    try {
      // Pass year + month so backend filters ALL cards to the selected period
      const sRes = await adminAPI.getDashboardStats({ year: selYear, month: selMonth })
      const s = sRes.data?.data ?? sRes.data ?? {}
      setStats(s)
      if (showToast) toast.success(`Dashboard loaded for ${MONTH_NAMES[selMonth - 1]} ${selYear}`)
    } catch {
      toast.error('Could not load dashboard data')
    } finally {
      setLoading(false)
      setRefresh(false)
    }
  }, [selYear, selMonth])

  // Reload chart whenever chartYear changes
  const loadChart = useCallback(async () => {
    try {
      const cRes = await adminAPI.getMonthlyChartData(chartYear)
      const c = cRes.data?.data ?? cRes.data ?? []
      setChart(Array.isArray(c) ? c : [])
    } catch { /* chart errors are non-fatal */ }
  }, [chartYear])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadChart() }, [loadChart])

  const handleRefresh = () => { setRefresh(true); loadStats(true) }

  // ── Derived values ────────────────────────────────────────────────────
  const s = stats ?? {}

  const income       = s.totalMonthlyIncome    ?? 0
  const bankExpense  = s.bankExpense            ?? 0
  const cashExpense  = s.cashExpense            ?? 0
  const totalExpense = s.totalMonthlyExpense    ?? (bankExpense + cashExpense)
  const bankBalance  = s.bankBalance            ?? 0
  const cashBalance  = s.cashBalance            ?? 0
  const totalBalance = s.balance                ?? (bankBalance + cashBalance)

  const paid              = s.paidMaintenanceCount   ?? s.flatsPaid ?? 0
  const unpaid            = s.unpaidMaintenanceCount ?? 0
  const unpaidAmount      = s.pendingAmount           ?? 0
  const unpaidCount       = s.unpaidMaintenanceCount ?? 0
  const rate              = s.collectionRate          ?? 0
  const revGrowth         = s.revenueGrowth           ?? 0
  const expGrowth         = s.expenseGrowth           ?? 0

  // Active owner counts — declared first because fullUnpaidCount fallback references totalActiveOwners
  const activeFlatOwners  = s.activeFlatOwners  ?? s.flatOwners  ?? 0
  const activeVillaOwners = s.activeVillaOwners ?? s.villaOwners ?? 0
  const totalActiveOwners = activeFlatOwners + activeVillaOwners
  const occupied          = s.occupiedFlats ?? totalActiveOwners

  // Full / Full-Unpaid payment counts — two-state model (PAID / UNPAID only)
  const fullPaymentCount  = s.fullPaymentCount  ?? 0
  // fullUnpaidCount = residents where paidSoFar == 0 (no payment made at all this month).
  // Fallback: totalActiveOwners − fullPaymentCount (owners with any pending amount are UNPAID).
  const fullUnpaidCount = s.fullUnpaidCount != null
    ? s.fullUnpaidCount
    : Math.max(0, totalActiveOwners - fullPaymentCount)

  const selectedMonthLabel = `${MONTH_NAMES[selMonth - 1]} ${selYear}`

  if (loading && !stats) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header + Month/Year Selector ─────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title text-xl">Admin Dashboard</h1>
          <p className="section-subtitle flex items-center gap-1.5">
            <Calendar size={12} className="text-[#1f7a8c]" />
             data of&nbsp;
            <span className="font-semibold text-[#022b3a]">{selectedMonthLabel}</span>
            {/* {isCurrentMonth && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 ml-1">
                Current
              </span>
            )} */}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Month + Year picker */}
          <MonthYearSelector
            selMonth={selMonth}
            selYear={selYear}
            onMonthChange={setSelMonth}
            onYearChange={setSelYear}
          />

          {/* Jump back to current month */}
          {!isCurrentMonth && (
            <button
              onClick={() => { setSelMonth(nowMonth); setSelYear(nowYear) }}
              className="text-xs text-[#1f7a8c] hover:text-[#022b3a] border border-[#bfdbf7] hover:border-[#1f7a8c] rounded-xl px-3 py-1.5 transition-all bg-white"
            >
              Current Month
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={refresh}
            className="btn-secondary flex items-center gap-2 text-xs"
          >
            <RefreshCw size={13} className={refresh ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Non-current month info banner */}
      {/* {!isCurrentMonth && !loading && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#f0f8fb] border border-[#bfdbf7] text-xs text-[#1f7a8c]">
          <Calendar size={13} className="flex-shrink-0" />
          All cards below show data for&nbsp;
          <span className="font-semibold text-[#022b3a]">{selectedMonthLabel}</span>
          &nbsp;only.
        </div>
      )} */}

      {/* ── Row 1 — Revenue + Expense + Balance ──────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        <StatCard
          icon={TrendingUp}
          label={`Total Amount Collected · ${MONTH_NAMES[selMonth - 1]}`}
          value={fmt(income)}
          sub={`Collection rate: ${rate.toFixed(1)}%`}
          growth={revGrowth}
          loading={loading}
        />
        <StatCard
          icon={TrendingDown}
          label={`Total Expenditure · ${MONTH_NAMES[selMonth - 1]}`}
          value={fmt(totalExpense)}
          sub="Bank + Cash expenses"
          growth={expGrowth}
          loading={loading}
        />
        <BalanceCard
          totalBalance={totalBalance}
          bankBalance={bankBalance}
          cashBalance={cashBalance}
          totalExpense={totalExpense}
          bankExpense={bankExpense}
          cashExpense={cashExpense}
          loading={loading}
        />
      </div>

      {/* ── Row 2 — Unpaid Amount + Fully Paid + No Payment ─────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
        <StatCard
          icon={AlertCircle}
          label="Unpaid Amount This Month"
          value={fmt(unpaidAmount)}
          sub={unpaidCount > 0
            ? `${unpaidCount} owner${unpaidCount !== 1 ? 's' : ''} with pending dues`
            : 'All owners paid'}
          loading={loading}
        />
        <StatCard
          icon={CheckCircle}
          label="Fully Paid Residents"
          value={loading ? '—' : fullPaymentCount}
          sub="Paid complete amount"
          loading={loading}
        />
        <StatCard
          icon={AlertCircle}
          label="No Payment This Month"
          value={loading ? '—' : fullUnpaidCount}
          sub="No payment made this month"
          loading={loading}
        />
      </div>

      {/* ── Row 3 — Flat / Villa / Total Active Residents ────────────── */}
      <div className="rounded-xl border border-[#bfdbf7] bg-white p-4 hover:border-[#1f7a8c] transition-all">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[#1f7a8c] font-medium tracking-wide uppercase">Active Residents</p>
          <div className="w-8 h-8 rounded-lg bg-[#f0f8fb] border border-[#bfdbf7] flex items-center justify-center">
            <Building2 size={14} className="text-[#022b3a]/60" />
          </div>
        </div>
        {loading ? (
          <div className="h-8 w-28 bg-[#e1e5f2] rounded-lg animate-pulse mb-3" />
        ) : (
          <p className="text-2xl font-bold text-[#022b3a] font-mono tracking-tight mb-3">
            {totalActiveOwners}
          </p>
        )}
        {!loading && (
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#e1e5f2]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Building2 size={11} className="text-[#1f7a8c]" />
                <span className="text-[10px] text-[#1f7a8c] uppercase tracking-wide font-medium">Flat Owners</span>
              </div>
              <p className="text-lg font-bold font-mono text-[#022b3a]">{activeFlatOwners}</p>
              <p className="text-[10px] text-[#1f7a8c]">Approved flat residents</p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Home size={11} className="text-[#1f7a8c]" />
                <span className="text-[10px] text-[#1f7a8c] uppercase tracking-wide font-medium">Villa Owners</span>
              </div>
              <p className="text-lg font-bold font-mono text-[#022b3a]">{activeVillaOwners}</p>
              <p className="text-[10px] text-[#1f7a8c]">Approved villa residents</p>
            </div>
            <div className="flex flex-col gap-1 pl-3 border-l border-[#e1e5f2]">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={11} className="text-[#1f7a8c]" />
                <span className="text-[10px] text-[#1f7a8c] uppercase tracking-wide font-medium">Total Active</span>
              </div>
              <p className="text-lg font-bold font-mono text-[#022b3a]">{totalActiveOwners}</p>
              <p className="text-[10px] text-[#1f7a8c]">Flat Owners + Villa Owners</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Collection Progress Bar ───────────────────────────────────── */}
      {!loading && (paid + unpaid) > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#022b3a]">
              Collection Progress — {selectedMonthLabel}
            </p>
            <p className="text-xs text-[#1f7a8c]">
              {paid} of {occupied} active owners · {rate.toFixed(1)}%
            </p>
          </div>
          <div className="w-full bg-[#e1e5f2] rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-[#1f7a8c] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, rate)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-[#1f7a8c]">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* ── Annual Chart ─────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#022b3a]">
              Revenue vs Expenses — {chartYear}
            </h2>
            <p className="text-xs text-[#1f7a8c] mt-0.5">
              Monthly breakdown across all 12 months
            </p>
          </div>
          {/* Chart year is independent of the stats month selector */}
          <select
            value={chartYear}
            onChange={e => setChartYear(Number(e.target.value))}
            className="input-field text-xs w-28"
            aria-label="Chart year"
          >
            {[nowYear - 1, nowYear, nowYear + 1].filter(y => y > 2020).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="h-64 bg-[#e1e5f2] rounded-xl animate-pulse" />
        ) : chart.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-[#1f7a8c] text-sm">
            No data for {chartYear}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={chart}
              barSize={20}
              barGap={4}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#bfdbf7" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={v => fmt(v)}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#e1e5f2' }} />
              <Legend
                iconType="circle"
                iconSize={7}
                formatter={v => <span className="text-xs text-[#022b3a]/60">{v}</span>}
              />
              <Bar dataKey="income"  name="Income"   fill="#1f7a8c" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Expenses"  fill="#bfdbf7" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Quick links ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Payment Management', path: '/admin/payments', sub: 'View all payments' },
          { label: 'Maintenance',      path: '/admin/maintenance',      sub: 'Manage batches' },
          { label: 'Expenses',         path: '/admin/expenses',         sub: 'Record expenses' },
          { label: 'Financial Summary', path: '/admin/financial-report', sub: 'Full reports' },
        ].map(({ label, path, sub }) => (
          <a key={path} href={path} className="card card-hover p-4 group flex flex-col gap-1 animate-pop-in">
            <p className="text-sm font-semibold text-[#022b3a] group-hover:text-[#1f7a8c] transition-colors">{label}</p>
            <p className="text-xs text-[#1f7a8c]">{sub}</p>
          </a>
        ))}
      </div>
    </div>
  )
}