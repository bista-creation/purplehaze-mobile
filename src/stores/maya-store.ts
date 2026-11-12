import { create } from 'zustand';

interface MayaState {
  isOpen: boolean;
  isModalOpen: boolean;
  openMaya: () => void;
  closeMaya: () => void;
  toggleMaya: () => void;
  setModalOpen: (open: boolean) => void;
}

export const useMayaStore = create<MayaState>((set) => ({
  isOpen: false,
  isModalOpen: false,
  openMaya: () => set({ isOpen: true }),
  closeMaya: () => set({ isOpen: false }),
  toggleMaya: () => set((state) => ({ isOpen: !state.isOpen })),
  setModalOpen: (open: boolean) => set({ isModalOpen: open, ...(open ? { isOpen: false } : {}) }),
}));

