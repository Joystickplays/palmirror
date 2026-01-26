import { create } from 'zustand';

interface SidebarState {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
}

const getInitialState = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > 640;
};

export const useSidebarStore = create<SidebarState>((set) => ({
    isOpen: getInitialState(),
    setOpen: (open: boolean) => set({ isOpen: open }),
}));
