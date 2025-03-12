"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface PersistedCredential {
  hkdfSalt: string;
  encryptedPrimaryKey: string;
  encryptionIV: string;
  credentialId: string; // Stored as a hex string derived from the raw credential id.
  createdAt: number;
}

export type Credential = PersistedCredential;

export interface AuthContextType {
  isAuthenticated: boolean;
  credential?: Credential;
  registerUser: (primaryKey?: string) => Promise<void>;
  authenticate: () => Promise<ArrayBuffer>;
  logout: () => void;
  deleteCredential: () => Promise<void>;
  decryptedPrimaryKey?: Uint8Array;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ----- IndexedDB Helpers (unchanged) -----
const DB_NAME = "CredentialDB";
const STORE_NAME = "credentialStore";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getPersistedCredential(): Promise<PersistedCredential | null> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        console.log("PLM Secure - Getting `credential` from IndexedDB");
        const req = store.get("credential");
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      })
  );
}

function setPersistedCredential(cred: PersistedCredential): Promise<void> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(cred, "credential");
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })
  );
}

function deletePersistedCredential(): Promise<void> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete("credential");
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })
  );
}

// ----- Utility Functions (unchanged) -----
const hexToUint8Array = (hex: string): Uint8Array =>
  new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

const uint8ArrayToHex = (arr: Uint8Array): string =>
  Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const generateRandomBuffer = (length: number): Uint8Array => {
  const buffer = new Uint8Array(length);
  window.crypto.getRandomValues(buffer);
  return buffer;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  let base64Fixed = base64.replace(/-/g, "+").replace(/_/g, "/");
  while (base64Fixed.length % 4 !== 0) {
    base64Fixed += "=";
  }
  const binary = window.atob(base64Fixed);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// ----- Existing Crypto Functions (unchanged) -----
const encryptPrimaryKey = async (
  derivedKey: CryptoKey,
  keyToEncrypt: Uint8Array
): Promise<{ ciphertext: string; iv: string }> => {
  const iv = generateRandomBuffer(12);
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    derivedKey,
    keyToEncrypt
  );
  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
};

const decryptPrimaryKey = async (
  derivedKey: CryptoKey,
  ciphertext: string,
  iv: string
): Promise<ArrayBuffer> => {
  const ivBuffer = new Uint8Array(base64ToArrayBuffer(iv));
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  return window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuffer },
    derivedKey,
    ciphertextBuffer
  );
};

// ----- Fixed Challenge–Based Key Derivation Constants -----
const FIXED_CHALLENGE_STRING = "PLMSecureStaticChallenge";
const FIXED_CHALLENGE = new TextEncoder().encode(FIXED_CHALLENGE_STRING);
const FIXED_SALT_STRING = "PLMSecureFixedSalt";
const FIXED_SALT = new TextEncoder().encode(FIXED_SALT_STRING);
const INFO_STRING = "WebAuthn-Key";

// ----- Derive Key from a WebAuthn Assertion -----
// This function takes the signature from a WebAuthn assertion (obtained using our fixed challenge)
// and uses HKDF with a fixed salt and info to derive a stable AES-GCM key.
async function deriveKeyFromAssertion(
  assertion: PublicKeyCredential
): Promise<CryptoKey> {
  const assertionResponse = assertion.response as AuthenticatorAssertionResponse;
  const signatureBuffer = assertionResponse.signature; 

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    signatureBuffer,
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: FIXED_SALT,
      info: new TextEncoder().encode("some-context"), // Make sure to provide a valid context
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}
// ----- WebAuthnProvider Component (Modified) -----
export const WebAuthnProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credential, setCredential] = useState<Credential | undefined>(
    undefined
  );
  const [decryptedPrimaryKey, setDecryptedPrimaryKey] = useState<
    Uint8Array | undefined
  >(undefined);

  // On mount, load the persisted credential from IndexedDB.
  useEffect(() => {
    (async () => {
      try {
        const persisted = await getPersistedCredential();
        if (persisted) {
          setCredential(persisted);
        }
      } catch (err) {
        console.error("Error loading persisted credential:", err);
      }
    })();
  }, []);

  // ----- Registration Flow (Modified) -----
  const registerUser = async (primaryKeyInput?: string): Promise<void> => {
    const encoder = new TextEncoder();

    // Create a challenge for WebAuthn (registration challenge must be random).
    const challenge = generateRandomBuffer(32);

    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge: challenge.buffer,
      rp: { name: "Local Test App" },
      user: {
        // Dummy values; the browser will ignore these for a platform authenticator.
        id: new Uint8Array(16),
        name: "user@example.com",
        displayName: "Test User",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: 60000,
      attestation: "none",
    };

    try {
      const credentialResponse = (await navigator.credentials.create({
        publicKey,
      })) as PublicKeyCredential;
      if (!credentialResponse) throw new Error("Credential creation failed");

      // Use the rawId as the credentialId.
      const rawId = new Uint8Array(credentialResponse.rawId);
      const credentialIdHex = uint8ArrayToHex(rawId);

      // Use a fixed challenge to derive a stable encryption key.
      const fixedPublicKey: PublicKeyCredentialRequestOptions = {
        challenge: FIXED_CHALLENGE.buffer,
        timeout: 60000,
        userVerification: "required",
        allowCredentials: [
          {
            id: rawId,
            type: "public-key",
            transports: ["internal"],
          },
        ],
      };
      const fixedAssertion = (await navigator.credentials.get({
        publicKey: fixedPublicKey,
      })) as PublicKeyCredential;
      const derivedKey = await deriveKeyFromAssertion(fixedAssertion);

      // Determine the key to encrypt (either provided by the user or generated randomly).
      const keyToEncrypt = primaryKeyInput
        ? encoder.encode(primaryKeyInput)
        : generateRandomBuffer(32);

      const { ciphertext, iv } = await encryptPrimaryKey(derivedKey, keyToEncrypt);

      // Persist the credential along with our fixed salt (used for key derivation).
      const newPersistedCredential: PersistedCredential = {
        hkdfSalt: arrayBufferToBase64(FIXED_SALT.buffer),
        encryptedPrimaryKey: ciphertext,
        encryptionIV: iv,
        credentialId: credentialIdHex,
        createdAt: Date.now(),
      };

      await setPersistedCredential(newPersistedCredential);
      setCredential(newPersistedCredential);
    } catch (err) {
      console.error("Registration error:", err);
      throw err;
    }
  };

  // ----- Authentication Flow (Modified) -----
  const authenticate = async (): Promise<ArrayBuffer> => {
    if (!credential) {
      throw new Error("No registered credential found");
    }
    try {
      // Use the fixed challenge to re-derive the encryption key.
      const fixedPublicKey: PublicKeyCredentialRequestOptions = {
        challenge: FIXED_CHALLENGE.buffer,
        timeout: 60000,
        userVerification: "required",
        allowCredentials: [
          {
            id: hexToUint8Array(credential.credentialId),
            type: "public-key",
            transports: ["internal"],
          },
        ],
      };
      const fixedAssertion = (await navigator.credentials.get({
        publicKey: fixedPublicKey,
      })) as PublicKeyCredential;
      const derivedKey = await deriveKeyFromAssertion(fixedAssertion);

      const decryptedBuffer = await decryptPrimaryKey(
        derivedKey,
        credential.encryptedPrimaryKey,
        credential.encryptionIV
      );
      setDecryptedPrimaryKey(new Uint8Array(decryptedBuffer));
      setIsAuthenticated(true);
      return decryptedBuffer;
    } catch (err) {
      console.error("Authentication error:", err);
      throw err;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setDecryptedPrimaryKey(undefined);
  };

  const deleteCredential = async (): Promise<void> => {
    await deletePersistedCredential();
    setCredential(undefined);
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        credential,
        registerUser,
        authenticate,
        logout,
        deleteCredential,
        decryptedPrimaryKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within an WebAuthnProvider");
  return context;
};
