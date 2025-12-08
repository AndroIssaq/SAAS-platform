"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

/**
 * Success Checkmark Animation
 * Animated checkmark that draws on screen
 */
export function SuccessAnimation({ onComplete }: { onComplete?: () => void }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete?.()
        }, 1500)
        return () => clearTimeout(timer)
    }, [onComplete])

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center justify-center"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                className="relative"
            >
                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse" />
                <CheckCircle2 className="h-20 w-20 text-green-600 relative z-10" />
            </motion.div>
        </motion.div>
    )
}

/**
 * Celebration Confetti
 * Particle animation for success states
 */
export function CelebrationConfetti() {
    const [particles] = useState(() =>
        Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 0.5,
            duration: 1 + Math.random() * 2,
            color: ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'][
                Math.floor(Math.random() * 5)
            ],
        }))
    )

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                        backgroundColor: particle.color,
                        left: `${particle.x}%`,
                        top: '-10%',
                    }}
                    animate={{
                        y: ['0vh', '110vh'],
                        x: [0, Math.random() * 100 - 50],
                        rotate: [0, Math.random() * 360],
                        opacity: [1, 1, 0],
                    }}
                    transition={{
                        duration: particle.duration,
                        delay: particle.delay,
                        ease: 'easeOut',
                    }}
                />
            ))}
        </div>
    )
}

/**
 * Page Transition Wrapper
 * Smooth page transitions with fade and slide
 */
export function PageTransition({
    children,
    direction = 'right',
}: {
    children: React.ReactNode
    direction?: 'left' | 'right' | 'up' | 'down'
}) {
    const directions = {
        left: { x: -20, y: 0 },
        right: { x: 20, y: 0 },
        up: { x: 0, y: -20 },
        down: { x: 0, y: 20 },
    }

    const initial = directions[direction]

    return (
        <motion.div
            initial={{ opacity: 0, ...initial }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, ...initial }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
            {children}
        </motion.div>
    )
}

/**
 * Stagger Children Animation
 * Animates children with stagger effect
 */
export function StaggerChildren({
    children,
    staggerDelay = 0.1,
}: {
    children: React.ReactNode
    staggerDelay?: number
}) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
        >
            {children}
        </motion.div>
    )
}

export const staggerChildVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
}

/**
 * Loading Pulse
 * Pulse animation for loading states
 */
export function LoadingPulse({ text = "جاري التحميل..." }: { text?: string }) {
    return (
        <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <motion.div
                className="flex gap-1"
                animate={{
                    opacity: [0.3, 1, 0.3],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 bg-primary rounded-full"
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2,
                        }}
                    />
                ))}
            </motion.div>
            <span className="text-sm text-muted-foreground">{text}</span>
        </motion.div>
    )
}

/**
 * Shimmer Effect
 * Skeleton loading shimmer
 */
export function Shimmer({ className = "" }: { className?: string }) {
    return (
        <div className={`relative overflow-hidden bg-muted rounded ${className}`}>
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                    x: ['-100%', '100%'],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
        </div>
    )
}

/**
 * Sparkle Effect
 * Decorative sparkle animation
 */
export function SparkleEffect() {
    return (
        <motion.div
            animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        >
            <Sparkles className="h-5 w-5 text-yellow-500" />
        </motion.div>
    )
}

/**
 * Fade In Up
 * Simple fade in from bottom animation
 */
export function FadeInUp({
    children,
    delay = 0,
}: {
    children: React.ReactNode
    delay?: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            {children}
        </motion.div>
    )
}

/**
 * Scale In
 * Scale animation from center
 */
export function ScaleIn({
    children,
    delay = 0,
}: {
    children: React.ReactNode
    delay?: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay }}
        >
            {children}
        </motion.div>
    )
}
