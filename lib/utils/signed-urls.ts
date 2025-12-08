/**
 * Utility to generate signed URLs for Supabase storage images
 * This is needed because storage buckets are private
 */

import { createClient } from '@/lib/supabase/client'

export async function getSignedImageUrl(publicUrl: string | null | undefined): Promise<string | null> {
    if (!publicUrl) return null

    try {
        const supabase = createClient()

        // Extract bucket and path from public URL
        // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        const urlParts = publicUrl.split('/storage/v1/object/public/')
        if (urlParts.length !== 2) return publicUrl // Return as-is if format is unexpected

        const [bucket, ...pathParts] = urlParts[1].split('/')
        const path = pathParts.join('/')

        // Generate signed URL (valid for 1 hour)
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 3600)

        if (error) {
            console.error(`Failed to create signed URL for ${bucket}/${path}:`, error)
            return publicUrl // Fallback to original URL
        }

        return data.signedUrl
    } catch (error) {
        console.error('Error generating signed URL:', error)
        return publicUrl // Fallback to original URL
    }
}

export async function getSignedImageUrls(urls: {
    admin_signature?: string | null
    client_signature?: string | null
    admin_id_card?: string | null
    client_id_card?: string | null
    payment_proof_url?: string | null
}): Promise<{
    admin_signature: string | null
    client_signature: string | null
    admin_id_card: string | null
    client_id_card: string | null
    payment_proof_url: string | null
}> {
    const [
        admin_signature,
        client_signature,
        admin_id_card,
        client_id_card,
        payment_proof_url
    ] = await Promise.all([
        getSignedImageUrl(urls.admin_signature),
        getSignedImageUrl(urls.client_signature),
        getSignedImageUrl(urls.admin_id_card),
        getSignedImageUrl(urls.client_id_card),
        getSignedImageUrl(urls.payment_proof_url)
    ])

    return {
        admin_signature,
        client_signature,
        admin_id_card,
        client_id_card,
        payment_proof_url
    }
}
