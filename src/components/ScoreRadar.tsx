'use client';

/**
 * ScoreRadar - レーダーチャートコンポーネント
 * 4つのスコア要素を視覚的に表示
 */

import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { PlatformScore } from '../types/index';

interface ScoreRadarProps {
  score: PlatformScore;
  showTooltip?: boolean;
  height?: number;
}

/**
 * レーダーチャートのデータ形式
 */
interface RadarDataPoint {
  subject: string;
  value: number;
  fullMark: number;
  description: string;
}

/**
 * カスタムツールチップ
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: RadarDataPoint;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium mb-1">{data.subject}</p>
        <p className="text-2xl font-bold text-white mb-1">{data.value}点</p>
        <p className="text-white/60 text-sm">{data.description}</p>
      </div>
    );
  }
  return null;
}

export default function ScoreRadar({ score, showTooltip = true, height = 350 }: ScoreRadarProps) {
  // レーダーチャート用データの変換
  const radarData: RadarDataPoint[] = [
    {
      subject: 'エンゲージメント',
      value: score.engagementScore,
      fullMark: 100,
      description: '他者への積極的な反応度',
    },
    {
      subject: '一貫性',
      value: score.consistencyScore,
      fullMark: 100,
      description: '投稿頻度の安定性',
    },
    {
      subject: 'トレンド',
      value: score.trendScore,
      fullMark: 100,
      description: 'トレンドへの参加度',
    },
    {
      subject: 'コミュニティ',
      value: score.communityScore,
      fullMark: 100,
      description: 'コミュニティへの貢献度',
    },
  ];

  // スコアに基づく色の取得
  const getScoreGradient = (avgScore: number): { fill: string; stroke: string } => {
    if (avgScore >= 80) {
      return { fill: 'rgba(0, 255, 136, 0.3)', stroke: '#00FF88' };
    } else if (avgScore >= 60) {
      return { fill: 'rgba(0, 191, 255, 0.3)', stroke: '#00BFFF' };
    } else if (avgScore >= 40) {
      return { fill: 'rgba(255, 215, 0, 0.3)', stroke: '#FFD700' };
    } else {
      return { fill: 'rgba(255, 107, 107, 0.3)', stroke: '#FF6B6B' };
    }
  };

  const avgScore = (
    score.engagementScore +
    score.consistencyScore +
    score.trendScore +
    score.communityScore
  ) / 4;

  const colors = getScoreGradient(avgScore);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
          {/* グリッド */}
          <PolarGrid
            stroke="rgba(255, 255, 255, 0.15)"
            strokeDasharray="3 3"
          />

          {/* 軸ラベル */}
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: 'rgba(255, 255, 255, 0.8)',
              fontSize: 13,
              fontWeight: 500,
            }}
            tickLine={false}
          />

          {/* 数値軸 */}
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{
              fill: 'rgba(255, 255, 255, 0.5)',
              fontSize: 11,
            }}
            axisLine={false}
            tickCount={5}
          />

          {/* データ領域 */}
          <Radar
            name="スコア"
            dataKey="value"
            stroke={colors.stroke}
            fill={colors.fill}
            fillOpacity={0.6}
            strokeWidth={2}
            dot={{
              r: 4,
              fill: colors.stroke,
              stroke: '#fff',
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: colors.stroke,
              stroke: '#fff',
              strokeWidth: 2,
            }}
          />

          {/* ツールチップ */}
          {showTooltip && <Tooltip content={<CustomTooltip />} />}

          {/* 凡例 */}
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
            }}
            formatter={() => (
              <span className="text-white/70 text-sm">プラットフォーム好感度</span>
            )}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * スコア比較用レーダーチャート
 * 2つの期間のスコアを比較表示
 */
interface CompareRadarProps {
  currentScore: PlatformScore;
  previousScore: PlatformScore;
  height?: number;
}

export function CompareRadar({ currentScore, previousScore, height = 350 }: CompareRadarProps) {
  const radarData = [
    {
      subject: 'エンゲージメント',
      current: currentScore.engagementScore,
      previous: previousScore.engagementScore,
      fullMark: 100,
    },
    {
      subject: '一貫性',
      current: currentScore.consistencyScore,
      previous: previousScore.consistencyScore,
      fullMark: 100,
    },
    {
      subject: 'トレンド',
      current: currentScore.trendScore,
      previous: previousScore.trendScore,
      fullMark: 100,
    },
    {
      subject: 'コミュニティ',
      current: currentScore.communityScore,
      previous: previousScore.communityScore,
      fullMark: 100,
    },
  ];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="3 3" />

          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: 'rgba(255, 255, 255, 0.8)',
              fontSize: 13,
              fontWeight: 500,
            }}
            tickLine={false}
          />

          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{
              fill: 'rgba(255, 255, 255, 0.5)',
              fontSize: 11,
            }}
            axisLine={false}
            tickCount={5}
          />

          {/* 前回のスコア */}
          <Radar
            name="前回"
            dataKey="previous"
            stroke="rgba(255, 255, 255, 0.5)"
            fill="rgba(255, 255, 255, 0.1)"
            fillOpacity={0.3}
            strokeWidth={1}
            strokeDasharray="5 5"
          />

          {/* 現在のスコア */}
          <Radar
            name="今回"
            dataKey="current"
            stroke="#00FF88"
            fill="rgba(0, 255, 136, 0.3)"
            fillOpacity={0.6}
            strokeWidth={2}
            dot={{
              r: 4,
              fill: '#00FF88',
              stroke: '#fff',
              strokeWidth: 2,
            }}
          />

          <Legend
            wrapperStyle={{
              paddingTop: '20px',
            }}
            formatter={(value) => (
              <span className="text-white/70 text-sm">{value}</span>
            )}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * ミニレーダーチャート - コンパクト表示用
 */
interface MiniRadarProps {
  score: PlatformScore;
  size?: number;
}

export function MiniRadar({ score, size = 150 }: MiniRadarProps) {
  const radarData = [
    { subject: 'E', value: score.engagementScore, fullMark: 100 },
    { subject: 'C', value: score.consistencyScore, fullMark: 100 },
    { subject: 'T', value: score.trendScore, fullMark: 100 },
    { subject: 'M', value: score.communityScore, fullMark: 100 },
  ];

  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: 'rgba(255, 255, 255, 0.6)',
              fontSize: 10,
            }}
            tickLine={false}
          />
          <Radar
            dataKey="value"
            stroke="#00BFFF"
            fill="rgba(0, 191, 255, 0.3)"
            fillOpacity={0.6}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
