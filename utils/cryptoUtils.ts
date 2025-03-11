export const deriveKey = async (password: string, salt: Uint8Array) => {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
};

const fromStringToCryptoKey = async (key: string): Promise<CryptoKey> => {
    const keyBuffer = Buffer.from(key, 'hex');
    return await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
}


export const encryptData = async (data: string, password: string | CryptoKey, salt: Uint8Array, iv: Uint8Array, passAsKey: boolean) => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const key = passAsKey ? password as CryptoKey : await deriveKey(password as string, salt);
    const encryptedData = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBuffer
    );
    return { encryptedData };
};

export const decryptData = async (password: string | CryptoKey, data: { encryptedData: ArrayBuffer }, salt: Uint8Array, iv: Uint8Array, passAsKey: boolean) => {
    const key = passAsKey ? password as CryptoKey : (await deriveKey(password as string, salt))
    const decryptedData = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data.encryptedData
    );
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
};
