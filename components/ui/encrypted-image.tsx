/**
 * Encrypted Image Component
 * Displays images encrypted with Zero-Knowledge encryption
 */

'use client'

import { useEffect, useState } from 'react'
import { WorkspaceEncryption } from '@/lib/crypto/workspace-encryption'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface EncryptedImageProps {
    path: string | null
    accountId: string
    alt?: string
    className?: string
    fallback?: React.ReactNode
}

export function EncryptedImage({
    path,
    accountId,
    alt = 'Encrypted image',
    className = '',
    fallback
}: EncryptedImageProps) {
    const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!path) {
            setLoading(false)
            return
        }

        const loadAndDecrypt = async () => {
            try {
                setLoading(true)
                setError(null)

                const supabase = createClient()

                // Get private key from browser
                const privateKey = WorkspaceEncryption.getPrivateKey(accountId)

                if (!privateKey) {
                    // Image might not be encrypted (old data), try to load normally
                    const { data } = supabase.storage
                        .from('id-cards')
                        .getPublicUrl(path)

                    setDecryptedUrl(data.publicUrl)
                    setLoading(false)
                    return
                }

                // Try encrypted bucket first
                const { data: encryptedData, error: downloadError } = await supabase.storage
                    .from('encrypted-files')
                    .download(path)

                if (downloadError) {
                    // Fallback to regular bucket (old data)
                    const { data } = supabase.storage
                        .from('id-cards')
                        .getPublicUrl(path)

                    setDecryptedUrl(data.publicUrl)
                    setLoading(false)
                    return
                }

                if (!encryptedData) {
                    throw new Error('Failed to download encrypted image')
                }

                // Decrypt the image
                const decryptedBlob = await WorkspaceEncryption.decryptFile(
                    encryptedData,
                    privateKey
                )

                if (!decryptedBlob) {
                    throw new Error('Failed to decrypt image')
                }

                // Create object URL for display
                const url = URL.createObjectURL(decryptedBlob)
                setDecryptedUrl(url)
                setLoading(false)

                // Cleanup on unmount
                return () => {
                    if (url) URL.revokeObjectURL(url)
                }
            } catch (err: any) {
                console.error('Error loading encrypted image:', err)
                setError(err.message || 'Failed to load image')
                setLoading(false)
            }
        }

        loadAndDecrypt()
    }, [path, accountId])

    if (!path) {
        return fallback || (
            <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`}>
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
        )
    }

    if (loading) {
        return <Skeleton className={className} />
    }

    if (error) {
        return (
            <Alert variant="destructive" className={className}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    فشل تحميل الصورة: {error}
                </AlertDescription>
            </Alert>
        )
    }

    if (!decryptedUrl) {
        return fallback || null
    }

    return (
        <img
            src={decryptedUrl}
            alt={alt}
            className={className}
        />
    )
}
