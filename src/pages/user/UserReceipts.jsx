import { useState, useEffect, useCallback } from 'react'
import { Download, Eye, Printer, FileText, Search, RefreshCw, CheckCircle } from 'lucide-react'
import { userAPI } from '../../api/userAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import Pagination from '../../components/common/Pagination'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate, formatDateTime } from '../../utils/dateUtils'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

/* ── Month label from YYYY-MM ─────────────────────────────────────────── */
function monthDisplay(ym) {
  if (!ym) return '—'
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}

/* ── Professional Receipt Print Layout ───────────────────────────────── */
function ReceiptLayout({ receipt, user }) {
  if (!receipt) return null
  const late  = receipt.lateFeeAmount ?? 0
  const total = receipt.totalAmount   ?? (receipt.paidAmount + late)

  return (
    <div className="bg-white text-[#022b3a] rounded-xl p-6 sm:p-8 font-sans" id="receipt-print">
      {/* Header */}
      <div className="text-center border-b-2 border-[#bfdbf7] pb-5 mb-5">
        <div className="w-12 h-12 bg-[#022b3a] rounded-xl flex items-center justify-center mx-auto mb-3">
          <FileText size={20} className="text-white" />
        </div>
        <h1 className="text-lg font-bold text-[#022b3a]">R R Dhurya Owners Welfare Association</h1>
        <p className="text-xs text-[#1f7a8c] mt-1">Maintenance Payment Receipt</p>
        <p className="text-sm font-mono font-semibold text-[#022b3a] mt-1">
          #{receipt.receiptNumber}
        </p>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-6">
        {[
          ['Resident Name',   receipt.residentName || user?.name || '—'],
          ['Flat / Villa',    receipt.flatNumber   || user?.flatNumber || '—'],
          ['Property Type',   receipt.flatType || '—'],
          ['Phone Number',    receipt.residentPhone || user?.phone || '—'],
          ['Payment Date',    formatDate(receipt.paymentDate)],
          ['Billing Month',   monthDisplay(receipt.paymentMonth)],
          ['Payment Method',  receipt.paymentMethod || '—'],
          ['Transaction ID',  receipt.transactionId || '—'],
          ['Generated On',    formatDateTime(receipt.generatedAt)],
          ['Status',          'PAID & VERIFIED'],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] uppercase tracking-wide text-[#1f7a8c] font-medium">{label}</p>
            <p className={`text-sm font-semibold mt-0.5 ${value === 'PAID & VERIFIED' ? 'text-green-600' : 'text-[#022b3a]'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Amount Box */}
      <div className="border border-[#bfdbf7] rounded-xl p-4 mb-6 bg-[#f8fafb]">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#1f7a8c]">Maintenance Amount</span>
            <span className="font-semibold">{formatCurrency(receipt.paidAmount)}</span>
          </div>
          {late > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#1f7a8c]">Late Fee</span>
              <span className="font-semibold text-red-600">{formatCurrency(late)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold border-t border-[#bfdbf7] pt-3 mt-2">
            <span>Total Paid</span>
            <span className="text-[#022b3a]">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end text-xs text-[#1f7a8c] border-t border-[#bfdbf7] pt-4">
        <div>
          <div className="w-20 h-7 border-2 border-dashed border-[#bfdbf7] rounded flex items-center justify-center mb-1">
            <span className="text-[9px] text-[#022b3a]/40">SEAL</span>
          </div>
          <p className="text-[10px] text-[#022b3a]/40">Apartment Seal</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-[#022b3a]">Thank you for your payment.</p>
          <p className="mt-0.5">This is a computer-generated receipt.</p>
          <div className="w-28 border-b-2 border-[#bfdbf7] ml-auto mt-4 mb-1" />
          <p className="text-[10px]">Authorized Signature / Admin</p>
        </div>
      </div>
    </div>
  )
}

export default function UserReceipts() {
  const [receipts,  setReceipts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [viewItem,  setViewItem]  = useState(null)
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const { user }                  = useAuth()
  const PER_PAGE = 8

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await userAPI.getReceipts()
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      // Only show verified/paid receipts (backend already filters, but double-check)
      setReceipts(data.filter(r => r.receiptNumber))
    } catch {
      setReceipts([])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handlePrint = () => {
    const content = document.getElementById('receipt-print')
    if (!content) return
    const win = window.open('', '_blank')
    win.document.write(`<html><head><title>Receipt - ${viewItem?.receiptNumber}</title>
      <style>body{font-family:sans-serif;padding:20px;color:#022b3a;}
      .text-green-600{color:#16a34a;}.text-red-600{color:#dc2626;}</style>
      </head><body>${content.innerHTML}</body></html>`)
    win.document.close(); win.print()
  }

  const handleDownload = async (id) => {
    try {
      const res  = await userAPI.downloadReceipt(id)
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url; link.download = `receipt-${id}.pdf`; link.click()
      URL.revokeObjectURL(url)
    } catch {
      toast('Use the Print option to save as PDF.', { icon: '📄' })
    }
  }

  const filtered = receipts.filter(r => {
    const q = search.toLowerCase()
    return (r.receiptNumber ?? '').toLowerCase().includes(q)
        || (r.residentName  ?? '').toLowerCase().includes(q)
        || (r.paymentMonth  ?? '').toLowerCase().includes(q)
        || (r.transactionId ?? '').toLowerCase().includes(q)
  })
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="section-title text-xl">My Receipts</h1>
          <p className="section-subtitle">Receipts for all admin-verified payments</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm self-start">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Search */}
      {receipts.length > 0 && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1f7a8c]" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search receipt number, month, transaction..."
            className="input-field pl-8"
          />
        </div>
      )}

      {receipts.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No receipts yet"
            description="Receipts are generated after admin verifies your payment. Pay your maintenance and ask admin to verify."
            icon={FileText}
          />
        </div>
      ) : paginated.length === 0 ? (
        <div className="card">
          <EmptyState title="No receipts match your search" icon={Search} />
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="card p-0 overflow-hidden hidden md:block">
            <div className="px-4 py-3 border-b border-[#bfdbf7] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#022b3a]">
                Payment Receipts
                <span className="ml-2 text-xs font-normal text-[#1f7a8c]">({filtered.length})</span>
              </h2>
              <span className="flex items-center gap-1 text-xs text-green-500">
                <CheckCircle size={11} /> Verified payments only
              </span>
            </div>
            <table className="w-full">
              <thead className="border-b border-[#bfdbf7] bg-white/50">
                <tr>
                  {['Receipt No.', 'Billing Month', 'Payment Date', 'Amount', 'Method', 'Transaction ID', 'Actions'].map(h => (
                    <th key={h} className="table-header text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(r => (
                  <tr key={r.id} className="table-row">
                    <td className="table-cell font-mono text-xs text-[#022b3a]">{r.receiptNumber}</td>
                    <td className="table-cell text-sm font-medium text-[#022b3a]">
                      {monthDisplay(r.paymentMonth)}
                    </td>
                    <td className="table-cell text-xs">{formatDate(r.paymentDate)}</td>
                    <td className="table-cell font-mono text-[#022b3a]">
                      {formatCurrency(r.totalAmount ?? r.paidAmount)}
                      {r.lateFeeAmount > 0 && (
                        <p className="text-[10px] text-red-400">+{formatCurrency(r.lateFeeAmount)} late</p>
                      )}
                    </td>
                    <td className="table-cell text-xs">{r.paymentMethod || '—'}</td>
                    <td className="table-cell font-mono text-[10px] text-[#1f7a8c] max-w-[100px] truncate">
                      {r.transactionId || '—'}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewItem(r)}
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
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginated.map(r => (
              <div key={r.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs font-semibold text-[#022b3a]">{r.receiptNumber}</p>
                    <p className="text-sm font-semibold text-[#022b3a] mt-1">{monthDisplay(r.paymentMonth)}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-950/30 border border-green-900/50 text-green-400">
                    Paid
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[#1f7a8c]">Amount</p>
                    <p className="font-mono font-semibold text-[#022b3a]">
                      {formatCurrency(r.totalAmount ?? r.paidAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#1f7a8c]">Date</p>
                    <p className="text-[#022b3a]">{formatDate(r.paymentDate)}</p>
                  </div>
                  <div>
                    <p className="text-[#1f7a8c]">Method</p>
                    <p className="text-[#022b3a]">{r.paymentMethod || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[#1f7a8c]">TXN ID</p>
                    <p className="font-mono text-[#022b3a] truncate">{r.transactionId || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setViewItem(r)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-[#e1e5f2] text-[#022b3a] hover:bg-[#bfdbf7] transition-all">
                    <Eye size={12} /> View Receipt
                  </button>
                  <button onClick={() => handleDownload(r.id)}
                    className="flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-lg bg-[#e1e5f2] text-[#1f7a8c] hover:bg-[#bfdbf7] transition-all">
                    <Download size={12} />
                  </button>
                </div>
              </div>
            ))}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* Receipt Preview Modal */}
      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Receipt Preview" size="lg">
        {viewItem && (
          <>
            <ReceiptLayout receipt={viewItem} user={user} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => handleDownload(viewItem.id)}
                className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <Download size={13} /> Download PDF
              </button>
              <button onClick={handlePrint}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Printer size={13} /> Print Receipt
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
