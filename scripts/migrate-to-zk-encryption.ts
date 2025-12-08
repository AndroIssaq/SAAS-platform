/**
 * Migration Script: Encrypt Existing Contracts
 * Run this once to encrypt all existing unencrypted contracts
 */

import { createClient } from '@supabase/supabase-js'
import { WorkspaceEncryption } from '../lib/crypto/workspace-encryption'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function encryptExistingContracts() {
    console.log('🔒 Starting encryption of existing contracts...')

    // Get all workspaces with encryption enabled
    const { data: workspaces, error: wsError } = await supabase
        .from('workspace_keys')
        .select('account_id, public_key')

    if (wsError) {
        console.error('❌ Error fetching workspaces:', wsError)
        return
    }

    console.log(`📊 Found ${workspaces?.length || 0} workspaces with encryption enabled`)

    for (const workspace of workspaces || []) {
        console.log(`\n🔐 Processing workspace: ${workspace.account_id}`)

        // Get unencrypted contracts for this workspace
        const { data: contracts, error: contractsError } = await supabase
            .from('contracts')
            .select('*')
            .eq('account_id', workspace.account_id)
            .or('encryption_version.is.null,encryption_version.neq.zk-v1')

        if (contractsError) {
            console.error(`❌ Error fetching contracts:`, contractsError)
            continue
        }

        console.log(`  Found ${contracts?.length || 0} contracts to encrypt`)

        for (const contract of contracts || []) {
            try {
                const encryptField = (value: any) => {
                    if (!value) return value
                    const encrypted = WorkspaceEncryption.encryptText(String(value), workspace.public_key)
                    return JSON.stringify(encrypted)
                }

                const updates: any = {
                    client_name: encryptField(contract.client_name),
                    client_email: encryptField(contract.client_email),
                    client_phone: encryptField(contract.client_phone),
                    company_name: encryptField(contract.company_name),
                    service_type: encryptField(contract.service_type),
                    package_name: encryptField(contract.package_name),
                    service_description: encryptField(contract.service_description),
                    total_amount: encryptField(contract.total_amount),
                    deposit_amount: encryptField(contract.deposit_amount),
                    remaining_amount: encryptField(contract.remaining_amount),
                    payment_method: encryptField(contract.payment_method),
                    notes: encryptField(contract.notes),
                    encryption_version: 'zk-v1'
                }

                // Encrypt step_1_data if exists
                if (contract.step_1_data) {
                    const stepData = typeof contract.step_1_data === 'string'
                        ? JSON.parse(contract.step_1_data)
                        : contract.step_1_data

                    if (stepData.client_info) {
                        updates.step_1_data = {
                            ...stepData,
                            client_info: {
                                name: encryptField(stepData.client_info.name),
                                email: encryptField(stepData.client_info.email),
                                phone: encryptField(stepData.client_info.phone),
                                company: encryptField(stepData.client_info.company)
                            },
                            service_info: {
                                type: encryptField(stepData.service_info?.type),
                                package: encryptField(stepData.service_info?.package),
                                amount: encryptField(stepData.service_info?.amount)
                            }
                        }
                    }
                }

                const { error: updateError } = await supabase
                    .from('contracts')
                    .update(updates)
                    .eq('id', contract.id)

                if (updateError) {
                    console.error(`  ❌ Failed to encrypt contract ${contract.id}:`, updateError)
                } else {
                    console.log(`  ✅ Encrypted contract ${contract.contract_number}`)
                }
            } catch (error) {
                console.error(`  ❌ Error processing contract ${contract.id}:`, error)
            }
        }
    }

    console.log('\n✅ Migration complete!')
}

async function main() {
    try {
        await encryptExistingContracts()
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}

main()
