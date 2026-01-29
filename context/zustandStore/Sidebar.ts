import { create } from 'zustand';

interface SidebarState {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    showSetupCharacter: boolean;
    setShowSetupCharacter: (open: boolean) => void;
}

const getInitialState = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > 640;
};

export const useSidebarStore = create<SidebarState>((set) => ({
    isOpen: getInitialState(),
    setOpen: (open: boolean) => set({ isOpen: open }),
    showSetupCharacter: false,
    setShowSetupCharacter: (open: boolean) => set({ showSetupCharacter: open })
}));
