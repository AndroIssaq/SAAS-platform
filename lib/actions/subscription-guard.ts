/**
 * Subscription Protection Middleware
 * Server-side checks for subscription status
 * This provides security that cannot be bypassed from client
 */

import { getSubscriptionStatus } from '@/lib/actions/subscriptions'

export class SubscriptionRequiredError extends Error {
    constructor(message: string = 'يجب الاشتراك لاستخدام هذه الميزة') {
        super(message)
        this.name = 'SubscriptionRequiredError'
    }
}

/**
 * Check if current account has active subscription or trial
 * Throws error if blocked
 * Use this at the start of any server action that should be protected
 */
export async function requireActiveSubscription(): Promise<void> {
    const status = await getSubscriptionStatus()

    if (status.isBlocked) {
        throw new SubscriptionRequiredError(
            'انتهت الفترة التجريبية. يرجى الاشتراك للاستمرار في استخدام المنصة.'
        )
    }
}

/**
 * Check subscription status without throwing
 * Returns { allowed: boolean, reason?: string }
 */
export async function checkSubscriptionAccess(): Promise<{
    allowed: boolean
    reason?: string
    daysRemaining?: number
}> {
    const status = await getSubscriptionStatus()

    if (status.isBlocked) {
        return {
            allowed: false,
            reason: 'انتهت الفترة التجريبية',
            daysRemaining: 0
        }
    }

    return {
        allowed: true,
        daysRemaining: status.trialDaysRemaining
    }
}

/**
 * Wrapper for protected server actions
 * Wraps any async function with subscription check
 */
export async function withSubscriptionCheck<T>(
    action: () => Promise<T>
): Promise<T> {
    await requireActiveSubscription()
    return action()
}
