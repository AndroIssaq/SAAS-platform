'use client'

import type SodiumType from 'libsodium-wrappers-sumo'

let sodiumInstance: typeof SodiumType | null = null
let loadingPromise: Promise<typeof SodiumType> | null = null

async function loadSodium(): Promise<typeof SodiumType> {
  if (sodiumInstance) return sodiumInstance
  if (!loadingPromise) {
    loadingPromise = import('libsodium-wrappers-sumo').then(async (mod) => {
      const sodium = (mod as any).default ?? mod
      await sodium.ready
      sodiumInstance = sodium
      return sodium
    })
  }
  return loadingPromise
}

export async function getSodiumInstance() {
  return loadSodium()
}

export interface EncryptedWorkspacePayload {
  version: string
  algorithm: string
  nonce: string
  ciphertext: string
  sealedKey: string
  timestamp: string
}

export interface EncryptPayloadResult {
  encryptedPayload: string
  encryptionVersion: string
}

export async function encryptDataForWorkspace(payload: unknown, workspacePublicKeyBase64: string): Promise<EncryptPayloadResult> {
  const sodium = await loadSodium()

  if (!workspacePublicKeyBase64) {
    throw new Error('المفتاح العام للمساحة غير متوفر')
  }

  const publicKey = sodium.from_base64(workspacePublicKeyBase64)
  const message = sodium.from_string(JSON.stringify(payload))

  const symmetricKey = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES)
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
  const ciphertext = sodium.crypto_secretbox_easy(message, nonce, symmetricKey)
  const sealedKey = sodium.crypto_box_seal(symmetricKey, publicKey)

  const payloadEnvelope: EncryptedWorkspacePayload = {
    version: 'v1',
    algorithm: 'xsalsa20-poly1305',
    nonce: sodium.to_base64(nonce),
    ciphertext: sodium.to_base64(ciphertext),
    sealedKey: sodium.to_base64(sealedKey),
    timestamp: new Date().toISOString(),
  }

  return {
    encryptedPayload: JSON.stringify(payloadEnvelope),
    encryptionVersion: 'v1',
  }
}

export async function decryptWorkspacePayload(
  encryptedPayloadJson: string,
  workspacePublicKeyBase64: string,
  workspacePrivateKeyBase64: string
) {
  const sodium = await loadSodium()
  const envelope = JSON.parse(encryptedPayloadJson) as EncryptedWorkspacePayload

  const nonce = sodium.from_base64(envelope.nonce)
  const ciphertext = sodium.from_base64(envelope.ciphertext)
  const sealedKey = sodium.from_base64(envelope.sealedKey)
  const publicKey = sodium.from_base64(workspacePublicKeyBase64)
  const privateKey = sodium.from_base64(workspacePrivateKeyBase64)

  const symmetricKey = sodium.crypto_box_seal_open(sealedKey, publicKey, privateKey)
  const plaintextBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, symmetricKey)
  const plaintext = sodium.to_string(plaintextBytes)
  return JSON.parse(plaintext)
}
