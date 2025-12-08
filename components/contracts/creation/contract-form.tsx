"use client"

import { useEffect, useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { ContractFormValues } from "./schema"
import { getAllServices } from "@/lib/actions/services"
import { Service } from "@/lib/types/service"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Plus, X, User, Briefcase, CreditCard, FileText, Sparkles, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ContractFormProps {
    form: UseFormReturn<ContractFormValues>
}

export function ContractForm({ form }: ContractFormProps) {
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)

    const useCustomService = form.watch("use_custom_service")
    const selectedServiceId = form.watch("service_id")
    const customFeatures = form.watch("features") || []
    const customDeliverables = form.watch("deliverables") || []
    const [newFeature, setNewFeature] = useState("")
    const [newDeliverable, setNewDeliverable] = useState("")

    useEffect(() => {
        async function fetchServices() {
            const result = await getAllServices()
            if (result.success && result.data) {
                setServices(result.data)
            }
            setLoading(false)
        }
        fetchServices()
    }, [])

    // Update logic when service changes
    useEffect(() => {
        if (selectedServiceId && !useCustomService) {
            const service = services.find((s) => s.id === selectedServiceId)
            if (service) {
                form.setValue("service_type", service.name)
                form.setValue("package_name", service.category)
                form.setValue("service_description", service.description || "")
                form.setValue("total_amount", service.base_price)
                form.setValue("timeline", service.timeline || "")
                form.setValue("features", service.features || [])
                form.setValue("deliverables", service.deliverables || [])
            }
        }
    }, [selectedServiceId, services, useCustomService, form])

    const addFeature = () => {
        if (newFeature.trim()) {
            const current = form.getValues("features")
            form.setValue("features", [...current, newFeature.trim()])
            setNewFeature("")
        }
    }

    const removeFeature = (index: number) => {
        const current = form.getValues("features")
        form.setValue(
            "features",
            current.filter((_, i) => i !== index)
        )
    }

    const addDeliverable = () => {
        if (newDeliverable.trim()) {
            const current = form.getValues("deliverables")
            form.setValue("deliverables", [...current, newDeliverable.trim()])
            setNewDeliverable("")
        }
    }

    const removeDeliverable = (index: number) => {
        const current = form.getValues("deliverables")
        form.setValue(
            "deliverables",
            current.filter((_, i) => i !== index)
        )
    }

    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    }

    return (
        <div className="space-y-6">
            {/* Client Information */}
            <motion.div initial="hidden" animate="visible" variants={sectionVariants}>
                <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            بيانات العميل
                        </CardTitle>
                        <CardDescription>المعلومات الأساسية للطرف الثاني في العقد</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="client_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>اسم العميل <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="الاسم الثلاثي" {...field} className="h-11 bg-background/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="company_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>اسم الشركة (اختياري)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="اسم كيان العمل" {...field} className="h-11 bg-background/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="client_email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>البريد الإلكتروني <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="example@domain.com" {...field} className="h-11 bg-background/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="client_phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>رقم الهاتف <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="01xxxxxxxxx" {...field} className="h-11 bg-background/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Service Details */}
            <motion.div initial="hidden" animate="visible" variants={sectionVariants} transition={{ delay: 0.1 }}>
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Briefcase className="h-5 w-5 text-blue-600" />
                                </div>
                                تفاصيل الخدمة
                            </CardTitle>
                            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
                                <Switch
                                    checked={useCustomService}
                                    onCheckedChange={(checked) => form.setValue("use_custom_service", checked)}
                                />
                                <span className="text-sm font-medium">خدمة مخصصة</span>
                            </div>
                        </div>
                        <CardDescription>اختر خدمة جاهزة أو قم بإنشاء عرض مخصص</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <AnimatePresence mode="wait">
                            {!useCustomService ? (
                                <motion.div
                                    key="select-service"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="service_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>اختر الخدمة</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 bg-background/50">
                                                            <SelectValue placeholder="اختر من قائمة الخدمات" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {services.map((service) => (
                                                            <SelectItem key={service.id} value={service.id}>
                                                                <div className="flex items-center justify-between w-full gap-4">
                                                                    <span className="font-medium">{service.name}</span>
                                                                    <Badge variant="secondary" className="mr-2">
                                                                        {service.base_price.toLocaleString()} {service.currency}
                                                                    </Badge>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {/* Read-only details for selected service */}
                                    {selectedServiceId && (
                                        <div className="bg-muted/50 p-4 rounded-lg grid grid-cols-2 gap-4 text-sm border border-dashed">
                                            <div>
                                                <span className="text-muted-foreground block mb-1">نوع الخدمة</span>
                                                <span className="font-medium">{form.watch("service_type")}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block mb-1">مدة التنفيذ</span>
                                                <span className="font-medium">{form.watch("timeline")}</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="custom-service"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="grid md:grid-cols-2 gap-6"
                                >
                                    <FormField
                                        control={form.control}
                                        name="service_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>نوع الخدمة</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="مثال: تطوير متجر إلكتروني" {...field} className="h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="package_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>اسم الباقة</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="مثال: بلاتينيوم" {...field} className="h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name="service_description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>وصف الخدمة</FormLabel>
                                                    <FormControl>
                                                        <Textarea rows={3} placeholder="وصف دقيق لما سيتم تقديمه..." {...field} className="bg-background/50" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Financials */}
            <motion.div initial="hidden" animate="visible" variants={sectionVariants} transition={{ delay: 0.2 }}>
                <Card className="border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-shadow bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <CreditCard className="h-5 w-5 text-emerald-600" />
                            </div>
                            التسعير والدفع
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="total_amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>المبلغ الإجمالي</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="number" {...field} className="h-11 pl-12 font-mono text-lg" />
                                                <span className="absolute left-3 top-2.5 text-muted-foreground font-bold">EGP</span>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="deposit_percentage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>الدفعة المقدمة (%)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="number" min={0} max={100} {...field} className="h-11 pl-12" />
                                                <span className="absolute left-3 top-2.5 text-muted-foreground">%</span>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="payment_method"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>طريقة الدفع</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                                                <SelectItem value="instapay">InstaPay</SelectItem>
                                                <SelectItem value="cash">كاش</SelectItem>
                                                <SelectItem value="vodafone_cash">فودافون كاش</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="timeline"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>مدة التنفيذ المتوقعة</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input placeholder="مثال: 3 أسابيع" {...field} className="h-11 pl-10" />
                                            <Clock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </motion.div>

            {/* Lists (Features & Deliverables) */}
            <motion.div initial="hidden" animate="visible" variants={sectionVariants} transition={{ delay: 0.3 }}>
                <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Sparkles className="h-5 w-5 text-amber-600" />
                            </div>
                            مميزات ومخرجات العرض
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Features Section */}
                        <div className="space-y-3">
                            <FormLabel className="text-base font-semibold">المميزات (ما يحصل عليه العميل)</FormLabel>
                            <div className="flex gap-2">
                                <Input
                                    value={newFeature}
                                    onChange={(e) => setNewFeature(e.target.value)}
                                    placeholder="أضف ميزة جديدة واضغط Enter..."
                                    className="h-10 bg-background/50 border-dashed"
                                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                                />
                                <Button type="button" onClick={addFeature} size="icon" variant="secondary" className="shrink-0 w-10 h-10">
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                <AnimatePresence>
                                    {customFeatures.map((feature, index) => (
                                        <motion.div
                                            key={`feature-${index}`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            layout
                                            className="flex items-center justify-between p-2 pl-3 bg-muted/80 rounded-md border text-sm group"
                                        >
                                            <span>{feature}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="xs"
                                                onClick={() => removeFeature(index)}
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3 text-muted-foreground group-hover:text-destructive" />
                                            </Button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        <Separator />

                        {/* Deliverables Section */}
                        <div className="space-y-3">
                            <FormLabel className="text-base font-semibold">المخرجات النهائية</FormLabel>
                            <div className="flex gap-2">
                                <Input
                                    value={newDeliverable}
                                    onChange={(e) => setNewDeliverable(e.target.value)}
                                    placeholder="أضف مخرج نهائي (مثال: ملفات التصميم المصدرية)..."
                                    className="h-10 bg-background/50 border-dashed"
                                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addDeliverable())}
                                />
                                <Button type="button" onClick={addDeliverable} size="icon" variant="secondary" className="shrink-0 w-10 h-10">
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                <AnimatePresence>
                                    {customDeliverables.map((item, index) => (
                                        <motion.div
                                            key={`deliverable-${index}`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            layout
                                            className="flex items-center justify-between p-2 pl-3 bg-muted/80 rounded-md border text-sm group"
                                        >
                                            <span>{item}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="xs"
                                                onClick={() => removeDeliverable(index)}
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3 text-muted-foreground group-hover:text-destructive" />
                                            </Button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Notes */}
            <motion.div initial="hidden" animate="visible" variants={sectionVariants} transition={{ delay: 0.4 }}>
                <Card className="border-l-4 border-l-slate-500 shadow-md bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 bg-slate-500/10 rounded-lg">
                                <FileText className="h-5 w-5 text-slate-600" />
                            </div>
                            ملاحظات وشروط إضافية
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ملاحظات عامة</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="أي ملاحظات إضافية تود ذكرها في العقد..." {...field} className="min-h-[100px] bg-background/50" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="terms_notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>شروط استثنائية</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="شروط خاصة سيتم إضافتها لقسم الشروط والأحكام..." {...field} className="min-h-[80px] bg-background/50" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
