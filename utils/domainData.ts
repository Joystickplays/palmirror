import { isPalMirrorSecureActivated, setSecureData, getSecureData, getAllKeys, PLMSecureGeneralSettings } from './palMirrorSecureUtils';
import { getActivePLMSecureSession } from './palMirrorSecureSession';

import { getAttributesSysInst } from './domainInstructionShaping/attributesSysInst';
import { getTotalChatsSysInst } from './domainInstructionShaping/chatHistorySysInst';
import { getMemorySysInst } from './domainInstructionShaping/memorySysInst';

import { DomainAttributeEntry, DomainMemoryEntry } from '@/types/CharacterData';


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
            return data.plmex.domain.memories as DomainMemoryEntry[];
        }

        return [];
    } catch (error) {
        console.error("Failed to get domain memories:", error);
        return [];
    }
}

export async function setDomainMemories(domainID: string, memoryList: DomainMemoryEntry[]) {
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
            data.plmex.domain.memories = memoryList
            await setSecureData(`METADATA${domainID}`, data, sessionKey, true);
        }

        return [];
    } catch (error) {
        console.error("Failed to set domain memories:", error);
        return [];
    }
}

export async function addDomainMemory(domainID: string, newMemory: string, associatedMessage: string,) {
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
            const memories: DomainMemoryEntry[] = data.plmex.domain.memories;
            memories.push({
                key: Math.floor(Math.random() * 69420),
                memory: newMemory,
                state: "remembering",
                lifetime: 10,
                associatedMessage: associatedMessage,
            } as DomainMemoryEntry)

            data.plmex.domain.memories = memories
            await setSecureData(`METADATA${domainID}`, data, sessionKey, true);
        }

        return [];
    } catch (error) {
        console.error("Failed to set domain memories:", error);
        return [];
    }
}

export async function deleteMemoryFromMessageIfAny(domainID: string, messageId: string) {
    if (typeof window === 'undefined') {
        return;
    }

    const sessionKey = getActivePLMSecureSession();
    if (!sessionKey) {
        return;
    }

    try {
        const memories = await getDomainMemories(domainID)

        const filteredMemories = memories.filter((memory) => memory.associatedMessage !== messageId)
        await setDomainMemories(domainID, filteredMemories)
    } catch (error) {
        console.error("Failed to delete memory from chat:", error)
        return;
    }
}


export function getTrueDomainMemories(memoryEntries: DomainMemoryEntry[]) {
    if (typeof window === 'undefined') {
        return [];
    }

    const sessionKey = getActivePLMSecureSession();
    if (!sessionKey) {
        return [];
    }

    const activeMemories = memoryEntries.map((memory) => {
        if (memory.state !== "remembering") { return; }
        return memory.memory
    })

    return activeMemories.filter((memory): memory is string => Boolean(memory))
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
${getMemorySysInst(getTrueDomainMemories(await getDomainAttributes(domainID)))}
    `;
    // dealing w this later
}