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

/* ── Month label from YYYY-MM ────────────────────────────────────────── */
function monthDisplay(ym) {
  if (!ym) return '—'
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}

/* ── Full receipt layout (print-ready) ──────────────────────────────── */
function ReceiptLayout({ receipt }) {
  if (!receipt) return null
  const late  = receipt.lateFeeAmount ?? 0
  const total = receipt.totalAmount   ?? (receipt.paidAmount + late)

  return (
    <div id="receipt-preview" className="bg-white text-[#022b3a] rounded-xl p-6 sm:p-8 font-sans text-sm">
      {/* Header */}
      <div className="text-center border-b-2 border-[#bfdbf7] pb-5 mb-5">
        <div className="w-12 h-12 bg-[#022b3a] rounded-xl flex items-center justify-center mx-auto mb-3">
          <FileText size={20} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-[#022b3a]">R R Dhurya Owners Welfare Association</h2>
        <p className="text-xs text-[#1f7a8c] mt-1">Apartment Maintenance Receipt</p>
        <p className="text-sm font-mono font-bold text-[#022b3a] mt-1">#{receipt.receiptNumber}</p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6">
        {[
          ['Resident Name',  receipt.residentName],
          ['Flat / Villa',   receipt.flatNumber],
          ['Property Type',  receipt.flatType || '—'],
          ['Phone',          receipt.residentPhone || '—'],
          ['Payment Date',   formatDate(receipt.paymentDate)],
          ['Billing Month',  monthDisplay(receipt.paymentMonth)],
          ['Payment Method', receipt.paymentMethod || '—'],
          ['Transaction ID', receipt.transactionId || '—'],
          ['Generated On',   formatDateTime(receipt.generatedAt)],
          ['Receipt Status', 'Verified & Paid'],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] uppercase tracking-wide text-[#1f7a8c]">{label}</p>
            <p className={`text-xs font-semibold mt-0.5 ${value === 'Verified & Paid' ? 'text-green-600' : 'text-[#022b3a]'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Amount box */}
      <div className="bg-[#f8fafb] rounded-xl p-4 border border-[#bfdbf7] mb-6">
        {[
          ['Maintenance Amount', formatCurrency(receipt.paidAmount), false],
          ...(late > 0 ? [['Late Fee', formatCurrency(late), true]] : []),
        ].map(([label, value, red]) => (
          <div key={label} className="flex justify-between text-xs mb-2">
            <span className="text-[#1f7a8c]">{label}</span>
            <span className={`font-semibold ${red ? 'text-red-600' : ''}`}>{value}</span>
          </div>
        ))}
        <div className="border-t border-[#bfdbf7] pt-2 mt-2 flex justify-between text-sm font-bold">
          <span>Total Paid</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Seal + Signature */}
      <div className="flex justify-between items-end border-t border-[#bfdbf7] pt-4">
        <div>
          <div className="w-20 h-8 border-2 border-dashed border-[#bfdbf7] rounded flex items-center justify-center">
            <span className="text-[9px] text-[#022b3a]/40">APARTMENT SEAL</span>
          </div>
        </div>
        <div className="text-right">
          <div className="w-28 border-b-2 border-[#bfdbf7] ml-auto mb-1" />
          <p className="text-[10px] text-[#1f7a8c]">Authorized Signature / Admin</p>
        </div>
      </div>
      <p className="text-center text-[9px] text-[#022b3a]/40 mt-4">
        Computer-generated receipt. Valid without physical signature. — {receipt.receiptFooter || 'Thank you for your payment.'}
      </p>
    </div>
  )
}

const YEAR_OPTIONS = [2026, 2025, 2024].map(y => ({ value: String(y), label: String(y) }))

export default function Receipts() {
  const [receipts,  setReceipts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [search,    setSearch]    = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [page,      setPage]      = useState(1)
  const PER_PAGE = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await adminAPI.getAllReceipts()
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      setReceipts(data)
    } catch {
      setReceipts([])
      toast.error('Could not load receipts.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handlePrint = () => {
    const content = document.getElementById('receipt-preview')
    if (!content) return
    const win = window.open('', '_blank')
    win.document.write(`<html><head><title>Receipt - ${selected?.receiptNumber}</title>
      <style>body{font-family:sans-serif;padding:20px;color:#022b3a;}
      .text-green-600{color:#16a34a;}.text-red-600{color:#dc2626;}</style>
      </head><body>${content.innerHTML}</body></html>`)
    win.document.close(); win.print()
  }

  const handleDownload = async (id) => {
    try {
      const res  = await adminAPI.downloadReceipt(id)
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url; link.download = `receipt-${id}.pdf`; link.click()
      URL.revokeObjectURL(url)
    } catch {
      toast('Use Print to save as PDF.', { icon: '📄' })
    }
  }

  const filtered = receipts.filter(r => {
    const q = search.toLowerCase()
    const matchSearch =
      (r.residentName  ?? '').toLowerCase().includes(q) ||
      (r.receiptNumber ?? '').toLowerCase().includes(q) ||
      (r.flatNumber    ?? '').toLowerCase().includes(q) ||
      (r.transactionId ?? '').toLowerCase().includes(q) ||
      (r.paymentMonth  ?? '').includes(q)
    const matchYear = !yearFilter || (r.paymentYear ?? '').includes(yearFilter)
      || (r.generatedAt ?? '').includes(yearFilter)
    return matchSearch && matchYear
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="section-title text-xl">Receipts</h1>
          <p className="section-subtitle">View and verify payment receipts for all residents</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm self-start">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Receipts',  value: receipts.length },
          { label: 'This Month',      value: receipts.filter(r => {
              const d = new Date(); const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
              return r.paymentMonth === ym
            }).length },
          { label: 'Total Collected', value: formatCurrency(
              receipts.reduce((s, r) => s + (r.totalAmount ?? r.paidAmount ?? 0), 0)), mono: true },
        ].map(({ label, value, mono }) => (
          <div key={label} className="card text-center py-3">
            <p className={`text-xl font-bold ${mono ? 'font-mono text-base' : ''} text-[#022b3a]`}>{value}</p>
            <p className="text-xs text-[#1f7a8c] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-[#bfdbf7]">
          <h2 className="text-sm font-semibold text-[#022b3a]">
            All Receipts
            <span className="ml-2 text-xs font-normal text-[#1f7a8c]">({filtered.length})</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              value={yearFilter}
              onChange={v => { setYearFilter(v); setPage(1) }}
              options={YEAR_OPTIONS}
              placeholder="All Years"
            />
            <SearchBar
              value={search}
              onChange={v => { setSearch(v); setPage(1) }}
              placeholder="Name, flat, receipt no..."
            />
          </div>
        </div>

        {paginated.length === 0 ? (
          <EmptyState
            title="No receipts found"
            description="Receipts are auto-generated when admin approves a payment."
            icon={FileText}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#bfdbf7] bg-white/50">
                  <tr>
                    {['Receipt No.', 'Resident', 'Flat', 'Billing Month', 'Amount', 'Late Fee', 'Date', 'Method', 'Actions'].map(h => (
                      <th key={h} className="table-header text-xs">{h}</th>
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
                    <span className="flex items-center gap-1 text-[10px] text-green-500 bg-green-950/30 border border-green-900/40 px-2 py-0.5 rounded-full">
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
            <div className="flex gap-3 mt-4">
              <button onClick={() => setSelected(null)} className="btn-secondary flex-1">Close</button>
              <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
                <Printer size={13} /> Print
              </button>
              <button onClick={() => handleDownload(selected.id)} className="btn-primary flex items-center gap-2">
                <Download size={13} /> PDF
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
