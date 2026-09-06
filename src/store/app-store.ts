import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: "user" | "agent" | "admin";
  preferences: UserPreferences;
}

export interface UserPreferences {
  currency: string;
  language: string;
  theme: "light" | "dark" | "system";
  notifications: NotificationPreferences;
  savedSearches: string[];
  favoriteProperties: string[];
  recentProperties: string[];
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  priceAlerts: boolean;
  newListings: boolean;
  offerUpdates: boolean;
  appointmentReminders: boolean;
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  theme: "light" | "dark" | "system";
  locale: string;
  sidebarOpen: boolean;
  modalOpen: string | null;
  notifications: AppNotification[];
  unreadNotifications: number;
}

export interface AppNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface AppActions {
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setLocale: (locale: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  toggleFavorite: (propertyId: string) => void;
  addRecentProperty: (propertyId: string) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

const defaultPreferences: UserPreferences = {
  currency: "USD",
  language: "en",
  theme: "system",
  notifications: {
    email: true,
    push: true,
    sms: false,
    priceAlerts: true,
    newListings: true,
    offerUpdates: true,
    appointmentReminders: true,
  },
  savedSearches: [],
  favoriteProperties: [],
  recentProperties: [],
};

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  theme: "system",
  locale: "en",
  sidebarOpen: false,
  modalOpen: null,
  notifications: [],
  unreadNotifications: 0,
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      setUser: (user) =>
        set((state) => {
          state.user = user;
          state.isAuthenticated = user !== null;
        }),

      login: (user) =>
        set((state) => {
          state.user = user;
          state.isAuthenticated = true;
          state.error = null;
        }),

      logout: () =>
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.notifications = [];
          state.unreadNotifications = 0;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      setTheme: (theme) =>
        set((state) => {
          state.theme = theme;
          if (state.user) {
            state.user.preferences.theme = theme;
          }
        }),

      setLocale: (locale) =>
        set((state) => {
          state.locale = locale;
          if (state.user) {
            state.user.preferences.language = locale;
          }
        }),

      toggleSidebar: () =>
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        }),

      setSidebarOpen: (open) =>
        set((state) => {
          state.sidebarOpen = open;
        }),

      openModal: (modalId) =>
        set((state) => {
          state.modalOpen = modalId;
        }),

      closeModal: () =>
        set((state) => {
          state.modalOpen = null;
        }),

      addNotification: (notification) =>
        set((state) => {
          const newNotification: AppNotification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            read: false,
            createdAt: new Date().toISOString(),
          };
          state.notifications.unshift(newNotification);
          state.unreadNotifications++;
        }),

      markNotificationRead: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (notification && !notification.read) {
            notification.read = true;
            state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
          }
        }),

      markAllNotificationsRead: () =>
        set((state) => {
          state.notifications.forEach((n) => {
            n.read = true;
          });
          state.unreadNotifications = 0;
        }),

      removeNotification: (id) =>
        set((state) => {
          const index = state.notifications.findIndex((n) => n.id === id);
          if (index > -1) {
            const wasUnread = !state.notifications[index].read;
            state.notifications.splice(index, 1);
            if (wasUnread) {
              state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
            }
          }
        }),

      clearNotifications: () =>
        set((state) => {
          state.notifications = [];
          state.unreadNotifications = 0;
        }),

      toggleFavorite: (propertyId) =>
        set((state) => {
          if (!state.user) return;
          const index = state.user.preferences.favoriteProperties.indexOf(propertyId);
          if (index > -1) {
            state.user.preferences.favoriteProperties.splice(index, 1);
          } else {
            state.user.preferences.favoriteProperties.push(propertyId);
          }
        }),

      addRecentProperty: (propertyId) =>
        set((state) => {
          if (!state.user) return;
          const recent = state.user.preferences.recentProperties;
          const existingIndex = recent.indexOf(propertyId);
          if (existingIndex > -1) {
            recent.splice(existingIndex, 1);
          }
          recent.unshift(propertyId);
          if (recent.length > 20) {
            recent.pop();
          }
        }),

      updatePreferences: (preferences) =>
        set((state) => {
          if (state.user) {
            state.user.preferences = {
              ...state.user.preferences,
              ...preferences,
            };
          }
        }),
    })),
    {
      name: "are-app-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAppStore;
