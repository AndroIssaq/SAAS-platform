"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    Sparkles,
    Mail,
    MessageSquare,
    Bell,
    Users,
    Zap,
    MousePointerClick,
    ArrowRight,
    Star,
    Layers,
    LayoutTemplate
} from "lucide-react"
import { createForm } from "@/lib/actions/forms"
import type { FormConfig } from "@/lib/types/forms"

interface Template {
    id: string
    name: string
    description: string
    category: 'newsletter' | 'contact' | 'feedback' | 'popup' | 'lead'
    icon: React.ReactNode
    badge?: string
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
    config: FormConfig
}

const templates: Template[] = [
    {
        id: 'newsletter-simple',
        name: 'اشتراك نشرة بريدية',
        description: 'فورم بسيطة لجمع الإيميلات للنشرة البريدية',
        category: 'newsletter',
        icon: <Mail className="h-6 w-6" />,
        badge: 'الأكثر استخداماً',
        badgeVariant: 'default',
        config: {
            fields: [
                { id: 'email', type: 'email', name: 'email', label: 'البريد الإلكتروني', placeholder: 'أدخل بريدك الإلكتروني', required: true, isPrimaryEmail: true }
            ],
            theme: {
                primaryColor: '#6366f1',
                background: 'light',
                radius: 'md',
                size: 'md',
                submitLabel: 'اشترك الآن',
                publicTitle: 'اشترك في نشرتنا البريدية',
                publicSubtitle: 'احصل على آخر الأخبار والتحديثات مباشرة في بريدك',
                layout: 'stacked',
                spacing: 'normal',
                titleAlign: 'center',
                buttonAlign: 'stretch'
            },
            embed: {
                mode: 'inline',
                maxWidth: 480
            }
        }
    },
    {
        id: 'contact-form',
        name: 'تواصل معنا',
        description: 'فورم تواصل كاملة مع الاسم والبريد والرسالة',
        category: 'contact',
        icon: <MessageSquare className="h-6 w-6" />,
        config: {
            fields: [
                { id: 'name', type: 'text', name: 'name', label: 'الاسم الكامل', placeholder: 'أدخل اسمك', required: true },
                { id: 'email', type: 'email', name: 'email', label: 'البريد الإلكتروني', placeholder: 'أدخل بريدك', required: true, isPrimaryEmail: true },
                { id: 'phone', type: 'phone', name: 'phone', label: 'رقم الهاتف', placeholder: '05xxxxxxxx', required: false },
                { id: 'message', type: 'textarea', name: 'message', label: 'رسالتك', placeholder: 'اكتب رسالتك هنا...', required: true }
            ],
            theme: {
                primaryColor: '#10b981',
                background: 'light',
                radius: 'lg',
                size: 'md',
                submitLabel: 'إرسال الرسالة',
                publicTitle: 'تواصل معنا',
                publicSubtitle: 'نحن هنا للإجابة على استفساراتك',
                layout: 'stacked',
                spacing: 'comfortable',
                titleAlign: 'right',
                buttonAlign: 'stretch'
            },
            embed: {
                mode: 'inline',
                maxWidth: 560
            }
        }
    },
    {
        id: 'lead-capture',
        name: 'جمع العملاء المحتملين',
        description: 'فورم متكاملة لجمع بيانات العملاء المهتمين',
        category: 'lead',
        icon: <Users className="h-6 w-6" />,
        badge: 'للمبيعات',
        badgeVariant: 'secondary',
        config: {
            fields: [
                { id: 'name', type: 'text', name: 'name', label: 'الاسم', placeholder: 'اسمك الكريم', required: true },
                { id: 'email', type: 'email', name: 'email', label: 'البريد الإلكتروني', placeholder: 'بريدك الإلكتروني', required: true, isPrimaryEmail: true },
                { id: 'phone', type: 'phone', name: 'phone', label: 'رقم الجوال', placeholder: '05xxxxxxxx', required: true },
                { id: 'company', type: 'text', name: 'company', label: 'اسم الشركة', placeholder: 'اسم شركتك (اختياري)', required: false }
            ],
            theme: {
                primaryColor: '#f59e0b',
                background: 'light',
                radius: 'md',
                size: 'md',
                submitLabel: 'أرسل طلبك',
                publicTitle: 'احصل على عرض مخصص',
                publicSubtitle: 'اترك بياناتك وسنتواصل معك خلال 24 ساعة',
                layout: 'stacked',
                spacing: 'normal',
                titleAlign: 'center',
                buttonAlign: 'stretch'
            },
            embed: {
                mode: 'inline',
                maxWidth: 520
            }
        }
    },
    {
        id: 'popup-newsletter',
        name: 'Popup للاشتراكات',
        description: 'نافذة منبثقة جذابة لزيادة الاشتراكات',
        category: 'popup',
        icon: <Bell className="h-6 w-6" />,
        badge: 'يزيد التحويلات',
        badgeVariant: 'destructive',
        config: {
            fields: [
                { id: 'email', type: 'email', name: 'email', label: 'بريدك الإلكتروني', placeholder: 'example@email.com', required: true, isPrimaryEmail: true }
            ],
            theme: {
                primaryColor: '#8b5cf6',
                background: 'dark',
                radius: 'lg',
                size: 'lg',
                submitLabel: '🎁 احصل على الخصم',
                publicTitle: '🔥 خصم 20% على طلبك الأول!',
                publicSubtitle: 'اشترك الآن واحصل على كود خصم حصري',
                layout: 'stacked',
                spacing: 'comfortable',
                titleAlign: 'center',
                buttonAlign: 'stretch'
            },
            embed: {
                mode: 'popup',
                maxWidth: 440,
                popupDelayMs: 5000,
                popupOncePerSession: true,
                popupHeightVh: 60
            }
        }
    },
    {
        id: 'feedback-form',
        name: 'استطلاع رأي',
        description: 'اجمع آراء العملاء وملاحظاتهم',
        category: 'feedback',
        icon: <Star className="h-6 w-6" />,
        config: {
            fields: [
                { id: 'name', type: 'text', name: 'name', label: 'اسمك', placeholder: 'اسمك (اختياري)', required: false },
                { id: 'email', type: 'email', name: 'email', label: 'البريد الإلكتروني', placeholder: 'للتواصل معك', required: false, isPrimaryEmail: true },
                {
                    id: 'rating', type: 'select', name: 'rating', label: 'تقييمك للخدمة', required: true, options: [
                        { value: '5', label: '⭐⭐⭐⭐⭐ ممتاز' },
                        { value: '4', label: '⭐⭐⭐⭐ جيد جداً' },
                        { value: '3', label: '⭐⭐⭐ جيد' },
                        { value: '2', label: '⭐⭐ مقبول' },
                        { value: '1', label: '⭐ ضعيف' }
                    ]
                },
                { id: 'feedback', type: 'textarea', name: 'feedback', label: 'ملاحظاتك', placeholder: 'شاركنا رأيك وملاحظاتك...', required: false }
            ],
            theme: {
                primaryColor: '#ec4899',
                background: 'light',
                radius: 'md',
                size: 'md',
                submitLabel: 'إرسال التقييم',
                publicTitle: 'شاركنا رأيك',
                publicSubtitle: 'نقدر ملاحظاتك لتحسين خدماتنا',
                layout: 'stacked',
                spacing: 'normal',
                titleAlign: 'center',
                buttonAlign: 'stretch'
            },
            embed: {
                mode: 'inline',
                maxWidth: 500
            }
        }
    },
    {
        id: 'quick-signup',
        name: 'تسجيل سريع',
        description: 'فورم خفيفة للتسجيل السريع بخطوة واحدة',
        category: 'newsletter',
        icon: <Zap className="h-6 w-6" />,
        config: {
            fields: [
                { id: 'email', type: 'email', name: 'email', label: '', placeholder: 'بريدك الإلكتروني', required: true, isPrimaryEmail: true }
            ],
            theme: {
                primaryColor: '#06b6d4',
                background: 'light',
                radius: 'full',
                size: 'sm',
                submitLabel: 'تسجيل →',
                publicTitle: '',
                publicSubtitle: '',
                layout: 'stacked',
                spacing: 'compact',
                titleAlign: 'center',
                buttonAlign: 'stretch'
            },
            embed: {
                mode: 'inline',
                maxWidth: 400
            }
        }
    }
]

const categoryLabels: Record<string, { label: string; color: string }> = {
    newsletter: { label: 'نشرة بريدية', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    contact: { label: 'تواصل', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
    feedback: { label: 'استطلاع', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
    popup: { label: 'Popup', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
    lead: { label: 'Leads', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' }
}

export default function TemplatesPage() {
    const router = useRouter()
    const [isCreating, setIsCreating] = useState<string | null>(null)

    const handleUseTemplate = async (template: Template) => {
        setIsCreating(template.id)

        try {
            const result = await createForm({
                title: template.name,
                description: template.description,
                config: template.config
            })

            if (result.success && result.id) {
                router.push(`/admin/forms/${result.id}`)
            } else {
                alert(result.error || 'فشل في إنشاء الفورم')
                setIsCreating(null)
            }
        } catch (err) {
            console.error('Error creating form from template:', err)
            alert('حدث خطأ غير متوقع')
            setIsCreating(null)
        }
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl space-y-8">
            {/* Header */}
            <div>
                <Button variant="ghost" asChild className="mb-2 -mr-4">
                    <Link href="/admin/forms">
                        <ArrowLeft className="ml-2 h-4 w-4" />
                        العودة للفورمز
                    </Link>
                </Button>

                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl">
                        <LayoutTemplate className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            القوالب الجاهزة
                            <Sparkles className="h-6 w-6 text-yellow-500" />
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            اختر قالباً جاهزاً وابدأ في دقائق، يمكنك تخصيصه لاحقاً
                        </p>
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Layers className="h-4 w-4 ml-1" />
                    الكل ({templates.length})
                </Badge>
                {Object.entries(categoryLabels).map(([key, { label }]) => (
                    <Badge
                        key={key}
                        variant="outline"
                        className="px-4 py-2 cursor-pointer hover:bg-muted transition-colors"
                    >
                        {label} ({templates.filter(t => t.category === key).length})
                    </Badge>
                ))}
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => {
                    const category = categoryLabels[template.category]
                    const isLoading = isCreating === template.id

                    return (
                        <Card
                            key={template.id}
                            className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/30"
                        >
                            {/* Gradient Header */}
                            <div className="h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
                                <div className="p-4 bg-white dark:bg-card rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <div className="text-primary">{template.icon}</div>
                                </div>

                                {/* Badge */}
                                {template.badge && (
                                    <Badge
                                        variant={template.badgeVariant || 'default'}
                                        className="absolute top-3 left-3"
                                    >
                                        {template.badge}
                                    </Badge>
                                )}

                                {/* Category Badge */}
                                <Badge
                                    variant="outline"
                                    className={`absolute top-3 right-3 ${category.color}`}
                                >
                                    {category.label}
                                </Badge>
                            </div>

                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                <CardDescription className="text-sm line-clamp-2">
                                    {template.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pt-2">
                                {/* Fields Preview */}
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {template.config.fields.slice(0, 4).map(field => (
                                        <Badge key={field.id} variant="secondary" className="text-xs">
                                            {field.label || field.name}
                                        </Badge>
                                    ))}
                                    {template.config.fields.length > 4 && (
                                        <Badge variant="secondary" className="text-xs">
                                            +{template.config.fields.length - 4}
                                        </Badge>
                                    )}
                                </div>

                                {/* Theme Preview */}
                                <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                                    <div
                                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                        style={{ backgroundColor: template.config.theme.primaryColor }}
                                    />
                                    <span>
                                        {template.config.embed.mode === 'popup' ? 'Popup' : 'Inline'} •
                                        {template.config.theme.background === 'dark' ? ' داكن' : ' فاتح'}
                                    </span>
                                </div>

                                {/* Action Button */}
                                <Button
                                    className="w-full group/btn"
                                    onClick={() => handleUseTemplate(template)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2" />
                                            جاري الإنشاء...
                                        </>
                                    ) : (
                                        <>
                                            استخدم هذا القالب
                                            <ArrowRight className="mr-2 h-4 w-4 group-hover/btn:-translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Create Custom CTA */}
            <Card className="border-dashed border-2 bg-muted/20">
                <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-8">
                    <div className="text-center md:text-right">
                        <h3 className="text-lg font-semibold">لا تجد ما تبحث عنه؟</h3>
                        <p className="text-muted-foreground text-sm">
                            أنشئ فورم مخصصة من الصفر بالتصميم والحقول التي تريدها
                        </p>
                    </div>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/admin/forms/new">
                            <MousePointerClick className="ml-2 h-5 w-5" />
                            إنشاء فورم مخصصة
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
