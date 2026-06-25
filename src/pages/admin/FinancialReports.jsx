import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, IndianRupee, Users, CheckCircle,
  Clock, RefreshCw, ArrowUpRight, ArrowDownRight, Download, BarChart3,
  Smartphone, Banknote
} from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

/* ── palette (gray-only) ─────────────────────────────────────────────── */
const PIE_COLORS = ['#e5e7eb', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937']

/* ── helpers ─────────────────────────────────────────────────────────── */
const fmt = (n) => {
  const v = Number(n ?? 0)
  if (isNaN(v) || v === 0) return '₹ 0'
  // Always full amount — no K, L, M abbreviations
  return '₹\u00A0' + v.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const MONTHS = [
  { value: 0,  label: 'Full Year'  },
  { value: 1,  label: 'January'   }, { value: 2,  label: 'February' },
  { value: 3,  label: 'March'     }, { value: 4,  label: 'April'    },
  { value: 5,  label: 'May'       }, { value: 6,  label: 'June'     },
  { value: 7,  label: 'July'      }, { value: 8,  label: 'August'   },
  { value: 9,  label: 'September' }, { value: 10, label: 'October'  },
  { value: 11, label: 'November'  }, { value: 12, label: 'December' },
]

const GrowthBadge = ({ value }) => {
  const v   = Number(value ?? 0)
  const pos = v >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${pos ? 'text-[#022b3a]' : 'text-[#1f7a8c]'}`}>
      {pos ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {Math.abs(v).toFixed(1)}%
    </span>
  )
}

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#bfdbf7] rounded-xl px-4 py-3 text-xs shadow-2xl">
      <p className="text-[#022b3a]/60 font-medium mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex justify-between gap-6 text-[#022b3a]">
          <span className="text-[#022b3a]/60">{p.name}</span>
          <span className="font-mono font-semibold">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

/* ── stat card ───────────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, growth, sub, loading }) {
  return (
    <div className="card card-hover p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#1f7a8c] font-medium uppercase tracking-wide">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-[#f0f8fb] border border-[#bfdbf7] flex items-center justify-center">
          <Icon size={14} className="text-[#022b3a]/60" />
        </div>
      </div>
      {loading
        ? <div className="h-7 w-24 bg-[#e1e5f2] rounded-lg animate-pulse" />
        : <p className="text-2xl font-bold text-[#022b3a] font-mono">{value}</p>}
      {(sub || growth !== undefined) && !loading && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#1f7a8c]">{sub}</p>
          {growth !== undefined && <GrowthBadge value={growth} />}
        </div>
      )}
    </div>
  )
}

/* ── main page ───────────────────────────────────────────────────────── */
export default function FinancialReports() {
  const currentYear  = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [year,     setYear]     = useState(currentYear)
  const [month,    setMonth]    = useState(0)       // 0 = full year
  const [summary,  setSummary]  = useState(null)
  const [chart,    setChart]    = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async (showToast = false) => {
    setLoading(true)
    try {
      const params = { year, month }
      const [sRes, cRes, eRes] = await Promise.all([
        adminAPI.getAnalyticsSummary(params),
        adminAPI.getAnalyticsChart({ year }),
        adminAPI.getExpenseBreakdown(params),
      ])
      setSummary(sRes.data?.data ?? sRes.data ?? {})
      setChart(Array.isArray(cRes.data?.data) ? cRes.data.data
              : Array.isArray(cRes.data) ? cRes.data : [])
      setExpenses(Array.isArray(eRes.data?.data) ? eRes.data.data
                 : Array.isArray(eRes.data) ? eRes.data : [])
      if (showToast) toast.success('Analytics refreshed')
    } catch {
      toast.error('Could not load analytics data')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { load() }, [load])

  const s = summary ?? {}

  /* Pie chart data from expense breakdown */
  const pieData = expenses.map((e, i) => ({
    name:  e.category,
    value: e.amount,
    pct:   e.percentage,
    fill:  PIE_COLORS[i % PIE_COLORS.length],
  }))

  /* Revenue vs pending trend (bar chart uses chart data) */
  const periodLabel = month === 0
    ? `${year} (Full Year)`
    : `${MONTHS[month]?.label} ${year}`

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title text-xl">Analytics</h1>
          <p className="section-subtitle">Real-time financial analytics from live data · {periodLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="input-field text-xs w-24">
            {[2021, 2022, 2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="input-field text-xs w-36">
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <button onClick={() => load(true)}
            className="btn-secondary flex items-center gap-2 text-xs">
            <RefreshCw size={13} />Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Row 1 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={IndianRupee} label="Total Revenue"
          value={fmt(s.totalRevenue)}
          growth={s.revenueGrowth}
          sub="vs previous period"
          loading={loading} />
        <KpiCard icon={TrendingDown} label="Total Expenses"
          value={fmt(s.totalExpenses)}
          growth={s.expenseGrowth}
          sub="vs previous period"
          loading={loading} />
        <KpiCard icon={TrendingUp} label="Net Balance"
          value={fmt(s.netBalance)}
          sub="Revenue − Expenses"
          loading={loading} />
        <KpiCard icon={Clock} label="Pending Dues"
          value={fmt(s.pendingDues)}
          sub={`Est. from unpaid flats`}
          loading={loading} />
      </div>

      {/* ── KPI Row 2 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={CheckCircle} label="Paid Count"
          value={loading ? '—' : s.paidCount ?? 0}
          sub="Flats paid this period"
          loading={loading} />
        <KpiCard icon={Users} label="Unpaid Count"
          value={loading ? '—' : s.unpaidCount ?? 0}
          sub="Flats yet to pay"
          loading={loading} />
        <KpiCard icon={BarChart3} label="Collection Rate"
          value={loading ? '—' : `${s.collectionRate ?? 0}%`}
          sub="Paid / occupied flats"
          loading={loading} />
        <KpiCard icon={Users} label="Total Residents"
          value={loading ? '—' : s.totalResidents ?? 0}
          sub={`${s.occupiedFlats ?? 0} occupied`}
          loading={loading} />
      </div>

      {/* ── KPI Row 3 — Bank / Cash collection split ───────────────────── */}
      {/* Values come from AnalyticsService → sumBankCollectedByYearAndMonth /   */}
      {/* sumCashCollectedByYearAndMonth — the exact same queries used by        */}
      {/* Admin Payment Tracking → PaymentController.getTrackingStats().         */}
      {/* This guarantees Super Admin always shows the same numbers as Admin.    */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card card-hover p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#1f7a8c] font-medium uppercase tracking-wide">Bank Collection</p>
            <div className="w-8 h-8 rounded-lg bg-[#f0f8fb] border border-[#bfdbf7] flex items-center justify-center">
              <Smartphone size={14} className="text-[#022b3a]/60" />
            </div>
          </div>
          {loading
            ? <div className="h-7 w-24 bg-[#e1e5f2] rounded-lg animate-pulse" />
            : <p className="text-2xl font-bold text-[#022b3a] font-mono">{fmt(s.bankCollection)}</p>}
          <p className="text-xs text-[#1f7a8c]">UPI · Bank Transfer · NEFT · RTGS · Cheque · etc.</p>
        </div>
        <div className="card card-hover p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#1f7a8c] font-medium uppercase tracking-wide">Cash Collection</p>
            <div className="w-8 h-8 rounded-lg bg-[#f0f8fb] border border-[#bfdbf7] flex items-center justify-center">
              <Banknote size={14} className="text-[#022b3a]/60" />
            </div>
          </div>
          {loading
            ? <div className="h-7 w-24 bg-[#e1e5f2] rounded-lg animate-pulse" />
            : <p className="text-2xl font-bold text-[#022b3a] font-mono">{fmt(s.cashCollection)}</p>}
          <p className="text-xs text-[#1f7a8c]">Cash payments only</p>
        </div>
      </div>

      {/* ── Revenue vs Expense Bar Chart ──────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-[#022b3a]">Revenue vs Expenses — {year}</h2>
            <p className="text-xs text-[#1f7a8c] mt-0.5">Monthly income and expenditure breakdown</p>
          </div>
        </div>
        {loading ? (
          <div className="h-64 bg-[#e1e5f2] rounded-xl animate-pulse" />
        ) : chart.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-[#1f7a8c] text-sm">
            No chart data available for {year}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chart} barSize={18} barGap={4}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#bfdbf7" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmt(v)}
                tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<ChartTip />} cursor={{ fill: '#e1e5f2' }} />
              <Legend iconType="circle" iconSize={7}
                formatter={v => <span className="text-xs text-[#022b3a]/60">{v}</span>} />
              <Bar dataKey="income"  name="Revenue"  fill="#e5e7eb" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Expenses" fill="#4b5563" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Net Balance Line Chart + Expense Pie ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Net balance trend */}
        <div className="card p-5 lg:col-span-3">
          <h2 className="text-sm font-semibold text-[#022b3a] mb-1">Net Balance Trend — {year}</h2>
          <p className="text-xs text-[#1f7a8c] mb-5">Monthly surplus/deficit</p>
          {loading ? (
            <div className="h-52 bg-[#e1e5f2] rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={chart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#bfdbf7" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmt(v)}
                  tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<ChartTip />} />
                <Line type="monotone" dataKey="balance" name="Net Balance"
                  stroke="#e5e7eb" strokeWidth={2} dot={{ r: 3, fill: '#e5e7eb', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#ffffff' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expense breakdown */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-[#022b3a] mb-1">Expense Breakdown</h2>
          <p className="text-xs text-[#1f7a8c] mb-4">{periodLabel}</p>
          {loading ? (
            <div className="h-52 bg-[#e1e5f2] rounded-xl animate-pulse" />
          ) : pieData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-[#1f7a8c] text-xs">
              No expense data for this period
            </div>
          ) : (
            <div className="space-y-3">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                    dataKey="value" paddingAngle={2}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [fmt(v), n]}
                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#9ca3af' }}
                    itemStyle={{ color: '#f9fafb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.fill }} />
                      <span className="text-[#022b3a]/60 truncate max-w-[110px]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[#1f7a8c]">{item.pct}%</span>
                      <span className="text-[#022b3a] font-mono">{fmt(item.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Collection rate progress ──────────────────────────────────── */}
      {!loading && (s.paidCount + s.unpaidCount) > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#022b3a]">Collection Rate</h2>
              <p className="text-xs text-[#1f7a8c] mt-0.5">{periodLabel}</p>
            </div>
            <p className="text-2xl font-bold text-[#022b3a] font-mono">{s.collectionRate ?? 0}%</p>
          </div>
          <div className="w-full bg-[#e1e5f2] rounded-full h-3 overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, s.collectionRate ?? 0)}%` }} />
          </div>
          <div className="flex justify-between mt-3 text-xs text-[#1f7a8c]">
            <span>{s.paidCount ?? 0} paid</span>
            <span>{s.unpaidCount ?? 0} unpaid · {s.occupiedFlats ?? 0} total occupied</span>
          </div>
        </div>
      )}

      {/* ── Expense category table ─────────────────────────────────────── */}
      {!loading && expenses.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#bfdbf7] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#022b3a]">Expense Details by Category</h2>
            <span className="text-xs text-[#1f7a8c]">{periodLabel}</span>
          </div>
          {/* Desktop / tablet table */}
          <div className="overflow-x-auto hidden sm:block">
            <table className="w-full min-w-[480px]">
              <thead className="border-b border-[#bfdbf7] bg-white/50">
                <tr>
                  {['Category', 'Amount', 'Share %', 'Bar'].map(h => (
                    <th key={h} className="table-header whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell font-medium text-[#022b3a]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {e.category}
                      </div>
                    </td>
                    <td className="table-cell font-mono whitespace-nowrap">{fmt(e.amount)}</td>
                    <td className="table-cell text-[#022b3a]/60 whitespace-nowrap">{e.percentage}%</td>
                    <td className="table-cell w-40">
                      <div className="w-full bg-[#e1e5f2] rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-[#bfdbf7] rounded-full"
                          style={{ width: `${e.percentage}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked rows */}
          <div className="sm:hidden divide-y divide-[#bfdbf7]">
            {expenses.map((e, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-sm font-medium text-[#022b3a] truncate">{e.category}</span>
                  </div>
                  <span className="text-sm font-mono flex-shrink-0">{fmt(e.amount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#e1e5f2] rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-[#bfdbf7] rounded-full" style={{ width: `${e.percentage}%` }} />
                  </div>
                  <span className="text-xs text-[#022b3a]/60 flex-shrink-0">{e.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}