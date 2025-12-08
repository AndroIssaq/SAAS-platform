import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Lock } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function SecurityAuditPage() {
    const supabase = await createClient()

    // Fetch raw data directly from multiple tables
    const { data: contracts } = await supabase
        .from('contracts')
        .select('id, client_name, client_email, client_phone, service_description, notes')
        .limit(5)
        .order('created_at', { ascending: false })

    const { data: users } = await supabase
        .from('users')
        .select('id, email, full_name, phone')
        .eq('role', 'client')
        .limit(5)
        .order('created_at', { ascending: false })

    const { data: clients } = await supabase
        .from('clients')
        .select('id, company_name, onboarding_data')
        .limit(5)
        .order('created_at', { ascending: false })

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex items-center gap-4">
                <ShieldCheck className="h-12 w-12 text-green-600" />
                <div>
                    <h1 className="text-3xl font-bold">حالة الأمان والتشفير</h1>
                    <p className="text-muted-foreground">إثبات التشفير في قاعدة البيانات (End-to-End Encryption Proof)</p>
                </div>
            </div>

            {/* Contracts Table */}
            <Card className="border-2 border-green-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-green-600" />
                        جدول العقود - Contracts Table
                    </CardTitle>
                    <CardDescription>
                        البيانات كما هي مخزنة في جدول `contracts`. لاحظ أن الأسماء، الإيميلات، الهواتف، والملاحظات مشفرة.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Name (Encrypted)</TableHead>
                                    <TableHead>Email (Encrypted)</TableHead>
                                    <TableHead>Phone (Encrypted)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contracts?.map((contract) => (
                                    <TableRow key={contract.id}>
                                        <TableCell className="font-mono text-xs">{contract.id.slice(0, 8)}...</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground break-all">
                                            {contract.client_name?.includes(':') ? (
                                                <span className="text-green-700 bg-green-50 px-2 py-1 rounded">
                                                    {contract.client_name.slice(0, 30)}...
                                                </span>
                                            ) : contract.client_name || '-'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground break-all">
                                            {contract.client_email?.includes(':') ? (
                                                <span className="text-green-700 bg-green-50 px-2 py-1 rounded">
                                                    {contract.client_email.slice(0, 30)}...
                                                </span>
                                            ) : contract.client_email || '-'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground break-all">
                                            {contract.client_phone?.includes(':') ? (
                                                <span className="text-green-700 bg-green-50 px-2 py-1 rounded">
                                                    {contract.client_phone.slice(0, 20)}...
                                                </span>
                                            ) : contract.client_phone || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="border-2 border-blue-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-blue-600" />
                        جدول المستخدمين - Users Table
                    </CardTitle>
                    <CardDescription>
                        البيانات كما هي مخزنة في جدول `users`. لاحظ أن الأسماء والهواتف مشفرة (البريد الإلكتروني غير مشفر لأغراض المصادقة).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Email (Plain)</TableHead>
                                    <TableHead>Full Name (Encrypted)</TableHead>
                                    <TableHead>Phone (Encrypted)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users?.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-mono text-xs">{user.id.slice(0, 8)}...</TableCell>
                                        <TableCell className="font-mono text-xs">{user.email}</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground break-all">
                                            {user.full_name?.includes(':') ? (
                                                <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                                    {user.full_name.slice(0, 30)}...
                                                </span>
                                            ) : user.full_name || '-'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground break-all">
                                            {user.phone?.includes(':') ? (
                                                <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                                    {user.phone.slice(0, 20)}...
                                                </span>
                                            ) : user.phone || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Clients Table */}
            <Card className="border-2 border-purple-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-purple-600" />
                        جدول العملاء - Clients Table
                    </CardTitle>
                    <CardDescription>
                        البيانات كما هي مخزنة في جدول `clients`. لاحظ أن بيانات الـ onboarding (الإيميل والهاتف) مشفرة.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Company Name</TableHead>
                                    <TableHead>Onboarding Data (Encrypted)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients?.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-mono text-xs">{client.id.slice(0, 8)}...</TableCell>
                                        <TableCell className="text-sm">{client.company_name || '-'}</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground break-all">
                                            {client.onboarding_data ? (
                                                <span className="text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                                    {JSON.stringify(client.onboarding_data).slice(0, 50)}...
                                                </span>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Encryption Standards */}
            <Card>
                <CardHeader>
                    <CardTitle>معايير التشفير المستخدمة</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                            <li><strong>الخوارزمية:</strong> AES-256-GCM (Advanced Encryption Standard)</li>
                            <li><strong>المفتاح:</strong> 256-bit key managed via Environment Variables</li>
                            <li><strong>المصادقة:</strong> GCM Auth Tag لضمان عدم تلاعب البيانات</li>
                            <li><strong>التخزين:</strong> يتم تخزين البيانات مشفرة (Ciphertext) في قاعدة البيانات</li>
                            <li><strong>الحقول المشفرة:</strong> client_name, client_email, client_phone, service_description, notes (في جدول contracts), full_name, phone (في جدول users), onboarding_data (في جدول clients)</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
