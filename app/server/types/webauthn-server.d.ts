// types/webauthn-server.d.ts
declare module 'webauthn-server' {
  export interface RegistrationOptions {
    rpName: string;
    rpID: string;
    userID: string;
    userName: string;
    timeout?: number;
    attestationType?: 'none' | 'indirect' | 'direct' | 'enterprise';
  }

  export interface RegistrationChallenge {
    challenge: string;
  }

  export interface RegistrationInfo {
    credentialID: Buffer;
    credentialPublicKey: Buffer;
    counter: number;
  }

  export interface VerificationResult {
    verified: boolean;
    registrationInfo?: RegistrationInfo;
  }

  export function generateRegistrationOptions(
    opts: RegistrationOptions
  ): RegistrationChallenge;

  export function verifyRegistration(params: {
    response: unknown; 
    expectedChallenge: string;
    expectedOrigin: string;
    expectedRPID: string;
    requireUserVerification?: boolean;
  }): Promise<VerificationResult>;
    export interface AuthenticationOptions {
    rpID: string;
    timeout?: number;
    userVerification?: 'discouraged' | 'preferred' | 'required';
    allowCredentials?: {
      id: Buffer;
      type: string;
      transports?: string[];
    }[];
  }

  export interface AuthenticationChallenge {
    challenge: string;
  }

  export function generateAuthenticationOptions(
    opts: AuthenticationOptions
  ): AuthenticationChallenge;

  export interface AuthenticationResponseJSON {
    id: string;
    rawId: Uint8Array;
    response: {
      authenticatorData: Uint8Array;
      clientDataJSON: Uint8Array;
      signature: Uint8Array;
      userHandle?: Uint8Array;
    };
    type: string;
  }

  export interface AuthenticationResult {
    verified: boolean;
    authenticationInfo?: {
      newCounter: number;
    };
  }

  export function verifyAuthentication(params: {
    response: AuthenticationResponseJSON;
    expectedChallenge: string;
    expectedOrigin: string;
    expectedRPID: string;
    authenticator: {
      credentialID: Uint8Array;
      credentialPublicKey: Uint8Array;
      counter: number;
    };
  }): Promise<AuthenticationResult>;
}
