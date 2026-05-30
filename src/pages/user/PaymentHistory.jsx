import { useState, useEffect } from 'react'
import { userAPI } from '../../api/userAPI'
import { PageLoader } from '../../components/common/LoadingSpinner'
import SearchBar, { FilterSelect } from '../../components/common/SearchBar'
import Pagination from '../../components/common/Pagination'
import EmptyState from '../../components/common/EmptyState'
import Badge from '../../components/common/Badge'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate, MONTHS, YEARS } from '../../utils/dateUtils'

export default function PaymentHistory() {
  const [payments, setPayments]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [monthFilter, setMonth]   = useState('')
  const [yearFilter, setYear]     = useState('')
  const [page, setPage]           = useState(1)
  const PER_PAGE = 10

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await userAPI.getPaymentHistory({ month: monthFilter, year: yearFilter })
        setPayments(res.data)
      } catch {
        setPayments([])
      } finally { setLoading(false) }
    }
    fetch()
  }, [monthFilter, yearFilter])

  const filtered = payments.filter(p =>
    p.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
    p.month?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPaid  = payments.reduce((s, p) => s + p.amount, 0)

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-xl">Payment History</h1>
        <p className="section-subtitle">All your maintenance payment records</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Paid',      value: formatCurrency(totalPaid) },
          { label: 'Total Payments',  value: payments.length },
          { label: 'This Year',       value: payments.filter(p => p.paymentDate?.startsWith(new Date().getFullYear())).length },
        ].map(({ label, value }) => (
          <div key={label} className="card card-hover text-center py-4">
            <p className="text-lg font-bold text-[#022b3a] font-mono">{value}</p>
            <p className="text-xs text-[#1f7a8c] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-[#bfdbf7]">
          <h2 className="text-sm font-semibold text-[#022b3a]">All Transactions</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <FilterSelect value={monthFilter} onChange={setMonth}
              options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
              placeholder="All Months" />
            <FilterSelect value={yearFilter} onChange={setYear}
              options={YEARS.map(y => ({ value: y, label: String(y) }))}
              placeholder="All Years" />
            <SearchBar value={search} onChange={setSearch} placeholder="Search TXN ID..." />
          </div>
        </div>

        {paginated.length === 0 ? (
          <EmptyState title="No payment records found" description="Your payment history will appear here after your first payment" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#bfdbf7] bg-white/50">
                  <tr>
                    {['Month', 'Payment Date', 'Amount', 'Late Fee', 'Method', 'Transaction ID', 'Status'].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p) => (
                    <tr key={p.id} className="table-row">
                      <td className="table-cell font-medium text-[#022b3a]">{p.month}</td>
                      <td className="table-cell">{formatDate(p.paymentDate)}</td>
                      <td className="table-cell font-mono text-[#022b3a]">{formatCurrency(p.amount)}</td>
                      <td className="table-cell font-mono text-xs">
                        {p.lateFee > 0 ? <span className="text-red-400">{formatCurrency(p.lateFee)}</span> : <span className="text-[#022b3a]">—</span>}
                      </td>
                      <td className="table-cell">{p.paymentMethod}</td>
                      <td className="table-cell font-mono text-xs text-[#1f7a8c]">{p.transactionId}</td>
                      <td className="table-cell"><Badge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}