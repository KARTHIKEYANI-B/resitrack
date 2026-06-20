import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Users, IndianRupee, ChevronLeft, ChevronRight,
  AlertTriangle, FileX
} from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import toast from 'react-hot-toast'

const APARTMENT = 'R R Dhurya Owners Welfare Association'

// Full amount — no K/L/M abbreviations, consistent with Financial Summary
const fmt = (v) => {
  if (v === null || v === undefined) return ''
  const n = Number(v)
  if (isNaN(n) || n === 0) return ''
  return '₹\u00A0' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
const fmtBold = (v) => {
  const n = Number(v ?? 0)
  if (isNaN(n)) return '₹0'
  return '₹\u00A0' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// Current financial year start (Apr→Mar), mirrors the backend's own
// getCurrentFinancialYearStart() so the default selector value is sensible
// even before the first response arrives.
const today = new Date()
const CURRENT_FY_START = today.getMonth() + 1 >= 4 ? today.getFullYear() : today.getFullYear() - 1

export default function ResidentPaymentDetail() {
  const [fyStart,  setFyStart]  = useState(CURRENT_FY_START)
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const fetchData = useCallback(async (year) => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminAPI.getResidentPaymentDetail({ fyStartYear: year })
      setData(res.data?.data ?? null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resident payment detail')
      toast.error('Failed to load resident payment detail')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(fyStart) }, [fyStart, fetchData])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="section-title text-xl">Resident Paid/Unpaid Detail</h1>
          <p className="section-subtitle">{APARTMENT}</p>
        </div>
        <button onClick={() => fetchData(fyStart)} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Financial Year Selector ────────────────────────────── */}
      <div className="card py-3 px-4 flex flex-wrap items-center gap-3">
        <label className="text-xs text-[#1f7a8c] whitespace-nowrap">Financial Year</label>
        <button
          onClick={() => setFyStart(y => y - 1)}
          className="w-7 h-7 rounded-lg flex items-center justify-center border border-[#bfdbf7] hover:bg-[#e1e5f2] transition-colors"
          aria-label="Previous financial year">
          <ChevronLeft size={14} className="text-[#022b3a]/60" />
        </button>
        <span className="text-sm font-semibold text-[#022b3a] font-mono min-w-[110px] text-center">
          {data?.financialYearLabel ?? `FY ${fyStart}-${String(fyStart + 1).slice(2)}`}
        </span>
        <button
          onClick={() => setFyStart(y => y + 1)}
          className="w-7 h-7 rounded-lg flex items-center justify-center border border-[#bfdbf7] hover:bg-[#e1e5f2] transition-colors"
          aria-label="Next financial year">
          <ChevronRight size={14} className="text-[#022b3a]/60" />
        </button>
        <span className="text-[11px] text-[#1f7a8c]">
          Apr {fyStart} – Mar {fyStart + 1}
        </span>
        {data?.totalResidents != null && (
          <span className="text-[11px] text-[#1f7a8c] ml-auto flex items-center gap-1.5">
            <Users size={12} /> {data.totalResidents} residents
          </span>
        )}
      </div>

      {/* ── Error State ─────────────────────────────────────────── */}
      {error && (
        <div className="card text-center py-12 flex flex-col items-center gap-2">
          <AlertTriangle size={28} className="text-red-500" />
          <p className="text-sm text-[#022b3a] font-medium">{error}</p>
          <button onClick={() => fetchData(fyStart)} className="btn-secondary mt-2 flex items-center gap-2">
            <RefreshCw size={13} /> Try Again
          </button>
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────── */}
      {!error && data && data.rows?.length === 0 && (
        <EmptyState
          icon={FileX}
          title="No residents found"
          description="There are no active, approved owner residents to display for this financial year."
        />
      )}

      {/* ── Matrix Table ─────────────────────────────────────────── */}
      {!error && data && data.rows?.length > 0 && (
        <PaymentMatrix data={data} />
      )}
    </div>
  )
}

// Fixed pixel widths for the sticky leftmost columns. These must be exact
// (not just min-width) so the sticky `left` offsets below line up perfectly
// regardless of how long a resident's name or flat number is — using
// min-w alone (the previous approach) let column widths drift with content,
// which is what caused the Flat/Villa column to misalign and eventually
// scroll out of view instead of staying pinned.
const COL_SERIAL_W = 48   // '#' column
const COL_NAME_W    = 190  // 'Resident Name' column
const COL_FLAT_W    = 130  // 'Flat/Villa No.' column

const LEFT_NAME = COL_SERIAL_W
const LEFT_FLAT = COL_SERIAL_W + COL_NAME_W

// Shared sticky-cell styling. A solid, fully opaque background is mandatory
// here — sticky cells must never rely on `bg-inherit`, alpha-transparency,
// or hover-utility backgrounds, because the scrolling month columns sit
// directly underneath them in the same stacking context and any
// transparency lets that content visually bleed through (the "overlapping
// cells" defect called out in the task).
const stickyBase = 'sticky z-20'

function PaymentMatrix({ data }) {
  const { rows = [], monthLabels = [], monthKeys = [], columnTotals = {}, grandTotal = 0 } = data

  return (
    <div className="card p-0 overflow-hidden">
      {/* Report header */}
      <div className="border-b border-[#bfdbf7] px-5 py-4 text-center bg-white/60">
        <p className="text-sm font-bold text-[#022b3a] tracking-wide uppercase">{APARTMENT}</p>
        <p className="text-xs text-[#022b3a]/60 mt-0.5">Resident Paid/Unpaid Detail — {data.financialYearLabel}</p>
        <p className="text-[10px] text-[#1f7a8c] mt-0.5">
          Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/*
        Bounded scroll viewport: scrolls both horizontally (months) and
        vertically (residents) within a fixed-height panel. This is what
        makes the sticky <thead> meaningful for large resident lists — a
        sticky header inside an unbounded container has nothing to stick
        within, since the whole page would scroll past it instead.
        `scroll-smooth` satisfies the "smooth scrolling" requirement.
      */}
      <div className="overflow-auto scroll-smooth max-h-[70vh]">
        <table className="text-xs" style={{ tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
          <colgroup>
            <col style={{ width: COL_SERIAL_W }} />
            <col style={{ width: COL_NAME_W }} />
            <col style={{ width: COL_FLAT_W }} />
            {monthKeys.map(key => <col key={key} style={{ width: 96 }} />)}
            <col style={{ width: 112 }} />
          </colgroup>
          <thead>
            <tr>
              <th
                className={`${stickyBase} report-th top-0 left-0 border-r border-[#bfdbf7]`}
                style={{ background: '#FFE0C5' }}>
                S.NO
              </th>
              <th
                className={`${stickyBase} report-th top-0 text-left border-r border-[#bfdbf7]`}
                style={{ left: LEFT_NAME, background: '#FFE0C5' }}>
                Resident Name
              </th>
              <th
                className={`${stickyBase} report-th top-0 border-r-2 border-[#022b3a]/15`}
                style={{ left: LEFT_FLAT, background: '#FFE0C5' }}>
                Flat/Villa No.
              </th>
              {monthLabels.map(m => (
                <th key={m} className="report-th sticky top-0 z-10">{m}</th>
              ))}
              <th className="report-th sticky top-0 z-10 bg-[#e1e5f2]">ROW TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <MatrixRow key={row.residentId} row={row} idx={idx} monthKeys={monthKeys} />
            ))}
          </tbody>
          <tfoot>
            {/* Column Totals Row — sticky to the bottom edge of the scroll
                viewport is intentionally NOT used here (would require a
                second sticky axis and add complexity); instead it sits in
                a <tfoot> with a strong top border + solid fill so it reads
                clearly as the closing summary row when scrolled to. */}
            <tr>
              <td
                className={`${stickyBase} report-td left-0 border-r border-t-2 border-[#022b3a]/20 font-bold text-[#022b3a]/60`}
                style={{ background: '#e1e5f2' }}>
                
              </td>
              <td
                className={`${stickyBase} report-td border-r border-t-2 border-[#022b3a]/20 font-bold text-[#022b3a] uppercase tracking-wide`}
                style={{ left: LEFT_NAME, background: '#e1e5f2' }}>
                Total
              </td>
              <td
                className={`${stickyBase} report-td border-r-2 border-t-2 border-[#022b3a]/20`}
                style={{ left: LEFT_FLAT, background: '#e1e5f2' }}
              />
              {monthKeys.map(key => (
                <td key={key} className="report-td text-right font-mono font-bold text-[#022b3a] bg-[#e1e5f2] border-t-2 border-[#022b3a]/20">
                  {fmtBold(columnTotals[key] ?? 0)}
                </td>
              ))}
              <td className="report-td text-right font-mono font-bold text-[#022b3a] bg-[#bfdbf7] border-t-2 border-[#022b3a]/20">
                {fmtBold(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Grand total footer */}
      <div className="border-t border-[#bfdbf7] p-4 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide font-medium text-[#1f7a8c] flex items-center gap-1.5">
          <IndianRupee size={12} /> Grand Total Collected ({data.financialYearLabel})
        </span>
        <span className="text-sm font-bold font-mono text-[#022b3a]">{fmtBold(grandTotal)}</span>
      </div>
    </div>
  )
}

// One resident row. Hover state is tracked in JS (not CSS :hover /
// group-hover) so the sticky-column background color has a single source
// of truth — avoiding any CSS-specificity ambiguity between an inline
// `style` background (needed for the sticky cells to stay fully opaque
// over the scrolling month columns) and a Tailwind hover utility class.
function MatrixRow({ row, idx, monthKeys }) {
  const [hovered, setHovered] = useState(false)

  const zebra      = idx % 2 === 0 ? '#ffffff' : '#FAFCFC'
  const stickyBg    = hovered ? '#E9F3F3' : zebra
  const monthCellBg = hovered ? 'rgba(225,229,242,0.35)' : 'transparent'

  return (
    <tr onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <td
        className={`${stickyBase} report-td text-center left-0 border-r border-[#bfdbf7] text-[#1f7a8c] transition-colors`}
        style={{ background: stickyBg }}>
        {idx + 1}
      </td>
      <td
        className={`${stickyBase} report-td border-r border-[#bfdbf7] font-medium text-[#022b3a] truncate transition-colors`}
        style={{ left: LEFT_NAME, background: stickyBg }}
        title={row.residentName}>
        {row.residentName}
      </td>
      <td
        className={`${stickyBase} report-td text-center border-r-2 border-[#022b3a]/15 transition-colors`}
        style={{ left: LEFT_FLAT, background: stickyBg }}>
        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-[#e1e5f2] text-[#022b3a]/70 font-medium truncate max-w-full">
          {row.flatNo}
        </span>
      </td>
      {monthKeys.map(key => {
        const amt = row.months?.[key]
        return (
          <td
            key={key}
            className="report-td text-right font-mono text-[#022b3a] transition-colors"
            style={{ background: monthCellBg }}>
            {fmt(amt)}
          </td>
        )
      })}
      <td
        className="report-td text-right font-mono font-bold text-[#022b3a] transition-colors"
        style={{ background: hovered ? 'rgba(225,229,242,0.7)' : 'rgba(225,229,242,0.5)' }}>
        {fmtBold(row.rowTotal)}
      </td>
    </tr>
  )
}