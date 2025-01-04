"use client"

import React, { createContext, useState, ReactNode } from 'react';
import { deriveKey } from '@/utils/cryptoUtils'; 
import { getSaltAndIv, setSecureData as setSecureDataUtil, getSecureData as getSecureDataUtil, getAllKeys as getAllKeysUtil, removeKey as removeKeyUtil } from '@/utils/palMirrorSecureUtils'; 

interface PLMSecureContextProps {
  setKey: (password: string) => Promise<boolean>;
  setSecureData: (key: string, data: any) => Promise<void>;
  getSecureData: (key: string) => Promise<any>;
  getAllKeys: () => Promise<string[]>;
  isSecureReady: () => boolean;
  removeKey: (key: string) => Promise<void>;
}

export const PLMSecureContext = createContext<PLMSecureContextProps | undefined>(undefined);

export const PLMSecureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [derivedKey, setDerivedKey] = useState<CryptoKey | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  const setKey = async (password: string) => {
    try {
      await getSecureDataUtil('generalSettings', password);
    } catch (e) {
      console.log("PLM Secure - Verification failed!")
      console.log(e)
      return false;
    }
    const { salt } = await getSaltAndIv();
    const derived = await deriveKey(password, salt);
    setDerivedKey(derived);
    setIsReady(true);
    return true;
  };

  const setSecureData = async (key: string, data: any) => {
    if (!derivedKey) {
      throw new Error('Derived key is not set');
    }
    await setSecureDataUtil(key, data, derivedKey, true);
  };

  const getSecureData = async (key: string) => {
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
  
  const removeKey = async (key: string) => {
    if (!derivedKey) {
      throw new Error('Derived key is not set');
    }
    await removeKeyUtil(key);
  };

  const isSecureReady = () => {
    return isReady;
  };


  return (
    <PLMSecureContext.Provider value={{ setKey, setSecureData, getSecureData, getAllKeys, isSecureReady, removeKey }}>
      {children}
    </PLMSecureContext.Provider>
  );
};
