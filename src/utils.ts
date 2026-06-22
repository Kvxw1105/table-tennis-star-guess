/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player, GuessComparison, AttributeFeedback, FeedbackStatus, Difficulty } from './types.ts';
import { PLAYERS_DATABASE } from './dataMerger.ts';

// Deterministic seed hashing to pick of daily target player
export function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getDailySeed(): string {
  // Get date in YYYY-MM-DD in UTC or Local
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDailyPlayer(seedStr: string, gender: '男' | '女' = '男'): Player {
  const seed = stringToSeed(seedStr);
  // Pick only from 入门/进阶 for daily challenges to guarantee a highly popular target player context!
  const pool = PLAYERS_DATABASE.filter(p => (p.difficulty === '入门' || p.difficulty === '进阶') && p.sex === gender);
  const index = seed % pool.length;
  return pool[index];
}

export function getRandomPlayer(difficulty: Difficulty = '入门', gender: '男' | '女' | '全部' = '全部'): Player {
  let pool = PLAYERS_DATABASE;
  if (difficulty !== '全知') {
    pool = PLAYERS_DATABASE.filter(p => p.difficulty === difficulty);
  }
  if (gender !== '全部') {
    pool = pool.filter(p => p.sex === gender);
  }
  if (pool.length === 0) {
    pool = PLAYERS_DATABASE.filter(p => p.sex === (gender === '全部' ? '男' : gender));
    if (pool.length === 0) pool = PLAYERS_DATABASE; // fallback
  }
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

// Compare guess properties with target athlete properties
export function compareGuess(guess: Player, target: Player): GuessComparison {
  const isCorrect = guess.id === target.id;

  const compareEquality = (gVal: any, tVal: any, display: string | number): AttributeFeedback => {
    return {
      status: gVal === tVal ? 'CORRECT' : 'WRONG',
      displayValue: display
    };
  };

  // 可选字段比较：双方都无值时返回 UNKNOWN，一方无值返回 WRONG
  const compareOptional = (gVal: string | undefined, tVal: string | undefined, display: string): AttributeFeedback => {
    if (!gVal && !tVal) return { status: 'UNKNOWN', displayValue: '未知' };
    if (!gVal || !tVal) return { status: 'WRONG', displayValue: display || '未知' };
    return {
      status: gVal === tVal ? 'CORRECT' : 'WRONG',
      displayValue: display
    };
  };

  const compareNumeric = (gVal: number, tVal: number, display: number): AttributeFeedback => {
    if (gVal === tVal) {
      return { status: 'CORRECT', displayValue: display };
    }
    return {
      status: gVal < tVal ? 'HIGHER' : 'LOWER',
      displayValue: display
    };
  };

  return {
    playerName: guess.name,
    isCorrect,
    feedbacks: {
      sex: compareEquality(guess.sex, target.sex, guess.sex),
      association: compareEquality(guess.association, target.association, guess.association),
      birthYear: compareNumeric(guess.birthYear, target.birthYear, guess.birthYear),
      activeStatus: compareEquality(guess.activeStatus, target.activeStatus, guess.activeStatus),
      hand: compareEquality(guess.hand, target.hand, guess.hand),
      grip: compareEquality(guess.grip, target.grip, guess.grip),
      playStyle: compareEquality(guess.playStyle, target.playStyle, guess.playStyle),
      forehandRubber: compareEquality(guess.forehandRubber, target.forehandRubber, guess.forehandRubber),
      backhandRubber: compareEquality(guess.backhandRubber, target.backhandRubber, guess.backhandRubber),
      bladeBrand: compareOptional(guess.bladeBrand, target.bladeBrand, guess.bladeBrand),
      honorGold: compareNumeric(guess.honorGold, target.honorGold, guess.honorGold)
    }
  };
}

// Encode challenge to secure Base64 query parameter
export function encodeChallenge(playerId: string): string {
  try {
    return btoa(unescape(encodeURIComponent(playerId)));
  } catch (e) {
    return playerId;
  }
}

// Decode challenge
export function decodeChallenge(code: string): Player | null {
  try {
    const playerId = decodeURIComponent(escape(atob(code)));
    const found = PLAYERS_DATABASE.find(p => p.id === playerId);
    return found || null;
  } catch (e) {
    // fallback direct checking or id matching
    const found = PLAYERS_DATABASE.find(p => p.id === code);
    return found || null;
  }
}

// Game ratings / title based on guesses size
export function getFanRating(steps: number, isWon: boolean, difficulty: Difficulty, isSurrendered: boolean = false): string {
  if (isSurrendered) {
    return '🏳️ 战术弃权 / 主动投降';
  }
  if (!isWon) {
    return '今天开局失守 / 再接再厉';
  }
  if (steps === 1) return '一拍认人 / 国手级预言家';
  if (steps <= 3) return '省队主力级老球迷';
  if (steps <= 5) return '资深球迷 / 专家段位';
  if (steps <= 8) return '稳健猜星人 / 大局观沉稳';
  return '业余球友 / 多看比赛加油';
}
