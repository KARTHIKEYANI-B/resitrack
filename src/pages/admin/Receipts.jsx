import { useState, useEffect, useCallback } from 'react'
import { Eye, Download, Printer, FileText, RefreshCw, CheckCircle, Search } from 'lucide-react'
import { adminAPI } from '../../api/adminAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import SearchBar, { FilterSelect } from '../../components/common/SearchBar'
import Pagination from '../../components/common/Pagination'
import EmptyState from '../../components/common/EmptyState'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate, formatDateTime } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

/* ── Helpers ─────────────────────────────────────────────────────────── */
function monthDisplay(ym) {
  if (!ym) return '—'
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}

export function ReceiptLayout({ receipt }) {
  if (!receipt) return null
  const late  = Number(receipt.lateFeeAmount ?? 0)
  const paid  = Number(receipt.paidAmount ?? 0)
  const total = Number(receipt.totalAmount ?? (paid + late))

  const rows = [
    ['Receipt No.',     receipt.receiptNumber ?? '—'],
    ['Owner Name',      receipt.residentName  ?? '—'],
    ['Flat / Villa',    receipt.flatNumber     ?? '—'],
    ['Property Type',   receipt.flatType       ?? '—'],
    ['Phone',           receipt.residentPhone  ?? '—'],
    ['Payment Date',    formatDate(receipt.paymentDate)],
    ['Billing Period',  monthDisplay(receipt.paymentMonth)],
    ['Payment Mode',    receipt.paymentMethod  ?? '—'],
  ]

  return (
    <div
      id="receipt-preview"
      className="mx-auto bg-white font-mono text-[#1a1a1a] rounded-xl shadow-lg"
      style={{ maxWidth: 360, border: '1px solid #e5e7eb' }}
    >
      {/* ── Header ─────────────────────────────────── */}
      <div className="text-center px-6 pt-7 pb-4">
        <div className="w-10 h-10 rounded-xl bg-[#022b3a] flex items-center justify-center mx-auto mb-3">
          <FileText size={18} className="text-white" />
        </div>
        <p className="text-[11px] font-sans font-semibold text-[#1f7a8c] uppercase tracking-widest mb-1">
          Payment Receipt
        </p>
        <h2 className="text-sm font-sans font-bold text-[#022b3a] leading-snug">
          R R Dhurya Owners<br />Welfare Association
        </h2>
        <p className="text-[11px] text-[#6b7280] mt-1 font-sans">
          {formatDateTime(receipt.generatedAt)}
        </p>
      </div>

      {/* ── Dashed divider ──────────────────────────── */}
      <Dash />

      {/* ── Owner & payment details ─────────────────── */}
      <div className="px-6 py-4 space-y-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-start gap-2">
            <span className="text-[11px] text-[#6b7280] font-sans uppercase tracking-wide whitespace-nowrap">
              {label}
            </span>
            <span className="text-[12px] text-[#022b3a] font-semibold font-sans text-right break-all">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Dashed divider ──────────────────────────── */}
      <Dash />

      {/* ── Amount breakdown ────────────────────────── */}
      <div className="px-6 py-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-[#6b7280] font-sans uppercase tracking-wide">Maintenance Amount</span>
          <span className="text-[13px] font-semibold font-sans text-[#022b3a]">{formatCurrency(paid)}</span>
        </div>
        {late > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[#6b7280] font-sans uppercase tracking-wide">Late Fee</span>
            <span className="text-[13px] font-semibold font-sans text-red-600">{formatCurrency(late)}</span>
          </div>
        )}
        {/* Dotted subtotal line */}
        <div className="border-t border-dashed border-[#d1d5db] my-1" />
        <div className="flex justify-between items-center">
          <span className="text-[13px] font-bold font-sans text-[#022b3a] uppercase tracking-wide">Total Paid</span>
          <span className="text-[17px] font-bold font-sans text-[#022b3a]">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* ── Dashed divider ──────────────────────────── */}
      <Dash />

      {/* ── Verification stamp ──────────────────────── */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-sans text-[#6b7280] uppercase tracking-wider">Status</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <CheckCircle size={14} className="text-green-600" />
            <span className="text-[13px] font-bold font-sans text-green-700">Verified & Paid</span>
          </div>
        </div>
        {/* Stamp circle */}
        <div className="w-14 h-14 rounded-full border-2 border-green-600 flex items-center justify-center flex-shrink-0 rotate-[-15deg]">
          <div className="text-center">
            <p className="text-[8px] font-bold text-green-700 leading-none">PAID</p>
            <CheckCircle size={12} className="text-green-600 mx-auto mt-0.5" />
          </div>
        </div>
      </div>

      {/* ── Footer text ─────────────────────────────── */}
      <div className="px-6 pb-4 text-center">
        <p className="text-[10px] font-sans text-[#6b7280] leading-relaxed">
          {receipt.receiptFooter || 'Thank you for your payment.'}
        </p>
      </div>

      {/* ── Barcode-style bottom strip ──────────────── */}
      <div className="px-6 pb-6">
        <Dash />
        <div className="mt-3 flex flex-col items-center gap-1">
          {/* Barcode bars simulation */}
          <div className="flex items-end gap-[2px] h-8">
            {Array.from({ length: 40 }, (_, i) => (
              <div
                key={i}
                className="bg-[#022b3a]"
                style={{
                  width: i % 7 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
                  height: i % 5 === 0 ? 32 : i % 2 === 0 ? 22 : 28,
                  opacity: 0.7 + (i % 3) * 0.1,
                }}
              />
            ))}
          </div>
          <p className="text-[9px] font-mono text-[#9ca3af] tracking-widest mt-1">
            {receipt.receiptNumber}
          </p>
        </div>
      </div>
    </div>
  )
}

function Dash() {
  return (
    <div className="px-4">
      <div className="border-t-2 border-dashed border-[#e5e7eb]" />
    </div>
  )
}

/* ── Admin Receipts Page ─────────────────────────────────────────────── */
const YEAR_OPTIONS = Array.from({ length: 4 }, (_, i) => {
  const y = new Date().getFullYear() - i
  return { value: y, label: String(y) }
})

export default function Receipts() {
  const [receipts,  setReceipts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [yearFilter,setYear]      = useState('')
  const [page,      setPage]      = useState(1)
  const [selected,  setSelected]  = useState(null)
  const PER_PAGE = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await adminAPI.getAllReceipts(yearFilter ? { year: yearFilter } : {})
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setReceipts(data)
    } catch { toast.error('Could not load receipts') }
    finally { setLoading(false) }
  }, [yearFilter])

  useEffect(() => { load() }, [load])

  const handleDownload = async (id) => {
    try {
      const res  = await adminAPI.downloadReceipt(id)
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a    = document.createElement('a')
      a.href     = url
      a.download = `receipt-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Download failed') }
  }

  const handlePrint = () => {
    const content = document.getElementById('receipt-preview')
    if (!content) return
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body{font-family:monospace;background:#fff;display:flex;justify-content:center;padding:20px}
        *{box-sizing:border-box}
        @media print{body{padding:0}}
      </style>
      </head><body>${content.outerHTML}</body></html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  const q        = search.toLowerCase()
  const filtered = receipts.filter(r =>
    (r.residentName  ?? '').toLowerCase().includes(q) ||
    (r.flatNumber    ?? '').toLowerCase().includes(q) ||
    (r.receiptNumber ?? '').toLowerCase().includes(q)
  )
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title text-xl">Receipts</h1>
          {/* <p className="section-subtitle">Payment receipts for all verified and approved transactions</p> */}
        </div>
        <button onClick={load} className="btn-secondary flex items-center justify-center gap-2 self-start sm:self-auto">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-[#bfdbf7]">
          <h2 className="text-sm font-semibold text-[#022b3a]">
            All Receipts
            {receipts.length > 0 && <span className="ml-2 text-xs font-normal text-[#1f7a8c]">({receipts.length})</span>}
          </h2>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <FilterSelect value={yearFilter} onChange={v => { setYear(v); setPage(1) }}
              options={YEAR_OPTIONS} placeholder="All Years" />
            <div className="relative flex-1 sm:flex-initial min-w-[160px] sm:min-w-0">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1f7a8c]" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Name, flat, receipt no…"
                className="input-field pl-8 w-full sm:w-52 text-xs" />
            </div>
          </div>
        </div>

        {paginated.length === 0 ? (
          <EmptyState title="No receipts found" description="Receipts appear after payments are verified." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full rt-table-animate">
                <thead className="border-b border-[#bfdbf7] bg-white/50">
                  <tr>
                    {['Receipt No.', 'Resident Name', 'Flat / Villa', 'Billing Month', 'Amount Paid', 'Late Fee', 'Payment Date', 'Payment Method', 'Actions'].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(r => (
                    <tr key={r.id} className="table-row">
                      <td className="table-cell font-mono text-xs text-[#022b3a]">{r.receiptNumber}</td>
                      <td className="table-cell">
                        <p className="font-medium text-[#022b3a] text-sm">{r.residentName}</p>
                        <p className="text-[10px] text-[#1f7a8c]">{r.flatType || ''}</p>
                      </td>
                      <td className="table-cell font-mono text-xs">{r.flatNumber}</td>
                      <td className="table-cell text-xs">{monthDisplay(r.paymentMonth)}</td>
                      <td className="table-cell font-mono text-sm text-[#022b3a]">
                        {formatCurrency(r.paidAmount)}
                      </td>
                      <td className="table-cell font-mono text-xs">
                        {r.lateFeeAmount > 0
                          ? <span className="text-red-400">{formatCurrency(r.lateFeeAmount)}</span>
                          : <span className="text-[#022b3a]/30">—</span>
                        }
                      </td>
                      <td className="table-cell text-xs">{formatDate(r.paymentDate)}</td>
                      <td className="table-cell text-xs">{r.paymentMethod || '—'}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelected(r)}
                            className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-[#022b3a] hover:bg-[#bfdbf7] transition-all" title="View">
                            <Eye size={13} />
                          </button>
                          <button onClick={() => handleDownload(r.id)}
                            className="p-1.5 rounded-lg text-[#1f7a8c] hover:text-[#022b3a] hover:bg-[#bfdbf7] transition-all" title="Download">
                            <Download size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[#bfdbf7]">
              {paginated.map(r => (
                <div key={r.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm text-[#022b3a]">{r.residentName}</p>
                      <p className="text-xs font-mono text-[#1f7a8c]">{r.flatNumber} · {r.flatType}</p>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-green-500 bg-green-950/30 border border-green-900/40 px-2 py-0.5 rounded-full flex-shrink-0">
                      <CheckCircle size={9} /> Paid
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><p className="text-[#1f7a8c]">Receipt</p><p className="font-mono text-[#022b3a]">{r.receiptNumber}</p></div>
                    <div><p className="text-[#1f7a8c]">Month</p><p className="text-[#022b3a]">{monthDisplay(r.paymentMonth)}</p></div>
                    <div><p className="text-[#1f7a8c]">Amount</p><p className="font-mono font-semibold text-[#022b3a]">{formatCurrency(r.paidAmount)}</p></div>
                    <div><p className="text-[#1f7a8c]">Date</p><p className="text-[#022b3a]">{formatDate(r.paymentDate)}</p></div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setSelected(r)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-[#e1e5f2] text-[#022b3a] hover:bg-[#bfdbf7] transition-all">
                      <Eye size={12} /> View
                    </button>
                    <button onClick={() => handleDownload(r.id)}
                      className="flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-lg bg-[#e1e5f2] text-[#1f7a8c] hover:bg-[#bfdbf7] transition-all">
                      <Download size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Receipt Preview Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Receipt Preview" size="md">
        {selected && (
          <>
            <ReceiptLayout receipt={selected} />
            <div className="flex flex-wrap gap-3 mt-4">
              <button onClick={() => setSelected(null)} className="btn-secondary flex-1 min-w-[90px]">Close</button>
              <button onClick={handlePrint} className="btn-secondary flex items-center justify-center gap-2 flex-1 min-w-[90px]">
                <Printer size={13} /> Print
              </button>
              <button onClick={() => handleDownload(selected.id)} className="btn-primary flex items-center justify-center gap-2 flex-1 min-w-[90px]">
                <Download size={13} /> PDF
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}