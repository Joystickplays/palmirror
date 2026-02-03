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
import { CirclePlus, Trash2, ArrowRight, ArrowLeft, BrainCircuit, Eraser, EllipsisVertical, History, Info, Book, Check, Library } from 'lucide-react';

import AttributeProgress from "@/components/domains/AttributeProgress";

import { ToastContainer } from "react-toastify";
import FlashcardItem from "@/components/domains/FlashcardItem";
import ChatCard from "@/components/domains/ChatCard";


import { usePLMGlobalConfig } from "@/context/PLMGlobalConfig";
import { PLMSecureContext } from "@/context/PLMSecureContext";
// import { isPalMirrorSecureActivated } from "@/utils/palMirrorSecureUtils";

import { CharacterData, ChatMetadata, defaultCharacterData } from "@/types/CharacterData";
import { DomainAttributeEntry, DomainMemoryEntry, DomainFlashcardEntry } from "@/types/EEDomain"

import { deleteMemoryFromMessageIfAny, getDomainGuide, removeDomainTimestep, reverseDomainAttribute, setDomainGuide, setDomainMemories, setDomainFlashcards } from "@/utils/domainData";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { usePMNotification } from "@/components/notifications/PalMirrorNotification";
import AskForUnlockSecure from "@/components/secure/AskForUnlockSecure";




interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    stillGenerating: boolean;
}


const ExperienceDomainPage: React.FC = () => {


    const PMNotify = usePMNotification();

    const PLMGC = usePLMGlobalConfig();
    const [configHighend, setConfigHighend] = useState(false);
    
    useEffect(() => {
        setConfigHighend(!!PLMGC.get("highend"))
    }, [])

    const PLMsecureContext = useContext(PLMSecureContext);
    const router = useRouter();

    const [domainId, setDomainId] = useState("");
    const [chatList, setChatList] = useState<Array<ChatMetadata>>([]);

    const [showingNewChat, setShowingNewChat] = useState(false);
    const [newChatName, setNewChatName] = useState("");

    const [showingMemoryManager, setShowingMemoryManager] = useState(false);

    const [showingDelete, setShowingDelete] = useState(false);
    const [showingDeleteVerification, setShowingDeleteVerification] = useState(false);

    const [showingChatDelete, setShowingChatDelete] = useState(false);
    const [chatAboutToDelete, setChatAboutToDelete] = useState("");
    const [chatDeletePropagation, setChatDeletePropagation] = useState(false);
    const [showingChatTimesteps, setShowingChatTimesteps] = useState(false);
    const [selectedChat, setSelectedChat] = useState<ChatMetadata | null>(null);

    const [showDomainIntro, setShowDomainIntro] = useState(false);

    const [domainGuideText, setDomainGuideText] = useState("");
    const [showDomainGuideEditor, setShowDomainGuideEditor] = useState(false);
    const [showingFlashcards, setShowingFlashcards] = useState(false);

    const [isSecureReady, setIsSecureReady] = useState(false);
    const [character, setCharacter] = useState<CharacterData>(defaultCharacterData);


    const newChatDialog = useRef<HTMLDivElement>(null);
    const newChatInput = useRef<HTMLInputElement>(null);


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
                        setCharacter(data as CharacterData);
                        console.log("load char")
                        console.log(data)

                        localStorage.setItem("characterData", JSON.stringify(data));
                        if (!data.plmex.domain) {
                            PMNotify.error("Not a domain-enabled character. Returning to home.")
                            router.push('/')
                        }
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
    }, [character])
    


    return (
        <div className="flex flex-col gap-6 min-h-screen lg:px-56 pb-20 md:p-8 p-2 sm:p-10 font-(family-name:--font-geist-sans)">
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
                <h1 className="font-extrabold text-xl flex-1 palmirror-exc-text md:min-w-[16rem]">{character.name}</h1>
                <div className=""></div>
                <div className="flex overflow-x-scroll max-w-full md:max-w-lg pb-2 mt-4 md:pb-0 md:my-0 md:grid md:grid-cols-3 md:grid-rows-2 md:grid-flow-col md:auto-cols-max gap-4">
                    {character.plmex.domain?.attributes.map(attr => (
                        <AttributeProgress key={attr.key} attr={attr} />
                    ))}
                </div>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4 h-full">
                
                <Button className="fixed bottom-4 right-4 p-8 px-6 rounded-full bg-background! backdrop-blur-xs z-1" variant="palmirror" onClick={() => setShowingNewChat(true)}><CirclePlus className="scale-150" /></Button>

                <div className="flex gap-2 h-12 overflow-x-scroll -mt-4">
                    <Button variant="outline" onClick={() => router.push("/")}><ArrowLeft /></Button>
                    <div className="flex-1 w-full"></div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button className="p-1 px-3" variant="outline"><EllipsisVertical /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="flex flex-col gap-2 rounded-xl font-sans p-4">
                            <Button className="p-1 px-3 justify-start!" variant="outline" onClick={() => setShowingMemoryManager(true)}><BrainCircuit />Manage memories</Button>
                            <Button className="p-1 px-3 justify-start!" variant="outline" onClick={() => setShowDomainGuideEditor(true)}><Book />Domain guide</Button>
                            <Button className="p-1 px-3 justify-start!" variant="outline" onClick={() => setShowDomainIntro(true)}><Info />Help</Button>
                        </PopoverContent>
                    </Popover>
                    {/* <Button className="p-1 px-3" variant="outline" onClick={() => setShowingMemoryManager(true)}><BrainCircuit />Manage memories</Button> */}
                    <Button variant="destructive" onClick={() => setShowingDelete(true)}><Trash2 /></Button>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 grow w-full justify-center items-start">
                    {sortByLastUpdated(chatList).map((chat: ChatMetadata, idx: number) => {
                        if (chat.associatedDomain !== domainId) {
                            return null;
                        }

                        return (
                            <ChatCard 
                                key={chat.lastUpdated}
                                chat={chat}
                                idx={idx}
                                configHighend={configHighend}
                                domainId={domainId}
                                setChatAboutToDelete={setChatAboutToDelete}
                                setShowingChatDelete={setShowingChatDelete}
                                setSelectedChat={setSelectedChat}
                                setShowingChatTimesteps={setShowingChatTimesteps}
                            />
                        )
                    })}
                </div>
            </motion.div>

            <Dialog open={showingChatDelete} onOpenChange={setShowingChatDelete}>
                <DialogContent className="font-sans">
                    <DialogHeader>
                        <DialogTitle>Delete chat</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <p className="text-sm opacity-80">Are you sure you want to delete this chat entry? To maintain continuity across chats in this domain, all attribute changes and memories created in this chat will be lost.</p>
                        <div className="flex gap-2">
                            <Checkbox id="deletePropagate" checked={chatDeletePropagation} onCheckedChange={(ch) => {
                                setChatDeletePropagation(ch === true)
                            }}></Checkbox>
                            <Label htmlFor="deletePropagate">Don&apos;t reverse attributes and memory</Label>
                        </div>
                        <Button variant="destructive" onClick={async (e) => {
                            if (!chatDeletePropagation) {
                                const file = await PLMsecureContext?.getSecureData(chatAboutToDelete) ?? "";
                                const decodedString = atob(file);
                                const decodedArray = new Uint8Array(
                                    decodedString.split("").map((char) => char.charCodeAt(0))
                                );
                                const decoder = new TextDecoder();
                                const json = decoder.decode(decodedArray);
                                const parsedMessages = JSON.parse(json);

                                parsedMessages.forEach((message: Message) => {
                                    deleteMemoryFromMessageIfAny(domainId, message.id);
                                    reverseDomainAttribute(domainId, message.id);
                                    removeDomainTimestep(domainId, message.id);
                                });
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

                            reloadCharacter();
                        }}>Confirm deletion</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showingNewChat} onOpenChange={setShowingNewChat}>
                <DialogContent ref={newChatDialog} className="max-h-[90vh] overflow-y-auto font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Start a new chat</DialogTitle>
                    </DialogHeader>
                    <Label htmlFor="chat-name">Entry name</Label>
                    <Input ref={newChatInput} autoComplete="off" value={newChatName} onChange={(e) => setNewChatName(e.target.value)} id="chat-name" placeholder="Enter chat entry name" />
                    <p className="text-xs opacity-50">{`A good entry name should the reflect the moment you're capturing in this new chat. For example, "First Encounter", "Moving Day", "Evening Complication", etc.`}<br /><br />{`PalMirror will look through your past chat entries and let your AI know how far you and this character has progressed together.`}</p>
                    <Button onClick={() => {
                        setShowingNewChat(false)
                        if (newChatName.trim() === "") {
                            return;
                        }

                        sessionStorage.setItem("chatSelect", "");
                        sessionStorage.setItem("chatAssociatedDomain", domainId);
                        sessionStorage.setItem("chatEntryName", newChatName.trim());
                        sessionStorage.setItem("chatFromNewDomain", "1");
                        router.push(`/chat`);
                    }}>Start</Button>
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
                                            <Button variant={isForgotten ? "outline" : "destructive"}disabled={isForgotten}
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
                        <DialogTitle className="text-2xl font-bold mb-4">Delete domain</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this domain? All associated chats, attributes and memory will also be deleted!</p>
                    <Button variant="destructive" onClick={() => {
                        setShowingDelete(false);
                        setShowingDeleteVerification(true);
                    }}>Confirm deletion</Button>
                </DialogContent>
            </Dialog>

            <AskForUnlockSecure open={showingDeleteVerification} onUnlock={() => {
                setShowingDeleteVerification(false);
                chatList.forEach((chat) => {
                    if (chat.associatedDomain == domainId) {
                        PLMsecureContext?.removeKey(chat.id)
                        PLMsecureContext?.removeKey("METADATA" + chat.id)
                    }
                })
                PLMsecureContext?.removeKey("METADATA" + domainId)
                router.push("/")
            }} onCancel={() => setShowingDeleteVerification(false)} />

            <Dialog open={showDomainGuideEditor} onOpenChange={setShowDomainGuideEditor}>
                <DialogContent className="max-h-[90vh] overflow-y-auto font-sans">
                    <DialogHeader>
                        <div className="flex items-center justify-between mb-4">
                            <DialogTitle className="text-2xl font-bold">Domain guide</DialogTitle>
                             <Button className="mr-4" variant="outline" size="sm" onClick={() => setShowingFlashcards(true)}><Library /> Flashcards</Button>
                        </div>
                    </DialogHeader>
                    <p className="opacity-50 text-xs whitespace-pre-line">{`Domain guides help set the overall context and rules for how the character should behave within this domain.
                        
                        Add manual memory, core moments, or specific instructions to shape the character's behavior and interactions. If PalMirror can't catch a relevant memory from your past chats, the domain guide will help fill in the gaps.
                    `}</p>

                    <Textarea value={domainGuideText} onChange={(e) => setDomainGuideText(e.target.value)} rows={10}></Textarea>
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
                            const newFC = [...(character.plmex.domain?.flashcards || []), { id: crypto.randomUUID(), content: "", frequency: 1 }];
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
                        <Button onClick={() => { localStorage.setItem("domainIntroNewcomer", "1"); setShowDomainIntro(false); setShowingNewChat(true); }}>Start a new chat</Button>
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
