"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { StatusBadge, TypeBadge } from '@/components/ui/status-badge'
import { loadHospitals, type AdminEntity } from '@/lib/admin-data'
import { fmtDateShort } from '@/lib/format'
import { Building2, Eye, Loader2, Search } from 'lucide-react'

type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'manual_override'
type SortDirection = 'none' | 'asc' | 'desc'
type HospitalSortKey =
  | 'name'
  | 'registrationNumber'
  | 'contactEmail'
  | 'country'
  | 'city'
  | 'verificationSource'
  | 'verificationStatus'
  | 'createdAt'

function entityStatus(entity: AdminEntity): VerificationStatus {
  const status = entity.verificationStatus ?? (entity.isVerified ? 'verified' : 'pending')
  return status === 'pending' || status === 'verified' || status === 'rejected' || status === 'manual_override'
    ? status
    : 'pending'
}

function getSearchText(entity: AdminEntity) {
  return [
    entity.name,
    entity.id,
    entity.registrationNumber ?? '',
    entity.contactEmail ?? '',
    entity.contactPerson ?? '',
    entity.city ?? '',
    entity.country ?? '',
    entity.verificationSource ?? '',
    entity.tags.join(' '),
    entity.createdAt ? fmtDateShort(entity.createdAt) : '',
  ].join(' ').toLowerCase()
}

export default function BuyersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [entities, setEntities] = useState<AdminEntity[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<HospitalSortKey | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('none')
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let alive = true

    loadHospitals()
      .then(({ hospitals }) => {
        if (alive) setEntities(hospitals)
      })
      .catch(() => {
        if (alive) setEntities([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const filteredEntities = entities.filter((entity) => {
    if (statusFilter !== 'all' && entityStatus(entity) !== statusFilter) return false
    if (countryFilter !== 'all' && (entity.country ?? '') !== countryFilter) return false
    if (sourceFilter !== 'all' && (entity.verificationSource ?? '') !== sourceFilter) return false
    if (search && !getSearchText(entity).includes(search.toLowerCase())) return false
    return true
  })

  const countries = [...new Set(entities.map((entity) => entity.country).filter(Boolean))] as string[]
  const sources = [...new Set(entities.map((entity) => entity.verificationSource).filter(Boolean))] as string[]

  const getSortValue = (entity: AdminEntity, key: HospitalSortKey): string => {
    switch (key) {
      case 'verificationStatus':
        return entityStatus(entity)
      case 'createdAt':
        return entity.createdAt
      case 'name':
      case 'registrationNumber':
      case 'contactEmail':
      case 'country':
      case 'city':
      case 'verificationSource':
        return String(entity[key] ?? '')
      default:
        return ''
    }
  }

  const sortedEntities = [...filteredEntities].sort((a, b) => {
    if (!sortKey || sortDirection === 'none') return 0

    const av = getSortValue(a, sortKey)
    const bv = getSortValue(b, sortKey)

    if (sortKey === 'createdAt') {
      const aTime = new Date(av).getTime()
      const bTime = new Date(bv).getTime()
      return sortDirection === 'asc' ? aTime - bTime : bTime - aTime
    }

    const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' })
    return sortDirection === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.max(1, Math.ceil(sortedEntities.length / rowsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedEntities = sortedEntities.slice((safeCurrentPage - 1) * rowsPerPage, safeCurrentPage * rowsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, countryFilter, sourceFilter, search, sortKey, sortDirection, rowsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleSortToggle = (key: HospitalSortKey) => {
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

  const handleViewDetails = (entity: AdminEntity) => {
    router.push(`/clients/${entity.id}`)
  }

  const renderSortIndicator = (key: HospitalSortKey) => {
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
            placeholder="Search hospitals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                <th className="px-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('name')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>Hospital Name</span>{renderSortIndicator('name')}</button></th>
                <th className="px-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('registrationNumber')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>Registration No.</span>{renderSortIndicator('registrationNumber')}</button></th>
                <th className="pl-4 pr-0 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('contactEmail')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>Email</span>{renderSortIndicator('contactEmail')}</button></th>
                <th className="pl-0 pr-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('country')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>Country</span>{renderSortIndicator('country')}</button></th>
                <th className="px-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('city')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>City</span>{renderSortIndicator('city')}</button></th>
                <th className="px-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('verificationSource')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>Source</span>{renderSortIndicator('verificationSource')}</button></th>
                <th className="px-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('verificationStatus')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>Status</span>{renderSortIndicator('verificationStatus')}</button></th>
                <th className="px-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]"><button type="button" onClick={() => handleSortToggle('createdAt')} className="inline-flex items-center gap-1 hover:text-[#496c83] dark:hover:text-[#d9e4ef]"><span>Registered</span>{renderSortIndicator('createdAt')}</button></th>
                <th className="px-4 py-3 text-left font-semibold text-[#1f3a61] dark:text-[#c5d5e4]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntities.length === 0 ? (
                <tr><td colSpan={10} className="py-8 text-center text-[#7999b9]">No hospitals found matching your filters.</td></tr>
              ) : (
                paginatedEntities.map((entity, index) => {
                  const status = entityStatus(entity)
                  return (
                    <tr key={entity.id} className="border-b border-[#e8eef5] transition-colors hover:bg-[#f4f7fb] dark:border-[#2a3f5c] dark:hover:bg-[#1a3050]">
                      <td className="px-4 py-3 font-medium text-[#7999b9]">{(safeCurrentPage - 1) * rowsPerPage + index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={entity.name} size="sm" variant="hospital" />
                          <div>
                            <Link href={`/clients/${entity.id}`} className="font-medium text-[#1f3a61] transition-colors hover:text-primary dark:text-[#c5d5e4]">{entity.name}</Link>
                            <div className="font-mono text-[10.5px] text-[#7999b9]">{entity.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#496c83] dark:text-[#8aaec9]">{entity.registrationNumber ?? '—'}</td>
                      <td className="py-3 pl-4 pr-0 text-xs text-[#496c83] dark:text-[#8aaec9]">{entity.contactEmail ?? '—'}</td>
                      <td className="py-3 pl-0 pr-4 text-[#496c83] dark:text-[#8aaec9]">{entity.country ?? '—'}</td>
                      <td className="px-4 py-3 text-[#496c83] dark:text-[#8aaec9]">{entity.city ?? '—'}</td>
                      <td className="px-4 py-3">
                        {entity.verificationSource ? (
                          <span className="rounded border border-[#d4dce8] px-2 py-1 text-xs capitalize text-[#496c83] dark:border-[#334a76] dark:text-[#8aaec9]">{entity.verificationSource}</span>
                        ) : (
                          <span className="text-xs text-[#7999b9]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-[#7999b9]">{fmtDateShort(entity.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(entity)} className="text-[#496c83] hover:bg-[#f4f7fb] hover:text-[#1f3a61] dark:hover:bg-[#2a3f5c] dark:hover:text-[#c5d5e4]">
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
        <div className="text-xs text-[#7999b9]">Showing {sortedEntities.length === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1} {' '}-{' '} {Math.min(safeCurrentPage * rowsPerPage, sortedEntities.length)} of {sortedEntities.length}</div>
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