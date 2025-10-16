import { isPalMirrorSecureActivated, setSecureData, getSecureData, getAllKeys, PLMSecureGeneralSettings } from './palMirrorSecureUtils';
import { getActivePLMSecureSession } from './palMirrorSecureSession';
import { getAttributesSysInst } from './domainInstructionShaping/attributesSysInst';
import { DomainAttributeEntry } from '@/types/CharacterData';
import { getTotalChatsSysInst } from './domainInstructionShaping/chatCountSysInst';


export function getDomainAttributes(domainID: string) {
    if (typeof window === 'undefined') {
        return [];
    }

    const sessionKey = getActivePLMSecureSession();
    if (sessionKey) {
        const domainData = getSecureData(
            `METADATA${domainID}`,
            sessionKey,
            true
        ).then((data) => {
            if (data) {
                const parsedData = JSON.parse(data as string);
                if (parsedData.plmex && parsedData.plmex.domain && parsedData.plmex.domain.attributes) {
                    return parsedData.plmex.domain.attributes;
                }
            }
            return [];
        }).catch((error) => {
            console.error("Failed to get domain attributes:", error);
            return [];
        });
        return domainData;
    }

    return [];
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
                const parsedData = JSON.parse(data as string);
                if (parsedData.plmex && parsedData.plmex.domain && parsedData.plmex.domain.attributes) {
                    const attributes = parsedData.plmex.domain.attributes;
                    const attributeToUpdate = attributes.find((attr: DomainAttributeEntry) => attr.attribute === attribute);
                    if (attributeToUpdate) {
                        attributeToUpdate.value = value + (relative ? attributeToUpdate.value : 0);
                    } else {
                        attributes.push({ name: attribute, value: value + (relative ? 0 : value) });
                    }
                    await setSecureData(`METADATA${domainID}`, JSON.stringify(parsedData), sessionKey);
                }
            }
        });
    }
}

export function getDomainMemories(domainID: string) {
    if (typeof window === 'undefined') {
        return [];
    }

    const sessionKey = getActivePLMSecureSession();
    if (sessionKey) {
        const domainData = getSecureData(
            `METADATA${domainID}`,
            sessionKey,
            true
        ).then((data) => {
            if (data) {
                const parsedData = JSON.parse(data as string);
                if (parsedData.plmex && parsedData.plmex.domain && parsedData.plmex.domain.memories) {
                    return parsedData.plmex.domain.memories;
                }
            }
            return [];
        }).catch((error) => {
            console.error("Failed to get domain memories:", error);
            return [];
        });
        return domainData;
    }

    return [];
}

export async function totalChatsFromDomain(domainID: string) {
    if (typeof window === 'undefined') return 0;

    const sessionKey = getActivePLMSecureSession();
    if (!sessionKey) return 0;

    try {
        const keys = await getAllKeys();
        const chatKeys = keys.filter(
            (key): key is string =>
                typeof key === "string" &&
                key.startsWith("METADATA") &&
                key !== `METADATA${domainID}`
        );

        const matches = await Promise.all(
            chatKeys.map(async (key) => {
                const data = await getSecureData(key, sessionKey, true);
                if (!data) return false;

                const parsedData = JSON.parse(data as string);
                return parsedData.associatedDomain === domainID;
            })
        );

        return chatKeys.filter((_, i) => matches[i]).length;
    } catch (err) {
        console.error("Failed to get total chats from domain:", err);
        return 0;
    }
}


export function buildFullDomainInstruction(domainID: string) {
    return `
    ${getAttributesSysInst(getDomainAttributes(domainID) as DomainAttributeEntry[])}
    `;
    // ${getTotalChatsSysInst(await totalChatsFromDomain(domainID))}
    // dealing w this later
}