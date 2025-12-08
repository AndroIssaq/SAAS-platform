/**
 * Client-Side Contract Decryption Helper
 * Decrypts contract data using workspace private key from browser
 */

'use client'

import { WorkspaceEncryption } from '@/lib/crypto/workspace-encryption'

export interface Contract {
    id: string
    client_name: string
    client_email: string
    client_phone: string
    company_name: string
    service_type: string
    package_name: string
    service_description: string
    total_amount: string
    deposit_amount: string
    remaining_amount: string
    payment_method: string
    notes: string
    step_1_data: any
    encryption_version: string | null
    [key: string]: any
}

const ENCRYPTED_FIELDS = [
    'client_name',
    'client_email',
    'client_phone',
    'company_name',
    'service_type',
    'package_name',
    'service_description',
    'total_amount',
    'deposit_amount',
    'remaining_amount',
    'payment_method',
    'notes'
]

/**
 * Decrypt a single contract
 */
export function decryptContract(contract: Contract, privateKey: string | null): Contract {
    // If no private key or not ZK encrypted, return as is
    if (!privateKey || contract.encryption_version !== 'zk-v1') {
        return contract
    }

    const decrypted = { ...contract }

    // Decrypt main fields
    for (const field of ENCRYPTED_FIELDS) {
        const value = contract[field]
        if (value && typeof value === 'string') {
            try {
                const encryptedData = JSON.parse(value)
                const decryptedValue = WorkspaceEncryption.decryptText(encryptedData, privateKey)
                if (decryptedValue) {
                    decrypted[field] = decryptedValue
                }
            } catch (e) {
                // Not encrypted or parse error, keep original
                console.warn(`Could not decrypt field ${field}:`, e)
            }
        }
    }

    // Decrypt step_1_data
    if (contract.step_1_data?.client_info) {
        try {
            const clientInfo = contract.step_1_data.client_info
            const serviceInfo = contract.step_1_data.service_info

            const decryptField = (value: any) => {
                if (value && typeof value === 'string') {
                    try {
                        const encryptedData = JSON.parse(value)
                        return WorkspaceEncryption.decryptText(encryptedData, privateKey) || value
                    } catch {
                        return value
                    }
                }
                return value
            }

            decrypted.step_1_data = {
                ...contract.step_1_data,
                client_info: {
                    name: decryptField(clientInfo.name),
                    email: decryptField(clientInfo.email),
                    phone: decryptField(clientInfo.phone),
                    company: decryptField(clientInfo.company)
                },
                service_info: {
                    type: decryptField(serviceInfo.type),
                    package: decryptField(serviceInfo.package),
                    amount: decryptField(serviceInfo.amount)
                }
            }
        } catch (e) {
            console.warn('Could not decrypt step_1_data:', e)
        }
    }

    return decrypted
}

/**
 * Decrypt a list of contracts
 */
export function decryptContracts(contracts: Contract[], privateKey: string | null): Contract[] {
    if (!privateKey) return contracts
    return contracts.map(contract => decryptContract(contract, privateKey))
}

/**
 * Hook to automatically decrypt contract
 */
import { useState, useEffect } from 'react'
import { useWorkspaceEncryption } from './use-workspace-encryption'

export function useDecryptedContract(contract: Contract | null, accountId: string | null) {
    const { privateKey } = useWorkspaceEncryption(accountId)
    const [decrypted, setDecrypted] = useState<Contract | null>(null)

    useEffect(() => {
        if (!contract) {
            setDecrypted(null)
            return
        }

        setDecrypted(decryptContract(contract, privateKey))
    }, [contract, privateKey])

    return decrypted
}

/**
 * Hook to automatically decrypt contracts list
 */
export function useDecryptedContracts(contracts: Contract[], accountId: string | null) {
    const { privateKey } = useWorkspaceEncryption(accountId)
    const [decrypted, setDecrypted] = useState<Contract[]>([])

    useEffect(() => {
        if (!contracts || contracts.length === 0) {
            setDecrypted([])
            return
        }

        setDecrypted(decryptContracts(contracts, privateKey))
    }, [contracts, privateKey])

    return decrypted
}
