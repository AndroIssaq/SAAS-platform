"use client"

import { UseFormReturn } from "react-hook-form"
import { ContractFormValues } from "./schema"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { arEG } from "date-fns/locale"

interface ContractPreviewProps {
    values: ContractFormValues
    form?: UseFormReturn<ContractFormValues>
    signatures?: {
        admin?: string
        client?: string
    }
    paymentProofUrl?: string | null
    idCards?: {
        admin?: string
        client?: string
    }
    otpVerified?: boolean
    providerCompanyName?: string // Dynamic Company Name
    providerName?: string // Dynamic Representative Name
}

export function ContractPreview({
    values: propValues,
    form,
    signatures,
    paymentProofUrl,
    idCards,
    otpVerified,
    providerCompanyName,
    providerName
}: ContractPreviewProps) {
    const values = propValues || (form ? form.watch() : {} as ContractFormValues)

    // Debug logging
    console.log('📄 ContractPreview Props:', {
        signatures,
        idCards,
        paymentProofUrl,
        otpVerified
    })

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP'
        }).format(amount)
    }

    // Format date
    const currentDate = format(new Date(), "dd MMMM yyyy", { locale: arEG })

    return (
        <div className="w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl relative select-none origin-top transition-transform duration-200" style={{ transform: "scale(0.85)", transformOrigin: "top center" }}>
            {/* Paper Texture/Pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply pointer-events-none" />

            {/* Header Decoration */}
            <div className="h-2 bg-primary w-full absolute top-0 left-0" />

            <div className="p-[20mm] relative z-10 font-sans leading-relaxed text-right" dir="rtl">
                {/* Header */}
                <header className="text-center border-b-2 border-border/50 pb-8 mb-8">
                    <h1 className="text-3xl font-black mb-4 tracking-wide text-primary">عقد اتفاق خدمات برمجية</h1>
                    <div className="flex justify-between items-center text-sm text-muted-foreground px-4">
                        <p>تاريخ التحرير: {currentDate}</p>
                        <p>رقم العقد: <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground font-bold">RW-{values.contract_number ? values.contract_number.split('-')[1] : 'PENDING'}</span></p>
                    </div>
                </header>

                {/* Introduction */}
                <section className="mb-8 text-right text-sm">
                    <p className="mb-4">
                        تم الاتفاق في هذا اليوم <strong>{currentDate}</strong> بين كل من:
                    </p>

                    <div className="mb-4 pr-4 border-r-2 border-primary/20">
                        <p className="font-bold text-base mb-1 text-primary">الطرف الأول (الشركة):</p>
                        <p className="font-semibold">{providerCompanyName || "اسم الشركة"}، ويمثلها في هذا العقد {providerName || "الممثل القانوني"}.</p>
                    </div>

                    <div className="mb-4 pr-4 border-r-2 border-primary/20">
                        <p className="font-bold text-base mb-1 text-primary">الطرف الثاني (العميل):</p>
                        <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                            <p className="mb-1">
                                السيد/السادة: <span className="font-bold text-slate-900">{values.client_name || "---"}</span>
                            </p>
                            {(values.company_name) && (
                                <p className="mb-1">
                                    ويمثل شركة/مؤسسة: <span className="font-medium text-slate-800">{values.company_name}</span>
                                </p>
                            )}
                            <div className="grid grid-cols-2 mt-2 gap-4 text-sm text-slate-600">
                                <p>📱 الهاتف: <span dir="ltr" className="inline-block text-right">{values.client_phone || "---"}</span></p>
                                <p>📧 البريد: {values.client_email || "---"}</p>
                            </div>
                        </div>
                    </div>

                    <p className="mt-6 font-medium text-slate-800">
                        تم الاتفاق والتراضي بين الطرفين وهما بكامل أهليتهما المعتبرة شرعاً وقانوناً على ما يلي:
                    </p>
                </section>

                {/* Scope of Work */}
                <section className="mb-8">
                    <h3 className="text-lg font-bold border-b-2 border-primary/20 text-primary w-fit mb-4 px-2 pb-1">البند الأول: مجال العمل</h3>
                    <p className="mb-4 text-sm leading-7">
                        يلتزم الطرف الأول بتقديم خدمات
                        <span className="font-bold px-2 text-slate-900 bg-slate-100 rounded mx-1">{values.service_type || "---"}</span>
                        وفقاً للتفاصيل التالية:
                    </p>

                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">الباقة/النطاق</p>
                                <p className="text-base font-bold text-slate-900">{values.package_name || "---"}</p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500 mb-1">وصف العمل</p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {values.service_description || "لا يوجد وصف إضافي."}
                                </p>
                            </div>
                        </div>

                        {values.features && values.features.length > 0 && (
                            <div className="mt-4">
                                <p className="font-bold mb-2">يشمل نطاق العمل:</p>
                                <ul className="list-disc leading-loose pr-5 text-slate-700 grid grid-cols-2 gap-x-4">
                                    {values.features.map((feature, i) => (
                                        <li key={i}>{feature}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </section>

                {/* Deliverables */}
                {values.deliverables && values.deliverables.length > 0 && (
                    <section className="mb-8">
                        <h3 className="text-lg font-bold border-b-2 border-slate-200 inline-block mb-3 px-2">البند الثاني: المخرجات النهائية</h3>
                        <ul className="list-decimal leading-loose pr-5 text-sm text-slate-800">
                            {values.deliverables.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Financials */}
                <section className="mb-8">
                    <h3 className="text-lg font-bold border-b-2 border-primary/20 text-primary inline-block mb-3 px-2 pb-1">البند {values.deliverables?.length ? "الثالث" : "الثاني"}: الأتعاب وطريقة الدفع</h3>
                    <div className="text-sm space-y-3 bg-slate-50 p-4 rounded-lg">
                        <p className="flex items-center gap-2">
                            <span className="font-bold text-primary">1.</span>
                            إجمالي قيمة العقد:
                            <span className="font-bold font-mono text-base bg-white px-2 py-0.5 rounded border shadow-sm">{formatCurrency(values.total_amount || 0)}</span>
                            فقط لا غير.
                        </p>
                        <p className="flex items-center gap-2 flex-wrap leading-loose">
                            <span className="font-bold text-primary">2.</span>
                            يلتزم الطرف الثاني بدفع دفعة مقدمة قدرها
                            <span className="font-bold mx-1">{values.deposit_percentage || 50}%</span>
                            من إجمالي قيمة العقد، وتعادل
                            <span className="font-bold font-mono mx-1 bg-white px-2 py-0.5 rounded border shadow-sm">{formatCurrency(((values.total_amount || 0) * (values.deposit_percentage || 50)) / 100)}</span>
                            عند توقيع هذا العقد.
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="font-bold text-primary">3.</span>
                            طريقة الدفع المتفق عليها: <span className="font-bold bg-white px-2 py-0.5 rounded border shadow-sm text-primary-700">{getSelectedPaymentMethodLabel(values.payment_method || '---')}</span>.
                        </p>
                    </div>
                </section>

                {/* Timeline */}
                <section className="mb-8">
                    <h3 className="text-lg font-bold border-b-2 border-primary/20 text-primary w-fit mb-3 px-2 pb-1">البند {values.deliverables?.length ? "الرابع" : "الثالث"}: المدة الزمنية</h3>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-sm leading-relaxed text-slate-700">
                            يلتزم الطرف الأول بتنفيذ الأعمال المتفق عليها خلال مدة
                            <span className="font-bold mx-2 text-slate-900">{values.timeline || "---"}</span>
                            تبدأ من تاريخ استلام الدفعة المقدمة وتوفير كافة المتطلبات اللازمة من الطرف الثاني.
                        </p>
                    </div>
                </section>

                {/* Notes */}
                {values.notes && (
                    <section className="mb-8">
                        <h3 className="text-lg font-bold border-b-2 border-slate-200 inline-block mb-3 px-2">البند {values.deliverables?.length ? "الخامس" : "الرابع"}: ملاحظات عامة</h3>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-800">
                            {values.notes}
                        </p>
                    </section>
                )}

                {/* Exceptional Terms */}
                {values.terms_notes && (
                    <section className="mb-8">
                        <h3 className="text-lg font-bold border-b-2 border-slate-200 inline-block mb-3 px-2">أحكام وشروط إضافية</h3>
                        <div className="bg-amber-50 border border-amber-200 rounded p-4 text-sm text-slate-800">
                            <p className="whitespace-pre-wrap leading-relaxed">{values.terms_notes}</p>
                        </div>
                    </section>
                )}

                {/* ID Cards Attachment */}
                {(idCards?.admin || idCards?.client) && (
                    <section className="mb-8 break-inside-avoid">
                        <h3 className="text-lg font-bold border-b-2 border-primary/30 text-primary inline-block mb-4 px-2 pb-1">ملحقات العقد: إثبات الهوية</h3>
                        <div className="grid grid-cols-2 gap-6">
                            {idCards.admin && (
                                <div className="bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200 rounded-xl p-5 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                                    <span className="text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">هوية الطرف الأول (الشركة)</span>
                                    <div className="w-full bg-white rounded-lg p-2 border border-blue-100 min-h-[60mm]">
                                        <img
                                            src={idCards.admin}
                                            alt="هوية الطرف الأول"
                                            className="w-full max-h-[60mm] object-contain rounded"
                                            onLoad={() => console.log('✅ Admin ID Card loaded successfully')}
                                            onError={(e) => console.error('❌ Admin ID Card failed to load:', e)}
                                            crossOrigin="anonymous"
                                        />
                                    </div>
                                </div>
                            )}
                            {idCards.client && (
                                <div className="bg-gradient-to-br from-green-50 to-slate-50 border-2 border-green-200 rounded-xl p-5 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                                    <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">هوية الطرف الثاني (العميل)</span>
                                    <div className="w-full bg-white rounded-lg p-2 border border-green-100 min-h-[60mm]">
                                        <img
                                            src={idCards.client}
                                            alt="هوية الطرف الثاني"
                                            className="w-full max-h-[60mm] object-contain rounded"
                                            onLoad={() => console.log('✅ Client ID Card loaded successfully')}
                                            onError={(e) => console.error('❌ Client ID Card failed to load:', e)}
                                            crossOrigin="anonymous"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Payment Proof Attachment */}
                {paymentProofUrl && (
                    <section className="mb-8 break-inside-avoid">
                        <h3 className="text-lg font-bold border-b-2 border-primary/30 text-primary inline-block mb-4 px-2 pb-1">ملحقات العقد: إثبات الدفع</h3>
                        <div className="bg-gradient-to-br from-amber-50 to-slate-50 border-2 border-amber-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-white rounded-lg p-3 border border-amber-100 min-h-[80mm]">
                                <img
                                    src={paymentProofUrl}
                                    alt="إثبات الدفع"
                                    className="w-full max-h-[80mm] object-contain rounded"
                                    onLoad={() => console.log('✅ Payment Proof loaded successfully')}
                                    onError={(e) => console.error('❌ Payment Proof failed to load:', e)}
                                    crossOrigin="anonymous"
                                />
                            </div>
                        </div>
                    </section>
                )}

                {/* Footer Signatures */}
                <div className="mt-12 mb-8 break-inside-avoid">
                    <div className="grid grid-cols-2 gap-16">
                        <div className="text-center">
                            <p className="font-bold mb-2 text-primary">الطرف الأول</p>
                            <p className="text-sm mb-6 text-muted-foreground">{providerCompanyName || "الشركة"}</p>
                            <div className="h-24 border-b-2 border-primary/40 w-3/4 mx-auto relative group flex items-end justify-center bg-gradient-to-t from-primary/5 to-transparent rounded-t-lg p-2">
                                {signatures?.admin ? (
                                    <img
                                        src={signatures.admin}
                                        alt="Admin Signature"
                                        className="max-h-full max-w-full object-contain drop-shadow-sm"
                                        onLoad={() => console.log('✅ Admin Signature loaded')}
                                        onError={(e) => console.error('❌ Admin Signature failed:', e)}
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <span className="text-[10px] text-gray-400 absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">التوقيع والختم</span>
                                )}
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="font-bold mb-2 text-primary">الطرف الثاني</p>
                            <p className="text-sm mb-6 text-muted-foreground">{values.client_name || "العميل"}</p>
                            <div className="h-24 border-b-2 border-primary/40 w-3/4 mx-auto relative flex items-end justify-center bg-gradient-to-t from-primary/5 to-transparent rounded-t-lg p-2">
                                {signatures?.client ? (
                                    <img
                                        src={signatures.client}
                                        alt="Client Signature"
                                        className="max-h-full max-w-full object-contain drop-shadow-sm"
                                        onLoad={() => console.log('✅ Client Signature loaded')}
                                        onError={(e) => console.error('❌ Client Signature failed:', e)}
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <span className="text-[10px] text-gray-400 absolute bottom-2 right-2">التوقيع</span>
                                )}
                            </div>

                            {/* OTP Verification Badge */}
                            {otpVerified && (
                                <div className="mt-3 flex items-center justify-center text-green-600 gap-1.5 text-xs font-bold border-2 border-green-300 bg-green-50 rounded-full px-3 py-1 mx-auto w-fit shadow-sm">
                                    <span className="text-sm">✓</span>
                                    <span>تم التحقق OTP</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-center mt-12 text-[10px] text-slate-400">
                        <p>حرر هذا العقد من نسختين بيد كل طرف نسخة للعمل بموجبها</p>
                        <p>Generated by Smart Contract System © {new Date().getFullYear()}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function getSelectedPaymentMethodLabel(method: string) {
    const methods: Record<string, string> = {
        'bank_transfer': 'تحويل بنكي',
        'instapay': 'InstaPay',
        'cash': 'نقدي',
        'vodafone_cash': 'فودافون كاش'
    }
    return methods[method] || method
}
