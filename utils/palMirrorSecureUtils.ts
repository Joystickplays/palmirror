import { openDB, IDBPDatabase } from 'idb';
import { encryptData, decryptData } from './cryptoUtils';

export const dbName = 'PalMirrorSecure';
export const storeName = 'secureStore';

export interface PLMSecureGeneralSettings {
    proxy: {
        api_key: string;
    };
}

const getDB = async (): Promise<IDBPDatabase> => {
    const db = await openDB(dbName, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
            }
        },
    });

    if (navigator.storage && navigator.storage.persist) {
        await navigator.storage.persist();
        console.log("PalMirror Secure DB has been requested to be persistent.")
    }

    return db;
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




const generateSaltAndIv = () => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    return { salt, iv };
};

export const getSaltAndIv = async () => {
    const db = await getDB();
    const storedMetadata = await db.get(storeName, 'PLMSecureMetadata');

    if (storedMetadata) {
        return { salt: storedMetadata.salt, iv: storedMetadata.iv };
    } else {
        const { salt, iv } = generateSaltAndIv();
        await db.put(storeName, { salt, iv }, 'PLMSecureMetadata');
        return { salt, iv };
    }
};


export const exportSecureData = async (password: string): Promise<Blob> => {
    const db = await getDB();
    const keys = await db.getAllKeys(storeName);
    const data: Record<string, any> = {};

    for (const key of keys) {
        const strKey = typeof key === 'string' ? key : JSON.stringify(Array.from(new Uint8Array(key as ArrayBuffer)));
        data[strKey] = await db.get(storeName, key);
    }

    const exportBlob = {
        version: 1,
        createdAt: Date.now(),
        data
    };


    const { salt, iv } = await getSaltAndIv();
    const encrypted = await encryptData(exportBlob, password, salt, iv, true);
    const blob = new Blob([JSON.stringify(encrypted)], { type: 'application/json' });
    return blob;
};

export const importSecureData = async (file: File, password: string): Promise<void> => {
    const text = await file.text();
    const encrypted = JSON.parse(text);

    const { salt, iv } = await getSaltAndIv();
    const decrypted = await decryptData(encrypted, password, salt, iv, true);

    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');
    for (const [key, value] of Object.entries(decrypted.data)) {
        await tx.store.put(value, key);
    }
    await tx.done;
};
