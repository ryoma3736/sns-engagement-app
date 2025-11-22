'use client';

/**
 * Toast - トースト通知コンポーネント
 * 成功/エラー/警告/情報の4種類の通知を表示
 * 自動消去とアニメーション対応
 */

import React, { useEffect, useState, useCallback } from 'react';

/**
 * トーストの種類
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * トーストの位置
 */
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

/**
 * トーストデータ
 */
export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ミリ秒、0で自動消去なし
  dismissible?: boolean;
}

/**
 * Toast Props
 */
interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

/**
 * トーストの設定
 */
const toastConfig: Record<ToastType, {
  icon: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
  glowColor: string;
}> = {
  success: {
    icon: 'check_circle',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    iconColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
  error: {
    icon: 'error',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    iconColor: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.3)',
  },
  warning: {
    icon: 'warning',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    iconColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.3)',
  },
  info: {
    icon: 'info',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    iconColor: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.3)',
  },
};

/**
 * アイコンコンポーネント
 */
function ToastIcon({ type }: { type: ToastType }) {
  const config = toastConfig[type];

  const iconPaths: Record<string, JSX.Element> = {
    check_circle: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <span style={{ color: config.iconColor }}>
      {iconPaths[config.icon]}
    </span>
  );
}

/**
 * 単一トーストコンポーネント
 */
export function Toast({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const config = toastConfig[toast.type];

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300); // アニメーション時間
  }, [onDismiss, toast.id]);

  // 入場アニメーション
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // 自動消去
  useEffect(() => {
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      const timer = setTimeout(handleDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, handleDismiss]);

  return (
    <div
      className={`
        relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl
        ${config.bgColor} ${config.borderColor}
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        min-w-[320px] max-w-[420px]
      `}
      style={{
        boxShadow: `0 4px 20px ${config.glowColor}, 0 0 40px ${config.glowColor}`,
      }}
      role="alert"
      aria-live="polite"
    >
      {/* アイコン */}
      <div className="flex-shrink-0 mt-0.5">
        <ToastIcon type={toast.type} />
      </div>

      {/* コンテンツ */}
      <div className="flex-1 min-w-0">
        <h4 className={`font-semibold ${config.textColor}`}>
          {toast.title}
        </h4>
        {toast.message && (
          <p className="mt-1 text-sm text-white/70">
            {toast.message}
          </p>
        )}
      </div>

      {/* 閉じるボタン */}
      {(toast.dismissible ?? true) && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white/50 hover:text-white/80">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}

      {/* プログレスバー */}
      {(toast.duration ?? 5000) > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden bg-white/5">
          <div
            className={`h-full ${config.textColor.replace('text-', 'bg-')}`}
            style={{
              animation: `toast-progress ${toast.duration ?? 5000}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * ToastContainer Props
 */
interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
  position?: ToastPosition;
  maxVisible?: number;
}

/**
 * トーストコンテナコンポーネント
 * 複数のトーストを管理・表示
 */
export function ToastContainer({
  toasts,
  onDismiss,
  position = 'top-right',
  maxVisible = 5,
}: ToastContainerProps) {
  // 位置に応じたスタイル
  const positionStyles: Record<ToastPosition, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const visibleToasts = toasts.slice(0, maxVisible);

  return (
    <>
      {/* グローバルスタイル */}
      <style jsx global>{`
        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>

      {/* コンテナ */}
      <div
        className={`fixed z-50 flex flex-col gap-3 ${positionStyles[position]}`}
        aria-label="通知"
      >
        {visibleToasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
    </>
  );
}

export default Toast;
