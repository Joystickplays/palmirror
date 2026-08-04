"use client"

import React, { useState, useEffect, useContext, useRef } from "react";
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { CirclePlus, Trash2, ArrowRight, ArrowLeft, BrainCircuit, Eraser, EllipsisVertical, History, Info, Book, Check, Library, GitBranch, Plus, Loader2, Earth, Users, Package, BookOpen, Activity } from 'lucide-react';

import AttributeProgress from "@/components/domains/AttributeProgress";

import { ToastContainer } from "react-toastify";
import FlashcardItem from "@/components/domains/FlashcardItem";
import ChatCard from "@/components/domains/ChatCard";
import ChapterCard from "@/components/domains/ChapterCard";
import WorldCharacterItem from "@/components/domains/WorldCharacterItem";
import WorldObjectItem from "@/components/domains/WorldObjectItem";
import CharacterCastPicker from "@/components/domains/CharacterCastPicker";


import { usePLMGlobalConfig } from "@/context/PLMGlobalConfig";
import { PLMSecureContext } from "@/context/PLMSecureContext";
// import { isPalMirrorSecureActivated } from "@/utils/palMirrorSecureUtils";

import { CharacterData, ChatMetadata, defaultCharacterData } from "@/types/CharacterData";
import { DomainAttributeEntry, DomainMemoryEntry, DomainFlashcardEntry, DomainWorldSummaryEntry, WorldCharacter, WorldObject } from "@/types/EEDomain"

import { deleteMemoryFromMessageIfAny, getDomainGuide, removeDomainTimestep, reverseDomainAttribute, setDomainGuide, setDomainMemories, setDomainFlashcards, branchDomain, totalChatsFromDomain, getWorldConfig, setWorldConfig, setWorldCharacters as persistWorldCharacters, setWorldObjects as persistWorldObjects, getWorldCharacters, getWorldObjects, isWorldDomain, setWorldUserCharacterExclusive } from "@/utils/domainData";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { usePMNotification } from "@/components/notifications/PalMirrorNotification";
import AskForUnlockSecure from "@/components/secure/AskForUnlockSecure";
import { Progress } from "@/components/ui/progress";
import { AnimateChangeInHeight } from "@/components/utilities/animate/AnimateHeight";
import { AnimateChangeInSize } from "@/components/utilities/animate/AnimateSize";
import SlideToConfirm from "@/components/utilities/SlideToConfirm";
import { worldSummarizerSysInst } from "@/utils/domainInstructionShaping/worldSummarizerSysInst";
import { getChatsOnlySysInst } from "@/utils/domainInstructionShaping/chatHistorySysInst";
import { generateChatCompletion, independentInitOpenAI } from "@/utils/portableAi";
import Markdown from "react-markdown";




interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    stillGenerating: boolean;
}

interface AddableDomainChar extends CharacterData {
    id: string;
    isBranch: boolean;
    branchName?: string;
    rootId: string;
    rootName: string;
}

const ExperienceDomainPage: React.FC = () => {

    const PMNotify = usePMNotification();

    const PLMGC = usePLMGlobalConfig();
    const [configHighend, setConfigHighend] = useState(false);
    const [configWorldSummarizer, setConfigWorldSummarizer] = useState(false);
    
    useEffect(() => {
        setConfigHighend(!!PLMGC.get("highend"))
        setConfigWorldSummarizer(!!PLMGC.get("domainSummary"))
    }, [])

    const PLMsecureContext = useContext(PLMSecureContext);
    const router = useRouter();

    const [domainId, setDomainId] = useState("");
    const [chatList, setChatList] = useState<Array<ChatMetadata>>([]);

    const [showingNewChat, setShowingNewChat] = useState(false);
    const [newChatName, setNewChatName] = useState("");
    const [newChatCast, setNewChatCast] = useState<Array<string>>([]);

    const [showingMemoryManager, setShowingMemoryManager] = useState(false);

    const [showingDelete, setShowingDelete] = useState(false);
    const [showingDeleteVerification, setShowingDeleteVerification] = useState(false);

    const [showingDMBranch, setShowingDMBranch] = useState(false);
    const [newDMBranchName, setNewDMBranchName] = useState("");
    const [newDMBranchFrom, setNewDMBranchFrom] = useState("");
    const [newDMBranchSelectChat, setNewDMBranchSelectChat] = useState(false);

    const [newDMBranchCreating, setNewDMBranchCreating] = useState(false);

    const [newDMBranchStatus, setNewDMBranchStatus] = useState("");
    const [newDMBranchProgress, setNewDMBranchProgress] = useState(0);

    const [showingChatDelete, setShowingChatDelete] = useState(false);
    const [chatAboutToDelete, setChatAboutToDelete] = useState("");
    const [chatDeletePropagation, setChatDeletePropagation] = useState(false);
    const [chatDeleteProgress, setChatDeleteProgress] = useState(-1);
    const [showingChatTimesteps, setShowingChatTimesteps] = useState(false);
    const [selectedChat, setSelectedChat] = useState<ChatMetadata | null>(null);

    const [showDomainIntro, setShowDomainIntro] = useState(false);

    const [domainGuideText, setDomainGuideText] = useState("");
    const [showDomainGuideEditor, setShowDomainGuideEditor] = useState(false);
    const [showingFlashcards, setShowingFlashcards] = useState(false);

    const [showWorldSummary, setShowWorldSummary] = useState(false);
    const [worldSummaryTokenCost, setWorldSummaryTokenCost] = useState(0);

    const [localCharWorldSummaries, setLocalCharWorldSummaries] = useState<DomainWorldSummaryEntry[]>([]);

    const [localGenWorldSumActive, setLocalGenWorldSumActive] = useState(false);
    const [localGenWorldSum, setLocalGenWorldSum] = useState<string | null>(null);
    const [localReasonGenWorldSum, setLocalReasonGenWorldSum] = useState<string | null>(null);
    const [localReasonFinishGenWorldSum, setLocalReasonFinishGenWorldSum] = useState(false);
    const [worldSumPage, setWorldSumPage] = useState(0);

    const [isSecureReady, setIsSecureReady] = useState(false);
    const [character, setCharacter] = useState<CharacterData>(defaultCharacterData);

    const [isWorld, setIsWorld] = useState(false);
    const [worldCharacters, setWorldCharacters] = useState<WorldCharacter[]>([]);
    const [worldObjects, setWorldObjects] = useState<WorldObject[]>([]);
    const [narratorPersona, setNarratorPersona] = useState("");
    const [narrativeMode, setNarrativeMode] = useState<"reactive" | "proactive">("reactive");
    const [showWorldCharacters, setShowWorldCharacters] = useState(false);
    const [showWorldObjects, setShowWorldObjects] = useState(false);
    const [showNarratorEditor, setShowNarratorEditor] = useState(false);
    const [showAddFromDomain, setShowAddFromDomain] = useState(false);
    const [allDomainChars, setAllDomainChars] = useState<Array<AddableDomainChar>>([]);
    const [loadingDomainChars, setLoadingDomainChars] = useState(false);

    const [showingUserCharWarning, setShowingUserCharWarning] = useState(false);
    const [skipUserCharacterWarning, setSkipUserCharacterWarning] = useState(false);
    const pendingUserWarningAction = useRef<(() => void) | null>(null);

    const [showingStatusEditor, setShowingStatusEditor] = useState(false);
    const [statusRows, setStatusRows] = useState<Array<{ key: number; name: string; defaultValue: string }>>([]);


    const newChatDialog = useRef<HTMLDivElement>(null);
    const newChatInput = useRef<HTMLInputElement>(null);
    const thinkingScrollRef = useRef<HTMLDivElement>(null);
    const summaryScrollRef = useRef<HTMLDivElement>(null);
    const prevSumLen = useRef(localCharWorldSummaries.length);


    useEffect(() => {
        if (sessionStorage.getItem("chatSelect")) {
            const domainId = sessionStorage.getItem("chatSelect") || "";
            setDomainId(domainId);
        }
    }, [])

    function sortByLastUpdated(
        data: ChatMetadata[]
    ): ChatMetadata[] {
        return data.sort(
            (a, b) =>
                new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
    }
    //i really dont wanna deal w this
    const reloadCharacter = () => {
        if (PLMsecureContext && !PLMsecureContext.isSecureReady()) {
            router.push('/');
        } else {
            setIsSecureReady(true);
            if (domainId && PLMsecureContext) {
                PLMsecureContext.getSecureData(`METADATA${domainId}`).then((data) => {
                    if (data) {
                        setCharacter(data as ChatMetadata);
                        console.log("load char")
                        // console.log(data)
                        // console.log(character.plmex.domain?.associatedDomainByBranch)

                        localStorage.setItem("characterData", JSON.stringify(data));
                        if (!data.plmex.domain) {
                            PMNotify.error("Not a domain-enabled character. Returning to home.")
                            router.push('/')
                        }

                        (data as ChatMetadata).lastUpdated = new Date().toISOString();
                        PLMsecureContext.setSecureData(`METADATA${domainId}`, data);
                    } else {
                        PMNotify.error("Domain data not found. Returning to home.");
                        router.push('/');
                    }
                });
            }
        }
    }

    useEffect(() => {
        reloadCharacter()
    }, [domainId]);

    useEffect(() => {
        if (domainId) {
            (async () => {
                const world = await isWorldDomain(domainId);
                setIsWorld(world);
                if (world) {
                    const config = await getWorldConfig(domainId);
                    if (config) {
                        setWorldCharacters(config.characters || []);
                        setWorldObjects(config.objects || []);
                        setNarratorPersona(config.narratorPersona || "");
                        setNarrativeMode(config.narrativeMode || "reactive");
                        setSkipUserCharacterWarning(!!config.skipUserCharacterWarning);
                    }
                }
            })();
        }
    }, [domainId, character.plmex.domain?.worldType]);

    useEffect(() => {
        const refreshChatList = async () => {
            if (isSecureReady) {
                let chatStore;
                try {
                    chatStore = await PLMsecureContext?.getAllKeys();
                } catch {
                    return;
                }
                if (chatStore) {
                    const filteredChats = chatStore.filter((key: string) =>
                        key.startsWith("METADATA")
                    );
                    const chatListPromises = filteredChats.map(async (key: string) => {
                        const chatData = await PLMsecureContext?.getSecureData(key);
                        return chatData;
                    });
                    Promise.all(chatListPromises).then((resolvedChatList) => {
                        if (chatListPromises.length < 3) {
                            setChatList(resolvedChatList);
                            return;
                        }
                        setTimeout(() => {
                            setChatList(resolvedChatList);
                        }, 0);
                    });
                }
            }
        };

        refreshChatList();
    }, [isSecureReady]);

    
    useEffect(() => {
        if (localStorage.getItem("domainIntroNewcomer") !== "1") {
            setShowDomainIntro(true);
        }
    }, [])

    useEffect(() => {
        if (character.plmex.domain?.guide) {
            setDomainGuideText(character.plmex.domain.guide)
        }

        if (character.plmex.domain?.worldSummary) {
            setLocalCharWorldSummaries(character.plmex.domain.worldSummary)
        }
    }, [character])

    useEffect(() => {
        if (thinkingScrollRef.current) {
            thinkingScrollRef.current.scrollTop = thinkingScrollRef.current.scrollHeight;
        }
    }, [localReasonGenWorldSum])

    useEffect(() => {
        if (summaryScrollRef.current) {
            summaryScrollRef.current.scrollTop = summaryScrollRef.current.scrollHeight;
        }
    }, [localCharWorldSummaries[worldSumPage]?.summary])

    useEffect(() => {
        if (localCharWorldSummaries.length > prevSumLen.current) {
            setWorldSumPage(localCharWorldSummaries.length - 1);
        } else if (worldSumPage >= localCharWorldSummaries.length) {
            setWorldSumPage(Math.max(0, localCharWorldSummaries.length - 1));
        }
        prevSumLen.current = localCharWorldSummaries.length;
    }, [localCharWorldSummaries.length, worldSumPage])

    useEffect(() => {
        (async () => {
            await independentInitOpenAI()
        })();
    }, [])

    useEffect(() => {
        if (showWorldSummary) {
            const calculateTokenCost = async () => {
                const baseSystemPrompt = worldSummarizerSysInst
                const allChats = getChatsOnlySysInst(await totalChatsFromDomain(domainId))

                const totalChars = baseSystemPrompt.length + allChats.length
                const roughTokens = Math.ceil(totalChars / 5.0)
                setWorldSummaryTokenCost(roughTokens);
            }

            calculateTokenCost();
        }
    }, [showWorldSummary])

    const initiateWorldSummaryGeneration = async () => {
        if (localGenWorldSumActive) { return }
        setLocalGenWorldSumActive(true);


        const worldSumAvailableIndex = localCharWorldSummaries.length
        const id = crypto.randomUUID();

        const lastChat = sortByLastUpdated(chatList)[0]?.entryTitle || "None"


        let accuSum = "";
        let accuReason = "";

        try {
            let modelName = "gpt-3.5-turbo"
            const settings = localStorage.getItem("Proxy_settings");
            if (settings) {
                const settingsParse = JSON.parse(settings)
                modelName = settingsParse.modelName
            }

            const allChats = getChatsOnlySysInst(await totalChatsFromDomain(domainId))


            const stream = generateChatCompletion({
                model: modelName,
                temperature: 0.7,
                stream: true,
                messages: [{
                    role: "system",
                    content: worldSummarizerSysInst.trim()
                }, {
                    role: "user",
                    content: allChats
                }]
            });

            
            setLocalGenWorldSum(null);
            setLocalReasonGenWorldSum(null);
            setLocalReasonFinishGenWorldSum(false);

            

            for await (const chunk of stream) {
                const content = chunk.choices?.[0]?.delta?.content || "";
                accuSum += content;

                if (accuSum !== "") {
                    const newWorldSummary: DomainWorldSummaryEntry = {
                        id: id,
                        summary: accuSum,
                        timestamp: Math.floor(Date.now() / 1000),
                        lastChat: lastChat,
                    };

                    const updatedSummaries = localCharWorldSummaries.slice(0, -1).concat(newWorldSummary);
                    setLocalCharWorldSummaries(updatedSummaries);
                }

                if (accuSum !== "" && !localReasonFinishGenWorldSum) {
                    setLocalReasonFinishGenWorldSum(true);
                }
                setLocalGenWorldSum(accuSum);

                let c_reason = chunk.choices?.[0]?.delta?.reasoning_content?.[0]?.thinking || "";
                if (c_reason === "") {
                    c_reason = chunk.choices?.[0]?.delta?.reasoning_content || chunk.choices?.[0]?.delta?.reasoning || "";
                }
                if (c_reason) {
                    accuReason += c_reason;
                    setLocalReasonGenWorldSum(accuReason);
                }
            }
        } catch (e) {
            console.warn(e)
            PMNotify.error("Error generating world summary. Please try again.")
        }

        setLocalGenWorldSumActive(false);
        
        const newWorldSummary: DomainWorldSummaryEntry = {
            id: id,
            summary: accuSum,
            timestamp: Math.floor(Date.now() / 1000),
            lastChat: lastChat,
        };

        const updated = {
            ...character,
            plmex: {
                ...character.plmex,
                domain: {
                    ...character.plmex.domain,
                    worldSummary: [
                        ...(character.plmex.domain?.worldSummary || []),
                        newWorldSummary
                    ],
                }
            }
        } as CharacterData;
        setCharacter(updated);
        await PLMsecureContext?.setSecureData(`METADATA${domainId}`, updated);

    }
    
    const initiateBranchCreation = async () => {
        setShowingDMBranch(false);
        setNewDMBranchCreating(true);

        const streamSource = branchDomain(domainId, newDMBranchName, newDMBranchFrom);

        let stream = await streamSource.next()

        while (!stream.done) {
            const { humanReadable, progress } = stream.value;
            setNewDMBranchStatus(humanReadable);
            setNewDMBranchProgress(progress);
            stream = await streamSource.next();
        }

        PMNotify.success("Branch created successfully! Switch to it in the Branches dropdown.");
        setNewDMBranchCreating(false);

        if (character.plmex.domain) {
            character.plmex.domain.childrenBranches = [...(character.plmex.domain?.childrenBranches || []), `${domainId}_branch_${newDMBranchName}`];
        }

        sessionStorage.setItem("chatSelect", `${domainId}_branch_${newDMBranchName}`);
        router.refresh();
        // router.push(`/experience/domain?domainId=${domainId}_branch_${newDMBranchName}`); // doesnt actually do anything, just makes nextjs reload the page
    }

    const loadAllDomainChars = async () => {
        setLoadingDomainChars(true);
        setAllDomainChars([]);
        try {
            const keys = await PLMsecureContext?.getAllKeys();
            if (!keys) return;
            const domainKeys = keys.filter((key: string) => key.startsWith("METADATA"));
            const byId = new Map<string, CharacterData>();
            for (const key of domainKeys) {
                if (key === `METADATA${domainId}`) continue;
                const data = await PLMsecureContext?.getSecureData(key);
                if (data && data.plmex && data.plmex.domain && data.plmex.domain.active && data.plmex.domain.worldType !== "world") {
                    byId.set(key.replace("METADATA", ""), data);
                }
            }

            const currentEntry = character.plmex?.domain ? character : null;
            const resolveRoot = (id: string): string => {
                let current = id;
                const visited = new Set<string>();
                while (true) {
                    if (visited.has(current)) break;
                    visited.add(current);
                    const entry = byId.get(current) ?? (current === domainId ? currentEntry : null);
                    const parentId = entry?.plmex?.domain?.associatedDomainByBranch;
                    if (!parentId) break;
                    current = parentId;
                }
                return current;
            };

            const chars: Array<AddableDomainChar> = [];
            const branchMarker = "_branch_";
            for (const [id, data] of byId) {
                const isBranch = !!data.plmex?.domain?.associatedDomainByBranch;
                const rootId = resolveRoot(id);
                const rootData = rootId === domainId ? currentEntry : byId.get(rootId);
                const markerIdx = id.lastIndexOf(branchMarker);
                chars.push({
                    ...data,
                    id,
                    isBranch,
                    branchName: isBranch && markerIdx >= 0 ? id.slice(markerIdx + branchMarker.length) : undefined,
                    rootId,
                    rootName: rootData?.name ?? data.name,
                });
            }
            setAllDomainChars(chars);
        } finally {
            setLoadingDomainChars(false);
        }
    };

    const addCharacterFromDomain = async (source: AddableDomainChar) => {
        const newChar: WorldCharacter = {
            id: crypto.randomUUID(),
            name: source.name,
            personality: source.personality,
            image: source.image || undefined,
            attributes: (source.plmex.domain?.attributes || []).map(attr => ({
                ...attr,
                target: attr.target === "user" ? undefined : attr.target,
            })),
        };
        const updated = [...worldCharacters, newChar];
        setWorldCharacters(updated);
        await persistWorldCharacters(domainId, updated);
        PMNotify.success(`${source.name} added to the world!`);
        setShowAddFromDomain(false);
    };

    const openNewChapter = () => {
        const userChar = worldCharacters.find(c => c.isUser);
        setNewChatCast(userChar ? [userChar.name] : []);
        setShowingNewChat(true);
    };

    const startNewChapter = () => {
        setShowingNewChat(false);
        if (newChatName.trim() === "") {
            return;
        }

        sessionStorage.setItem("chatSelect", "");
        sessionStorage.setItem("chatAssociatedDomain", domainId);
        sessionStorage.setItem("chatEntryName", newChatName.trim());
        sessionStorage.setItem("chatChapterCast", JSON.stringify(newChatCast));
        sessionStorage.setItem("chatFromNewDomain", "1");
        router.push(`/chat`);
    };

    const requireUserCharacter = (proceed: () => void) => {
        const userChar = worldCharacters.find(c => c.isUser);
        if (!userChar && !skipUserCharacterWarning) {
            pendingUserWarningAction.current = proceed;
            setShowingUserCharWarning(true);
            return false;
        }
        return true;
    };

    const handleUserCharWarningOpenCharacters = () => {
        setShowingUserCharWarning(false);
        pendingUserWarningAction.current = null;
        setShowWorldCharacters(true);
    };

    const handleUserCharWarningContinue = async () => {
        const config = (await getWorldConfig(domainId)) ?? defaultCharacterData.plmex.domain!.worldConfig!;
        await setWorldConfig(domainId, { ...config, skipUserCharacterWarning: true });
        setSkipUserCharacterWarning(true);
        setShowingUserCharWarning(false);
        pendingUserWarningAction.current?.();
        pendingUserWarningAction.current = null;
    };

    const openStatusEditor = () => {
        setStatusRows((character.plmex.dynamicStatuses || []).map((ds) => ({ key: ds.key, name: ds.name, defaultValue: ds.defaultValue })));
        setShowingStatusEditor(true);
    };

    const saveStatusRows = async () => {
        const cleanedRows = statusRows.filter((r) => r.name.trim() !== "");
        const updated = {
            ...character,
            plmex: {
                ...character.plmex,
                dynamicStatuses: cleanedRows,
            },
        } as CharacterData;
        setCharacter(updated);
        await PLMsecureContext?.setSecureData(`METADATA${domainId}`, updated);
        PMNotify.success("Dynamic statuses saved. They now apply to every chapter in this world.");
        setShowingStatusEditor(false);
    };


    return (
        <div className="flex flex-col gap-6 min-h-screen lg:px-56 pb-20 md:p-8 p-2 sm:p-10 font-sans">
            <motion.div
                initial={configHighend ? { opacity: 0, scale: 0.8, y: -100 } : { opacity: 0, scale: 1, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                    type: 'spring', mass: 1, stiffness: 100, damping: 16,
                    scale: {
                        type: 'spring',
                        mass: 1,
                        stiffness: 50,
                        damping: 10,
                    }
                }}
                className={`palmirror-exc border border-white/20 rounded-3xl w-full min-h-24 p-8 py-6 flex flex-col md:flex-row items-center justify-around ${character.image && "pt-24 md:pt-6"}`}
            >   
                <motion.img
                    src={character.image}
                    className="absolute inset-0 top-0 left-0 right-0 bottom-0 w-full h-[70%] md:w-[50%] md:h-full rounded-xl object-cover object-[50%_30%] pointer-events-none z-[-1] opacity-80"
                    style={{
                        maskImage: "var(--domain-image-mask)",
                        WebkitMaskImage: "var(--domain-image-mask)",
                        willChange: "object-position",
                    }}
                    initial={{ objectPosition: "50% 40%" }}
                    animate={{ objectPosition: "50% 80%" }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut",
                    }}
                />
                <h1 className="font-extrabold text-xl flex-1 palmirror-exc-text md:min-w-[16rem]">{isWorld ? `The ${character.name}` : character.name}</h1>
                <div className=""></div>
                <div className="flex overflow-x-scroll max-w-full md:max-w-lg pb-2 mt-4 md:pb-0 md:my-0 md:grid md:grid-cols-3 md:grid-rows-2 md:grid-flow-col md:auto-cols-max gap-4">
                    {!isWorld && character.plmex.domain?.attributes.map(attr => (
                        <AttributeProgress key={attr.key} attr={attr} />
                    ))}
                </div>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4 h-full">
                
                <Button className="fixed bottom-4 right-4 p-8 px-6 rounded-full bg-background! backdrop-blur-xs z-1" variant="palmirror" onClick={openNewChapter}><CirclePlus className="scale-150" /></Button>

                <div className="flex gap-2 h-12 overflow-x-scroll -mt-4">
                    <Button variant="outline" onClick={() => router.push("/")}><ArrowLeft /></Button>
                    <div className="flex-1 w-full"></div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button className="p-1 px-3" variant="outline"><GitBranch /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="flex flex-col gap-2 rounded-xl font-sans p-4">
                            {
                                character.plmex.domain?.associatedDomainByBranch ? (
                                    <>
                                        <Button className="p-1 px-3 justify-start!" onClick={() => {
                                            sessionStorage.setItem("chatSelect", character.plmex.domain?.associatedDomainByBranch || "");
                                            setDomainId(character.plmex.domain?.associatedDomainByBranch || "");
                                        }}><ArrowLeft />Go back to main branch</Button>
                                        <Button key={domainId} className="p-1 px-3 justify-start!" disabled={true}
                                        ><GitBranch /> {domainId.split("_")[2]}</Button>
                                    </>
                                ) : (
                                    <Button className="p-1 px-3 justify-start!" onClick={() => setShowingDMBranch(true)}><Plus />Create new branch</Button>
                                )
                            }
                            {character.plmex.domain?.childrenBranches && character.plmex.domain.childrenBranches.length > 0 && character.plmex.domain.childrenBranches.map((branchId) => (
                                <Button key={branchId} className="p-1 px-3 justify-start!" variant="outline"
                                onClick={() => {
                                    sessionStorage.setItem("chatSelect", branchId);
                                    setDomainId(branchId);
                                }}
                                ><GitBranch /> {branchId.split("_")[2]}</Button>
                            ))}
                            
                        </PopoverContent>
                    </Popover>
                    {/* <Button variant="outline" onClick={() => setShowingDMBranch(true)}><Plus /> New Branch</Button> */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button className="p-1 px-3" variant="outline"><EllipsisVertical /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="flex flex-col gap-2 rounded-xl font-sans p-4">
                            {isWorld && (
                                <>
                                    <Button className="p-1 px-3 justify-start!" variant="outline" onClick={() => setShowWorldCharacters(true)}><Users />Characters</Button>
                                    <Button className="p-1 px-3 justify-start!" variant="outline" onClick={() => setShowWorldObjects(true)}><Package />Objects</Button>
                                    <Button className="p-1 px-3 justify-start!" variant="outline" onClick={() => setShowNarratorEditor(true)}><BookOpen />Narrator persona</Button>
                                    <Button className="p-1 px-3 justify-start!" variant="outline" onClick={openStatusEditor}><Activity />Dynamic statuses</Button>
                                </>
                            )}
                            <Button className="p-1 px-3 justify-start!" variant="outline" onClick={() => setShowingMemoryManager(true)}><BrainCircuit />Manage memories</Button>
                            <Button className="p-1 px-3 justify-start!" variant="outline" onClick={() => setShowDomainGuideEditor(true)}><Book />Domain guide</Button>
  {configWorldSummarizer && <Button className="p-1 px-3 justify-start!" variant="outline" onClick={() => setShowWorldSummary(true)}><Earth />World summary</Button>}
                            <Button className="p-1 px-3 justify-start!" variant="outline" onClick={() => setShowDomainIntro(true)}><Info />Help</Button>
                        </PopoverContent>
                    </Popover>
                    {/* <Button className="p-1 px-3" variant="outline" onClick={() => setShowingMemoryManager(true)}><BrainCircuit />Manage memories</Button> */}
                    <Button variant="destructive" onClick={() => setShowingDelete(true)}><Trash2 /></Button>
                </div>


                <motion.div 
                initial={{
                    opacity: 0,
                    y: 10,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    mass: 1,
                    stiffness: 160,
                    damping: 18
                }}
                className="flex-col gap-4 grow w-full justify-center items-start">
                    {(() => {
                        const domainChats = chatList
                            .filter((chat) => chat.associatedDomain === domainId)
                            .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

                        if (isWorld) {
                            const chatIds = new Set(domainChats.map((c) => c.id));
                            const roots = domainChats.filter((c) => !c.parentChapterId || !chatIds.has(c.parentChapterId));
                            return roots.map((chat, idx) => {
                                const subchats = domainChats
                                    .filter((c) => c.parentChapterId === chat.id)
                                    .sort((a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime());
                                return (
                                    <ChapterCard
                                        key={chat.id}
                                        chat={chat}
                                        idx={idx}
                                        configHighend={configHighend}
                                        domainId={domainId}
                                        worldCharacters={worldCharacters}
                                        subchats={subchats}
                                        setChatAboutToDelete={setChatAboutToDelete}
                                        setShowingChatDelete={setShowingChatDelete}
                                        setSelectedChat={setSelectedChat}
                                        setShowingChatTimesteps={setShowingChatTimesteps}
                                        skipUserCharacterWarning={skipUserCharacterWarning}
                                        onUserCharacterWarning={(proceed) => requireUserCharacter(proceed)}
                                    />
                                );
                            });
                        }

                        return domainChats.map((chat, idx) => (
                            <ChatCard
                                key={chat.id}
                                chat={chat}
                                idx={idx}
                                configHighend={configHighend}
                                domainId={domainId}
                                setChatAboutToDelete={setChatAboutToDelete}
                                setShowingChatDelete={setShowingChatDelete}
                                setSelectedChat={setSelectedChat}
                                setShowingChatTimesteps={setShowingChatTimesteps}
                            />
                        ));
                    })()}
                </motion.div>
            </motion.div>

            <Dialog open={showingChatDelete} onOpenChange={setShowingChatDelete}>
                <DialogContent className="font-sans">
                    <DialogHeader>
                        <DialogTitle>Delete chat</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <p className="text-sm opacity-80">Are you sure you want to delete this chat entry? To maintain continuity across chats in this domain, all attribute changes and memories created in this chat will be lost.</p>
                        {chatDeleteProgress === -1 ? (
                            <>
                                <div className="flex gap-2">
                                    <Checkbox id="deletePropagate" checked={chatDeletePropagation} onCheckedChange={(ch) => {
                                        setChatDeletePropagation(ch === true)
                                    }}></Checkbox>
                                    <Label htmlFor="deletePropagate">Don&apos;t reverse attributes and memory</Label>
                                </div>
                                <Button variant="destructive" onClick={async (e) => {
                                    if (!chatDeletePropagation) {
                                        setChatDeleteProgress(0);
                                        const file = await PLMsecureContext?.getSecureData(chatAboutToDelete) ?? "";
                                        const decodedString = atob(file);
                                        const decodedArray = new Uint8Array(
                                            decodedString.split("").map((char) => char.charCodeAt(0))
                                        );
                                        const decoder = new TextDecoder();
                                        const json = decoder.decode(decodedArray);
                                        const parsedMessages = JSON.parse(json);

                                        const totalMessages = parsedMessages.length;
                                        for (const message of parsedMessages) {
                                            await deleteMemoryFromMessageIfAny(domainId, message.id);
                                            await reverseDomainAttribute(domainId, message.id);
                                            await removeDomainTimestep(domainId, message.id);

                                            setChatDeleteProgress((prev) => prev + (1 / totalMessages) * 100);
                                        }
                                    }


                                    PLMsecureContext?.removeKey(chatAboutToDelete);
                                    PLMsecureContext?.removeKey(`METADATA${chatAboutToDelete}`);
                                    setChatList((prevList) =>
                                        prevList.filter(
                                            (chatItem) => chatItem.id !== chatAboutToDelete
                                        )
                                    );

                                    PMNotify.info(
                                        `Chat deleted. ${chatDeletePropagation ? "Attributes and memories preserved." : "Relevant attributes and memories rolled back."}`
                                    );
                                    setShowingChatDelete(false);

                                    setChatDeleteProgress(-1);

                                    reloadCharacter();
                                }}>Confirm deletion</Button>
                            </>
                        ) : (
                            <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', mass: 1, stiffness: 161, damping: 12 }}
                            className="flex flex-col gap-2">
                                <p className="opacity-50 text-xs">Reversing attributes and memories...</p>
                                <Progress innerClassName="duration-100" value={chatDeleteProgress}></Progress>
                            </motion.div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showingNewChat} onOpenChange={setShowingNewChat}>
                <DialogContent ref={newChatDialog} className="max-h-[90vh] overflow-y-auto font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">{isWorld ? "Start a new chapter" : "Start a new chat"}</DialogTitle>
                    </DialogHeader>
                    <Label htmlFor="chat-name">{isWorld ? "Chapter name" : "Entry name"}</Label>
                    <Input ref={newChatInput} autoComplete="off" value={newChatName} onChange={(e) => setNewChatName(e.target.value)} id="chat-name" placeholder={isWorld ? "Enter chapter name" : "Enter chat entry name"} />
                    <p className="text-xs opacity-50">{`A good ${isWorld ? "chapter" : "entry"} name should the reflect the moment you're capturing in this new ${isWorld ? "chapter" : "chat"}. For example, "First Encounter", "Moving Day", "Evening Complication", etc.`}<br /><br />{`PalMirror will look through your past ${isWorld ? "chapters" : "chat entries"} and let your AI know how far you and this character has progressed together.`}</p>
                    {isWorld && (
                        <div className="my-2">
                            <CharacterCastPicker
                                characters={worldCharacters}
                                selected={newChatCast}
                                onToggle={(name) => setNewChatCast((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name])}
                            />
                        </div>
                    )}
                        <Button onClick={() => {
                            if (newChatName.trim() === "") {
                                return;
                            }
                            if (!requireUserCharacter(startNewChapter)) {
                                setShowingNewChat(false);
                            }
                        }}>Start</Button>
                </DialogContent>
            </Dialog>

            <Dialog open={showingUserCharWarning} onOpenChange={setShowingUserCharWarning}>
                <DialogContent className="font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Who are you?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm opacity-80">You don't have a character set as you in this world yet. This chapter will use the user personality set in your settings instead of a world character.</p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button variant="outline" onClick={handleUserCharWarningOpenCharacters}>Open character editor</Button>
                        <Button onClick={handleUserCharWarningContinue}>Continue anyway</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showingMemoryManager} onOpenChange={setShowingMemoryManager}>
                <DialogContent className="max-h-[90vh] overflow-y-auto font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Manage memories</DialogTitle>
                    </DialogHeader>
                    <p className="opacity-50 text-xs">These memories are what {character.name} remembered about you.</p>
                    <div

                        className="flex flex-col gap-2">
                        <AnimatePresence>
                            {character.plmex.domain?.memories.map((memory: DomainMemoryEntry, index: number) => {
                                const isForgotten = memory.state === "forgotten";

                                return (
                                    <motion.div
                                        key={memory.key}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ type: 'spring', mass: 1, stiffness: 161, damping: 12 }}
                                        layout
                                        className="border border-white/10 rounded-2xl p-4 flex flex-col gap-2"
                                    >
                                        <p className={isForgotten ? "blur-xs opacity-50 select-none" : ""}>{memory.memory}</p>
                                        <div className="flex gap-2 justify-end">
                                            <Button variant={isForgotten ? "outline" : "destructive"} disabled={isForgotten}
                                                onClick={() => {
                                                    if (!isForgotten && character.plmex.domain) {
                                                        const updatedMemories = [...character.plmex.domain.memories];
                                                        updatedMemories[index] = { ...memory, state: "forgotten" };
                                                        setCharacter({
                                                            ...character, plmex: { ...character.plmex,
                                                                domain: {
                                                                    ...character.plmex.domain,
                                                                    memories: updatedMemories,
                                                                },
                                                            },
                                                        });

                                                        setDomainMemories(domainId, updatedMemories)
                                                    }
                                                }}
                                            >
                                                {isForgotten ? "Forgotten" : (
                                                    <>
                                                        <Eraser /> Forget
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </motion.div>
                                );
                            })}

                        </AnimatePresence>
                    </div>
                </DialogContent>
            </Dialog>

            

            <Dialog open={showingChatTimesteps} onOpenChange={setShowingChatTimesteps}>
                <DialogContent className="max-h-[90vh] overflow-y-auto font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Chat Timesteps</DialogTitle>
                    </DialogHeader>
                    <p className="opacity-50 text-xs">View the timesteps of this chat. Each message creates a timestep to help PalMirror cross-reference moments between chats in this domain.</p>
                    <div className="flex flex-col gap-2">
                        {selectedChat && selectedChat.timesteps && selectedChat.timesteps.length > 0 ? (
                            selectedChat.timesteps.map((timestep) => (
                                <div key={timestep.key} className="p-4 border border-white/10 rounded-xl">
                                    <p className="text-sm">{timestep.entry}</p>
                                </div>
                            ))
                        ) : (
                            <p className="opacity-70">No timesteps available for this chat.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showingDelete} onOpenChange={setShowingDelete}>
                <DialogContent className="font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Delete {character.plmex.domain?.associatedDomainByBranch ? "branch" : "domain"}</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this {character.plmex.domain?.associatedDomainByBranch ? "branch" : "domain"}? All associated chats, attributes and memory will also be deleted!</p>
                    <Button variant="destructive" onClick={() => {
                        setShowingDelete(false);
                        setShowingDeleteVerification(true);
                    }}>Confirm deletion</Button>
                </DialogContent>
            </Dialog>

            <AskForUnlockSecure open={showingDeleteVerification} onUnlock={() => {
                (async () => {

                    setShowingDeleteVerification(false);
                    chatList.forEach((chat) => {
                        if (chat.associatedDomain == domainId) {
                            PLMsecureContext?.removeKey(chat.id)
                            PLMsecureContext?.removeKey("METADATA" + chat.id)
                        }
                    })
                    const originDomainIfAny = character.plmex.domain?.associatedDomainByBranch
                    await PLMsecureContext?.removeKey("METADATA" + domainId)
                    if (originDomainIfAny) {

                        const originDomainData = await PLMsecureContext?.getSecureData("METADATA" + originDomainIfAny)

                        if (originDomainData) {
                            const parsedData = originDomainData as CharacterData;
                            if (parsedData.plmex.domain) {
                                parsedData.plmex.domain.childrenBranches = parsedData.plmex.domain?.childrenBranches?.filter((branch) => branch !== domainId) || [];
                            }

                            await PLMsecureContext?.setSecureData("METADATA" + originDomainIfAny, parsedData);
                        }

                        setDomainId(originDomainIfAny);
                    } else {
                        router.push("/")
                    }

                })();
            }} onCancel={() => setShowingDeleteVerification(false)} />

            <Dialog open={showDomainGuideEditor} onOpenChange={setShowDomainGuideEditor}>
                <DialogContent className="max-h-[90vh] overflow-y-auto font-sans">
                    <DialogHeader>
                        <div className="flex items-center justify-between mb-4 relative">
                            <DialogTitle className="text-2xl font-bold">Domain guide</DialogTitle>
                            <Button className="absolute right-4 top-0 hidden sm:flex" variant="outline" size="sm" onClick={() => { setShowingFlashcards(true); }}><Library /> Flashcards</Button>
                        </div>
                    </DialogHeader>
                    <p className="opacity-50 text-xs whitespace-pre-line">{`Domain guides help set the overall context and rules for how the character should behave within this domain.
                        
                        Add manual memory, core moments, or specific instructions to shape the character's behavior and interactions. If PalMirror can't catch a relevant memory from your past chats, the domain guide will help fill in the gaps.
                    `}</p>

                    <Textarea value={domainGuideText} onChange={(e) => setDomainGuideText(e.target.value)} rows={10}></Textarea>
                    <Button className="w-full flex sm:hidden" variant="outline" size="sm" onClick={() => { setShowingFlashcards(true); }}><Library /> Flashcards</Button>
                    <div className="flex gap-2 w-full">
                        <Button className="w-full" variant="outline" onClick={() => setShowDomainGuideEditor(false)}>Discard</Button>
                        <Button className="w-full" onClick={() => {setDomainGuide( domainId, domainGuideText ); setShowDomainGuideEditor(false)}}><Check /> Apply</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showingFlashcards} onOpenChange={setShowingFlashcards}>
                <DialogContent className="max-h-[90vh] overflow-y-auto font-sans">
                     <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Flashcards</DialogTitle>
                    </DialogHeader>
                    <p className="opacity-50 text-xs">Flashcards are user-inserted memories that appear at a set frequency. When Domain Guide is not sufficient, these flashcards help reinforce important context even more periodically.</p>
                    
                     <div className="flex flex-col gap-4">
                        <AnimatePresence mode="popLayout">
                            {(character.plmex.domain?.flashcards || []).map((fc, idx) => (
                                <FlashcardItem
                                    key={fc.id}
                                    flashcard={fc}
                                    onUpdate={(updated) => {
                                        const newFC = [...(character.plmex.domain?.flashcards || [])];
                                        newFC[idx] = updated;
                                        setCharacter({
                                            ...character,
                                            plmex: {
                                                ...character.plmex,
                                                domain: { ...character.plmex.domain!, flashcards: newFC }
                                            }
                                        });
                                        setDomainFlashcards(domainId, newFC);
                                    }}
                                    onDelete={() => {
                                        const newFC = (character.plmex.domain?.flashcards || []).filter((_, i) => i !== idx);
                                        setCharacter({
                                            ...character,
                                            plmex: {
                                                ...character.plmex,
                                                domain: { ...character.plmex.domain!, flashcards: newFC }
                                            }
                                        });
                                        setDomainFlashcards(domainId, newFC);
                                    }}
                                />
                            ))}
                        </AnimatePresence>
                        <Button className="w-full" variant="outline" onClick={() => {
                            const newFC = [...(character.plmex.domain?.flashcards || []), { id: crypto.randomUUID(), content: "", frequency: 1, chance: 80, distance: 10 }];
                             setCharacter({
                                ...character,
                                plmex: {
                                    ...character.plmex,
                                    domain: { ...character.plmex.domain!, flashcards: newFC }
                                }
                                });
                                setDomainFlashcards(domainId, newFC);
                        }}><CirclePlus className="mr-2" /> Add Flashcard</Button>
                     </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showWorldSummary} onOpenChange={setShowWorldSummary}>
                <DialogContent className="max-h-[90vh] overflow-y-auto font-sans">
                    <DialogHeader>
                        <div className="flex items-center justify-between mb-4 relative">
                            <DialogTitle className="text-2xl font-bold">World Summary</DialogTitle>
                        </div>
                    </DialogHeader>
                    <p className="opacity-50 text-xs whitespace-pre-line">{`World summaries provide a high-level overview of the world and its context, helping you save more tokens and to maintain consistency and continuity across different chats.
                    
                    This is fundamentally similar to Domain Guides, however more automatic and designed to be a compressed overview, taking less tokens.`}</p>
                    

                    {
                        localReasonGenWorldSum && !localReasonFinishGenWorldSum && (
                            <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="border border-white/10 rounded-xl p-4 flex flex-col gap-2 w-full">
                                <h2 className="font-bold opacity-50 italic tracking-widest text-sm w-full text-end">Thinking</h2>

                                <div ref={thinkingScrollRef} className="max-h-48 text-xs opacity-50 overflow-y-auto">
                                    <Markdown>
                                        {localReasonGenWorldSum}
                                    </Markdown>
                                </div>
                            </motion.div>
                        )
                    }
                    <div className="min-h-48 border border-white/10 rounded-xl p-4 flex flex-col gap-3 justify-center items-stretch">
                        
                        {localCharWorldSummaries.length > 0 ? (
                            <>
                                <div className="border border-white/10 rounded-xl p-4 flex flex-col gap-1">
                                    <p ref={summaryScrollRef} className="text-sm whitespace-pre-line max-h-48 overflow-y-auto">
                                        <Markdown>{localCharWorldSummaries[worldSumPage].summary}</Markdown>
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-xs opacity-50">{new Date(localCharWorldSummaries[worldSumPage].timestamp).toLocaleString()}</p>
                                        <Button 
                                            variant={character.plmex.domain?.usedWorldSumId === localCharWorldSummaries[worldSumPage].id ? "default" : "outline"}
                                            size="sm"
                                            onClick={async () => {
                                                const updated = { ...character };
                                                if (!updated.plmex.domain) return;
                                                const currentId = character.plmex.domain?.usedWorldSumId;
                                                const newId = currentId === localCharWorldSummaries[worldSumPage].id ? undefined : localCharWorldSummaries[worldSumPage].id;
                                                updated.plmex.domain = { ...updated.plmex.domain, usedWorldSumId: newId };
                                                setCharacter(updated);
                                                await PLMsecureContext?.setSecureData(`METADATA${domainId}`, updated);
                                            }}
                                        >
                                            {character.plmex.domain?.usedWorldSumId === localCharWorldSummaries[worldSumPage].id ? "Selected" : "Select"}
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        disabled={worldSumPage === 0}
                                        onClick={() => setWorldSumPage(p => p - 1)}
                                    >Previous</Button>
                                    <p className="text-xs opacity-50">{worldSumPage + 1} / {localCharWorldSummaries.length}</p>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        disabled={worldSumPage >= localCharWorldSummaries.length - 1}
                                        onClick={() => setWorldSumPage(p => p + 1)}
                                    >Next</Button>
                                </div>
                            </>
                        ) : (
                            <p className="opacity-10 text-sm mx-auto">something something boom..</p>
                        )}
                    </div>


                        <div className="flex flex-col gap-1 p-4 border border-white/10 rounded-xl">
                            {!character.plmex.domain?.worldSummary ? (
                                <>
                                    <h2 className="font-bold">No world summaries</h2>
                                    <p className="text-sm opacity-75">This domain has no world summaries generated yet! Create the first one below.</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="font-bold">Generate new world summary</h2>
                                    <p className="text-sm opacity-75">This domain has {localCharWorldSummaries.length} world summaries generated. If the story has changed significantly, you should generate a new one below.</p>
                                </>
                            )}
                            <hr className="my-2" />
                            {localGenWorldSumActive ? (
                                <>
                                    <motion.div
                                        className="ellipsis-loader mx-auto"
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        key="loading"
                                    >
                                        <div></div>
                                        <div></div>
                                        <div></div>
                                        <div></div>
                                    </motion.div>
                                    <p className="text-center w-full opacity-50 italic text-xs mt-1">Generating world summary...</p>
                                </>
                                ) : (
                                <>
                                    <SlideToConfirm onSlid={initiateWorldSummaryGeneration}></SlideToConfirm>
                                    <p className="text-center w-full opacity-50 italic text-xs mt-1">Roughly sending over {worldSummaryTokenCost ? worldSummaryTokenCost.toLocaleString() : '...'} tokens</p>
                                </>
                                )
                            }
                        </div>
                    {/* <Textarea value={domainGuideText} onChange={(e) => setDomainGuideText(e.target.value)} rows={10}></Textarea>
                    <Button className="w-full flex sm:hidden" variant="outline" size="sm" onClick={() => { setShowingFlashcards(true); }}><Library /> Flashcards</Button>
                    <div className="flex gap-2 w-full">
                        <Button className="w-full" variant="outline" onClick={() => setShowDomainGuideEditor(false)}>Discard</Button>
                        <Button className="w-full" onClick={() => {setDomainGuide( domainId, domainGuideText ); setShowDomainGuideEditor(false)}}><Check /> Apply</Button>
                    </div> */}
                </DialogContent>
            </Dialog>

            <Dialog open={showingDMBranch} onOpenChange={setShowingDMBranch}>
                <DialogContent className="font-sans">
                    <AnimateChangeInHeight>
                        <AnimatePresence mode="popLayout">
                            {newDMBranchSelectChat ? (
                                <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                transition={{ type: 'spring', mass: 1, stiffness: 161, damping: 21 }}
                                key="select-chat"
                                className="flex flex-col gap-2"
                                >
                                    
                                    <DialogHeader className="text-2xl font-bold">Select chat to start from</DialogHeader>

                                    <p className="text-sm opacity-80">Choose a chat to begin your new domain branch.</p>

                                    <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                                        {chatList.map((chat, idx) => {
                                            if (chat.associatedDomain !== domainId) {
                                                return null;
                                            }

                                            return (
                                                <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ type: 'spring', mass: 1, stiffness: 161, damping: 12, delay: (idx * 0.05) + 0.10 }}
                                                className="border-b border-white/10 p-2" key={chat.id}>
                                                    <p className="text-sm font-bold">{chat.entryTitle}</p>
                                                    <Button
                                                        variant={newDMBranchFrom === chat.id ? "default" : "outline"}
                                                        onClick={() => setNewDMBranchFrom(chat.id)}
                                                        className="ml-auto mt-2 block"
                                                        disabled={newDMBranchFrom === chat.id}
                                                    >Select{newDMBranchFrom === chat.id ? "ed" : ""}</Button>
                                                </motion.div>
                                            )
                                        })}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                        disabled={!newDMBranchFrom}
                                        onClick={() => {
                                            initiateBranchCreation();
                                        }}
                                        className="flex-1">Create branch</Button>
                                        <Button 
                                        onClick={() => {
                                            setNewDMBranchSelectChat(false);
                                        }}
                                        variant="outline">Back</Button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ type: 'spring', mass: 1, stiffness: 161, damping: 21 }}
                                    key="branch-info"
                                    className="flex flex-col gap-2">
                                    <DialogHeader className="text-2xl font-bold">Create domain branch</DialogHeader>
                                    <div className="h-48 flex justify-center items-center">
                                        <GitBranch size={100} />
                                    </div>
                                    <p className="text-sm opacity-80">
                                        {`Branch this domain to explore different directions and plots without affecting the original and see what ${character.name} would do if you didn't buy them ice cream.`}
                                    </p>
                                    <Input placeholder="Branch name" value={newDMBranchName} onChange={(e) => setNewDMBranchName(e.target.value)} />
                                    <Button
                                        disabled={!newDMBranchName.trim()}
                                        onClick={() => {
                                            setNewDMBranchSelectChat(true);
                                        }}
                                    >Next</Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </AnimateChangeInHeight>
                </DialogContent>
            </Dialog>

            <Dialog open={newDMBranchCreating}>
                <DialogContent className="font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Creating branch...</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                        <Loader2 className="animate-spin mx-auto mb-6" size={100} />
                        <p className="text-sm opacity-80">Your new domain branch is being created. This may take a few moments depending on how many chats, attributes and memories you have in this domain.</p>

                        <div className="bg-red-900/50 border border-red-500 text-red-200 rounded-xl p-2">
                            <p className="text-sm font-bold">Do not close or refresh the page while the branch is being created. This may cause data loss.</p>
                        </div>
                            
                        <Progress value={newDMBranchProgress}></Progress>
                        <p className="text-sm opacity-80">{newDMBranchStatus}</p>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showWorldCharacters} onOpenChange={setShowWorldCharacters}>
                <DialogContent className="max-h-[90vh] overflow-y-auto font-sans">
                    <DialogHeader>
                        <div className="flex items-center justify-between mb-4 relative">
                            <DialogTitle className="text-2xl font-bold">Characters</DialogTitle>
                        </div>
                    </DialogHeader>
                    <p className="opacity-50 text-xs whitespace-pre-line">{`Characters live inside this world. The narrator controls all of them. Each character carries its own attributes and relationships toward you or other characters.`}</p>

                    <div className="flex flex-col gap-4">
                        <AnimatePresence mode="popLayout">
                            {worldCharacters.map((wc, idx) => (
                                <WorldCharacterItem
                                    key={wc.id}
                                    character={wc}
                                    characterNames={worldCharacters.map((c) => c.name)}
                                    onUpdate={(updated) => {
                                        const newChars = setWorldUserCharacterExclusive(
                                            worldCharacters.map((c, i) => (i === idx ? updated : c)),
                                            updated.id,
                                            !!updated.isUser,
                                        );
                                        setWorldCharacters(newChars);
                                        persistWorldCharacters(domainId, newChars);
                                    }}
                                    onDelete={() => {
                                        const newChars = worldCharacters.filter((_, i) => i !== idx);
                                        setWorldCharacters(newChars);
                                        persistWorldCharacters(domainId, newChars);
                                    }}
                                />
                            ))}
                        </AnimatePresence>
                        <Button className="w-full flex sm:hidden" variant="palmirror" size="sm" onClick={() => {
                            loadAllDomainChars();
                            setShowAddFromDomain(true);
                        }}><Library /> Add from Domain...</Button>
                        <Button className="w-full" variant="outline" onClick={() => {
                            const newChar: WorldCharacter = {
                                id: crypto.randomUUID(),
                                name: "",
                                personality: "",
                                attributes: [],
                            };
                            const newChars = [...worldCharacters, newChar];
                            setWorldCharacters(newChars);
                            persistWorldCharacters(domainId, newChars);
                        }}><CirclePlus className="mr-2" /> Add Character</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showAddFromDomain} onOpenChange={setShowAddFromDomain}>
                <DialogContent className="max-h-[90vh] overflow-y-auto font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Add character from an existing domain</DialogTitle>
                    </DialogHeader>
                    <p className="opacity-50 text-xs mb-2">Pick a domain-enabled character to bring into this world. Their identity and attributes are copied over; the original domain stays untouched.</p>
                    <div className="flex flex-col gap-2">
                        {loadingDomainChars ? (
                            <div className="flex items-center justify-center gap-2 py-6 opacity-70">
                                <Loader2 className="animate-spin h-4 w-4" />
                                <p className="text-sm">Loading domain characters…</p>
                            </div>
                        ) : allDomainChars.length === 0 ? (
                            <p className="opacity-60 text-sm">No other domain-enabled characters found.</p>
                        ) : (
                            (() => {
                                const byRoot = new Map<string, Array<AddableDomainChar>>();
                                for (const dc of allDomainChars) {
                                    const arr = byRoot.get(dc.rootId) ?? [];
                                    arr.push(dc);
                                    byRoot.set(dc.rootId, arr);
                                }
                                const groups = Array.from(byRoot.entries())
                                    .map(([rootId, items]) => ({
                                        rootId,
                                        rootName: items[0].rootName,
                                        items: items.slice().sort((a, b) => {
                                            if (a.isBranch !== b.isBranch) return a.isBranch ? 1 : -1;
                                            return (a.branchName ?? "").localeCompare(b.branchName ?? "");
                                        }),
                                    }))
                                    .sort((a, b) => a.rootName.localeCompare(b.rootName));
                                return groups.map((group) => (
                                    <div key={group.rootId} className="flex flex-col gap-1">
                                        {group.items.length > 1 ? 
                                        <p className="text-[11px] font-bold uppercase tracking-wider opacity-50 flex items-center gap-2">
                                            {group.rootName}
                                            <span className="ml-auto px-1.5 py-px text-[8px] font-bold opacity-60">
                                                {group.items.length} {group.items.length === 1 ? "version" : "versions"}
                                            </span>
                                        </p> : null}
                                        {group.items.map((dc, idx) => (
                                            <motion.div
                                                key={dc.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ type: 'spring', mass: 1, stiffness: 161, damping: 12, delay: idx * 0.05 }}
                                                className="border-b border-white/10 p-2 flex items-center gap-3"
                                            >
                                                {dc.image && !dc.isBranch && <img src={dc.image} alt={dc.name} className="size-10 rounded-lg object-cover" />}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold flex flex-col mb-2">
                                                        {dc.isBranch ? <span className="tracking-wider font-bold text-[8px] opacity-60 uppercase">Branch</span> : null}
                                                        <span className={`truncate max-w-48 ${dc.isBranch && "opacity-70 text-xs"}`}>{dc.isBranch ? dc.branchName : dc.name}</span>
                                                        {/* {dc.isBranch ? (
                                                            <span className="shrink-0 rounded-full border border-sky-400/30 bg-sky-400/10 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-sky-300">
                                                                Branch · {dc.branchName}
                                                            </span>
                                                        ) : (
                                                            <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider opacity-60">
                                                                Base
                                                            </span>
                                                        )} */}
                                                    </p>
                                                    <p className="text-xs opacity-60">{dc.plmex.domain?.attributes?.length || 0} attributes</p>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => addCharacterFromDomain(dc)}><ArrowRight /></Button>
                                            </motion.div>
                                        ))}
                                    </div>
                                ));
                            })()
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showWorldObjects} onOpenChange={setShowWorldObjects}>
                <DialogContent className="max-h-[90vh] overflow-y-auto font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Objects</DialogTitle>
                    </DialogHeader>
                    <p className="opacity-50 text-xs whitespace-pre-line">{`Objects are things that exist in this world. Give them a description and an optional visual the AI can see. Custom actions let you attach defined effects when your character interacts with the object in chat.`}</p>

                    <div className="flex flex-col gap-4">
                        <AnimatePresence mode="popLayout">
                            {worldObjects.map((wo, idx) => (
                                <WorldObjectItem
                                    key={wo.id}
                                    object={wo}
                                    onUpdate={(updated) => {
                                        const newObjects = [...worldObjects];
                                        newObjects[idx] = updated;
                                        setWorldObjects(newObjects);
                                        persistWorldObjects(domainId, newObjects);
                                    }}
                                    onDelete={() => {
                                        const newObjects = worldObjects.filter((_, i) => i !== idx);
                                        setWorldObjects(newObjects);
                                        persistWorldObjects(domainId, newObjects);
                                    }}
                                />
                            ))}
                        </AnimatePresence>
                        <Button className="w-full" variant="outline" onClick={() => {
                            const newObj: WorldObject = {
                                id: crypto.randomUUID(),
                                name: "",
                                description: "",
                                actions: [],
                            };
                            const newObjects = [...worldObjects, newObj];
                            setWorldObjects(newObjects);
                            persistWorldObjects(domainId, newObjects);
                        }}><CirclePlus className="mr-2" /> Add Object</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showNarratorEditor} onOpenChange={setShowNarratorEditor}>
                <DialogContent className="font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Narrator persona</DialogTitle>
                    </DialogHeader>
                    <p className="opacity-50 text-xs whitespace-pre-line">{`Describe how the narrator should tell the story: tone, pacing, voice. For example "A dry, third-person storyteller with a darkly comic edge." This shapes all narrative prose in this world.`}</p>
                    <Textarea value={narratorPersona} onChange={(e) => setNarratorPersona(e.target.value)} rows={6} placeholder="e.g. A cinematic, atmospheric narrator that lingers on sensory detail..." />
                    <div className="flex items-center gap-2">
                        <Label htmlFor="narrativeMode">Story drive:</Label>
                        <div className="flex gap-2">
                            <Button
                                variant={narrativeMode === "reactive" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setNarrativeMode("reactive")}
                            >Reactive</Button>
                            <Button
                                variant={narrativeMode === "proactive" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setNarrativeMode("proactive")}
                            >Proactive</Button>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full">
                        <Button className="w-full" variant="outline" onClick={() => setShowNarratorEditor(false)}>Discard</Button>
                        <Button className="w-full" onClick={async () => {
                            const config = await getWorldConfig(domainId) ?? defaultCharacterData.plmex.domain!.worldConfig!;
                            await setWorldConfig(domainId, { ...config, narratorPersona, narrativeMode });
                            setShowNarratorEditor(false);
                            PMNotify.success("Narrator persona saved.");
                        }}><Check /> Apply</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showingStatusEditor} onOpenChange={setShowingStatusEditor}>
                <DialogContent className="max-h-[90vh] overflow-y-auto font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Dynamic statuses</DialogTitle>
                    </DialogHeader>
                    <AnimateChangeInHeight>
                    <p className="opacity-50 text-xs whitespace-pre-line">{`These are the statuses this world will track on every chapter, just like a character's dynamic statuses. The narrator will attach their current values to the end of each new message. For example, "Mood", "Energy", "Time of day", etc.`}</p>
                    <div className="flex flex-col gap-1 my-2">
                        <p className="opacity-50 text-xs">Suggestions</p>
                        <div className="flex flex-wrap gap-2 pb-1">
                            {["Mood", "Energy", "Time of day", "Weather", "Danger"].map((suggestion) => (
                                <Button key={suggestion} size="sm" variant="outline" onClick={() => {
                                    if (statusRows.findIndex((r) => r.name.toLowerCase() === suggestion.toLowerCase()) === -1) {
                                        setStatusRows([...statusRows, { key: Math.floor(Math.random() * 69420), name: suggestion, defaultValue: "0" }]);
                                    }
                                }}>{suggestion}</Button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <AnimatePresence mode="popLayout">
                            {statusRows.map((row, idx) => (
                                <motion.div key={row.key} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2 items-center">
                                    <Input value={row.name} onChange={(e) => { const next = [...statusRows]; next[idx] = { ...next[idx], name: e.target.value }; setStatusRows(next); }} placeholder="Status Name" className="flex-1" />
                                    <Input value={row.defaultValue} onChange={(e) => { const next = [...statusRows]; next[idx] = { ...next[idx], defaultValue: e.target.value }; setStatusRows(next); }} placeholder="Default Value" className="flex-1" />
                                    <Button size="icon" variant="ghost" onClick={() => { setStatusRows(statusRows.filter((_, i) => i !== idx)); }}><Trash2 /></Button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <Button variant="outline" onClick={() => setStatusRows([...statusRows, { key: Math.floor(Math.random() * 69420), name: "", defaultValue: "" }])}><CirclePlus className="mr-2" /> Add status</Button>
                    </div>
                    </AnimateChangeInHeight>
                    <div className="flex gap-2 w-full">
                        <Button className="w-full" variant="outline" onClick={() => setShowingStatusEditor(false)}>Discard</Button>
                        <Button className="w-full" onClick={saveStatusRows}><Check /> Apply</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Drawer open={showDomainIntro} onOpenChange={setShowDomainIntro}>
                <DrawerContent className="font-sans p-6 pt-0">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl font-bold mb-4 text-center">Welcome to your domain</DrawerTitle>
                    </DrawerHeader>
                    <div className="flex flex-col gap-4">
                        <p className="text-sm"><span className="palmirror-exc-text">PalMirror Domains</span><span className="opacity-80">{` allow you to create a persistent world for your character that evolves over time. They have attributes and memories that will change based on your interactions as you chat with them in a domain.`}</span></p>
                        <p className="opacity-80 text-sm">{`Domains is your platform for multiple different isolated chats. PalMirror will automatically cross-reference your chat's moments across each other to create continuity.`}</p>
                        <p className="opacity-80 text-sm">{`Watch the attribute bars change in realtime as you chat to see how your choices affect the character. See and forget memories to shape what they remember about your relationship.`}</p>
                        <p className="opacity-80 text-sm">{`Start new chat entries to explore different scenarios and see how the character adapts. Enjoy building deeper connections with your character!`}</p>
                        <Button onClick={() => { localStorage.setItem("domainIntroNewcomer", "1"); setShowDomainIntro(false); openNewChapter(); }}>Start a new chat</Button>
                    </div>
                </DrawerContent>
            </Drawer>
            
            <ToastContainer
                position="top-right"
                autoClose={5000}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                theme="dark"
            />
        </div>
    );
};

export default ExperienceDomainPage;
