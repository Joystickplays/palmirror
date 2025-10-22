"use client"

import React, { useState, useEffect, useContext } from "react";
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
import { CirclePlus, Trash2, ArrowRight, ArrowLeft, BrainCircuit, Eraser } from 'lucide-react';

import AttributeProgress from "@/components/AttributeProgress";

import { ToastContainer, toast } from "react-toastify";


import { PLMSecureContext } from "@/context/PLMSecureContext";
// import { isPalMirrorSecureActivated } from "@/utils/palMirrorSecureUtils";

import { CharacterData, ChatMetadata, defaultCharacterData, DomainAttributeEntry, DomainMemoryEntry } from "@/types/CharacterData";
import { deleteMemoryFromMessageIfAny, removeDomainTimestep, reverseDomainAttribute, setDomainMemories } from "@/utils/domainData";
import { Checkbox } from "@/components/ui/checkbox";



interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    stillGenerating: boolean;
}


const ExperienceDomainPage: React.FC = () => {
    const PLMsecureContext = useContext(PLMSecureContext);
    const router = useRouter();

    const [domainId, setDomainId] = useState("");
    const [chatList, setChatList] = useState<Array<ChatMetadata>>([]);

    const [showingNewChat, setShowingNewChat] = useState(false);
    const [newChatName, setNewChatName] = useState("");

    const [showingMemoryManager, setShowingMemoryManager] = useState(false);

    const [showingDelete, setShowingDelete] = useState(false);

    const [showingChatDelete, setShowingChatDelete] = useState(false);
    const [chatAboutToDelete, setChatAboutToDelete] = useState("");
    const [chatDeletePropagation, setChatDeletePropagation] = useState(false);

    const [isSecureReady, setIsSecureReady] = useState(false);
    const [character, setCharacter] = useState<CharacterData>(defaultCharacterData);

    useEffect(() => {
        if (sessionStorage.getItem("chatSelect")) {
            const domainId = sessionStorage.getItem("chatSelect") || "";
            setDomainId(domainId);
        }
    }, [])

    /* eslint-disable @typescript-eslint/no-explicit-any */
    function sortByLastUpdated(
        data: { [key: string]: any }[]
    ): { [key: string]: any }[] {
        return data.sort(
            (a, b) =>
                new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
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
                            toast.error("Not a domain-enabled character. Returning to home.")
                            router.push('/')
                        }
                    } else {
                        toast.error("Domain data not found. Returning to home.");
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

    const formatDateWithLocale = (dateInput: string | Date): string => {
        const date = new Date(dateInput); // Ensure the input is a Date object

        if (isNaN(date.getTime())) {
            throw new Error("Invalid Date");
        }

        const options: Intl.DateTimeFormatOptions = {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true, // Ensures am/pm format
            month: "long",
        };

        const time = date.toLocaleString("en-US", options); // Get time in "hh:mm am/pm" format
        const day = String(date.getDate()).padStart(2, "0"); // Ensure day is 2 digits
        const month = date.toLocaleString("en-US", { month: "long" }); // Month name (e.g., "January")

        return `${day} ${time}`;
    };


    return (
        <div className="flex flex-col gap-6 min-h-screen px-8 lg:px-56 pb-20 p-8 sm:p-10 font-[family-name:var(--font-geist-sans)]">
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -100 }}
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
                className="palmirror-exc border border-white/20 rounded-2xl w-full min-h-24 p-8 py-6 flex flex-col md:flex-row items-center justify-around"
            >
                <h1 className="font-extrabold text-xl flex-1 palmirror-exc-text">{character.name}</h1>
                <div className="flex overflow-x-scroll max-w-full pb-2 mt-4 md:pb-0 md:my-0 md:grid md:grid-cols-3 gap-4">
                    {character.plmex.domain?.attributes.map(attr => (
                        <AttributeProgress key={attr.key} attr={attr} />
                    ))}
                </div>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="flex flex-col gap-4 h-full">

                <div className="flex gap-2 h-12 overflow-x-scroll">
                    <Button variant="outline" onClick={() => router.push("/")}><ArrowLeft /></Button>
                    <div className="flex-1 w-full"></div>
                    <Button className="p-1 px-3" variant="palmirror" onClick={() => setShowingNewChat(true)}><CirclePlus />New chat</Button>
                    <Button className="p-1 px-3" variant="outline" onClick={() => setShowingMemoryManager(true)}><BrainCircuit />Manage memories</Button>
                    <Button variant="destructive" onClick={() => setShowingDelete(true)}><Trash2 /></Button>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-grow w-full justify-center items-start">
                    {sortByLastUpdated(chatList).map((chat, idx) => {
                        console.log(chat)
                        if (chat.associatedDomain !== domainId) {
                            return null;
                        }

                        return (
                            <motion.div
                                initial={
                                    { scale: 0.8, opacity: 0 }
                                }
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    filter: "blur(0px)",
                                }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{
                                    type: "spring",
                                    mass: 1,
                                    damping: 27,
                                    stiffness: 181,
                                    restDelta: 0.001,

                                    delay: 0.05 * idx
                                }}
                                key={chat.lastUpdated}
                                className="flex flex-col gap-1.5 p-6 border rounded-xl h-full"
                                layout
                            >
                                <h2 className={`font-bold ml-auto`}>{chat.entryTitle}</h2>
                                <p className="opacity-70 ml-auto text-xs">
                                    {formatDateWithLocale(chat.lastUpdated)}
                                </p>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setChatAboutToDelete(chat.id)
                                            setShowingChatDelete(true);
                                            // PLMsecureContext?.removeKey(chat.id);
                                            // PLMsecureContext?.removeKey(`METADATA${chat.id}`);
                                            // setChatList((prevList) =>
                                            //     prevList.filter(
                                            //         (chatItem) => chatItem.id !== chat.id
                                            //     )
                                            // );
                                        }}
                                    >
                                        <Trash2 />
                                    </Button>
                                    <Button
                                        variant={"outline"}
                                        onClick={() => {
                                            sessionStorage.setItem("chatSelect", chat.id);
                                            sessionStorage.setItem("chatAssociatedDomain", domainId);
                                            sessionStorage.setItem("chatEntryName", chat.entryTitle || "");
                                            router.push(`/chat`);
                                        }}
                                    >
                                        Continue <ArrowRight />
                                    </Button>
                                </div>
                            </motion.div>
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

                            toast.info(
                                `Chat deleted. ${chatDeletePropagation ? "Attributes and memories preserved." : "Relevant attributes and memories rolled back."}`
                            );
                            setShowingChatDelete(false);

                            reloadCharacter();
                        }}>Confirm deletion</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showingNewChat} onOpenChange={setShowingNewChat}>
                <DialogContent className="font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Start a new chat</DialogTitle>
                    </DialogHeader>
                    <Label htmlFor="chat-name">Entry name</Label>
                    <Input autoComplete="off" value={newChatName} onChange={(e) => setNewChatName(e.target.value)} id="chat-name" placeholder="Enter chat entry name" />
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
                                        <p className={isForgotten ? "blur-sm opacity-50 select-none" : ""}>{memory.memory}</p>
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

            <Dialog open={showingDelete} onOpenChange={setShowingDelete}>
                <DialogContent className="font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Delete domain</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this domain? All associated chats, attributes and memory will also be deleted!</p>
                    <Button variant="destructive" onClick={() => {
                        setShowingDelete(false);
                        chatList.forEach((chat) => {
                            if (chat.associatedDomain == domainId) {
                                PLMsecureContext?.removeKey(chat.id)
                                PLMsecureContext?.removeKey("METADATA" + chat.id)
                            }
                        })
                        PLMsecureContext?.removeKey("METADATA" + domainId)
                        router.push("/")
                    }}>Confirm deletion</Button>
                </DialogContent>
            </Dialog>
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