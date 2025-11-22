/**
 * スコア計算サービス
 * プラットフォーム好感度スコアの計算ロジック
 *
 * 核心戦略:
 * 「主宰者（プラットフォーム）にとっていい人」を数値化
 * - 盛り上げようとしている行動を可視化
 * - 「みんなのために盛り上げようとしてますよ」を測定
 * - 「あなたはこれが聞きたいんですね」への貢献度
 */

import {
  Platform,
  PlatformScore,
  ScoreFactor,
} from '../types/index';

/**
 * ユーザー行動データ
 */
export interface UserBehaviorData {
  // エンゲージメント関連
  likesGiven: number;          // 他者への「いいね」数
  commentsGiven: number;       // 他者へのコメント数
  sharesGiven: number;         // シェア/リポスト数
  repliesReceived: number;     // 受け取った返信数

  // 投稿関連
  postsThisWeek: number;       // 今週の投稿数
  postsLastWeek: number;       // 先週の投稿数
  averagePostsPerWeek: number; // 週平均投稿数
  postTimings: number[];       // 投稿時間帯 (0-23)

  // トレンド関連
  trendingHashtagsUsed: number;    // 使用したトレンドハッシュタグ数
  trendingTopicsEngaged: number;   // 参加したトレンドトピック数
  earlyTrendEngagement: number;    // トレンド初期参加回数

  // コミュニティ関連
  followersGained: number;         // 獲得フォロワー数
  mentionsReceived: number;        // メンション受信数
  savedByOthers: number;           // 他者に保存された数
  profileVisits: number;           // プロフィール訪問数
}

/**
 * スコア改善レコメンデーション
 */
export interface ScoreRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'engagement' | 'consistency' | 'trend' | 'community';
  title: string;
  description: string;
  expectedImpact: number;  // 予想スコア上昇 (0-10)
  actionItems: string[];
}

/**
 * スコア履歴エントリ
 */
export interface ScoreHistoryEntry {
  date: Date;
  overallScore: number;
  engagementScore: number;
  consistencyScore: number;
  trendScore: number;
  communityScore: number;
}

/**
 * スコア計算結果
 */
export interface ScoreCalculationResult {
  score: PlatformScore;
  recommendations: ScoreRecommendation[];
  history: ScoreHistoryEntry[];
}

/**
 * エンゲージメントスコアを計算
 * 「盛り上げようとしてくれる人」度合いを測定
 */
function calculateEngagementScore(data: UserBehaviorData): {
  score: number;
  factors: ScoreFactor[];
} {
  const factors: ScoreFactor[] = [];
  let totalScore = 0;

  // いいねの与え方 (最大25点)
  // プラットフォームは「他者に積極的にエンゲージするユーザー」を好む
  const likeScore = Math.min(25, (data.likesGiven / 50) * 25);
  factors.push({
    name: '積極的ないいね',
    impact: likeScore >= 15 ? 'positive' : likeScore >= 5 ? 'neutral' : 'negative',
    weight: 0.25,
    description: `${data.likesGiven}件のいいねで場を盛り上げています`,
  });
  totalScore += likeScore;

  // コメント活動 (最大30点)
  // コメントは「会話を生む」ためプラットフォームが最も重視
  const commentScore = Math.min(30, (data.commentsGiven / 20) * 30);
  factors.push({
    name: 'コメント貢献',
    impact: commentScore >= 20 ? 'positive' : commentScore >= 10 ? 'neutral' : 'negative',
    weight: 0.30,
    description: `${data.commentsGiven}件のコメントで会話を活性化`,
  });
  totalScore += commentScore;

  // シェア活動 (最大20点)
  const shareScore = Math.min(20, (data.sharesGiven / 10) * 20);
  factors.push({
    name: 'コンテンツ拡散',
    impact: shareScore >= 12 ? 'positive' : shareScore >= 5 ? 'neutral' : 'negative',
    weight: 0.20,
    description: `${data.sharesGiven}回のシェアでコンテンツを広めています`,
  });
  totalScore += shareScore;

  // 返信率 (最大25点)
  // 「あなたはこれが聞きたいんですね」への応答力
  const replyRatio = data.repliesReceived > 0
    ? Math.min(1, data.commentsGiven / data.repliesReceived)
    : 0.5;
  const replyScore = replyRatio * 25;
  factors.push({
    name: '返信対応力',
    impact: replyScore >= 15 ? 'positive' : replyScore >= 8 ? 'neutral' : 'negative',
    weight: 0.25,
    description: '受け取ったコメントへの応答度',
  });
  totalScore += replyScore;

  return { score: Math.round(totalScore), factors };
}

/**
 * 一貫性スコアを計算
 * プラットフォームは「定期的に活動するユーザー」を優遇
 */
function calculateConsistencyScore(data: UserBehaviorData): {
  score: number;
  factors: ScoreFactor[];
} {
  const factors: ScoreFactor[] = [];
  let totalScore = 0;

  // 投稿頻度の安定性 (最大40点)
  const frequencyVariance = data.postsLastWeek > 0
    ? Math.abs(data.postsThisWeek - data.postsLastWeek) / data.postsLastWeek
    : 1;
  const stabilityScore = Math.max(0, 40 - (frequencyVariance * 40));
  factors.push({
    name: '投稿頻度の安定性',
    impact: stabilityScore >= 30 ? 'positive' : stabilityScore >= 15 ? 'neutral' : 'negative',
    weight: 0.40,
    description: '週ごとの投稿数の安定度',
  });
  totalScore += stabilityScore;

  // 適切な投稿頻度 (最大30点)
  // 週3-7投稿が理想的
  const idealPostsPerWeek = 5;
  const frequencyDiff = Math.abs(data.postsThisWeek - idealPostsPerWeek);
  const frequencyScore = Math.max(0, 30 - (frequencyDiff * 5));
  factors.push({
    name: '投稿頻度',
    impact: frequencyScore >= 20 ? 'positive' : frequencyScore >= 10 ? 'neutral' : 'negative',
    weight: 0.30,
    description: `今週${data.postsThisWeek}件投稿（理想: ${idealPostsPerWeek}件/週）`,
  });
  totalScore += frequencyScore;

  // 投稿時間帯の最適化 (最大30点)
  // ゴールデンタイム: 7-9, 12-13, 19-22
  const goldenHours = [7, 8, 9, 12, 13, 19, 20, 21, 22];
  const goldenHourPosts = data.postTimings.filter(h => goldenHours.includes(h)).length;
  const timingRatio = data.postTimings.length > 0
    ? goldenHourPosts / data.postTimings.length
    : 0;
  const timingScore = timingRatio * 30;
  factors.push({
    name: '投稿時間の最適化',
    impact: timingScore >= 20 ? 'positive' : timingScore >= 10 ? 'neutral' : 'negative',
    weight: 0.30,
    description: 'ゴールデンタイムへの投稿割合',
  });
  totalScore += timingScore;

  return { score: Math.round(totalScore), factors };
}

/**
 * トレンドスコアを計算
 * 「今盛り上がっている話題に参加」= プラットフォームを盛り上げる人
 */
function calculateTrendScore(data: UserBehaviorData): {
  score: number;
  factors: ScoreFactor[];
} {
  const factors: ScoreFactor[] = [];
  let totalScore = 0;

  // トレンドハッシュタグの活用 (最大35点)
  const hashtagScore = Math.min(35, (data.trendingHashtagsUsed / 5) * 35);
  factors.push({
    name: 'トレンドタグ活用',
    impact: hashtagScore >= 25 ? 'positive' : hashtagScore >= 10 ? 'neutral' : 'negative',
    weight: 0.35,
    description: `${data.trendingHashtagsUsed}件のトレンドタグを活用`,
  });
  totalScore += hashtagScore;

  // トレンドトピックへの参加 (最大35点)
  const topicScore = Math.min(35, (data.trendingTopicsEngaged / 3) * 35);
  factors.push({
    name: 'トレンド参加',
    impact: topicScore >= 25 ? 'positive' : topicScore >= 10 ? 'neutral' : 'negative',
    weight: 0.35,
    description: `${data.trendingTopicsEngaged}件のトレンドトピックに参加`,
  });
  totalScore += topicScore;

  // 早期トレンド参加 (最大30点)
  // 「トレンドを作る側」になるとプラットフォームに超好まれる
  const earlyScore = Math.min(30, (data.earlyTrendEngagement / 2) * 30);
  factors.push({
    name: '早期トレンド参加',
    impact: earlyScore >= 20 ? 'positive' : earlyScore >= 10 ? 'neutral' : 'negative',
    weight: 0.30,
    description: 'トレンド初期段階での参加回数',
  });
  totalScore += earlyScore;

  return { score: Math.round(totalScore), factors };
}

/**
 * コミュニティスコアを計算
 * 「他の人に紹介したくなる人」度合い
 */
function calculateCommunityScore(data: UserBehaviorData): {
  score: number;
  factors: ScoreFactor[];
} {
  const factors: ScoreFactor[] = [];
  let totalScore = 0;

  // フォロワー獲得力 (最大30点)
  const followerScore = Math.min(30, (data.followersGained / 10) * 30);
  factors.push({
    name: 'フォロワー獲得',
    impact: followerScore >= 20 ? 'positive' : followerScore >= 10 ? 'neutral' : 'negative',
    weight: 0.30,
    description: `今週${data.followersGained}人の新規フォロワーを獲得`,
  });
  totalScore += followerScore;

  // メンション受信 (最大25点)
  // 「他の人に言及される」= コミュニティでの存在感
  const mentionScore = Math.min(25, (data.mentionsReceived / 5) * 25);
  factors.push({
    name: 'メンション受信',
    impact: mentionScore >= 15 ? 'positive' : mentionScore >= 8 ? 'neutral' : 'negative',
    weight: 0.25,
    description: `${data.mentionsReceived}回言及されました`,
  });
  totalScore += mentionScore;

  // 保存数 (最大25点)
  // 「また見たい」と思われるコンテンツ = 価値提供
  const savedScore = Math.min(25, (data.savedByOthers / 10) * 25);
  factors.push({
    name: 'コンテンツ保存',
    impact: savedScore >= 15 ? 'positive' : savedScore >= 8 ? 'neutral' : 'negative',
    weight: 0.25,
    description: `${data.savedByOthers}回保存されました`,
  });
  totalScore += savedScore;

  // プロフィール訪問 (最大20点)
  const profileScore = Math.min(20, (data.profileVisits / 50) * 20);
  factors.push({
    name: 'プロフィール訪問',
    impact: profileScore >= 12 ? 'positive' : profileScore >= 5 ? 'neutral' : 'negative',
    weight: 0.20,
    description: `${data.profileVisits}回プロフィールが閲覧されました`,
  });
  totalScore += profileScore;

  return { score: Math.round(totalScore), factors };
}

/**
 * 総合スコアを計算
 */
export function calculateOverallScore(
  engagementScore: number,
  consistencyScore: number,
  trendScore: number,
  communityScore: number
): number {
  // 重み付け: エンゲージメント最重視（プラットフォームを盛り上げる人）
  const weights = {
    engagement: 0.35,
    consistency: 0.25,
    trend: 0.20,
    community: 0.20,
  };

  return Math.round(
    engagementScore * weights.engagement +
    consistencyScore * weights.consistency +
    trendScore * weights.trend +
    communityScore * weights.community
  );
}

/**
 * 改善レコメンデーションを生成
 */
function generateRecommendations(
  data: UserBehaviorData,
  engagementScore: number,
  consistencyScore: number,
  trendScore: number,
  communityScore: number
): ScoreRecommendation[] {
  const recommendations: ScoreRecommendation[] = [];

  // エンゲージメント改善
  if (engagementScore < 70) {
    if (data.commentsGiven < 10) {
      recommendations.push({
        id: 'eng-1',
        priority: 'high',
        category: 'engagement',
        title: '積極的にコメントしよう',
        description: 'コメントはプラットフォームが最も評価する行動。飲み会で言えば「話を聞いて反応する人」。主宰者（プラットフォーム）に好まれます。',
        expectedImpact: 8,
        actionItems: [
          '毎日3件以上、他の投稿にコメントする',
          'トレンド投稿への早いコメントは特に効果的',
          '質問形式のコメントで会話を生む',
        ],
      });
    }
    if (data.likesGiven < 30) {
      recommendations.push({
        id: 'eng-2',
        priority: 'medium',
        category: 'engagement',
        title: 'いいねで場を盛り上げる',
        description: '「盛り上げようとしてくれる人」とプラットフォームに認識されます。',
        expectedImpact: 5,
        actionItems: [
          '毎日10件以上いいねする',
          'フォローしている人の投稿を優先',
          '自分の投稿後30分は他の投稿にも反応',
        ],
      });
    }
  }

  // 一貫性改善
  if (consistencyScore < 70) {
    if (data.postsThisWeek < 3) {
      recommendations.push({
        id: 'con-1',
        priority: 'high',
        category: 'consistency',
        title: '投稿頻度を上げよう',
        description: 'プラットフォームは定期的に活動するユーザーを優遇します。週3-5投稿を目指しましょう。',
        expectedImpact: 7,
        actionItems: [
          '週3回以上の投稿を習慣化',
          '投稿カレンダーを作成する',
          '下書きをストックしておく',
        ],
      });
    }

    const goldenHours = [7, 8, 9, 12, 13, 19, 20, 21, 22];
    const goldenHourPosts = data.postTimings.filter(h => goldenHours.includes(h)).length;
    if (goldenHourPosts < data.postTimings.length * 0.5) {
      recommendations.push({
        id: 'con-2',
        priority: 'medium',
        category: 'consistency',
        title: '投稿時間を最適化',
        description: 'ゴールデンタイム（7-9時、12-13時、19-22時）に投稿すると露出が増えます。',
        expectedImpact: 5,
        actionItems: [
          '朝の通勤時間帯(7-9時)に投稿',
          '昼休み(12-13時)に投稿',
          '夜のリラックスタイム(19-22時)に投稿',
        ],
      });
    }
  }

  // トレンド改善
  if (trendScore < 70) {
    if (data.trendingTopicsEngaged < 2) {
      recommendations.push({
        id: 'trend-1',
        priority: 'high',
        category: 'trend',
        title: 'トレンドに乗ろう',
        description: 'トレンドへの参加は「みんなのために盛り上げようとしている」とプラットフォームに認識される最も効果的な方法です。',
        expectedImpact: 9,
        actionItems: [
          '毎日トレンドをチェックする',
          'トレンドタグを1-2個含めて投稿',
          'トレンド初期に参加すると効果倍増',
        ],
      });
    }
  }

  // コミュニティ改善
  if (communityScore < 70) {
    if (data.savedByOthers < 5) {
      recommendations.push({
        id: 'com-1',
        priority: 'medium',
        category: 'community',
        title: '保存したくなるコンテンツを',
        description: '「あなたはこれが聞きたいんですね」に応えるコンテンツは保存されやすく、プラットフォームの評価が上がります。',
        expectedImpact: 6,
        actionItems: [
          'ハウツー・チュートリアル形式の投稿',
          'まとめ・リスト形式の投稿',
          '保存を促すCTAを入れる',
        ],
      });
    }
  }

  // 優先度でソート
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

/**
 * スコア履歴を生成（デモ用）
 */
function generateScoreHistory(
  currentScore: PlatformScore,
  days: number = 7
): ScoreHistoryEntry[] {
  const history: ScoreHistoryEntry[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // 過去のスコアはやや低めに
    const variation = (i / days) * 15;

    history.push({
      date,
      overallScore: Math.max(0, currentScore.overallScore - variation + Math.random() * 5),
      engagementScore: Math.max(0, currentScore.engagementScore - variation + Math.random() * 5),
      consistencyScore: Math.max(0, currentScore.consistencyScore - variation + Math.random() * 5),
      trendScore: Math.max(0, currentScore.trendScore - variation + Math.random() * 5),
      communityScore: Math.max(0, currentScore.communityScore - variation + Math.random() * 5),
    });
  }

  return history;
}

/**
 * メイン: プラットフォームスコアを計算
 */
export function calculatePlatformScore(
  platform: Platform,
  data: UserBehaviorData
): ScoreCalculationResult {
  // 各要素のスコア計算
  const engagementResult = calculateEngagementScore(data);
  const consistencyResult = calculateConsistencyScore(data);
  const trendResult = calculateTrendScore(data);
  const communityResult = calculateCommunityScore(data);

  // 総合スコア計算
  const overallScore = calculateOverallScore(
    engagementResult.score,
    consistencyResult.score,
    trendResult.score,
    communityResult.score
  );

  // 全要因を集約
  const allFactors: ScoreFactor[] = [
    ...engagementResult.factors,
    ...consistencyResult.factors,
    ...trendResult.factors,
    ...communityResult.factors,
  ];

  // スコアオブジェクト作成
  const score: PlatformScore = {
    id: `score-${Date.now()}`,
    platform,
    overallScore,
    engagementScore: engagementResult.score,
    consistencyScore: consistencyResult.score,
    trendScore: trendResult.score,
    communityScore: communityResult.score,
    calculatedAt: new Date(),
    factors: allFactors,
  };

  // レコメンデーション生成
  const recommendations = generateRecommendations(
    data,
    engagementResult.score,
    consistencyResult.score,
    trendResult.score,
    communityResult.score
  );

  // 履歴生成
  const history = generateScoreHistory(score);

  return {
    score,
    recommendations,
    history,
  };
}

/**
 * デモ用: サンプルの行動データを生成
 */
export function generateSampleBehaviorData(): UserBehaviorData {
  return {
    likesGiven: Math.floor(Math.random() * 80) + 20,
    commentsGiven: Math.floor(Math.random() * 25) + 5,
    sharesGiven: Math.floor(Math.random() * 15) + 2,
    repliesReceived: Math.floor(Math.random() * 20) + 5,
    postsThisWeek: Math.floor(Math.random() * 7) + 2,
    postsLastWeek: Math.floor(Math.random() * 7) + 2,
    averagePostsPerWeek: Math.floor(Math.random() * 5) + 3,
    postTimings: [7, 8, 12, 19, 20, 21].slice(0, Math.floor(Math.random() * 4) + 2),
    trendingHashtagsUsed: Math.floor(Math.random() * 8) + 1,
    trendingTopicsEngaged: Math.floor(Math.random() * 5) + 1,
    earlyTrendEngagement: Math.floor(Math.random() * 3),
    followersGained: Math.floor(Math.random() * 15) + 2,
    mentionsReceived: Math.floor(Math.random() * 8) + 1,
    savedByOthers: Math.floor(Math.random() * 15) + 3,
    profileVisits: Math.floor(Math.random() * 80) + 20,
  };
}

/**
 * スコアのランク判定
 */
export function getScoreRank(score: number): {
  rank: string;
  color: string;
  label: string;
} {
  if (score >= 90) {
    return { rank: 'S', color: '#FFD700', label: 'プラットフォームの寵児' };
  } else if (score >= 80) {
    return { rank: 'A', color: '#00FF88', label: '好かれてます' };
  } else if (score >= 70) {
    return { rank: 'B', color: '#00BFFF', label: '順調' };
  } else if (score >= 50) {
    return { rank: 'C', color: '#FFA500', label: '改善の余地あり' };
  } else {
    return { rank: 'D', color: '#FF4444', label: '要改善' };
  }
}
