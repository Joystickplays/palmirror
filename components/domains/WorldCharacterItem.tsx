import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ImagePlus, X, UserCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorldCharacter, DomainAttributeEntry } from "@/types/EEDomain";
import { motion } from "motion/react";

interface WorldCharacterItemProps {
    character: WorldCharacter;
    onUpdate: (updated: WorldCharacter) => void;
    onDelete: () => void;
    characterNames?: string[];
}

const WorldCharacterItem = ({ character, onUpdate, onDelete, characterNames = [] }: WorldCharacterItemProps) => {
    const [localName, setLocalName] = useState(character.name);
    const [localPersonality, setLocalPersonality] = useState(character.personality);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                onUpdate({ ...character, image: (ev.target?.result as string) ?? "" });
            };
            reader.readAsDataURL(file);
        }
    };

    const updateAttribute = (idx: number, patch: Partial<DomainAttributeEntry>) => {
        const attrs = [...(character.attributes || [])];
        attrs[idx] = { ...attrs[idx], ...patch };
        onUpdate({ ...character, attributes: attrs });
    };

    const addAttribute = () => {
        const attrs = [...(character.attributes || [])];
        attrs.push({
            key: Math.floor(Math.random() * 69420),
            attribute: "",
            value: 50,
            history: [],
            target: "user",
        });
        onUpdate({ ...character, attributes: attrs });
    };

    const removeAttribute = (idx: number) => {
        const attrs = [...(character.attributes || [])];
        attrs.splice(idx, 1);
        onUpdate({ ...character, attributes: attrs });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 160, damping: 16 }}
            layout={"position"}
            className="relative border border-white/10 rounded-xl p-4 flex flex-col gap-3"
        >
            <div className="flex flex-col md:flex-row items-start gap-3">
                {character.isUser && (
                    <span className="absolute -top-2 left-4 text-[10px] font-bold uppercase tracking-wider palmirror-exc-text">You</span>
                )}
                {character.image ? (
                    <div className="relative w-full md:w-auto overflow-hidden">
                        <img src={character.image} alt={character.name} className="md:size-16! max-h-32 w-full rounded-xl object-cover object-[center_35%]" />
                        
                        <h1 className="absolute bottom-2 left-2 text-4xl font-black mix-blend-color-dodge text-gray-400 md:hidden w-999">{character.name}</h1>
                        
                        <Button variant="outline" size="icon" className="absolute -top-2 -right-2 w-6 h-6 p-0"
                            onClick={() => {
                                if (fileInputRef.current) fileInputRef.current.value = "";
                                onUpdate({ ...character, image: undefined });
                            }}>
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                ) : (
                    <Button variant="outline" className="md:size-16! h-32 w-full" onClick={() => fileInputRef.current?.click()}>
                        <ImagePlus />
                    </Button>
                )}
                <div className="flex items-start gap-3">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="flex gap-2">
                            <Input placeholder="Character name" value={localName} onChange={(e) => setLocalName(e.target.value)} onBlur={() => { if (localName !== character.name) onUpdate({ ...character, name: localName }); }} />
                            <Button
                                variant={character.isUser ? "default" : "outline"}
                                className="shrink-0 w-fit ml-auto"
                                onClick={() => onUpdate({ ...character, isUser: !character.isUser })}
                                title="Mark this character as the one you play"
                            >
                                <UserCheck className="w-4 h-4" /> {character.isUser ? "You" : "This is me"}
                            </Button>
                        </div>
                        <Textarea placeholder="Personality, mannerisms, goals..." value={localPersonality} onChange={(e) => setLocalPersonality(e.target.value)} onBlur={() => { if (localPersonality !== character.personality) onUpdate({ ...character, personality: localPersonality }); }} className="text-sm" />
                    </div>
                    <Button variant="destructive" onClick={onDelete}><Trash2 /></Button>
                </div>
            </div>


            <div className="flex flex-col gap-2">
                <h2 className="uppercase font-bold text-xs opacity-50">Attributes & Relationships</h2>
                {(character.attributes || []).map((attr, idx) => {
                    const currentTarget = attr.target ?? "user";
                    const otherNames = characterNames.filter((n) => n.trim() !== "" && n !== character.name);
                    const targetOptions = Array.from(new Set(["user", ...otherNames, currentTarget]));
                    return (
                        <div key={attr.key} className="flex flex-col md:flex-row border border-white/10 md:border-0 rounded-xl p-4 md:p-0 items-end md:items-center gap-2">
                            <Input placeholder="Attribute" className="flex-1" value={attr.attribute} onChange={(e) => updateAttribute(idx, { attribute: e.target.value })} />
                            <Select
                                value={currentTarget}
                                onValueChange={(v) => updateAttribute(idx, { target: v === "user" ? undefined : v })}
                            >
                                <SelectTrigger className="flex-1 min-w-24">
                                    <SelectValue placeholder="Toward..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {targetOptions.map((name) => (
                                        <SelectItem key={name} value={name}>
                                            {name === "user" ? "You" : name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <Input type="number" min={0} max={100} className="w-full" value={attr.value} onChange={(e) => updateAttribute(idx, { value: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} />
                                <span className="text-lg font-bold">%</span>
                            </div>
                            <Button variant="outline" size="icon" className="w-8 h-8 md:ml-3" onClick={() => removeAttribute(idx)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                    );
                })}
                <Button variant="outline" size="sm" onClick={addAttribute}>+ Add attribute</Button>
            </div>
        </motion.div>
    );
};

export default WorldCharacterItem;
