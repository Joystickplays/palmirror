import React, { useState } from "react";
import { motion } from 'motion/react';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowRight, EllipsisVertical, History, Trash2, BookPlus, Play } from 'lucide-react';
import { ChatMetadata } from "@/types/CharacterData";
import { WorldCharacter } from "@/types/EEDomain";
import CharacterCastPicker from "./CharacterCastPicker";

const formatDateWithLocale = (dateInput: string | Date): string => {
    const date = new Date(dateInput);

    if (isNaN(date.getTime())) {
        throw new Error("Invalid Date");
    }

    const options: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        month: "long",
    };

    const time = date.toLocaleString("en-US", options);
    const day = String(date.getDate()).padStart(2, "0");

    return `${day} ${time}`;
};

interface ChapterCardProps {
    chat: ChatMetadata;
    idx: number;
    configHighend: boolean;
    domainId: string;
    worldCharacters: Array<WorldCharacter>;
    subchats: Array<ChatMetadata>;
    setChatAboutToDelete: (id: string) => void;
    setShowingChatDelete: (show: boolean) => void;
    setSelectedChat: (chat: ChatMetadata) => void;
    setShowingChatTimesteps: (show: boolean) => void;
    skipUserCharacterWarning: boolean;
    onUserCharacterWarning: (proceed: () => void) => boolean;
}

const ChapterCard = React.memo(({
    chat,
    idx,
    domainId,
    worldCharacters,
    subchats,
    setChatAboutToDelete,
    setShowingChatDelete,
    setSelectedChat,
    setShowingChatTimesteps,
    skipUserCharacterWarning,
    onUserCharacterWarning
}: ChapterCardProps) => {
    const router = useRouter();
    const [showingContinue, setShowingContinue] = useState(false);
    const [continueName, setContinueName] = useState("");
    const [continueCast, setContinueCast] = useState<Array<string>>([]);

    const openContinueDialog = () => {
        setContinueName(`Continuation ${subchats.length + 1}`);
        setContinueCast(chat.cast ? [...chat.cast] : []);
        setShowingContinue(true);
    };

    const continueChapter = () => {
        const name = continueName.trim() === "" ? `Continuation ${subchats.length + 1}` : continueName.trim();
        const userCharacterName = worldCharacters.find(c => c.isUser)?.name ?? null;

        const doContinue = () => {
            sessionStorage.setItem("chatSelect", "");
            sessionStorage.setItem("chatAssociatedDomain", domainId);
            sessionStorage.setItem("chatEntryName", name);
            sessionStorage.setItem("chatFromNewDomain", "1");
            sessionStorage.setItem("chatParentChapterId", chat.id);
            sessionStorage.setItem("chatChapterCast", JSON.stringify(continueCast));
            sessionStorage.setItem("chatTimesteps", JSON.stringify(chat.timesteps || []));
            router.push(`/chat`);
        };

        if (!userCharacterName && !skipUserCharacterWarning) {
            setShowingContinue(false);
            onUserCharacterWarning(doContinue);
            return;
        }

        doContinue();
    };

    const openChapter = () => {
        sessionStorage.setItem("chatSelect", chat.id);
        sessionStorage.setItem("chatAssociatedDomain", domainId);
        sessionStorage.setItem("chatEntryName", chat.entryTitle || "");
        sessionStorage.setItem("chatTimesteps", JSON.stringify(chat.timesteps || []))
        router.push(`/chat`);
    };

    const openSubchat = (sub: ChatMetadata) => {
        sessionStorage.setItem("chatSelect", sub.id);
        sessionStorage.setItem("chatAssociatedDomain", domainId);
        sessionStorage.setItem("chatEntryName", sub.entryTitle || "");
        sessionStorage.setItem("chatTimesteps", JSON.stringify(sub.timesteps || []))
        router.push(`/chat`);
    };

    return (
        <motion.div
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
                type: "tween",
                duration: 0.3,
                ease: "easeOut",
            }}
            className="flex flex-col gap-1.5 p-6 border-b rounded-xl h-full"
            layout
        >
            <div className="flex items-center justify-between gap-2">
                <h2 className={`font-bold`}>{chat.entryTitle}</h2>
                <p className="opacity-70 text-xs">
                    {formatDateWithLocale(chat.lastUpdated)}
                </p>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant={"outline"} onClick={openChapter}>
                    Open <Play />
                </Button>
                <Button variant={"outline"} onClick={openContinueDialog}>
                    Continue <BookPlus />
                </Button>
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
            </div>

            {subchats.length > 0 && (
                <div className="flex flex-col gap-1 mt-2 border-t border-white/10 pt-2">
                    {subchats.map((sub) => (
                        <motion.div
                            key={sub.id}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{sub.entryTitle || "(untitled)"}</p>
                                <p className="opacity-50 text-[10px]">{formatDateWithLocale(sub.lastUpdated)}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openSubchat(sub)}>
                                Open <ArrowRight />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => {
                                setChatAboutToDelete(sub.id);
                                setShowingChatDelete(true);
                            }}>
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </motion.div>
                    ))}
                </div>
            )}

            <Dialog open={showingContinue} onOpenChange={setShowingContinue}>
                <DialogContent className="max-h-[90vh] overflow-y-auto font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Continue chapter</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="continue-name">Continuation name</Label>
                            <Input id="continue-name" autoComplete="off" value={continueName} onChange={(e) => setContinueName(e.target.value)} placeholder="e.g. Continuation 1" />
                        </div>
                        <CharacterCastPicker
                            characters={worldCharacters}
                            selected={continueCast}
                            onToggle={(name) => setContinueCast((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name])}
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowingContinue(false)}>Cancel</Button>
                            <Button onClick={continueChapter}>Continue</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
});
ChapterCard.displayName = "ChapterCard";

export default ChapterCard;
