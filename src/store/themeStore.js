import { create } from 'zustand';

const applyThemeCss = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    // system
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

const useThemeStore = create((set) => ({
  theme: localStorage.getItem('orbitani_theme_mode') || 'light', // Default Strict White

  setTheme: (newTheme) => {
    set({ theme: newTheme });
    localStorage.setItem('orbitani_theme_mode', newTheme);
    applyThemeCss(newTheme);
  },

  initializeTheme: () => {
    const savedTheme = localStorage.getItem('orbitani_theme_mode') || 'light';
    set({ theme: savedTheme });
    applyThemeCss(savedTheme);
  },
}));

export default useThemeStore;
