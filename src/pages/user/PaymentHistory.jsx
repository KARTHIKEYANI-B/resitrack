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
    p.paymentMonth?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPaid  = payments.reduce((s, p) => s + p.amount, 0)

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-xl">Payment History</h1>
        <p className="section-subtitle">Complete history of all your maintenance payments</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Amount Paid',     value: formatCurrency(totalPaid) },
          { label: 'Total Payment Records', value: payments.length },
          { label: 'Payments This Year',      value: payments.filter(p => p.paymentDate?.startsWith(new Date().getFullYear())).length },
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
          <h2 className="text-sm font-semibold text-[#022b3a]">All Payment Transactions</h2>
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
          <EmptyState
            title="No payment records found"
            description="Your payment history will appear here after your first payment"
          />
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full min-w-[760px] rt-table-animate">
                <thead className="border-b border-[#bfdbf7] bg-white/50">
                  <tr>
                    {/*
                      REQUIREMENT: 'Month' column removed from All Transactions table.
                      Remaining columns: Payment Date, Amount, Late Fee, Method, Transaction ID, Status
                    */}
                    {['Payment Date', 'Amount Paid', 'Late Fee', 'Payment Method', 'Transaction / Reference ID', 'Payment Status'].map(h => (
                      <th key={h} className="table-header whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p) => (
                    <tr key={p.id} className="table-row">
                      {/* Month column removed */}
                      <td className="table-cell whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                      <td className="table-cell font-mono text-[#022b3a] whitespace-nowrap">{formatCurrency(p.amount)}</td>
                      <td className="table-cell font-mono text-xs whitespace-nowrap">
                        {p.lateFee > 0
                          ? <span className="text-red-400">{formatCurrency(p.lateFee)}</span>
                          : <span className="text-[#022b3a]">—</span>}
                      </td>
                      <td className="table-cell whitespace-nowrap">{p.paymentMethod}</td>
                      <td className="table-cell font-mono text-xs text-[#1f7a8c]">{p.transactionId}</td>
                      <td className="table-cell"><Badge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked cards */}
            <div className="md:hidden divide-y divide-[#bfdbf7]">
              {paginated.map((p) => (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#022b3a]">{formatDate(p.paymentDate)}</p>
                      <p className="font-mono text-[10px] text-[#1f7a8c] break-all mt-0.5">{p.transactionId}</p>
                    </div>
                    <Badge status={p.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[#1f7a8c]">Amount</p>
                      <p className="font-mono font-semibold text-[#022b3a]">{formatCurrency(p.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[#1f7a8c]">Late Fee</p>
                      <p className="font-mono">
                        {p.lateFee > 0
                          ? <span className="text-red-400">{formatCurrency(p.lateFee)}</span>
                          : <span className="text-[#022b3a]">—</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#1f7a8c]">Method</p>
                      <p className="text-[#022b3a]">{p.paymentMethod}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}