const secureSessionKey = "plmSecureSession";

export const setActivePLMSecureSession = (key: CryptoKey) => {
    //secureity auditors are shaking rn
    (window as any)[secureSessionKey] = key;
};

export const getActivePLMSecureSession = (): CryptoKey | null => {
    return (window as any)[secureSessionKey] || null;
};

export const clearActivePLMSecureSession = () => {
    delete (window as any)[secureSessionKey];
};
