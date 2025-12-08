/**
 * Script to encrypt REMAINING unencrypted fields in legacy data
 * Specifically: company_name and step_1_data.client_info
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Inline encryption function
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

async function encryptRemainingFields() {
    console.log('🔒 Encrypting remaining unencrypted fields...')

    // Fetch all contracts
    const { data: contracts, error } = await supabase
        .from('contracts')
        .select('id, company_name, step_1_data')

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

        // 1. Encrypt company_name if not encrypted
        if (contract.company_name && !contract.company_name.includes(':')) {
            updates.company_name = encrypt(contract.company_name)
            needsUpdate = true
            console.log(`  Encrypting company_name for contract ${contract.id}`)
        }

        // 2. Encrypt step_1_data.client_info if exists and not encrypted
        if (contract.step_1_data) {
            try {
                const stepData = typeof contract.step_1_data === 'string'
                    ? JSON.parse(contract.step_1_data)
                    : contract.step_1_data

                if (stepData?.client_info) {
                    const clientInfo = stepData.client_info
                    let clientInfoChanged = false

                    // Encrypt each field if not already encrypted
                    const encryptedClientInfo: any = {}

                    if (clientInfo.name && !String(clientInfo.name).includes(':')) {
                        encryptedClientInfo.name = encrypt(clientInfo.name)
                        clientInfoChanged = true
                    } else {
                        encryptedClientInfo.name = clientInfo.name
                    }

                    if (clientInfo.email && !String(clientInfo.email).includes(':')) {
                        encryptedClientInfo.email = encrypt(clientInfo.email)
                        clientInfoChanged = true
                    } else {
                        encryptedClientInfo.email = clientInfo.email
                    }

                    if (clientInfo.phone && !String(clientInfo.phone).includes(':')) {
                        encryptedClientInfo.phone = encrypt(clientInfo.phone)
                        clientInfoChanged = true
                    } else {
                        encryptedClientInfo.phone = clientInfo.phone
                    }

                    if (clientInfo.company && !String(clientInfo.company).includes(':')) {
                        encryptedClientInfo.company = encrypt(clientInfo.company)
                        clientInfoChanged = true
                    } else {
                        encryptedClientInfo.company = clientInfo.company
                    }

                    if (clientInfoChanged) {
                        updates.step_1_data = {
                            ...stepData,
                            client_info: encryptedClientInfo
                        }
                        needsUpdate = true
                        console.log(`  Encrypting step_1_data.client_info for contract ${contract.id}`)
                    }
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
                console.log(`✅ Updated contract ${contract.id}`)
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

// Also encrypt clients table company_name
async function encryptClientsCompanyName() {
    console.log('\n🔒 Encrypting clients.company_name...')

    const { data: clients, error } = await supabase
        .from('clients')
        .select('id, company_name')

    if (error) {
        console.error('❌ Error fetching clients:', error)
        return
    }

    console.log(`📊 Found ${clients?.length || 0} clients to process`)

    let encrypted = 0
    let skipped = 0

    for (const client of clients || []) {
        if (client.company_name && !client.company_name.includes(':')) {
            const { error: updateError } = await supabase
                .from('clients')
                .update({ company_name: encrypt(client.company_name) })
                .eq('id', client.id)

            if (updateError) {
                console.error(`❌ Error updating client ${client.id}:`, updateError)
            } else {
                encrypted++
                console.log(`✅ Encrypted client ${client.id}`)
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
    await encryptRemainingFields()
    await encryptClientsCompanyName()
    console.log('\n✅ All done! All fields should now be encrypted.')
}

main().catch(console.error)
