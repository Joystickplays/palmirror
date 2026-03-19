import { create } from 'zustand';

interface ChatSettingsScaleEffectState {
    isSettingsOpen: boolean;
    setSettingsOpen: (open: boolean) => void;
}


export const useChatSettingsScaleEffectStore = create<ChatSettingsScaleEffectState>((set) => ({
    isSettingsOpen: false,
    setSettingsOpen: (open: boolean) => set({ isSettingsOpen: open }),
}));
