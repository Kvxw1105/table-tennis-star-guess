/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * dataMerger.ts — 新旧数据合并引擎
 *
 * 将旧版 84 人数据库与新版 139 人 JSON 数据合并，生成统一 PLAYERS_DATABASE（约 157 人）。
 *
 * 合并规则：
 * - 新数据为主源（字段默认使用新值）
 * - 旧数据补充新数据缺失的字段（bladeBrand、详细 playStyle、difficulty、honorGold、outCircleLevel）
 * - 旧数据中不在新数据集的选手完整保留
 */

import { Player, Difficulty } from './types.ts';
import { LEGACY_PLAYERS } from './playersData.ts';
import newGameData from './data/players.game.json';
import newSearchData from './data/players.search.json';
import newCanonicalData from './data/players.canonical.json';

// ─── 新 JSON 数据结构 ──────────────────────────────

interface NewGamePlayer {
  id: string; name: string; gender: string; countryName: string; birthYear: number;
  hand: string; grip: string; playStyle: string;
  forehandLevel: string; backhandLevel: string;
  forehandRubber: string; backhandRubber: string; rubberProfile: string;
  activeStatus: string; worldNo1: boolean | 'unknown';
  majorSinglesTitlesTotal: number;
  difficultyDraft: string; difficultyStatus: string; tags: string[];
}

interface NewSearchPlayer {
  id: string; name: string; nameEn: string;
  aliases: string[]; pinyinInitials: string;
  countryName: string; gender: string;
}

interface NewCanonicalPlayer {
  id: string; name: string; signature: string;
}

// ─── 枚举映射 ──────────────────────────────────────

const GENDER_MAP: Record<string, '男' | '女'> = { male: '男', female: '女' };
const HAND_MAP: Record<string, '左手' | '右手'> = { left: '左手', right: '右手' };
const GRIP_MAP: Record<string, '横拍' | '直拍'> = { shakehand: '横拍', penhold: '直拍' };
const ACTIVE_MAP: Record<string, '现役' | '退役' | '半活跃'> = { active: '现役', retired: '退役', unknown: '半活跃' };
const RUBBER_MAP: Record<string, string> = { inverted: '反胶', short_pips: '正胶', raw_pips: '生胶', long_pips: '长胶', medium_pips: '半长胶', unknown: '未知' };
const DIFFICULTY_MAP: Record<string, Difficulty> = { beginner: '入门', advanced: '进阶', master: '大师', omniscient: '全知' };
const STYLE_MAP: Record<string, string> = { attack: '两面弧圈', defense: '削中反攻' };
const COUNTRY_MAP: Record<string, string> = { '中国大陆': '中国' };

/** 重命名映射：旧版中文名 → 新版 ID */
const RENAMED_MAP: Record<string, string> = {
  '莫雷高德': 'truls_moregardh',
  '费利克斯·勒布伦': 'felix_lebrun',
  '亚历克斯·勒布伦': 'alexis_lebrun',
  '雨果·卡尔德拉诺': 'hugo_calderano',
  '约奇克': 'darko_jorgic',
  '弗拉基米尔·萨姆索诺夫': 'vladimir_samsonov',
};

// ─── 工具函数 ──────────────────────────────────────

function normalizeDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// ─── 合并主逻辑 ────────────────────────────────────

function mergePlayers(): Player[] {
  const gameData = newGameData as unknown as NewGamePlayer[];
  const searchData = newSearchData as unknown as NewSearchPlayer[];
  const canonData = newCanonicalData as unknown as NewCanonicalPlayer[];

  const searchById = new Map<string, NewSearchPlayer>();
  for (const p of searchData) searchById.set(p.id, p);

  const canonById = new Map<string, NewCanonicalPlayer>();
  for (const p of canonData) canonById.set(p.id, p);

  const newByName = new Map<string, string>();
  const newByNameEn = new Map<string, string>();
  for (const p of gameData) {
    newByName.set(p.name, p.id);
    newByNameEn.set(normalizeDiacritics(p.name), p.id);
  }
  // 用 search 数据的 nameEn 补充匹配（英文名匹配用）
  for (const p of searchData) {
    if (p.nameEn) {
      newByNameEn.set(normalizeDiacritics(p.nameEn), p.id);
    }
  }

  const matchedNewIds = new Set<string>();
  const merged: Player[] = [];

  // ── Pass 1：遍历旧数据 ──────────────────────────
  for (const old of LEGACY_PLAYERS) {
    let newId: string | undefined;

    if (!newId) newId = RENAMED_MAP[old.name];
    if (!newId) newId = newByName.get(old.name);
    if (!newId && old.nameEn) newId = newByNameEn.get(normalizeDiacritics(old.nameEn));

    if (newId) {
      const newP = gameData.find(p => p.id === newId);
      if (!newP) { merged.push({ ...old }); continue; }

      const searchP = searchById.get(newId);
      const canonP = canonById.get(newId);
      matchedNewIds.add(newId);

      merged.push({
        id: newId,
        name: newP.name,
        nameEn: searchP?.nameEn || old.nameEn,
        aliases: [...new Set([...(searchP?.aliases || []), ...old.aliases])],
        sex: GENDER_MAP[newP.gender] || old.sex,
        association: COUNTRY_MAP[newP.countryName] || newP.countryName,
        birthYear: newP.birthYear,
        activeStatus: ACTIVE_MAP[newP.activeStatus] || old.activeStatus,
        hand: HAND_MAP[newP.hand] || old.hand,
        grip: GRIP_MAP[newP.grip] || old.grip,
        playStyle: old.playStyle || STYLE_MAP[newP.playStyle] || '两面弧圈',
        forehandRubber: RUBBER_MAP[newP.forehandRubber] || old.forehandRubber,
        backhandRubber: RUBBER_MAP[newP.backhandRubber] || old.backhandRubber,
        bladeBrand: old.bladeBrand || '',
        honorGold: old.honorGold ?? newP.majorSinglesTitlesTotal ?? 0,
        outCircleLevel: old.outCircleLevel,
        signature: canonP?.signature || old.signature,
        difficulty: old.difficulty,
        pinyinInitials: searchP?.pinyinInitials,
        forehandLevel: newP.forehandLevel,
        backhandLevel: newP.backhandLevel,
        worldNo1: newP.worldNo1,
        rubberProfile: newP.rubberProfile,
      });
    } else {
      merged.push({ ...old });
    }
  }

  // ── Pass 2：处理全新球员 ────────────────────────
  for (const newP of gameData) {
    if (matchedNewIds.has(newP.id)) continue;
    const searchP = searchById.get(newP.id);
    const canonP = canonById.get(newP.id);

    merged.push({
      id: newP.id,
      name: newP.name,
      nameEn: searchP?.nameEn,
      aliases: searchP?.aliases || [],
      sex: GENDER_MAP[newP.gender] || '男',
      association: COUNTRY_MAP[newP.countryName] || newP.countryName,
      birthYear: newP.birthYear,
      activeStatus: ACTIVE_MAP[newP.activeStatus] || '现役',
      hand: HAND_MAP[newP.hand] || '右手',
      grip: GRIP_MAP[newP.grip] || '横拍',
      playStyle: STYLE_MAP[newP.playStyle] || '两面弧圈',
      forehandRubber: RUBBER_MAP[newP.forehandRubber] || '未知',
      backhandRubber: RUBBER_MAP[newP.backhandRubber] || '未知',
      bladeBrand: '',
      honorGold: newP.majorSinglesTitlesTotal ?? 0,
      outCircleLevel: 3,
      signature: canonP?.signature || '',
      difficulty: DIFFICULTY_MAP[newP.difficultyDraft] || '进阶',
      pinyinInitials: searchP?.pinyinInitials,
      forehandLevel: newP.forehandLevel,
      backhandLevel: newP.backhandLevel,
      worldNo1: newP.worldNo1,
      rubberProfile: newP.rubberProfile,
    });
  }

  return merged;
}

export const PLAYERS_DATABASE: Player[] = mergePlayers();
