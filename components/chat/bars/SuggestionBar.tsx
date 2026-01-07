import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "../../ui/button";
import { Dialog, DialogTitle, DialogContent, DialogHeader } from "../../ui/dialog";
import { Input } from "../../ui/input";

interface SuggestionBarProps {
    generating: boolean;
    suggestions: string[],
    startGeneration: () => void;
    suggestionPicked: (suggestion: string) => void;
    requestHide: () => void;
}
const SuggestionBar: React.FC<SuggestionBarProps> = ({ generating, suggestions, startGeneration, suggestionPicked, requestHide }) => {
    const [arbitrarySuggestionDialogShow, setArbitrarySuggestionDialogShow] = useState(false);
    const [arbitrarySuggestionInput, setArbitrarySuggestionInput] = useState(sessionStorage.getItem("arbitrarySuggestionInput") || ""); // lazy so thisll do

    return (
        <>
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 17 }}
            className="flex gap-2 -mb-2 overflow-x-scroll overflow-y-hidden">
                <Button onClick={() => requestHide()} className="p-4" size="smIcon" variant="outline"><X /></Button>
                <div className="w-0.5 h-full bg-white/5 rounded-full"></div>
                <AnimatePresence mode="popLayout">
                    {!generating && suggestions.length === 0 ? (
                        <motion.div
                        key={"generatePrompt"}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 18 }}>
                            <Button onClick={startGeneration} className="p-4! h-8 text-xs">
                                Generate suggestion prompts
                            </Button>
                        </motion.div>
                    ) : generating && suggestions.length === 0 ? (
                        <motion.div
                        key="generatingSkeleton"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 18 }}
                        className="flex gap-2">
                            <div className="w-32 h-8 bg-white/30 rounded-lg animate-pulse"></div>
                            <div className="w-32 h-8 bg-white/30 rounded-lg animate-pulse delay-150"></div>
                            <div className="w-32 h-8 bg-white/30 rounded-lg animate-pulse delay-300"></div>
                        </motion.div>
                    )
                    : suggestions.map((suggestion, idx) => {
                        return (
                            <motion.div
                                key={idx}
                                initial={{ y: 100 }}
                                animate={{ y: 0 }}
                                transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 22, delay: 0.1 * idx }}
                            >
                                <Button onClick={() => suggestionPicked(suggestion)} disabled={generating} className="p-4! h-8 text-xs">
                                    {suggestion}
                                </Button>
                            </motion.div>
                        )
                    })}
                    <motion.div
                        key={"arbitrarySuggestion"}
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        layout="position"
                        transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 22 }}
                    >
                        <Button variant="outline" onClick={() => setArbitrarySuggestionDialogShow(true)} disabled={generating} className="p-4! h-8 text-xs">
                            Create reply from prompt
                        </Button>
                    </motion.div>
                </AnimatePresence>
            </motion.div>
            <Dialog open={arbitrarySuggestionDialogShow} onOpenChange={setArbitrarySuggestionDialogShow}>
                <DialogContent className="font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl mb-4">Reply from prompt</DialogTitle>
                    </DialogHeader>
                    <Input value={arbitrarySuggestionInput} onChange={(e) => setArbitrarySuggestionInput(e.target.value)} placeholder="Prompt" />
                    <p className="opacity-50 text-xs">{`Just like the auto-generated prompt suggestions, yours should be written in the perspective of yourself.`}</p>
                    <Button onClick={() => {
                        sessionStorage.setItem("arbitrarySuggestionInput", arbitrarySuggestionInput)
                        suggestionPicked(arbitrarySuggestionInput);
                        setArbitrarySuggestionDialogShow(false);
                    }}>Create reply</Button>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default SuggestionBar;