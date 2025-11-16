// server/utils/webauthn.ts
export const uint8 = (arr: number[]) => new Uint8Array(arr);
export const arrFrom = (u: Uint8Array) => Array.from(u);