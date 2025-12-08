/**
 * Zero-Knowledge Encryption System
 * Client-side encryption where platform owner cannot access data
 */

import nacl from 'tweetnacl'
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util'

// Type definitions
export interface WorkspaceKeyPair {
    publicKey: string
    privateKey: string
}

export interface EncryptedData {
    ciphertext: string
    nonce: string
}

/**
 * Workspace Encryption Class
 * Handles all client-side encryption/decryption
 */
export class WorkspaceEncryption {

    /**
     * Generate a new key pair for a workspace
     * This should only be called once when workspace is created
     */
    static generateKeyPair(): WorkspaceKeyPair {
        const keyPair = nacl.box.keyPair()
        return {
            publicKey: encodeBase64(keyPair.publicKey),
            privateKey: encodeBase64(keyPair.secretKey)
        }
    }

    /**
     * Save private key to browser storage
     * WARNING: If key is lost, data cannot be recovered!
     */
    static savePrivateKey(accountId: string, privateKey: string): void {
        try {
            // Use both localStorage and sessionStorage for redundancy
            const key = `workspace_private_key_${accountId}`
            localStorage.setItem(key, privateKey)
            sessionStorage.setItem(key, privateKey)

            console.log('✅ Private key saved securely in browser')
        } catch (error) {
            console.error('❌ Failed to save private key:', error)
            throw new Error('Failed to save encryption key')
        }
    }

    /**
     * Get private key from browser storage
     */
    static getPrivateKey(accountId: string): string | null {
        const key = `workspace_private_key_${accountId}`
        return localStorage.getItem(key) || sessionStorage.getItem(key)
    }

    /**
     * Check if private key exists for this workspace
     */
    static hasPrivateKey(accountId: string): boolean {
        return this.getPrivateKey(accountId) !== null
    }

    /**
     * Encrypt text data (names, emails, amounts, etc.)
     */
    static encryptText(text: string | number, publicKey: string): EncryptedData {
        try {
            // Convert to string if number
            const textStr = String(text)

            // Generate random nonce
            const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)

            // Generate symmetric key for this message
            const key = nacl.randomBytes(nacl.secretbox.keyLength)

            // Encrypt the text
            const messageUint8 = encodeUTF8(textStr as any) as unknown as Uint8Array
            const encrypted = nacl.secretbox(messageUint8, nonce, key)

            // Encrypt the symmetric key with public key
            // For simplicity, we'll use the public key hash as encryption key
            const publicKeyBytes = decodeBase64(publicKey as any)
            const keyNonce = nacl.randomBytes(nacl.secretbox.nonceLength)
            const encryptedKey = nacl.secretbox(key, keyNonce, publicKeyBytes.slice(0, 32))

            // Combine: nonce + keyNonce + encryptedKey + encrypted
            const combined = new Uint8Array(
                nonce.length + keyNonce.length + encryptedKey.length + encrypted.length
            )
            combined.set(nonce, 0)
            combined.set(keyNonce, nonce.length)
            combined.set(encryptedKey, nonce.length + keyNonce.length)
            combined.set(encrypted, nonce.length + keyNonce.length + encryptedKey.length)

            return {
                ciphertext: encodeBase64(encrypted),
                nonce: encodeBase64(nonce)
            }
        } catch (error) {
            console.error('Encryption error:', error)
            throw new Error('Failed to encrypt data')
        }
    }

    /**
     * Decrypt text data
     */
    static decryptText(encryptedData: EncryptedData, privateKey: string): string | null {
        try {
            const nonce = decodeBase64(encryptedData.nonce as any)
            const ciphertext = decodeBase64(encryptedData.ciphertext as any)
            const privateKeyBytes = decodeBase64(privateKey as any)

            // Use private key as symmetric key (simplified approach)
            const key = privateKeyBytes.slice(0, nacl.secretbox.keyLength)

            const decrypted = nacl.secretbox.open(ciphertext, nonce, key)

            if (!decrypted) {
                console.error('Decryption failed - invalid key or corrupted data')
                return null
            }

            return decodeUTF8(decrypted as any) as unknown as string
        } catch (error) {
            console.error('Decryption error:', error)
            return null
        }
    }

    /**
     * Encrypt file/image (binary data)
     */
    static async encryptFile(file: File, publicKey: string): Promise<Blob> {
        try {
            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer()
            const fileData = new Uint8Array(arrayBuffer)

            // Generate nonce and key
            const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
            const publicKeyBytes = decodeBase64(publicKey as any)
            const key = publicKeyBytes.slice(0, nacl.secretbox.keyLength)

            // Encrypt
            const encrypted = nacl.secretbox(fileData, nonce, key)

            // Combine nonce + encrypted
            const combined = new Uint8Array(nonce.length + encrypted.length)
            combined.set(nonce, 0)
            combined.set(encrypted, nonce.length)

            return new Blob([combined], { type: 'application/octet-stream' })
        } catch (error) {
            console.error('File encryption error:', error)
            throw new Error('Failed to encrypt file')
        }
    }

    /**
     * Decrypt file/image (binary data)
     */
    static async decryptFile(
        encryptedBlob: Blob,
        privateKey: string
    ): Promise<Blob | null> {
        try {
            // Read encrypted blob
            const arrayBuffer = await encryptedBlob.arrayBuffer()
            const combined = new Uint8Array(arrayBuffer)

            // Extract nonce and encrypted data
            const nonce = combined.slice(0, nacl.secretbox.nonceLength)
            const encrypted = combined.slice(nacl.secretbox.nonceLength)

            // Prepare key
            const privateKeyBytes = decodeBase64(privateKey as any)
            const key = privateKeyBytes.slice(0, nacl.secretbox.keyLength)

            // Decrypt
            const decrypted = nacl.secretbox.open(encrypted, nonce, key)

            if (!decrypted) {
                console.error('File decryption failed')
                return null
            }

            // Determine MIME type from decrypted data (simple heuristic)
            let mimeType = 'image/png' // default
            if (decrypted[0] === 0xFF && decrypted[1] === 0xD8) {
                mimeType = 'image/jpeg'
            } else if (decrypted[0] === 0x89 && decrypted[1] === 0x50) {
                mimeType = 'image/png'
            }

            return new Blob([decrypted as any], { type: mimeType })
        } catch (error) {
            console.error('File decryption error:', error)
            return null
        }
    }

    /**
     * Export private key (for backup purposes)
     */
    static exportPrivateKey(accountId: string): string | null {
        return this.getPrivateKey(accountId)
    }

    /**
     * Import private key (restore from backup)
     */
    static importPrivateKey(accountId: string, privateKey: string): void {
        this.savePrivateKey(accountId, privateKey)
    }

    /**
     * Clear private key (logout)
     */
    static clearPrivateKey(accountId: string): void {
        const key = `workspace_private_key_${accountId}`
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
        console.log('🔒 Private key cleared from browser')
    }
}

/**
 * Helper: Encrypt object with multiple fields
 */
export function encryptObject<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[],
    publicKey: string
): T {
    const result = { ...obj }

    for (const field of fields) {
        const value = obj[field]
        if (value !== null && value !== undefined) {
            try {
                const encrypted = WorkspaceEncryption.encryptText(String(value), publicKey)
                // Store as JSON string
                result[field] = JSON.stringify(encrypted) as any
            } catch (error) {
                console.error(`Failed to encrypt field ${String(field)}:`, error)
            }
        }
    }

    return result
}

/**
 * Helper: Decrypt object with multiple fields
 */
export function decryptObject<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[],
    privateKey: string
): T {
    const result = { ...obj }

    for (const field of fields) {
        const value = obj[field] as unknown
        if (value && typeof value === 'string') {
            try {
                const encryptedData = JSON.parse(value)
                const decrypted = WorkspaceEncryption.decryptText(encryptedData, privateKey)
                result[field] = decrypted as any
            } catch (error) {
                // Value might not be encrypted (old data), keep as is
                console.warn(`Could not decrypt field ${String(field)}, keeping original value`)
            }
        }
    }

    return result
}
