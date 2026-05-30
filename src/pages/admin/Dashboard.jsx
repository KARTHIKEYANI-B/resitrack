import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, IndianRupee, Home, CheckCircle,
  XCircle, AlertCircle, Layers, RefreshCw, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

/* ── helpers ──────────────────────────────────────────────── */
const fmt = (n) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000
    ? `₹${(n / 1000).toFixed(1)}K`
    : `₹${Number(n ?? 0).toLocaleString('en-IN')}`

const pct = (n) => {
  const v = Number(n ?? 0)
  const color = v >= 0 ? 'text-[#022b3a]' : 'text-[#1f7a8c]'
  const Icon  = v >= 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${color}`}>
      <Icon size={11} />
      {Math.abs(v).toFixed(1)}% vs last month
    </span>
  )
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#bfdbf7] rounded-xl shadow-lg px-4 py-3 shadow-2xl text-xs">
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

/* ── stat card ────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, growth, accent = 'gray', loading }) {
  const ring = {
    gray:  'border-[#bfdbf7] bg-white',
    white: 'border-[#bfdbf7] bg-white',
    green: 'border-[#bfdbf7] bg-white',
    red:   'border-[#bfdbf7] bg-white',
  }

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 hover:border-[#1f7a8c] transition-all ${ring[accent]}`}>
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

/* ── main component ───────────────────────────────────────── */
export default function Dashboard() {
  const [stats,   setStats]   = useState(null)
  const [chart,   setChart]   = useState([])
  const [year,    setYear]    = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(false)

  const load = useCallback(async (showToast = false) => {
    setLoading(true)
    try {
      const [sRes, cRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getMonthlyChartData(year),
      ])
      const s = sRes.data?.data ?? sRes.data ?? {}
      const c = cRes.data?.data ?? cRes.data ?? []
      setStats(s)
      setChart(Array.isArray(c) ? c : [])
      if (showToast) toast.success('Dashboard refreshed')
    } catch {
      toast.error('Could not load dashboard data')
    } finally {
      setLoading(false)
      setRefresh(false)
    }
  }, [year])

  useEffect(() => { load() }, [load])

  const handleRefresh = () => { setRefresh(true); load(true) }

  const s = stats ?? {}
  const income       = s.totalMonthlyIncome  ?? 0
  const expense      = s.totalMonthlyExpense ?? 0
  const balance      = s.balance             ?? (income - expense)
  const paid         = s.paidMaintenanceCount   ?? s.flatsPaid ?? 0
  const unpaid       = s.unpaidMaintenanceCount ?? 0
  const occupied     = s.occupiedFlats       ?? s.totalFlats ?? 0
  const vacant       = s.vacantFlats         ?? 0
  const totalColl    = s.totalCollections    ?? 0
  const pending      = s.pendingAmount       ?? 0
  const rate         = s.collectionRate      ?? 0
  const revGrowth    = s.revenueGrowth       ?? 0
  const expGrowth    = s.expenseGrowth       ?? 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title text-xl">Dashboard</h1>
          <p className="section-subtitle">Live overview for {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="input-field text-xs w-28">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={handleRefresh} disabled={refresh}
            className="btn-secondary flex items-center gap-2 text-xs">
            <RefreshCw size={13} className={refresh ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Row 1 — financials */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={IndianRupee} label="Monthly Revenue"
          value={fmt(income)}
          sub={`Collection rate: ${rate.toFixed(1)}%`}
          growth={revGrowth}
          accent="white" loading={loading} />
        <StatCard
          icon={TrendingDown} label="Monthly Expenses"
          value={fmt(expense)}
          sub="Current month total"
          growth={expGrowth}
          accent="gray" loading={loading} />
        <StatCard
          icon={TrendingUp} label="Net Balance"
          value={fmt(balance)}
          sub="Revenue minus expenses"
          accent="white" loading={loading} />
        <StatCard
          icon={Layers} label="Total Collections"
          value={fmt(totalColl)}
          sub="All-time paid amount"
          accent="gray" loading={loading} />
      </div>

      {/* Row 2 — operational */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle} label="Paid This Month"
          value={loading ? '—' : paid}
          sub="Flats / units paid"
          accent="white" loading={loading} />
        <StatCard
          icon={XCircle} label="Unpaid This Month"
          value={loading ? '—' : unpaid}
          sub={pending > 0 ? `Est. pending: ${fmt(pending)}` : 'No pending dues'}
          accent="gray" loading={loading} />
        <StatCard
          icon={Home} label="Occupied Flats"
          value={loading ? '—' : occupied}
          sub="Active registered residents"
          accent="white" loading={loading} />
        <StatCard
          icon={AlertCircle} label="Vacant / Inactive"
          value={loading ? '—' : vacant}
          sub="Unoccupied or inactive"
          accent="gray" loading={loading} />
      </div>

      {/* Progress bar */}
      {!loading && (paid + unpaid) > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#022b3a]">Monthly Collection Progress</p>
            <p className="text-xs text-[#1f7a8c]">{paid} of {paid + unpaid} flats · {rate.toFixed(1)}%</p>
          </div>
          <div className="w-full bg-[#e1e5f2] rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, rate)}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-[#1f7a8c]">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-[#022b3a]">Revenue vs Expenses — {year}</h2>
            <p className="text-xs text-[#1f7a8c] mt-0.5">Monthly breakdown across all 12 months</p>
          </div>
        </div>

        {loading ? (
          <div className="h-64 bg-[#e1e5f2] rounded-xl animate-pulse" />
        ) : chart.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-[#1f7a8c] text-sm">
            No data for {year}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chart} barSize={20} barGap={4}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#bfdbf7" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
                tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#e1e5f2' }} />
              <Legend iconType="circle" iconSize={7}
                formatter={v => <span className="text-xs text-[#022b3a]/60">{v}</span>} />
              <Bar dataKey="income"  name="Income"   fill="#1f7a8c" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Expenses"  fill="#bfdbf7" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Payment Tracking', path: '/admin/payments',    sub: 'View all payments' },
          { label: 'Maintenance',      path: '/admin/maintenance',  sub: 'Manage batches' },
          { label: 'Expenses',         path: '/admin/expenses',     sub: 'Record expenses' },
          { label: 'Analytics',        path: '/admin/reports',      sub: 'Full reports' },
        ].map(({ label, path, sub }) => (
          <a key={path} href={path}
            className="card card-hover p-4 group flex flex-col gap-1">
            <p className="text-sm font-semibold text-[#022b3a] group-hover:text-[#1f7a8c] transition-colors">{label}</p>
            <p className="text-xs text-[#1f7a8c]">{sub}</p>
          </a>
        ))}
      </div>
    </div>
  )
}