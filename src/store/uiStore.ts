import { create } from 'zustand';
import { ActivityItem, AppState } from '../types';
import { DEFAULT_COLOR_PALETTE } from '../config/constants';

interface UIStore extends AppState {
  // Actions
  setCurrentColor: (color: string) => void;
  addActivityItem: (item: Omit<ActivityItem, 'id'>) => void;
  toggleGrid: () => void;
  toggleColorPicker: () => void;
  clearActivity: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  currentColor: DEFAULT_COLOR_PALETTE[0], // Black
  activity: [],
  showGrid: true,
  isColorPickerOpen: false,
  
  // Actions
  setCurrentColor: (color) => set({ currentColor: color }),
  
  addActivityItem: (item) => set(state => ({
    activity: [
      {
        ...item,
        id: `${item.x}-${item.y}-${Date.now()}` // Create a unique ID
      },
      ...state.activity
    ].slice(0, 50) // Keep only the most recent 50 activities
  })),
  
  toggleGrid: () => set(state => ({ showGrid: !state.showGrid })),
  
  toggleColorPicker: () => set(state => ({ isColorPickerOpen: !state.isColorPickerOpen })),
  
  clearActivity: () => set({ activity: [] })
})); 