import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type OnboardingDataViewProps = {
  data: Record<string, unknown>
}

const DATE_KEY_HINTS = ['_at', 'date', 'created', 'updated']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDateLike(value: string) {
  if (!value) return false
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return false
  return /\d{4}-\d{2}-\d{2}/.test(value)
}

function formatLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function renderPrimitive(value: string | number | boolean) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function formatCellValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value.length === 0 ? '-' : value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ')
  }
  if (isRecord(value)) return JSON.stringify(value)
  return String(value)
}

function PrimitiveTable({ value }: { value: Record<string, unknown> }) {
  const rows = Object.entries(value)
  return (
    <div className="overflow-x-auto rounded-sm border border-[#d4dce8] dark:border-[#334a76]">
      <table className="min-w-full text-xs">
        <tbody>
          {rows.map(([field, fieldValue]) => (
            <tr key={field} className="border-t border-[#d4dce8] first:border-t-0 dark:border-[#334a76]">
              <td className="w-40 bg-[#f4f7fb] px-2 py-1.5 font-medium text-[#5f7c99] dark:bg-[#1a3050] dark:text-[#9fb3c8]">{formatLabel(field)}</td>
              <td className="px-2 py-1.5 text-[#1f3a61] dark:text-[#c5d5e4]">{formatCellValue(fieldValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RecordsTable({ rows }: { rows: Record<string, unknown>[] }) {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  return (
    <div className="overflow-x-auto rounded-sm border border-[#d4dce8] dark:border-[#334a76]">
      <table className="min-w-full text-xs">
        <thead className="bg-[#f4f7fb] dark:bg-[#1a3050]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-2 py-1.5 text-left font-medium text-[#5f7c99] dark:text-[#9fb3c8]">{formatLabel(column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-[#d4dce8] dark:border-[#334a76]">
              {columns.map((column) => (
                <td key={column} className="px-2 py-1.5 text-[#1f3a61] dark:text-[#c5d5e4]">{formatCellValue(row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-[#7999b9]">-</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-[#7999b9]">-</span>
    }

    const allPrimitive = value.every((item) => ['string', 'number', 'boolean'].includes(typeof item))

    if (allPrimitive) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <Badge key={`${String(item)}-${index}`} variant="outline" className="text-xs">
              {renderPrimitive(item as string | number | boolean)}
            </Badge>
          ))}
        </div>
      )
    }

    const allRecords = value.every((item) => isRecord(item))
    if (allRecords) {
      return <RecordsTable rows={value as Record<string, unknown>[]} />
    }

    return (
      <pre className="whitespace-pre-wrap break-all rounded-sm border border-[#d4dce8] bg-[#f4f7fb] p-2 text-xs dark:border-[#334a76] dark:bg-[#1a3050]">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  if (isRecord(value)) {
    const entries = Object.values(value)
    const hasNestedCollections = entries.some((item) => Array.isArray(item) || isRecord(item))

    if (!hasNestedCollections) {
      return <PrimitiveTable value={value} />
    }

    return (
      <div className="space-y-2">
        {Object.entries(value).map(([nestedKey, nestedValue]) => (
          <div key={nestedKey} className="rounded-sm border border-[#d4dce8] bg-[#f8fbff] p-2 dark:border-[#334a76] dark:bg-[#1a3050]">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#5f7c99] dark:text-[#9fb3c8]">
              {formatLabel(nestedKey)}
            </div>
            <div className="text-sm text-[#1f3a61] break-words dark:text-[#c5d5e4]">{renderValue(nestedKey, nestedValue)}</div>
          </div>
        ))}
      </div>
    )
  }

  if (typeof value === 'string') {
    const shouldFormatDate = DATE_KEY_HINTS.some((hint) => key.toLowerCase().includes(hint))
    if (shouldFormatDate && isDateLike(value)) {
      return new Date(value).toLocaleString()
    }

    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return renderPrimitive(value)
  }

  return String(value)
}

export function OnboardingDataView({ data }: OnboardingDataViewProps) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b))

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="text-[#1f3a61] dark:text-[#c5d5e4]">Onboarding Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="space-y-1 rounded-sm border border-[#d4dce8] bg-white p-3 dark:border-[#334a76] dark:bg-[#132845]">
              <div className="text-xs font-medium uppercase tracking-wide text-[#7999b9]">{formatLabel(key)}</div>
              <div className="text-sm text-[#1f3a61] break-words dark:text-[#c5d5e4]">{renderValue(key, value)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
