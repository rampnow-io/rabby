"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

interface SidebarSettings {
  disabled: boolean
  isHoverOpen: boolean
}

interface SidebarStore {
  isOpen: boolean
  isHover: boolean
  settings: SidebarSettings
  _hasHydrated: boolean
  toggleOpen: () => void
  setIsOpen: (isOpen: boolean) => void
  setIsHover: (isHover: boolean) => void
  getOpenState: () => boolean
  setHasHydrated: (state: boolean) => void
}

const useSidebarStore = create(
  persist<SidebarStore>(
    (set, get) => ({
      isOpen: true,
      isHover: false,
      _hasHydrated: false,
      settings: { disabled: false, isHoverOpen: false },
      toggleOpen: () => {
        set({ isOpen: !get().isOpen })
      },
      setIsOpen: (isOpen) => {
        set({ isOpen })
      },
      setIsHover: (isHover) => {
        set({ isHover })
      },
      getOpenState: () => {
        const state = get()
        return state.isOpen || (state.settings.isHoverOpen && state.isHover)
      },
      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },
    }),
    {
      name: "sidebar",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

export default useSidebarStore
