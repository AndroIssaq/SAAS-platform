/**
 * Format date consistently for both server and client
 * Prevents hydration errors
 */
export function formatDate(date: string | Date, locale: string = "ar-SA"): string {
  if (!date) return "-"
  
  try {
    const d = typeof date === "string" ? new Date(date) : date
    
    // Use UTC to ensure consistency between server and client
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, "0")
    const day = String(d.getUTCDate()).padStart(2, "0")
    
    if (locale === "ar-SA") {
      // Arabic format: DD/MM/YYYY
      return `${day}/${month}/${year}`
    }
    
    // Default format: YYYY-MM-DD
    return `${year}-${month}-${day}`
  } catch (error) {
    console.error("Error formatting date:", error)
    return "-"
  }
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date, locale: string = "ar-SA"): string {
  if (!date) return "-"
  
  try {
    const d = typeof date === "string" ? new Date(date) : date
    
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, "0")
    const day = String(d.getUTCDate()).padStart(2, "0")
    const hours = String(d.getUTCHours()).padStart(2, "0")
    const minutes = String(d.getUTCMinutes()).padStart(2, "0")
    
    if (locale === "ar-SA") {
      return `${day}/${month}/${year} ${hours}:${minutes}`
    }
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    console.error("Error formatting datetime:", error)
    return "-"
  }
}

/**
 * Get relative time (e.g., "منذ 5 دقائق")
 * Use only in Client Components
 */
export function getRelativeTime(date: string | Date, locale: string = "ar"): string {
  if (!date) return "-"
  
  try {
    const d = typeof date === "string" ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (locale === "ar") {
      if (diffMins < 1) return "الآن"
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`
      if (diffHours < 24) return `منذ ${diffHours} ساعة`
      if (diffDays < 30) return `منذ ${diffDays} يوم`
      return formatDate(d, "ar-SA")
    }
    
    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 30) return `${diffDays}d ago`
    return formatDate(d)
  } catch (error) {
    console.error("Error getting relative time:", error)
    return "-"
  }
}
