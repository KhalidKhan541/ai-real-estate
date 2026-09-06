import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type ToastType = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

export interface UIState {
  toasts: Toast[];
  modals: ModalState[];
  sidebar: SidebarState;
  loading: LoadingState;
  breadcrumbs: Breadcrumb[];
  commandPalette: boolean;
  searchOpen: boolean;
  notificationsPanel: boolean;
  chatOpen: boolean;
  tourMode: boolean;
  fullscreen: boolean;
  reducedMotion: boolean;
}

export interface ModalState {
  id: string;
  isOpen: boolean;
  data?: unknown;
  onClose?: () => void;
}

export interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  activeItem: string | null;
}

export interface LoadingState {
  global: boolean;
  page: string | null;
  components: Set<string>;
}

export interface Breadcrumb {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

export interface UIActions {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  openModal: (id: string, data?: unknown) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  getModalData: <T = unknown>(id: string) => T | undefined;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarActiveItem: (item: string | null) => void;
  setGlobalLoading: (loading: boolean) => void;
  setPageLoading: (page: string | null) => void;
  setComponentLoading: (component: string, loading: boolean) => void;
  isComponentLoading: (component: string) => boolean;
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
  addBreadcrumb: (breadcrumb: Breadcrumb) => void;
  toggleCommandPalette: () => void;
  setCommandPalette: (open: boolean) => void;
  toggleSearchOpen: () => void;
  setSearchOpen: (open: boolean) => void;
  toggleNotificationsPanel: () => void;
  setNotificationsPanel: (open: boolean) => void;
  toggleChatOpen: () => void;
  setChatOpen: (open: boolean) => void;
  setTourMode: (enabled: boolean) => void;
  toggleFullscreen: () => void;
  setReducedMotion: (reduced: boolean) => void;
}

const initialState: UIState = {
  toasts: [],
  modals: [],
  sidebar: {
    isOpen: true,
    isCollapsed: false,
    activeItem: null,
  },
  loading: {
    global: false,
    page: null,
    components: new Set(),
  },
  breadcrumbs: [],
  commandPalette: false,
  searchOpen: false,
  notificationsPanel: false,
  chatOpen: false,
  tourMode: false,
  fullscreen: false,
  reducedMotion: false,
};

export const useUIStore = create<UIState & UIActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      addToast: (toast) =>
        set((state) => {
          const newToast: Toast = {
            ...toast,
            id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            dismissible: toast.dismissible ?? true,
            duration: toast.duration ?? 5000,
          };
          state.toasts.push(newToast);

          if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
              get().removeToast(newToast.id);
            }, newToast.duration);
          }
        }),

      removeToast: (id) =>
        set((state) => {
          state.toasts = state.toasts.filter((t) => t.id !== id);
        }),

      clearToasts: () =>
        set((state) => {
          state.toasts = [];
        }),

      openModal: (id, data) =>
        set((state) => {
          const existing = state.modals.find((m) => m.id === id);
          if (existing) {
            existing.isOpen = true;
            existing.data = data;
          } else {
            state.modals.push({ id, isOpen: true, data });
          }
        }),

      closeModal: (id) =>
        set((state) => {
          const modal = state.modals.find((m) => m.id === id);
          if (modal) {
            modal.isOpen = false;
            modal.onClose?.();
          }
        }),

      closeAllModals: () =>
        set((state) => {
          state.modals.forEach((modal) => {
            if (modal.isOpen) {
              modal.onClose?.();
            }
            modal.isOpen = false;
          });
        }),

      getModalData: (id) => {
        const modal = get().modals.find((m) => m.id === id);
        return modal?.data;
      },

      toggleSidebar: () =>
        set((state) => {
          state.sidebar.isOpen = !state.sidebar.isOpen;
        }),

      setSidebarOpen: (open) =>
        set((state) => {
          state.sidebar.isOpen = open;
        }),

      toggleSidebarCollapsed: () =>
        set((state) => {
          state.sidebar.isCollapsed = !state.sidebar.isCollapsed;
        }),

      setSidebarActiveItem: (item) =>
        set((state) => {
          state.sidebar.activeItem = item;
        }),

      setGlobalLoading: (loading) =>
        set((state) => {
          state.loading.global = loading;
        }),

      setPageLoading: (page) =>
        set((state) => {
          state.loading.page = page;
        }),

      setComponentLoading: (component, loading) =>
        set((state) => {
          if (loading) {
            state.loading.components.add(component);
          } else {
            state.loading.components.delete(component);
          }
        }),

      isComponentLoading: (component) => {
        return get().loading.components.has(component);
      },

      setBreadcrumbs: (breadcrumbs) =>
        set((state) => {
          state.breadcrumbs = breadcrumbs;
        }),

      addBreadcrumb: (breadcrumb) =>
        set((state) => {
          state.breadcrumbs.push(breadcrumb);
        }),

      toggleCommandPalette: () =>
        set((state) => {
          state.commandPalette = !state.commandPalette;
        }),

      setCommandPalette: (open) =>
        set((state) => {
          state.commandPalette = open;
        }),

      toggleSearchOpen: () =>
        set((state) => {
          state.searchOpen = !state.searchOpen;
        }),

      setSearchOpen: (open) =>
        set((state) => {
          state.searchOpen = open;
        }),

      toggleNotificationsPanel: () =>
        set((state) => {
          state.notificationsPanel = !state.notificationsPanel;
        }),

      setNotificationsPanel: (open) =>
        set((state) => {
          state.notificationsPanel = open;
        }),

      toggleChatOpen: () =>
        set((state) => {
          state.chatOpen = !state.chatOpen;
        }),

      setChatOpen: (open) =>
        set((state) => {
          state.chatOpen = open;
        }),

      setTourMode: (enabled) =>
        set((state) => {
          state.tourMode = enabled;
        }),

      toggleFullscreen: () =>
        set((state) => {
          state.fullscreen = !state.fullscreen;
        }),

      setReducedMotion: (reduced) =>
        set((state) => {
          state.reducedMotion = reduced;
        }),
    })),
    {
      name: "are-ui-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebar: {
          isOpen: state.sidebar.isOpen,
          isCollapsed: state.sidebar.isCollapsed,
        },
        reducedMotion: state.reducedMotion,
      }),
    }
  )
);

export default useUIStore;
