"use client";

import React, { createContext, useState, ReactNode } from 'react';
import { deriveKey } from '@/utils/cryptoUtils';
import {
  getSaltAndIv,
  setSecureData as setSecureDataUtil,
  getSecureData as getSecureDataUtil,
  getAllKeys as getAllKeysUtil,
  removeKey as removeKeyUtil,
} from '@/utils/palMirrorSecureUtils';
import { WebAuthnProvider, useAuth } from '@/context/PLMSecureWebAuthnContext';

interface PLMSecureContextProps {
  setKey: (password: string) => Promise<boolean>;
  verifyKey: (password: string) => Promise<boolean>;
  setSecureData: (key: string, data: any) => Promise<void>;
  getSecureData: (key: string) => Promise<any>;
  getAllKeys: () => Promise<string[]>;
  isSecureReady: () => boolean;
  removeKey: (key: string) => Promise<void>;

  registerCredential: (password: string) => Promise<void>;
  authenticateCredential: () => Promise<ArrayBuffer>;
  resetCredential: () => Promise<void>;
  hasCredential: boolean;
}

export const PLMSecureContext = createContext<PLMSecureContextProps | undefined>(undefined);

export const PLMSecureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [derivedKey, setDerivedKey] = useState<CryptoKey | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  return (
    <WebAuthnProvider>
      <MergedProviderContent
        derivedKey={derivedKey}
        setDerivedKey={setDerivedKey}
        isReady={isReady}
        setIsReady={setIsReady}
      >
        {children}
      </MergedProviderContent>
    </WebAuthnProvider>
  );
};

interface MergedProviderContentProps {
  children: ReactNode;
  derivedKey: CryptoKey | null;
  setDerivedKey: React.Dispatch<React.SetStateAction<CryptoKey | null>>;
  isReady: boolean;
  setIsReady: React.Dispatch<React.SetStateAction<boolean>>;
}

const MergedProviderContent: React.FC<MergedProviderContentProps> = ({
  children,
  derivedKey,
  setDerivedKey,
  isReady,
  setIsReady,
}) => {
  const { registerUser, authenticate, deleteCredential, credential } = useAuth();

  const registerCredential = async (password: string): Promise<void> => {
    await registerUser(password);
  };

  const authenticateCredential = async (): Promise<ArrayBuffer> => {
    return await authenticate();
  };

  const resetCredential = async (): Promise<void> => {
    await deleteCredential();
  };

  const setKey = async (password: string, passAsKey: boolean = false): Promise<boolean> => {
    try {
      await getSecureDataUtil('generalSettings', password, passAsKey);
    } catch (e) {
      console.log("PLM Secure - Verification failed!");
      console.log(e);
      return false;
    }
    const { salt } = await getSaltAndIv();
    const derived = await deriveKey(password, salt);
    setDerivedKey(derived);
    setIsReady(true);
    return true;
  };

  const verifyKey = async (password: string, passAsKey: boolean = false): Promise<boolean> => {
    try {
      await getSecureDataUtil('generalSettings', password, passAsKey);
      return true;
    } catch (e) {
      console.log("PLM Secure - Verification failed!");
      console.log(e);
      return false;
    }
  };

  const setSecureData = async (key: string, data: any): Promise<void> => {
    if (!derivedKey) {
      throw new Error('Derived key is not set');
    }
    await setSecureDataUtil(key, data, derivedKey, true);
  };

  const getSecureData = async (key: string): Promise<any> => {
    if (!derivedKey) {
      throw new Error('Derived key is not set');
    }
    return await getSecureDataUtil(key, derivedKey, true);
  };

  const getAllKeys = async (): Promise<string[]> => {
    if (!derivedKey) {
      throw new Error('Derived key is not set');
    }
    const keys = await getAllKeysUtil();
    return keys.map(key => key.toString());
  };

  const removeKey = async (key: string): Promise<void> => {
    if (!derivedKey) {
      throw new Error('Derived key is not set');
    }
    await removeKeyUtil(key);
  };

  const isSecureReadyFunc = (): boolean => isReady;

  const hasCredential = Boolean(credential); 

  const mergedContextValue: PLMSecureContextProps = {
    setKey,
    verifyKey,
    setSecureData,
    getSecureData,
    getAllKeys,
    isSecureReady: isSecureReadyFunc,
    removeKey,
    registerCredential,
    authenticateCredential,
    resetCredential,
    hasCredential,
  };

  return (
    <PLMSecureContext.Provider value={mergedContextValue}>
      {children}
    </PLMSecureContext.Provider>
  );
};
