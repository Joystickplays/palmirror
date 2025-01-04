import { openDB } from 'idb';
import { encryptData, decryptData } from './cryptoUtils';

export const dbName = 'PalMirrorSecure';
export const storeName = 'secureStore';

export interface PLMSecureGeneralSettings {
    proxy: {
        api_key: string;
    };
}

const getDB = async () => {
    return openDB(dbName, 1, {
        upgrade(db) {
            db.createObjectStore(storeName);
        },
    });
};

const generateSaltAndIv = () => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    return { salt, iv };
};

export const getSaltAndIv = async () => {
    const db = await getDB();
    let storedMetadata = await db.get(storeName, 'PLMSecureMetadata');
    if (storedMetadata) {
        return { salt: storedMetadata.salt, iv: storedMetadata.iv };
    } else {
        const { salt, iv } = generateSaltAndIv();
        await db.put(storeName, { salt, iv }, 'PLMSecureMetadata');
        return { salt, iv };
    }
};

export const setSecureData = async (
  key: string, 
  data: any, 
  password: string | CryptoKey, 
  passAsKey: boolean = false
) => {
    const db = await getDB();
    
    const { salt, iv } = await getSaltAndIv();
    const { encryptedData } = await encryptData(
        JSON.stringify(data), password, salt, iv, passAsKey
    );
    await db.put(storeName, { encryptedData }, key);
};

export const getSecureData = async (
    key: string,
    password: string | CryptoKey,
    passAsKey: boolean = false
) => {
    const db = await getDB();
    const { salt, iv } = await getSaltAndIv();
    const storedData = await db.get(storeName, key);
    if (!storedData) {
        throw new Error('No data found');
    }
    const decryptedData = await decryptData(password, storedData, salt, iv, passAsKey);
    return JSON.parse(decryptedData);
};

export const removeSecureData = async (key: string) => {
    const db = await getDB();
    await db.delete(storeName, key);
};

export const removeKey = async (key: string) => {
    const db = await getDB();
    await db.delete(storeName, key);
};

export const isPalMirrorSecureActivated = async () => {
    const db = await getDB();
    const storedMetadata = await db.get(storeName, 'PLMSecureMetadata');
    return !!storedMetadata;
};

export const getAllKeys = async () => {
    const db = await getDB();
    return await db.getAllKeys(storeName);
};


