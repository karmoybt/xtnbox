<template>
  <form @submit.prevent="register">
    <input v-model="email" placeholder="Email">
    <input v-model="name" placeholder="Name" >
    <button type="submit">Registrarse</button>
  </form>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo } from 'nuxt/app'

interface RegisterChallenge {
  challenge: string
}

interface CredentialJSON {
  id: string
  rawId: number[]
  response: {
    attestationObject: number[]
    clientDataJSON: number[]
    transports?: string[]
  }
  type: 'public-key'
}

const email = ref('')
const name = ref('')

async function register() {
  try {
    // Paso 1: Solicitar desafío
    const { challenge } = await $fetch<RegisterChallenge>('/api/auth/register', {
      method: 'POST',
      body: { email: email.value, name: name.value }
    })

    // Paso 2: Crear credencial Passkey
    const credential = await navigator.credentials.create({
      publicKey: {
        rp: { name: 'CristinaCRM', id: 'localhost' },
        user: {
          id: new TextEncoder().encode(email.value),
          name: email.value,
          displayName: name.value
        },
        challenge: Uint8Array.from(atob(challenge), c => c.charCodeAt(0)),
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        timeout: 60000,
        attestation: 'none'
      }
    }) as PublicKeyCredential

    // Paso 3: Convertir y enviar verificación
    const credJson = publicKeyCredentialToJSON(credential)
    const verification = await $fetch<{ success: boolean; user: { id: string; email: string } }>('/api/auth/register/verify', {
      method: 'POST',
      body: { email: email.value, credential: credJson }
    })

    if (verification.success) {
      await navigateTo('/')
    }
  } catch (err) {
    console.error('Registro fallido:', err)
    alert('Error durante el registro')
  }
}

function publicKeyCredentialToJSON(cred: PublicKeyCredential): CredentialJSON {
  const { type, id } = cred as { type: 'public-key'; id: string }
  const response = cred.response as AuthenticatorAttestationResponse
  return {
    type,
    id,
    rawId: Array.from(new Uint8Array(cred.rawId)),
    response: {
      attestationObject: Array.from(new Uint8Array(response.attestationObject)),
      clientDataJSON: Array.from(new Uint8Array(response.clientDataJSON)),
      transports: response.getTransports?.() || []
    }
  }
}
</script>

