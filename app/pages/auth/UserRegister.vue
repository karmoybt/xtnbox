<!-- pages/auth/UserRegister.vue -->
<template>
  <div>
    <h1>Registro</h1>
    <form @submit.prevent="register">
      <input v-model="email" placeholder="Email" type="email" required>
      <input v-model="name"  placeholder="Nombre" required>
      <button type="submit">Registrarse con Passkey</button>
    </form>
  </div>
</template>

<script setup lang="ts">
interface RegisterChallenge {
  challenge: string;
}

const email = ref('')
const name  = ref('')

async function register () {
  const { challenge } = await $fetch<RegisterChallenge>('/api/auth/register', {
    method: 'POST',
    body: { email: email.value, name: name.value },
  })

  const publicKeyCredential = await navigator.credentials.create({
    publicKey: {
      challenge: Uint8Array.from(atob(challenge), c => c.charCodeAt(0)),
      rp:         { name: 'CristinaCRM', id: 'localhost' },
      user:       {
        id:   Uint8Array.from(email.value, c => c.charCodeAt(0)),
        name: email.value,
        displayName: name.value,
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      timeout: 60000,
      attestation: 'none',
    },
  }) as PublicKeyCredential | null

  if (!publicKeyCredential) {
    throw new Error('Could not create credential')
  }

  const verification = await $fetch('/api/auth/register/verify', {
    method: 'POST',
    body: {
      email: email.value,
      credential: {
        id:        publicKeyCredential.id,
        rawId:     btoa(String.fromCharCode(...new Uint8Array(publicKeyCredential.rawId))),
        response:  publicKeyCredential.response,
        type:      publicKeyCredential.type,
      },
    },
  })

  if (verification.success) await navigateTo('/dashboard')
}
</script>