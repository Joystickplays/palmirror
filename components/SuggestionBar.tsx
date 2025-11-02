import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface SuggestionBarProps {
    generating: boolean;
    suggestions: string[],
    suggestionPicked: (suggestion: string) => void;
    requestHide: () => void;
}
const SuggestionBar: React.FC<SuggestionBarProps> = ({ generating, suggestions, suggestionPicked, requestHide }) => {
    return (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 17 }}
        className="flex gap-2 -mb-2 overflow-x-scroll overflow-y-hidden">
            <Button onClick={() => requestHide()} className="p-4" size="smIcon" variant="outline"><X /></Button>
            <div className="w-0.5 h-full bg-white/5 rounded-full"></div>
            <AnimatePresence mode="popLayout">
                {generating && suggestions.length === 0 ? (
                    <motion.div
                    key="generatingSkeleton"
                    exit={{ opacity: 0, scale: 0.8 }}
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
                            <Button onClick={() => suggestionPicked(suggestion)} disabled={generating} className="!p-4 h-8 text-xs">
                                {suggestion}
                            </Button>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </motion.div>
    )
}

export default SuggestionBar;