/**
 * Workspace Encryption Setup Hook
 * Handles initialization and management of workspace encryption keys
 */

'use client'

import { useEffect, useState } from 'react'
import { WorkspaceEncryption } from '@/lib/crypto/workspace-encryption'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface UseWorkspaceEncryptionResult {
    isReady: boolean
    hasPrivateKey: boolean
    publicKey: string | null
    privateKey: string | null
    setupEncryption: () => Promise<void>
    exportKey: () => string | null
    importKey: (key: string) => void
}

export function useWorkspaceEncryption(accountId: string | null): UseWorkspaceEncryptionResult {
    const [isReady, setIsReady] = useState(false)
    const [hasPrivateKey, setHasPrivateKey] = useState(false)
    const [publicKey, setPublicKey] = useState<string | null>(null)
    const [privateKey, setPrivateKey] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        if (!accountId) {
            setIsReady(false)
            return
        }

        const initialize = async () => {
            const supabase = createClient()

            // Check if we have private key in browser
            const storedPrivateKey = WorkspaceEncryption.getPrivateKey(accountId)

            if (storedPrivateKey) {
                setPrivateKey(storedPrivateKey)
                setHasPrivateKey(true)
            }

            // Fetch public key from database
            const { data: workspaceKey } = await supabase
                .from('workspace_keys')
                .select('public_key')
                .eq('account_id', accountId)
                .maybeSingle()

            if (workspaceKey?.public_key) {
                setPublicKey(workspaceKey.public_key)
            }

            setIsReady(true)
        }

        initialize()
    }, [accountId])

    const setupEncryption = async () => {
        if (!accountId) {
            toast({
                title: 'خطأ',
                description: 'لم يتم العثور على معرف الحساب',
                variant: 'destructive'
            })
            return
        }

        try {
            const supabase = createClient()

            // Generate new key pair
            const keyPair = WorkspaceEncryption.generateKeyPair()

            // Save private key to browser
            WorkspaceEncryption.savePrivateKey(accountId, keyPair.privateKey)

            // Save public key to database
            const { error } = await supabase
                .from('workspace_keys')
                .upsert({
                    account_id: accountId,
                    public_key: keyPair.publicKey,
                    key_type: 'curve25519',
                    encryption_version: 'v1'
                })

            if (error) throw error

            setPublicKey(keyPair.publicKey)
            setPrivateKey(keyPair.privateKey)
            setHasPrivateKey(true)

            toast({
                title: '✅ تم إعداد التشفير',
                description: 'تم إنشاء مفاتيح التشفير بنجاح. بياناتك الآن محمية تماماً.'
            })
        } catch (error: any) {
            console.error('Setup encryption error:', error)
            toast({
                title: 'خطأ في إعداد التشفير',
                description: error.message,
                variant: 'destructive'
            })
        }
    }

    const exportKey = () => {
        if (!accountId) return null
        return WorkspaceEncryption.exportPrivateKey(accountId)
    }

    const importKey = (key: string) => {
        if (!accountId) return

        WorkspaceEncryption.importPrivateKey(accountId, key)
        setPrivateKey(key)
        setHasPrivateKey(true)

        toast({
            title: '✅ تم استيراد المفتاح',
            description: 'تم استعادة مفتاح التشفير بنجاح'
        })
    }

    return {
        isReady,
        hasPrivateKey,
        publicKey,
        privateKey,
        setupEncryption,
        exportKey,
        importKey
    }
}
