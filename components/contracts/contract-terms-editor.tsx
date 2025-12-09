"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const contractTermsSchema = z.object({
    service_type: z.string().min(2, "نوع الخدمة مطلوب"),
    package_name: z.string().min(2, "اسم الباقة مطلوب"),
    service_description: z.string().optional(),
    total_amount: z.coerce.number().min(1, "المبلغ الإجمالي مطلوب"),
    deposit_amount: z.coerce.number().min(0, "مبلغ العربون مطلوب"),
    timeline: z.string().optional(),
    payment_method: z.string().min(1, "طريقة الدفع مطلوبة"),
    deliverables: z.array(z.string()).default([]),
    payment_schedule: z.array(z.string()).default([]),
    custom_terms: z.array(z.object({
        title: z.string(),
        content: z.string()
    })).optional(),
})

type ContractTermsValues = z.infer<typeof contractTermsSchema>

interface InitialTerms {
    service_type?: string
    package_name?: string
    service_description?: string
    total_amount?: number
    deposit_amount?: number
    timeline?: string
    payment_method?: string
    deliverables?: string[]
    payment_schedule?: string[]
    custom_terms?: { title: string; content: string }[]
}

interface ContractTermsEditorProps {
    contractId: string
    initialTerms: InitialTerms
    userRole?: "admin" | "affiliate"
}

export function ContractTermsEditor({
    contractId,
    initialTerms,
}: ContractTermsEditorProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [isSaving, setIsSaving] = useState(false)
    const supabase = createClient()

    const form = useForm<ContractTermsValues>({
        resolver: zodResolver(contractTermsSchema) as any,
        defaultValues: {
            service_type: initialTerms.service_type || "",
            package_name: initialTerms.package_name || "",
            service_description: initialTerms.service_description || "",
            total_amount: initialTerms.total_amount || 0,
            deposit_amount: initialTerms.deposit_amount || 0,
            timeline: initialTerms.timeline || "",
            payment_method: initialTerms.payment_method || "",
            deliverables: initialTerms.deliverables?.length ? initialTerms.deliverables : [""],
            payment_schedule: initialTerms.payment_schedule?.length ? initialTerms.payment_schedule : [""],
            custom_terms: initialTerms.custom_terms || [],
        },
    })

    // Note: We use form.watch() and form.setValue() directly for string arrays
    // instead of useFieldArray, as useFieldArray works best with object arrays


    async function onSubmit(data: ContractTermsValues) {
        setIsSaving(true)
        try {
            // Structure data to match DB JSON structure
            const contractTermsUpdate = {
                service: {
                    description: data.service_description,
                    timeline: data.timeline,
                    deliverables: data.deliverables,
                },
                payment: {
                    payment_schedule: data.payment_schedule
                },
                custom_terms: data.custom_terms
            }

            const { error } = await supabase
                .from("contracts")
                .update({
                    service_type: data.service_type,
                    package_name: data.package_name,
                    total_amount: data.total_amount,
                    deposit_amount: data.deposit_amount,
                    payment_method: data.payment_method,
                    contract_terms: contractTermsUpdate,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", contractId)

            if (error) throw error

            toast({
                title: "تم الحفظ بنجاح",
                description: "تم تحديث بنود العقد",
            })

            router.refresh()
        } catch (error) {
            console.error("Error updating contract:", error)
            toast({
                variant: "destructive",
                title: "خطأ في الحفظ",
                description: "حدث خطأ أثناء حفظ التغييرات. يرجى المحاولة مرة أخرى.",
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Service Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>تفاصيل الخدمة</CardTitle>
                        <CardDescription>البيانات الأساسية للخدمة المتعاقد عليها</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <FormField
                            control={form.control as any}
                            name="service_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>نوع الخدمة</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="package_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اسم الباقة</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="col-span-2">
                            <FormField
                                control={form.control as any}
                                name="service_description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>وصف الخدمة</FormLabel>
                                        <FormControl>
                                            <Textarea className="h-24" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Financials */}
                <Card>
                    <CardHeader>
                        <CardTitle>البيانات المالية</CardTitle>
                        <CardDescription>المبالغ وطريقة الدفع</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-3">
                        <FormField
                            control={form.control as any}
                            name="total_amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>المبلغ الإجمالي</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="deposit_amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>مبلغ العربون</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="payment_method"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>طريقة الدفع</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Deliverables & Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle>مخرجات العمل والجدول الزمني</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control as any}
                            name="timeline"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>المدة الزمنية للتنفيذ</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثال: 14 يوم عمل" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4">
                            <FormLabel>مخرجات العمل (Deliverables)</FormLabel>
                            {form.watch("deliverables").map((_: string, index: number) => (
                                <div key={index} className="flex gap-2">
                                    <FormField
                                        control={form.control as any}
                                        name={`deliverables.${index}`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input {...field} placeholder={`مخرج رقم ${index + 1}`} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {index > 0 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                const current = form.getValues("deliverables")
                                                form.setValue("deliverables", current.filter((_val: string, i: number) => i !== index))
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                    const current = form.getValues("deliverables")
                                    form.setValue("deliverables", [...current, ""])
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" /> إضافة مخرج
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-6">
                    <Button type="submit" disabled={isSaving} size="lg">
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        حفظ التغييرات
                    </Button>
                </div>

            </form>
        </Form>
    )
}
