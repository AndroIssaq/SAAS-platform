"use client"

import { useState, useEffect } from "react"
import { useForm, UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { contractFormSchema, ContractFormValues } from "./schema"
import { Form } from "@/components/ui/form"
import { ContractForm } from "./contract-form"
import { ContractPreview } from "./contract-preview"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, ChevronLeft, Eye, EyeOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { createContract } from "@/app/actions/contracts"
import { useWorkspaceEncryption } from "@/components/affiliate/use-workspace-encryption"
import { encryptDataForWorkspace } from "@/lib/encryption/client"
import { useRouter } from "next/navigation"

interface ContractCreationViewProps {
    affiliateId: string
    preSelectedServiceId?: string
    onSuccess?: (data: any) => void
    userRole?: 'admin' | 'affiliate'
    providerCompanyName?: string
    providerName?: string
}

export function ContractCreationView({
    affiliateId,
    preSelectedServiceId,
    onSuccess,
    userRole = 'affiliate',
    providerCompanyName,
    providerName
}: ContractCreationViewProps) {
    const router = useRouter()
    const [showPreview, setShowPreview] = useState(true)
    const [loading, setLoading] = useState(false)
    const { loading: encryptionLoading, publicKey, refresh: refreshEncryption } = useWorkspaceEncryption()

    const form = useForm<ContractFormValues>({
        resolver: zodResolver(contractFormSchema),
        defaultValues: {
            client_name: "",
            client_email: "",
            client_phone: "",
            company_name: "",
            use_custom_service: false,
            service_id: preSelectedServiceId || "",
            service_type: "",
            package_name: "",
            service_description: "",
            total_amount: 0,
            deposit_percentage: 50,
            payment_method: "bank_transfer",
            timeline: "",
            features: [],
            deliverables: [],
            notes: "",
            terms_notes: "",
        },
        mode: "onChange" // Enable real-time validation
    })

    // Handle form submission
    const onSubmit = async (values: ContractFormValues) => {
        setLoading(true)

        if (encryptionLoading) {
            toast.error("يتم تحميل إعدادات التشفير، حاول بعد لحظات")
            setLoading(false)
            return
        }

        if (!publicKey) {
            toast.error("يجب تفعيل مفتاح التشفير في صفحة الإعدادات قبل إنشاء عقد")
            await refreshEncryption()
            setLoading(false)
            return
        }

        try {
            const depositAmount = (values.total_amount * values.deposit_percentage) / 100

            const contractData = {
                affiliate_id: affiliateId,
                service_id: values.use_custom_service ? null : values.service_id || null,
                client_name: values.client_name,
                client_email: values.client_email,
                client_phone: values.client_phone,
                company_name: values.company_name,
                service_type: values.service_type,
                package_name: values.package_name,
                service_description: values.service_description,
                total_amount: values.total_amount,
                deposit_amount: depositAmount,
                payment_method: values.payment_method,
                timeline: values.timeline,
                notes: values.notes,
                deliverables: values.deliverables,
                contract_terms: {
                    terms: values.features,
                    notes: values.terms_notes,
                },
            }

            const encrypted = await encryptDataForWorkspace(
                {
                    payload: contractData,
                    createdAt: new Date().toISOString(),
                    version: "v1",
                },
                publicKey
            )

            const result = await createContract({
                ...contractData,
                encrypted_payload: encrypted.encryptedPayload,
                encryption_version: encrypted.encryptionVersion,
                encryption_public_key: publicKey,
            })

            if (result.success) {
                toast.success("🎉 تم إنشاء العقد بنجاح!", {
                    description: `العقد ${result.contractNumber}`
                })

                if (onSuccess) {
                    onSuccess(result)
                    setLoading(false)
                } else {
                    const redirectPath = userRole === 'admin'
                        ? `/admin/contracts/${result.contractId}/flow`
                        : `/affiliate/contracts/${result.contractId}/flow`

                    toast.info("جاري التوجيه للمعاينه...")
                    console.log("Redirecting to:", redirectPath)
                    router.push(redirectPath)
                    // Don't setLoading(false) here to keep the loader showing during navigation
                }
            } else {
                toast.error(result.error || "حدث خطأ أثناء إنشاء العقد")
                setLoading(false)
            }
        } catch (err: any) {
            console.error("Error creating contract:", err)
            toast.error("تعذر إنشاء العقد")
            setLoading(false)
        }
    }

    return (
        <div className="flex h-[calc(100vh-6rem)] gap-6 overflow-hidden relative">
            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border shadow-2xl"
                    >
                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                        <div className="text-center">
                            <h3 className="font-semibold text-lg">جاري إنشاء العقد...</h3>
                            <p className="text-muted-foreground text-sm">سيتم توجيهك لصفحة العقد فور الانتهاء</p>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Left Panel - Form */}
            <div className={`flex-1 overflow-y-auto pr-2 transition-all duration-500 ease-in-out ${showPreview ? 'lg:w-[55%]' : 'w-full'}`}>
                <div className="max-w-3xl mx-auto pb-20">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            {/* Header removed to avoid duplication with page title */}
                        </div>

                        {/* Mobile Toggle Preview */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setShowPreview(!showPreview)}
                        >
                            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <ContractForm form={form} />

                            <div className="flex items-center gap-4 pt-6 border-t sticky bottom-0 bg-background/95 backdrop-blur py-4 z-10">
                                <Button type="submit" size="lg" className="w-full md:w-auto min-w-[200px]" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                            جاري الإنشاء...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="ml-2 h-4 w-4" />
                                            إنشاء العقد وتجهيزه
                                        </>
                                    )}
                                </Button>
                                <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                                    إلغاء
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>

            {/* Right Panel - Real-time Preview */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: "45%" }}
                        exit={{ opacity: 0, x: 20, width: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="hidden lg:block relative"
                    >
                        <div className="absolute inset-0 bg-muted/30 rounded-3xl border-2 border-dashed border-primary/20 p-6 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm font-medium text-muted-foreground">معاينة حية</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => setShowPreview(false)}
                                >
                                    <EyeOff className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto rounded-xl custom-scrollbar">
                                <div className="min-h-full p-4 flex justify-center">
                                    <ContractPreview
                                        values={form.watch()}
                                        providerCompanyName={providerCompanyName}
                                        providerName={providerName}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 text-center">
                                <p className="text-xs text-muted-foreground">
                                    هذا مجرد معاينة أولية لشكل العقد النهائي
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button (When closed) */}
            <AnimatePresence>
                {!showPreview && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-8 left-8 z-50 hidden lg:block"
                    >
                        <Button
                            size="lg"
                            className="rounded-full shadow-2xl h-14 w-14 p-0 bg-primary hover:bg-primary/90"
                            onClick={() => setShowPreview(true)}
                        >
                            <Eye className="h-6 w-6" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
