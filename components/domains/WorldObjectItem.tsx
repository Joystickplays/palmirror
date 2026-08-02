import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ImagePlus, X, Plus } from 'lucide-react';
import { WorldObject, WorldObjectAction } from "@/types/EEDomain";
import { motion } from "motion/react";

interface WorldObjectItemProps {
    object: WorldObject;
    onUpdate: (updated: WorldObject) => void;
    onDelete: () => void;
}

const WorldObjectItem = ({ object, onUpdate, onDelete }: WorldObjectItemProps) => {
    const [localName, setLocalName] = useState(object.name);
    const [localDescription, setLocalDescription] = useState(object.description);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                onUpdate({ ...object, image: (ev.target?.result as string) ?? "" });
            };
            reader.readAsDataURL(file);
        }
    };

    const updateAction = (idx: number, patch: Partial<WorldObjectAction>) => {
        const actions = [...(object.actions || [])];
        actions[idx] = { ...actions[idx], ...patch };
        onUpdate({ ...object, actions });
    };

    const addAction = () => {
        const actions = [...(object.actions || [])];
        actions.push({ id: crypto.randomUUID(), name: "", instruction: "" });
        onUpdate({ ...object, actions });
    };

    const removeAction = (idx: number) => {
        const actions = [...(object.actions || [])];
        actions.splice(idx, 1);
        onUpdate({ ...object, actions });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 160, damping: 16 }}
            layout={"position"}
            className="border border-white/10 rounded-xl p-4 flex flex-col gap-3"
        >
            <div className="flex items-start gap-3">
                {object.image ? (
                    <div className="relative">
                        <img src={object.image} alt={object.name} className="size-16 rounded-xl object-cover" />
                        <Button variant="outline" size="icon" className="absolute -top-2 -right-2 w-6 h-6 p-0"
                            onClick={() => onUpdate({ ...object, image: undefined })}>
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                ) : (
                    <Button variant="outline" className="size-16" onClick={() => fileInputRef.current?.click()}>
                        <ImagePlus />
                    </Button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                <div className="flex flex-col gap-2 flex-1">
                    <Input placeholder="Object name" value={localName} onChange={(e) => setLocalName(e.target.value)} onBlur={() => { if (localName !== object.name) onUpdate({ ...object, name: localName }); }} />
                    <Textarea placeholder="Description of the object..." value={localDescription} onChange={(e) => setLocalDescription(e.target.value)} onBlur={() => { if (localDescription !== object.description) onUpdate({ ...object, description: localDescription }); }} className="text-sm" />
                </div>
                <Button variant="destructive" onClick={onDelete}><Trash2 /></Button>
            </div>

            <div className="flex flex-col gap-2">
                <h2 className="uppercase font-bold text-xs opacity-50">Custom Actions</h2>
                <p className="text-xs opacity-60">Define what happens when the user does something to this object.</p>
                {(object.actions || []).map((action, idx) => (
                    <div key={action.id} className="flex flex-col gap-2 border border-white/10 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <Input placeholder={'Action name (e.g. "Rub it")'} className="flex-1" value={action.name} onChange={(e) => updateAction(idx, { name: e.target.value })} />
                            <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => removeAction(idx)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                        <Textarea placeholder="What happens when this action is done..." className="text-sm" value={action.instruction} onChange={(e) => updateAction(idx, { instruction: e.target.value })} />
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addAction}><Plus className="w-4 h-4 mr-1" /> Add action</Button>
            </div>
        </motion.div>
    );
};

export default WorldObjectItem;
