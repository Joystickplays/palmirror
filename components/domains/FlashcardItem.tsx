import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Info, Trash2 } from 'lucide-react';
import { DomainFlashcardEntry } from "@/types/EEDomain";
import { Slider } from "../ui/slider";
import { motion } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
interface FlashcardItemProps {
    flashcard: DomainFlashcardEntry;
    onUpdate: (updatedFlashcard: DomainFlashcardEntry) => void;
    onDelete: () => void;
}

const FlashcardItem = ({ flashcard, onUpdate, onDelete }: FlashcardItemProps) => {
    const [localContent, setLocalContent] = useState(flashcard.content);
    const [localFrequency, setLocalFrequency] = useState(flashcard.frequency);
    const [localChance, setLocalChance] = useState(flashcard.chance);
    const [localDistance, setLocalDistance] = useState(flashcard.distance);

    useEffect(() => {
        setLocalContent(flashcard.content);
        setLocalFrequency(flashcard.frequency);
        setLocalChance(flashcard.chance);
        setLocalDistance(flashcard.distance);
    }, [flashcard]);

    const handleCommit = () => {
        if (localContent !== flashcard.content || localFrequency !== flashcard.frequency || localChance !== flashcard.chance || localDistance !== flashcard.distance) {
            onUpdate({ ...flashcard, content: localContent, frequency: localFrequency, chance: localChance, distance: localDistance });
        }
    }

    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 10
            }}
            animate={{
                opacity: 1,
                y: 0
            }}
            exit={{
                opacity: 0,
                scale: 0.95
            }}
            transition={{ type: "spring", stiffness: 160, damping: 16 }}
            layout={"position"}
            className="border border-white/10 rounded-xl p-4 flex flex-col gap-3">

            <div className="flex flex-col sm:flex-row gap-2">
                <Textarea
                    className="text-sm"
                    value={localContent}
                    placeholder="e.g. Both characters are in a long-distance relationship."
                    onChange={(e) => setLocalContent(e.target.value)}
                    onBlur={handleCommit}
                />
                <Button className="ml-auto sm:h-full" variant="destructive" onClick={onDelete}><Trash2 /> <span className="block sm:hidden">Delete</span></Button>
            </div>

            <div className="flex flex-col mt-2">
                <div className="flex justify-between items-center">
                    <h2 className="uppercase font-bold text-xs opacity-50 mb-2">Recall Frequency</h2>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-6 h-6 p-0"><Info /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="font-sans">
                            <p className="text-sm">Determines how often this flashcard is considered for recall.</p>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="w-full flex flex-col items-center gap-2">
                    <div className="flex w-full items-start gap-2">
                        <span className="text-sm font-bold">
                            {localFrequency === 1 ? "Start only" : localFrequency === 11 ? "Every message" : `Every ${12 - localFrequency} messages`}
                        </span>
                        {/* <Button variant={"outline"} className="w-6 h-6 p-0"> <Info /> </Button> */}
                    </div>
                    <Slider
                        min={1}
                        max={11}
                        step={1}
                        value={[localFrequency]}
                        className="w-full"
                        onValueChange={(e) => setLocalFrequency(Number(e[0]))}
                        onValueCommit={(e) => {
                            if (localContent !== flashcard.content || localFrequency !== flashcard.frequency) {
                                onUpdate({ ...flashcard, content: localContent, frequency: Number(e[0]) });
                            }
                        }}
                    />
                    <div className="flex justify-between w-full px-1 text-muted-foreground text-xs">
                        <div className="flex flex-col gap-1 flex-1">
                            <div className="w-1 h-4 rounded-full bg-white/20"></div>
                            <span className="text-[10px]">Start only</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-1">
                            <div className="w-1 h-4 rounded-full bg-white/20"></div>
                            <span className="text-[10px]">Occasionally</span>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-1">
                            <div className="w-1 h-4 rounded-full bg-white/20"></div>
                            <span className="text-[10px]">Every message</span>
                        </div>
                        {/* <span className="text-xs">Start only</span>
                        <span className="text-xs">Occasionally</span>
                        <span className="text-xs">Every message</span> */}
                    </div>
                </div>
            </div>

            <div className="flex flex-col mt-2">
                <div className="flex justify-between items-center">
                    <h2 className="uppercase font-bold text-xs opacity-50 mb-2">Recall Chance</h2>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-6 h-6 p-0"><Info /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="font-sans">
                            <p className="text-sm">Determines the probability of this flashcard being actually recalled when considered.</p>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="w-full flex flex-col items-center gap-2">
                    <div className="flex w-full items-start gap-2">
                        <span className="text-sm font-bold">
                            {localChance}%
                        </span>
                        {/* <Button variant={"outline"} className="w-6 h-6 p-0"> <Info /> </Button> */}
                    </div>
                    <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[localChance]}
                        className="w-full"
                        onValueChange={(e) => setLocalChance(Number(e[0]))}
                        onValueCommit={(e) => {
                            if (localContent !== flashcard.content || localChance !== flashcard.chance) {
                                onUpdate({ ...flashcard, content: localContent, chance: Number(e[0]) });
                            }
                        }}
                    />
                    <div className="flex justify-between w-full px-1 text-muted-foreground text-xs">
                        <div className="flex flex-col gap-1 flex-1">
                            <div className="w-1 h-4 rounded-full bg-white/20"></div>
                            <span className="text-[10px]">Literally never</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-1">
                            <div className="w-1 h-4 rounded-full bg-white/20"></div>
                            <span className="text-[10px]">50/50</span>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-1">
                            <div className="w-1 h-4 rounded-full bg-white/20"></div>
                            <span className="text-[10px]">Always</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col mt-2">
                <div className="flex justify-between items-center">
                    <h2 className="uppercase font-bold text-xs opacity-50 mb-2">Recall distance/strength</h2>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-6 h-6 p-0"><Info /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="font-sans">
                            <p className="text-sm">Determines how strongly this flashcard influences the conversation when recalled by putting the flashcard further or closer.</p>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="w-full flex flex-col items-center gap-2">
                    <div className="flex w-full items-start gap-2">
                        <span className="text-sm font-bold">
                            {10 - localDistance} message{10 - localDistance !== 1 ? "s" : ""} away
                        </span>
                        {/* <Button variant={"outline"} className="w-6 h-6 p-0"> <Info /> </Button> */}
                    </div>
                    <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={[localDistance]}
                        className="w-full"
                        onValueChange={(e) => setLocalDistance(Number(e[0]))}
                        onValueCommit={(e) => {
                            if (localContent !== flashcard.content || localDistance !== flashcard.distance) {
                                onUpdate({ ...flashcard, content: localContent, distance: Number(e[0]) });
                            }
                        }}
                    />
                    <div className="flex justify-between w-full px-1 text-muted-foreground text-xs">
                        <div className="flex flex-col gap-1 flex-1">
                            <div className="w-1 h-4 rounded-full bg-white/20"></div>
                            <span className="text-[10px]">Subtle</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-1">
                            <div className="w-1 h-4 rounded-full bg-white/20"></div>
                            <span className="text-[10px]">Mild</span>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-1">
                            <div className="w-1 h-4 rounded-full bg-white/20"></div>
                            <span className="text-[10px]">Strong</span>
                        </div>
                        {/* <span className="text-xs">Start only</span>
                        <span className="text-xs">Occasionally</span>
                        <span className="text-xs">Every message</span> */}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default FlashcardItem;
