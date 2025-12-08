'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendContractNotification } from '@/app/actions/notifications'
import { sendContractEmail, sendContractActivationEmail, sendContractFinalizedEmail } from '@/app/actions/emails'
import { getCurrentAccountId } from '@/lib/actions/account'
import { withAdminClient } from '@/lib/supabase/admin'
import { createUserActivationToken } from '@/app/actions/auth-activation'
import { encrypt, decrypt, decryptObject } from '@/lib/encryption'
import { WorkspaceEncryption, encryptObject as zkEncryptObject } from '@/lib/crypto/workspace-encryption'


import { EncryptionParams } from '@/lib/encryption'
import { requireActiveSubscription } from '@/lib/actions/subscription-guard'


/**
 * Server Action: Create Contract
 * Creates a new contract and triggers email + notification
 */
export async function createContract(data: {
  affiliate_id: string
  service_id?: string | null
  client_name: string
  client_email: string
  client_phone: string
  company_name?: string
  service_type: string
  package_name: string
  service_description?: string
  total_amount: number
  deposit_amount: number
  payment_method: string
  timeline?: string
  notes?: string
  deliverables?: string[]
  contract_terms?: any
  encrypted_payload?: string | null
  encryption_version?: string | null
  encryption_public_key?: string | null
  workspace_public_key?: string | null // For Zero-Knowledge encryption
}) {
  await requireActiveSubscription() // Security Check

  try {
    const supabase = await createClient()

    // Get current user (creator)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'غير مصرح. يرجى تسجيل الدخول.' }
    }

    const accountId = await getCurrentAccountId()

    if (!accountId) {
      return { success: false, error: 'لم يتم العثور على حساب مرتبط بالمستخدم.' }
    }

    // Generate contract number
    const contractNumber = `RW-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Calculate remaining amount
    const remaining_amount = data.total_amount - data.deposit_amount

    // Ensure client user exists both in Auth and public.users using the admin (service role) client
    let clientUserId: string | null = null
    let isNewClientUser = false
    try {
      clientUserId = await withAdminClient(async (admin) => {
        // 1) Try to find existing app user by email
        const { data: existingUser, error: existingError } = await admin
          .from('users')
          .select('id')
          .eq('email', data.client_email)
          .maybeSingle()

        if (existingError && existingError.code !== 'PGRST116') {
          throw existingError
        }

        if (existingUser?.id) {
          return existingUser.id as string
        }

        // 2) No existing app user → try to create Auth user + app user row
        console.log('Creating new client auth user for:', data.client_email)
        const { data: authResult, error: authError } = await (admin as any).auth.admin.createUser({
          email: data.client_email,
          email_confirm: true,
          user_metadata: {
            full_name: data.client_name,
            role: 'client',
            created_via: 'contract',
          },
        })

        if (authError) {
          // If Auth user already exists for this email, reuse it and ensure a public.users row
          if ((authError as any).code === 'email_exists') {
            console.warn('Auth user already exists for email, reusing existing auth user:', data.client_email)

            const { data: listResult, error: listError } = await (admin as any).auth.admin.listUsers()
            if (listError) {
              throw listError
            }

            const existingAuthUser =
              (listResult?.users || []).find(
                (u: any) => u.email && u.email.toLowerCase() === data.client_email.toLowerCase()
              ) || null

            if (!existingAuthUser) {
              // Fallback: rethrow original error if we somehow can't find the user
              throw authError
            }

            const existingAuthUserId = existingAuthUser.id as string

            // Ensure there is a corresponding row in public.users for this auth user
            const { error: upsertUserError } = await admin
              .from('users')
              .upsert(
                {
                  id: existingAuthUserId,
                  email: data.client_email, // Keep email plain in users for Auth lookup
                  full_name: encrypt(data.client_name),
                  phone: encrypt(data.client_phone),
                  role: 'client',
                  status: 'active',
                },
                { onConflict: 'id' }
              )

            if (upsertUserError) {
              throw upsertUserError
            }

            // Existing user, we attach the contract to their account without sending a new activation email
            return existingAuthUserId
          }

          console.error('Auth admin.createUser error:', authError)
          throw authError
        }

        if (!authResult?.user) {
          throw new Error('Failed to create auth user for client (no user returned)')
        }

        const newAuthUserId = authResult.user.id as string

        const { error: insertUserError } = await admin.from('users').insert({
          id: newAuthUserId,
          email: data.client_email, // Keep email plain in users for Auth lookup
          full_name: encrypt(data.client_name),
          phone: encrypt(data.client_phone),
          role: 'client',
          status: 'pending_activation',
        })

        if (insertUserError) {
          throw insertUserError
        }

        console.log('✅ Created new client app user:', newAuthUserId)
        isNewClientUser = true
        return newAuthUserId
      })
    } catch (userError) {
      console.error('Failed to ensure client user via admin client:', userError)
      return {
        success: false,
        error: 'تعذّر إنشاء حساب العميل تلقائيًا. يرجى التواصل مع الدعم.',
      }
    }

    if (!clientUserId) {
      return {
        success: false,
        error: 'تعذّر إنشاء حساب العميل. حاول مرة أخرى أو استخدم بريدًا مختلفًا.',
      }
    }

    // Ensure a clients table record exists for the user (contracts.client_id FK)
    let clientRecordId: string | null = null
    console.log('🔍 Contract Creation - Ensuring client record for user_id:', clientUserId)
    console.log('🔍 Contract Creation - Client email:', data.client_email)

    try {
      clientRecordId = await withAdminClient(async (admin) => {
        // First: Check if client exists by user_id (primary method)
        console.log('🔍 Checking for existing client by user_id:', clientUserId)
        const { data: existingClientByUserId, error: existingByUserError } = await admin
          .from('clients')
          .select('id')
          .eq('user_id', clientUserId)
          .maybeSingle()

        console.log('🔍 User_id search result:', { existingClientByUserId, existingByUserError })

        if (existingByUserError && existingByUserError.code !== 'PGRST116') {
          throw existingByUserError
        }

        if (existingClientByUserId?.id) {
          console.log('✅ Found existing client by user_id:', existingClientByUserId.id)
          return existingClientByUserId.id as string
        }

        // Second: Check if client exists by email in onboarding_data (fallback method)
        console.log('🔍 Checking for existing client by email:', data.client_email)
        const { data: existingClientByEmail, error: existingByEmailError } = await admin
          .from('clients')
          .select('id, user_id')
          .filter('onboarding_data->>email', 'eq', data.client_email)
          .maybeSingle()

        console.log('🔍 Email search result:', { existingClientByEmail, existingByEmailError })

        if (existingByEmailError && existingByEmailError.code !== 'PGRST116') {
          throw existingByEmailError
        }

        if (existingClientByEmail?.id) {
          // If found by email but user_id is null, update it with the current user
          if (!existingClientByEmail.user_id) {
            console.log('🔍 Updating existing client with user_id:', clientUserId)
            const { error: updateError } = await admin
              .from('clients')
              .update({
                user_id: clientUserId,
                onboarding_data: {
                  email: encrypt(data.client_email),
                  phone: encrypt(data.client_phone),
                }
              })
              .eq('id', existingClientByEmail.id)

            if (updateError) {
              throw updateError
            }
            console.log('✅ Updated existing client record with user_id:', clientUserId)
          }
          return existingClientByEmail.id as string
        }

        // Third: Create new client record if none exists
        console.log('🔍 Creating new client record')
        const { data: insertedClient, error: insertClientError } = await admin
          .from('clients')
          .insert({
            account_id: accountId,
            user_id: clientUserId,
            company_name: data.company_name || '', // Keep company name plain or encrypt? User said "everything". Let's encrypt if possible, but check if used for search.
            onboarding_data: {
              email: encrypt(data.client_email),
              phone: encrypt(data.client_phone),
            },
            onboarding_completed: false,
          })
          .select('id')
          .single()

        console.log('🔍 New client creation result:', { insertedClient, insertClientError })

        if (insertClientError) {
          throw insertClientError
        }

        console.log('✅ Created new client record with user_id:', clientUserId)
        return insertedClient?.id ?? null
      })
    } catch (clientRecordError) {
      console.error('Failed to ensure client record:', clientRecordError)
      return {
        success: false,
        error: 'تعذّر إنشاء ملف العميل (clients). حاول مرة أخرى لاحقًا.',
      }
    }

    if (!clientRecordId) {
      return {
        success: false,
        error: 'لم يتم إنشاء سجل العميل. يرجى المحاولة من جديد.',
      }
    }

    // Helper function to encrypt data (use ZK if available, fallback to server-side)
    const encryptData = (value: string | number) => {
      if (data.workspace_public_key) {
        // Zero-Knowledge encryption
        const encrypted = WorkspaceEncryption.encryptText(String(value), data.workspace_public_key)
        return JSON.stringify(encrypted)
      } else {
        // Fallback to server-side encryption
        return encrypt(String(value))
      }
    }

    // Prepare contract data with all required fields
    const contractData = {
      account_id: accountId,
      contract_number: contractNumber,
      affiliate_id: data.affiliate_id,
      created_by: user.id,
      client_id: clientRecordId, // FK to clients table
      service_id: data.service_id,
      client_name: encryptData(data.client_name),
      client_email: encryptData(data.client_email),
      client_phone: encryptData(data.client_phone),
      company_name: encryptData(data.company_name || ''),
      service_type: encryptData(data.service_type),
      package_name: encryptData(data.package_name),
      service_description: encryptData(data.service_description || ''),
      total_amount: data.total_amount, // Keep as number - don't encrypt
      deposit_amount: data.deposit_amount, // Keep as number - don't encrypt
      remaining_amount: remaining_amount, // Keep as number - don't encrypt
      payment_method: encryptData(data.payment_method),
      timeline: data.timeline || '',
      deliverables: data.deliverables || [],
      notes: encryptData(data.notes || ''),
      contract_terms: data.contract_terms || {
        terms: [],
        payment: {},
        service: {},
        notes: ''
      },
      status: 'pending',
      // Start in signatures flow expecting manager to sign first on tablet
      workflow_status: 'pending_admin_signature',
      current_step: 1,
      step_1_completed: true,
      step_1_data: {
        client_info: {
          name: encryptData(data.client_name),
          email: encryptData(data.client_email),
          phone: encryptData(data.client_phone),
          company: encryptData(data.company_name || '')
        },
        service_info: {
          type: encryptData(data.service_type),
          package: encryptData(data.package_name),
          amount: data.total_amount // Keep as number - don't encrypt
        },
        completed_at: new Date().toISOString(),
        completed_by: user.id
      },
      encrypted_payload: data.encrypted_payload ?? null,
      encryption_version: data.workspace_public_key ? 'zk-v1' : (data.encryption_version ?? null),
      encryption_public_key: data.encryption_public_key ?? null,
    }

    // Insert contract
    const { data: contract, error: insertError } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating contract:', insertError)
      return {
        success: false,
        error: `فشل في إنشاء العقد: ${insertError.message}`
      }
    }

    console.log('✅ Contract created in DB:', {
      id: contract.id,
      contract_number: contract.contract_number,
      client_id: contract.client_id
    })

    // Link latest contract to client record (best-effort)
    withAdminClient(async (admin) => {
      await admin.from('clients').update({ contract_id: contract.id }).eq('id', clientRecordId)
    }).catch((error) => {
      console.error('Failed to link client record to contract', error)
    })

    // Create activity log
    await supabase.from('contract_activities').insert({
      account_id: accountId,
      contract_id: contract.id,
      activity_type: 'contract_created',
      description: `تم إنشاء العقد رقم ${contractNumber}`,
      metadata: {
        created_by: user.id,
        client_email: data.client_email,
        timestamp: new Date().toISOString()
      }
    })

    // If this is a brand new client user, generate activation token and send activation email
    if (isNewClientUser && clientUserId) {
      try {
        const tokenResult = await createUserActivationToken(clientUserId)
        if (tokenResult.success && tokenResult.token) {
          sendContractActivationEmail({
            to: data.client_email,
            clientName: data.client_name,
            contractNumber,
            contractId: contract.id,
            activationToken: tokenResult.token,
          }).catch((err: any) => {
            console.error('Activation email sending failed (non-blocking):', err)
          })
        } else {
          console.error('Failed to create activation token for client user:', tokenResult.error)
        }
      } catch (activationError) {
        console.error('Error during activation token/email flow:', activationError)
      }
    } else {
      // Existing client user → send standard contract email (as before)
      sendContractEmail({
        to: data.client_email,
        clientName: data.client_name,
        contractNumber: contractNumber,
        contractId: contract.id,
        serviceType: data.service_type,
        totalAmount: data.total_amount,
      }).catch((err: any) => {
        console.error('Email sending failed (non-blocking):', err)
      })
    }

    // Send in-app notification to client if user exists
    if (clientUserId) {
      await sendContractNotification({
        userId: clientUserId,
        contractId: contract.id,
        contractNumber: contractNumber,
        type: 'contract_created'
      })
    }

    // Send notification to admin (creator) as well
    await sendContractNotification({
      userId: user.id,
      contractId: contract.id,
      contractNumber: contractNumber,
      type: 'contract_created_admin'
    })

    // If there's an affiliate, notify them too
    if (data.affiliate_id) {
      // Get affiliate user_id
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('user_id')
        .eq('id', data.affiliate_id)
        .single()

      if (affiliate?.user_id) {
        await sendContractNotification({
          userId: affiliate.user_id,
          contractId: contract.id,
          contractNumber: contractNumber,
          type: 'contract_created_affiliate'
        })
      }
    }

    // Revalidate paths
    revalidatePath('/admin/contracts')
    revalidatePath(`/admin/contracts/${contract.id}`)
    revalidatePath(`/admin/contracts/${contract.id}/flow`)
    revalidatePath('/affiliate/contracts')
    revalidatePath(`/affiliate/contracts/${contract.id}`)
    revalidatePath(`/affiliate/contracts/${contract.id}/flow`)
    revalidatePath('/client/contracts')
    revalidatePath(`/client/contracts/${contract.id}`)
    revalidatePath(`/client/contracts/${contract.id}/flow`)
    revalidatePath('/client/dashboard')

    return {
      success: true,
      contractId: contract.id,
      contractNumber: contractNumber,
      message: 'تم إنشاء العقد بنجاح وإرسال الإشعارات'
    }
  } catch (error) {
    console.error('Error in createContract:', error)
    return {
      success: false,
      error: 'حدث خطأ غير متوقع في إنشاء العقد'
    }
  }
}

/**
 * Server Action: Update Contract Step
 * Updates contract current step and step completion status
 */
export async function updateContractStep(
  contractId: string,
  step: number,
  stepData?: any
) {
  try {
    const supabase = await createClient()
    const accountId = await getCurrentAccountId()

    if (!accountId) {
      return { success: false, error: 'لم يتم العثور على حساب مرتبط بالمستخدم.' }
    }

    const updateData: any = {
      current_step: step,
      [`step_${step}_completed`]: true,
      [`step_${step}_data`]: stepData || {},
      progress_updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contractId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Log activity
    await supabase.from('contract_activities').insert({
      account_id: accountId,
      contract_id: contractId,
      activity_type: 'step_completed',
      description: `تم إكمال الخطوة ${step}`,
      metadata: { step, timestamp: new Date().toISOString() }
    })

    revalidatePath(`/client/contracts/${contractId}`)
    revalidatePath(`/admin/contracts/${contractId}`)

    return { success: true }
  } catch (error) {
    return { success: false, error: 'حدث خطأ في تحديث الخطوة' }
  }
}

/**
 * Server Action: Get Contract by ID
 */
export async function getContractById(contractId: string) {
  try {
    const supabase = await createClient()
    const accountId = await getCurrentAccountId()

    let query = supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)

    // إذا كان المستخدم داخل Workspace محدد، نقيد العقد بنفس الحساب
    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    const { data, error } = await query.single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Decrypt sensitive data
    const decryptedData = decryptObject(data, [
      'client_name',
      'client_email',
      'client_phone',
      'company_name',
      'service_type',
      'package_name',
      'service_description',
      'payment_method',
      'notes'
    ])

    // Also decrypt step_1_data fields if they exist
    if (data.step_1_data?.client_info) {
      try {
        const clientInfo = data.step_1_data.client_info
        decryptedData.step_1_data = {
          ...data.step_1_data,
          client_info: {
            name: decrypt(clientInfo.name) || clientInfo.name,
            email: decrypt(clientInfo.email) || clientInfo.email,
            phone: decrypt(clientInfo.phone) || clientInfo.phone,
            company: decrypt(clientInfo.company) || clientInfo.company
          },
          service_info: {
            type: decrypt(data.step_1_data.service_info?.type) || data.step_1_data.service_info?.type,
            package: decrypt(data.step_1_data.service_info?.package) || data.step_1_data.service_info?.package,
            amount: data.step_1_data.service_info?.amount
          }
        }
      } catch (e) {
        // If decryption fails, keep original
      }
    }

    return { success: true, data: decryptedData }
  } catch (error) {
    return { success: false, error: 'حدث خطأ في جلب بيانات العقد' }
  }
}

/**
 * Server Action: Get all contracts with optional filters
 */
export async function getContracts(filters?: {
  status?: string
  search?: string
  limit?: number
}) {
  try {
    const supabase = await createClient()
    const accountId = await getCurrentAccountId()

    let query = supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })

    // إذا كان هناك حساب حالي (Owner/Admin داخل Workspace) نقيد العقود به
    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.search) {
      // Only search by contract_number as other fields are encrypted
      query = query.ilike('contract_number', `%${filters.search}%`)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message, data: [] }
    }

    // Decrypt list
    const decryptedList = (data || []).map(contract => {
      const decrypted = decryptObject(contract, [
        'client_name',
        'client_email',
        'client_phone',
        'company_name',
        'service_type',
        'package_name',
        'service_description',
        'payment_method',
        'notes'
      ])

      // Also decrypt step_1_data fields if they exist
      if (contract.step_1_data?.client_info) {
        try {
          const clientInfo = contract.step_1_data.client_info
          decrypted.step_1_data = {
            ...contract.step_1_data,
            client_info: {
              name: decrypt(clientInfo.name) || clientInfo.name,
              email: decrypt(clientInfo.email) || clientInfo.email,
              phone: decrypt(clientInfo.phone) || clientInfo.phone,
              company: decrypt(clientInfo.company) || clientInfo.company
            },
            service_info: {
              type: decrypt(contract.step_1_data.service_info?.type) || contract.step_1_data.service_info?.type,
              package: decrypt(contract.step_1_data.service_info?.package) || contract.step_1_data.service_info?.package,
              amount: contract.step_1_data.service_info?.amount
            }
          }
        } catch (e) {
          // If decryption fails, keep original
        }
      }

      return decrypted
    })

    return { success: true, data: decryptedList }
  } catch (error) {
    return { success: false, error: 'حدث خطأ في جلب العقود', data: [] }
  }
}

/**
 * Server Action: Finalize Contract
 * Marks the contract as completed, logs activity, sends notifications and email
 */
export async function finalizeContract(contractId: string) {
  try {
    const supabase = await createClient()

    // Auth user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'غير مصرح. يرجى تسجيل الدخول.' }
    }

    // Fetch contract
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (fetchError || !contract) {
      return { success: false, error: 'لم يتم العثور على العقد.' }
    }

    // Decrypt for email usage
    contract.client_name = decrypt(contract.client_name) || contract.client_name
    contract.client_email = decrypt(contract.client_email) || contract.client_email
    contract.client_phone = decrypt(contract.client_phone) || contract.client_phone

    // Simple guard: finalization should be possible only after payment approval
    if (!contract.payment_approved) {
      return { success: false, error: 'لا يمكن الإتمام قبل الموافقة على الدفع.' }
    }

    const now = new Date().toISOString()

    // Update contract to finalized
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'active',
        workflow_status: 'completed',
        current_step_name: 'finalization',
        current_step: 8,
        finalized: true,
        finalized_at: now,
        updated_at: now,
      })
      .eq('id', contractId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Activity log
    await supabase.from('contract_activities').insert({
      account_id: contract.account_id,
      contract_id: contractId,
      activity_type: 'CONTRACT_FINALIZED',
      description: 'تم إتمام العقد',
      metadata: {
        participant: 'admin',
        participantName: 'Admin',
        finalizedAt: now,
      },
    })

    // Notify client
    if (contract.client_email) {
      sendContractFinalizedEmail({
        to: contract.client_email,
        clientName: contract.client_name || 'العميل',
        contractNumber: contract.contract_number,
        contractId,
      }).catch((err: any) => console.error('Finalized email send failed:', err))
    }

    // In-app notifications
    // client
    if (contract.client_id) {
      // Resolve client user_id from clients table
      const { data: clientRow } = await supabase
        .from('clients')
        .select('user_id')
        .eq('id', contract.client_id)
        .single()

      const clientUserId = clientRow?.user_id
      if (clientUserId) {
        await sendContractNotification({
          userId: clientUserId,
          contractId,
          contractNumber: contract.contract_number,
          type: 'contract_finalized',
        })
      }
    }

    // admin (creator)
    if (contract.created_by) {
      await sendContractNotification({
        userId: contract.created_by,
        contractId,
        contractNumber: contract.contract_number,
        type: 'contract_finalized',
      })
    }

    // affiliate (if present)
    if (contract.affiliate_id) {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('user_id')
        .eq('id', contract.affiliate_id)
        .maybeSingle()

      if (affiliate?.user_id) {
        await sendContractNotification({
          userId: affiliate.user_id,
          contractId,
          contractNumber: contract.contract_number,
          type: 'contract_finalized',
        })
      }
    }

    // Revalidate key paths
    revalidatePath(`/admin/contracts/${contractId}`)
    revalidatePath(`/admin/contracts/${contractId}/flow`)
    revalidatePath(`/client/contracts/${contractId}`)
    revalidatePath(`/client/contracts/${contractId}/flow`)
    revalidatePath('/admin/contracts')
    revalidatePath('/client/contracts')
    revalidatePath('/client/dashboard')

    return { success: true }
  } catch (error) {
    console.error('finalizeContract error:', error)
    return { success: false, error: 'حدث خطأ في إتمام العقد' }
  }
}
