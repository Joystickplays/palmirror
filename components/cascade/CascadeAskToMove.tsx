import { AnimatePresence, motion } from "framer-motion";
import { ApiProfile } from "../chat/ChatSettings";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

interface CascadeAskToMoveProps {
    apiProfileId?: string;
    showCascadeError: boolean;
    setShowCascadeError: (show: boolean) => void;
    handleSendMessage: () => void;
}

export const setProfileDormant = (profileId: string) => {
    const profiles: ApiProfile[] = JSON.parse(localStorage.getItem('Proxy_profiles') || '[]');
    const updated = profiles.map(p =>
        p.id === profileId ? { ...p, cascade: { ...p.cascade, working: false } } : p
    );
    localStorage.setItem('Proxy_profiles', JSON.stringify(updated));
};
export default function CascadeAskToMove({ apiProfileId, showCascadeError, setShowCascadeError, handleSendMessage }: CascadeAskToMoveProps) {
    return (
        <AnimatePresence>
            {showCascadeError && (
                <motion.div
                    key="cascadeAskToMove"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ type: 'spring', mass: 1, stiffness: 161, damping: 16 }}
                    className="p-4 border border-white/10 bg-background rounded-2xl font-sans absolute bottom-4 max-w-[20rem] sm:max-w-md">
                    <Label className="text-xs uppercase font-bold opacity-70">Cascade
                    </Label>
                    <p className="tracking-tight text-sm opacity-80 mt-2">The last request returned an error. Do you want to mark the profile as Dormant and try again with another?</p>
                    <div className="flex gap-2 mt-4 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setShowCascadeError(false)}>Cancel</Button>
                        <Button size="sm" onClick={() => {
                            setShowCascadeError(false);
                            if (typeof apiProfileId === 'string') {
                                setProfileDormant(apiProfileId);
                            }
                            handleSendMessage();
                        }}>Mark as Dormant & Retry</Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}