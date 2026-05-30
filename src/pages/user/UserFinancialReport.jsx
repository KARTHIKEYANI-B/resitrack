import { useState, useEffect, useCallback } from 'react'
import { Download, FileText, TrendingUp, TrendingDown, RefreshCw, IndianRupee, ShieldCheck } from 'lucide-react'
import { userAPI } from '../../api/userAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const CY     = new Date().getFullYear()
const YEARS  = Array.from({ length: 4 }, (_, i) => CY - i)
const APARTMENT = 'R R Dhurya Owners Welfare Association'

const fmt  = (v) => {
  const n = Number(v)
  if (isNaN(n) || n === 0) return '—'
  return '₹\u00A0' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
const fmtDate = (s) => {
  if (!s || s === '—') return '—'
  try { return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return s }
}
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function UserFinancialReport() {
  const [tab,        setTab]        = useState('collection')
  const [year,       setYear]       = useState(CY)
  const [startMonth, setStartMonth] = useState(4)
  const [endMonth,   setEndMonth]   = useState(3)
  const [loading,    setLoading]    = useState(true)
  const [exporting,  setExporting]  = useState(null)
  const [collData,   setCollData]   = useState(null)
  const [expData,    setExpData]    = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const params = { year, startMonth, endMonth }
      const [cRes, eRes] = await Promise.allSettled([
        userAPI.getCollectionReport(params),
        userAPI.getExpenseReport(params),
      ])
      if (cRes.status === 'fulfilled') setCollData(cRes.value.data?.data ?? null)
      if (eRes.status === 'fulfilled') setExpData(eRes.value.data?.data ?? null)
    } catch { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }, [year, startMonth, endMonth])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleExport = async (type, format) => {
    const key = `${type}-${format}`; setExporting(key)
    const params = { year, startMonth, endMonth }
    try {
      let res
      if (type === 'collection' && format === 'pdf')   res = await userAPI.exportCollectionPdf(params)
      if (type === 'collection' && format === 'excel') res = await userAPI.exportCollectionExcel(params)
      if (type === 'expenses'   && format === 'pdf')   res = await userAPI.exportExpensePdf(params)
      if (type === 'expenses'   && format === 'excel') res = await userAPI.exportExpenseExcel(params)
      const ext = format === 'pdf' ? 'pdf' : 'xlsx'
      downloadBlob(res.data, `${type}-report-${year}.${ext}`)
      toast.success(`${format.toUpperCase()} downloaded`)
    } catch { toast.error('Export failed') }
    finally { setExporting(null) }
  }

  if (loading) return <PageLoader />

  const { rows = [], monthLabels = [], monthKeys = [], columnTotals = {}, grandTotal = 0 } = collData ?? {}
  const { records = [], categoryTotals = [], periodLabel = '', totalExpenses = 0,
          openingBalance = 0, totalIncome = 0, bankBalance = 0 } = expData ?? {}

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="section-title text-xl">Financial Report</h1>
          <p className="section-subtitle">Apartment financial transparency — read only</p>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#1f7a8c]" />
          <span className="text-xs text-[#1f7a8c]">View only — no editing</span>
          <button onClick={fetchAll} className="btn-secondary flex items-center gap-1.5 ml-2"><RefreshCw size={12} /></button>
        </div>
      </div>

      {/* Filters */}
      <div className="card py-3 px-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#1f7a8c]">Year</label>
          <select value={year} onChange={e => setYear(+e.target.value)} className="input-field w-24">
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#1f7a8c]">From</label>
          <select value={startMonth} onChange={e => setStartMonth(+e.target.value)} className="input-field w-24">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#1f7a8c]">To</label>
          <select value={endMonth} onChange={e => setEndMonth(+e.target.value)} className="input-field w-24">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Collected',  value: fmt(collData?.totalCollected), icon: TrendingUp },
          { label: 'Total Expenses',   value: fmt(expData?.totalExpenses),   icon: TrendingDown },
          { label: 'Closing Balance',  value: fmt(collData?.closingBalance), icon: IndianRupee },
          { label: 'Pending Dues',     value: fmt(collData?.pendingDues),    icon: FileText },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card card-hover text-center py-4">
            <Icon size={14} className="text-[#1f7a8c] mx-auto mb-1" />
            <p className="text-base font-bold text-[#022b3a] font-mono">{value}</p>
            <p className="text-[11px] text-[#1f7a8c] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div className="flex gap-2">
        {[
          { key: 'collection', label: 'Collection Report' },
          { key: 'expenses',   label: 'Expense Report' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-xl text-sm font-medium border transition-all ${
              tab === key
                ? 'bg-white text-[#022b3a] border-[#bfdbf7]'
                : 'bg-white text-[#022b3a]/60 border-[#bfdbf7] hover:text-[#022b3a]'
            }`}>{label}</button>
        ))}
      </div>

      {/* Collection Table */}
      {tab === 'collection' && (
        <div className="card p-0 overflow-hidden">
          <div className="border-b border-[#bfdbf7] px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#022b3a]">{APARTMENT}</p>
              <p className="text-xs text-[#1f7a8c]">Collection Statement — {year} · {rows.length} residents</p>
            </div>
            <div className="flex gap-2">
              <ExportBtn label="PDF"   type="collection" format="pdf"   onExport={handleExport} exporting={exporting} />
              <ExportBtn label="Excel" type="collection" format="excel" onExport={handleExport} exporting={exporting} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-[#bfdbf7] bg-white">
                  <th className="report-th w-8">#</th>
                  <th className="report-th text-left min-w-[160px]">Owner Name</th>
                  <th className="report-th min-w-[55px]">Type</th>
                  <th className="report-th min-w-[65px]">Sq.Ft</th>
                  <th className="report-th min-w-[80px]">Maint.Val</th>
                  {monthLabels.map(m => (
                    <th key={m} className="report-th min-w-[85px]">{m}</th>
                  ))}
                  <th className="report-th min-w-[90px]">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={6 + monthLabels.length} className="text-center py-8 text-[#1f7a8c]">No collection data</td></tr>
                ) : rows.map((row, idx) => (
                  <tr key={row.residentId} className={`border-b border-[#bfdbf7]/40 ${idx % 2 === 0 ? '' : 'bg-white/20'}`}>
                    <td className="report-td text-center text-[#1f7a8c]">{idx + 1}</td>
                    <td className="report-td">
                      <p className="font-medium text-[#022b3a]">{row.ownerName}</p>
                      <p className="text-[10px] text-[#1f7a8c]">Flat {row.flatNo}</p>
                    </td>
                    <td className="report-td text-center text-[#1f7a8c]">{row.propertyType}</td>
                    <td className="report-td text-right font-mono">{row.sqFt}</td>
                    <td className="report-td text-right font-mono">{fmt(row.maintValue)}</td>
                    {monthKeys.map(key => {
                      const amt = row.months?.[key] ?? 0
                      return (
                        <td key={key} className={`report-td text-right font-mono ${Number(amt) > 0 ? 'text-[#022b3a]' : 'text-[#022b3a]'}`}>
                          {Number(amt) > 0 ? fmt(amt) : '—'}
                        </td>
                      )
                    })}
                    <td className="report-td text-right font-mono font-bold text-[#022b3a]">{fmt(row.total)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-[#bfdbf7] bg-[#e1e5f2] font-bold">
                  <td className="report-td" />
                  <td className="report-td text-[#022b3a] uppercase tracking-wide">TOTAL</td>
                  <td className="report-td" /><td className="report-td" /><td className="report-td" />
                  {monthKeys.map(key => (
                    <td key={key} className="report-td text-right font-mono text-[#022b3a]">{fmt(columnTotals[key] ?? 0)}</td>
                  ))}
                  <td className="report-td text-right font-mono text-[#022b3a]">{fmt(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense Table */}
      {tab === 'expenses' && (
        <div className="card p-0 overflow-hidden">
          <div className="border-b border-[#bfdbf7] px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#022b3a]">Expense Statement — {periodLabel}</p>
              <p className="text-xs text-[#1f7a8c]">{records.length} transactions</p>
            </div>
            <div className="flex gap-2">
              <ExportBtn label="PDF"   type="expenses" format="pdf"   onExport={handleExport} exporting={exporting} />
              <ExportBtn label="Excel" type="expenses" format="excel" onExport={handleExport} exporting={exporting} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#bfdbf7] bg-white">
                  <th className="report-th w-8">#</th>
                  <th className="report-th w-28 text-left">Date</th>
                  <th className="report-th text-left">Description</th>
                  <th className="report-th w-36 text-left">Category</th>
                  <th className="report-th w-24 text-right">Amount</th>
                  <th className="report-th w-28 text-right">Running Total</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-[#1f7a8c]">No expenses recorded</td></tr>
                ) : records.map((rec, idx) => (
                  <tr key={idx} className={`border-b border-[#bfdbf7]/40 ${idx % 2 === 0 ? '' : 'bg-white/20'}`}>
                    <td className="report-td text-center text-[#1f7a8c]">{rec.slNo}</td>
                    <td className="report-td text-[#022b3a]/60 font-mono text-[10px]">{fmtDate(rec.date)}</td>
                    <td className="report-td text-[#022b3a]">{rec.description}</td>
                    <td className="report-td">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e1e5f2] text-[#1f7a8c] border border-[#bfdbf7]">{rec.category}</span>
                    </td>
                    <td className="report-td text-right font-mono text-[#022b3a]">{fmt(rec.amount)}</td>
                    <td className="report-td text-right font-mono text-[#1f7a8c]">{fmt(rec.runningTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#bfdbf7] bg-[#e1e5f2]">
                  <td colSpan={4} className="report-td text-right font-bold text-[#022b3a] pr-4">Total</td>
                  <td className="report-td text-right font-mono font-bold text-[#022b3a]">{fmt(totalExpenses)}</td>
                  <td className="report-td" />
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Bank summary */}
          <div className="border-t border-[#bfdbf7] p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Opening Balance', value: openingBalance },
              { label: '+ Income',        value: totalIncome },
              { label: '− Expenses',      value: totalExpenses },
              { label: 'Bank Balance',    value: bankBalance, bold: true },
            ].map(({ label, value, bold }) => (
              <div key={label}>
                <p className="text-[10px] text-[#1f7a8c] uppercase tracking-wide">{label}</p>
                <p className={`text-sm font-mono mt-0.5 ${bold ? 'font-bold text-[#022b3a]' : 'text-[#022b3a]/60'}`}>{fmt(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ExportBtn({ label, type, format, onExport, exporting }) {
  const key     = `${type}-${format}`
  const loading = exporting === key
  return (
    <button onClick={() => onExport(type, format)} disabled={!!exporting}
      className="btn-secondary flex items-center gap-1.5 text-xs disabled:opacity-50">
      {loading
        ? <div className="w-3 h-3 border border-[#bfdbf7] border-t-white rounded-full animate-spin" />
        : <Download size={12} />}
      {label}
    </button>
  )
}