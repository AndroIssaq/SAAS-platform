/**
 * Script to encrypt legacy (existing) contract data
 * Run this ONCE to encrypt all existing contracts
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Inline encryption functions (avoid import issues)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2'

function encrypt(text: string | number | null | undefined): string | null {
    if (!text) return null
    const textStr = String(text)
    const algorithm = 'aes-256-gcm'
    const key = Buffer.from(ENCRYPTION_KEY, 'hex')
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    let encrypted = cipher.update(textStr, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function encryptLegacyData() {
    console.log('🔒 Starting encryption of legacy contract data...')

    // Fetch all contracts
    const { data: contracts, error } = await supabase
        .from('contracts')
        .select('id, client_name, client_email, client_phone, service_description, notes, company_name, step_1_data')

    if (error) {
        console.error('❌ Error fetching contracts:', error)
        return
    }

    console.log(`📊 Found ${contracts?.length || 0} contracts to process`)

    let encrypted = 0
    let skipped = 0

    for (const contract of contracts || []) {
        const updates: any = {}
        let needsUpdate = false

        // Check if client_name needs encryption (not already encrypted)
        if (contract.client_name && !contract.client_name.includes(':')) {
            updates.client_name = encrypt(contract.client_name)
            needsUpdate = true
        }

        // Check if client_email needs encryption
        if (contract.client_email && !contract.client_email.includes(':')) {
            updates.client_email = encrypt(contract.client_email)
            needsUpdate = true
        }

        // Check if client_phone needs encryption
        if (contract.client_phone && !contract.client_phone.includes(':')) {
            updates.client_phone = encrypt(contract.client_phone)
            needsUpdate = true
        }

        // Check if service_description needs encryption
        if (contract.service_description && !contract.service_description.includes(':')) {
            updates.service_description = encrypt(contract.service_description)
            needsUpdate = true
        }

        // Check if notes needs encryption
        if (contract.notes && !contract.notes.includes(':')) {
            updates.notes = encrypt(contract.notes)
            needsUpdate = true
        }

        // Encrypt step_1_data if it contains plain text client info
        if (contract.step_1_data) {
            try {
                const stepData = typeof contract.step_1_data === 'string'
                    ? JSON.parse(contract.step_1_data)
                    : contract.step_1_data

                if (stepData.client_info) {
                    const encryptedStepData = {
                        ...stepData,
                        client_info: {
                            name: stepData.client_info.name ? encrypt(stepData.client_info.name) : null,
                            email: stepData.client_info.email ? encrypt(stepData.client_info.email) : null,
                            phone: stepData.client_info.phone ? encrypt(stepData.client_info.phone) : null,
                            company: stepData.client_info.company ? stepData.client_info.company : null // Keep company plain or encrypt?
                        },
                        service_info: stepData.service_info,
                        completed_at: stepData.completed_at,
                        completed_by: stepData.completed_by
                    }
                    updates.step_1_data = encryptedStepData
                    needsUpdate = true
                }
            } catch (e) {
                console.warn(`⚠️ Could not parse step_1_data for contract ${contract.id}`)
            }
        }

        if (needsUpdate) {
            const { error: updateError } = await supabase
                .from('contracts')
                .update(updates)
                .eq('id', contract.id)

            if (updateError) {
                console.error(`❌ Error updating contract ${contract.id}:`, updateError)
            } else {
                encrypted++
                console.log(`✅ Encrypted contract ${contract.id}`)
            }
        } else {
            skipped++
        }
    }

    console.log(`\n📊 Summary:`)
    console.log(`✅ Encrypted: ${encrypted}`)
    console.log(`⏭️ Skipped (already encrypted): ${skipped}`)
    console.log(`📝 Total: ${contracts?.length || 0}`)
}

// Also encrypt users table
async function encryptLegacyUsers() {
    console.log('\n🔒 Starting encryption of legacy user data...')

    const { data: users, error } = await supabase
        .from('users')
        .select('id, full_name, phone')
        .eq('role', 'client')

    if (error) {
        console.error('❌ Error fetching users:', error)
        return
    }

    console.log(`📊 Found ${users?.length || 0} users to process`)

    let encrypted = 0
    let skipped = 0

    for (const user of users || []) {
        const updates: any = {}
        let needsUpdate = false

        if (user.full_name && !user.full_name.includes(':')) {
            updates.full_name = encrypt(user.full_name)
            needsUpdate = true
        }

        if (user.phone && !user.phone.includes(':')) {
            updates.phone = encrypt(user.phone)
            needsUpdate = true
        }

        if (needsUpdate) {
            const { error: updateError } = await supabase
                .from('users')
                .update(updates)
                .eq('id', user.id)

            if (updateError) {
                console.error(`❌ Error updating user ${user.id}:`, updateError)
            } else {
                encrypted++
                console.log(`✅ Encrypted user ${user.id}`)
            }
        } else {
            skipped++
        }
    }

    console.log(`\n📊 Summary:`)
    console.log(`✅ Encrypted: ${encrypted}`)
    console.log(`⏭️ Skipped: ${skipped}`)
}

// Main execution
async function main() {
    await encryptLegacyData()
    await encryptLegacyUsers()
    console.log('\n✅ All done!')
}

main().catch(console.error)
