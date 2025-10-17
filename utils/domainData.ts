import { isPalMirrorSecureActivated, setSecureData, getSecureData, getAllKeys, PLMSecureGeneralSettings } from './palMirrorSecureUtils';
import { getActivePLMSecureSession } from './palMirrorSecureSession';
import { getAttributesSysInst } from './domainInstructionShaping/attributesSysInst';
import { DomainAttributeEntry } from '@/types/CharacterData';
import { getTotalChatsSysInst } from './domainInstructionShaping/chatCountSysInst';


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
    console.log("called")
    if (typeof window === 'undefined') {
        return;
    }

    console.log("setting")
    const sessionKey = getActivePLMSecureSession();
    console.log(sessionKey)
    if (sessionKey) {
        getSecureData(
            `METADATA${domainID}`,
            sessionKey,
            true
        ).then(async (data) => {
            if (data) {
                console.log("setting")
                const parsedData = data
                if (parsedData.plmex && parsedData.plmex.domain && parsedData.plmex.domain.attributes) {
                    const attributes = parsedData.plmex.domain.attributes;
                    const attributeToUpdate = attributes.find((attr: DomainAttributeEntry) => attr.attribute === attribute);
                    if (attributeToUpdate) {
                        attributeToUpdate.value = value + (relative ? attributeToUpdate.value : 0);
                    } else {
                        attributes.push({ name: attribute, value: value + (relative ? 0 : value) });
                    }
                    console.log('success')
                    await setSecureData(`METADATA${domainID}`, parsedData, sessionKey);
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


export async function buildFullDomainInstruction(domainID: string) {
    return `
${getAttributesSysInst(await getDomainAttributes(domainID) as DomainAttributeEntry[])}
${getTotalChatsSysInst(await totalChatsFromDomain(domainID))}
    `;
    // dealing w this later
}