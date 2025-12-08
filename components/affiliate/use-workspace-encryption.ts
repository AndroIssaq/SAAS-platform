'use client'

import { useEffect, useState } from "react"
import type SodiumType from "libsodium-wrappers-sumo"

interface UseWorkspaceEncryptionState {
  loading: boolean
  error: string | null
  publicKey: string | null
  vault: string | null
  unlockedPrivateKey: string | null
  isUnlocked: boolean
  unlock: (passphrase: string) => Promise<string | null>
  lock: () => void
  refresh: () => Promise<void>
}

export const LOCAL_STORAGE_VAULT_KEY = "aqdi.workspaceKeyVault"
export const LOCAL_STORAGE_VAULT_UPDATED_KEY = "aqdi.workspaceKeyVaultUpdatedAt"

let sodiumInstance: typeof SodiumType | null = null

async function loadSodium(): Promise<typeof SodiumType> {
  if (sodiumInstance) return sodiumInstance
  const mod = await import("libsodium-wrappers-sumo")
  await mod.ready
  sodiumInstance = mod
  return mod
}

export function useWorkspaceEncryption(): UseWorkspaceEncryptionState {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [vault, setVault] = useState<string | null>(null)
  const [unlockedPrivateKey, setUnlockedPrivateKey] = useState<string | null>(null)

  const fetchPublicKey = async () => {
    try {
      const response = await fetch("/api/workspace/encryption")
      const payload = await response.json()
      if (payload?.success) {
        setPublicKey(payload.data?.public_key ?? null)
      } else {
        setPublicKey(null)
      }
    } catch (error) {
      console.error("Failed to fetch workspace key", error)
      setPublicKey(null)
    }
  }

  const refresh = async () => {
    setLoading(true)
    await fetchPublicKey()
    if (typeof window !== "undefined") {
      setVault(window.localStorage.getItem(LOCAL_STORAGE_VAULT_KEY))
    }
    setUnlockedPrivateKey(null)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const unlock = async (passphrase: string) => {
    if (!vault) {
      setError("لا يوجد مفتاح محلي")
      return null
    }
    if (!passphrase) {
      setError("كلمة المرور مطلوبة")
      return null
    }
    try {
      const sodium = await loadSodium()
      const vaultRecord = JSON.parse(vault)
      const salt = sodium.from_base64(vaultRecord.salt)
      const nonce = sodium.from_base64(vaultRecord.nonce)
      const ciphertext = sodium.from_base64(vaultRecord.ciphertext)
      const key = sodium.crypto_pwhash(
        sodium.crypto_secretbox_KEYBYTES,
        passphrase,
        salt,
        sodium.crypto_pwhash_OPSLIMIT_MODERATE,
        sodium.crypto_pwhash_MEMLIMIT_MODERATE,
        sodium.crypto_pwhash_ALG_DEFAULT
      )
      const privateKeyBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key)
      const base64Key = sodium.to_base64(privateKeyBytes)
      setUnlockedPrivateKey(base64Key)
      setError(null)
      return base64Key
    } catch (error) {
      console.error("unlock error", error)
      setError("فشلت عملية فك التشفير")
      return null
    }
  }

  const lock = () => {
    setUnlockedPrivateKey(null)
  }

  return {
    loading,
    error,
    publicKey,
    vault,
    unlockedPrivateKey,
    isUnlocked: Boolean(unlockedPrivateKey),
    unlock,
    lock,
    refresh,
  }
}
