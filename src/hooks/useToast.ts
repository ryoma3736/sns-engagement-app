/**
 * useToast Hook
 *
 * Zustandを使用したトースト通知の状態管理
 * キュー管理、表示/非表示、自動消去を制御
 */

import { create } from 'zustand';
import { ToastData, ToastType } from '../components/Toast';

/**
 * ユニークIDを生成
 */
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * トーストストアの状態型
 */
interface ToastState {
  // 状態
  toasts: ToastData[];
  maxToasts: number;

  // アクション
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  setMaxToasts: (max: number) => void;

  // ショートカットメソッド
  success: (title: string, message?: string, options?: ToastOptions) => string;
  error: (title: string, message?: string, options?: ToastOptions) => string;
  warning: (title: string, message?: string, options?: ToastOptions) => string;
  info: (title: string, message?: string, options?: ToastOptions) => string;
}

/**
 * トーストオプション
 */
interface ToastOptions {
  duration?: number;
  dismissible?: boolean;
}

/**
 * トースト管理のZustandストア
 */
export const useToast = create<ToastState>((set, get) => ({
  // 初期状態
  toasts: [],
  maxToasts: 5,

  // トーストを追加
  addToast: (toast) => {
    const id = generateId();
    const newToast: ToastData = {
      id,
      ...toast,
      duration: toast.duration ?? 5000,
      dismissible: toast.dismissible ?? true,
    };

    set((state) => {
      // 最大数を超えた場合、古いトーストを削除
      const updatedToasts = [...state.toasts, newToast];
      if (updatedToasts.length > state.maxToasts) {
        return { toasts: updatedToasts.slice(-state.maxToasts) };
      }
      return { toasts: updatedToasts };
    });

    return id;
  },

  // トーストを削除
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  // 全トーストをクリア
  clearAllToasts: () => {
    set({ toasts: [] });
  },

  // 最大表示数を設定
  setMaxToasts: (max) => {
    set({ maxToasts: max });
  },

  // ショートカット: 成功トースト
  success: (title, message, options) => {
    return get().addToast({
      type: 'success',
      title,
      message,
      ...options,
    });
  },

  // ショートカット: エラートースト
  error: (title, message, options) => {
    return get().addToast({
      type: 'error',
      title,
      message,
      duration: options?.duration ?? 8000, // エラーは長めに表示
      ...options,
    });
  },

  // ショートカット: 警告トースト
  warning: (title, message, options) => {
    return get().addToast({
      type: 'warning',
      title,
      message,
      duration: options?.duration ?? 6000,
      ...options,
    });
  },

  // ショートカット: 情報トースト
  info: (title, message, options) => {
    return get().addToast({
      type: 'info',
      title,
      message,
      ...options,
    });
  },
}));

/**
 * トーストコンテナで使用するためのセレクター
 */
export function useToastState() {
  const toasts = useToast((state) => state.toasts);
  const removeToast = useToast((state) => state.removeToast);

  return {
    toasts,
    onDismiss: removeToast,
  };
}

/**
 * トースト通知を表示するためのヘルパー関数（コンポーネント外から使用可能）
 */
export const toast = {
  success: (title: string, message?: string, options?: ToastOptions) =>
    useToast.getState().success(title, message, options),

  error: (title: string, message?: string, options?: ToastOptions) =>
    useToast.getState().error(title, message, options),

  warning: (title: string, message?: string, options?: ToastOptions) =>
    useToast.getState().warning(title, message, options),

  info: (title: string, message?: string, options?: ToastOptions) =>
    useToast.getState().info(title, message, options),

  dismiss: (id: string) =>
    useToast.getState().removeToast(id),

  dismissAll: () =>
    useToast.getState().clearAllToasts(),
};

/**
 * Promise用のトースト（非同期処理の結果を通知）
 */
export async function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
): Promise<T> {
  const loadingId = toast.info(messages.loading, '処理中...', { duration: 0 });

  try {
    const result = await promise;
    toast.dismiss(loadingId);
    const successMessage = typeof messages.success === 'function'
      ? messages.success(result)
      : messages.success;
    toast.success(successMessage);
    return result;
  } catch (error) {
    toast.dismiss(loadingId);
    const errorMessage = typeof messages.error === 'function'
      ? messages.error(error as Error)
      : messages.error;
    toast.error(errorMessage);
    throw error;
  }
}

export default useToast;
