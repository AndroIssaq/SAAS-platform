"use client"

import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { Shimmer } from "./animations"
import { cn } from "@/lib/utils"

/**
 * Circular Progress Indicator
 * Beautiful ring progress indicator like Apple's activity rings
 */
export function CircularProgress({
    progress,
    size = 120,
    strokeWidth = 8,
    className = "",
}: {
    progress: number
    size?: number
    strokeWidth?: number
    className?: string
}) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (progress / 100) * circumference

    return (
        <div className={cn("relative", className)} style={{ width: size, height: size }}>
            {/* Background circle */}
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    className="text-muted"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <motion.circle
                    className="text-primary"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                />
            </svg>
            {/* Progress text */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{Math.round(progress)}%</span>
            </div>
        </div>
    )
}

/**
 * Progress Steps
 * Multi-step progress indicator
 */
export function ProgressSteps({
    steps,
    currentStep,
}: {
    steps: string[]
    currentStep: number
}) {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep
                    const isCurrent = index === currentStep
                    const isUpcoming = index > currentStep

                    return (
                        <div key={index} className="flex flex-1 items-center">
                            {/* Step circle */}
                            <div className="flex flex-col items-center relative z-10">
                                <motion.div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-semibold border-2 transition-colors",
                                        isCompleted && "bg-primary border-primary text-primary-foreground",
                                        isCurrent && "bg-background border-primary text-primary ring-4 ring-primary/20",
                                        isUpcoming && "bg-muted border-muted-foreground/30 text-muted-foreground"
                                    )}
                                    initial={false}
                                    animate={{
                                        scale: isCurrent ? [1, 1.1, 1] : 1,
                                    }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {isCompleted ? (
                                        <motion.svg
                                            className="w-5 h-5"
                                            viewBox="0 0 24 24"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <motion.path
                                                d="M5 13l4 4L19 7"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </motion.svg>
                                    ) : (
                                        index + 1
                                    )}
                                </motion.div>
                                <span className="text-xs mt-2 text-center max-w-[100px] text-muted-foreground">
                                    {step}
                                </span>
                            </div>

                            {/* Connecting line */}
                            {index < steps.length - 1 && (
                                <div className="flex-1 h-0.5 mx-2 bg-muted relative -mt-8">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: "0%" }}
                                        animate={{ width: isCompleted ? "100%" : "0%" }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/**
 * Notification Skeleton
 */
export function NotificationSkeleton() {
    return (
        <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4">
                    <Shimmer className="w-12 h-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <Shimmer className="h-4 w-3/4" />
                        <Shimmer className="h-3 w-full" />
                        <Shimmer className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    )
}

/**
 * Contract Form Skeleton
 */
export function ContractFormSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <Shimmer className="h-8 w-64" />
                <Shimmer className="h-4 w-96" />
            </div>

            {[1, 2, 3].map((section) => (
                <div key={section} className="space-y-4 p-6 border rounded-lg">
                    <Shimmer className="h-6 w-48" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Shimmer className="h-4 w-24" />
                            <Shimmer className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Shimmer className="h-4 w-24" />
                            <Shimmer className="h-10 w-full" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

/**
 * Step Content Skeleton
 */
export function StepContentSkeleton() {
    return (
        <div className="space-y-6 p-6">
            <div className="space-y-2">
                <Shimmer className="h-8 w-3/4" />
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-5/6" />
            </div>

            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                        <Shimmer className="h-4 w-32" />
                        <Shimmer className="h-12 w-full rounded-lg" />
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <Shimmer className="h-10 flex-1 rounded-md" />
                <Shimmer className="h-10 w-32 rounded-md" />
            </div>
        </div>
    )
}

/**
 * Enhanced Loading Spinner
 */
export function LoadingSpinner({
    text = "جاري التحميل...",
    subtext,
}: {
    text?: string
    subtext?: string
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <motion.div
                animate={{
                    rotate: 360,
                }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                }}
            >
                <Loader2 className="h-8 w-8 text-primary" />
            </motion.div>
            <div className="text-center space-y-1">
                <p className="font-medium text-sm">{text}</p>
                {subtext && (
                    <p className="text-xs text-muted-foreground">{subtext}</p>
                )}
            </div>
        </div>
    )
}

/**
 * Multi-stage Progress Loader
 * Shows progress through multiple stages
 */
export function MultiStageLoader({
    stages,
    currentStage,
}: {
    stages: string[]
    currentStage: number
}) {
    return (
        <div className="space-y-6 p-6">
            <CircularProgress
                progress={((currentStage + 1) / stages.length) * 100}
                size={100}
            />

            <div className="space-y-2">
                {stages.map((stage, index) => {
                    const isCompleted = index < currentStage
                    const isCurrent = index === currentStage
                    const isUpcoming = index > currentStage

                    return (
                        <motion.div
                            key={index}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                                isCurrent && "bg-primary/10 border border-primary/20",
                                isCompleted && "text-green-600"
                            )}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {isCompleted && (
                                <motion.svg
                                    className="w-5 h-5 text-green-600"
                                    viewBox="0 0 24 24"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                >
                                    <path
                                        d="M5 13l4 4L19 7"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </motion.svg>
                            )}
                            {isCurrent && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                            {isUpcoming && <div className="w-5 h-5 rounded-full border-2 border-muted" />}

                            <span className={cn(
                                "text-sm font-medium",
                                isCurrent && "text-primary",
                                isUpcoming && "text-muted-foreground"
                            )}>
                                {stage}
                            </span>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
