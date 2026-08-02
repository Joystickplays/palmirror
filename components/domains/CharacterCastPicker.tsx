import React from "react";
import { WorldCharacter } from "@/types/EEDomain";
import { cn } from "@/lib/utils";

interface CharacterCastPickerProps {
    characters: Array<WorldCharacter>;
    selected: Array<string>;
    onToggle: (name: string) => void;
}

const CharacterCastPicker = ({ characters, selected, onToggle }: CharacterCastPickerProps) => {
    const toggle = (name: string) => {
        if (name.trim() === "") return;
        onToggle(name);
    };

    return (
        <div className="flex flex-col gap-2">
            <p className="text-xs opacity-60">Which characters should this chapter focus on? (soft suggestion — pick none to leave it open)</p>
            {characters.length === 0 ? (
                <p className="text-xs opacity-40 italic">No characters in this world yet. Add characters in the Characters menu.</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {characters.map((char) => {
                        const active = selected.includes(char.name);
                        return (
                            <button
                                key={char.id}
                                type="button"
                                onClick={() => toggle(char.name)}
                                className={cn(
                                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                                    active
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "border-white/10 opacity-70 hover:opacity-100"
                                )}
                            >
                                {char.image ? (
                                    <img src={char.image} alt={char.name} className="size-5 rounded-full object-cover" />
                                ) : (
                                    <span className="size-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] uppercase">
                                        {char.name.slice(0, 1) || "?"}
                                    </span>
                                )}
                                {char.name || "(unnamed)"}
                                {char.isUser && <span className="text-[9px] uppercase tracking-wider opacity-60">you</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CharacterCastPicker;
