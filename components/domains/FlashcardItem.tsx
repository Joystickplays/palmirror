import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Info, Trash2 } from 'lucide-react';
import { DomainFlashcardEntry } from "@/types/EEDomain";
import { Slider } from "../ui/slider";
import { motion } from "framer-motion";
interface FlashcardItemProps {
    flashcard: DomainFlashcardEntry;
    onUpdate: (updatedFlashcard: DomainFlashcardEntry) => void;
    onDelete: () => void;
}

const FlashcardItem = ({ flashcard, onUpdate, onDelete }: FlashcardItemProps) => {
    const [localContent, setLocalContent] = useState(flashcard.content);
    const [localFrequency, setLocalFrequency] = useState(flashcard.frequency);

    useEffect(() => {
        setLocalContent(flashcard.content);
        setLocalFrequency(flashcard.frequency);
    }, [flashcard]);

    const handleCommit = () => {
        if (localContent !== flashcard.content || localFrequency !== flashcard.frequency) {
            onUpdate({ ...flashcard, content: localContent, frequency: localFrequency });
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
            <Textarea
                className="text-sm"
                value={localContent}
                placeholder="e.g. Both characters are in a long-distance relationship."
                onChange={(e) => setLocalContent(e.target.value)}
                onBlur={handleCommit}
            />
            <Button className="ml-auto"  variant="destructive" onClick={onDelete}><Trash2 /> Delete</Button>

            <div className="flex flex-col">
                <h2 className="uppercase font-bold text-xs opacity-50">Recall Frequency</h2>
                <div className="w-full flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">
                            {localFrequency === 1 ? "Start only" : localFrequency === 11 ? "Every message" : `Every ${12 - localFrequency} messages`}
                        </span>
                        <Button variant={"outline"} className="w-6 h-6 p-0"> <Info /> </Button>
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
                            <span className="text-xs">Start only</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-1">
                            <div className="w-1 h-4 rounded-full bg-white/20"></div>
                            <span className="text-xs">Occasionally</span>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-1">
                            <div className="w-1 h-4 rounded-full bg-white/20"></div>
                            <span className="text-xs">Every message</span>
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
