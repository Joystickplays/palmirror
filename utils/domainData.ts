import { isPalMirrorSecureActivated, setSecureData, getSecureData, getAllKeys, PLMSecureGeneralSettings } from './palMirrorSecureUtils';
import { getActivePLMSecureSession } from './palMirrorSecureSession';

import { getAttributesSysInst } from './domainInstructionShaping/attributesSysInst';
import { ChatHistory, getTotalChatsSysInst } from './domainInstructionShaping/chatHistorySysInst';
import { getMemorySysInst } from './domainInstructionShaping/memorySysInst';

import { CharacterData, DomainAttributeEntry, DomainAttributeHistory, DomainMemoryEntry, DomainTimestepEntry } from '@/types/CharacterData';
import { getTimestepSysInst } from './domainInstructionShaping/timestepSysInst';


interface ChatMetadata {
    id: string;
    lastUpdated: string;
    associatedDomain?: string;
    entryTitle?: string;
}


export async function getDomainAttributes(domainID: string): Promise<DomainAttributeEntry[]> {
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


export function setDomainAttributes(domainID: string, responsibleMessage: string, attribute: string, value: number, relative: boolean = false) {
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
                    const attributeToUpdate = attributes.find((attr: DomainAttributeEntry) => attr.attribute === attribute) as DomainAttributeEntry;
                    if (attributeToUpdate) {
                        attributeToUpdate.value = value + (relative ? attributeToUpdate.value : 0);
                        
                        if (!attributeToUpdate.history) {
                            attributeToUpdate.history = []
                        }
                        attributeToUpdate.history.push({
                            associatedMessage: responsibleMessage,
                            change: value + (relative ? attributeToUpdate.value : 0)
                        })
                    } else {
                        return; // nope

                        // attributes.push({ key: Math.floor(Math.random() * 69420), attribute: attribute, value: value + (relative ? 0 : value), history: [
                        //     {
                        //         associatedMessage: responsibleMessage,
                        //         change: value + (relative ? 0 : value)
                        //     }
                        // ] } as DomainAttributeEntry);
                    }
                    await setSecureData(`METADATA${domainID}`, parsedData, sessionKey, true);
                }
            }
        });
    }
}

export async function reverseDomainAttribute(domainID: string, message: string) {
    if (typeof window === 'undefined') {
        return;
    }

    const sessionKey = getActivePLMSecureSession();
    if (!sessionKey) {
        return;
    }

    try {
        const data = await getSecureData(`METADATA${domainID}`, sessionKey, true);
        const attributes = data.plmex.domain.attributes as DomainAttributeEntry[]

        attributes.forEach(entry => {
            entry.history.forEach(history => {
                if (history.associatedMessage === message){
                    entry.value -= history.change
                }
            })
        })
        data.plmex.domain.attributes = attributes

        await setSecureData(`METADATA${domainID}`, data, sessionKey, true);
        

    } catch (error) {
        console.error("Failed to reverse an attribute change:", error)
        return;
    }
}



export async function getDomainMemories(domainID: string): Promise<DomainMemoryEntry[]> {
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

export async function addDomainMemory(domainID: string, associatedMessage: string, newMemory: string,) {
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
                lifetime: 100,
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

export async function deleteMemoryFromMessageIfAny(domainID: string, responsibleMessage: string) {
    if (typeof window === 'undefined') {
        return;
    }

    const sessionKey = getActivePLMSecureSession();
    if (!sessionKey) {
        return;
    }

    try {
        const memories = await getDomainMemories(domainID)

        const filteredMemories = memories.filter((memory) => memory.associatedMessage !== responsibleMessage)
        await setDomainMemories(domainID, filteredMemories)
    } catch (error) {
        console.error("Failed to delete memory from chat:", error)
        return;
    }
}


export function getTrueDomainMemories(memoryEntries: DomainMemoryEntry[]): string[] {
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

export async function getDomainTimesteps(chatID: string): Promise<DomainTimestepEntry[]> {
    if (typeof window === 'undefined') {
        return [];
    }
    const sessionKey = getActivePLMSecureSession();
    if (!sessionKey) {
        return [];
    }

    try {
        const data = await getSecureData(`METADATA${chatID}`, sessionKey, true);
        return data?.timesteps || [];
    } catch (error) {
        console.error("Failed to get chat's timesteps:", error);
        return [];
    }
}

export async function addDomainTimestep(chatID: string, associatedMessage: string, entry: string) {
    if (typeof window === 'undefined') {
        return;
    }
    const sessionKey = getActivePLMSecureSession();
    if (!sessionKey) {
        return;
    }
    try {
        const data = await getSecureData(`METADATA${chatID}`, sessionKey, true);
        if (data) {
            if (!data.timesteps) {
                data.timesteps = []
            }
            data.timesteps.push({
                key: Math.floor(Math.random() * 69420),
                associatedMessage: associatedMessage,
                entry: entry,
            } as DomainTimestepEntry);
            await setSecureData(`METADATA${chatID}`, data, sessionKey, true);
        }

    } catch (error) {
        console.error("Failed to add domain timestep:", error);
        return;
    }
}

export async function removeDomainTimestep(chatID: string, associatedMessage: string) {
    if (typeof window === 'undefined') {
        return;
    }
    const sessionKey = getActivePLMSecureSession();
    if (!sessionKey) {
        return;
    }

    try {
        const data = await getSecureData(`METADATA${chatID}`, sessionKey, true);
        if (data) {
            data.timesteps = data.timesteps.filter((timestep: DomainTimestepEntry) => timestep.associatedMessage !== associatedMessage);
            await setSecureData(`METADATA${chatID}`, data, sessionKey, true);
        }
    } catch (error) {
        console.error("Failed to remove domain timestep:", error);
        return;
    }
}

export async function structureDomainTimesteps(chatID: string): Promise<string> {
    const timesteps = await getDomainTimesteps(chatID);
    let structuredTimesteps = "";

    timesteps.forEach((timestep, index) => {
        structuredTimesteps += `Timestep ${index + 1}: ${timestep.entry}\n`;
    });
    return structuredTimesteps;
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
                if (!data.id) return;

                return {
                    entryTitle: data.entryTitle,
                    timestampStructure: await structureDomainTimesteps(data.id)
                } as ChatHistory;
            })
        );

        return chatEntries.filter((title): title is ChatHistory => Boolean(title));
    } catch (err) {
        console.error("Failed to get total chats from domain:", err);
        return [];
    }
}



export async function buildFullDomainInstruction(domainID: string, entryTitle: string) {
    return `
${getAttributesSysInst(await getDomainAttributes(domainID) as DomainAttributeEntry[])}
${getMemorySysInst(getTrueDomainMemories(await getDomainMemories(domainID)))}
${getTotalChatsSysInst(await totalChatsFromDomain(domainID), entryTitle)}
${getTimestepSysInst()}
    `;
    // dealing w this later
}
