'use client';

/**
 * WeeklyScheduler Component
 *
 * 週間スケジュールを管理するカレンダー形式のコンポーネント
 * 自己表現の日を設定し、投稿時間を管理する
 */

import React, { useMemo, useState } from 'react';
import { useStrategy, getDayLabels } from '../hooks/useStrategy';
import { MODE_DESCRIPTIONS } from '../services/strategyManager';
import { Platform } from '../types/index';

interface WeeklySchedulerProps {
  className?: string;
  showPostTimes?: boolean;
}

/**
 * 投稿時間の設定
 */
interface PostTimeSlot {
  hour: number;
  enabled: boolean;
}

export function WeeklyScheduler({
  className = '',
  showPostTimes = true,
}: WeeklySchedulerProps) {
  const strategy = useStrategy((state) => state.strategy);
  const weeklySchedule = useStrategy((state) => state.weeklySchedule);
  const toggleExpressionDay = useStrategy((state) => state.toggleExpressionDay);
  const getOptimalPostTimes = useStrategy((state) => state.getOptimalPostTimes);

  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('threads');
  const [postTimeSlots, setPostTimeSlots] = useState<PostTimeSlot[]>([
    { hour: 7, enabled: true },
    { hour: 12, enabled: true },
    { hour: 19, enabled: true },
    { hour: 21, enabled: false },
  ]);

  const dayLabels = getDayLabels();
  const optimalTimes = useMemo(
    () => getOptimalPostTimes(selectedPlatform),
    [getOptimalPostTimes, selectedPlatform]
  );

  // 今日の曜日
  const today = new Date().getDay();

  const togglePostTime = (hour: number) => {
    setPostTimeSlots((prev) =>
      prev.map((slot) =>
        slot.hour === hour ? { ...slot, enabled: !slot.enabled } : slot
      )
    );
  };

  return (
    <div className={`${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">週間スケジュール</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-white/60">インプレッション獲得</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs text-white/60">自己表現</span>
          </div>
        </div>
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {dayLabels.map((label, index) => {
          const isExpressionDay = strategy.weeklyExpressionDays.includes(index);
          const isToday = index === today;

          return (
            <button
              key={index}
              onClick={() => toggleExpressionDay(index)}
              className={`
                relative p-4 rounded-xl transition-all duration-200
                ${isExpressionDay
                  ? 'bg-purple-500/20 border-2 border-purple-500/50 hover:bg-purple-500/30'
                  : 'bg-emerald-500/10 border-2 border-emerald-500/30 hover:bg-emerald-500/20'
                }
                ${isToday ? 'ring-2 ring-white/30 ring-offset-2 ring-offset-slate-900' : ''}
              `}
            >
              {/* 曜日ラベル */}
              <div className={`
                text-sm font-medium mb-2
                ${isExpressionDay ? 'text-purple-400' : 'text-emerald-400'}
              `}>
                {label}
              </div>

              {/* モードアイコン */}
              <div className="flex justify-center mb-2">
                {isExpressionDay ? (
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )}
              </div>

              {/* モード名 */}
              <div className={`
                text-xs text-center
                ${isExpressionDay ? 'text-purple-300/70' : 'text-emerald-300/70'}
              `}>
                {isExpressionDay ? '表現' : 'IMP'}
              </div>

              {/* 今日マーカー */}
              {isToday && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                  <span className="text-[8px] font-bold text-slate-900">今</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 推奨設定 */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <p className="text-sm text-white/80 mb-2">
              <strong className="text-yellow-400">推奨:</strong> 週末（土日）を自己表現の日として設定
            </p>
            <p className="text-xs text-white/50">
              平日はインプレッション獲得に集中し、週末に好きなことを発信することで、
              バランスの取れた投稿スケジュールを維持できます。
            </p>
          </div>
        </div>
      </div>

      {/* 投稿時間設定 */}
      {showPostTimes && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-white">投稿時間</h4>
            {/* プラットフォーム選択 */}
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as Platform)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10
                text-sm text-white focus:outline-none focus:border-white/30"
            >
              <option value="threads">Threads</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter/X</option>
            </select>
          </div>

          {/* 最適時間グリッド */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {optimalTimes.map((time, index) => {
              const isEnabled = postTimeSlots.find(s => s.hour === time.hour)?.enabled ?? false;
              const engagementPercent = Math.round(time.engagement * 100);

              return (
                <button
                  key={index}
                  onClick={() => togglePostTime(time.hour)}
                  className={`
                    p-3 rounded-xl transition-all duration-200
                    ${isEnabled
                      ? 'bg-emerald-500/20 border-2 border-emerald-500/50'
                      : 'bg-slate-800/50 border-2 border-white/10 hover:border-white/20'
                    }
                  `}
                >
                  <div className="text-xl font-bold text-white mb-1">
                    {time.hour}:00
                  </div>
                  <div className="text-xs text-white/60 mb-2">
                    {time.description}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                        style={{ width: `${engagementPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-emerald-400">{engagementPercent}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 選択された時間のサマリー */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-white/70">選択された投稿時間</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {postTimeSlots.filter(s => s.enabled).length > 0 ? (
                postTimeSlots
                  .filter(s => s.enabled)
                  .map((slot) => (
                    <span
                      key={slot.hour}
                      className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm"
                    >
                      {slot.hour}:00
                    </span>
                  ))
              ) : (
                <span className="text-sm text-white/40">
                  投稿時間が選択されていません
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 現在の設定サマリー */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-700/30 border border-white/10">
        <h4 className="text-sm font-medium text-white mb-3">現在の設定</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-white/50">インプレッション獲得日:</span>
            <span className="ml-2 text-emerald-400">
              {dayLabels.filter((_, i) => !strategy.weeklyExpressionDays.includes(i)).join('、')}
            </span>
          </div>
          <div>
            <span className="text-white/50">自己表現日:</span>
            <span className="ml-2 text-purple-400">
              {strategy.weeklyExpressionDays.length > 0
                ? strategy.weeklyExpressionDays.map(d => dayLabels[d]).join('、')
                : 'なし'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeeklyScheduler;
