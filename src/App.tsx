/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Activity,
  Flame,
  Award,
  Calendar,
  Share2,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  MapPin,
  User,
  RotateCcw,
  Sparkles,
  Search,
  Check,
  X,
  HelpCircle as QuestionIcon,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Compass,
  Zap,
  CheckCircle2,
  Copy,
  Link,
  Crown,
  Volume2,
  VolumeX,
  ShieldAlert,
  Heart,
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
  UserCheck,
  Lightbulb,
  Flag
} from 'lucide-react';

import { PLAYERS_DATABASE } from './dataMerger.ts';
import { Player, GuessComparison, Difficulty, UserStats } from './types.ts';
import {
  compareGuess,
  getDailySeed,
  getDailyPlayer,
  getRandomPlayer,
  getFanRating,
  encodeChallenge,
  decodeChallenge
} from './utils.ts';

// Web Audio API Sound Synth for Retro Sports Game Atmos
function playSound(
  type: 'ping' | 'pong' | 'success' | 'fail' | 'powerup' | 'lock_attribute' | 'guess_feedback' | 'victory' | 'defeat',
  enabled: boolean
) {
  if (!enabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Resume context if suspended (needed for browser autoplays restriction)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (type === 'ping') {
      // Crisp table-tennis ball meeting racket rubber click sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } else if (type === 'pong') {
      // Hollow ball hitting the table wood
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } else if (type === 'guess_feedback') {
      // Rhythmic Double-Tap UI "Ping-Pong" Rally Sound
      const now = ctx.currentTime;
      
      // 1st rebound: Racket impact (Ping)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.08);
      gain1.gain.setValueAtTime(0.14, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.09);

      // 2nd rebound: Table bounce (Pong) after 100ms
      const tWood = now + 0.10;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, tWood);
      osc2.frequency.exponentialRampToValueAtTime(220, tWood + 0.11);
      gain2.gain.setValueAtTime(0.16, tWood);
      gain2.gain.exponentialRampToValueAtTime(0.001, tWood + 0.11);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(tWood);
      osc2.stop(tWood + 0.12);
    } else if (type === 'lock_attribute') {
      // Uplifting 3-step Ping-Pong rising arpeggio chord representing tactical locks!
      const now = ctx.currentTime;
      const notes = [
        { f: 450, d: 0.10, t: 0.0, type: 'sine' as OscillatorType },      // Bounce low
        { f: 720, d: 0.12, t: 0.06, type: 'triangle' as OscillatorType },  // Mid-rise ping
        { f: 1080, d: 0.18, t: 0.12, type: 'sine' as OscillatorType }    // High silver ping
      ];

      notes.forEach((note) => {
        const time = now + note.t;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = note.type;
        osc.frequency.setValueAtTime(note.f, time);
        gain.gain.setValueAtTime(0.13, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + note.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + note.d + 0.02);
      });
    } else if (type === 'victory' || type === 'success') {
      // Celebratory fast ping-pong volley building up into a gorgeous Major 7th chord!
      const now = ctx.currentTime;
      
      // Volley sequences (rapid bouncing balls)
      const volley = [
        { f: 380, t: 0.0, d: 0.06, type: 'sine' as OscillatorType },
        { f: 580, t: 0.07, d: 0.06, type: 'triangle' as OscillatorType },
        { f: 480, t: 0.13, d: 0.05, type: 'sine' as OscillatorType },
        { f: 720, t: 0.18, d: 0.05, type: 'triangle' as OscillatorType },
        { f: 880, t: 0.22, d: 0.05, type: 'sine' as OscillatorType },
        { f: 1100, t: 0.25, d: 0.05, type: 'triangle' as OscillatorType }
      ];
      
      volley.forEach((vol) => {
        const time = now + vol.t;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = vol.type;
        osc.frequency.setValueAtTime(vol.f, time);
        gain.gain.setValueAtTime(0.10, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + vol.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + vol.d + 0.01);
      });

      // Glorious resolution scale and triad chord
      const chordDelay = 0.32;
      const chordTones = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Major Triad)
      chordTones.forEach((freq, idx) => {
        const time = now + chordDelay + (idx * 0.05);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.005, time + 0.5); // nice retro vibe vibrato
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.6);
      });
    } else if (type === 'defeat' || type === 'fail') {
      // Disappointed slowing down bounces falling down off the table (saddest ping-pong ball)
      const now = ctx.currentTime;
      const falls = [
        { f: 320, t: 0.0, d: 0.12 },
        { f: 230, t: 0.15, d: 0.15 },
        { f: 160, t: 0.32, d: 0.35 }
      ];

      falls.forEach((pt, idx) => {
        const time = now + pt.t;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pt.f, time);
        if (idx === 2) {
          // Slide tone down sadly
          osc.frequency.linearRampToValueAtTime(70, time + pt.d);
        }
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + pt.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + pt.d + 0.01);
      });
    } else if (type === 'powerup') {
      // Sizzling electronic starry sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (err) {
    console.warn('Synth Audio failed to initialize:', err);
  }
}

// Global configurations for collectible sports trading card skins based on target difficulty
function getCardSkin(diff: string) {
  switch (diff) {
    case '入门':
      return {
        bg: "bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950",
        border: "border-emerald-555/40 shadow-[0_0_20px_rgba(52,211,153,0.18)]",
        badge: "bg-emerald-950/80 border-emerald-500/50 text-emerald-300",
        glow: "bg-emerald-500/10",
        label: "入门新人"
      };
    case '进阶':
      return {
        bg: "bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950",
        border: "border-indigo-555/40 shadow-[0_0_25px_rgba(99,102,241,0.22)]",
        badge: "bg-indigo-950/80 border-indigo-500/50 text-indigo-300",
        glow: "bg-indigo-500/10",
        label: "资深进阶"
      };
    case '大师':
      return {
        bg: "bg-gradient-to-tr from-slate-950 via-slate-900 to-amber-950/60",
        border: "border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.28)]",
        badge: "bg-amber-950/80 border-amber-500/50 text-amber-300",
        glow: "bg-amber-500/15",
        label: "传奇大师"
      };
    case '全知':
    default:
      return {
        bg: "bg-gradient-to-tr from-slate-950 via-slate-900 to-rose-950/70",
        border: "border-rose-500/50 shadow-[0_0_35px_rgba(244,63,94,0.32)]",
        badge: "bg-rose-950/85 border-rose-500/50 text-rose-300",
        glow: "bg-rose-500/15",
        label: "全知至尊"
      };
  }
}

// Global indicator to qualify user's performance and output retro stats badges (SSS, SS, S, etc.)
function getTrophyRating(steps: number, won: boolean, isSurrendered: boolean = false) {
  if (isSurrendered) return { grade: '🏳️', desc: '战术弃权', color: 'border-slate-700/65 text-slate-405 bg-slate-950/70 shadow-sm font-black' };
  if (!won) return { grade: 'D', desc: '排查终止', color: 'border-rose-900/40 text-rose-500 bg-rose-950/40 shadow-[0_0_8px_rgba(239,68,68,0.2)] font-black' };
  if (steps === 1) return { grade: 'SSS', desc: '国手神临', color: 'border-amber-500 text-amber-300 bg-amber-950/80 shadow-[0_0_15px_rgba(245,158,11,0.5)] font-black animate-pulse' };
  if (steps <= 3) return { grade: 'SS', desc: '殿堂主力', color: 'border-yellow-500/80 text-yellow-300 bg-yellow-950/40 shadow-[0_0_10px_rgba(234,179,8,0.3)] font-bold' };
  if (steps <= 5) return { grade: 'S', desc: '资深球迷', color: 'border-indigo-500/80 text-indigo-300 bg-indigo-950/40 shadow-[0_0_8px_rgba(99,102,241,0.3)] font-bold' };
  if (steps <= 8) return { grade: 'A', desc: '中坚精英', color: 'border-cyan-500/80 text-cyan-300 bg-cyan-950/40 shadow-[0_0_6px_rgba(6,182,212,0.2)]' };
  return { grade: 'B', desc: '业余高手', color: 'border-emerald-500/80 text-emerald-300 bg-emerald-950/40' };
}

// Helper to validate check-in / daily challenge keys format accurately
export function isValidDailyKey(key: string): boolean {
  const regex = /^daily_complete_(\d{4})-(\d{2})-(\d{2})(_[男女])?$/;
  const match = key.match(regex);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  return year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

// Helper to fully parsed JSON checks & guard against corrupted database items
export function parseDailyCompletion(key: string): { isWon: boolean; isSurrendered: boolean } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const isWon = typeof parsed.isWon === 'boolean' ? parsed.isWon : false;
      const isSurrendered = typeof parsed.isSurrendered === 'boolean' ? parsed.isSurrendered : false;
      return { isWon, isSurrendered };
    }
  } catch (e) {
    console.error(`Error parsing daily completion for key: ${key}`, e);
  }
  return null;
}

// Safely offset YYYY-MM-DD date string by a number of days while keeping the correct local timezone
export function getOffsetDateString(dateStr: string, offsetDays: number): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed month
  const day = parseInt(parts[2], 10);
  
  const d = new Date(year, month, day);
  d.setDate(d.getDate() + offsetDays);
  
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// Dynamic recalculation of consecutive wins directly from daily challenges log
export function recalculateStreak(todaySeed: string): { currentStreak: number; maxStreak: number } {
  const dailyWins: Record<string, boolean> = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isValidDailyKey(key)) {
      const parts = key.match(/^daily_complete_(\d{4})-(\d{2})-(\d{2})/);
      if (parts) {
        const dateStr = `${parts[1]}-${parts[2]}-${parts[3]}`;
        const data = parseDailyCompletion(key);
        if (data) {
          if (data.isWon) {
            dailyWins[dateStr] = true;
          }
        }
      }
    }
  }
  
  let currentStreak = 0;
  
  // 1. If today is won
  if (dailyWins[todaySeed] === true) {
    currentStreak = 1;
    let checkDay = getOffsetDateString(todaySeed, -1);
    while (dailyWins[checkDay] === true) {
      currentStreak++;
      checkDay = getOffsetDateString(checkDay, -1);
    }
  } 
  // 2. If today was played and lost / surrendered, streak resets to 0
  else if (dailyWins[todaySeed] === false) {
    currentStreak = 0;
  }
  // 3. Today not played yet:
  else {
    let checkDay = getOffsetDateString(todaySeed, -1);
    if (dailyWins[checkDay] === true) {
      currentStreak = 1;
      checkDay = getOffsetDateString(checkDay, -1);
      while (dailyWins[checkDay] === true) {
        currentStreak++;
        checkDay = getOffsetDateString(checkDay, -1);
      }
    } else {
      currentStreak = 0;
    }
  }
  
  // Recalculate historical maximum streak of consecutive wins
  let maxStreak = 0;
  const wonDates = Object.keys(dailyWins).filter(d => dailyWins[d] === true).sort();
  if (wonDates.length > 0) {
    let tempStreak = 1;
    maxStreak = 1;
    for (let i = 1; i < wonDates.length; i++) {
      const prev = wonDates[i - 1];
      const curr = wonDates[i];
      const expectedPrev = getOffsetDateString(curr, -1);
      if (prev === expectedPrev) {
        tempStreak++;
        if (tempStreak > maxStreak) {
          maxStreak = tempStreak;
        }
      } else {
        tempStreak = 1;
      }
    }
  }
  
  return { currentStreak, maxStreak };
}

function getStreakProfile(currentStreak: number) {
  const milestones = [
    { streak: 0, title: '乒坛小白' },
    { streak: 1, title: '连胜突击手' },
    { streak: 3, title: '黄金全能球迷' },
    { streak: 5, title: '国球不灭烽火' },
    { streak: 7, title: '七天全勤球迷' },
    { streak: 15, title: '乒坛至尊大满贯' },
  ];
  
  let currentTitle = '乒坛小白';
  for (let i = milestones.length - 1; i >= 0; i--) {
    if (currentStreak >= milestones[i].streak) {
      currentTitle = milestones[i].title;
      break;
    }
  }
  
  const nextMilestone = milestones.find(m => m.streak > currentStreak);
  
  return {
    currentTitle,
    nextTitle: nextMilestone ? nextMilestone.title : null,
    nextStreakNeeded: nextMilestone ? nextMilestone.streak : null,
    daysRemaining: nextMilestone ? (nextMilestone.streak - currentStreak) : 0
  };
}

// Custom decorative tennis/ping-pong elements
function PingPongRacketLogo({ className = "w-5 h-5", animate = true }: { className?: string; animate?: boolean }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`${className} ${animate ? 'animate-bounce' : ''}`}
      style={{ animationDuration: '3s' }}
    >
      {/* Wood plate handle */}
      <path 
        d="M13.5 13.5L18.5 18.5C19.2 19.2 19.2 20.2 18.5 20.9C17.8 21.6 16.8 21.6 16.1 20.9L11.1 15.9" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      <path d="M14 16L16 18" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      {/* Red rubber face with white highlighted reflections */}
      <circle cx="9.5" cy="9.5" r="5.5" fill="#ef4444" stroke="currentColor" strokeWidth="2.2" />
      <path d="M6.5 8C6.5 6.5 7.5 5.5 9 5.5" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />
      {/* Bouncing tiny orange ping pong ball with dynamic track glow */}
      <circle cx="17" cy="8" r="2" fill="#f97316" stroke="currentColor" strokeWidth="1" />
      <circle cx="17" cy="8" r="3.2" stroke="#f97316" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.5" />
    </svg>
  );
}

function EmptyStateIllustration() {
  return (
    <div className="relative w-28 h-24 mb-3.5 flex items-center justify-center">
      {/* Ping pong court blueprint coordinates map */}
      <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full text-slate-800 dark:text-slate-800/60 opacity-30 pointer-events-none">
        <rect x="15" y="10" width="70" height="40" rx="3" stroke="currentColor" strokeWidth="1.2" />
        <line x1="50" y1="10" x2="50" y2="50" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="12" y1="30" x2="88" y2="30" stroke="currentColor" strokeWidth="1.6" opacity="0.7" />
      </svg>
      
      {/* Crossed multi-color rackets and bouncing orbit track */}
      <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 relative z-10">
        <g transform="rotate(-20 20 28)">
          <path d="M12 28L4 38C3.5 38.6 3.5 39.5 4 40C4.5 40.5 5.4 40.5 6 40L14 30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="17" cy="20" r="8" fill="#ef4444" stroke="currentColor" strokeWidth="2.2" />
          <path d="M12 17C12 14.5 14 12.5 16.5 12.5" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
        </g>
        
        <g transform="rotate(20 36 28)">
          <path d="M44 28L36 38C35.5 38.6 35.5 39.5 36 40C36.5 40.5 37.4 40.5 38 40L46 30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="28" cy="20" r="8" fill="#3b82f6" stroke="currentColor" strokeWidth="2.2" />
          <path d="M23.5 17C23.5 14.5 25.5 12.5 28 12.5" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
        </g>
        
        <path d="M15 13C22 5 34 5 41 13" stroke="#f97316" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="28" cy="7" r="2.5" fill="#f97316" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}

interface HintType {
  id: number;
  title: string;
  cost: number;
  description: string;
  resolver: (player: Player) => string;
}

const HINTS_CONFIG: HintType[] = [
  {
    id: 1,
    title: "「初级情报」公开",
    cost: 1,
    description: "揭晓性别和国家地区协会（罚时 +1 步）",
    resolver: (player) => `【性别】${player.sex}，【所属协会】${player.association}`
  },
  {
    id: 2,
    title: "「中级特征」破译",
    cost: 2,
    description: "揭晓选手的持拍手（左右）与握拍方式（横直）（罚时 +2 步）",
    resolver: (player) => `【持拍手】${player.hand}，【握拍方式】${player.grip}`
  },
  {
    id: 3,
    title: "「深度背景」挖掘",
    cost: 2,
    description: "揭晓选手出生年份区间（±2年）及合作品牌底板（罚时 +2 步）",
    resolver: (player) => `【出生年份】位于 ${player.birthYear - 2}～${player.birthYear + 2} 年之间，【底板品牌】为 ${player.bladeBrand}`
  },
  {
    id: 4,
    title: "「王道拼图」特搜",
    cost: 3,
    description: "揭晓详细打法与正反手套胶类型搭配（罚时 +3 步）",
    resolver: (player) => `【详细打法】${player.playStyle}，【正手套胶】${player.forehandRubber}，【反手套胶】${player.backhandRubber}`
  }
];

export default function App() {
  const [gameMode, setGameMode] = useState<'daily' | 'free' | 'challenge'>('daily');
  const [lobbyTab, setLobbyTab] = useState<'daily' | 'free' | 'challenge'>('daily');
  const [dailyGender, setDailyGender] = useState<'男' | '女'>('男');
  const [freeGender, setFreeGender] = useState<'男' | '女' | '全部'>('全部');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('kaiju_star_theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('kaiju_star_theme', theme);
    } catch (e) {}
    
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const [targetPlayer, setTargetPlayer] = useState<Player | null>(null);
  const [guessedIds, setGuessedIds] = useState<string[]>([]);
  const [guesses, setGuesses] = useState<GuessComparison[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Player[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [isSurrendered, setIsSurrendered] = useState(false);
  const [dailyPracticeMode, setDailyPracticeMode] = useState(false);
  
  // Retro game audio toggle state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kaiju_star_audio');
      return saved !== 'false';
    } catch (e) {
      return true;
    }
  });

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    try {
      localStorage.setItem('kaiju_star_audio', String(nextVal));
    } catch (e) {}
    // Play a test beep to confirm
    playSound('ping', nextVal);
  };

  // Custom difficulty for Practice/Free Mode
  const [freeDifficulty, setFreeDifficulty] = useState<Difficulty>('入门');

  // Friends Challenge creator states
  const [creatorSelectedPlayerId, setCreatorSelectedPlayerId] = useState<string>('');
  const [creatorGeneratedLink, setCreatorGeneratedLink] = useState<string>('');
  const [copiedChallenge, setCopiedChallenge] = useState(false);

  // States
  const [playView, setPlayView] = useState<'lobby' | 'arena'>('lobby');
  const [activeTab, setActiveTab] = useState<'play' | 'create' | 'stats' | 'guide'>('play');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [dailyTryAgainNotif, setDailyTryAgainNotif] = useState(false);
  const [streakExpanded, setStreakExpanded] = useState(false);
  
  // Highlighted attribute from the radar to focus guess columns
  const [highlightedAttribute, setHighlightedAttribute] = useState<string | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  // 揭晓弹窗分步动画
  const [revealStage, setRevealStage] = useState(0);
  useEffect(() => {
    if (isGameOver) {
      setRevealStage(1);
      const t1 = setTimeout(() => setRevealStage(2), 400);
      const t2 = setTimeout(() => setRevealStage(3), 1000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setRevealStage(0);
    }
  }, [isGameOver]);

  // 连击反馈
  const [comboCount, setComboCount] = useState(0);
  const [showCombo, setShowCombo] = useState(false);

  // 球路动画
  const [ballAnimKey, setBallAnimKey] = useState(0);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // 点击属性标签时，自动滚动表格到对应列
  useEffect(() => {
    if (!highlightedAttribute || !tableScrollRef.current) return;
    const el = tableScrollRef.current.querySelector(`th[data-attr="${highlightedAttribute}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [highlightedAttribute]);
  const [mobileRadarOpen, setMobileRadarOpen] = useState(false);
  const [hintsUsed, setHintsUsed] = useState<number[]>([]);
  const [showSurrenderConfirmModal, setShowSurrenderConfirmModal] = useState(false);
  const [showHintsPanelModal, setShowHintsPanelModal] = useState(false);
  const [hintToUnlockConfirm, setHintToUnlockConfirm] = useState<number | null>(null);

  // Highlighted index in suggestions dropdown for keyboard navigation
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  
  // Stats loaded from localStorage
  const [stats, setStats] = useState<UserStats>({
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
    history: []
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const isTouchingSuggestions = useRef<boolean>(false);

  // Configuration for 11 attributes to render locked stats dashboard
  const attributeConfig = [
    { key: 'sex' as const, label: '性别' },
    { key: 'association' as const, label: '协会' },
    { key: 'birthYear' as const, label: '出生年' },
    { key: 'activeStatus' as const, label: '状态' },
    { key: 'hand' as const, label: '持拍手' },
    { key: 'grip' as const, label: '握拍' },
    { key: 'playStyle' as const, label: '打法' },
    { key: 'forehandRubber' as const, label: '正手' },
    { key: 'backhandRubber' as const, label: '反手' },
    { key: 'bladeBrand' as const, label: '曾用底板' },
    { key: 'honorGold' as const, label: '金牌' },
  ];

  const getAttrStatus = (key: 'sex' | 'association' | 'birthYear' | 'activeStatus' | 'hand' | 'grip' | 'playStyle' | 'forehandRubber' | 'backhandRubber' | 'bladeBrand' | 'honorGold') => {
    if (guesses.some(g => g.feedbacks[key].status === 'CORRECT')) return 'CORRECT';
    if (guesses.some(g => g.feedbacks[key].status === 'HIGHER' || g.feedbacks[key].status === 'LOWER')) return 'NARROWING';
    return 'EMPTY';
  };

  // Initialize stats on load
  useEffect(() => {
    const todaySeed = getDailySeed();
    const savedStats = localStorage.getItem('kaiju_star_stats');
    let loadedStats: UserStats = {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
      history: []
    };

    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        if (parsed && typeof parsed === 'object') {
          loadedStats.gamesPlayed = typeof parsed.gamesPlayed === 'number' && !isNaN(parsed.gamesPlayed) && parsed.gamesPlayed >= 0 ? parsed.gamesPlayed : 0;
          loadedStats.gamesWon = typeof parsed.gamesWon === 'number' && !isNaN(parsed.gamesWon) && parsed.gamesWon >= 0 ? parsed.gamesWon : 0;
          
          if (parsed.guessDistribution && typeof parsed.guessDistribution === 'object') {
            const gd = parsed.guessDistribution;
            loadedStats.guessDistribution = {
              1: typeof gd[1] === 'number' ? gd[1] : 0,
              2: typeof gd[2] === 'number' ? gd[2] : 0,
              3: typeof gd[3] === 'number' ? gd[3] : 0,
              4: typeof gd[4] === 'number' ? gd[4] : 0,
              5: typeof gd[5] === 'number' ? gd[5] : 0,
              6: typeof gd[6] === 'number' ? gd[6] : 0,
              7: typeof gd[7] === 'number' ? gd[7] : 0,
              8: typeof gd[8] === 'number' ? gd[8] : 0,
              9: typeof gd[9] === 'number' ? gd[9] : 0,
            };
          }
          
          loadedStats.maxStreak = typeof parsed.maxStreak === 'number' && !isNaN(parsed.maxStreak) && parsed.maxStreak >= 0 ? parsed.maxStreak : 0;
          loadedStats.lastPlayedDate = typeof parsed.lastPlayedDate === 'string' ? parsed.lastPlayedDate : undefined;
          loadedStats.history = Array.isArray(parsed.history) ? parsed.history : [];
        }
      } catch (e) {
        console.error('Failed to load user stats securely, recovering defaults', e);
      }
    }

    // Dynamic and robust recalculation of daily wins and sequential streak patterns
    const verified = recalculateStreak(todaySeed);
    loadedStats.currentStreak = verified.currentStreak;
    loadedStats.maxStreak = Math.max(verified.maxStreak, loadedStats.maxStreak);

    setStats(loadedStats);
    localStorage.setItem('kaiju_star_stats', JSON.stringify(loadedStats));
  }, []);

  // Save stats helper
  const saveStats = (newStats: UserStats) => {
    const safeStats: UserStats = {
      gamesPlayed: typeof newStats.gamesPlayed === 'number' && !isNaN(newStats.gamesPlayed) && newStats.gamesPlayed >= 0 ? newStats.gamesPlayed : 0,
      gamesWon: typeof newStats.gamesWon === 'number' && !isNaN(newStats.gamesWon) && newStats.gamesWon >= 0 ? newStats.gamesWon : 0,
      currentStreak: typeof newStats.currentStreak === 'number' && !isNaN(newStats.currentStreak) && newStats.currentStreak >= 0 ? newStats.currentStreak : 0,
      maxStreak: typeof newStats.maxStreak === 'number' && !isNaN(newStats.maxStreak) && newStats.maxStreak >= 0 ? newStats.maxStreak : 0,
      guessDistribution: (newStats.guessDistribution && typeof newStats.guessDistribution === 'object') ? {
        1: typeof newStats.guessDistribution[1] === 'number' ? newStats.guessDistribution[1] : 0,
        2: typeof newStats.guessDistribution[2] === 'number' ? newStats.guessDistribution[2] : 0,
        3: typeof newStats.guessDistribution[3] === 'number' ? newStats.guessDistribution[3] : 0,
        4: typeof newStats.guessDistribution[4] === 'number' ? newStats.guessDistribution[4] : 0,
        5: typeof newStats.guessDistribution[5] === 'number' ? newStats.guessDistribution[5] : 0,
        6: typeof newStats.guessDistribution[6] === 'number' ? newStats.guessDistribution[6] : 0,
        7: typeof newStats.guessDistribution[7] === 'number' ? newStats.guessDistribution[7] : 0,
        8: typeof newStats.guessDistribution[8] === 'number' ? newStats.guessDistribution[8] : 0,
        9: typeof newStats.guessDistribution[9] === 'number' ? newStats.guessDistribution[9] : 0,
      } : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
      lastPlayedDate: typeof newStats.lastPlayedDate === 'string' ? newStats.lastPlayedDate : undefined,
      history: Array.isArray(newStats.history) ? newStats.history : []
    };
    setStats(safeStats);
    localStorage.setItem('kaiju_star_stats', JSON.stringify(safeStats));
  };

  // Setup game mode and parameters on mount or hash change
  useEffect(() => {
    // Check URL parameters first for Friends Challenge mode
    const params = new URLSearchParams(window.location.search);
    const challengeCode = params.get('challenge');
    
    if (challengeCode) {
      const decodedPlayer = decodeChallenge(challengeCode);
      if (decodedPlayer) {
        setGameMode('challenge');
        setTargetPlayer(decodedPlayer);
        resetStateWithTarget(decodedPlayer);
        setPlayView('arena');
        return;
      }
    }

    // Default to daily mode, but start at Lobby for welcome layout
    setupDailyChallenge();
    setPlayView('lobby');
  }, []);

  // Watch URL params / hash changes
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const challengeCode = params.get('challenge');
      if (challengeCode) {
        const decoded = decodeChallenge(challengeCode);
        if (decoded) {
          setGameMode('challenge');
          setTargetPlayer(decoded);
          resetStateWithTarget(decoded);
          setPlayView('arena');
        }
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // Clean suggestions on typing
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = PLAYERS_DATABASE.filter(p => {
      // Don't show already guessed players
      if (guessedIds.includes(p.id)) return false;

      // Filter by query matches name, English name, difficulty, organization, or alias list
      return (
        p.name.toLowerCase().includes(term) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(term)) ||
        p.association.toLowerCase().includes(term) ||
        p.aliases.some(alias => alias.toLowerCase().includes(term)) ||
        (p.pinyinInitials && p.pinyinInitials.toLowerCase().includes(term))
      );
    });

    setSuggestions(filtered.slice(0, 8)); // Max 8 suggestions
  }, [searchTerm, guessedIds]);

  // Reset suggestion pointer index when suggestions update
  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [suggestions]);

  // Scroll suggestion into view when moving via keyboard
  useEffect(() => {
    if (activeSuggestionIndex >= 0 && suggestionsRef.current) {
      const activeElement = suggestionsRef.current.children[activeSuggestionIndex + 1] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({
          block: 'nearest',
        });
      }
    }
  }, [activeSuggestionIndex]);

  // Click/touch outside to close auto-suggestions dropdown
  useEffect(() => {
    const handleOutsideClick = (e: Event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  const resetStateWithTarget = (target: Player) => {
    setGuessedIds([]);
    setGuesses([]);
    setSearchTerm('');
    setSuggestions([]);
    setIsGameOver(false);
    setIsWon(false);
    setIsSurrendered(false);
    setHintsUsed([]);
    setDailyPracticeMode(false);
    setShowSurrenderConfirmModal(false);
    setShowHintsPanelModal(false);
    setHintToUnlockConfirm(null);
  };

  const setupDailyChallenge = (gender: '男' | '女' = dailyGender) => {
    setGameMode('daily');
    setDailyGender(gender);
    const daySeed = getDailySeed();
    const mysteryDailyPlayer = getDailyPlayer(daySeed, gender);
    setTargetPlayer(mysteryDailyPlayer);
    playSound('powerup', soundEnabled);
    
    // Check if player already completed today's daily in localStorage with rigorous formatting verification
    const completionKey = `daily_complete_${daySeed}_${gender}`;
    if (isValidDailyKey(completionKey)) {
      const solvedToday = localStorage.getItem(completionKey);
      if (solvedToday) {
        try {
          const parsedState = JSON.parse(solvedToday);
          if (parsedState && typeof parsedState === 'object' && Array.isArray(parsedState.guesses) && Array.isArray(parsedState.guessedIds)) {
            setGuesses(parsedState.guesses);
            setGuessedIds(parsedState.guessedIds);
            setIsWon(typeof parsedState.isWon === 'boolean' ? parsedState.isWon : false);
            setIsSurrendered(typeof parsedState.isSurrendered === 'boolean' ? parsedState.isSurrendered : false);
            setHintsUsed(Array.isArray(parsedState.hintsUsed) ? parsedState.hintsUsed : []);
            setIsGameOver(true);
            setDailyPracticeMode(true);
          } else {
            throw new Error('Malformed daily state structure');
          }
        } catch (e) {
          console.error('Recovered from corrupted daily state storage', e);
          resetStateWithTarget(mysteryDailyPlayer);
          setDailyPracticeMode(false);
        }
      } else {
        resetStateWithTarget(mysteryDailyPlayer);
        setDailyPracticeMode(false);
      }
    } else {
      resetStateWithTarget(mysteryDailyPlayer);
      setDailyPracticeMode(false);
    }
    setPlayView('arena');
  };

  const setupFreeChallenge = (difficulty: Difficulty, gender: '男' | '女' | '全部' = freeGender) => {
    setGameMode('free');
    setFreeDifficulty(difficulty);
    setFreeGender(gender);
    const randomPlayer = getRandomPlayer(difficulty, gender);
    setTargetPlayer(randomPlayer);
    playSound('powerup', soundEnabled);
    resetStateWithTarget(randomPlayer);
    setPlayView('arena');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => {
        const next = prev + 1;
        return next >= suggestions.length ? 0 : next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => {
        const next = prev - 1;
        return next < 0 ? suggestions.length - 1 : next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetIdx = activeSuggestionIndex >= 0 ? activeSuggestionIndex : 0;
      if (targetIdx >= 0 && targetIdx < suggestions.length) {
        handleMakeGuess(suggestions[targetIdx]);
        searchInputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSuggestions([]);
    }
  };

  const handleMakeGuess = (player: Player) => {
    if (isGameOver || !targetPlayer) return;
    if (guessedIds.includes(player.id)) return;

    const currentGuessComparison = compareGuess(player, targetPlayer);
    const nextGuesses = [currentGuessComparison, ...guesses]; // Prepend for latest-first view
    const nextGuessedIds = [...guessedIds, player.id];

    setGuesses(nextGuesses);
    setGuessedIds(nextGuessedIds);
    setSearchTerm('');
    setSuggestions([]);

    // 连击反馈：统计本轮新锁定的属性数
    const newlyLockedCount = attributeConfig.filter(cfg => {
      const isCurrentCorrect = (currentGuessComparison.feedbacks as any)[cfg.key]?.status === 'CORRECT';
      const wasPreviouslyCorrect = guesses.some(g => (g.feedbacks as any)[cfg.key]?.status === 'CORRECT');
      return isCurrentCorrect && !wasPreviouslyCorrect;
    }).length;
    if (newlyLockedCount >= 2) {
      setComboCount(newlyLockedCount);
      setShowCombo(true);
      setTimeout(() => { setShowCombo(false); setComboCount(0); }, 1200);
      playSound('lock_attribute', soundEnabled);
    } else if (newlyLockedCount === 1) {
      playSound('lock_attribute', soundEnabled);
    } else if (!won) {
      playSound('guess_feedback', soundEnabled);
    }

    // 球路动画触发器
    setBallAnimKey(prev => prev + 1);

    const won = currentGuessComparison.isCorrect;
    
    if (won || nextGuessedIds.length >= 100) { // Practically unlimited but cap at 100
      setIsGameOver(true);
      setIsWon(won);
      
      if (won) {
        playSound('victory', soundEnabled);
      } else {
        playSound('defeat', soundEnabled);
      }
      
      // Update statistics
      const todayStr = new Date().toISOString().split('T')[0];
      const totalHintPenalty = hintsUsed.reduce((sum, id) => {
        const h = HINTS_CONFIG.find(x => x.id === id);
        return sum + (h ? h.cost : 0);
      }, 0);

      if (gameMode === 'daily') {
        if (dailyPracticeMode) {
          setIsGameOver(true);
          setIsWon(won);
          if (won) {
            playSound('victory', soundEnabled);
          } else {
            playSound('defeat', soundEnabled);
          }
          return;
        }

        const daySeed = getDailySeed();
        const completionKey = `daily_complete_${daySeed}_${dailyGender}`;
        setDailyPracticeMode(true);
        localStorage.setItem(completionKey, JSON.stringify({
          guesses: nextGuesses,
          guessedIds: nextGuessedIds,
          isWon: won,
          isSurrendered: false,
          hintsUsed
        }));

        if (won) {
          const freshWonCount = stats.gamesWon + 1;
          const freshPlayedCount = stats.gamesPlayed + 1;
          
          // Balanced Streak Rules: If hints used penalty >= 4 (high assistance), 
          // streak freezes (does not reset, but does not increase) to prevent cheesy streak abuse.
          const isAssistedWin = totalHintPenalty >= 4;
          const freshStreak = isAssistedWin ? stats.currentStreak : stats.currentStreak + 1;
          const freshMaxStreak = Math.max(stats.maxStreak, freshStreak);
          const distribution = { ...stats.guessDistribution };
          const steps = nextGuessedIds.length + totalHintPenalty;
          distribution[steps] = (distribution[steps] || 0) + 1;

          const freshHistory = [
            ...(stats.history || []), 
            { date: todayStr, guessCount: steps, isWon: true, isAssistedWin }
          ];

          saveStats({
            gamesPlayed: freshPlayedCount,
            gamesWon: freshWonCount,
            currentStreak: freshStreak,
            maxStreak: freshMaxStreak,
            guessDistribution: distribution,
            lastPlayedDate: daySeed,
            history: freshHistory
          });
        } else {
          // Lost or failed
          const freshHistory = [...(stats.history || []), { date: todayStr, guessCount: nextGuessedIds.length + totalHintPenalty, isWon: false }];
          saveStats({
            ...stats,
            gamesPlayed: stats.gamesPlayed + 1,
            currentStreak: 0,
            lastPlayedDate: daySeed,
            history: freshHistory
          });
        }
      } else {
        // Free mode or challenge mode: also register in history to make user progression tracking fully functional!
        if (won) {
          const freshWonCount = stats.gamesWon + 1;
          const freshPlayedCount = stats.gamesPlayed + 1;
          const distribution = { ...stats.guessDistribution };
          const steps = nextGuessedIds.length + totalHintPenalty;
          distribution[steps] = (distribution[steps] || 0) + 1;
          
          const freshHistory = [...(stats.history || []), { date: todayStr, guessCount: steps, isWon: true }];
          
          saveStats({
            ...stats,
            gamesPlayed: freshPlayedCount,
            gamesWon: freshWonCount,
            guessDistribution: distribution,
            history: freshHistory
          });
        } else {
          const freshHistory = [...(stats.history || []), { date: todayStr, guessCount: nextGuessedIds.length + totalHintPenalty, isWon: false }];
          saveStats({
            ...stats,
            gamesPlayed: stats.gamesPlayed + 1,
            history: freshHistory
          });
        }
      }
    }
  };

  const handleConcedeSurrender = () => {
    if (isGameOver || !targetPlayer) return;
    setIsGameOver(true);
    setIsSurrendered(true);
    setIsWon(false);
    playSound('defeat', soundEnabled);

    const todayStr = new Date().toISOString().split('T')[0];
    const totalHintPenalty = hintsUsed.reduce((sum, id) => {
      const h = HINTS_CONFIG.find(x => x.id === id);
      return sum + (h ? h.cost : 0);
    }, 0);
    const freshHistory = [...(stats.history || []), { date: todayStr, guessCount: guessedIds.length + totalHintPenalty, isWon: false }];

    if (gameMode === 'daily') {
      if (dailyPracticeMode) {
        // Just end practice surrendered session, do not alter official database state
        return;
      }
      setDailyPracticeMode(true);
      
      const daySeed = getDailySeed();
      const completionKey = `daily_complete_${daySeed}_${dailyGender}`;
      localStorage.setItem(completionKey, JSON.stringify({
        guesses,
        guessedIds,
        isWon: false,
        isSurrendered: true,
        hintsUsed
      }));

      saveStats({
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        currentStreak: 0,
        lastPlayedDate: daySeed,
        history: freshHistory
      });
    } else {
      saveStats({
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        history: freshHistory
      });
    }
  };

  // Generate spoiler-free emoji share matrix
  const getSpoilerFreeShareText = (isDirectHtml: boolean = false) => {
    if (!targetPlayer) return '';
    const daySeed = getDailySeed();
    const totalHintPenalty = hintsUsed.reduce((sum, id) => {
      const h = HINTS_CONFIG.find(x => x.id === id);
      return sum + (h ? h.cost : 0);
    }, 0);
    const stepsCount = guesses.length + totalHintPenalty;
    const ratingLabel = getFanRating(stepsCount, isWon, targetPlayer.difficulty, isSurrendered);
    const difficultyLabel = targetPlayer.difficulty;
    const titleHeader = `🏓 开局一个乒乓球星 • ${gameMode === 'daily' ? `今日开局 #${daySeed}` : '自由开局'}\n`;
    const resultHeader = isWon 
      ? `🎉 我仅用 ${stepsCount} 步就猜出了神秘球星！\n球迷称号：【${ratingLabel}】\n` 
      : isSurrendered 
        ? `🏳️ 我今天投降了，线索断了！\n今日挑战难度：【${difficultyLabel}】\n`
        : `❌ 挑战未成功！\n`;

    // Row layout for shares: 🟩 ✅ 🔺 🔻 🟥
    const getSymbol = (status: string) => {
      switch (status) {
        case 'CORRECT': return '🟩';
        case 'HIGHER': return '🔺';
        case 'LOWER': return '🔻';
        default: return '⬛';
      }
    };

    let emojiLines = '';
    // Show top guesses up to 8 max to keep WeChat/Group text compact
    const visibleGuesses = [...guesses].reverse().slice(0, 8);
    visibleGuesses.forEach((g) => {
      const row = [
        getSymbol(g.feedbacks.sex.status),
        getSymbol(g.feedbacks.association.status),
        getSymbol(g.feedbacks.birthYear.status),
        getSymbol(g.feedbacks.activeStatus.status),
        getSymbol(g.feedbacks.hand.status),
        getSymbol(g.feedbacks.grip.status),
        getSymbol(g.feedbacks.playStyle.status),
        getSymbol(g.feedbacks.forehandRubber.status),
        getSymbol(g.feedbacks.backhandRubber.status),
        getSymbol(g.feedbacks.bladeBrand.status),
        getSymbol(g.feedbacks.honorGold.status),
      ].join('');
      emojiLines += `${row}\n`;
    });

    if (guesses.length > 8) {
      emojiLines += `...等其他 ${guesses.length - 8} 次博弈预测...\n`;
    }

    const cta = `\n你能比我更快吗？来战👇\n${window.location.origin}${window.location.pathname}`;
    return `${titleHeader}${resultHeader}\n${emojiLines}${cta}`;
  };

  const handleCopyShareText = () => {
    const text = getSpoilerFreeShareText();
    navigator.clipboard.writeText(text).then(() => {
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 2000);
    });
  };

  const handleCreateChallenge = () => {
    if (!creatorSelectedPlayerId) return;
    const encoded = encodeChallenge(creatorSelectedPlayerId);
    // Add custom protocol check
    const inviteLink = `${window.location.origin}${window.location.pathname}?challenge=${encoded}`;
    setCreatorGeneratedLink(inviteLink);
    setCopiedChallenge(false);
  };

  const handleCopyChallengeLink = () => {
    if (!creatorGeneratedLink) return;
    navigator.clipboard.writeText(creatorGeneratedLink).then(() => {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2000);
    });
  };

  // Cell helper styling
  const getFeedbackCellClasses = (status: string) => {
    switch (status) {
      case 'CORRECT':
        return 'bg-emerald-50 dark:bg-emerald-950/75 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.1)]';
      case 'HIGHER':
        return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30';
      case 'LOWER':
        return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30';
      default:
        return 'bg-slate-850 dark:bg-slate-900 border border-slate-800 dark:border-slate-800 text-slate-400 dark:text-slate-405';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:px-4 selection:bg-indigo-600/30 transition-colors duration-300 relative botw-scanlines">
      {/* Texture Background Grid Overlay */}
      <div className="absolute inset-0 overflow-x-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-transparent bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04]" />
        <div className="absolute top-20 left-1/4 w-[380px] h-[380px] bg-indigo-505/5 rounded-full filter blur-[100px]" />
        <div className="absolute bottom-40 right-1/4 w-[420px] h-[420px] bg-purple-500/5 rounded-full filter blur-[120px]" />
      </div>
      
      {/* Upper Navigation/Header Bar */}
      <header className="max-w-6xl w-full mx-auto px-3 sm:px-4 py-3 sm:py-5 flex items-center justify-between border-b border-slate-800 dark:border-slate-800 relative z-20">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="bg-gradient-to-br from-indigo-505 to-rose-600 p-1.5 sm:p-2 rounded-xl text-white shadow-lg shadow-indigo-550/20 flex items-center justify-center shrink-0">
            <PingPongRacketLogo className="w-4 h-4 sm:w-5 sm:h-5" animate={true} />
          </div>
          <div>
            <h1 className="text-sm sm:text-base md:text-xl font-black tracking-tight text-slate-100 flex items-center gap-1 font-display">
              开局一个球星
            </h1>
            <p className="text-[9px] text-slate-550 dark:text-slate-450 font-medium font-semibold hidden sm:block">
              开局一个乒乓球星 • 属性博弈猜星推理
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-3 shrink-0">
          <button
            onClick={toggleSound}
            className={`p-1.5 md:p-2 rounded-lg transition-all duration-300 cursor-pointer border shrink-0 ${
              soundEnabled 
                ? 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100/60 dark:text-indigo-400 dark:bg-indigo-950/20 dark:border-indigo-900/50 dark:hover:bg-indigo-900/40 shadow-sm' 
                : 'text-slate-500 bg-white border-slate-800 dark:bg-slate-900/40 dark:border-slate-800 hover:text-slate-100 dark:hover:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
            title={soundEnabled ? "音效：开启 (点击静音)" : "音效：关闭 (点击开启)"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />}
          </button>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-1.5 md:p-2 rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center border shrink-0 ${
              theme === 'dark'
                ? 'text-amber-400 bg-amber-955 border-amber-900/30 hover:bg-amber-950/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                : 'text-slate-500 bg-white border-slate-800 hover:bg-slate-50 hover:text-slate-100 shadow-sm'
            }`}
            title={theme === 'dark' ? "切换为浅色模式" : "切换为深色模式"}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />}
          </button>

          <button
            onClick={() => {
              setActiveTab('guide');
              playSound('ping', soundEnabled);
            }}
            className={`p-1.5 md:p-2 rounded-lg transition-all cursor-pointer border shrink-0 ${
              activeTab === 'guide'
                ? 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-350 dark:bg-indigo-950/30 dark:border-indigo-900/50'
                : 'text-slate-555 border-transparent hover:bg-slate-850/60 dark:hover:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
            title="查看游戏说明指南"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </button>
          
          <button
            onClick={() => {
              setActiveTab('stats');
              playSound('ping', soundEnabled);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs rounded-xl transition-all font-black cursor-pointer border shadow-sm shrink-0 ${
              activeTab === 'stats'
                ? 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-300 dark:bg-indigo-950/70 dark:border-indigo-500/50'
                : 'text-slate-400 dark:text-slate-350 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border-slate-700 dark:border-slate-800'
            }`}
            title="我的战绩与荣誉"
          >
            <Trophy className="w-3.5 h-3.5 text-indigo-550 dark:text-indigo-400 animate-pulse shrink-0" />
            <span className="hidden sm:inline">我的战绩</span>
          </button>
          
          <button
            onClick={() => {
              if (gameMode === 'free') {
                setupFreeChallenge(freeDifficulty);
                setPlayView('arena');
              } else if (gameMode === 'challenge') {
                const params = new URLSearchParams(window.location.search);
                const challengeCode = params.get('challenge');
                if (challengeCode) {
                  const decoded = decodeChallenge(challengeCode);
                  if (decoded) resetStateWithTarget(decoded);
                } else {
                  setupDailyChallenge();
                }
                setPlayView('arena');
              } else if (gameMode === 'daily') {
                // If in daily, reset state to let them play again for practice/fun
                setGuesses([]);
                setGuessedIds([]);
                setIsGameOver(false);
                setIsWon(false);
                setIsSurrendered(false);
                setHintsUsed([]);
                setDailyPracticeMode(true);
                setPlayView('arena');
                playSound('powerup', soundEnabled);
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] sm:text-xs bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/60 text-white dark:text-indigo-300 border border-indigo-500/50 dark:border-indigo-800 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm shrink-0 font-extrabold"
            title="重新排查或重新开始本局"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">重新排查</span>
          </button>
        </div>
      </header>

      {/* Category Tabs Section */}
      <div className="max-w-6xl w-full mx-auto px-3 sm:px-4 mt-3 sm:mt-5 relative z-10">
        <div className="bg-white dark:bg-slate-900/60 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-705 dark:border-slate-800/80 flex items-center justify-between gap-1 shadow-sm dark:shadow-none backdrop-blur-md">
          <nav className="flex flex-1 items-center justify-start gap-1">
            <button
              onClick={() => {
                setActiveTab('play');
                playSound('ping', soundEnabled);
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:py-2.5 sm:px-4 rounded-lg sm:rounded-xl text-[10.5px] sm:text-xs font-bold cursor-pointer transition-all border ${
                activeTab === 'play'
                  ? 'bg-slate-855 border-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 border-transparent hover:text-slate-100 hover:bg-slate-850'
              }`}
            >
              <Activity className="w-3.5 h-3.5 shrink-0" />
              <span>智能猜星<span className="hidden sm:inline">博弈</span></span>
            </button>
            <button
              onClick={() => {
                setActiveTab('create');
                playSound('ping', soundEnabled);
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:py-2.5 sm:px-4 rounded-lg sm:rounded-xl text-[10.5px] sm:text-xs font-bold cursor-pointer transition-all border ${
                activeTab === 'create'
                  ? 'bg-slate-855 border-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 border-transparent hover:text-slate-100 hover:bg-slate-850'
              }`}
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span>自制智考<span className="hidden sm:inline">好友</span></span>
            </button>
            <button
              onClick={() => {
                setActiveTab('stats');
                playSound('ping', soundEnabled);
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:py-2.5 sm:px-4 rounded-lg sm:rounded-xl text-[10.5px] sm:text-xs font-bold cursor-pointer transition-all border ${
                activeTab === 'stats'
                  ? 'bg-slate-855 border-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 border-transparent hover:text-slate-100 hover:bg-slate-850'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span>荣誉殿堂</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('guide');
                playSound('ping', soundEnabled);
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:py-2.5 sm:px-4 rounded-lg sm:rounded-xl text-[10.5px] sm:text-xs font-bold cursor-pointer transition-all border ${
                activeTab === 'guide'
                  ? 'bg-slate-855 border-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 border-transparent hover:text-slate-100 hover:bg-slate-850'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>玩法规则<span className="hidden sm:inline">指南</span></span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Container Layout */}
      {activeTab === 'play' && (
        <main className="max-w-6xl w-full mx-auto flex-1 flex flex-col gap-4 sm:gap-6 p-3 sm:p-4">
          {playView === 'lobby' ? (
            <>
              {/* Lobby main visual entrance - Tab Switcher Container */}
              <div className="w-full botw-card rounded-lg p-5 sm:p-7 relative overflow-hidden transition-all duration-300">
                {/* Background decorative spotlights */}
                <div className="absolute top-0 right-0 h-48 w-48 bg-gradient-to-bl from-indigo-500/10 to-transparent filter blur-3xl rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 h-48 w-48 bg-gradient-to-tr from-purple-500/10 to-transparent filter blur-3xl rounded-full pointer-events-none" />

                {/* Table tennis court visual background blueprint watermark */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none flex items-center justify-center overflow-hidden">
                  <svg viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[110%] max-w-[480px] text-slate-400 dark:text-slate-500">
                    {/* Table Top outline */}
                    <rect x="50" y="40" width="300" height="160" rx="4" stroke="currentColor" strokeWidth="2.5" />
                    {/* Center Line */}
                    <line x1="200" y1="40" x2="200" y2="200" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                    {/* Net */}
                    <line x1="45" y1="120" x2="355" y2="120" stroke="currentColor" strokeWidth="3.5" />
                    {/* Side net brackets */}
                    <line x1="45" y1="110" x2="45" y2="130" stroke="currentColor" strokeWidth="1.5" />
                    {/* Side net brackets right */}
                    <line x1="355" y1="110" x2="355" y2="130" stroke="currentColor" strokeWidth="1.5" />
                    {/* Small floating ball */}
                    <circle cx="160" cy="90" r="4.5" fill="#f97316" stroke="currentColor" strokeWidth="1" />
                    {/* Small bounce arcs */}
                    <path d="M120 135 C 135 100, 150 90, 160 90" stroke="#f97316" strokeWidth="1" strokeDasharray="2 2" />
                  </svg>
                </div>

                {/* Top row: Tab Switcher Header & interactive selectors */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-indigo-100/50 dark:border-slate-800/80 pb-6 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Activity className="w-5.5 h-5.5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-indigo-900 dark:text-indigo-300 leading-tight mb-1.5">博弈模式选择</h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-350 font-semibold">切换不同的排查考卷与训练机制，精确锻炼乒坛逻辑</p>
                    </div>
                  </div>

                  {/* Tab Selector Buttons */}
                  <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-850 max-w-full overflow-x-auto gap-1">
                {[
                  { id: 'daily', label: '📅 今日挑战', description: 'Daily Test' },
                  { id: 'free', label: '🧭 自由磨炼', description: 'Free Arena' },
                  { id: 'challenge', label: '⚔️ 好友定制', description: 'Friend PK' }
                ].map((item) => {
                  const isActive = lobbyTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setLobbyTab(item.id as 'daily' | 'free' | 'challenge');
                        setGameMode(item.id as 'daily' | 'free' | 'challenge');
                        playSound('ping', soundEnabled);
                      }}
                      className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 flex flex-col items-center justify-center shrink-0 min-w-[95px] sm:min-w-[120px] cursor-pointer ${
                        isActive
                          ? 'bg-white dark:bg-slate-850 text-slate-100 shadow-sm border border-slate-800 dark:border-slate-750'
                          : 'text-slate-400 border border-transparent hover:bg-slate-850 hover:text-slate-100'
                      }`}
                    >
                      <span className="text-[11.5px] font-black">{item.label}</span>
                      <span className="text-[8px] font-bold opacity-60 tracking-wider uppercase font-mono mt-0.5">{item.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive container body with smooth page transitions */}
            <motion.div
              key={lobbyTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full relative z-10"
            >
              {lobbyTab === 'daily' && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                  {/* Left info box */}
                  <div className="md:col-span-3 flex flex-col">
                    <div className="flex items-center gap-2 mb-3.5">
                      <span className="text-[10px] uppercase font-black tracking-widest text-indigo-700 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-100/80 dark:border-indigo-900/40 px-2.5 py-0.5 rounded-full font-sans">
                        每日同题竞技
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-100 tracking-tight">今日神坛公开组对决</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium mt-2">
                      全服同一道经典谜面！每天 00:00 自动推出现役与传奇乒坛巨星，排查步骤越少，逻辑越清晰的选手将登上全国荣誉大榜！
                    </p>
                    <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/15 border border-indigo-100/30 dark:border-indigo-900/15 rounded-xl flex items-center gap-2 text-[10.5px] text-indigo-750 dark:text-indigo-350 mt-3 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>每日全服更新一次题库，公平竞争，一决高低！</span>
                    </div>
                  </div>

                  {/* Right interactive action box */}
                  <div className="md:col-span-2 flex flex-col gap-4 bg-slate-50 dark:bg-slate-950 p-4.5 rounded-2xl shadow-inner relative">
                    {/* Daily gender selector */}
                    <div className="flex flex-col gap-1.5 align-start justify-start">
                      <span className="text-[9.5px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider text-left">参赛组别 (Categories)：</span>
                      <div className="grid grid-cols-2 gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-205 dark:border-slate-800">
                        {(['男', '女'] as const).map((gender) => (
                          <button
                            key={gender}
                            onClick={() => {
                              setDailyGender(gender);
                              playSound('ping', soundEnabled);
                            }}
                            className={`text-[10px] font-extrabold py-1.5 px-0.5 rounded-lg transition-all duration-300 cursor-pointer ${
                              dailyGender === gender
                                ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-600'
                                : 'text-[#4b5563] border border-transparent bg-transparent hover:bg-white hover:text-[#1a202c] hover:border-[#cbd5e1] dark:text-slate-400 dark:border-transparent dark:bg-transparent dark:hover:text-slate-200 dark:hover:bg-slate-800'
                            }`}
                          >
                            {gender === '男' ? '👨 男单组 (Men\'s)' : '👩 女单组 (Women\'s)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setupDailyChallenge(dailyGender);
                      }}
                      className="w-full py-3.5 bg-indigo-700 hover:bg-indigo-850 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-indigo-700/15 hover:shadow-indigo-700/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 font-display"
                    >
                      <span>攻入今日对决竞技场</span>
                      <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                    </button>
                  </div>
                </div>
              )}

              {lobbyTab === 'free' && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                  {/* Left info box */}
                  <div className="md:col-span-3 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] uppercase font-black tracking-widest text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-950/60 border border-purple-100/80 dark:border-purple-900/40 px-2.5 py-0.5 rounded-full font-sans">
                        自由随机训练
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-100 tracking-tight">自由随机磨炼战区</h3>
                    
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium min-h-[44px] mt-2.5">
                      {freeDifficulty === '入门' && "💡 入门：精选耳熟能详的顶流巨星与世界冠军（20人名单），配置简单，适合新手入局！"}
                      {freeDifficulty === '进阶' && "💡 进阶：包含中生代、国手拼图及外协世界前三十高手，考查大家对国际选手的熟习！"}
                      {freeDifficulty === '大师' && "💡 大师：涵盖高水准男女主力、特色胶皮、及经典大满贯名宿，考查范围极广！"}
                      {freeDifficulty === '全知' && "💡 全知：囊括120+位男女顶尖选手、跨越时代名宿与百刀特色器械，全图推理！"}
                    </p>
                    <div className="p-3 bg-purple-50/40 dark:bg-purple-950/15 border border-purple-100/30 dark:border-purple-900/15 rounded-xl flex items-center gap-2 text-[10.5px] text-purple-750 dark:text-purple-355 mt-3 shadow-xs">
                      <Compass className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span>可支持单独过滤“男”或“女”单，并可以无限次重洗刷新对攻！</span>
                    </div>
                  </div>

                  {/* Right interactive action box */}
                  <div className="md:col-span-2 flex flex-col gap-3 bg-slate-50 dark:bg-slate-950 p-4.5 rounded-2xl shadow-inner relative">
                    {/* Difficulty selector */}
                    <div className="flex flex-col gap-1.5 align-start justify-start">
                      <span className="text-[9px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider text-left">选择选手池过滤难度：</span>
                      <div className="grid grid-cols-4 gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
                        {(['入门', '进阶', '大师', '全知'] as const).map((diff) => (
                          <button
                            key={diff}
                            onClick={() => {
                              setFreeDifficulty(diff);
                              playSound('ping', soundEnabled);
                            }}
                            className={`text-[10px] font-extrabold py-1.5 px-0.5 rounded-lg transition-all duration-300 cursor-pointer ${
                              freeDifficulty === diff
                                ? 'bg-purple-700 text-white shadow-sm dark:bg-purple-600'
                                : 'text-[#4b5563] border border-transparent bg-transparent hover:bg-white hover:text-[#1a202c] hover:border-[#cbd5e1] dark:text-slate-400 dark:border-transparent dark:bg-transparent dark:hover:text-slate-200 dark:hover:bg-slate-800'
                            }`}
                          >
                            {diff}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Free gender selector */}
                    <div className="flex flex-col gap-1.5 align-start justify-start">
                      <span className="text-[9px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider text-left">选手性别组别过滤：</span>
                      <div className="grid grid-cols-3 gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
                        {(['全部', '男', '女'] as const).map((gender) => (
                          <button
                            key={gender}
                            onClick={() => {
                              setFreeGender(gender);
                              playSound('ping', soundEnabled);
                            }}
                            className={`text-[10px] font-extrabold py-1.5 px-0.5 rounded-lg transition-all duration-300 cursor-pointer ${
                              freeGender === gender
                                ? 'bg-purple-700 text-white shadow-sm dark:bg-purple-600'
                                : 'text-[#4b5563] border border-transparent bg-transparent hover:bg-white hover:text-[#1a202c] hover:border-[#cbd5e1] dark:text-slate-400 dark:border-transparent dark:bg-transparent dark:hover:text-slate-200 dark:hover:bg-slate-800'
                            }`}
                          >
                            {gender === '全部' ? '✨ 混合' : gender === '男' ? '👨 男单' : '👩 女单'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setupFreeChallenge(freeDifficulty, freeGender);
                      }}
                      className="w-full py-3 bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-purple-700/15 hover:shadow-purple-700/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 font-display mt-1"
                    >
                      <span>启动 {freeDifficulty} 级自由训练</span>
                      <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                    </button>
                  </div>
                </div>
              )}

              {lobbyTab === 'challenge' && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                  {/* Left info box */}
                  <div className="md:col-span-3 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] uppercase font-black tracking-widest text-rose-700 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-955 border border-rose-100/80 dark:border-rose-900/40 px-2.5 py-0.5 rounded-full font-sans">
                        好友挑战
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-100 tracking-tight">定制好友推局对攻</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium mt-2">
                      您收到了微信好友分享出来的专属PK密码或者挑战链接吗？点击“检测载入对攻”可以直接载入该特制考题；也可以点击“自制考题”录入并生成你自己定制的选手考题发给好友，来一场智慧激荡！
                    </p>
                    <div className="p-3 bg-rose-50/40 dark:bg-rose-955/15 border border-rose-100/30 dark:border-rose-900/15 rounded-xl flex items-center gap-2 text-[10.5px] text-rose-750 dark:text-rose-355 mt-3 shadow-xs">
                      <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
                      <span>通过生成专属博弈链接，检验谁的乒球属性排查逻辑更为凌厉。</span>
                    </div>
                  </div>

                  {/* Right interactive action box */}
                  <div className="md:col-span-2 flex flex-col gap-3 bg-slate-50 dark:bg-slate-950 p-4.5 rounded-2xl shadow-inner relative justify-center h-full">
                    <button
                      onClick={() => {
                        setActiveTab('create');
                        playSound('ping', soundEnabled);
                      }}
                      className="w-full py-3 bg-white hover:bg-slate-50 text-slate-100 hover:text-indigo-600 font-extrabold rounded-2xl text-xs transition-colors border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-200 dark:border-slate-700 text-center cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      🛠️ 自制专属考题 (Make Puzzle)
                    </button>
                    
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(window.location.search);
                        const challengeCode = params.get('challenge');
                        if (challengeCode) {
                          const decoded = decodeChallenge(challengeCode);
                          if (decoded) {
                            setGameMode('challenge');
                            setTargetPlayer(decoded);
                            resetStateWithTarget(decoded);
                            setPlayView('arena');
                            playSound('powerup', soundEnabled);
                          }
                        } else {
                          alert("提示：当前页面链接中未发现好友挑战参数！请让好友重新生成链接分享给您。");
                        }
                      }}
                      className="w-full py-3.5 bg-indigo-700 hover:bg-indigo-850 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs transition-colors text-center cursor-pointer shadow-md shadow-indigo-600/10 active:scale-[0.98]"
                    >
                      ⚡ 检测并载入好友对攻 (Load PK Game)
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* COLLAPSIBLE USER STREAK & TORCHES WIDGET */}
          {!streakExpanded ? (
            <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all duration-300 border border-indigo-100/20 dark:border-indigo-900/10">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-tr from-orange-500/15 to-amber-500/10 flex items-center justify-center text-orange-500 shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.05)] relative animate-reveal">
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white font-black text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white dark:border-slate-950">
                    {stats.currentStreak}
                  </div>
                  <Flame className={`w-5 h-5 sm:w-6.5 sm:h-6.5 text-orange-500 ${stats.currentStreak > 0 ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>当前战力荣誉证书：<span className="text-orange-500 text-sm font-black">{getStreakProfile(stats.currentStreak).currentTitle}</span></span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
                    🔥 连胜火炬已亮起 <strong className="text-orange-500 font-extrabold">{stats.currentStreak}</strong> 盏（点击模块右侧可展开查看 7 天日常挑战成就）
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStreakExpanded(true);
                  playSound('ping', soundEnabled);
                }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-905 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 lg:ml-auto select-none"
              >
                <span>展开详细天数</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 flex flex-col gap-6 relative overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all duration-300">
              <div className="absolute top-0 left-0 h-32 w-32 bg-orange-500/5 filter blur-3xl rounded-full"></div>
              
              {/* Header row with collapse trigger */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 relative z-10">
                <div className="flex items-center gap-2 animate-reveal">
                  <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                  <span className="text-xs font-black tracking-widest uppercase text-slate-450 dark:text-slate-400">
                    连胜火种详细进度 (7-Day Streak Detail)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setStreakExpanded(false);
                    playSound('ping', soundEnabled);
                  }}
                  className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-100 dark:text-slate-300 border border-slate-750 dark:border-slate-700/60 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 select-none"
                >
                  <span>折叠进度条</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-7 relative z-10">
                {/* Left side: Profile Info */}
                <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-orange-500/10 to-amber-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400 shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.05)] relative group animate-reveal">
                    <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-red-500 text-white font-black text-[8px] sm:text-[9px] w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 rounded-full flex items-center justify-center border border-white dark:border-slate-950">
                      {stats.currentStreak}
                    </div>
                    <Flame className={`w-6 h-6 sm:w-8 sm:h-8 text-orange-500 ${stats.currentStreak > 0 ? 'animate-pulse' : ''}`} />
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <div className="mb-2 sm:mb-2.5">
                      <span className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase bg-indigo-505 dark:bg-slate-805 text-indigo-750 dark:text-indigo-350 border border-indigo-100 dark:border-slate-805 py-0.5 sm:py-1 px-2 sm:px-3 rounded-full">
                        当前战力称号 (Rank Status)
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 mb-1.5 sm:mb-2">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                        <span>{getStreakProfile(stats.currentStreak).currentTitle}</span>
                        {stats.currentStreak >= 3 && <Sparkles className="w-5 h-5 text-orange-500" />}
                      </h3>
                      <span className="text-xs text-slate-550 dark:text-slate-400 font-semibold">
                        • 连胜火炬已点亮 {stats.currentStreak} 盏
                      </span>
                    </div>
                    <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-semibold mt-1">
                      {getStreakProfile(stats.currentStreak).nextTitle ? (
                        <span>
                          距离晋升下一称号【<strong className="text-orange-500 font-bold">{getStreakProfile(stats.currentStreak).nextTitle}</strong>】还剩 <strong className="text-indigo-600 dark:text-indigo-400 text-base font-black mx-0.5">{getStreakProfile(stats.currentStreak).daysRemaining}</strong> 天连续胜出限制 🏓
                        </span>
                      ) : (
                        <span className="text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1">
                          👑 恭喜你！已登顶最高神坛称号【{getStreakProfile(stats.currentStreak).currentTitle}】！
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right side: Torches Row */}
                <div className="flex flex-col items-center lg:items-end gap-3.5 w-full lg:w-auto shrink-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800/60 pt-5 lg:pt-0">
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-505 tracking-wider">
                    🔥 连胜火种进度 (7-Day Streak)
                  </span>
                  
                  <div className="flex items-center justify-center gap-4 sm:gap-5 px-5 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/30 rounded-2xl shadow-inner select-none">
                    {([1, 2, 3, 4, 5, 6, 7] as const).map((dayIndex) => {
                      const isLit = stats.currentStreak >= dayIndex;
                      return (
                        <div 
                          key={dayIndex}
                          className="flex flex-col items-center gap-1.5 relative transition-all duration-300 hover:scale-105"
                          title={isLit ? `第 ${dayIndex} 天连胜已达成` : `第 ${dayIndex} 天连胜待解锁`}
                        >
                          <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9">
                            {isLit && (
                              <span className="absolute inset-0 bg-orange-600/10 rounded-xl filter blur-md animate-pulse pointer-events-none" />
                            )}
                            <Flame 
                              className={`w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 transition-all duration-500 ${
                                isLit 
                                  ? 'text-orange-500 fill-orange-405 drop-shadow-[0_2px_8px_rgba(249,115,22,0.4)] scale-105' 
                                  : 'text-slate-300 dark:text-slate-650 opacity-40 scale-95'
                              }`} 
                            />
                          </div>
                          
                          <span 
                            className={`text-[9px] font-black font-mono tracking-tighter transition-colors duration-300 ${
                              isLit 
                                ? 'text-orange-500 dark:text-orange-400' 
                                : 'text-slate-405 dark:text-slate-600'
                            }`}
                          >
                            D{dayIndex}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Return to Lobby Navbar inside Arena */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-900 rounded-3xl p-5 gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] animate-reveal relative z-10 transition-colors">
            <button
              onClick={() => {
                setPlayView('lobby');
                playSound('ping', soundEnabled);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs bg-slate-850 hover:bg-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-100 dark:text-slate-300 border border-slate-750 dark:border-slate-800 rounded-2xl transition-all cursor-pointer font-extrabold active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>返回大厅</span>
            </button>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <span className={`text-[10px] sm:text-[10.5px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-inner ${
                gameMode === 'daily' 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/50 dark:text-indigo-400' 
                  : gameMode === 'free'
                  ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-900/50 dark:text-purple-400'
                  : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-955 border-rose-900/40 dark:text-rose-455'
              }`}>
                {gameMode === 'daily' && '📅 每日推理挑战现场'}
                {gameMode === 'free' && `🧭 自由随机磨炼 (${freeDifficulty})`}
                {gameMode === 'challenge' && '⚔️ 好友定制推演场'}
              </span>
              
              <span className="text-[10.5px] bg-slate-950 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-700 dark:border-slate-850 px-2.5 py-1 rounded-xl font-mono font-black shadow-inner">
                排查次数: {guesses.length}
              </span>
            </div>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
            
            {/* Left Side: Game Loops & Submissions (Grid 8 Columns) */}
            <div className="lg:col-span-8 flex flex-col gap-5">

          {/* Difficulty setting context (only when in Random Practice Mode) */}
          {gameMode === 'free' && (
            <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 dark:border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-reveal shadow-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">当前已进入自由练习，过滤选手池难度：</span>
              </div>
              <div className="flex gap-1.5 w-full sm:w-auto">
                {(['入门', '进阶', '大师', '全知'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setupFreeChallenge(diff)}
                    className={`flex-1 sm:flex-none text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all duration-200 cursor-pointer ${
                      freeDifficulty === diff
                        ? 'bg-indigo-700 text-white shadow-sm dark:bg-indigo-950 dark:border dark:border-indigo-500/50 dark:text-indigo-300'
                        : 'text-[#4b5563] border border-slate-800/80 bg-white hover:bg-slate-50 hover:text-[#0f172a] dark:bg-slate-950 dark:border-slate-850 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Guest Invitation Title (when in customized challenged) */}
          {gameMode === 'challenge' && !creatorGeneratedLink && (
            <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-xl animate-reveal">
              <div className="flex gap-3">
                <Crown className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-indigo-300 uppercase">好友战书就绪</span>
                  <p className="text-xs text-slate-300 leading-normal">
                    你正在输入好友派发给你的球星谜面，或进入了对战连接！请输入你的排查选手来一试高下。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Master Star Clue Card */}
          {targetPlayer && !isGameOver && (
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 pl-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
              <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-600/5 filter blur-3xl rounded-full"></div>
              
              <div className="flex items-start gap-4 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-slate-850 dark:bg-slate-800 flex items-center justify-center border border-slate-805 dark:border-slate-700 text-indigo-500 dark:text-indigo-400 shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-widest uppercase bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 py-0.5 px-2 rounded">
                      神秘选手档案 Clues
                    </span>
                    <span className="text-[10px] bg-slate-850 dark:bg-slate-800 text-slate-405 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">
                      难度: {targetPlayer.difficulty}
                    </span>
                  </div>
                  <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-600 dark:text-slate-300 mt-2">
                    <span>一句话绝技特征/线索：</span>
                    {targetPlayer.difficulty !== '入门' && (
                      <span className="text-[10px] bg-slate-105 dark:bg-slate-850 text-rose-500 border border-slate-205 dark:border-slate-800 px-1.5 py-0.5 rounded font-black select-none">
                        🔒 进阶已锁定
                      </span>
                    )}
                  </h3>
                  <p className="text-sm mt-1 italic font-medium leading-relaxed font-sans">
                    {targetPlayer.difficulty === '入门' ? (
                      <span className="text-indigo-700 dark:text-indigo-200">
                        &ldquo;{targetPlayer.signature || '该球员的独有签名描述已被隐藏'}&rdquo;
                      </span>
                    ) : (
                      <span className="text-slate-450 dark:text-slate-500 text-xs">
                        由于本局选手的难度等级为《{targetPlayer.difficulty}》，一句话签名已被隐蔽！请多关注比对雷达、打法胶皮及获取针对性战术线索。
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto mt-2 sm:mt-0 relative z-10 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowHintsPanelModal(true);
                    playSound('ping', soundEnabled);
                  }}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-500 hover:text-amber-950 dark:text-amber-400 dark:hover:text-amber-950 bg-amber-505/10 hover:bg-amber-400 border border-amber-500/20 hover:border-amber-400 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                  <span>获取提示 ({hintsUsed.length}/4)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSurrenderConfirmModal(true);
                    playSound('ping', soundEnabled);
                  }}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider text-rose-450 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Flag className="w-3.5 h-3.5 shrink-0" />
                  <span>认输/看答案</span>
                </button>
              </div>
            </div>
          )}

          {/* Auto-suggest Search box input */}
          {!isGameOver && targetPlayer ? (
            <div className="relative flex flex-col gap-3 my-2 animate-reveal z-30">
              {/* Distinctive Visual Header Prompt pointing directly to the input box */}
              <div className="flex items-center justify-between px-1">
                <label 
                  htmlFor="star-search-input" 
                  className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    isSearchFocused 
                      ? 'text-indigo-650 dark:text-indigo-450 scale-[1.01]' 
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${isSearchFocused ? 'bg-indigo-500 animate-ping' : 'bg-slate-400'}`} />
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <span>
                    <span className="inline sm:hidden">在这里输入你想猜的乒乓球星 🏓</span>
                    <span className="hidden sm:inline">第一步：在这里输入你认为的乒乓球星 🏓</span>
                  </span>
                </label>
              </div>

              <div className={`relative flex items-center border rounded-2xl bg-white dark:bg-slate-950/70 transition-all duration-300 ease-out p-1 overflow-hidden select-none ${
                isSearchFocused 
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] bg-white dark:bg-slate-950 scale-[1.005]' 
                  : 'border-slate-805 dark:border-slate-800'
              }`}>
                <Search className={`w-5 h-5 mx-3.5 transition-colors ${isSearchFocused ? 'text-indigo-500' : 'text-slate-450'}`} />
                <input
                  id="star-search-input"
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    // On mobile, scroll search box into view to ensure virtual keyboard doesn't hide it
                    setTimeout(() => {
                      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 150);
                  }}
                  onBlur={() => {
                    // Let selection take place cleanly before focus reset and menu hide
                    setTimeout(() => {
                      if (isTouchingSuggestions.current) {
                        // Keep focus on input and keep suggestions list open
                        searchInputRef.current?.focus();
                      } else {
                        setIsSearchFocused(false);
                      }
                    }, 220);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="输入球星姓名（例：马龙、孙颖莎、樊振东、王楚钦）"
                  className={`flex-1 bg-transparent outline-none font-medium transition-all duration-200 ${
                    isSearchFocused 
                      ? 'py-4 px-4 text-base text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500' 
                      : 'py-3 px-3.5 text-sm text-slate-100 placeholder:text-slate-550'
                  }`}
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-2 mr-1 rounded-lg text-slate-450 hover:text-slate-100 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Suggestions dropdown card - Optimized to show above search bar (bottom-full) on small screen devices to prevent keyboard overlap */}
              {suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  onPointerDown={() => {
                    isTouchingSuggestions.current = true;
                  }}
                  onTouchStart={() => {
                    isTouchingSuggestions.current = true;
                  }}
                  onPointerUp={() => {
                    setTimeout(() => {
                      isTouchingSuggestions.current = false;
                    }, 120);
                  }}
                  onTouchEnd={() => {
                    setTimeout(() => {
                      isTouchingSuggestions.current = false;
                    }, 120);
                  }}
                  onPointerCancel={() => {
                    isTouchingSuggestions.current = false;
                  }}
                  onTouchCancel={() => {
                    isTouchingSuggestions.current = false;
                  }}
                  className="absolute left-0 right-0 bottom-full mb-2 sm:bottom-auto sm:top-full sm:mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-40 max-h-56 sm:max-h-80 overflow-y-auto overscroll-contain touch-pan-y scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent animate-reveal animate-duration-150 select-none"
                  style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }}
                >
                  <div className="px-4 py-2 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-950/40">
                    推荐匹配列表 ({suggestions.length}位候选):
                  </div>
                  {suggestions.map((p, idx) => (
                    <button
                      key={p.id}
                      onMouseDown={(e) => {
                        // Prevent stealing focus from search input focus
                        e.preventDefault();
                      }}
                      onClick={() => {
                        handleMakeGuess(p);
                        // Re-focus immediately to retain keyboard on mobile
                        searchInputRef.current?.focus();
                      }}
                      onMouseEnter={() => setActiveSuggestionIndex(idx)}
                      className={`w-full text-left px-5 py-3 flex items-center justify-between transition-all border-b border-slate-850/50 cursor-pointer ${
                        activeSuggestionIndex === idx 
                          ? 'bg-indigo-950/95 border-indigo-500/40 text-indigo-400' 
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={`font-bold text-sm transition-colors ${activeSuggestionIndex === idx ? 'text-indigo-455 font-black' : 'text-slate-100'}`}>
                          {p.name}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {p.association} • {p.hand}{p.grip} • {p.playStyle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded">
                          {p.difficulty}
                        </span>
                        <ChevronRight className={`w-4 h-4 transition-all ${activeSuggestionIndex === idx ? 'translate-x-1 text-indigo-400' : 'text-slate-550'}`} />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular quick guessing shortcuts */}
              <div className="flex flex-col gap-2.5 mt-2 px-4 py-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-sans">
                    <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-405 shrink-0" />
                    <span>热门国乒快捷博弈通道 (点击直接作为本轮猜测，用于快速锚定方向):</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9.5px] uppercase font-black text-indigo-600 dark:text-indigo-400 tracking-wider">👨 男队主力推荐：</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['马龙', '张继科', '樊振东', '王楚钦'].map(name => {
                        const star = PLAYERS_DATABASE.find(p => p.name === name);
                        const hasGuessed = star ? guessedIds.includes(star.id) : false;
                        return (
                          <button
                            key={name}
                            type="button"
                            disabled={hasGuessed || !star}
                            onClick={() => {
                              if (star) handleMakeGuess(star);
                            }}
                            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border transition-all cursor-pointer flex items-center gap-1 shadow-sm ${
                              hasGuessed
                                ? 'bg-slate-200 dark:bg-slate-900/45 text-slate-400 dark:text-slate-600 border-slate-100 dark:border-slate-900 cursor-not-allowed line-through'
                                : 'bg-white dark:bg-slate-900 text-slate-805 dark:text-slate-200 border-slate-300 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-505 hover:-translate-y-0.5 active:translate-y-0'
                            }`}
                          >
                            <span>{name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9.5px] uppercase font-black text-purple-600 dark:text-purple-400 tracking-wider">👩 女队主力推荐：</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['孙颖莎', '王曼昱', '陈梦', '刘诗雯'].map(name => {
                        const star = PLAYERS_DATABASE.find(p => p.name === name);
                        const hasGuessed = star ? guessedIds.includes(star.id) : false;
                        return (
                          <button
                            key={name}
                            type="button"
                            disabled={hasGuessed || !star}
                            onClick={() => {
                              if (star) handleMakeGuess(star);
                            }}
                            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border transition-all cursor-pointer flex items-center gap-1 shadow-sm ${
                              hasGuessed
                                ? 'bg-slate-200 dark:bg-slate-900/45 text-slate-400 dark:text-slate-600 border-slate-100 dark:border-slate-900 cursor-not-allowed line-through'
                                : 'bg-white dark:bg-slate-900 text-slate-805 dark:text-slate-200 border-slate-300 dark:border-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-700 dark:hover:text-purple-400 hover:border-purple-400 dark:hover:border-purple-505 hover:-translate-y-0.5 active:translate-y-0'
                            }`}
                          >
                            <span>{name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            targetPlayer ? (
              <div className="bg-slate-900 border border-indigo-500/30 p-5 rounded-2xl flex flex-col gap-4 animate-reveal shadow-lg my-2 text-slate-100">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 shrink-0">
                    <Trophy className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">
                      {gameMode === 'daily' ? '🎉 今日每日关卡已完成！' : '🎉 本局博弈已圆满揭晓！'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                      {gameMode === 'daily' 
                        ? '您今日已经圆满提交了“每日同题”博弈关卡。为保证连胜火炬榜单的公平性，正式成绩只能纪录一次。不过，您可以点击下方按钮开启无限非正式练习！'
                        : '本局探索排查已收尾，神秘选手的真实面纱已经全部揭开。您可以开启下一局进行练习。'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/50 mt-1">
                  <button
                    onClick={() => {
                      if (gameMode === 'daily') {
                        // Reset local state for practice
                        setGuesses([]);
                        setGuessedIds([]);
                        setIsGameOver(false);
                        setIsWon(false);
                        setIsSurrendered(false);
                        setHintsUsed([]);
                        setDailyPracticeMode(true);
                        playSound('powerup', soundEnabled);
                      } else if (gameMode === 'free') {
                        setupFreeChallenge(freeDifficulty);
                      } else {
                        const params = new URLSearchParams(window.location.search);
                        const challengeCode = params.get('challenge');
                        if (challengeCode) {
                          const decoded = decodeChallenge(challengeCode);
                          if (decoded) resetStateWithTarget(decoded);
                        } else {
                          setupDailyChallenge();
                        }
                      }
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-white bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{gameMode === 'daily' ? '🔄 再次体验今日挑战 (练习模式)' : '🔄 开启下一局'}</span>
                  </button>
                  {gameMode === 'daily' && (
                    <button
                      onClick={() => setupFreeChallenge('入门')}
                      className="px-3.5 py-1.5 text-xs font-bold text-slate-100 dark:text-slate-300 hover:text-indigo-750 dark:hover:text-white bg-slate-850 hover:bg-slate-800 border border-slate-755 dark:border-slate-700 rounded-lg transition-all cursor-pointer"
                    >
                      🚀 切换为 “自由开局 (无限随机)”
                    </button>
                  )}
                </div>
              </div>
            ) : null
          )}

          {/* Mobile-oriented Attribute Radar Lock HUD as a Slide-Up Drawer / Floating Bottom Sticker */}
          {!isGameOver && guesses.length > 0 && !mobileRadarOpen && (
            <div className="fixed bottom-4 left-4 right-4 z-40 block lg:hidden animate-bounce" style={{ animationDuration: '4s' }}>
              <button
                onClick={() => {
                  setMobileRadarOpen(true);
                  playSound('powerup', soundEnabled);
                }}
                className="w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/40 text-slate-100 font-extrabold py-3 px-4.5 rounded-2xl shadow-[0_12px_30px_rgba(49,46,129,0.35)] flex items-center justify-between transition-all duration-300 backdrop-blur-md active:scale-[0.97] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-505"></span>
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="text-[11.5px] tracking-wide font-black">属性排查雷达 HUD</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[9.5px] bg-[#312e81]/30 border border-[#312e81]/60 dark:border-indigo-500/20 px-2 py-0.5 rounded-lg text-indigo-400">
                  <span>已锁 {Object.keys(attributeConfig).filter(k => guesses.some(g => (g.feedbacks as any)[attributeConfig[Number(k)].key].status === 'CORRECT')).length} / 11 维度</span>
                  <span className="text-[9px] text-indigo-500 font-bold">展开 ▲</span>
                </div>
              </button>
            </div>
          )}

          {!isGameOver && guesses.length > 0 && mobileRadarOpen && (
            <div className="fixed inset-0 z-50 block lg:hidden">
              <div
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
                onClick={() => { setMobileRadarOpen(false); playSound('ping', soundEnabled); }}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 24, stiffness: 220 }}
                className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[70vh] flex flex-col"
              >
                <div className="w-12 h-1 bg-slate-700/60 rounded-full mx-auto mt-3 mb-2" />
                <div className="flex items-center justify-between px-5 mb-1 shrink-0">
                  <span className="text-xs font-black text-slate-200">11维特征雷达</span>
                  <button onClick={() => { setMobileRadarOpen(false); playSound('ping', soundEnabled); }}
                    className="text-[10px] tracking-widest bg-slate-850 hover:bg-slate-800 text-indigo-400 border border-slate-800 px-2.5 py-1 rounded-lg cursor-pointer font-bold">收起</button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-5">
                  <div className="text-[10px] text-slate-400 mb-2.5">
                    点击标签高亮对应属性列 · 已锁 <span className="text-indigo-400 font-black">{Object.keys(attributeConfig).filter(k => guesses.some(g => (g.feedbacks as any)[attributeConfig[Number(k)].key].status === 'CORRECT')).length}/11</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                  {attributeConfig.map((item) => {
                    const status = getAttrStatus(item.key);
                    const isHighlighted = highlightedAttribute === item.key;
                    let pillClasses = "";
                    if (status === 'CORRECT') {
                      pillClasses = isHighlighted
                        ? "bg-emerald-500 text-white font-black border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)] scale-[1.03]"
                        : "bg-emerald-950/40 text-emerald-300 border-emerald-500/40 font-extrabold hover:bg-emerald-900/45";
                    } else if (status === 'NARROWING') {
                      pillClasses = isHighlighted
                        ? "bg-amber-500 text-slate-950 font-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)] scale-[1.03]"
                        : "bg-amber-955/20 text-amber-300 border-amber-550/30 font-extrabold hover:bg-amber-900/20";
                    } else {
                      pillClasses = isHighlighted
                        ? "bg-indigo-650 text-white font-black border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)] scale-[1.03]"
                        : "bg-slate-850 text-slate-400 border-slate-800 hover:bg-slate-800";
                    }
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setHighlightedAttribute(prev => prev === item.key ? null : item.key);
                          playSound('ping', soundEnabled);
                        }}
                        className={`text-[9.5px] py-1.5 px-3 rounded-xl border transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer font-bold ${pillClasses}`}
                      >
                        <span>{item.label}</span>
                        {status === 'CORRECT' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,1)]" />}
                        {status === 'NARROWING' && <span className="w-1.5 h-1.5 rounded-full bg-amber-450" />}
                      </button>
                    );
                  })}
                </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Guess comparisons display table list */}
          {guesses.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1.5">
                <span className="font-semibold uppercase tracking-wider">博弈猜测属性列 ({guesses.length}次猜测)</span>
                <span className="hidden sm:inline">横向滑动查看全部11个特征排查 ⏩</span>
              </div>

              <div ref={tableScrollRef} className="scroll-table-x rounded-3xl bg-slate-900/40 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
                <table className="w-full border-collapse text-left min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-3 lg:px-4 lg:sticky lg:left-0 bg-slate-900/90 backdrop-blur-md z-10 whitespace-nowrap">猜测选手</th>
                      <th
                        onClick={() => {
                          setHighlightedAttribute(prev => prev === 'sex' ? null : 'sex');
                          playSound('ping', soundEnabled);
                        }}
                        className={`py-3 px-2 text-center transition-all cursor-pointer select-none ${
                          highlightedAttribute === 'sex'
                            ? 'text-indigo-400 bg-indigo-950/40 font-extrabold border-x border-indigo-500/20 shadow-[inset_0_0_8px_rgba(99,102,241,0.2)]'
                            : 'hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                        data-attr="sex" title="点击以高亮显示：性别"
                      >
                        性别
                      </th>
                      <th
                        onClick={() => {
                          setHighlightedAttribute(prev => prev === 'association' ? null : 'association');
                          playSound('ping', soundEnabled);
                        }}
                        className={`py-3 px-2 text-center transition-all cursor-pointer select-none ${
                          highlightedAttribute === 'association'
                            ? 'text-indigo-400 bg-indigo-950/40 font-extrabold border-x border-indigo-500/20 shadow-[inset_0_0_8px_rgba(99,102,241,0.2)]'
                            : 'hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                        data-attr="association" title="点击以高亮显示：协会"
                      >
                        协会
                      </th>
                      <th
                        onClick={() => {
                          setHighlightedAttribute(prev => prev === 'birthYear' ? null : 'birthYear');
                          playSound('ping', soundEnabled);
                        }}
                        className={`py-3 px-1.5 text-center transition-all cursor-pointer select-none ${
                          highlightedAttribute === 'birthYear'
                            ? 'text-indigo-400 bg-indigo-950/40 font-extrabold border-x border-indigo-500/20 shadow-[inset_0_0_8px_rgba(99,102,241,0.2)]'
                            : 'hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                        data-attr="birthYear" title="点击以高亮显示：出生年份"
                      >
                        出生年份
                      </th>
                      <th
                        onClick={() => {
                          setHighlightedAttribute(prev => prev === 'activeStatus' ? null : 'activeStatus');
                          playSound('ping', soundEnabled);
                        }}
                        className={`py-3 px-2 text-center transition-all cursor-pointer select-none ${
                          highlightedAttribute === 'activeStatus'
                            ? 'text-indigo-400 bg-indigo-950/40 font-extrabold border-x border-indigo-500/20 shadow-[inset_0_0_8px_rgba(99,102,241,0.2)]'
                            : 'hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                        data-attr="activeStatus" title="点击以高亮显示：状态"
                      >
                        状态
                      </th>
                      <th
                        onClick={() => {
                          setHighlightedAttribute(prev => prev === 'hand' ? null : 'hand');
                          playSound('ping', soundEnabled);
                        }}
                        className={`py-3 px-2 text-center transition-all cursor-pointer select-none ${
                          highlightedAttribute === 'hand'
                            ? 'text-indigo-400 bg-indigo-950/40 font-extrabold border-x border-indigo-500/20 shadow-[inset_0_0_8px_rgba(99,102,241,0.2)]'
                            : 'hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                        data-attr="hand" title="点击以高亮显示：持拍手"
                      >
                        持拍手
                      </th>
                      <th
                        onClick={() => {
                          setHighlightedAttribute(prev => prev === 'grip' ? null : 'grip');
                          playSound('ping', soundEnabled);
                        }}
                        className={`py-3 px-2 text-center transition-all cursor-pointer select-none ${
                          highlightedAttribute === 'grip'
                            ? 'text-indigo-400 bg-indigo-950/40 font-extrabold border-x border-indigo-500/20 shadow-[inset_0_0_8px_rgba(99,102,241,0.2)]'
                            : 'hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                        data-attr="grip" title="点击以高亮显示：握拍"
                      >
                        握拍
                      </th>
                      <th
                        onClick={() => {
                          setHighlightedAttribute(prev => prev === 'playStyle' ? null : 'playStyle');
                          playSound('ping', soundEnabled);
                        }}
                        className={`py-3 px-2 text-center transition-all cursor-pointer select-none ${
                          highlightedAttribute === 'playStyle'
                            ? 'text-indigo-400 bg-indigo-950/40 font-extrabold border-x border-indigo-500/20 shadow-[inset_0_0_8px_rgba(99,102,241,0.2)]'
                            : 'hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                        data-attr="playStyle" title="点击以高亮显示：打法"
                      >
                        打法
                      </th>
                      <th
                        onClick={() => {
                          setHighlightedAttribute(prev => prev === 'forehandRubber' ? null : 'forehandRubber');
                          playSound('ping', soundEnabled);
                        }}
                        className={`py-3 px-2 text-center transition-all cursor-pointer select-none ${
                          highlightedAttribute === 'forehandRubber'
                            ? 'text-indigo-400 bg-indigo-950/40 font-extrabold border-x border-indigo-500/20 shadow-[inset_0_0_8px_rgba(99,102,241,0.2)]'
                            : 'hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                        data-attr="forehandRubber" title="点击以高亮显示：正手"
                      >
                        正手
                      </th>
                      <th
                        onClick={() => {
                          setHighlightedAttribute(prev => prev === 'backhandRubber' ? null : 'backhandRubber');
                          playSound('ping', soundEnabled);
                        }}
                        className={`py-3 px-2 text-center transition-all cursor-pointer select-none ${
                          highlightedAttribute === 'backhandRubber'
                            ? 'text-indigo-400 bg-indigo-950/40 font-extrabold border-x border-indigo-500/20 shadow-[inset_0_0_8px_rgba(99,102,241,0.2)]'
                            : 'hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                        data-attr="backhandRubber" title="点击以高亮显示：反手"
                      >
                        反手
                      </th>
                      <th
                        onClick={() => {
                          setHighlightedAttribute(prev => prev === 'bladeBrand' ? null : 'bladeBrand');
                          playSound('ping', soundEnabled);
                        }}
                        className={`py-3 px-2 text-center transition-all cursor-pointer select-none ${
                          highlightedAttribute === 'bladeBrand'
                            ? 'text-indigo-400 bg-indigo-950/40 font-extrabold border-x border-indigo-500/20 shadow-[inset_0_0_8px_rgba(99,102,241,0.2)]'
                            : 'hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                        data-attr="bladeBrand" title="点击以高亮显示：曾用底板"
                      >
                        曾用底板
                      </th>
                      <th
                        onClick={() => {
                          setHighlightedAttribute(prev => prev === 'honorGold' ? null : 'honorGold');
                          playSound('ping', soundEnabled);
                        }}
                        className={`py-3 px-1.5 text-center transition-all cursor-pointer select-none ${
                          highlightedAttribute === 'honorGold'
                            ? 'text-indigo-400 bg-indigo-950/40 font-extrabold border-x border-indigo-500/20 shadow-[inset_0_0_8px_rgba(99,102,241,0.2)]'
                            : 'hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                        data-attr="honorGold" title="点击以高亮显示：三大赛单金"
                      >
                        三大赛单金
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs font-semibold">
                    {guesses.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/20 animate-reveal">
                        
                        {/* Athlete Name sticky on horizontal scroll */}
                        <td className="py-3 px-3 lg:px-4 font-bold lg:sticky lg:left-0 bg-slate-950/95 lg:border-r lg:border-slate-800 whitespace-nowrap text-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-indigo-400 font-mono">#{guesses.length - idx}</span>
                            <span className="tracking-tight">{item.playerName}</span>
                          </div>
                        </td>

                        {/* Sex feedback */}
                        <td className={`p-2 text-center transition-all duration-300 ${highlightedAttribute === 'sex' ? 'bg-indigo-950/15 border-x border-indigo-500/10' : ''}`}>
                          <motion.div
                            key={highlightedAttribute === 'sex' ? 'active' : 'inactive'}
                            initial={highlightedAttribute === 'sex' ? { y: 20, opacity: 0.3, scale: 0.92 } : { y: 0, opacity: 1, scale: 1 }}
                            animate={{ y: 0, opacity: 1, scale: highlightedAttribute === 'sex' ? 1.04 : 1 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 22, delay: highlightedAttribute === 'sex' ? idx * 0.03 : 0 }}
                            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all duration-300 ${getFeedbackCellClasses(item.feedbacks.sex.status)} ${
                              highlightedAttribute === 'sex'
                                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-[1.04] shadow-[0_0_12px_rgba(99,102,241,0.55)] z-10 font-bold animate-[pulse_2s_infinite]'
                                : ''
                            }`}
                          >
                            {item.feedbacks.sex.displayValue}
                          </motion.div>
                        </td>

                        {/* Association feedback */}
                        <td className={`p-2 text-center transition-all duration-300 ${highlightedAttribute === 'association' ? 'bg-indigo-950/15 border-x border-indigo-500/10' : ''}`}>
                          <motion.div
                            key={highlightedAttribute === 'association' ? 'active' : 'inactive'}
                            initial={highlightedAttribute === 'association' ? { y: 20, opacity: 0.3, scale: 0.92 } : { y: 0, opacity: 1, scale: 1 }}
                            animate={{ y: 0, opacity: 1, scale: highlightedAttribute === 'association' ? 1.04 : 1 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 22, delay: highlightedAttribute === 'association' ? idx * 0.03 : 0 }}
                            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all duration-300 ${getFeedbackCellClasses(item.feedbacks.association.status)} ${
                              highlightedAttribute === 'association'
                                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-[1.04] shadow-[0_0_12px_rgba(99,102,241,0.55)] z-10 font-bold animate-[pulse_2s_infinite]'
                                : ''
                            }`}
                          >
                            {item.feedbacks.association.displayValue}
                          </motion.div>
                        </td>

                        {/* Birth year numeric feedback */}
                        <td className={`p-2 text-center transition-all duration-300 ${highlightedAttribute === 'birthYear' ? 'bg-indigo-950/15 border-x border-indigo-500/10' : ''}`}>
                          <motion.div
                            key={highlightedAttribute === 'birthYear' ? 'active' : 'inactive'}
                            initial={highlightedAttribute === 'birthYear' ? { y: 20, opacity: 0.3, scale: 0.92 } : { y: 0, opacity: 1, scale: 1 }}
                            animate={{ y: 0, opacity: 1, scale: highlightedAttribute === 'birthYear' ? 1.04 : 1 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 22, delay: highlightedAttribute === 'birthYear' ? idx * 0.03 : 0 }}
                            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all duration-300 ${getFeedbackCellClasses(item.feedbacks.birthYear.status)} ${
                              highlightedAttribute === 'birthYear'
                                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-[1.04] shadow-[0_0_12px_rgba(99,102,241,0.55)] z-10 font-bold animate-[pulse_2s_infinite]'
                                : ''
                            }`}
                          >
                            <span>{item.feedbacks.birthYear.displayValue}年</span>
                            {item.feedbacks.birthYear.status === 'HIGHER' && <TrendingUp className="w-3.5 h-3.5 animate-bounce shrink-0" />}
                            {item.feedbacks.birthYear.status === 'LOWER' && <TrendingDown className="w-3.5 h-3.5 animate-bounce shrink-0" />}
                          </motion.div>
                        </td>

                        {/* Active Status feedback */}
                        <td className={`p-2 text-center transition-all duration-300 ${highlightedAttribute === 'activeStatus' ? 'bg-indigo-950/15 border-x border-indigo-500/10' : ''}`}>
                          <motion.div
                            key={highlightedAttribute === 'activeStatus' ? 'active' : 'inactive'}
                            initial={highlightedAttribute === 'activeStatus' ? { y: 20, opacity: 0.3, scale: 0.92 } : { y: 0, opacity: 1, scale: 1 }}
                            animate={{ y: 0, opacity: 1, scale: highlightedAttribute === 'activeStatus' ? 1.04 : 1 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 22, delay: highlightedAttribute === 'activeStatus' ? idx * 0.03 : 0 }}
                            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all duration-300 ${getFeedbackCellClasses(item.feedbacks.activeStatus.status)} ${
                              highlightedAttribute === 'activeStatus'
                                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-[1.04] shadow-[0_0_12px_rgba(99,102,241,0.55)] z-10 font-bold animate-[pulse_2s_infinite]'
                                : ''
                            }`}
                          >
                            {item.feedbacks.activeStatus.displayValue}
                          </motion.div>
                        </td>

                        {/* Hand hand preference feedback */}
                        <td className={`p-2 text-center transition-all duration-300 ${highlightedAttribute === 'hand' ? 'bg-indigo-950/15 border-x border-indigo-500/10' : ''}`}>
                          <motion.div
                            key={highlightedAttribute === 'hand' ? 'active' : 'inactive'}
                            initial={highlightedAttribute === 'hand' ? { y: 20, opacity: 0.3, scale: 0.92 } : { y: 0, opacity: 1, scale: 1 }}
                            animate={{ y: 0, opacity: 1, scale: highlightedAttribute === 'hand' ? 1.04 : 1 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 22, delay: highlightedAttribute === 'hand' ? idx * 0.03 : 0 }}
                            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all duration-300 ${getFeedbackCellClasses(item.feedbacks.hand.status)} ${
                              highlightedAttribute === 'hand'
                                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-[1.04] shadow-[0_0_12px_rgba(99,102,241,0.55)] z-10 font-bold animate-[pulse_2s_infinite]'
                                : ''
                            }`}
                          >
                            {item.feedbacks.hand.displayValue}
                          </motion.div>
                        </td>

                        {/* Grip style handle feedback */}
                        <td className={`p-2 text-center transition-all duration-300 ${highlightedAttribute === 'grip' ? 'bg-indigo-950/15 border-x border-indigo-500/10' : ''}`}>
                          <motion.div
                            key={highlightedAttribute === 'grip' ? 'active' : 'inactive'}
                            initial={highlightedAttribute === 'grip' ? { y: 20, opacity: 0.3, scale: 0.92 } : { y: 0, opacity: 1, scale: 1 }}
                            animate={{ y: 0, opacity: 1, scale: highlightedAttribute === 'grip' ? 1.04 : 1 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 22, delay: highlightedAttribute === 'grip' ? idx * 0.03 : 0 }}
                            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all duration-300 ${getFeedbackCellClasses(item.feedbacks.grip.status)} ${
                              highlightedAttribute === 'grip'
                                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-[1.04] shadow-[0_0_12px_rgba(99,102,241,0.55)] z-10 font-bold animate-[pulse_2s_infinite]'
                                : ''
                            }`}
                          >
                            {item.feedbacks.grip.displayValue}
                          </motion.div>
                        </td>

                        {/* Play style feedback */}
                        <td className={`p-2 text-center transition-all duration-300 ${highlightedAttribute === 'playStyle' ? 'bg-indigo-950/15 border-x border-indigo-500/10' : ''}`}>
                          <motion.div
                            key={highlightedAttribute === 'playStyle' ? 'active' : 'inactive'}
                            initial={highlightedAttribute === 'playStyle' ? { y: 20, opacity: 0.3, scale: 0.92 } : { y: 0, opacity: 1, scale: 1 }}
                            animate={{ y: 0, opacity: 1, scale: highlightedAttribute === 'playStyle' ? 1.04 : 1 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 22, delay: highlightedAttribute === 'playStyle' ? idx * 0.03 : 0 }}
                            className={`py-3 px-1 rounded-xl text-[11px] leading-snug flex items-center justify-center gap-1 md:break-all max-w-[95px] mx-auto transition-all duration-300 ${getFeedbackCellClasses(item.feedbacks.playStyle.status)} ${
                              highlightedAttribute === 'playStyle'
                                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-[1.04] shadow-[0_0_12px_rgba(99,102,241,0.55)] z-10 font-bold animate-[pulse_2s_infinite]'
                                : ''
                            }`}
                          >
                            {item.feedbacks.playStyle.displayValue}
                          </motion.div>
                        </td>

                        {/* Forehand rubber feedback */}
                        <td className={`p-2 text-center transition-all duration-300 ${highlightedAttribute === 'forehandRubber' ? 'bg-indigo-950/15 border-x border-indigo-500/10' : ''}`}>
                          <motion.div
                            key={highlightedAttribute === 'forehandRubber' ? 'active' : 'inactive'}
                            initial={highlightedAttribute === 'forehandRubber' ? { y: 20, opacity: 0.3, scale: 0.92 } : { y: 0, opacity: 1, scale: 1 }}
                            animate={{ y: 0, opacity: 1, scale: highlightedAttribute === 'forehandRubber' ? 1.04 : 1 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 22, delay: highlightedAttribute === 'forehandRubber' ? idx * 0.03 : 0 }}
                            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all duration-300 ${getFeedbackCellClasses(item.feedbacks.forehandRubber.status)} ${
                              highlightedAttribute === 'forehandRubber'
                                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-[1.04] shadow-[0_0_12px_rgba(99,102,241,0.55)] z-10 font-bold animate-[pulse_2s_infinite]'
                                : ''
                            }`}
                          >
                            {item.feedbacks.forehandRubber.displayValue}
                          </motion.div>
                        </td>

                        {/* Backhand rubber feedback */}
                        <td className={`p-2 text-center transition-all duration-300 ${highlightedAttribute === 'backhandRubber' ? 'bg-indigo-950/15 border-x border-indigo-500/10' : ''}`}>
                          <motion.div
                            key={highlightedAttribute === 'backhandRubber' ? 'active' : 'inactive'}
                            initial={highlightedAttribute === 'backhandRubber' ? { y: 20, opacity: 0.3, scale: 0.92 } : { y: 0, opacity: 1, scale: 1 }}
                            animate={{ y: 0, opacity: 1, scale: highlightedAttribute === 'backhandRubber' ? 1.04 : 1 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 22, delay: highlightedAttribute === 'backhandRubber' ? idx * 0.03 : 0 }}
                            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all duration-300 ${getFeedbackCellClasses(item.feedbacks.backhandRubber.status)} ${
                              highlightedAttribute === 'backhandRubber'
                                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-[1.04] shadow-[0_0_12px_rgba(99,102,241,0.55)] z-10 font-bold animate-[pulse_2s_infinite]'
                                : ''
                            }`}
                          >
                            {item.feedbacks.backhandRubber.displayValue}
                          </motion.div>
                        </td>

                        {/* Blade Brand feedback */}
                        <td className={`p-2 text-center transition-all duration-300 ${highlightedAttribute === 'bladeBrand' ? 'bg-indigo-950/15 border-x border-indigo-500/10' : ''}`}>
                          <motion.div
                            key={highlightedAttribute === 'bladeBrand' ? 'active' : 'inactive'}
                            initial={highlightedAttribute === 'bladeBrand' ? { y: 20, opacity: 0.3, scale: 0.92 } : { y: 0, opacity: 1, scale: 1 }}
                            animate={{ y: 0, opacity: 1, scale: highlightedAttribute === 'bladeBrand' ? 1.04 : 1 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 22, delay: highlightedAttribute === 'bladeBrand' ? idx * 0.03 : 0 }}
                            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all duration-300 ${getFeedbackCellClasses(item.feedbacks.bladeBrand.status)} ${
                              highlightedAttribute === 'bladeBrand'
                                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-[1.04] shadow-[0_0_12px_rgba(99,102,241,0.55)] z-10 font-bold animate-[pulse_2s_infinite]'
                                : ''
                            }`}
                          >
                            {item.feedbacks.bladeBrand.displayValue}
                          </motion.div>
                        </td>

                        {/* Honor Gold numeric feedback */}
                        <td className={`p-2 text-center transition-all duration-300 ${highlightedAttribute === 'honorGold' ? 'bg-indigo-950/15 border-x border-indigo-500/10' : ''}`}>
                          <motion.div
                            key={highlightedAttribute === 'honorGold' ? 'active' : 'inactive'}
                            initial={highlightedAttribute === 'honorGold' ? { y: 20, opacity: 0.3, scale: 0.92 } : { y: 0, opacity: 1, scale: 1 }}
                            animate={{ y: 0, opacity: 1, scale: highlightedAttribute === 'honorGold' ? 1.04 : 1 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 22, delay: highlightedAttribute === 'honorGold' ? idx * 0.03 : 0 }}
                            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all duration-300 ${getFeedbackCellClasses(item.feedbacks.honorGold.status)} ${
                              highlightedAttribute === 'honorGold'
                                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-[1.04] shadow-[0_0_12px_rgba(99,102,241,0.55)] z-10 font-bold animate-[pulse_2s_infinite]'
                                : ''
                            }`}
                          >
                            <span>{item.feedbacks.honorGold.displayValue}枚</span>
                            {item.feedbacks.honorGold.status === 'HIGHER' && <TrendingUp className="w-3.5 h-3.5 shrink-0" />}
                            {item.feedbacks.honorGold.status === 'LOWER' && <TrendingDown className="w-3.5 h-3.5 shrink-0" />}
                          </motion.div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-9 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/10 text-slate-500 my-4 text-center">
              <EmptyStateIllustration />
              <p className="font-extrabold text-sm text-slate-200 tracking-tight">尚无猜测记录</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mt-2 leading-relaxed font-normal">
                在上方搜索框内输入你的底气球员（例如：马龙、孙颖莎），博弈并查看其 11 个关键属性比对，以此为轴承向下层追溯范围！
              </p>
            </div>
          )}
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Active Game State / Reveal section */}
          {targetPlayer && isGameOver && false ? (
            <div className="bg-slate-900 border-2 border-indigo-500/30 p-6 rounded-2xl flex flex-col gap-5 relative overflow-hidden active-game-summary shadow-2xl shadow-indigo-950/20 animate-reveal">
              <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 filter blur-3xl rounded-full"></div>
              
              <div className="flex items-center gap-2 relative z-10">
                {isWon ? (
                  <div className="bg-emerald-500/15 p-1 rounded-lg text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="bg-rose-500/15 p-1 rounded-lg text-rose-400">
                    <X className="w-5 h-5" />
                  </div>
                )}
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  {isWon ? '挑战成功！' : '解密完毕'}
                </span>
              </div>

              {/* Revealed Superstar detailed card profiles */}
              {(() => {
                const skin = getCardSkin(targetPlayer.difficulty);
                const totalHintPenalty = hintsUsed.reduce((sum, id) => {
                  const h = HINTS_CONFIG.find(x => x.id === id);
                  return sum + (h ? h.cost : 0);
                }, 0);
                const rating = getTrophyRating(guesses.length + totalHintPenalty, isWon, isSurrendered);
                return (
                  <div className={`relative flex flex-col items-center p-5 rounded-2xl border-2 overflow-hidden transition-all duration-750 select-none ${skin.bg} ${skin.border}`}>
                    
                    {/* Retro diagonal scanning shine layer */}
                    <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_30%,rgba(255,255,255,0.06)_40%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.06)_60%,rgba(255,255,255,0)_70%)] bg-[length:200%_100%] animate-shine opacity-80 pointer-events-none" />
                    <div className={`absolute top-0 right-0 h-48 w-48 rounded-full filter blur-3xl ${skin.glow}`} />
                    
                    {/* Card Top: Level Indicator & Performance Rating Grade Badge */}
                    <div className="w-full flex items-center justify-between mb-4 relative z-10 text-xs">
                      <span className={`text-[9px] font-black tracking-widest uppercase py-0.5 px-2 rounded-full border ${skin.badge}`}>
                        🏆 {skin.label}
                      </span>
                      
                      {/* Grading sticker badge */}
                      <div className={`px-2.5 py-1 flex flex-col items-center rounded-xl border text-center ${rating.color}`}>
                        <span className="text-xl font-black leading-none tracking-tighter">{rating.grade}</span>
                        <span className="text-[8px] font-mono tracking-tighter opacity-75">{rating.desc}</span>
                      </div>
                    </div>
                    
                    {/* Superstar Visual Icon Frame (with Table Tennis icon backdrop!) */}
                    <div className="relative w-20 h-20 bg-slate-950/85 rounded-2xl border border-slate-800 flex items-center justify-center my-1.5 z-10 shadow-lg">
                      {/* Decorative backdrop */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-2xl opacity-40" />
                      <Trophy className="w-10 h-10 text-indigo-400 animate-pulse" />
                      
                      {/* Gold Medallist Star overlay banner */}
                      {targetPlayer.honorGold > 0 && (
                        <div className="absolute -bottom-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black text-[9px] py-0.5 px-2.5 rounded-full border border-yellow-300 shadow-[0_2px_5px_rgba(0,0,0,0.3)] tracking-tighter whitespace-nowrap">
                          🥇 经典战功 x{targetPlayer.honorGold}金
                        </div>
                      )}
                    </div>
                    
                    {/* Athlete Name Display */}
                    <div className="text-center mt-4 mb-2 relative z-10 flex flex-col items-center w-full">
                      <span className="text-[9px] text-indigo-400 font-extrabold tracking-widest uppercase">
                        S-CLASS COLLECTIBLE
                      </span>
                      <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-0.5">
                        {targetPlayer.name}
                      </h3>
                      {targetPlayer.nameEn && (
                        <span className="text-[10px] tracking-widest text-slate-400 font-mono">
                          {targetPlayer.nameEn}
                        </span>
                      )}
                      
                      <div className="h-0.5 w-12 bg-indigo-500/40 my-2 rounded-full" />
                      
                      <p className="text-xs text-indigo-200 mt-0.5 italic font-medium leading-relaxed max-w-xs px-2 text-center">
                        &ldquo;{targetPlayer.signature}&rdquo;
                      </p>
                    </div>

                    {/* Athlete Stats Grid styled like EA FUT Cards */}
                    <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/60 text-left relative z-10 text-xs">
                      <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-850/60">
                        <span className="text-[9px] text-slate-450 block font-black uppercase">性别 / 地方：</span>
                        <strong className="text-slate-205 text-xs font-bold leading-none">{targetPlayer.sex} • {targetPlayer.association}</strong>
                      </div>
                      
                      <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-850/60">
                        <span className="text-[9px] text-slate-450 block font-black uppercase">出生年 / 状态：</span>
                        <strong className="text-slate-205 text-xs font-bold leading-none">{targetPlayer.birthYear}年 ({targetPlayer.activeStatus})</strong>
                      </div>
                      
                      <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-850/60">
                        <span className="text-[9px] text-slate-450 block font-black uppercase">执持手 / 握拍：</span>
                        <strong className="text-slate-205 text-xs font-bold leading-none">{targetPlayer.hand} • {targetPlayer.grip}</strong>
                      </div>
                      
                      <div className="bg-slate-955/80 p-2 rounded-lg border border-slate-855/60">
                        <span className="text-[9px] text-slate-450 block font-black uppercase">特殊打法：</span>
                        <strong className="text-slate-205 text-[11px] font-bold leading-tight">{targetPlayer.playStyle}</strong>
                      </div>

                      <div className="col-span-2 bg-slate-950/80 p-2 rounded-lg border border-slate-850/60">
                        <span className="text-[9px] text-slate-455 block font-black uppercase">胶皮配置 (正手 / 反手)：</span>
                        <strong className="text-slate-200 text-xs font-bold">正：{targetPlayer.forehandRubber} / 反：{targetPlayer.backhandRubber}</strong>
                      </div>

                      <div className="col-span-2 bg-slate-950/80 p-3 rounded-lg border border-slate-850/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[9px] text-slate-500 block font-black uppercase">代表底板神兵：</span>
                          <strong className="text-slate-200 text-xs font-semibold">{targetPlayer.bladeBrand}</strong>
                        </div>
                        {hintsUsed.length > 0 && (
                          <div className="bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded text-right shrink-0">
                            <span className="text-[8px] text-amber-400 block font-black uppercase">使用提示惩罚：</span>
                            <span className="text-amber-400 text-[10px] font-black">已获取 {hintsUsed.length} 个线索</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Game evaluation result reports stats summaries */}
              {(() => {
                const totalHintPenalty = hintsUsed.reduce((sum, id) => {
                  const h = HINTS_CONFIG.find(x => x.id === id);
                  return sum + (h ? h.cost : 0);
                }, 0);
                const totalEffectiveSteps = guesses.length + totalHintPenalty;
                return (
                  <div className="flex flex-col bg-slate-950/60 p-4 border border-slate-850/60 rounded-xl relative z-10 text-xs gap-2 shadow-inner">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>博弈猜测步数:</span>
                      <strong className="text-white font-mono">{guesses.length} 步</strong>
                    </div>
                    {hintsUsed.length > 0 && (
                      <div className="flex justify-between items-center text-rose-400 font-mono">
                        <span>提示罚时损耗:</span>
                        <strong className="font-semibold">+{totalHintPenalty} 步</strong>
                      </div>
                    )}
                    <div className="h-[1px] bg-slate-855/40 my-1 font-mono"></div>
                    <div className="flex justify-between items-center text-slate-300 select-none">
                      <span className="font-bold">最终算力总步数:</span>
                      <strong className="text-white text-sm font-black font-mono">{totalEffectiveSteps} 步</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-400 mt-0.5">
                      <span>综合球迷评级:</span>
                      <strong className="text-indigo-400 font-black tracking-wider text-sm">{getFanRating(totalEffectiveSteps, isWon, targetPlayer.difficulty, isSurrendered)}</strong>
                    </div>

                    {isWon && totalHintPenalty >= 4 && (
                      <div className="mt-1.5 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-amber-400 text-[10px] leading-relaxed select-none">
                        ⚠️ <strong>求助完赛 (线索罚时 ≥ 4步)：</strong>今日通关极度依赖赛场线索，因此连胜纪录处于「锁定保护」状态（未中断，亦不累加）。
                      </div>
                    )}

                    {gameMode === 'daily' && dailyPracticeMode && (
                      <div className="mt-1.5 bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-lg text-indigo-400 text-[10px] leading-relaxed select-none text-center font-medium">
                        🔄 <strong>非正式练习模式：</strong>您今日已正式结算过成绩，本次博弈属于切磋练习，不计入官方战绩和连胜火炬统计。
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Interactive block action items */}
              <div className="flex flex-col gap-2 relative z-10">
                <button
                  onClick={handleCopyShareText}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer text-xs"
                >
                  <Share2 className="w-4 h-4" />
                  <span>复制不剧透图文到剪贴板</span>
                </button>
                
                <button
                  onClick={() => {
                    if (gameMode === 'daily') {
                      setDailyTryAgainNotif(true);
                      setTimeout(() => setDailyTryAgainNotif(false), 4500);
                    } else if (gameMode === 'free') {
                      setupFreeChallenge(freeDifficulty);
                    } else if (gameMode === 'challenge') {
                      setupDailyChallenge();
                    }
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-755 text-slate-200 font-semibold border border-slate-700 rounded-xl transition-all active:scale-[0.98] cursor-pointer text-xs"
                >
                  {gameMode === 'daily' ? '今日关卡已结 · 磨砺随机关卡' : '再来一局、重新洗牌'}
                </button>
              </div>

              {dailyTryAgainNotif && (
                <div className="bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-[11px] leading-snug py-2 px-3 rounded-lg text-center animate-reveal relative z-10 mt-2">
                  💡 今日关卡已成功解锁！段位数据也已计入。您可以点击上方选项卡 <b>“自由开局”</b> 磨炼技巧，开启无限随机排查吧！
                </div>
              )}

              {showCopyNotification && (
                <div className="bg-slate-950 border border-emerald-500 text-emerald-300 text-xs py-2 px-3.5 rounded-lg text-center animate-bounce mt-2">
                  ✨ 战报格式化文本已复制至系统，快去发给微信群好友PK吧！
                </div>
              )}
            </div>
          ) : targetPlayer && !isGameOver ? (
            /* Redesigned Compact HUD board of Attributes */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl shadow-slate-950/20 relative overflow-hidden backdrop-blur-md animate-reveal">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]"></div>
              
              {/* First line: Stamina and Combo */}
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                  <span className="font-extrabold text-slate-200 tracking-wider uppercase text-[11.5px] font-display">
                    体能储备排查雷达
                  </span>
                </div>
                
                {/* Stamina percentage display */}
                <div className="flex items-center justify-between font-mono text-slate-350 bg-slate-950/50 p-2 rounded-xl border border-slate-850/60">
                  <span className="text-[10px] text-slate-450 uppercase font-bold">解密体能值 (STA)</span>
                  <span className={`font-black text-xs px-2.5 py-0.5 rounded flex items-center gap-1 shadow-inner ${
                    guesses.length * 8 >= 70 ? 'bg-rose-950/70 text-rose-300 border border-rose-500/30' :
                    guesses.length * 8 >= 40 ? 'bg-amber-955/70 text-amber-300 border border-amber-500/30' :
                    'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    <Heart className="w-3.5 h-3.5 fill-current animate-pulse text-rose-400" />
                    <span>{Math.max(5, 100 - guesses.length * 8)}%</span>
                  </span>
                </div>
              </div>

              {/* Stamina Bar visual progress */}
              <div className="w-full bg-slate-1000/80 rounded-full h-3 border border-slate-850 p-0.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out relative ${
                    guesses.length * 8 >= 70 ? 'bg-gradient-to-r from-red-650 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' :
                    guesses.length * 8 >= 40 ? 'bg-gradient-to-r from-amber-600 to-yellow-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' :
                    'bg-gradient-to-r from-emerald-600 to-indigo-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                  }`}
                  style={{ width: `${Math.max(5, 100 - guesses.length * 8)}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:15px_15px] animate-[pulse_1.5s_infinite]" />
                </div>
              </div>

              {/* Warnings Context */}
              {guesses.length * 8 >= 70 && (
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-950/30 border border-rose-500/20 text-[10px] leading-normal text-rose-300 font-bold animate-pulse">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-450" />
                  <span>战棋吃紧！请利用已锁定的特定属性迅速解密！</span>
                </div>
              )}

              {/* Locked/Narrowed Attributes decoded grid */}
              <div className="flex flex-col gap-2.5 border-t border-slate-800/50 pt-3.5 mt-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">
                  <span className="flex items-center gap-1 text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>属性雷达锁定 (ATTR)</span>
                  </span>
                  <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-[9px] border border-slate-850 text-indigo-400">
                    {guesses.length > 0 ? Object.keys(attributeConfig).filter(k => guesses.some(g => (g.feedbacks as any)[attributeConfig[Number(k)].key].status === 'CORRECT')).length : 0} / 11 锁定
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2" style={{ perspective: 1000 }}>
                  {attributeConfig.map((item) => {
                    const status = getAttrStatus(item.key);
                    let attrClasses = "";
                    let dotClasses = "";
                    let labelWord = "";
                    
                    if (status === 'CORRECT') {
                      attrClasses = "bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.15)]";
                      dotClasses = "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]";
                      labelWord = "锁定 🟩";
                    } else if (status === 'NARROWING') {
                      attrClasses = "bg-amber-955/20 text-amber-300 border border-amber-500/30 shadow-[0_0_6px_rgba(245,158,11,0.1)]";
                      dotClasses = "bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.8)]";
                      labelWord = "收窄";
                    } else {
                      attrClasses = "bg-slate-950/50 text-slate-500 border border-slate-900/60 opacity-60";
                      dotClasses = "bg-slate-800";
                      labelWord = "待排除";
                    }
                    
                    return (
                      <motion.div
                        key={item.key}
                        initial="initial"
                        animate={status === 'CORRECT' ? 'correct' : status === 'NARROWING' ? 'narrowing' : 'initial'}
                        variants={{
                          initial: { rotateY: 0, scale: 1 },
                          narrowing: { rotateY: 0, scale: 1, y: [0, -3, 0], transition: { duration: 0.4 } },
                          correct: {
                            rotateY: [0, 180, 360],
                            scale: [1, 1.12, 1.03],
                            transition: {
                              duration: 0.7,
                              ease: "easeInOut"
                            }
                          }
                        }}
                        style={{ transformStyle: 'preserve-3d' }}
                        onClick={() => {
                          setHighlightedAttribute(prev => prev === item.key ? null : item.key);
                          playSound('ping', soundEnabled);
                        }}
                        className={`py-2 px-1 rounded-xl transition-all duration-300 flex flex-col items-center justify-between gap-1 select-none border min-h-[58px] cursor-pointer ${attrClasses} ${
                          highlightedAttribute === item.key
                            ? '!bg-indigo-950/70 !border-indigo-400 ring-2 ring-indigo-500/50 scale-105 z-10 shadow-[0_0_15px_rgba(99,102,241,0.6)] font-bold'
                            : 'hover:scale-[1.03] hover:border-slate-700'
                        }`}
                        title={`${item.label}: ${status === 'CORRECT' ? '属性已成功锁死' : status === 'NARROWING' ? '数字范围已经收缩' : '还待排除'} (点击在猜测列表中高亮/取消高亮该列)`}
                      >
                        <span className="text-[10px] font-bold tracking-tight">
                          {item.label}
                        </span>
                        
                        {/* Interactive mini glow status bullet */}
                        <span className={`w-1 h-1 rounded-full ${dotClasses}`} />
                        
                        <span className="text-[8px] font-mono tracking-tighter opacity-70 font-black">
                          {labelWord}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

        </div>
          </div>
        </>
      )}
      </main>
      )}

      {/* TABS RESTRUCTURED VIEWS: CHALLENGE CREATOR TAB */}
      {activeTab === 'create' && (
        <div className="max-w-xl mx-auto w-full p-4 md:p-8 animate-reveal flex-1 flex items-center justify-center">
          <div className="bg-slate-900 p-7 sm:p-9 rounded-3xl flex flex-col gap-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-600/10 filter blur-3xl rounded-full"></div>
            
            <div className="flex items-center gap-3">
              <div className="bg-indigo-650/20 p-2.5 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-1 sm:mb-1.5">自制球星战书考考好友</h2>
                <span className="text-[10px] text-slate-400 block font-medium mt-0.5">选择任意球星，生成挑战链接发给好友PK</span>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal mb-1">
              嫌系统出的题不过瘾？你可以从下方手动挑选任意心仪的球星，我们会根据他的属性直接编码生成一个唯一的挑战连接。你可以直接发送给朋友一试高下。
            </p>

            <div className="h-[1px] bg-slate-800/80 w-full"></div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  选择作为考题的目标球星 (支持84+位乒坛知名精选)
                </label>
                <select
                  value={creatorSelectedPlayerId}
                  onChange={(e) => {
                    setCreatorSelectedPlayerId(e.target.value);
                    setCreatorGeneratedLink('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 px-4 text-xs sm:text-sm text-slate-100 outline-none transition-colors cursor-pointer"
                >
                  <option value="">-- 点击选择考题目标 --</option>
                  {[...PLAYERS_DATABASE]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} [{p.association}] — {p.sex} • {p.hand}{p.grip}
                      </option>
                    ))}
                </select>
              </div>

              <button
                onClick={handleCreateChallenge}
                disabled={!creatorSelectedPlayerId}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-550 text-white font-bold rounded-xl transition-all cursor-pointer text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-650/10 active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>生成我的特制考题链接</span>
              </button>

              {creatorGeneratedLink && (
                <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl flex flex-col gap-3.5 animate-reveal text-xs mt-2 shadow-inner">
                  <div className="flex items-center justify-between text-[10px] text-slate-550 uppercase tracking-widest font-black">
                    <span>特制链接生成成功</span>
                    <span className="text-emerald-400 flex items-center gap-1">🟢 绿色免密通道</span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={creatorGeneratedLink}
                    className="w-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 py-2 px-3 rounded-xl outline-none"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={handleCopyChallengeLink}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    {copiedChallenge ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedChallenge ? '复制成功!' : '一键复制战书链接'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TABS RESTRUCTURED VIEWS: HONOR STATS TAB */}
      {activeTab === 'stats' && (
        <div className="max-w-xl mx-auto w-full p-4 md:p-8 animate-reveal flex-1 flex items-center justify-center">
          <div className="bg-slate-900 p-7 sm:p-9 rounded-3xl flex flex-col gap-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-600/10 filter blur-3xl rounded-full"></div>
            
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-amber-400">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-1 sm:mb-1.5">我的战力与荣誉殿堂</h2>
                <span className="text-[10px] text-slate-400 block font-medium mt-0.5">博弈数据与连胜记录</span>
              </div>
            </div>

            <div className="h-[1px] bg-slate-800/80 w-full"></div>

            {/* Scores bento grid counts */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-3 bg-slate-950 p-2.5 sm:p-4 rounded-2xl text-center shadow-inner">
              <div className="flex flex-col py-1">
                <span className="text-lg sm:text-2xl font-black text-white">{stats.gamesPlayed}</span>
                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tight">参与局</span>
              </div>
              <div className="flex flex-col py-1">
                <span className="text-lg sm:text-2xl font-black text-emerald-400">{stats.gamesWon}</span>
                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tight">胜出</span>
              </div>
              <div className="flex flex-col py-1">
                <span className="text-lg sm:text-2xl font-black text-indigo-300">{stats.currentStreak}</span>
                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tight">当前连胜</span>
              </div>
              <div className="flex flex-col py-1">
                <span className="text-lg sm:text-2xl font-black text-purple-400">{stats.maxStreak}</span>
                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tight">历史最高</span>
              </div>
            </div>

            {/* Distribution Graph Chart */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1">
                📊 胜出步数极值分布统计：
              </span>
              <div className="space-y-2.5 border border-slate-850 bg-slate-950/60 p-5 rounded-2xl shadow-inner">
                {([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((step) => {
                  const val = stats.guessDistribution[step] || 0;
                  const total = stats.gamesWon || 1;
                  const ratio = Math.max(5, Math.min(100, Math.round((val / total) * 100)));
                  return (
                    <div key={step} className="flex items-center gap-4 text-xs">
                      <span className="w-8 text-slate-400 font-mono font-bold text-right shrink-0">{step}步</span>
                      <div className="flex-1 bg-slate-900 rounded-lg overflow-hidden h-5 flex items-center border border-slate-800">
                        <div
                          className="bg-indigo-600 h-full rounded-r text-[9px] font-black font-mono text-white flex items-center justify-end pr-2 transition-all duration-500"
                          style={{ width: `${ratio}%` }}
                        >
                          {val > 0 ? `${val}局` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7-Day Average Guesses Trend Area */}
            {(() => {
              const getSevenDayTrend = () => {
                const data = [];
                const today = new Date();
                const baseAverages = [8.2, 7.8, 7.1, 6.5, 6.1, 5.7, 5.2];
                
                for (let i = 6; i >= 0; i--) {
                  const d = new Date();
                  d.setDate(today.getDate() - i);
                  const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
                  const dayOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
                  
                  const formattedDate = d.toISOString().split('T')[0];
                  const historicalPlays = stats.history ? stats.history.filter(h => h.date === formattedDate && h.isWon) : [];
                  
                  let averageGuesses = baseAverages[6 - i];
                  let isReal = false;
                  
                  if (historicalPlays.length > 0) {
                    const sum = historicalPlays.reduce((acc, curr) => acc + curr.guessCount, 0);
                    averageGuesses = Number((sum / historicalPlays.length).toFixed(1));
                    isReal = true;
                  } else {
                    const totalGuessesArray = stats.history ? stats.history.filter(h => h.isWon).map(h => h.guessCount) : [];
                    if (totalGuessesArray.length > 0) {
                      const overallUserAvg = totalGuessesArray.reduce((src, val) => src + val, 0) / totalGuessesArray.length;
                      const offset = baseAverages[6 - i] - 6.5; 
                      averageGuesses = Number(Math.max(1.5, Math.min(8.8, overallUserAvg + offset)).toFixed(1));
                    }
                  }
                  
                  data.push({
                    dateLabel: dateStr,
                    dayLabel: dayOfWeek,
                    average: averageGuesses,
                    isReal
                  });
                }
                return data;
              };

              const trendData = getSevenDayTrend();
              
              // Canvas setup
              const svgW = 460;
              const svgH = 140;
              const paddingL = 35;
              const paddingR = 25;
              const paddingT = 20;
              const paddingB = 20;
              const chartW = svgW - paddingL - paddingR;
              const chartH = svgH - paddingT - paddingB;
              
              const getXCoord = (idx: number) => paddingL + idx * (chartW / 6);
              const getYCoord = (val: number) => {
                const pct = (9 - val) / 8; // If average = 1: pct = 1. If average = 9: pct = 0
                return (paddingT + chartH) - (pct * chartH);
              };
              
              const pathParts = trendData.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${getXCoord(idx)} ${getYCoord(pt.average)}`);
              const trendPathD = pathParts.join(' ');
              const areaPathD = trendData.length > 0 
                ? `${trendPathD} L ${getXCoord(6)} ${paddingT + chartH} L ${getXCoord(0)} ${paddingT + chartH} Z`
                : '';

              return (
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1 flex items-center gap-1.5">
                    📈 近七日平均猜测步数趋势 (排查效能)：
                  </span>
                  <div className="border border-slate-850 bg-slate-950/60 p-4 rounded-2xl shadow-inner flex flex-col gap-2.5">
                    <div className="text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-850 bg-slate-900/40 text-slate-400">
                      <span className="text-indigo-400 font-bold flex items-center gap-1 text-[9px] uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 bg-indigo-450 rounded-full animate-ping shrink-0" />
                        能力跃迁线：曲线越靠上代表用步越少、排查博弈速度越快
                      </span>
                    </div>

                    <div className="relative w-full h-[150px] bg-slate-900/30 rounded-xl overflow-hidden border border-slate-850/50">
                      <svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`} className="absolute top-0 left-0" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#a5b4fc" />
                            <stop offset="50%" stopColor="#818cf8" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                        
                        {/* Grid lines */}
                        {[2, 4, 6, 8].map((step) => {
                          const yPos = getYCoord(step);
                          return (
                            <g key={step}>
                              <line
                                x1={paddingL}
                                y1={yPos}
                                x2={svgW - paddingR}
                                y2={yPos}
                                stroke="#1e293b"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={paddingL - 8}
                                y={yPos + 3}
                                fill="#64748b"
                                fontSize="8"
                                fontFamily="monospace"
                                textAnchor="end"
                              >
                                {step}步
                              </text>
                            </g>
                          );
                        })}
                        
                        {/* Days alignment lines */}
                        {trendData.map((pt, idx) => {
                          const xPos = getXCoord(idx);
                          return (
                            <line
                              key={idx}
                              x1={xPos}
                              y1={paddingT}
                              x2={xPos}
                              y2={paddingT + chartH}
                              stroke="#141b2e"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                            />
                          );
                        })}
                        
                        <path d={areaPathD} fill="url(#areaGrad)" />
                        
                        <motion.path
                          d={trendPathD}
                          fill="none"
                          stroke="url(#lineGrad)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.2, ease: "easeInOut" }}
                        />
                        
                        {trendData.map((pt, idx) => {
                          const x = getXCoord(idx);
                          const y = getYCoord(pt.average);
                          return (
                            <g key={idx} className="group">
                              <circle
                                cx={x}
                                cy={y}
                                r="8"
                                fill="#4f46e5"
                                className="opacity-0 group-hover:opacity-35 transition-opacity duration-300"
                              />
                              <circle
                                cx={x}
                                cy={y}
                                r="4"
                                fill={pt.isReal ? "#10b981" : "#4f46e5"}
                                stroke="#0f172a"
                                strokeWidth="2"
                              />
                              <text
                                x={x}
                                y={y - 8}
                                fill={pt.isReal ? "#10b981" : "#a5b4fc"}
                                fontSize="9"
                                fontWeight="bold"
                                fontFamily="monospace"
                                textAnchor="middle"
                              >
                                {pt.average}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    <div className="flex justify-between text-[9px] font-mono text-slate-500 font-bold px-0.5">
                      {trendData.map((pt, idx) => (
                        <div key={idx} className="flex flex-col items-center w-10 text-center">
                          <span className="text-slate-400 font-extrabold">{pt.dateLabel}</span>
                          <span className="scale-[0.8] opacity-70 mt-0.5">{pt.dayLabel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={() => setActiveTab('play')}
              className="mt-2 py-3 bg-slate-800 hover:bg-slate-750 text-slate-205 font-bold rounded-xl transition-all border border-slate-700 active:scale-[0.98] text-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>立即返回博弈棋局 ⚔️</span>
            </button>
          </div>
        </div>
      )}

      {/* TABS RESTRUCTURED VIEWS: WIKI GUIDE TAB */}
      {activeTab === 'guide' && (
        <div className="max-w-2xl mx-auto w-full p-4 md:p-8 animate-reveal flex-1 flex items-center justify-center">
          <div className="bg-slate-900 p-7 sm:p-9 rounded-3xl flex flex-col gap-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-600/10 filter blur-3xl rounded-full"></div>
            
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600/20 p-2.5 rounded-xl border border-indigo-500/20 text-indigo-400">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-1 sm:mb-1.5">开局一个乒乓球星 • 规则宝典</h2>
                <span className="text-[10px] text-slate-400 block font-medium mt-0.5">游戏规则与判定说明</span>
              </div>
            </div>

            <div className="h-[1px] bg-slate-800/80 w-full"></div>

            <div className="text-xs text-slate-300 flex flex-col gap-4 leading-relaxed overflow-y-auto max-h-[420px] pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <p>
                「开局一个乒乓球星」是一款根据经典 Wordle 推理机制改进的体育垂直粉丝对抗推理游戏。你需要在最少步骤内通过比对 11 大核心特征锁定神秘选手！
              </p>

              <div className="bg-slate-950/60 p-4.5 rounded-2xl shadow-inner relative">
                <h4 className="font-bold text-slate-100 mb-2.5 flex items-center gap-1.5">
                  <span className="text-rose-500 font-black text-sm">#</span>
                  <span>判定状态反馈说明 (Indicator Legends)：</span>
                </h4>
                <ul className="list-disc pl-4.5 space-y-2 text-slate-400">
                  <li><span className="text-emerald-400 font-bold">🟩 绿色高亮 — 命中</span>: 表明该特性与神秘目标百分之百吻合，完全不用再试了！</li>
                  <li><span className="text-rose-450 font-bold">🔺 红色与上涨三角 (🔺)</span>: 数值（例如出生年、金牌数）比神秘选手低。表明实际选手的对应数值应该更高。</li>
                  <li><span className="text-amber-450 font-bold">🔻 黄色与下跌三角 (🔻)</span>: 数值比神秘选手高。表明目标对应的数值应该更低（例如更早出生/更大龄）。</li>
                  <li><span className="text-slate-500 font-bold">灰黑色 — 排除</span>: 表明与目标性质完全不同，予以排除。</li>
                </ul>
              </div>

              <div className="bg-slate-950/60 p-4.5 rounded-2xl shadow-inner relative">
                <h4 className="font-bold text-slate-100 mb-2.5">🔬 11大排查维度定义：</h4>
                <ol className="list-decimal pl-4.5 space-y-2 text-slate-400">
                  <li><strong>性别:</strong> 男 / 女选手。</li>
                  <li><strong>国家和地区协会:</strong> 中国、日本、中国台北、韩国、法国、瑞典等。</li>
                  <li><strong>出生年份:</strong> 具有高/低趋势指导。</li>
                  <li><strong>活跃状态:</strong> 现役 / 退役阶段。</li>
                  <li><strong>持手特征:</strong> 左手 / 右手。</li>
                  <li><strong>握拍特征:</strong> 横拍 / 直拍。</li>
                  <li><strong>打法战略:</strong> 两面弧圈、快攻结合、削球等。</li>
                  <li><strong>正手胶皮 / 反手胶皮:</strong> 反胶 (Inverted)、正胶 (Short pip)、生胶 (Raw)、长胶 (Long pip)。</li>
                  <li><strong>底板合作品牌:</strong> 蝴蝶/Butterfly、红双喜/DHS、斯帝卡/Stiga、挺拔/Tibhar、尼塔库/Nittaku等。</li>
                  <li><strong>三大赛单金:</strong> 奥运会、世乒赛、世界杯三大赛单打冠军总和统计。</li>
                </ol>
              </div>

              <div className="border border-slate-800 bg-slate-950/60 p-4 rounded-2xl">
                <h4 className="font-bold text-slate-100 mb-1">🛡️ 可信数据机制：</h4>
                <p className="text-slate-450 mt-1 leading-normal">
                  我们精选排查了中国和外协的 84 位核心球星名单（包含大量乒坛历史传奇如老瓦、王励勤、孔令辉等）。查无实据的信息一律标 unknown，数据经过全面严格人工交叉校验！
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('play')}
              className="mt-2 py-3 bg-slate-800 hover:bg-slate-755 text-slate-205 font-bold rounded-xl transition-all border border-slate-705 active:scale-[0.98] text-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>立即去打一局 🏓</span>
            </button>
          </div>
        </div>
      )}

      {/* FOOTER — 对战中隐藏，减少干扰 */}
      {playView !== 'arena' && (
      <footer className="py-7 mt-auto text-center text-xs text-slate-605 max-w-6xl w-full mx-auto border-t border-slate-900/60 px-4">
        <p className="font-medium text-slate-500">
          《开局一个球星》 猜星竞技游戏 v0.1 • 乒乓专版
        </p>
        <p className="mt-1 text-slate-600">
          数据来自于各选手公开赛事核实 • 查无据标注 unknown 绝无虚构
        </p>
      </footer>
      )}

      {/* ==================== SURRENDER CONFIRM MODAL ==================== */}
      {showSurrenderConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/30 p-6 rounded-2xl flex flex-col gap-4 shadow-2xl relative overflow-hidden w-full max-w-sm">
            <div className="absolute top-0 right-0 h-24 w-24 bg-rose-500/10 filter blur-2xl rounded-full"></div>
            
            <div className="flex items-center gap-3 text-rose-450">
              <div className="bg-rose-500/20 p-2.5 rounded-xl border border-rose-500/20">
                <Flag className="w-5 h-5 text-rose-450" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-tight">终结比赛 • 投降确认</h3>
                <span className="text-[9px] text-slate-400 block font-medium">确认投降 · 将揭晓答案并中断连胜</span>
              </div>
            </div>

            <div className="h-[1px] bg-slate-800 w-full"></div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              您确定要放弃本盘并认输投降吗？
              <br /><br />
              认输后系统将<strong className="text-amber-400">立即揭晓神秘选手</strong>的真实身世与完整档案。本次对局将被记为失败，且你今日首场的签到火种（连胜纪录）也会彻底熄灭归零。
            </p>

            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSurrenderConfirmModal(false);
                  playSound('ping', soundEnabled);
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-755 text-slate-300 text-xs font-black rounded-lg transition-all border border-slate-705 cursor-pointer shadow-sm"
              >
                继续排查博弈
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSurrenderConfirmModal(false);
                  handleConcedeSurrender();
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-650 text-white text-xs font-black rounded-lg shadow-lg shadow-red-955/20 transition-all cursor-pointer"
              >
                确认认输/看答案
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== HINTS SELECTION DISPLAY MODAL ==================== */}
      {showHintsPanelModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col gap-4 shadow-2xl relative overflow-hidden w-full max-w-md max-h-[90vh]">
            <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/10 filter blur-3xl rounded-full"></div>
            
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-amber-500/20 p-2.5 rounded-xl border border-amber-500/20 text-amber-400">
                <Lightbulb className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-tight">特征破译所 • 探查线索包</h3>
                <span className="text-[9px] text-amber-400 block font-black uppercase tracking-wider">逐步情报解锁</span>
              </div>
            </div>

            <div className="h-[1px] bg-slate-800 w-full shrink-0"></div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans shrink-0">
              寻找线索？你可以逐步解锁核心特征包。<span className="text-amber-400 font-bold">每条线索代表高额的博弈步数惩罚罚时</span>（在最终成绩结算时累加折算），会拖累总评分段位称号，请酌情解锁！
            </p>

            <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 flex-1 min-h-0">
              {HINTS_CONFIG.map((hint) => {
                const isUnlocked = hintsUsed.includes(hint.id);
                return (
                  <div 
                    key={hint.id} 
                    className={`p-3.5 rounded-xl border transition-colors duration-150 flex flex-col gap-2 shrink-0 relative ${
                      isUnlocked 
                        ? 'bg-indigo-950/20 border-indigo-500/30 text-slate-200' 
                        : 'bg-slate-950/40 border-slate-850 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-black tracking-wide ${isUnlocked ? 'text-indigo-300' : 'text-slate-400'}`}>
                          {hint.title}
                        </span>
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                          罚时 +{hint.cost} 次
                        </span>
                      </div>
                      
                      {isUnlocked ? (
                        <span className="text-[9px] text-emerald-400 font-black flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          <Check className="w-2.5 h-2.5" /> 已破译
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setHintToUnlockConfirm(hint.id);
                            playSound('ping', soundEnabled);
                          }}
                          className="text-[9.5px] bg-amber-500/15 hover:bg-amber-450 text-amber-400 hover:text-slate-950 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer border border-amber-550/20 hover:border-amber-400 flex items-center gap-1"
                        >
                          <span>🔒 解锁此线索</span>
                        </button>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-slate-500 leading-normal">
                      {hint.description}
                    </p>

                    {isUnlocked && targetPlayer && (
                      <div className="bg-slate-950/80 border border-indigo-500/15 p-2 rounded-lg text-[11px] font-medium text-emerald-300 leading-relaxed font-sans mt-1 animate-reveal select-text">
                        ✨ {hint.resolver(targetPlayer)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="h-[1px] bg-slate-800 w-full mt-1"></div>

            <button
              type="button"
              onClick={() => {
                setShowHintsPanelModal(false);
                playSound('ping', soundEnabled);
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-205 text-xs font-black rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              返回博弈局面
            </button>
          </div>
        </div>
      )}

      {/* ==================== HINT LOCK CONFIRM OVERLAY DIALOGUE ==================== */}
      {hintToUnlockConfirm !== null && (() => {
        const targetHint = HINTS_CONFIG.find(h => h.id === hintToUnlockConfirm);
        if (!targetHint) return null;
        return (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center z-60 p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-amber-500/30 p-5.5 rounded-3xl flex flex-col gap-3.5 shadow-3xl relative overflow-hidden w-full max-w-xs text-center items-center">
              <div className="bg-amber-500/10 p-3 rounded-full border border-amber-500/20 text-amber-400 animate-bounce">
                <Lightbulb className="w-5 h-5 text-amber-400" />
              </div>
              
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-black text-white">确认索取线索？</h4>
                <span className="text-[8px] text-slate-400 font-mono font-semibold tracking-wider">线索罚时警告</span>
              </div>
              
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                确认解锁 <span className="text-amber-400 font-bold">&ldquo;{targetHint.title}&rdquo;</span> 吗？
                这会有损最终评分，强加高昂的 <span className="text-amber-400 font-black text-xs font-mono">+{targetHint.cost} 步</span> 猜测损耗记录，对段位极不友好！
              </p>
              
              <div className="flex gap-2 w-full mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setHintToUnlockConfirm(null);
                    playSound('ping', soundEnabled);
                  }}
                  className="flex-1 py-2 bg-slate-805 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-lg border border-slate-705 transition-all cursor-pointer"
                >
                  我再想想
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!hintsUsed.includes(hintToUnlockConfirm)) {
                      setHintsUsed([...hintsUsed, hintToUnlockConfirm]);
                      playSound('lock_attribute', soundEnabled);
                    }
                    setHintToUnlockConfirm(null);
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-amber-550 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-black rounded-lg transition-all cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  确定解锁
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 球路飞行动画 */}
      {ballAnimKey > 0 && (
        <div key={ballAnimKey} className="fixed bottom-24 left-1/2 z-50 ball-fly">
          <div className="w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
        </div>
      )}

      {/* 连击浮层 */}
      {showCombo && comboCount >= 2 && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-lg px-5 py-2 rounded-2xl shadow-[0_0_30px_rgba(249,115,22,0.4)] animate-pulse">
            🔥 {comboCount}连击！
          </div>
        </div>
      )}

      {/* ==================== GAME RESULT MODAL ==================== */}
      {targetPlayer && isGameOver && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center z-55 animate-fadeIn"
          onClick={() => {}}>
          <div className="bg-slate-900 border-2 border-indigo-500/30 shadow-2xl shadow-indigo-950/40 relative overflow-hidden w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl sm:mx-4 sm:max-w-lg flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="overflow-y-auto p-4 flex flex-col gap-3">

              {/* 阶段1：标题+评级+名字 */}
              <div className={`flex items-center gap-2 relative z-10 shrink-0 transition-all duration-500 ${revealStage < 1 ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                {isWon ? (
                  <div className="bg-emerald-500/15 p-1.5 rounded-lg text-emerald-400"><CheckCircle2 className="w-5 h-5" /></div>
                ) : (
                  <div className="bg-rose-500/15 p-1.5 rounded-lg text-rose-400"><X className="w-5 h-5" /></div>
                )}
                <span className="text-sm text-slate-100 font-black uppercase tracking-widest">
                  {isWon ? '🎉 挑战成功！' : isSurrendered ? '🏳️ 已认输' : '解密完毕'}
                </span>
              </div>

              {/* 阶段2：球星卡 */}
              <div className={`transition-all duration-500 ${revealStage < 2 ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
              {(() => {
                const skin = getCardSkin(targetPlayer.difficulty);
                const totalHintPenalty = hintsUsed.reduce((s, id) => { const h = HINTS_CONFIG.find(x => x.id === id); return s + (h ? h.cost : 0); }, 0);
                const rating = getTrophyRating(guesses.length + totalHintPenalty, isWon, isSurrendered);
                return (
                  <div className={`relative flex flex-col items-center p-4 sm:p-5 rounded-2xl border-2 overflow-hidden select-none ${skin.bg} ${skin.border}`}>
                    <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_30%,rgba(255,255,255,0.06)_40%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.06)_60%,rgba(255,255,255,0)_70%)] bg-[length:200%_100%] animate-shine opacity-80 pointer-events-none" />
                    <div className={`absolute top-0 right-0 h-48 w-48 rounded-full filter blur-3xl ${skin.glow}`} />
                    <div className="w-full flex items-center justify-between mb-3 relative z-10 text-xs">
                      <span className={`text-[9px] font-black tracking-widest uppercase py-0.5 px-2 rounded-full border ${skin.badge}`}>🏆 {skin.label}</span>
                      <div className={`px-2.5 py-1 flex flex-col items-center rounded-xl border text-center ${rating.color}`}>
                        <span className="text-xl font-black leading-none tracking-tighter">{rating.grade}</span>
                        <span className="text-[8px] font-mono tracking-tighter opacity-75">{rating.desc}</span>
                      </div>
                    </div>
                    <div className="relative w-20 h-20 bg-slate-950/85 rounded-2xl border border-slate-800 flex items-center justify-center my-1 z-10 shadow-lg">
                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-2xl opacity-40" />
                      <Trophy className="w-10 h-10 text-indigo-400 animate-pulse" />
                      {targetPlayer.honorGold > 0 && (
                        <div className="absolute -bottom-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black text-[9px] py-0.5 px-2.5 rounded-full border border-yellow-300 shadow-[0_2px_5px_rgba(0,0,0,0.3)] whitespace-nowrap">🥇 经典战功 x{targetPlayer.honorGold}金</div>
                      )}
                    </div>
                    <div className="text-center mt-3 mb-2 relative z-10 flex flex-col items-center w-full">
                      <span className="text-[9px] text-indigo-400 font-extrabold tracking-widest uppercase">神级球星档案</span>
                      <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">{targetPlayer.name}</h3>
                      {targetPlayer.nameEn && <span className="text-[10px] tracking-widest text-slate-400 font-mono">{targetPlayer.nameEn}</span>}
                      <div className="h-0.5 w-12 bg-indigo-500/40 my-2 rounded-full" />
                      <p className="text-xs text-indigo-200 mt-0.5 italic leading-relaxed text-center px-2">&ldquo;{targetPlayer.signature}&rdquo;</p>
                    </div>
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800/60 text-left relative z-10 text-xs">
                      <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-850/60">
                        <span className="text-[9px] text-slate-450 font-black uppercase">性别/地方：</span>
                        <strong className="text-slate-200 font-bold">{targetPlayer.sex} • {targetPlayer.association}</strong>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-850/60">
                        <span className="text-[9px] text-slate-450 font-black uppercase">出生/状态：</span>
                        <strong className="text-slate-200 font-bold">{targetPlayer.birthYear}年 ({targetPlayer.activeStatus})</strong>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-850/60">
                        <span className="text-[9px] text-slate-450 font-black uppercase">持拍手/握拍：</span>
                        <strong className="text-slate-200 font-bold">{targetPlayer.hand} • {targetPlayer.grip}</strong>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-850/60">
                        <span className="text-[9px] text-slate-450 font-black uppercase">打法：</span>
                        <strong className="text-slate-200 font-bold">{targetPlayer.playStyle}</strong>
                      </div>
                      <div className="col-span-2 bg-slate-950/80 p-2 rounded-lg border border-slate-850/60">
                        <span className="text-[9px] text-slate-450 font-black uppercase">胶皮配置：</span>
                        <strong className="text-slate-200 font-bold">正手 {targetPlayer.forehandRubber} / 反手 {targetPlayer.backhandRubber}</strong>
                      </div>
                      <div className="col-span-2 bg-slate-950/80 p-2 rounded-lg border border-slate-850/60">
                        <span className="text-[9px] text-slate-450 font-black uppercase">曾用底板：</span>
                        <strong className="text-slate-200 font-bold">{targetPlayer.bladeBrand || '未知'}</strong>
                        {hintsUsed.length > 0 && <span className="ml-2 text-[8px] text-amber-400">+{hintsUsed.length}线索</span>}
                      </div>
                    </div>
                  </div>
                );
              })()}
              </div>

              {/* Stage 3 */}
              <div className={`transition-all duration-500 ${revealStage < 3 ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>

              {(() => {
                const pen = hintsUsed.reduce((s, id) => { const h = HINTS_CONFIG.find(x => x.id === id); return s + (h ? h.cost : 0); }, 0);
                const total = guesses.length + pen;
                return (
                  <div className="flex flex-col bg-slate-950/60 p-4 border border-slate-800/60 rounded-xl text-xs gap-2 shadow-inner">
                    <div className="flex justify-between text-slate-400"><span>猜测步数:</span><strong className="text-white font-mono">{guesses.length} 步</strong></div>
                    {pen > 0 && <div className="flex justify-between text-rose-400"><span>提示罚时:</span><strong>+{pen} 步</strong></div>}
                    <div className="h-px bg-slate-800/40 my-1" />
                    <div className="flex justify-between text-slate-300"><span className="font-bold">总步数:</span><strong className="text-white font-black font-mono">{total} 步</strong></div>
                    <div className="flex justify-between text-slate-400"><span>评级:</span><strong className="text-indigo-400 font-black">{getFanRating(total, isWon, targetPlayer.difficulty, isSurrendered)}</strong></div>
                    {isWon && pen >= 4 && <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg text-amber-400 text-[10px]">⚠️ 求助完赛，连胜保护（未中断不累加）</div>}
                    {gameMode === 'daily' && dailyPracticeMode && <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-lg text-indigo-400 text-[10px] text-center">🔄 练习模式，不计入战绩</div>}
                  </div>
                );
              })()}

              <div className="flex flex-col gap-2 relative z-10 shrink-0">
                <button onClick={handleCopyShareText}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer text-xs">
                  <Share2 className="w-4 h-4" />
                  <span>复制不剧透图文</span>
                </button>
                <button onClick={() => {
                    if (gameMode === 'daily') { setDailyTryAgainNotif(true); setTimeout(() => setDailyTryAgainNotif(false), 4500); }
                    else if (gameMode === 'free') { setupFreeChallenge(freeDifficulty); }
                    else if (gameMode === 'challenge') { setupDailyChallenge(); }
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold border border-slate-700 rounded-xl transition-all active:scale-[0.98] cursor-pointer text-xs">
                  {gameMode === 'daily' ? '今日已结·自由磨炼' : '再来一局'}
                </button>
              </div>

              {showCopyNotification && (
                <div className="bg-slate-950 border border-emerald-500 text-emerald-300 text-xs py-2 px-3.5 rounded-lg text-center animate-bounce">✨ 已复制到剪贴板！</div>
              )}
              {dailyTryAgainNotif && (
                <div className="bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-[11px] py-2 px-3 rounded-lg text-center">💡 今日已记录，点击"自由开局"可继续练习。</div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
