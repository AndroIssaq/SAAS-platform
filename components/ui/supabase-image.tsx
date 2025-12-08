/**
 * Supabase Storage Image Component
 * مكون محسن للصور من Supabase Storage مع معالجة الأخطاء
 */

"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
// import { Skeleton } from "@/components/ui/skeleton" // Uncomment if skeleton component exists
import { AlertCircle, ImageIcon } from "lucide-react"

interface SupabaseImageProps {
  bucket: string
  path: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  fallback?: React.ReactNode
  onError?: (error: string) => void
}

export function SupabaseImage({
  bucket,
  path,
  alt,
  width = 400,
  height = 300,
  className,
  fill = false,
  fallback,
  onError
}: SupabaseImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function getImageUrl() {
      try {
        setLoading(true)
        setError(null)

        // Handle base64 images directly
        if (path.startsWith('data:image/')) {
          if (isMounted) {
            setImageUrl(path)
            setLoading(false)
          }
          return
        }

        // Handle HTTP URLs directly  
        if (path.startsWith('http://') || path.startsWith('https://')) {
          if (isMounted) {
            setImageUrl(path)
            setLoading(false)
          }
          return
        }

        const supabase = createClient()
        
        // Get signed URL for private files
        const { data, error: urlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 60 * 60) // 1 hour expiry

        if (urlError) {
          console.error('Supabase Storage URL Error:', urlError)
          // Try public URL as fallback
          const { data: publicData } = supabase.storage
            .from(bucket)
            .getPublicUrl(path)
          
          if (publicData?.publicUrl && isMounted) {
            setImageUrl(publicData.publicUrl)
            setLoading(false)
            return
          }

          throw new Error(urlError.message)
        }

        if (data?.signedUrl && isMounted) {
          setImageUrl(data.signedUrl)
          setLoading(false)
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load image'
        console.error('Image loading error:', errorMessage)
        
        if (isMounted) {
          setError(errorMessage)
          setLoading(false)
          onError?.(errorMessage)
        }
      }
    }

    if (path) {
      getImageUrl()
    } else {
      setLoading(false)
      setError('No image path provided')
    }

    return () => {
      isMounted = false
    }
  }, [bucket, path, onError])

  // Loading state
  if (loading) {
    return (
      <div 
        className={`animate-pulse bg-muted rounded ${className} ${fill ? 'absolute inset-0' : ''}`}
        style={!fill ? { width, height } : undefined}
      >
        <div className="flex items-center justify-center h-full">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !imageUrl) {
    return fallback || (
      <div 
        className={`flex flex-col items-center justify-center bg-muted border border-dashed border-muted-foreground/25 rounded-lg ${className} ${fill ? 'absolute inset-0' : ''}`}
        style={!fill ? { width, height } : undefined}
      >
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground text-center px-2">
          فشل تحميل الصورة
        </p>
        {error && (
          <p className="text-xs text-muted-foreground/75 mt-1 px-2 text-center">
            {error}
          </p>
        )}
      </div>
    )
  }

  // Success state
  const imageProps = {
    src: imageUrl,
    alt,
    className,
    onError: () => {
      setError('Failed to display image')
      onError?.('Failed to display image')
    }
  }

  if (fill) {
    return <Image {...imageProps} fill />
  }

  return <Image {...imageProps} width={width} height={height} />
}

// Hook for getting Supabase image URL
export function useSupabaseImageUrl(bucket: string, path: string) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function getUrl() {
      if (!path) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Handle base64 or HTTP URLs directly
        if (path.startsWith('data:') || path.startsWith('http')) {
          if (isMounted) {
            setUrl(path)
            setLoading(false)
          }
          return
        }

        const supabase = createClient()
        const { data, error: urlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 60 * 60)

        if (urlError) {
          // Fallback to public URL
          const { data: publicData } = supabase.storage
            .from(bucket)
            .getPublicUrl(path)
          
          if (publicData?.publicUrl && isMounted) {
            setUrl(publicData.publicUrl)
            setLoading(false)
            return
          }
          throw urlError
        }

        if (data?.signedUrl && isMounted) {
          setUrl(data.signedUrl)
        }
      } catch (err) {
        console.error('URL generation error:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    getUrl()

    return () => {
      isMounted = false
    }
  }, [bucket, path])

  return { url, loading, error }
}
