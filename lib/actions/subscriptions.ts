'use server'

/**
 * Subscription Management Server Actions
 * Handles trial, subscription status, and payment management
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentAccount } from '@/lib/actions/account'
import {
    PLANS,
    PAYMENT_METHODS,
    TRIAL_DAYS,
    type PlanId,
    type PaymentMethod,
    type SubscriptionStatusResult,
    type Plan
} from '@/lib/config/subscription-plans'

// ==================== Trial Functions ====================

/**
 * Get subscription status for current account
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatusResult> {
    const accountResult = await getCurrentAccount()

    if (!accountResult.success || !accountResult.accountId) {
        return {
            status: 'expired',
            trialDaysRemaining: 0,
            trialEndsAt: null,
            isBlocked: true,
            currentPlan: null,
            subscriptionEndsAt: null,
        }
    }

    const supabase = await createClient()

    // Get account info - handle case where new columns don't exist yet
    const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('created_at, trial_started_at, subscription_status, plan')
        .eq('id', accountResult.accountId)
        .single()

    if (accountError || !account) {
        console.error('Error fetching account:', accountError)
        // Default to trial for new accounts if can't fetch
        return {
            status: 'trial',
            trialDaysRemaining: 14,
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            isBlocked: false,
            currentPlan: null,
            subscriptionEndsAt: null,
        }
    }

    // Check for active subscription (only if subscriptions table exists)
    let subscription = null
    try {
        const { data } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('account_id', accountResult.accountId)
            .eq('status', 'active')
            .single()
        subscription = data
    } catch (e) {
        // subscriptions table might not exist yet - that's OK
        console.log('Subscriptions table not found, using trial mode')
    }

    if (subscription) {
        const plan = PLANS.find(p => p.id === subscription.plan_id) || null
        return {
            status: 'active',
            trialDaysRemaining: 0,
            trialEndsAt: null,
            isBlocked: false,
            currentPlan: plan,
            subscriptionEndsAt: subscription.ends_at ? new Date(subscription.ends_at) : null,
        }
    }

    // Calculate trial status
    // Use trial_started_at if exists, otherwise use created_at
    const trialStartDate = account.trial_started_at || account.created_at || new Date().toISOString()
    const trialStartedAt = new Date(trialStartDate)
    const trialEndsAt = new Date(trialStartedAt)
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

    const now = new Date()
    const diffMs = trialEndsAt.getTime() - now.getTime()
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    const isTrialExpired = daysRemaining <= 0

    return {
        status: isTrialExpired ? 'expired' : 'trial',
        trialDaysRemaining: daysRemaining,
        trialEndsAt,
        isBlocked: isTrialExpired,
        currentPlan: null,
        subscriptionEndsAt: null,
    }
}

/**
 * Get trial days remaining
 */
export async function getTrialDaysRemaining(): Promise<number> {
    const status = await getSubscriptionStatus()
    return status.trialDaysRemaining
}

/**
 * Check if account is blocked (expired trial, no active subscription)
 */
export async function isAccountBlocked(): Promise<boolean> {
    const status = await getSubscriptionStatus()
    return status.isBlocked
}

/**
 * Start trial for account (called on account creation)
 */
export async function startTrial(accountId: string): Promise<boolean> {
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('accounts')
        .update({
            trial_started_at: new Date().toISOString(),
            subscription_status: 'trial',
        })
        .eq('id', accountId)

    return !error
}

// ==================== Payment Functions ====================

/**
 * Submit a payment for review
 */
export async function submitPaymentForReview(data: {
    planId: PlanId
    paymentMethod: PaymentMethod
    transactionReference?: string
    proofImagePath?: string
    notes?: string
}): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    const accountResult = await getCurrentAccount()

    if (!accountResult.success || !accountResult.accountId) {
        return { success: false, error: 'لم يتم العثور على حساب' }
    }

    const plan = PLANS.find(p => p.id === data.planId)
    if (!plan) {
        return { success: false, error: 'الباقة غير موجودة' }
    }

    const supabase = await createClient()

    // Create pending subscription
    const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
            account_id: accountResult.accountId,
            plan_id: plan.id,
            plan_name: plan.nameAr,
            price_egp: plan.priceEgp,
            status: 'pending',
        })
        .select()
        .single()

    if (subError) {
        console.error('Error creating subscription:', subError)
        return { success: false, error: 'حدث خطأ أثناء إنشاء الاشتراك' }
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
            subscription_id: subscription.id,
            account_id: accountResult.accountId,
            amount_egp: plan.priceEgp,
            payment_method: data.paymentMethod,
            transaction_reference: data.transactionReference,
            proof_image_path: data.proofImagePath,
            notes: data.notes,
            review_status: 'pending',
        })
        .select()
        .single()

    if (paymentError) {
        console.error('Error creating payment:', paymentError)
        return { success: false, error: 'حدث خطأ أثناء تسجيل الدفع' }
    }

    return { success: true, paymentId: payment.id }
}

/**
 * Approve a payment (admin only)
 */
export async function approvePayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
    const adminClient = createAdminClient()

    // Get payment details
    const { data: payment, error: fetchError } = await adminClient
        .from('subscription_payments')
        .select('*, subscription:subscriptions(*)')
        .eq('id', paymentId)
        .single()

    if (fetchError || !payment) {
        return { success: false, error: 'الدفعة غير موجودة' }
    }

    const now = new Date()
    const endsAt = new Date(now)
    endsAt.setMonth(endsAt.getMonth() + 1) // Monthly subscription

    // Update payment status
    const { error: paymentError } = await adminClient
        .from('subscription_payments')
        .update({
            review_status: 'approved',
            reviewed_at: now.toISOString(),
        })
        .eq('id', paymentId)

    if (paymentError) {
        return { success: false, error: 'فشل في تحديث حالة الدفع' }
    }

    // Activate subscription
    const { error: subError } = await adminClient
        .from('subscriptions')
        .update({
            status: 'active',
            starts_at: now.toISOString(),
            ends_at: endsAt.toISOString(),
        })
        .eq('id', payment.subscription_id)

    if (subError) {
        return { success: false, error: 'فشل في تفعيل الاشتراك' }
    }

    // Update account status
    const { error: accountError } = await adminClient
        .from('accounts')
        .update({
            subscription_status: 'active',
            plan: payment.subscription?.plan_id || 'small_office',
        })
        .eq('id', payment.account_id)

    if (accountError) {
        console.error('Error updating account:', accountError)
    }

    return { success: true }
}

/**
 * Reject a payment (admin only)
 */
export async function rejectPayment(paymentId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('subscription_payments')
        .update({
            review_status: 'rejected',
            rejection_reason: reason,
            reviewed_at: new Date().toISOString(),
        })
        .eq('id', paymentId)

    if (error) {
        return { success: false, error: 'فشل في رفض الدفعة' }
    }

    return { success: true }
}

/**
 * Get pending payments (admin only)
 */
export async function getPendingPayments(): Promise<any[]> {
    const adminClient = createAdminClient()

    const { data } = await adminClient
        .from('subscription_payments')
        .select(`
      *,
      account:accounts(name, slug),
      subscription:subscriptions(plan_id, plan_name, price_egp)
    `)
        .eq('review_status', 'pending')
        .order('created_at', { ascending: false })

    return data || []
}

/**
 * Get current account's payment history
 */
export async function getPaymentHistory(): Promise<any[]> {
    const accountResult = await getCurrentAccount()

    if (!accountResult.success || !accountResult.accountId) {
        return []
    }

    const supabase = await createClient()

    const { data } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('account_id', accountResult.accountId)
        .order('created_at', { ascending: false })

    return data || []
}

/**
 * Get available plans (async wrapper)
 */
export async function getPlans(): Promise<Plan[]> {
    return PLANS
}

/**
 * Get payment methods (async wrapper)
 */
export async function getPaymentMethods() {
    return PAYMENT_METHODS
}
