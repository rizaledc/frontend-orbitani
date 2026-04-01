import { create } from 'zustand';

const useThemeStore = create(() => ({
  isDark: false,
  toggleTheme: () => {},
  initializeTheme: () => {
    document.documentElement.classList.remove('dark');
  },
}));

export default useThemeStore;
