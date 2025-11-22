'use client';

/**
 * AlertBanner - アラートバナーコンポーネント
 * 重要なお知らせ、比率アラート、スコア低下アラートを表示
 */

import React, { useState, useEffect } from 'react';

/**
 * アラートの重要度
 */
export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

/**
 * アラートの種類
 */
export type AlertCategory =
  | 'ratio'           // 比率アラート（9:1から外れた時）
  | 'score'           // スコア低下アラート
  | 'announcement'    // 重要なお知らせ
  | 'action'          // アクション推奨
  | 'system';         // システム通知

/**
 * アラートデータ
 */
export interface AlertData {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  persistent?: boolean; // trueの場合、ローカルストレージに保存しない
  expiresAt?: Date;
}

/**
 * AlertBanner Props
 */
interface AlertBannerProps {
  alert: AlertData;
  onDismiss?: (id: string) => void;
  compact?: boolean;
}

/**
 * アラートの設定
 */
const alertConfig: Record<AlertSeverity, {
  icon: JSX.Element;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
}> = {
  critical: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
    ),
    bgGradient: 'from-red-500/20 to-red-600/10',
    borderColor: 'border-red-500/40',
    textColor: 'text-red-400',
    accentColor: '#EF4444',
  },
  warning: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
    ),
    bgGradient: 'from-amber-500/20 to-amber-600/10',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    accentColor: '#F59E0B',
  },
  info: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
    ),
    bgGradient: 'from-blue-500/20 to-blue-600/10',
    borderColor: 'border-blue-500/40',
    textColor: 'text-blue-400',
    accentColor: '#3B82F6',
  },
  success: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
      </svg>
    ),
    bgGradient: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    accentColor: '#10B981',
  },
};

/**
 * 単一アラートバナーコンポーネント
 */
export function AlertBanner({ alert, onDismiss, compact = false }: AlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const config = alertConfig[alert.severity];

  const handleDismiss = () => {
    if (!alert.dismissible) return;
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.(alert.id);
    }, 300);
  };

  // 期限切れチェック
  useEffect(() => {
    if (alert.expiresAt && new Date() > alert.expiresAt) {
      handleDismiss();
    }
  }, [alert.expiresAt]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border backdrop-blur-xl
        bg-gradient-to-r ${config.bgGradient} ${config.borderColor}
        transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        ${compact ? 'p-3' : 'p-4'}
      `}
      style={{
        boxShadow: `0 0 30px ${config.accentColor}20`,
      }}
      role="alert"
      aria-live={alert.severity === 'critical' ? 'assertive' : 'polite'}
    >
      {/* アクセントライン */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: config.accentColor }}
      />

      <div className={`flex items-start gap-3 ${compact ? 'ml-2' : 'ml-3'}`}>
        {/* アイコン */}
        <div
          className={`flex-shrink-0 ${config.textColor}`}
          style={{
            filter: `drop-shadow(0 0 8px ${config.accentColor}60)`,
          }}
        >
          {config.icon}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${config.textColor} ${compact ? 'text-sm' : ''}`}>
            {alert.title}
          </h4>
          {!compact && (
            <p className="mt-1 text-sm text-white/70">
              {alert.message}
            </p>
          )}

          {/* アクションボタン */}
          {alert.actionLabel && alert.onAction && !compact && (
            <button
              onClick={alert.onAction}
              className={`
                mt-3 px-4 py-2 rounded-lg text-sm font-medium
                ${config.textColor} border ${config.borderColor}
                hover:bg-white/5 transition-colors
              `}
            >
              {alert.actionLabel}
            </button>
          )}
        </div>

        {/* 閉じるボタン */}
        {(alert.dismissible ?? true) && (
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
      </div>

      {/* パルスアニメーション（critical時） */}
      {alert.severity === 'critical' && (
        <div
          className="absolute inset-0 rounded-xl opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${config.accentColor}40 0%, transparent 70%)`,
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}

/**
 * AlertStack Props
 */
interface AlertStackProps {
  alerts: AlertData[];
  onDismiss?: (id: string) => void;
  maxVisible?: number;
  position?: 'top' | 'inline';
}

/**
 * アラートスタックコンポーネント
 * 複数のアラートを管理・表示
 */
export function AlertStack({
  alerts,
  onDismiss,
  maxVisible = 3,
  position = 'inline',
}: AlertStackProps) {
  // 優先度でソート: critical > warning > info > success
  const priorityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    success: 3,
  };

  const sortedAlerts = [...alerts]
    .sort((a, b) => priorityOrder[a.severity] - priorityOrder[b.severity])
    .slice(0, maxVisible);

  if (sortedAlerts.length === 0) return null;

  const containerClass = position === 'top'
    ? 'fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-40 px-4'
    : 'w-full';

  return (
    <>
      {/* グローバルスタイル */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>

      <div className={`${containerClass} flex flex-col gap-3`}>
        {sortedAlerts.map((alert) => (
          <AlertBanner
            key={alert.id}
            alert={alert}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </>
  );
}

/**
 * 比率アラートコンポーネント
 * 9:1比率から外れた場合に警告を表示
 */
interface RatioAlertProps {
  impressionRatio: number; // 0-1
  onAction?: () => void;
}

export function RatioAlert({ impressionRatio, onAction }: RatioAlertProps) {
  const idealMin = 0.8;
  const idealMax = 0.95;

  // 比率が適正範囲内ならアラートを表示しない
  if (impressionRatio >= idealMin && impressionRatio <= idealMax) {
    return null;
  }

  const isTooLow = impressionRatio < idealMin;
  const severity: AlertSeverity = isTooLow ? 'warning' : 'info';
  const title = isTooLow
    ? '承認欲求モードが多めです'
    : 'インプレッションモードに偏っています';
  const message = isTooLow
    ? `現在の比率: ${Math.round(impressionRatio * 100)}:${Math.round((1 - impressionRatio) * 100)}。推奨は9:1です。自己表現を控えめにすると、プラットフォームに好まれます。`
    : `現在の比率: ${Math.round(impressionRatio * 100)}:${Math.round((1 - impressionRatio) * 100)}。たまには自己表現も大切です。週1回は自分の想いを発信しましょう。`;

  const alert: AlertData = {
    id: 'ratio-alert',
    severity,
    category: 'ratio',
    title,
    message,
    actionLabel: '戦略を調整する',
    onAction,
    dismissible: true,
  };

  return <AlertBanner alert={alert} />;
}

/**
 * スコア低下アラートコンポーネント
 */
interface ScoreAlertProps {
  currentScore: number;
  previousScore: number;
  onAction?: () => void;
}

export function ScoreAlert({ currentScore, previousScore, onAction }: ScoreAlertProps) {
  const scoreDiff = currentScore - previousScore;

  // スコアが上昇または変化なしの場合はアラートを表示しない
  if (scoreDiff >= 0) {
    return null;
  }

  const severity: AlertSeverity = scoreDiff <= -10 ? 'critical' : 'warning';
  const title = scoreDiff <= -10
    ? 'スコアが大幅に低下しています'
    : 'スコアがやや低下しています';
  const message = `スコアが${Math.abs(scoreDiff)}ポイント低下しました（${previousScore} -> ${currentScore}）。エンゲージメント行動を増やすことで改善できます。`;

  const alert: AlertData = {
    id: 'score-alert',
    severity,
    category: 'score',
    title,
    message,
    actionLabel: '改善策を見る',
    onAction,
    dismissible: true,
  };

  return <AlertBanner alert={alert} />;
}

export default AlertBanner;
