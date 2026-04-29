"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Search, Loader2, Eye, Store } from 'lucide-react'

type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'manual_override'
type SortDirection = 'none' | 'asc' | 'desc'
type VendorSortKey =
  | 'vendor_name'
  | 'company_registration'
  | 'contact_email'
  | 'country'
  | 'city'
  | 'verification_source'
  | 'verification_status'
  | 'created_at'

interface Vendor {
  id: string
  user_id?: string | null
  vendor_name: string
  company_registration: string | null
  gst_number: string | null
  vat_id: string | null
  country: string | null
  city: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_person: string | null
  vendor_type: string[] | null
  created_at: string
  verification_status: VerificationStatus | null
  verification_source: string | null
}

const statusLabels: Record<VerificationStatus, string> = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
  manual_override: 'Manual Override',
}

function getStatus(vendor: Vendor): VerificationStatus {
  return vendor.verification_status ?? 'pending'
}

export function VendorVerificationTable() {
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<VendorSortKey | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('none')
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch('/api/admin/vendors', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'Failed to load vendors')
        setVendors((payload.vendors ?? []) as Vendor[])
      } catch (error) {
        console.error('Error fetching vendors:', error)
        setVendors([])
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [])

  const filteredVendors = vendors.filter((vendor) => {
    const status = getStatus(vendor)
    const registeredDate = new Date(vendor.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const searchable = [
      vendor.vendor_name,
      vendor.company_registration,
      vendor.contact_email,
      vendor.country,
      vendor.city,
      vendor.verification_source,
      status,
      registeredDate,
    ].filter(Boolean).join(' ').toLowerCase()

    if (statusFilter !== 'all' && status !== statusFilter) return false
    if (countryFilter !== 'all' && vendor.country !== countryFilter) return false
    if (sourceFilter !== 'all' && vendor.verification_source !== sourceFilter) return false
    if (searchQuery && !searchable.includes(searchQuery.toLowerCase())) return false
    return true
  })

  const countries = [...new Set(vendors.map((vendor) => vendor.country).filter(Boolean))] as string[]
  const sources = [...new Set(vendors.map((vendor) => vendor.verification_source).filter(Boolean))] as string[]

  const getSortValue = (vendor: Vendor, key: VendorSortKey): string => {
    switch (key) {
      case 'verification_status': return getStatus(vendor)
      case 'created_at': return vendor.created_at
      case 'vendor_name':
      case 'company_registration':
      case 'contact_email':
      case 'country':
      case 'city':
      case 'verification_source': return String(vendor[key] ?? '')
      default: return ''
    }
  }

  const sortedVendors = [...filteredVendors].sort((a, b) => {
    if (!sortKey || sortDirection === 'none') return 0
    const av = getSortValue(a, sortKey)
    const bv = getSortValue(b, sortKey)
    if (sortKey === 'created_at') {
      const aTime = new Date(av).getTime()
      const bTime = new Date(bv).getTime()
      return sortDirection === 'asc' ? aTime - bTime : bTime - aTime
    }
    const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' })
    return sortDirection === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.max(1, Math.ceil(sortedVendors.length / rowsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedVendors = sortedVendors.slice((safeCurrentPage - 1) * rowsPerPage, safeCurrentPage * rowsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, countryFilter, sourceFilter, searchQuery, sortKey, sortDirection, rowsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleSortToggle = (key: VendorSortKey) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDirection('asc')
      return
    }
    if (sortDirection === 'asc') {
      setSortDirection('desc')
      return
    }
    setSortKey(null)
    setSortDirection('none')
  }

  const handleViewDetails = (vendor: Vendor) => {
    router.push(`/clients/${vendor.id}`)
  }

  const sortIndicator = (key: VendorSortKey) => {
    const active = sortKey === key
    return (
      <span className="inline-flex flex-col leading-[0.7] text-[9px]">
        <span className={active && sortDirection === 'asc' ? 'text-[#1f3a61] dark:text-[#c5d5e4]' : 'text-[#7999b9] opacity-70'}>▴</span>
        <span className={active && sortDirection === 'desc' ? 'text-[#1f3a61] dark:text-[#c5d5e4]' : 'text-[#7999b9] opacity-70'}>▾</span>
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-75 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7999b9]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-50 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7999b9]" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-sm border border-[#d4dce8] bg-white py-2 pl-10 pr-4 text-sm text-[#1f3a61] placeholder:text-[#7999b9] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#334a76] dark:border-[#334a76] dark:bg-[#1a3050] dark:text-[#c5d5e4]"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 w-40 rounded border border-[#d4dce8] bg-white px-3 text-sm text-[#1f3a61] focus:outline-none focus:ring-2 focus:ring-[#334a76] dark:border-[#334a76] dark:bg-[#1a3050] dark:text-[#c5d5e4]">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="manual_override">Manual Override</option>
        </select>
        <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="h-9 w-40 rounded border border-[#d4dce8] bg-white px-3 text-sm text-[#1f3a61] focus:outline-none focus:ring-2 focus:ring-[#334a76] dark:border-[#334a76] dark:bg-[#1a3050] dark:text-[#c5d5e4]">
          <option value="all">All Countries</option>
          {countries.map((country) => <option key={country} value={country}>{country}</option>)}
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="h-9 w-40 rounded border border-[#d4dce8] bg-white px-3 text-sm text-[#1f3a61] focus:outline-none focus:ring-2 focus:ring-[#334a76] dark:border-[#334a76] dark:bg-[#1a3050] dark:text-[#c5d5e4]">
          <option value="all">All Sources</option>
          {sources.map((source) => <option key={source} value={source}>{source}</option>)}
        </select>
      </div>

      <div className="dashboard-card overflow-hidden rounded-lg border border-[#d4dce8] bg-card dark:border-[#334a76]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#d4dce8] bg-[#f4f7fb] dark:border-[#334a76] dark:bg-[#1a3050]">
                <th className="w-16 px-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]">S/N</th>
                <th className="px-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('vendor_name')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>Vendor Name</span>{sortIndicator('vendor_name')}</button></th>
                <th className="px-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('company_registration')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>Company Reg.</span>{sortIndicator('company_registration')}</button></th>
                <th className="pl-4 pr-0 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('contact_email')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>Email</span>{sortIndicator('contact_email')}</button></th>
                <th className="pl-0 pr-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('country')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>Country</span>{sortIndicator('country')}</button></th>
                <th className="px-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('city')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>City</span>{sortIndicator('city')}</button></th>
                <th className="px-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('verification_source')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>Source</span>{sortIndicator('verification_source')}</button></th>
                <th className="px-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('verification_status')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>Status</span>{sortIndicator('verification_status')}</button></th>
                <th className="px-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('created_at')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>Registered</span>{sortIndicator('created_at')}</button></th>
                <th className="px-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVendors.length === 0 ? (
                <tr><td colSpan={10} className="py-8 text-center text-[#7999b9]">No vendors found matching your filters.</td></tr>
              ) : (
                paginatedVendors.map((vendor, index) => {
                  const status = getStatus(vendor)
                  return (
                    <tr key={vendor.id} className="border-b border-[#e8eef5] transition-colors hover:bg-[#f4f7fb] dark:border-[#2a3f5c] dark:hover:bg-[#1a3050]">
                      <td className="px-4 py-3 font-medium text-[#7999b9]">{(safeCurrentPage - 1) * rowsPerPage + index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eaf0f7] text-[#496c83] dark:bg-[#223a5b] dark:text-[#c5d5e4]"><Store className="h-4 w-4" /></div>
                          <div>
                            <div className="font-medium text-[#1f3a61] dark:text-[#c5d5e4]">{vendor.vendor_name}</div>
                            <div className="font-mono text-[10.5px] text-[#7999b9]">{vendor.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#496c83] dark:text-[#8aaec9]">{vendor.company_registration ?? '—'}</td>
                      <td className="py-3 pl-4 pr-0 text-xs text-[#496c83] dark:text-[#8aaec9]">{vendor.contact_email ?? '—'}</td>
                      <td className="py-3 pl-0 pr-4 text-[#496c83] dark:text-[#8aaec9]">{vendor.country ?? '—'}</td>
                      <td className="px-4 py-3 text-[#496c83] dark:text-[#8aaec9]">{vendor.city ?? '—'}</td>
                      <td className="px-4 py-3">
                        {vendor.verification_source ? (
                          <span className="rounded border border-[#d4dce8] px-2 py-1 text-xs capitalize text-[#496c83] dark:border-[#334a76] dark:text-[#8aaec9]">{vendor.verification_source}</span>
                        ) : (
                          <span className="text-xs text-[#7999b9]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          status === 'pending'
                            ? 'border-amber-300 bg-amber-100 text-amber-700'
                            : status === 'verified'
                            ? 'border-green-300 bg-green-100 text-green-700'
                            : status === 'rejected'
                            ? 'border-red-300 bg-red-100 text-red-700'
                            : 'border-blue-300 bg-blue-100 text-blue-700'
                        }`}>
                          {statusLabels[status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#7999b9]">{new Date(vendor.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(vendor)} className="text-[#496c83] hover:bg-[#f4f7fb] hover:text-[#1f3a61] dark:hover:bg-[#2a3f5c] dark:hover:text-[#c5d5e4]">
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-[#7999b9]">Showing {sortedVendors.length === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1} {' '}-{' '} {Math.min(safeCurrentPage * rowsPerPage, sortedVendors.length)} of {sortedVendors.length}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7999b9]">Rows per page</span>
          <select value={String(rowsPerPage)} onChange={(e) => setRowsPerPage(Number(e.target.value))} className="h-8 w-24 rounded border border-[#d4dce8] bg-white px-2 text-sm text-[#1f3a61] focus:outline-none focus:ring-2 focus:ring-[#334a76] dark:border-[#334a76] dark:bg-[#1a3050] dark:text-[#c5d5e4]">
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage <= 1}>Previous</Button>
          <span className="min-w-16 text-center text-xs text-[#7999b9]">Page {safeCurrentPage} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage >= totalPages}>Next</Button>
        </div>
      </div>
    </div>
  )
}

export default VendorVerificationTable