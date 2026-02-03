import React from "react";
import { motion } from 'motion/react';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowRight, EllipsisVertical, History, Trash2 } from 'lucide-react';
import { ChatMetadata } from "@/types/CharacterData";

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
    // const month = date.toLocaleString("en-US", { month: "long" }); // Month name (e.g., "January")

    return `${day} ${time}`;
};

interface ChatCardProps {
    chat: ChatMetadata;
    idx: number;
    configHighend: boolean;
    domainId: string;
    setChatAboutToDelete: (id: string) => void;
    setShowingChatDelete: (show: boolean) => void;
    setSelectedChat: (chat: ChatMetadata) => void;
    setShowingChatTimesteps: (show: boolean) => void;
}

const ChatCard = React.memo(({
    chat,
    idx,
    configHighend,
    domainId,
    setChatAboutToDelete,
    setShowingChatDelete,
    setSelectedChat,
    setShowingChatTimesteps
}: ChatCardProps) => {
    const router = useRouter();

    return (
        <motion.div
            initial={
                { scale: configHighend ? 0.8 : 1, opacity: 0 }
            }
            animate={{
                opacity: 1,
                scale: 1,
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
                type: "tween",
                duration: 0.3,
                ease: "easeOut",

                delay: 0.05 * idx
            }}
            className="flex flex-col gap-1.5 p-6 border rounded-xl h-full"
            layout
        >
            <h2 className={`font-bold ml-auto`}>{chat.entryTitle}</h2>
            <p className="opacity-70 ml-auto text-xs">
                {formatDateWithLocale(chat.lastUpdated)}
            </p>
            <div className="flex justify-end gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button className="p-1 px-3" variant="outline"><EllipsisVertical /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="flex flex-col gap-2 rounded-xl font-sans p-4">
                        <Button
                            className="p-1 px-3 justify-start!"
                            variant="destructive"
                            onClick={() => {
                                setChatAboutToDelete(chat.id);
                                setShowingChatDelete(true);
                            }}
                        >
                            <Trash2 /> Delete
                        </Button>
                        <Button
                            className="p-1 px-3 justify-start!"
                            variant="outline"
                            onClick={() => {
                                setSelectedChat(chat);
                                setShowingChatTimesteps(true);
                            }}
                        >
                            <History /> View timesteps
                        </Button>
                    </PopoverContent>
                </Popover>
                <Button
                    variant={"outline"}
                    onClick={() => {
                        sessionStorage.setItem("chatSelect", chat.id);
                        sessionStorage.setItem("chatAssociatedDomain", domainId);
                        sessionStorage.setItem("chatEntryName", chat.entryTitle || "");
                        sessionStorage.setItem("chatTimesteps", JSON.stringify(chat.timesteps || []))
                        router.push(`/chat`);
                    }}
                >
                    Continue <ArrowRight />
                </Button>
            </div>
        </motion.div>
    );
});
ChatCard.displayName = "ChatCard";

export default ChatCard;
