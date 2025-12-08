"use client"

/**
 * Encryption Explanation Step
 * Beautiful animated step explaining Zero-Knowledge encryption to clients
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Shield,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    Sparkles,
    Key,
    Database,
    UserCheck,
    ArrowRight,
    Loader2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface EncryptionExplanationStepProps {
    contractId: string
    participant: string
    onContinue: () => void
}

export function EncryptionExplanationStep({
    contractId,
    participant,
    onContinue,
}: EncryptionExplanationStepProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [understood, setUnderstood] = useState(false)
    const [animateShield, setAnimateShield] = useState(false)

    useEffect(() => {
        // Trigger shield animation
        const timer = setTimeout(() => setAnimateShield(true), 500)
        return () => clearTimeout(timer)
    }, [])

    const features = [
        {
            icon: Lock,
            title: "تشفير من الطرف إلى الطرف",
            description: "بياناتك مشفرة قبل حفظها في قاعدة البيانات",
            color: "from-blue-500 to-cyan-500",
        },
        {
            icon: EyeOff,
            title: "حتى نحن لا نستطيع رؤيتها",
            description: "حتى مالك المنصة لا يستطيع الوصول لبياناتك الشخصية",
            color: "from-purple-500 to-pink-500",
        },
        {
            icon: UserCheck,
            title: "أنت فقط من يراها",
            description: "فقط أنت والأطراف المصرح لهم يمكنهم رؤية معلوماتك",
            color: "from-green-500 to-emerald-500",
        },
    ]

    const encryptionSteps = [
        { icon: Database, text: "بياناتك في قاعدة البيانات", encrypted: false },
        { icon: Key, text: "يتم التشفير بمفتاح خاص", encrypted: true },
        { icon: Lock, text: "محفوظة بشكل آمن 100%", encrypted: true },
    ]

    return (
        <div className="space-y-6">
            {/* Hero Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden relative">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse" />

                    <CardHeader className="text-center relative z-10">
                        <motion.div
                            className="flex justify-center mb-4"
                            animate={animateShield ? {
                                scale: [1, 1.2, 1],
                                rotate: [0, 5, -5, 0],
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                <Shield className="h-20 w-20 text-primary relative z-10" />
                            </div>
                        </motion.div>

                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent animate-gradient">
                            🔐 عقدك محمي بأقصى درجات الأمان
                        </CardTitle>
                        <CardDescription className="text-lg mt-2">
                            تقنية التشفير من الطرف إلى الطرف (Zero-Knowledge Encryption)
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 relative z-10">
                        {/* Features Grid */}
                        <div className="grid md:grid-cols-3 gap-4">
                            {features.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.2 + 0.3 }}
                                >
                                    <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:scale-105 cursor-pointer dark:bg-card/50 backdrop-blur">
                                        <CardContent className="pt-6 text-center">
                                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${feature.color} p-0.5`}>
                                                <div className="w-full h-full bg-background dark:bg-card rounded-full flex items-center justify-center">
                                                    <feature.icon className="h-8 w-8 text-primary" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold mb-2">{feature.title}</h3>
                                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Encryption Process Visualization */}
                        <Card className="bg-muted/50 dark:bg-muted/20 border-dashed">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-yellow-500" />
                                    كيف يعمل التشفير؟
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between gap-4">
                                    {encryptionSteps.map((step, idx) => (
                                        <motion.div
                                            key={idx}
                                            className="flex-1"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.3 + 0.6 }}
                                        >
                                            <div className="text-center space-y-3">
                                                <motion.div
                                                    className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${step.encrypted
                                                            ? "bg-green-500/20 dark:bg-green-500/30 border-2 border-green-500"
                                                            : "bg-muted dark:bg-muted/50 border-2 border-border"
                                                        }`}
                                                    animate={step.encrypted ? {
                                                        boxShadow: [
                                                            "0 0 0 0 rgba(34, 197, 94, 0)",
                                                            "0 0 0 10px rgba(34, 197, 94, 0.3)",
                                                            "0 0 0 0 rgba(34, 197, 94, 0)",
                                                        ],
                                                    } : {}}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                >
                                                    <step.icon className={`h-8 w-8 ${step.encrypted ? "text-green-500" : "text-muted-foreground"}`} />
                                                </motion.div>
                                                <p className="text-sm font-medium">{step.text}</p>
                                                {step.encrypted && (
                                                    <Badge className="bg-green-600">
                                                        <Lock className="h-3 w-3 mr-1" />
                                                        مشفر
                                                    </Badge>
                                                )}
                                            </div>
                                            {idx < encryptionSteps.length - 1 && (
                                                <motion.div
                                                    className="absolute top-1/4 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary to-green-500"
                                                    initial={{ scaleX: 0 }}
                                                    animate={{ scaleX: 1 }}
                                                    transition={{ delay: idx * 0.3 + 0.9, duration: 0.5 }}
                                                    style={{ transformOrigin: "left" }}
                                                />
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* What This Means */}
                        <Alert className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p className="font-bold text-lg">ماذا يعني هذا لك؟</p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span>معلوماتك الشخصية (الاسم، الإيميل، الهاتف) <strong>مشفرة بالكامل</strong></span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span>حتى إذا تم اختراق قاعدة البيانات، <strong>لن يتمكن أحد من قراءة بياناتك</strong></span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span>نحن نلتزم بأعلى معايير الخصوصية <strong>(GDPR, SOC2)</strong></span>
                                        </li>
                                    </ul>
                                </div>
                            </AlertDescription>
                        </Alert>

                        {/* Confirmation Checkbox */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                        >
                            <Card className="border-2 border-primary dark:bg-card/50">
                                <CardContent className="pt-6">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={understood}
                                            onChange={(e) => setUnderstood(e.target.checked)}
                                            className="mt-1 w-5 h-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold group-hover:text-primary transition-colors">
                                                أفهم وأوافق على آلية التشفير
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                أدرك أن بياناتي محمية بتشفير من الطرف إلى الطرف وأن هذا يوفر أقصى درجات الأمان لمعلوماتي الشخصية
                                            </p>
                                        </div>
                                    </label>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Continue Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.8 }}
                        >
                            <Button
                                size="lg"
                                className="w-full relative overflow-hidden group"
                                onClick={onContinue}
                                disabled={!understood}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {understood ? (
                                        <>
                                            <CheckCircle2 className="h-5 w-5" />
                                            متابعة لإتمام العقد
                                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-5 w-5" />
                                            يرجى الموافقة للمتابعة
                                        </>
                                    )}
                                </span>
                                {understood && (
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-primary"
                                        animate={{
                                            x: ["-100%", "100%"],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "linear",
                                        }}
                                        style={{ opacity: 0.3 }}
                                    />
                                )}
                            </Button>
                        </motion.div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
