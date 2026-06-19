import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Download, FileText, TrendingUp, TrendingDown, Wallet,
  ChevronDown, RefreshCw, Printer, IndianRupee, Users
} from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const FULL_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]
const CY     = new Date().getFullYear()
const YEARS  = Array.from({ length: 5 }, (_, i) => CY - i)

const APARTMENT = 'R R Dhurya Owners Welfare Association'

const fmt  = (v) => {
  const n = Number(v)
  if (isNaN(n) || n === 0) return '—'
  return '₹\u00A0' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
const fmtN = (v) => {
  const n = Number(v)
  if (isNaN(n)) return '—'
  return n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
const fmtDate = (s) => {
  if (!s || s === '—') return '—'
  try {
    const d = new Date(s)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return s }
}
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function AdminFinancialReport() {
  const [tab,        setTab]        = useState('collection')  // 'collection' | 'expenses'
  const [year,       setYear]       = useState(CY)
  // FIXED: default to full calendar year Jan (1) → Dec (12) so all months work
  const [startMonth, setStartMonth] = useState(1)
  const [endMonth,   setEndMonth]   = useState(12)
  const [loading,    setLoading]    = useState(true)
  const [exporting,  setExporting]  = useState(null)

  const [collData,  setCollData]  = useState(null)
  const [expData,   setExpData]   = useState(null)
  const [summary,   setSummary]   = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const params = { year, startMonth, endMonth }
      const [cRes, eRes, sRes] = await Promise.allSettled([
        adminAPI.getCollectionReport(params),
        adminAPI.getExpenseReport(params),
        adminAPI.getFinancialSummary({ year }),
      ])
      if (cRes.status === 'fulfilled') setCollData(cRes.value.data?.data ?? null)
      if (eRes.status === 'fulfilled') setExpData(eRes.value.data?.data ?? null)
      if (sRes.status === 'fulfilled') setSummary(sRes.value.data?.data ?? null)
    } catch { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }, [year, startMonth, endMonth])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleExport = async (type, format) => {
    const key  = `${type}-${format}`
    setExporting(key)
    const params = { year, startMonth, endMonth }
    try {
      let res
      if (type === 'collection' && format === 'pdf')   res = await adminAPI.exportCollectionPdf(params)
      if (type === 'collection' && format === 'excel') res = await adminAPI.exportCollectionExcel(params)
      if (type === 'expenses'   && format === 'pdf')   res = await adminAPI.exportExpensePdf(params)
      if (type === 'expenses'   && format === 'excel') res = await adminAPI.exportExpenseExcel(params)
      const ext  = format === 'pdf' ? 'pdf' : 'xlsx'
      downloadBlob(res.data, `${type}-report-${year}.${ext}`)
      toast.success(`${format.toUpperCase()} downloaded`)
    } catch { toast.error('Export failed') }
    finally { setExporting(null) }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="section-title text-xl">Financial Summary Report</h1>
          <p className="section-subtitle">{APARTMENT}</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Filters ──────────────────────────────────────────── */}
      <div className="card py-3 px-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#1f7a8c] whitespace-nowrap">Year</label>
          <select value={year} onChange={e => setYear(+e.target.value)} className="input-field w-28">
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#1f7a8c] whitespace-nowrap">From</label>
          {/* REQUIREMENT: Allow filtering from January (1) to December (12) */}
          <select value={startMonth} onChange={e => setStartMonth(+e.target.value)} className="input-field w-32">
            {FULL_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#1f7a8c] whitespace-nowrap">To</label>
          {/* REQUIREMENT: Allow filtering up to December (12) */}
          <select value={endMonth} onChange={e => setEndMonth(+e.target.value)} className="input-field w-32">
            {FULL_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        {/* Quick-select presets */}
        <div className="flex gap-2 ml-auto">
          {[
            { label: 'Jan–Dec (CY)', s: 1,  e: 12 },
            { label: 'Apr–Mar (FY)', s: 4,  e: 3  },
            { label: 'Q1 (Jan–Mar)', s: 1,  e: 3  },
            { label: 'Q2 (Apr–Jun)', s: 4,  e: 6  },
            { label: 'Q3 (Jul–Sep)', s: 7,  e: 9  },
            { label: 'Q4 (Oct–Dec)', s: 10, e: 12 },
          ].map(p => (
            <button key={p.label}
              onClick={() => { setStartMonth(p.s); setEndMonth(p.e) }}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                startMonth === p.s && endMonth === p.e
                  ? 'bg-white text-[#022b3a] border-[#bfdbf7]'
                  : 'bg-[#e1e5f2] text-[#022b3a]/60 border-[#bfdbf7] hover:text-[#022b3a]'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary Cards ────────────────────────────────────── */}
      <SummaryCards coll={collData} exp={expData} summary={summary} />

      {/* ── Tab Switch ───────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {[
          { key: 'collection', icon: TrendingUp,   label: 'Income / Collection Report' },
          { key: 'expenses',   icon: TrendingDown,  label: 'Expenditure Report' },
        ].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              tab === key
                ? 'bg-white text-[#022b3a] border-[#bfdbf7]'
                : 'bg-white text-[#022b3a]/60 border-[#bfdbf7] hover:text-[#022b3a] hover:border-[#bfdbf7]'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Collection Report ─────────────────────────────────── */}
      {tab === 'collection' && (
        <CollectionReport data={collData} year={year} onExport={handleExport} exporting={exporting} />
      )}

      {/* ── Expense Report ────────────────────────────────────── */}
      {tab === 'expenses' && (
        <ExpenseReport data={expData} onExport={handleExport} exporting={exporting} />
      )}
    </div>
  )
}

function SummaryCards({ coll, exp, summary }) {
  const openBal  = coll?.openingBalance   ?? 0
  const collected= coll?.totalCollected   ?? 0
  const expenses = exp?.totalExpenses?.toNumber?.() ?? Number(exp?.totalExpenses ?? 0)
  const closing  = coll?.closingBalance   ?? (collected - expenses)
  const pending  = coll?.pendingDues      ?? 0

  const bankBal  = summary?.bankBalance  ?? 0
  const cashBal  = summary?.cashBalance  ?? 0
  const totalBal = bankBal + cashBal

  const cards = [
    { label: 'Opening Balance (Period Start)',  value: fmt(openBal),   icon: Wallet,       sub: 'Start of period' },
    { label: 'Total Amount Collected',  value: fmt(collected), icon: TrendingUp,   sub: 'All PAID payments' },
    { label: 'Total Expenditure',   value: fmt(expenses),  icon: TrendingDown, sub: 'All expenses' },
    { label: 'Closing Balance (Period End)',  value: fmt(closing),   icon: IndianRupee,  sub: 'Net balance' },
    { label: 'Estimated Outstanding Dues',  value: fmt(pending),   icon: Users,        sub: 'Estimated unpaid amount' },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {cards.map(({ label, value, icon: Icon, sub }) => (
          <div key={label} className="card card-hover py-4 text-center">
            <div className="w-7 h-7 rounded-lg bg-[#e1e5f2] flex items-center justify-center mx-auto mb-2">
              <Icon size={14} className="text-[#022b3a]/60" />
            </div>
            <p className="text-base font-bold text-[#022b3a] font-mono leading-tight">{value}</p>
            <p className="text-[11px] font-medium text-[#022b3a]/60 mt-0.5">{label}</p>
            <p className="text-[10px] text-[#1f7a8c]">{sub}</p>
          </div>
        ))}
      </div>
      {/* Balance breakdown — all three values from /admin/financial-report/summary */}
      <div className="card py-3 px-4">
        <p className="text-xs font-semibold text-[#022b3a] uppercase tracking-wide mb-2">Balance Breakdown</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-[10px] text-[#1f7a8c] mb-0.5">Total Balance</p>
            <p className="text-sm font-bold font-mono text-[#022b3a]">{fmt(totalBal)}</p>
            <p className="text-[9px] text-[#1f7a8c]">Bank + Cash (all time)</p>
          </div>
          <div className="text-center border-x border-[#bfdbf7]">
            <p className="text-[10px] text-[#1f7a8c] mb-0.5">Bank Balance</p>
            <p className="text-sm font-bold font-mono text-[#022b3a]">{fmt(bankBal)}</p>
            <p className="text-[9px] text-[#1f7a8c]">Collections − Expenses (all time)</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-[#1f7a8c] mb-0.5">Cash Balance</p>
            <p className="text-sm font-bold font-mono text-[#022b3a]">{fmt(cashBal)}</p>
            <p className="text-[9px] text-[#1f7a8c]">Collections − Expenses (all time)</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CollectionReport({ data, year, onExport, exporting }) {
  const tableRef = useRef(null)

  if (!data) return (
    <div className="card text-center py-12">
      <p className="text-sm text-[#1f7a8c]">No collection data available for the selected period.</p>
    </div>
  )

  const { rows = [], monthLabels = [], monthKeys = [], columnTotals = {}, grandTotal = 0, totalResidents = 0 } = data

  return (
    <div className="space-y-4">

      {/* Header bar */}
      <div className="card py-3 px-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#022b3a]">Collection Statement</p>
          <p className="text-xs text-[#1f7a8c]">{totalResidents} residents · {monthLabels.length} months</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportBtn label="PDF"   type="collection" format="pdf"   onExport={onExport} exporting={exporting} />
          <ExportBtn label="Excel" type="collection" format="excel" onExport={onExport} exporting={exporting} />
        </div>
      </div>

      {/* Matrix Table — scrollable horizontally */}
      <div className="card p-0 overflow-hidden">
        {/* Report Header */}
        <div className="border-b border-[#bfdbf7] px-5 py-4 text-center bg-white/60">
          <p className="text-sm font-bold text-[#022b3a] tracking-wide uppercase">{APARTMENT}</p>
          <p className="text-xs text-[#022b3a]/60 mt-0.5">Collection Statement — {year}</p>
          <p className="text-[10px] text-[#1f7a8c] mt-0.5">
            Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <div className="overflow-x-auto" ref={tableRef}>
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-[#bfdbf7] bg-white">
                <th className="report-th sticky left-0 bg-white z-10 min-w-[60px]">#</th>
                <th className="report-th sticky left-[60px] bg-white z-10 min-w-[180px] text-left">Owner Name</th>
                <th className="report-th min-w-[70px]">Type</th>
                <th className="report-th min-w-[75px]">Sq.Ft</th>
                <th className="report-th min-w-[90px]">Maint.Val</th>
                {monthLabels.map(m => (
                  <th key={m} className="report-th min-w-[90px]">{m}</th>
                ))}
                <th className="report-th min-w-[100px] bg-[#e1e5f2]">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.residentId} className={`border-b border-[#bfdbf7]/60 ${idx % 2 === 0 ? '' : 'bg-white/30'} hover:bg-[#e1e5f2]/40 transition-colors`}>
                  <td className="report-td text-center sticky left-0 bg-inherit z-10 text-[#1f7a8c]">{idx + 1}</td>
                  <td className="report-td sticky left-[60px] bg-inherit z-10">
                    <div>
                      <p className="font-medium text-[#022b3a]">{row.ownerName}</p>
                      <p className="text-[10px] text-[#1f7a8c]">Flat {row.flatNo}</p>
                    </div>
                  </td>
                  <td className="report-td text-center">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e1e5f2] text-[#022b3a]/60">{row.propertyType}</span>
                  </td>
                  <td className="report-td text-right font-mono">{fmtN(row.sqFt)}</td>
                  <td className="report-td text-right font-mono">{fmt(row.maintValue)}</td>
                  {monthKeys.map(key => {
                    const amt = row.months?.[key] ?? 0
                    return (
                      <td key={key} className="report-td text-right font-mono text-[#022b3a]">
                        {Number(amt) > 0 ? fmt(amt) : '—'}
                      </td>
                    )
                  })}
                  <td className="report-td text-right font-mono font-bold text-[#022b3a] bg-[#e1e5f2]/50">
                    {fmt(row.total)}
                  </td>
                </tr>
              ))}

              {/* Column Totals Row */}
              <tr className="border-t-2 border-[#bfdbf7] bg-[#e1e5f2]">
                <td className="report-td sticky left-0 bg-[#e1e5f2] z-10 font-bold text-[#022b3a]/60">#</td>
                <td className="report-td sticky left-[60px] bg-[#e1e5f2] z-10 font-bold text-[#022b3a] uppercase tracking-wide">TOTAL</td>
                <td className="report-td" />
                <td className="report-td" />
                <td className="report-td" />
                {monthKeys.map(key => (
                  <td key={key} className="report-td text-right font-mono font-bold text-[#022b3a]">
                    {fmt(columnTotals[key] ?? 0)}
                  </td>
                ))}
                <td className="report-td text-right font-mono font-bold text-[#022b3a] bg-[#bfdbf7]">
                  {fmt(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Statement Footer */}
        <div className="border-t border-[#bfdbf7] p-4 grid grid-cols-2 sm:grid-cols-5 gap-0">
          {[
            { label: 'Opening Balance (Period Start)',   value: data.openingBalance },
            { label: 'Total Collected', value: data.totalCollected },
            { label: 'Total Expenses',  value: data.totalExpenses  },
            { label: 'Closing Balance (Period End)',   value: data.closingBalance, highlight: true },
            { label: 'Pending Dues',      value: data.pendingDues    },
          ].map(({ label, value, highlight }) => (
            <div key={label} className={`px-4 py-3 ${highlight ? 'bg-[#e1e5f2] rounded-lg' : ''}`}>
              <p className={`text-[10px] uppercase tracking-wide font-medium ${highlight ? 'text-[#022b3a]' : 'text-[#1f7a8c]'}`}>{label}</p>
              <p className={`text-sm font-bold font-mono mt-0.5 text-[#022b3a]`}>{fmt(value)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ExpenseReport({ data, onExport, exporting }) {
  const [catOpen, setCatOpen] = useState(false)

  if (!data) return (
    <div className="card text-center py-12">
      <p className="text-sm text-[#1f7a8c]">No expense data available for the selected period.</p>
    </div>
  )

  const { records = [], categoryTotals = [], periodLabel = '', totalExpenses = 0,
          openingBalance = 0, totalIncome = 0, bankBalance = 0,
          totalCheque = 0, totalCash = 0 } = data

  return (
    <div className="space-y-4">

      {/* Header bar */}
      <div className="card py-3 px-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#022b3a]">Expense Statement</p>
          <p className="text-xs text-[#1f7a8c]">{records.length} transactions · {periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportBtn label="PDF"   type="expenses" format="pdf"   onExport={onExport} exporting={exporting} />
          <ExportBtn label="Excel" type="expenses" format="excel" onExport={onExport} exporting={exporting} />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {/* Report header */}
        <div className="border-b border-[#bfdbf7] px-5 py-4 text-center bg-white/60">
          <p className="text-sm font-bold text-[#022b3a] tracking-wide uppercase">{APARTMENT}</p>
          <p className="text-xs text-[#022b3a]/60 mt-0.5">Expense Statement — {periodLabel}</p>
          <p className="text-[10px] text-[#1f7a8c] mt-0.5">
            Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* Main expense table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#bfdbf7] bg-white">
                <th className="report-th w-10">#</th>
                <th className="report-th w-28 text-left">Date</th>
                <th className="report-th text-left">Description</th>
                <th className="report-th w-40 text-left">Category</th>
                <th className="report-th w-24">Method</th>
                <th className="report-th w-28 text-right">Amount</th>
                <th className="report-th w-28 text-right">Running Total</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-[#1f7a8c] text-xs">No expenses recorded for this period</td></tr>
              ) : records.map((rec, idx) => (
                <tr key={idx} className={`border-b border-[#bfdbf7]/50 hover:bg-[#e1e5f2]/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-white/20'}`}>
                  <td className="report-td text-center text-[#1f7a8c]">{rec.slNo}</td>
                  <td className="report-td text-[#022b3a]/60 font-mono text-[10px]">{fmtDate(rec.date)}</td>
                  <td className="report-td text-[#022b3a]">{rec.description}</td>
                  <td className="report-td">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e1e5f2] text-[#022b3a]/60 border border-[#bfdbf7]">
                      {rec.category}
                    </span>
                  </td>
                  <td className="report-td text-center text-[#1f7a8c]">{rec.paymentMethod}</td>
                  <td className="report-td text-right font-mono text-[#022b3a]">{fmt(rec.amount)}</td>
                  <td className="report-td text-right font-mono text-[#022b3a]/60">{fmt(rec.runningTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#bfdbf7] bg-[#e1e5f2]">
                <td colSpan={5} className="report-td text-right font-bold text-[#022b3a] uppercase tracking-wide pr-4">Total Expenses</td>
                <td className="report-td text-right font-mono font-bold text-[#022b3a]">{fmt(totalExpenses)}</td>
                <td className="report-td" />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Category breakdown + Bank summary */}
        <div className="border-t border-[#bfdbf7] grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-700">

          {/* Category breakdown */}
          <div className="p-4">
            <button onClick={() => setCatOpen(!catOpen)}
              className="flex items-center gap-2 text-xs font-semibold text-[#022b3a] uppercase tracking-wide w-full text-left mb-3 hover:text-[#022b3a] transition-colors">
              Expense by Category
              <ChevronDown size={13} className={`transition-transform ${catOpen ? 'rotate-180' : ''} ml-auto`} />
            </button>
            <div className={`space-y-1.5 overflow-hidden transition-all ${catOpen ? 'max-h-[1000px]' : 'max-h-[140px]'}`}>
              {categoryTotals.map(({ category, amount }) => {
                const total = Number(totalExpenses) || 1
                const pct   = Math.round((Number(amount) / total) * 100)
                return (
                  <div key={category}>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[11px] text-[#022b3a]/60 truncate max-w-[70%]">{category}</span>
                      <span className="text-[11px] text-[#022b3a] font-mono">{fmt(amount)}</span>
                    </div>
                    <div className="h-1 bg-[#e1e5f2] rounded-full overflow-hidden">
                      <div className="h-full bg-[#bfdbf7] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            {!catOpen && categoryTotals.length > 4 && (
              <button onClick={() => setCatOpen(true)} className="text-[10px] text-[#1f7a8c] hover:text-[#022b3a]/60 mt-2">
                + {categoryTotals.length - 4} more categories
              </button>
            )}
            <div className="mt-3 flex items-center gap-4 pt-3 border-t border-[#bfdbf7]">
              <div><p className="text-[10px] text-[#1f7a8c]">Cheque</p><p className="text-xs font-mono text-[#022b3a]">{fmt(totalCheque)}</p></div>
              <div><p className="text-[10px] text-[#1f7a8c]">Cash</p><p className="text-xs font-mono text-[#022b3a]">{fmt(totalCash)}</p></div>
            </div>
          </div>

          {/* Bank Statement Summary */}
          <div className="p-4">
            <p className="text-xs font-semibold text-[#022b3a] uppercase tracking-wide mb-3">Bank Summary</p>
            <div className="space-y-0">
              {[
                { label: 'Opening Balance (Period Start)',    value: openingBalance, border: true },
                { label: '+ By Bank Transfer', value: totalIncome },
                { label: 'Total Income',       value: Number(openingBalance) + Number(totalIncome), bold: true },
                { label: '− Cheque Expenses',  value: totalCheque },
                { label: '− Cash Expenses',    value: totalCash },
                { label: 'Bank Balance',       value: bankBalance, highlight: true },
              ].map(({ label, value, bold, highlight, border }) => (
                <div key={label} className={`flex justify-between items-center py-2 ${border ? 'border-b border-[#bfdbf7]' : ''}`}>
                  <span className={`text-xs ${highlight ? 'font-bold text-[#022b3a]' : bold ? 'font-semibold text-[#022b3a]' : 'text-[#1f7a8c]'}`}>
                    {label}
                  </span>
                  <span className={`text-xs font-mono ${highlight ? 'font-bold text-[#022b3a] text-sm' : bold ? 'font-semibold text-[#022b3a]' : 'text-[#022b3a]/60'}`}>
                    {fmt(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExportBtn({ label, type, format, onExport, exporting }) {
  const key     = `${type}-${format}`
  const loading = exporting === key
  const Icon    = format === 'pdf' ? FileText : Download
  return (
    <button onClick={() => onExport(type, format)} disabled={!!exporting}
      className="btn-secondary flex items-center gap-1.5 text-xs disabled:opacity-50">
      {loading
        ? <div className="w-3 h-3 border border-[#bfdbf7] border-t-white rounded-full animate-spin" />
        : <Icon size={12} />}
      {label}
    </button>
  )
}