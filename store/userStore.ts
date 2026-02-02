import { create } from 'zustand';
import { UserType, DateFilters, DashboardCategory } from '@/lib/types';

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

type CategoryFilter = 'all' | 'screening-cleared' | 'interview-cleared' | 'offered' | 'joined' | DashboardCategory | null;

interface FilterState {
  filters: DateFilters;
  categoryFilter: CategoryFilter;
  setFilters: (filters: DateFilters) => void;
  setCategoryFilter: (category: CategoryFilter) => void;
  resetFilters: () => void;
  resetCategoryFilter: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: {},
  categoryFilter: null,
  setFilters: (filters) => set({ filters }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  resetFilters: () => set({ filters: {}, categoryFilter: null }),
  resetCategoryFilter: () => set({ categoryFilter: null }),
}));
