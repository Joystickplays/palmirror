"use client"

import React, { useState, useEffect, useContext } from "react";
import { motion } from 'motion/react';
import { useRouter } from "next/navigation";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CirclePlus, Trash2, ArrowRight } from 'lucide-react';

import NumberFlow, { continuous } from '@number-flow/react'

import { ToastContainer, toast } from "react-toastify";


import { PLMSecureContext } from "@/context/PLMSecureContext";
// import { isPalMirrorSecureActivated } from "@/utils/palMirrorSecureUtils";

import { CharacterData, defaultCharacterData, DomainAttributeEntry } from "@/types/CharacterData";

interface ChatMetadata extends CharacterData {
    id: string;
    lastUpdated: string;
    associatedDomain?: string;
    entryTitle?: string;
}

type AttributeProgressProps = {
  attr: DomainAttributeEntry;
};

const AttributeProgress: React.FC<AttributeProgressProps> = ({ attr }) => {
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setProgressValue(attr.value));
    return () => cancelAnimationFrame(id);
  }, [attr.value]);

  return (
    <div className="flex flex-col gap-2 min-w-32">
      <div className="flex justify-between items-end">
        <p className="text-sm font-bold">{attr.attribute}</p>
        <p className="opacity-25 text-xs">
          <NumberFlow plugins={[continuous]} value={progressValue} />%
        </p>
      </div>
      <Progress className="!h-[12px]" value={progressValue} max={100} />
    </div>
  );
}

const ExperienceDomainPage: React.FC = () => {
    const PLMsecureContext = useContext(PLMSecureContext);
    const router = useRouter();

    const [domainId, setDomainId] = useState("");
    const [chatList, setChatList] = useState<Array<ChatMetadata>>([]);
    
    const [showingNewChat, setShowingNewChat] = useState(false);
    const [newChatName, setNewChatName] = useState("");

    const [isSecureReady, setIsSecureReady] = useState(false);
    const [character, setCharacter] = useState<CharacterData>(defaultCharacterData);

    useEffect(() => {
        if (sessionStorage.getItem("chatSelect")) {
            const domainId = sessionStorage.getItem("chatSelect") || "";
            setDomainId(domainId);
        }
    }, [])

    useEffect(() => {
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
                    } else {
                        toast.error("Domain data not found. Returning to home.");
                        setTimeout(() => {
                            router.push('/');
                        }, 3000);
                    }
                });
            }
        }
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


                <Button variant="palmirror" onClick={() => setShowingNewChat(true)}><CirclePlus />Start a new chat</Button>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow w-full justify-center items-start">
                    {chatList.map((chat) => {
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
                                    stiffness: 161,
                                    restDelta: 0.001,
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
                                        PLMsecureContext?.removeKey(chat.id);
                                        PLMsecureContext?.removeKey(`METADATA${chat.id}`);
                                        setChatList((prevList) =>
                                            prevList.filter(
                                            (chatItem) => chatItem.id !== chat.id
                                            )
                                        );
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


            <Dialog open={showingNewChat} onOpenChange={setShowingNewChat}>
                <DialogContent className="font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Start a new chat</DialogTitle>
                    </DialogHeader>
                    <Label htmlFor="chat-name">Entry name</Label>
                    <Input value={newChatName} onChange={(e) => setNewChatName(e.target.value)} id="chat-name" placeholder="Enter chat entry name" />

                    <Button onClick={() => {
                        setShowingNewChat(false)
                        if (newChatName.trim() === "") {
                            return;
                        }

                        sessionStorage.setItem("chatSelect", "");
                        sessionStorage.setItem("chatAssociatedDomain", domainId);
                        sessionStorage.setItem("chatEntryName", newChatName.trim());
                        router.push(`/chat`);
                    }}>Start</Button>
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