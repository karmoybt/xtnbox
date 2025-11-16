// app/utils/webauthn.ts
export function publicKeyCredentialToJSON(cred: PublicKeyCredential) {
  const { type, id } = cred;
  const response = cred.response as AuthenticatorAttestationResponse;
  return {
    type,
    id,
    rawId: Array.from(new Uint8Array(cred.rawId)),
    response: {
      attestationObject: Array.from(new Uint8Array(response.attestationObject)),
      clientDataJSON: Array.from(new Uint8Array(response.clientDataJSON)),
      transports: response.getTransports?.() || [],
    },
  };
}