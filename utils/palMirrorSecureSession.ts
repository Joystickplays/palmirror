const secureSessionKey = "plmSecureSession";

export const setActivePLMSecureSession = (key: CryptoKey) => {
    (window as any)[secureSessionKey] = key;
};

export const getActivePLMSecureSession = (): CryptoKey | null => {
    return (window as any)[secureSessionKey] || null;
};

export const clearActivePLMSecureSession = () => {
    delete (window as any)[secureSessionKey];
};
