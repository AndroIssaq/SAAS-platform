/**
 * IP Address Utilities - Enterprise Level Security
 * Handles both IPv4 and IPv6 with proper validation
 */

import { headers } from "next/headers"

/**
 * Get real client IP address with multiple fallbacks
 * Handles proxies, load balancers, and CDNs
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers()
  
  // Priority order for IP detection
  const ipSources = [
    headersList.get("x-real-ip"),           // Nginx
    headersList.get("x-forwarded-for"),     // Most proxies
    headersList.get("cf-connecting-ip"),    // Cloudflare
    headersList.get("x-client-ip"),         // Apache
    headersList.get("x-cluster-client-ip"), // Load balancers
    headersList.get("forwarded"),           // RFC 7239
  ]

  for (const source of ipSources) {
    if (source) {
      // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2)
      // We want the first one (real client)
      const ip = source.split(",")[0].trim()
      if (isValidIP(ip)) {
        return normalizeIP(ip)
      }
    }
  }

  // Fallback to localhost (development)
  return "unknown"
}

/**
 * Validate IP address (IPv4 or IPv6)
 */
export function isValidIP(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/
  
  if (ipv4Regex.test(ip)) {
    // Validate IPv4 octets (0-255)
    const octets = ip.split(".")
    return octets.every(octet => {
      const num = parseInt(octet, 10)
      return num >= 0 && num <= 255
    })
  }
  
  if (ipv6Regex.test(ip)) {
    return true
  }
  
  return false
}

/**
 * Normalize IP address
 * Converts IPv6 loopback to IPv4 for consistency
 */
export function normalizeIP(ip: string): string {
  // Convert IPv6 loopback to IPv4
  if (ip === "::1" || ip === "::ffff:127.0.0.1") {
    return "127.0.0.1"
  }
  
  // Remove IPv6 prefix from IPv4-mapped addresses
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7)
  }
  
  return ip
}

/**
 * Check if IP is localhost/private
 */
export function isLocalIP(ip: string): boolean {
  const normalized = normalizeIP(ip)
  
  // Localhost
  if (normalized === "127.0.0.1" || normalized === "::1") {
    return true
  }
  
  // Private IPv4 ranges
  const privateRanges = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
  ]
  
  return privateRanges.some(regex => regex.test(normalized))
}

/**
 * Get IP geolocation info (placeholder for future implementation)
 */
export async function getIPInfo(ip: string): Promise<{
  country?: string
  city?: string
  isp?: string
  isVPN?: boolean
  isTor?: boolean
}> {
  // TODO: Integrate with IP geolocation service (ipapi.co, ipinfo.io, etc.)
  // For now, return empty object
  return {}
}

/**
 * Hash IP for privacy (GDPR compliant)
 */
export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Security check: Detect suspicious IPs
 */
export function isSuspiciousIP(ip: string): boolean {
  // Add your blacklist/suspicious IP detection logic
  // Can integrate with threat intelligence APIs
  
  // For now, just check if it's a known bad range
  const suspiciousRanges = [
    // Add known malicious IP ranges here
  ]
  
  return false
}
