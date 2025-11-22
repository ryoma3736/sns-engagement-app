'use client';

/**
 * スコアダッシュボードページ
 * プラットフォーム好感度スコアの総合表示
 *
 * 核心戦略:
 * 「主宰者（プラットフォーム）にとっていい人」度合いを可視化
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Platform } from '../../types/index';
import {
  calculatePlatformScore,
  generateSampleBehaviorData,
  getScoreRank,
  ScoreCalculationResult,
  ScoreHistoryEntry,
} from '../../services/scoreCalculator';
import ScoreGauge, { MiniScoreGauge, ScoreBar } from '../../components/ScoreGauge';
import ScoreRadar from '../../components/ScoreRadar';
import ActionRecommend from '../../components/ActionRecommend';

/**
 * プラットフォーム選択タブ
 */
interface PlatformTabProps {
  platforms: Platform[];
  selected: Platform;
  onSelect: (platform: Platform) => void;
}

function PlatformTabs({ platforms, selected, onSelect }: PlatformTabProps) {
  const platformLabels: Record<Platform, { label: string; icon: string }> = {
    threads: { label: 'Threads', icon: 'T' },
    instagram: { label: 'Instagram', icon: 'IG' },
    twitter: { label: 'X (Twitter)', icon: 'X' },
  };

  return (
    <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
      {platforms.map((platform) => (
        <button
          key={platform}
          onClick={() => onSelect(platform)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            selected === platform
              ? 'bg-white/20 text-white'
              : 'text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          <span className="w-6 h-6 flex items-center justify-center bg-white/20 rounded text-xs font-bold">
            {platformLabels[platform].icon}
          </span>
          <span>{platformLabels[platform].label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * スコア推移グラフ用のカスタムツールチップ
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-white/60 text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-white/70">{entry.name}:</span>
            <span className="text-white font-medium">{Math.round(entry.value)}点</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

/**
 * スコア推移グラフ
 */
interface ScoreHistoryChartProps {
  history: ScoreHistoryEntry[];
}

function ScoreHistoryChart({ history }: ScoreHistoryChartProps) {
  const chartData = history.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    }),
    総合: Math.round(entry.overallScore),
    エンゲージメント: Math.round(entry.engagementScore),
    一貫性: Math.round(entry.consistencyScore),
    トレンド: Math.round(entry.trendScore),
    コミュニティ: Math.round(entry.communityScore),
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '10px',
            }}
            formatter={(value) => (
              <span className="text-white/70 text-sm">{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="総合"
            stroke="#00FF88"
            strokeWidth={3}
            dot={{ fill: '#00FF88', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#00FF88' }}
          />
          <Line
            type="monotone"
            dataKey="エンゲージメント"
            stroke="#FF6B6B"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="一貫性"
            stroke="#FFD700"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="トレンド"
            stroke="#00BFFF"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="コミュニティ"
            stroke="#8B5CF6"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * スコア要素の詳細カード
 */
interface ScoreDetailCardProps {
  label: string;
  score: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}

function ScoreDetailCard({ label, score, description, icon, color }: ScoreDetailCardProps) {
  const { rank } = getScoreRank(score);

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
          <span className="text-white font-medium">{label}</span>
        </div>
        <span
          className="text-xl font-bold"
          style={{ color }}
        >
          {score}
        </span>
      </div>
      <p className="text-white/50 text-sm">{description}</p>
      <div className="mt-3">
        <ScoreBar score={score} label="" maxScore={100} />
      </div>
    </div>
  );
}

/**
 * メインのスコアダッシュボードページ
 */
export default function ScorePage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('threads');
  const [scoreResult, setScoreResult] = useState<ScoreCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // サンプルデータでスコアを計算
  useEffect(() => {
    setIsLoading(true);

    // シミュレーション: データ取得とスコア計算
    const timer = setTimeout(() => {
      const behaviorData = generateSampleBehaviorData();
      const result = calculatePlatformScore(selectedPlatform, behaviorData);
      setScoreResult(result);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedPlatform]);

  // スコアランク情報
  const rankInfo = useMemo(() => {
    if (!scoreResult) return null;
    return getScoreRank(scoreResult.score.overallScore);
  }, [scoreResult]);

  if (isLoading || !scoreResult) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-white/70">スコアを計算中...</p>
        </div>
      </div>
    );
  }

  const { score, recommendations, history } = scoreResult;

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            プラットフォーム好感度スコア
          </h1>
          <p className="text-white/50 mt-1">
            「主宰者に好かれる人」度合いを数値化
          </p>
        </div>
        <PlatformTabs
          platforms={['threads', 'instagram', 'twitter']}
          selected={selectedPlatform}
          onSelect={setSelectedPlatform}
        />
      </div>

      {/* メインスコアエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 総合スコア */}
        <div className="lg:col-span-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 text-center">
            総合スコア
          </h2>
          <ScoreGauge
            score={score.overallScore}
            size="lg"
            showRank={true}
            animated={true}
          />
          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              更新: {new Date(score.calculatedAt).toLocaleString('ja-JP')}
            </p>
          </div>
        </div>

        {/* レーダーチャート */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            スコア内訳
          </h2>
          <ScoreRadar score={score} height={320} />
        </div>
      </div>

      {/* スコア要素詳細 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreDetailCard
          label="エンゲージメント"
          score={score.engagementScore}
          description="他者への積極的な反応。「盛り上げようとしてくれる人」度"
          color="#FF6B6B"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />
        <ScoreDetailCard
          label="一貫性"
          score={score.consistencyScore}
          description="投稿頻度の安定性。定期的に活動するユーザーを優遇"
          color="#FFD700"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <ScoreDetailCard
          label="トレンド"
          score={score.trendScore}
          description="トレンドへの参加度。「今を盛り上げる人」"
          color="#00BFFF"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <ScoreDetailCard
          label="コミュニティ"
          score={score.communityScore}
          description="コミュニティへの貢献。「他の人に紹介したい人」度"
          color="#8B5CF6"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* スコア推移グラフ */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          スコア推移
        </h2>
        <ScoreHistoryChart history={history} />
      </div>

      {/* アクション推奨 */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <ActionRecommend recommendations={recommendations} maxItems={5} />
      </div>

      {/* 飲み会の例え解説 */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/10 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <span className="text-3xl">Note</span>
          <div>
            <h3 className="text-white font-semibold text-lg mb-2">
              なぜこのスコアが重要なのか？
            </h3>
            <div className="text-white/70 space-y-2">
              <p>
                飲み会で例えれば、<strong className="text-white">主宰者（プラットフォーム）にとっていい人</strong>だったら
                他の人に紹介したくなりますよね。
              </p>
              <p>
                「あ、この人は<strong className="text-white">盛り上げようとしてくれる</strong>」...
                そう主宰者が判断すれば、自然と露出が増えます。
              </p>
              <p>
                ポイントは2つ:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>「みんなのために盛り上げようとしてますよ」というスタンス</li>
                <li>「あなたはこれが聞きたいんですね」に応えるコンテンツ</li>
              </ul>
              <p className="mt-2 text-white/50 text-sm">
                このスコアは、あなたがどれだけプラットフォームに「いい人」として認識されているかを表しています。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
