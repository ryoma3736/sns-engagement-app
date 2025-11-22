'use client';

/**
 * Dashboard Page - メインダッシュボード
 *
 * SNSエンゲージメント戦略支援アプリのホーム画面
 *
 * 機能:
 * - 総合統計カード（インプレッション数、エンゲージメント率、好感度スコア）
 * - 今日のモード表示（インプレッション獲得 or 自己表現）
 * - 最近の投稿パフォーマンス
 * - クイックアクション
 * - トレンドトピック表示
 */

import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import QuickActions from '../components/QuickActions';
import { MiniScoreGauge } from '../components/ScoreGauge';
import type { DashboardStats, PostMode } from '../types/index';

// モックデータ（実際のAPIに置き換え可能）
const mockStats: DashboardStats = {
  totalImpressions: 125430,
  totalEngagement: 4.8,
  averageScore: 78,
  postsThisWeek: 12,
  impressionModeRatio: 0.85,
  trendingTopics: [
    '#AIツール',
    '#生産性向上',
    '#副業',
    '#ChatGPT',
    '#マーケティング',
    '#SNS運用',
  ],
  recommendedActions: [
    '今日はインプレッション獲得モードで3投稿を推奨',
    'トレンド「#AIツール」に関連する投稿がバズりやすい傾向',
    '18時〜21時の投稿がエンゲージメント+40%',
  ],
};

// 最近の投稿パフォーマンスモックデータ
interface RecentPost {
  id: string;
  content: string;
  platform: string;
  impressions: number;
  engagement: number;
  mode: PostMode;
  postedAt: Date;
}

const mockRecentPosts: RecentPost[] = [
  {
    id: '1',
    content: 'AIツールを使って作業効率を3倍にした話。最初は懐疑的だったけど...',
    platform: 'threads',
    impressions: 15420,
    engagement: 5.2,
    mode: 'impression',
    postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    content: '正直に言うと、最近SNS運用に疲れてきた。でも続ける理由がある...',
    platform: 'threads',
    impressions: 8230,
    engagement: 7.8,
    mode: 'expression',
    postedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
  {
    id: '3',
    content: '【保存必須】2024年に使うべきマーケティングツール10選',
    platform: 'instagram',
    impressions: 22150,
    engagement: 4.1,
    mode: 'impression',
    postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>(mockRecentPosts);
  const [todayMode, setTodayMode] = useState<PostMode>('impression');
  const [currentTime, setCurrentTime] = useState(new Date());

  // 時刻の更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1分ごとに更新

    return () => clearInterval(timer);
  }, []);

  // 今日のモードを曜日に基づいて決定
  useEffect(() => {
    const dayOfWeek = currentTime.getDay();
    // 日曜（0）と土曜（6）は自己表現モード
    const isExpressionDay = dayOfWeek === 0 || dayOfWeek === 6;
    setTodayMode(isExpressionDay ? 'expression' : 'impression');
  }, [currentTime]);

  // 時間帯に基づく挨拶
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // 相対時間フォーマット
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return '1時間以内';
    if (hours < 24) return `${hours}時間前`;
    const days = Math.floor(hours / 24);
    return `${days}日前`;
  };

  return (
    <div className="space-y-8">
      {/* ヘッダーセクション */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">{getGreeting()}</h1>
          <p className="text-white/60">
            {currentTime.toLocaleDateString('ja-JP', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* 今日のモード表示 */}
        <div
          className={`
            inline-flex items-center gap-3 px-6 py-3 rounded-2xl
            ${
              todayMode === 'impression'
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30'
            }
          `}
        >
          <div
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              ${
                todayMode === 'impression'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                  : 'bg-gradient-to-br from-blue-500 to-cyan-500'
              }
            `}
          >
            {todayMode === 'impression' ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-xs text-white/60">Today's Mode</p>
            <p className="text-sm font-semibold text-white">
              {todayMode === 'impression' ? 'Impression Mode' : 'Expression Mode'}
            </p>
          </div>
        </div>
      </div>

      {/* 統計カードセクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Impressions"
          value={stats.totalImpressions}
          changePercent={12.5}
          gradient="purple"
          subtitle="過去30日間"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />

        <StatCard
          title="Engagement Rate"
          value={stats.totalEngagement}
          unit="%"
          changePercent={8.3}
          gradient="blue"
          subtitle="平均エンゲージメント"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />

        <StatCard
          title="Platform Score"
          value={stats.averageScore}
          changePercent={5.2}
          gradient="green"
          subtitle="好感度スコア"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />

        <StatCard
          title="Posts This Week"
          value={stats.postsThisWeek}
          changePercent={-2.1}
          gradient="pink"
          subtitle="今週の投稿数"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* メインコンテンツグリッド */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側: 最近の投稿パフォーマンス + クイックアクション */}
        <div className="lg:col-span-2 space-y-6">
          {/* クイックアクション */}
          <QuickActions />

          {/* 最近の投稿パフォーマンス */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Recent Posts</h3>
              <span className="text-xs text-white/40">直近のパフォーマンス</span>
            </div>

            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* モードインジケーター */}
                    <div
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        ${
                          post.mode === 'impression'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }
                      `}
                    >
                      {post.mode === 'impression' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </div>

                    {/* 投稿内容 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 line-clamp-2 group-hover:text-white transition-colors">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="px-2 py-0.5 text-xs rounded bg-white/10 text-white/60">
                          {post.platform}
                        </span>
                        <span className="text-xs text-white/40">
                          {formatRelativeTime(post.postedAt)}
                        </span>
                      </div>
                    </div>

                    {/* メトリクス */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">
                          {post.impressions.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/40">Imp</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-400">
                          {post.engagement}%
                        </p>
                        <p className="text-xs text-white/40">Eng</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* もっと見るリンク */}
            <button className="w-full py-3 text-sm text-white/60 hover:text-white transition-colors border-t border-white/10">
              View All Posts
            </button>
          </div>
        </div>

        {/* 右側: サイドバー */}
        <div className="space-y-6">
          {/* 好感度スコアゲージ */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Platform Score</h3>
              <span className="text-xs text-white/40">好感度</span>
            </div>

            <div className="flex justify-center py-4">
              <MiniScoreGauge score={stats.averageScore} label="Overall Score" />
            </div>

            {/* スコア詳細 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-white/50">Engagement</p>
                <p className="text-lg font-semibold text-white">82</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-white/50">Consistency</p>
                <p className="text-lg font-semibold text-white">75</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-white/50">Trend</p>
                <p className="text-lg font-semibold text-white">71</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-white/50">Community</p>
                <p className="text-lg font-semibold text-white">84</p>
              </div>
            </div>
          </div>

          {/* トレンドトピック */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Trending Topics</h3>
              <span className="text-xs text-white/40">今注目</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {stats.trendingTopics.map((topic, index) => (
                <button
                  key={topic}
                  className={`
                    px-3 py-1.5 text-sm rounded-full
                    transition-all duration-300
                    hover:scale-105 active:scale-95
                    ${
                      index === 0
                        ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 border border-purple-500/30'
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                    }
                  `}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* 推奨アクション */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Recommendations</h3>
              <span className="text-xs text-white/40">AI提案</span>
            </div>

            <div className="space-y-3">
              {stats.recommendedActions.map((action, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/5"
                >
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                      ${
                        index === 0
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : index === 1
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-blue-500/20 text-blue-400'
                      }
                    `}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* モード配分 */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Mode Balance</h3>
              <span className="text-xs text-white/40">配分</span>
            </div>

            <div className="space-y-3">
              {/* インプレッションモード */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-300">Impression Mode</span>
                  <span className="text-white">{Math.round(stats.impressionModeRatio * 100)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${stats.impressionModeRatio * 100}%` }}
                  />
                </div>
              </div>

              {/* 自己表現モード */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-300">Expression Mode</span>
                  <span className="text-white">{Math.round((1 - stats.impressionModeRatio) * 100)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    style={{ width: `${(1 - stats.impressionModeRatio) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-white/40 text-center pt-2">
              推奨: 80-90% Impression / 10-20% Expression
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
