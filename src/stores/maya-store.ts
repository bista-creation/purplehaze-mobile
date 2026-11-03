import { create } from 'zustand';

interface MayaState {
  isOpen: boolean;
  openMaya: () => void;
  closeMaya: () => void;
  toggleMaya: () => void;
}

export const useMayaStore = create<MayaState>((set) => ({
  isOpen: false,
  openMaya: () => set({ isOpen: true }),
  closeMaya: () => set({ isOpen: false }),
  toggleMaya: () => set((state) => ({ isOpen: !state.isOpen })),
}));
