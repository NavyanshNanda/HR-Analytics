import { create } from 'zustand';
import { UserType, DateFilters } from '@/lib/types';

interface UserState {
  userType: UserType | null;
  userName: string | null;
  setUserType: (type: UserType | null) => void;
  setUserName: (name: string | null) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userType: null,
  userName: null,
  setUserType: (type) => set({ userType: type }),
  setUserName: (name) => set({ userName: name }),
  reset: () => set({ userType: null, userName: null }),
}));

interface FilterState {
  filters: DateFilters;
  setFilters: (filters: DateFilters) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: {} }),
}));
