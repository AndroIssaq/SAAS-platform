'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendContractNotification } from './notifications'
import { sendPaymentApprovalEmail, sendPaymentRejectionEmail } from './emails'

/**
 * Server Action: Approve Payment Proof
 */
export async function approvePaymentProof(data: {
  paymentProofId: string
  contractId: string
  reviewNotes?: string
}) {
  try {
    const supabase = await createClient()

    // Get current user (admin/reviewer)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'غير مصرح. يرجى تسجيل الدخول.' }
    }

    // Get contract and payment proof details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*, payment_proofs(*)')
      .eq('id', data.contractId)
      .single()

    if (contractError || !contract) {
      return { success: false, error: 'العقد غير موجود' }
    }

    // Update payment proof status
    const { error: updateProofError } = await supabase
      .from('payment_proofs')
      .update({
        review_status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: data.reviewNotes || null
      })
      .eq('id', data.paymentProofId)

    if (updateProofError) {
      return { success: false, error: 'فشل في تحديث حالة الدفع' }
    }

    // Update contract - move to step 8 (finalization)
    const { error: updateContractError } = await supabase
      .from('contracts')
      .update({
        current_step: 8,
        workflow_status: 'payment_approved',
        status: 'active',
        step_7_completed: true,
        step_7_data: {
          payment_approved_at: new Date().toISOString(),
          approved_by: user.id,
          payment_proof_id: data.paymentProofId
        }
      })
      .eq('id', data.contractId)

    if (updateContractError) {
      return { success: false, error: 'فشل في تحديث حالة العقد' }
    }

    // Log activity
    await supabase.from('contract_activities').insert({
      account_id: contract.account_id,
      contract_id: data.contractId,
      activity_type: 'payment_approved',
      description: `تم قبول إثبات الدفع من قبل ${user.email}`,
      metadata: {
        payment_proof_id: data.paymentProofId,
        approved_by: user.id,
        review_notes: data.reviewNotes,
        timestamp: new Date().toISOString()
      }
    })

    // Get client user ID
    const { data: clientUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', contract.client_email)
      .single()

    // Send notification to client
    if (clientUser) {
      await sendContractNotification({
        userId: clientUser.id,
        contractId: data.contractId,
        contractNumber: contract.contract_number,
        type: 'payment_approved'
      })
    }

    // Send approval email
    sendPaymentApprovalEmail({
      to: contract.client_email,
      clientName: contract.client_name,
      contractNumber: contract.contract_number,
      contractId: data.contractId,
      amount: Number(contract.deposit_amount)
    }).catch(err => {
      console.error('Email sending failed (non-blocking):', err)
    })

    // Revalidate paths
    revalidatePath('/admin/payments')
    revalidatePath(`/admin/contracts/${data.contractId}`)
    revalidatePath(`/client/contracts/${data.contractId}`)

    return {
      success: true,
      message: 'تم قبول إثبات الدفع بنجاح'
    }
  } catch (error) {
    console.error('Error approving payment:', error)
    return {
      success: false,
      error: 'حدث خطأ غير متوقع'
    }
  }
}

/**
 * Server Action: Reject Payment Proof
 */
export async function rejectPaymentProof(data: {
  paymentProofId: string
  contractId: string
  rejectionReason: string
}) {
  try {
    const supabase = await createClient()

    // Get current user (admin/reviewer)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'غير مصرح. يرجى تسجيل الدخول.' }
    }

    if (!data.rejectionReason.trim()) {
      return { success: false, error: 'يرجى إدخال سبب الرفض' }
    }

    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', data.contractId)
      .single()

    if (contractError || !contract) {
      return { success: false, error: 'العقد غير موجود' }
    }

    // Update payment proof status
    const { error: updateProofError } = await supabase
      .from('payment_proofs')
      .update({
        review_status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: data.rejectionReason
      })
      .eq('id', data.paymentProofId)

    if (updateProofError) {
      return { success: false, error: 'فشل في تحديث حالة الدفع' }
    }

    // Update contract workflow status
    const { error: updateContractError } = await supabase
      .from('contracts')
      .update({
        workflow_status: 'payment_proof_rejected'
      })
      .eq('id', data.contractId)

    if (updateContractError) {
      return { success: false, error: 'فشل في تحديث حالة العقد' }
    }

    // Log activity
    await supabase.from('contract_activities').insert({
      account_id: contract.account_id,
      contract_id: data.contractId,
      activity_type: 'payment_rejected',
      description: `تم رفض إثبات الدفع: ${data.rejectionReason}`,
      metadata: {
        payment_proof_id: data.paymentProofId,
        rejected_by: user.id,
        rejection_reason: data.rejectionReason,
        timestamp: new Date().toISOString()
      }
    })

    // Get client user ID
    const { data: clientUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', contract.client_email)
      .single()

    // Send notification to client
    if (clientUser) {
      await sendContractNotification({
        userId: clientUser.id,
        contractId: data.contractId,
        contractNumber: contract.contract_number,
        type: 'payment_rejected',
        customMessage: `تم رفض إثبات الدفع: ${data.rejectionReason}`
      })
    }

    // Send rejection email
    sendPaymentRejectionEmail({
      to: contract.client_email,
      clientName: contract.client_name,
      contractNumber: contract.contract_number,
      contractId: data.contractId,
      rejectionReason: data.rejectionReason
    }).catch(err => {
      console.error('Email sending failed (non-blocking):', err)
    })

    // Revalidate paths
    revalidatePath('/admin/payments')
    revalidatePath(`/admin/contracts/${data.contractId}`)
    revalidatePath(`/client/contracts/${data.contractId}`)

    return {
      success: true,
      message: 'تم رفض إثبات الدفع'
    }
  } catch (error) {
    console.error('Error rejecting payment:', error)
    return {
      success: false,
      error: 'حدث خطأ غير متوقع'
    }
  }
}

/**
 * Server Action: Get Pending Payment Proofs
 */
export async function getPendingPaymentProofs() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('payment_proofs')
      .select(`
        *,
        contracts(
          id,
          contract_number,
          client_name,
          client_email,
          service_type,
          total_amount,
          deposit_amount
        )
      `)
      .eq('review_status', 'pending')
      .order('uploaded_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'فشل في جلب إثباتات الدفع' }
  }
}
