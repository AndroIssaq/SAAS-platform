/**
 * Contract PDF Generation Actions
 * Server-side actions to fetch and prepare contract data for PDF
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encryption'

export interface ContractPDFData {
  // Basic Info
  id: string
  contract_number: string
  created_at: string
  contract_link_token?: string

  // Parties
  client_name: string
  client_email: string
  client_phone: string
  company_name?: string
  provider_company_name?: string
  provider_name?: string
  created_by?: string // Legal representative name

  // Service Details
  service_type: string
  package_name: string
  service_description: string

  // Financial
  total_amount: number
  deposit_amount: number
  remaining_amount: number
  payment_method: string

  // Terms
  timeline: string
  deliverables: string[]
  notes?: string
  contract_terms?: any // JSONB with services, revisions, etc.
  payment_schedule?: any[] // Array of payment dates

  // Legal Proofs
  admin_signature?: string
  client_signature?: string
  admin_signature_at?: string
  client_signature_at?: string
  admin_id_card?: string
  client_id_card?: string

  // Payment Proof Details
  payment_proof?: {
    proof_image_url: string
    transaction_reference?: string
    amount: number
    uploaded_at: string
    review_status?: string
    review_notes?: string
  }

  // Affiliate Info
  affiliate?: {
    name?: string
    commission_rate?: number
    commission_amount?: number
  }

  // Audit Trail
  admin_ip?: string
  client_ip?: string
}

/**
 * Fetch complete contract data for PDF generation
 */
export async function getContractForPDF(contractId: string): Promise<{
  success: boolean
  data?: ContractPDFData
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Fetch contract with all related data
    // Note: We fetch creator info separately to avoid relationship issues
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        payment_proof:payment_proofs(
          proof_image_url,
          proof_image_path,
          transaction_reference,
          amount,
          uploaded_at,
          review_status,
          review_notes
        ),
        account:accounts(name)
      `)
      .eq('id', contractId)
      .single()

    if (contractError) {
      console.error('Error fetching contract:', contractError)
      return {
        success: false,
        error: 'فشل في جلب بيانات العقد',
      }
    }

    if (!contract) {
      return {
        success: false,
        error: 'العقد غير موجود',
      }
    }

    // Fetch creator info separately (avoid relationship issues)
    let creatorName = 'شركة روبوويب'
    if (contract.created_by) {
      const { data: creator } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', contract.created_by)
        .single()

      if (creator?.full_name) {
        creatorName = creator.full_name
      }
    }

    // Helper to get signed URL
    const getSignedUrl = async (bucket: string, pathOrUrl: string | null) => {
      if (!pathOrUrl) return undefined

      let path = pathOrUrl
      // Extract path if it's a full URL
      if (pathOrUrl.startsWith('http')) {
        try {
          const parts = pathOrUrl.split(`/${bucket}/`)
          if (parts.length > 1) {
            path = parts[1]
          }
        } catch (e) {
          console.error('Error parsing URL:', e)
        }
      }

      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60 * 24) // 24 hours validity

      return data?.signedUrl
    }

    // Prepare PDF data
    const pdfData: ContractPDFData = {
      // Basic Info
      id: contract.id,
      contract_number: contract.contract_number,
      created_at: contract.created_at,
      contract_link_token: contract.contract_link_token,

      // Parties
      client_name: decrypt(contract.client_name) || contract.client_name,
      client_email: decrypt(contract.client_email) || contract.client_email,
      client_phone: decrypt(contract.client_phone) || contract.client_phone,
      company_name: decrypt(contract.company_name) || contract.company_name,

      // Provider Info (First Party) - explicit from Account/User
      provider_company_name: contract.account?.name || undefined,
      provider_name: creatorName,
      created_by: creatorName,

      // Service Details - Decrypt all potentially encrypted fields
      service_type: decrypt(contract.service_type) || contract.service_type,
      package_name: decrypt(contract.package_name) || contract.package_name,
      service_description: decrypt(contract.service_description) || contract.service_description,

      // Financial - Decrypt payment method
      total_amount: parseFloat(contract.total_amount),
      deposit_amount: parseFloat(contract.deposit_amount),
      remaining_amount: parseFloat(contract.remaining_amount),
      payment_method: decrypt(contract.payment_method) || contract.payment_method,

      // Terms - Decrypt timeline and notes
      timeline: decrypt(contract.timeline) || contract.timeline,
      deliverables: contract.deliverables || [],
      notes: decrypt(contract.notes) || contract.notes,
      contract_terms: contract.contract_terms,
      payment_schedule: contract.contract_terms?.payment_schedule,

      // Legal Proofs - Convert to signed URLs
      admin_signature: await getSignedUrl('signatures', contract.admin_signature),
      client_signature: await getSignedUrl('signatures', contract.client_signature),
      admin_signature_at: contract.admin_signature_at,
      client_signature_at: contract.client_signature_at,
      admin_id_card: await getSignedUrl('id-cards', contract.admin_id_card),
      client_id_card: await getSignedUrl('id-cards', contract.client_id_card),
    }

    // Add payment proof if exists
    // Since we used !contracts_payment_proof_id_fkey, payment_proof is an object, not an array
    if (contract.payment_proof && typeof contract.payment_proof === 'object') {
      const proof = contract.payment_proof
      // Handle payment proof image (might be path or URL)
      let proofUrl = proof.proof_image_url
      if (proof.proof_image_path) {
        const { data } = await supabase.storage.from('payment-proofs').createSignedUrl(proof.proof_image_path, 60 * 60 * 24)
        if (data?.signedUrl) proofUrl = data.signedUrl
      } else if (proofUrl) {
        // Try to sign it if it's a URL
        const signed = await getSignedUrl('payment-proofs', proofUrl)
        if (signed) proofUrl = signed
      }

      pdfData.payment_proof = {
        proof_image_url: proofUrl,
        transaction_reference: proof.transaction_reference,
        amount: parseFloat(proof.amount),
        uploaded_at: proof.uploaded_at,
        review_status: proof.review_status,
        review_notes: proof.review_notes,
      }
    }

    // Add affiliate info if exists
    // Note: affiliate relationship might not exist in all schemas
    if (contract.affiliate_id) {
      try {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('name, commission_rate')
          .eq('id', contract.affiliate_id)
          .single()

        if (affiliate) {
          const commissionRate = affiliate.commission_rate || 0
          const commissionAmount = (parseFloat(contract.total_amount) * commissionRate) / 100

          pdfData.affiliate = {
            name: affiliate.name,
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
          }
        }
      } catch (err) {
        console.log('No affiliate data found')
      }
    }

    return {
      success: true,
      data: pdfData,
    }

  } catch (error: any) {
    console.error('Error preparing contract for PDF:', error)
    return {
      success: false,
      error: error.message || 'حدث خطأ غير متوقع',
    }
  }
}

/**
 * Validate if contract is ready for PDF generation
 */
export async function validateContractForPDF(contractId: string): Promise<{
  ready: boolean
  missingItems: string[]
}> {
  try {
    const supabase = await createClient()

    const { data: contract } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (!contract) {
      return {
        ready: false,
        missingItems: ['العقد غير موجود'],
      }
    }

    const missingItems: string[] = []

    // Check required fields
    if (!contract.admin_signature) missingItems.push('توقيع المدير')
    if (!contract.client_signature) missingItems.push('توقيع العميل')
    if (!contract.admin_id_card) missingItems.push('بطاقة هوية المدير')
    if (!contract.client_id_card) missingItems.push('بطاقة هوية العميل')
    if (!contract.payment_proof_id) missingItems.push('إثبات الدفع')

    return {
      ready: missingItems.length === 0,
      missingItems,
    }

  } catch (error) {
    console.error('Error validating contract:', error)
    return {
      ready: false,
      missingItems: ['حدث خطأ في التحقق من العقد'],
    }
  }
}
