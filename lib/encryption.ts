import crypto from 'crypto'

// Use a secure key from environment variables
// In production, this MUST be set to a 32-byte hex string
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0000000000000000000000000000000000000000000000000000000000000000'
const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string | number | null | undefined): string | null {
    if (text === null || text === undefined || text === '') return null

    const str = String(text)
    const iv = crypto.randomBytes(16)
    const key = Buffer.from(ENCRYPTION_KEY, 'hex')

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(str, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Format: IV:AuthTag:EncryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(text: string | null | undefined): string | null {
    if (text === null || text === undefined || text === '') return null

    // Check if text matches encryption format (simple heuristic)
    const parts = text.split(':')
    if (parts.length !== 3) {
        // Return as is if not encrypted (allows gradual migration)
        return text
    }

    try {
        const iv = Buffer.from(parts[0], 'hex')
        const authTag = Buffer.from(parts[1], 'hex')
        const encrypted = parts[2]
        const key = Buffer.from(ENCRYPTION_KEY, 'hex')

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    } catch (error) {
        console.error('Decryption failed:', error)
        return text // Return original on failure (or null?)
    }
}

// Helper to decrypt an object's fields
export function decryptObject<T>(obj: T, fields: string[]): T {
    if (!obj) return obj

    const newObj = { ...obj } as any

    fields.forEach(field => {
        if (newObj[field]) {
            newObj[field] = decrypt(newObj[field])
        }
    })

    return newObj
}
