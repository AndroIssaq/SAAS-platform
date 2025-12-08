"use client"

import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Users,
    Mail,
    Phone,
    Calendar,
    Globe,
    Search,
    Download,
    ArrowLeft,
    UserCheck,
    TrendingUp,
    MoreHorizontal,
    Trash2,
    ExternalLink,
    Send,
    CheckSquare,
    Square,
    Loader2,
    X
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getFormSubmissions, type FormSubmissionRecord, deleteFormSubmission, sendBulkEmailToLeads } from "@/lib/actions/forms"

interface LeadData {
    id: string
    email: string | null
    name: string | null
    phone: string | null
    formTitle: string
    formKey: string
    sourceUrl: string | null
    createdAt: string
    allData: Record<string, any>
}

function extractLeadInfo(submission: FormSubmissionRecord): LeadData {
    const data = submission.data || {}

    // Try to extract name
    let name: string | null = null
    const nameKeys = ['name', 'full_name', 'fullname', 'الاسم', 'اسم', 'الاسم الكامل']
    for (const key of Object.keys(data)) {
        if (nameKeys.some(nk => key.toLowerCase().includes(nk.toLowerCase()))) {
            name = String(data[key])
            break
        }
    }

    // Try to extract phone
    let phone: string | null = null
    const phoneKeys = ['phone', 'mobile', 'tel', 'الهاتف', 'رقم الهاتف', 'الموبايل', 'الجوال']
    for (const key of Object.keys(data)) {
        if (phoneKeys.some(pk => key.toLowerCase().includes(pk.toLowerCase()))) {
            phone = String(data[key])
            break
        }
    }

    return {
        id: submission.id,
        email: submission.email,
        name,
        phone,
        formTitle: submission.form?.title || 'فورم غير معروفة',
        formKey: submission.form?.form_key || '',
        sourceUrl: submission.source_url,
        createdAt: submission.created_at,
        allData: data
    }
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<LeadData[]>([])
    const [filteredLeads, setFilteredLeads] = useState<LeadData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [error, setError] = useState<string | null>(null)

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Bulk email state
    const [showEmailPanel, setShowEmailPanel] = useState(false)
    const [emailSubject, setEmailSubject] = useState("")
    const [emailMessage, setEmailMessage] = useState("")
    const [isSending, startSendingTransition] = useTransition()
    const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null)

    useEffect(() => {
        async function fetchLeads() {
            try {
                const result = await getFormSubmissions()
                if (result.success) {
                    const extractedLeads = result.submissions.map(extractLeadInfo)
                    setLeads(extractedLeads)
                    setFilteredLeads(extractedLeads)
                } else {
                    setError(result.error || 'فشل في جلب البيانات')
                }
            } catch (err) {
                setError('حدث خطأ غير متوقع')
            } finally {
                setIsLoading(false)
            }
        }
        fetchLeads()
    }, [])

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredLeads(leads)
            return
        }

        const term = searchTerm.toLowerCase()
        setFilteredLeads(
            leads.filter(lead =>
                lead.email?.toLowerCase().includes(term) ||
                lead.name?.toLowerCase().includes(term) ||
                lead.phone?.includes(term) ||
                lead.formTitle.toLowerCase().includes(term)
            )
        )
    }, [searchTerm, leads])

    // Selection handlers
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const selectAll = () => {
        const allIds = filteredLeads.map(l => l.id)
        setSelectedIds(new Set(allIds))
    }

    const deselectAll = () => {
        setSelectedIds(new Set())
    }

    const isAllSelected = filteredLeads.length > 0 && selectedIds.size === filteredLeads.length
    const selectedLeads = filteredLeads.filter(l => selectedIds.has(l.id))
    const selectedEmails = selectedLeads.filter(l => l.email).map(l => l.email!)

    // Delete handlers
    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الـ Lead؟')) return

        try {
            await deleteFormSubmission(id)
            setLeads(prev => prev.filter(l => l.id !== id))
            setFilteredLeads(prev => prev.filter(l => l.id !== id))
            setSelectedIds(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
        } catch (err) {
            console.error('Error deleting lead:', err)
        }
    }

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return
        if (!confirm(`هل أنت متأكد من حذف ${selectedIds.size} lead؟`)) return

        try {
            for (const id of selectedIds) {
                await deleteFormSubmission(id)
            }
            setLeads(prev => prev.filter(l => !selectedIds.has(l.id)))
            setFilteredLeads(prev => prev.filter(l => !selectedIds.has(l.id)))
            setSelectedIds(new Set())
        } catch (err) {
            console.error('Error bulk deleting leads:', err)
        }
    }

    // Email handler
    const handleSendBulkEmail = () => {
        if (selectedEmails.length === 0) {
            setSendResult({ success: false, message: 'لا يوجد إيميلات محددة' })
            return
        }

        startSendingTransition(async () => {
            const result = await sendBulkEmailToLeads({
                emails: selectedEmails,
                subject: emailSubject,
                message: emailMessage
            })

            if (result.success) {
                setSendResult({ success: true, message: `تم إرسال الإيميل بنجاح إلى ${result.sentCount} شخص` })
                setEmailSubject("")
                setEmailMessage("")
                setTimeout(() => {
                    setShowEmailPanel(false)
                    setSendResult(null)
                }, 2000)
            } else {
                setSendResult({ success: false, message: result.error || 'فشل في الإرسال' })
            }
        })
    }

    const buildCsv = () => {
        if (!filteredLeads.length) return ''

        const header = ['الاسم', 'البريد الإلكتروني', 'الهاتف', 'الفورم', 'المصدر', 'التاريخ']
        const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`

        const rows = filteredLeads.map(l => [
            escape(l.name),
            escape(l.email),
            escape(l.phone),
            escape(l.formTitle),
            escape(l.sourceUrl),
            escape(new Date(l.createdAt).toLocaleString('ar-EG'))
        ].join(','))

        return [header.join(','), ...rows].join('\n')
    }

    const csvHref = buildCsv()
        ? `data:text/csv;charset=utf-8,${encodeURIComponent('\ufeff' + buildCsv())}`
        : undefined

    // Stats
    const totalLeads = leads.length
    const leadsWithEmail = leads.filter(l => l.email).length
    const leadsWithPhone = leads.filter(l => l.phone).length
    const uniqueForms = new Set(leads.map(l => l.formKey)).size

    if (isLoading) {
        return (
            <div className="container mx-auto py-16 px-4">
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground">جاري تحميل العملاء المحتملين...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <Button variant="ghost" asChild className="mb-2 -mr-4">
                        <Link href="/admin/forms">
                            <ArrowLeft className="ml-2 h-4 w-4" />
                            العودة للفورمز
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        العملاء المحتملين (Leads)
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        جميع العملاء المحتملين من كل الفورمز في مكان واحد
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {csvHref && (
                        <Button variant="outline" asChild>
                            <a href={csvHref} download="leads.csv">
                                <Download className="ml-2 h-4 w-4" />
                                تصدير CSV
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">إجمالي الـ Leads</p>
                                <p className="text-3xl font-bold text-blue-600">{totalLeads}</p>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-full">
                                <TrendingUp className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">لديهم بريد</p>
                                <p className="text-3xl font-bold text-green-600">{leadsWithEmail}</p>
                            </div>
                            <div className="p-3 bg-green-500/10 rounded-full">
                                <Mail className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">لديهم هاتف</p>
                                <p className="text-3xl font-bold text-purple-600">{leadsWithPhone}</p>
                            </div>
                            <div className="p-3 bg-purple-500/10 rounded-full">
                                <Phone className="h-6 w-6 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">عدد الفورمز</p>
                                <p className="text-3xl font-bold text-orange-600">{uniqueForms}</p>
                            </div>
                            <div className="p-3 bg-orange-500/10 rounded-full">
                                <Globe className="h-6 w-6 text-orange-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Selection Actions Bar */}
            {selectedIds.size > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="py-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="text-base px-3 py-1">
                                    <CheckSquare className="h-4 w-4 ml-1" />
                                    {selectedIds.size} محدد
                                    {selectedEmails.length > 0 && ` (${selectedEmails.length} لديهم بريد)`}
                                </Badge>
                                <Button variant="ghost" size="sm" onClick={deselectAll}>
                                    <X className="h-4 w-4 ml-1" />
                                    إلغاء التحديد
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => setShowEmailPanel(true)}
                                    disabled={selectedEmails.length === 0}
                                >
                                    <Send className="h-4 w-4 ml-2" />
                                    إرسال بريد ({selectedEmails.length})
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleBulkDelete}
                                >
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    حذف المحدد
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bulk Email Panel */}
            {showEmailPanel && (
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-primary" />
                                إرسال بريد جماعي
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowEmailPanel(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardDescription>
                            إرسال بريد إلى {selectedEmails.length} شخص محدد
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="emailSubject">عنوان الرسالة</Label>
                            <Input
                                id="emailSubject"
                                placeholder="أدخل عنوان الرسالة..."
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="emailMessage">محتوى الرسالة</Label>
                            <Textarea
                                id="emailMessage"
                                placeholder="اكتب رسالتك هنا..."
                                rows={5}
                                value={emailMessage}
                                onChange={(e) => setEmailMessage(e.target.value)}
                            />
                        </div>

                        {sendResult && (
                            <div className={`p-3 rounded-lg ${sendResult.success ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                                {sendResult.message}
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowEmailPanel(false)}>
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleSendBulkEmail}
                                disabled={isSending || !emailSubject.trim() || !emailMessage.trim()}
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                        جاري الإرسال...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 ml-2" />
                                        إرسال الآن
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search & Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-primary" />
                                قائمة العملاء المحتملين
                            </CardTitle>
                            <CardDescription>
                                {filteredLeads.length} عميل محتمل {searchTerm && `(من أصل ${leads.length})`}
                            </CardDescription>
                        </div>

                        <div className="relative w-full md:w-80">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="ابحث بالاسم، البريد، الهاتف..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                            <p className="text-destructive text-sm">{error}</p>
                        </div>
                    )}

                    {filteredLeads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="p-4 bg-muted/50 rounded-full mb-4">
                                <Users className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">لا يوجد عملاء محتملين</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mt-2">
                                {searchTerm
                                    ? 'لا توجد نتائج مطابقة للبحث'
                                    : 'قم بإنشاء فورمز وتضمينها في موقعك لبدء جمع العملاء المحتملين'
                                }
                            </p>
                            {!searchTerm && (
                                <Button asChild className="mt-4">
                                    <Link href="/admin/forms/new">إنشاء فورم جديدة</Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="text-center py-3 px-2 w-12">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={isAllSelected ? deselectAll : selectAll}
                                            >
                                                {isAllSelected ? (
                                                    <CheckSquare className="h-5 w-5 text-primary" />
                                                ) : (
                                                    <Square className="h-5 w-5" />
                                                )}
                                            </Button>
                                        </th>
                                        <th className="text-right py-3 px-4 font-medium text-sm">الاسم</th>
                                        <th className="text-right py-3 px-4 font-medium text-sm">البريد الإلكتروني</th>
                                        <th className="text-right py-3 px-4 font-medium text-sm">الهاتف</th>
                                        <th className="text-right py-3 px-4 font-medium text-sm">الفورم</th>
                                        <th className="text-right py-3 px-4 font-medium text-sm">التاريخ</th>
                                        <th className="text-center py-3 px-4 font-medium text-sm w-12">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.map((lead, index) => (
                                        <tr
                                            key={lead.id}
                                            className={`border-b hover:bg-muted/20 transition-colors ${selectedIds.has(lead.id) ? 'bg-primary/5' : index % 2 === 0 ? 'bg-muted/5' : ''
                                                }`}
                                        >
                                            <td className="py-3 px-2 text-center">
                                                <Checkbox
                                                    checked={selectedIds.has(lead.id)}
                                                    onCheckedChange={() => toggleSelect(lead.id)}
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                                        {lead.name?.[0] || lead.email?.[0] || '?'}
                                                    </div>
                                                    <span className="font-medium">{lead.name || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {lead.email ? (
                                                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {lead.email}
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {lead.phone ? (
                                                    <a href={`tel:${lead.phone}`} className="text-primary hover:underline flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {lead.phone}
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="secondary" className="text-xs">
                                                    {lead.formTitle}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(lead.createdAt).toLocaleDateString('ar-EG')}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {lead.sourceUrl && (
                                                            <DropdownMenuItem asChild>
                                                                <a href={lead.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                                                                    <ExternalLink className="h-4 w-4" />
                                                                    عرض المصدر
                                                                </a>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            className="text-destructive flex items-center gap-2"
                                                            onClick={() => handleDelete(lead.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            حذف
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
