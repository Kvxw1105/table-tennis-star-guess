/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Sex = '男' | '女';
export type ActiveStatus = '现役' | '退役' | '半活跃';
export type Hand = '左手' | '右手';
export type Grip = '横拍' | '直拍';
export type Difficulty = '入门' | '进阶' | '大师' | '全知';

export interface Player {
  id: string;
  name: string;
  nameEn?: string;
  aliases: string[]; // for flexible fuzzy search match

  sex: Sex;
  association: string; // "中国", "日本", "法国", "瑞典", "德国", "卢森堡", "韩国", etc.
  birthYear: number;
  activeStatus: ActiveStatus;

  hand: Hand;
  grip: Grip;
  playStyle: string; // e.g., "两面弧圈", "快攻结合弧圈", "削球"
  forehandRubber: string; // "反胶", "正胶", "长胶", "生胶"
  backhandRubber: string; // "反胶", "生胶", "长胶", "正胶"
  bladeBrand: string; // "红双喜", "蝴蝶", "斯帝卡", "挺拔", "VICTAS", "亚萨卡"

  honorGold: number; // 大赛单打金牌数 (奥运会、世乒赛、世界杯三大赛单打冠军总数)
  outCircleLevel: 1 | 2 | 3 | 4 | 5; // 1 = Household names, 5 = Deep circle players
  signature: string; // A short punchy feature/badge
  difficulty: Difficulty;

  // 新数据扩展字段（可选，用于搜索/展示，不参与游戏比较）
  pinyinInitials?: string;
  forehandLevel?: string;
  backhandLevel?: string;
  worldNo1?: boolean | 'unknown';
  rubberProfile?: string;
}

export type FeedbackStatus = 
  | 'CORRECT'      // Exactly match
  | 'WRONG'        // Completely wrong
  | 'PARTIAL'      // Part match (for array or partial matches if any)
  | 'HIGHER'       // Numeric field: target is higher
  | 'LOWER'        // Numeric field: target is lower
  | 'UNKNOWN';     // Values matches unknown

export interface AttributeFeedback {
  status: FeedbackStatus;
  displayValue: string | number;
}

export interface GuessComparison {
  playerName: string;
  isCorrect: boolean;
  feedbacks: {
    sex: AttributeFeedback;
    association: AttributeFeedback;
    birthYear: AttributeFeedback;
    activeStatus: AttributeFeedback;
    hand: AttributeFeedback;
    grip: AttributeFeedback;
    playStyle: AttributeFeedback;
    forehandRubber: AttributeFeedback;
    backhandRubber: AttributeFeedback;
    bladeBrand: AttributeFeedback;
    honorGold: AttributeFeedback;
  };
}

export interface GameState {
  gameMode: 'daily' | 'free' | 'challenge';
  targetPlayer: Player | null;
  guesses: GuessComparison[];
  guessCount: number;
  isWon: boolean;
  isGameOver: boolean;
  isSurrendered: boolean;
  seed: string;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>;
  lastPlayedDate?: string;
  history?: { date: string; guessCount: number; isWon: boolean }[];
}
