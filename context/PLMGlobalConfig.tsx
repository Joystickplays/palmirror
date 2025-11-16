"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  ReactNode,
} from "react";

const PREFIX = "PLMGC_";

type PLMGlobalConfigContextType = {
  set: (key: string, value: any, persist?: boolean) => void;
  get: <T = any>(key: string) => T | undefined;
};

const PLMGlobalConfigContext =
  createContext<PLMGlobalConfigContextType | null>(null);

export const PLMGlobalConfigProvider = ({ children }: { children: ReactNode }) => {
  const [store, setStore] = useState<Record<string, any>>({});

  useEffect(() => {
    const loaded: Record<string, any> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      if (!fullKey) continue;

      if (fullKey.startsWith(PREFIX)) {
        const key = fullKey.replace(PREFIX, "");
        const value = localStorage.getItem(fullKey);

        if (value !== null) {
          try {
            loaded[key] = JSON.parse(value);
          } catch {
            loaded[key] = value;
          }
        }
      }
    }

    setStore(loaded);
  }, []);

  const set = useCallback(
    (key: string, value: any, persist = false) => {
      setStore((prev) => ({ ...prev, [key]: value }));

      if (persist) {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
      }
    },
    []
  );

  const get = useCallback(
    <T = any,>(key: string): T | undefined => {
      if (key in store) {
        return store[key] as T;
      }

      const lsValue = localStorage.getItem(PREFIX + key);
      if (lsValue === null) return undefined;

      try {
        return JSON.parse(lsValue) as T;
      } catch {
        return lsValue as unknown as T;
      }
    },
    [store]
  );

  return (
    <PLMGlobalConfigContext.Provider value={{ set, get }}>
      {children}
    </PLMGlobalConfigContext.Provider>
  );
};

export const usePLMGlobalConfig = () => {
  const ctx = useContext(PLMGlobalConfigContext);
  if (!ctx) {
    throw new Error("usePLMGlobalConfig must be used inside a PLMGlobalConfigProvider");
  }
  return ctx;
};
