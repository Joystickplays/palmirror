import { CharacterData } from '@/types/CharacterData';
import { create } from 'zustand';

interface SidebarState {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    showSetupCharacter: boolean;
    setShowSetupCharacter: (open: boolean, character?: CharacterData) => void;
}

const getInitialState = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > 640;
};

export const useSidebarStore = create<SidebarState>((set) => ({
    isOpen: getInitialState(),
    setOpen: (open: boolean) => set({ isOpen: open }),
    showSetupCharacter: false,
    setShowSetupCharacter: (open: boolean, character?: CharacterData) => {
        if (character) {
            localStorage.setItem('characterData', JSON.stringify(character));
        }
        set({ showSetupCharacter: open })
    }
}));
