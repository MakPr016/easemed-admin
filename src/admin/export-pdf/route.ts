import { NextResponse } from 'next/server'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createRequire } from 'module'

export const runtime = 'nodejs'

type EntityType = 'vendor' | 'hospital'

type ExportRequestBody = {
    entityType?: unknown
    entityId?: unknown
    title?: unknown
    status?: unknown
    source?: unknown
    primaryData?: unknown
    history?: unknown
    related?: unknown
}

type ExportPayload = {
    title: string
    status: string
    source: string
    entityType: EntityType
    entityId: string
    primaryData: Record<string, unknown>
    history: unknown[]
    related: Record<string, unknown>
}

function getServiceClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase service credentials')
    }

    return createServiceClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const asText = (value: unknown): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return value.length === 0 ? '[]' : JSON.stringify(value)
    if (isObject(value)) return JSON.stringify(value)
    return String(value)
}

const safeHeading = (value: unknown, fallback: string) => {
    const text = typeof value === 'string' ? value.trim() : ''
    return text || fallback
}

const toEntityType = (value: unknown): EntityType =>
    value === 'hospital' ? 'hospital' : 'vendor'

function writeWrappedLine(doc: any, text: string, indent = 0) {
    const pageBottom = doc.page.height - doc.page.margins.bottom
    if (doc.y > pageBottom - 30) {
        doc.addPage()
    }

    doc.text(text, doc.page.margins.left + indent, doc.y, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right - indent,
    })
}

function writeSectionTitle(doc: any, title: string) {
    const pageBottom = doc.page.height - doc.page.margins.bottom
    if (doc.y > pageBottom - 60) {
        doc.addPage()
    }

    doc.moveDown(0.4)
    doc.font('Helvetica-Bold').fontSize(13)
    writeWrappedLine(doc, title)
    doc.moveDown(0.2)
    doc.font('Helvetica').fontSize(10)
}

function writeKeyValue(doc: any, key: string, value: unknown, indent = 0) {
    writeWrappedLine(doc, `${key}: ${asText(value)}`, indent)
}

function writeObject(doc: any, value: Record<string, unknown>, indent = 0) {
    const entries = Object.entries(value)
    if (entries.length === 0) {
        writeWrappedLine(doc, '- (empty object)', indent)
        return
    }

    for (const [key, entryValue] of entries) {
        if (Array.isArray(entryValue)) {
            writeWrappedLine(doc, `${key}:`, indent)
            writeArray(doc, entryValue, indent + 12)
            continue
        }

        if (isObject(entryValue)) {
            writeWrappedLine(doc, `${key}:`, indent)
            writeObject(doc, entryValue, indent + 12)
            continue
        }

        writeKeyValue(doc, key, entryValue, indent)
    }
}

function writeArray(doc: any, items: unknown[], indent = 0) {
    if (items.length === 0) {
        writeWrappedLine(doc, '- (empty list)', indent)
        return
    }

    for (let index = 0; index < items.length; index += 1) {
        const item = items[index]
        if (Array.isArray(item)) {
            writeWrappedLine(doc, `- Item ${index + 1}:`, indent)
            writeArray(doc, item, indent + 12)
            continue
        }

        if (isObject(item)) {
            writeWrappedLine(doc, `- Item ${index + 1}:`, indent)
            writeObject(doc, item, indent + 12)
            continue
        }

        writeWrappedLine(doc, `- ${asText(item)}`, indent)
    }
}

async function generatePdfBuffer(body: ExportRequestBody): Promise<Buffer> {
    try {
        return await generatePdfBufferWithPdfKit(body)
    } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (!message.toLowerCase().includes('enoent')) {
            throw error
        }

        return generatePdfBufferWithPdfLib(body)
    }
}

async function generatePdfBufferWithPdfKit(body: ExportRequestBody): Promise<Buffer> {
    const require = createRequire(import.meta.url)

    let PDFDocument: any
    try {
        // Prefer standalone build because it bundles standard font assets.
        const standaloneModule = require('pdfkit/js/pdfkit.standalone.js')
        PDFDocument = (standaloneModule as { default?: unknown }).default ?? standaloneModule
    } catch {
        const pdfkitModule = require('pdfkit')
        PDFDocument = (pdfkitModule as { default?: unknown }).default ?? pdfkitModule
    }

    if (typeof PDFDocument !== 'function') {
        throw new Error('pdfkit failed to load in this runtime')
    }
    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    const chunks: Buffer[] = []

    return await new Promise<Buffer>((resolve, reject) => {
        doc.on('data', (chunk: Buffer) => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)

        const entityType = toEntityType(body.entityType)
        const title = safeHeading(body.title, `${entityType === 'vendor' ? 'Vendor' : 'Healthcare Facility'} Report`)
        const status = safeHeading(body.status, 'pending')
        const source = safeHeading(body.source, 'unknown')
        const entityId = safeHeading(body.entityId, '-')
        const primaryData = isObject(body.primaryData) ? body.primaryData : {}
        const related = isObject(body.related) ? body.related : {}
        const history = Array.isArray(body.history) ? body.history : []

        doc.font('Helvetica-Bold').fontSize(18)
        writeWrappedLine(doc, title)

        doc.moveDown(0.4)
        doc.font('Helvetica').fontSize(10)
        writeWrappedLine(doc, `Generated At: ${new Date().toISOString()}`)
        writeWrappedLine(doc, `Entity Type: ${entityType}`)
        writeWrappedLine(doc, `Entity ID: ${entityId}`)
        writeWrappedLine(doc, `Current Approval Status: ${status}`)
        writeWrappedLine(doc, `Verification Source: ${source}`)

        writeSectionTitle(doc, 'Current Record (All Fields)')
        writeObject(doc, primaryData)

        writeSectionTitle(doc, 'Verification / Approval History')
        if (history.length === 0) {
            writeWrappedLine(doc, 'No history records available.')
        } else {
            writeArray(doc, history)
        }

        writeSectionTitle(doc, 'Related Data')
        if (Object.keys(related).length === 0) {
            writeWrappedLine(doc, 'No related datasets provided.')
        } else {
            writeObject(doc, related)
        }

        doc.end()
    })
}

async function generatePdfBufferWithPdfLib(body: ExportRequestBody): Promise<Buffer> {
    const { PDFDocument, StandardFonts } = await import('pdf-lib')

    const pdfDoc = await PDFDocument.create()
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const pageSize: [number, number] = [595.28, 841.89]
    const margin = 40
    const lineHeight = 14
    const normalSize = 10
    const headingSize = 13
    const titleSize = 18
    const maxWidth = pageSize[0] - margin * 2

    let page = pdfDoc.addPage(pageSize)
    let y = pageSize[1] - margin

    const ensureSpace = (required = lineHeight) => {
        if (y - required < margin) {
            page = pdfDoc.addPage(pageSize)
            y = pageSize[1] - margin
        }
    }

    const drawWrappedText = (
        text: string,
        options?: { bold?: boolean; size?: number; indent?: number },
    ) => {
        const font = options?.bold ? boldFont : regularFont
        const size = options?.size ?? normalSize
        const indent = options?.indent ?? 0
        const width = maxWidth - indent

        const words = text.split(/\s+/)
        let line = ''

        const pushLine = (value: string) => {
            ensureSpace(lineHeight)
            page.drawText(value, {
                x: margin + indent,
                y,
                size,
                font,
            })
            y -= lineHeight
        }

        for (const word of words) {
            const next = line ? `${line} ${word}` : word
            const measured = font.widthOfTextAtSize(next, size)
            if (measured <= width || !line) {
                line = next
            } else {
                pushLine(line)
                line = word
            }
        }

        if (line) pushLine(line)
    }

    const drawSectionTitle = (text: string) => {
        y -= 6
        drawWrappedText(text, { bold: true, size: headingSize })
        y -= 2
    }

    const drawJsonBlock = (value: unknown) => {
        const text = JSON.stringify(value, null, 2) || '{}'
        for (const line of text.split('\n')) {
            drawWrappedText(line)
        }
    }

    const entityType = toEntityType(body.entityType)
    const title = safeHeading(body.title, `${entityType === 'vendor' ? 'Vendor' : 'Healthcare Facility'} Report`)
    const status = safeHeading(body.status, 'pending')
    const source = safeHeading(body.source, 'unknown')
    const entityId = safeHeading(body.entityId, '-')
    const primaryData = isObject(body.primaryData) ? body.primaryData : {}
    const related = isObject(body.related) ? body.related : {}
    const history = Array.isArray(body.history) ? body.history : []

    drawWrappedText(title, { bold: true, size: titleSize })
    y -= 4
    drawWrappedText(`Generated At: ${new Date().toISOString()}`)
    drawWrappedText(`Entity Type: ${entityType}`)
    drawWrappedText(`Entity ID: ${entityId}`)
    drawWrappedText(`Current Approval Status: ${status}`)
    drawWrappedText(`Verification Source: ${source}`)

    drawSectionTitle('Current Record (All Fields)')
    drawJsonBlock(primaryData)

    drawSectionTitle('Verification / Approval History')
    drawJsonBlock(history.length ? history : ['No history records available.'])

    drawSectionTitle('Related Data')
    drawJsonBlock(Object.keys(related).length ? related : { message: 'No related datasets provided.' })

    const bytes = await pdfDoc.save()
    return Buffer.from(bytes)
}

async function fetchVendorExportPayload(
    serviceClient: ReturnType<typeof getServiceClient>,
    entityId: string,
): Promise<ExportPayload> {
    const { data: byId } = await serviceClient
        .from('vendors')
        .select('*')
        .eq('id', entityId)
        .maybeSingle()

    const { data: byUser } = byId
        ? { data: null }
        : await serviceClient
            .from('vendors')
            .select('*')
            .eq('user_id', entityId)
            .maybeSingle()

    const vendor = (byId ?? byUser) as Record<string, unknown> | null
    const vendorRowId = String(vendor?.id ?? entityId)
    const vendorUserId = String(vendor?.user_id ?? entityId)

    const [historyResp, productsResp, certsResp, filesResp] = await Promise.all([
        serviceClient
            .from('vendor_verifications')
            .select('*')
            .in('vendor_id', [vendorRowId, vendorUserId])
            .order('created_at', { ascending: false }),
        serviceClient
            .from('vendor_products')
            .select('*')
            .eq('vendor_id', vendorUserId)
            .order('created_at', { ascending: false }),
        serviceClient
            .from('vendor_certificates')
            .select('*')
            .eq('vendor_id', vendorRowId)
            .order('created_at', { ascending: false }),
        serviceClient.storage.from('certifications').list(`certifications/${vendorRowId}`),
    ])

    const files = Array.isArray(filesResp.data)
        ? filesResp.data
            .filter((file) => file.name && !file.name.endsWith('/'))
            .map((file) => {
                const path = `certifications/${vendorRowId}/${file.name}`
                const { data: urlData } = serviceClient.storage.from('certifications').getPublicUrl(path)
                return {
                    name: file.name,
                    path,
                    publicUrl: urlData.publicUrl,
                }
            })
        : []

    const primaryData = vendor ?? {
        id: entityId,
        user_id: entityId,
        vendor_name: 'Vendor account',
        verification_status: 'pending',
        verification_source: 'profile',
    }

    const title = safeHeading(primaryData.vendor_name, 'Vendor Report')
    const status = safeHeading(primaryData.verification_status, 'pending')
    const source = safeHeading(primaryData.verification_source, 'manual')

    return {
        title,
        status,
        source,
        entityType: 'vendor',
        entityId,
        primaryData,
        history: (historyResp.data ?? []) as unknown[],
        related: {
            catalogProducts: (productsResp.data ?? []) as unknown[],
            certificates: (certsResp.data ?? []) as unknown[],
            certificateFiles: files,
        },
    }
}

async function fetchHospitalExportPayload(
    serviceClient: ReturnType<typeof getServiceClient>,
    entityId: string,
): Promise<ExportPayload> {
    const { data: byId } = await serviceClient
        .from('hospitals')
        .select('*')
        .eq('id', entityId)
        .maybeSingle()

    const { data: byUser } = byId
        ? { data: null }
        : await serviceClient
            .from('hospitals')
            .select('*')
            .eq('user_id', entityId)
            .maybeSingle()

    const hospital = (byId ?? byUser) as Record<string, unknown> | null
    const hospitalRowId = String(hospital?.id ?? entityId)
    const hospitalUserId = String(hospital?.user_id ?? entityId)

    const historyResp = await serviceClient
        .from('hospital_verifications')
        .select('*')
        .in('hospital_id', [hospitalRowId, hospitalUserId])
        .order('created_at', { ascending: false })

    const primaryData = hospital ?? {
        id: entityId,
        user_id: entityId,
        hospital_name: 'Healthcare facility account',
        verification_status: 'pending',
        verification_source: 'profile',
    }

    const title = safeHeading(primaryData.hospital_name, 'Healthcare Facility Report')
    const status = safeHeading(primaryData.verification_status, 'pending')
    const source = safeHeading(primaryData.verification_source, 'manual')

    return {
        title,
        status,
        source,
        entityType: 'hospital',
        entityId,
        primaryData,
        history: (historyResp.data ?? []) as unknown[],
        related: {},
    }
}

async function buildExportPayload(
    serviceClient: ReturnType<typeof getServiceClient>,
    body: ExportRequestBody,
): Promise<ExportPayload> {
    const entityType = toEntityType(body.entityType)
    const entityId = typeof body.entityId === 'string' ? body.entityId : ''

    if (!entityId) {
        throw new Error('entityId is required')
    }

    if (entityType === 'hospital') {
        return fetchHospitalExportPayload(serviceClient, entityId)
    }

    return fetchVendorExportPayload(serviceClient, entityId)
}

export async function POST(request: Request) {
    try {
        const authClient = await createAuthClient()
        const serviceClient = getServiceClient()

        const {
            data: { user },
            error: authError,
        } = await authClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile, error: profileError } = await authClient
            .from('profiles')
            .select('id, role')
            .eq('id', user.id)
            .maybeSingle()

        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 500 })
        }

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = (await request.json()) as ExportRequestBody
        const exportPayload = await buildExportPayload(serviceClient, body)
        const buffer = await generatePdfBuffer({
            ...body,
            entityType: exportPayload.entityType,
            entityId: exportPayload.entityId,
            title: exportPayload.title,
            status: exportPayload.status,
            source: exportPayload.source,
            primaryData: exportPayload.primaryData,
            history: exportPayload.history,
            related: exportPayload.related,
        })

        const defaultName = exportPayload.entityType === 'vendor' ? 'vendor-report' : 'healthcare-facility-report'
        const fileName = `${safeHeading(exportPayload.title, defaultName)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')}.pdf`

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate PDF report'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
