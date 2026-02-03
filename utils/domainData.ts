import { isPalMirrorSecureActivated, setSecureData, getSecureData, getAllKeys, PLMSecureGeneralSettings } from './palMirrorSecureUtils';
import { getActivePLMSecureSession } from './palMirrorSecureSession';

import { getAttributesSysInst } from './domainInstructionShaping/attributesSysInst';
import { ChatHistory, getTotalChatsSysInst } from './domainInstructionShaping/chatHistorySysInst';
import { getMemorySysInst } from './domainInstructionShaping/memorySysInst';

import { CharacterData, defaultCharacterData } from '@/types/CharacterData';
import { DomainAttributeEntry, DomainAttributeHistory, DomainMemoryEntry, DomainTimestepEntry, DomainFlashcardEntry } from "@/types/EEDomain"
import { getTimestepSysInst } from './domainInstructionShaping/timestepSysInst';
import { getTaggingSysInst } from './domainInstructionShaping/taggingSysInst';
import { getRecallSysInst } from './domainInstructionShaping/recallSysInst';
import { PLMGlobalConfigServiceInstance } from '@/context/PLMGlobalConfigService';
import { getDomainGuideSysInst } from './domainInstructionShaping/domainGuideSysInst';


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
                            change: value // thats kinda dumb
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

export async function setDomainTimesteps(chatID: string, timesteps: DomainTimestepEntry[]) {
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
            data.timesteps = timesteps;
            await setSecureData(`METADATA${chatID}`, data, sessionKey, true);
        }
    } catch (error) {
        console.error("Failed to set domain timesteps:", error);
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

    const timestepRecall = PLMGlobalConfigServiceInstance.get("domains_timestep_recall")
    
    timesteps.slice(-(timestepRecall ?? 20)).forEach((timestep, index) => {
        structuredTimesteps += `Timestep ${index + 1}: ${timestep.entry}\n`;
    });
    return structuredTimesteps;
}

type ChatHistoryTimed = ChatHistory & {
    lastUpdated: string;
};

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
                if (data.associatedDomain !== domainID) return;
                if (!data.entryTitle) return;
                if (!data.id) return;

                return {
                    entryTitle: data.entryTitle,
                    timestampStructure: await structureDomainTimesteps(data.id),
                    lastUpdated: data.lastUpdated,
                } as ChatHistoryTimed;
            })
        );

        return chatEntries.filter((title): title is ChatHistoryTimed => Boolean(title));
    } catch (err) {
        console.error("Failed to get total chats from domain:", err);
        return [];
    }
}

export async function getDomainGuide(domainID: string): Promise<string | null> {
    if (typeof window === 'undefined') {
        return null;
    }

    const sessionKey = getActivePLMSecureSession();
    if (!sessionKey) {
        return null;
    }

    try {
        const data = await getSecureData(`METADATA${domainID}`, sessionKey, true);

        if (
            data &&
            data.plmex &&
            data.plmex.domain &&
            data.plmex.domain.guide
        ) {
            return data.plmex.domain.guide as string;
        }

        return null;
    } catch (error) {
        console.error("Failed to get domain guide:", error);
        return null;
    }
}

export async function getDomainFlashcards(domainID: string): Promise<DomainFlashcardEntry[]> {
    if (typeof window === 'undefined') return [];

    const sessionKey = getActivePLMSecureSession();
    if (!sessionKey) return [];

    try {
        const data = await getSecureData(`METADATA${domainID}`, sessionKey, true);

        if (
            data &&
            data.plmex &&
            data.plmex.domain &&
            data.plmex.domain.flashcards
        ) {
            return data.plmex.domain.flashcards as DomainFlashcardEntry[];
        }

        return [];
    } catch (error) {
        console.error("Failed to get domain flashcards:", error);
        return [];
    }
}

export async function setDomainFlashcards(domainID: string, flashcards: DomainFlashcardEntry[]) {
    if (typeof window === 'undefined') return;

    const sessionKey = getActivePLMSecureSession();
    if (!sessionKey) return;

    try {
        const data = await getSecureData(`METADATA${domainID}`, sessionKey, true);
        
        if (data) {
            if (!data.plmex.domain) {
                return;
            }
            data.plmex.domain.flashcards = flashcards;
            await setSecureData(`METADATA${domainID}`, data, sessionKey, true);
        }
    }
    catch (error) {
        console.error("Failed to set domain flashcards:", error);
    }
}

export async function setDomainGuide(domainID: string, guideText: string) {
    if (typeof window === 'undefined') {
        return;
    }

    const sessionKey = getActivePLMSecureSession();
    if (!sessionKey) {
        return;
    }

    try {
        const data: CharacterData = await getSecureData(`METADATA${domainID}`, sessionKey, true);
        
        if (data) {
            if (!data.plmex) {
                data.plmex = defaultCharacterData.plmex;
            }
            if (!data.plmex.domain) {
                data.plmex.domain = defaultCharacterData.plmex.domain;
            }
            data.plmex.domain!.guide = guideText;
            await setSecureData(`METADATA${domainID}`, data, sessionKey, true);
        }
    }
    catch (error) {
        console.error("Failed to set domain guide:", error);
    }
}



export async function buildFullDomainInstruction(domainID: string, entryTitle: string) {
    return `
${getTimestepSysInst()}
${getAttributesSysInst(await getDomainAttributes(domainID) as DomainAttributeEntry[])}
${getMemorySysInst(getTrueDomainMemories(await getDomainMemories(domainID)))}

${getTotalChatsSysInst(await totalChatsFromDomain(domainID), entryTitle)}

${ !!(await getDomainGuide(domainID)) ? getDomainGuideSysInst(await getDomainGuide(domainID) as string) : ""}

    `;
    // why

    // ${getTaggingSysInst()}
    // heavy for not much benefit
}

function sortByLastUpdated(
        data: ChatHistoryTimed[]
    ): ChatHistoryTimed[] {
        return data.sort(
            (a, b) =>
                new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
    }

export async function buildAssistantRecall(domainID: string) {
  const memories = getTrueDomainMemories(await getDomainMemories(domainID))
  const allChats = await totalChatsFromDomain(domainID);
  if (allChats.length < 2) {
    return "";
  }
  const flashcards = await getDomainFlashcards(domainID);
  return getRecallSysInst(memories, sortByLastUpdated(allChats)[1], !!(await getDomainGuide(domainID)) ? await getDomainGuide(domainID) as string : undefined, flashcards.map(fc => fc.content));
}
