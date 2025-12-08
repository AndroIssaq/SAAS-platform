/**
 * Storage Upload Helper
 * Uses service role to bypass RLS for uploads
 */

import { createClient } from "@supabase/supabase-js"

// Get service role key from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create admin client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Upload file to storage bucket (bypasses RLS)
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<{ url: string | null; error: Error | null }> {
  try {
    // Upload file
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { url: null, error }
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Upload exception:', error)
    return { url: null, error: error as Error }
  }
}

/**
 * Delete file from storage bucket (bypasses RLS)
 */
export async function deleteFromStorage(
  bucket: string,
  path: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Delete exception:', error)
    return { success: false, error: error as Error }
  }
}
