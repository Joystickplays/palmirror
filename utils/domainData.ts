import { isPalMirrorSecureActivated, setSecureData, getSecureData, getAllKeys, PLMSecureGeneralSettings } from './palMirrorSecureUtils';
import { getActivePLMSecureSession } from './palMirrorSecureSession';
import { getAttributesSysInst } from './domainInstructionShaping/attributesSysInst';
import { DomainAttributeEntry } from '@/types/CharacterData';
import { getTotalChatsSysInst } from './domainInstructionShaping/chatHistorySysInst';


interface ChatMetadata {
    id: string;
    lastUpdated: string;
    associatedDomain?: string;
    entryTitle?: string;
}


export async function getDomainAttributes(domainID: string) {
    if (typeof window === 'undefined') {
        return [];
    }

    const sessionKey = getActivePLMSecureSession();
    if (!sessionKey) {
        return [];
    }

    try {
        const data = await getSecureData(`METADATA${domainID}`, sessionKey, true);

        if (
            data &&
            data.plmex &&
            data.plmex.domain &&
            data.plmex.domain.attributes
        ) {
            return data.plmex.domain.attributes;
        }

        return [];
    } catch (error) {
        console.error("Failed to get domain attributes:", error);
        return [];
    }
}


export function setDomainAttributes(domainID: string, attribute: string, value: number, relative: boolean = false) {
    if (typeof window === 'undefined') {
        return;
    }

    const sessionKey = getActivePLMSecureSession();
    if (sessionKey) {
        getSecureData(
            `METADATA${domainID}`,
            sessionKey,
            true
        ).then(async (data) => {
            if (data) {
                const parsedData = data
                if (parsedData.plmex && parsedData.plmex.domain && parsedData.plmex.domain.attributes) {
                    const attributes = parsedData.plmex.domain.attributes;
                    const attributeToUpdate = attributes.find((attr: DomainAttributeEntry) => attr.attribute === attribute);
                    if (attributeToUpdate) {
                        attributeToUpdate.value = value + (relative ? attributeToUpdate.value : 0);
                    } else {
                        attributes.push({ name: attribute, value: value + (relative ? 0 : value) });
                    }
                    await setSecureData(`METADATA${domainID}`, parsedData, sessionKey, true);
                }
            }
        });
    }
}

export async function getDomainMemories(domainID: string) {
    if (typeof window === 'undefined') {
        return [];
    }

    const sessionKey = getActivePLMSecureSession();
    if (!sessionKey) {
        return [];
    }

    try {
        const data = await getSecureData(`METADATA${domainID}`, sessionKey, true);

        if (
            data &&
            data.plmex &&
            data.plmex.domain &&
            data.plmex.domain.memories
        ) {
            return data.plmex.domain.memories;
        }

        return [];
    } catch (error) {
        console.error("Failed to get domain memories:", error);
        return [];
    }
}


export async function totalChatsFromDomain(domainID: string) {
    if (typeof window === 'undefined') return [];

    const sessionKey = getActivePLMSecureSession();
    if (!sessionKey) return [];

    try {
        const keys = await getAllKeys();
        const chatKeys = keys.filter(
            (key): key is string =>
                typeof key === "string" &&
                key.startsWith("METADATA") &&
                key !== `METADATA${domainID}`
        );

        const chatEntries = await Promise.all(
            chatKeys.map(async (key) => {
                const data: ChatMetadata = await getSecureData(key, sessionKey, true);
                if (!data) return;
                if (!data.entryTitle) return;
                if (data.associatedDomain !== domainID) return;

                return data.entryTitle;
            })
        );

        return chatEntries.filter((title): title is string => Boolean(title));
    } catch (err) {
        console.error("Failed to get total chats from domain:", err);
        return [];
    }
}



export async function buildFullDomainInstruction(domainID: string, entryTitle: string) {
    return `
${getAttributesSysInst(await getDomainAttributes(domainID) as DomainAttributeEntry[])}
${getTotalChatsSysInst(await totalChatsFromDomain(domainID), entryTitle)}
    `;
    // dealing w this later
}