import { create } from 'zustand';

interface SidebarState {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
    isOpen: false,
    setOpen: (open: boolean) => set({ isOpen: open }),
}));
