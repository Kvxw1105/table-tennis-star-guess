import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Moon,
  RotateCcw,
  Search,
  Share2,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { PLAYERS_DATABASE } from './dataMerger.ts';
import type { AttributeFeedback, GuessComparison, Player } from './types.ts';
import { compareGuess, decodeChallenge, getDailyPlayer, getDailySeed, getRandomPlayer } from './utils.ts';
import './redesign.css';

const MAX_GUESSES = 9;

type View = 'lobby' | 'arena';
type Mode = 'daily' | 'free' | 'challenge';
type Theme = 'light' | 'dark';

type AttributeKey = keyof GuessComparison['feedbacks'];

type AttributeDefinition = {
  key: AttributeKey;
  label: string;
  suffix?: string;
};

const primaryAttributes: AttributeDefinition[] = [
  { key: 'sex', label: '性别' },
  { key: 'association', label: '协会' },
  { key: 'birthYear', label: '出生年', suffix: '年' },
  { key: 'activeStatus', label: '状态' },
  { key: 'hand', label: '持拍手' },
  { key: 'grip', label: '握拍' },
];

const advancedAttributes: AttributeDefinition[] = [
  { key: 'playStyle', label: '打法' },
  { key: 'forehandRubber', label: '正手' },
  { key: 'backhandRubber', label: '反手' },
  { key: 'bladeBrand', label: '曾用底板' },
  { key: 'honorGold', label: '三大赛单金' },
];

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('tts-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function playTap(enabled: boolean, tone: 'soft' | 'success' | 'error' = 'soft') {
  if (!enabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const notes = tone === 'success' ? [660, 880] : tone === 'error' ? [230] : [520];
    notes.forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = tone === 'soft' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(frequency, now + index * 0.07);
      gain.gain.setValueAtTime(tone === 'soft' ? 0.04 : 0.07, now + index * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + index * 0.07);
      osc.stop(now + index * 0.07 + 0.13);
    });
  } catch {
    // Audio is enhancement only.
  }
}

function statusMeta(feedback: AttributeFeedback) {
  switch (feedback.status) {
    case 'CORRECT':
      return { label: '正确', icon: Check, className: 'is-correct' };
    case 'HIGHER':
      return { label: '目标更高', icon: ArrowUp, className: 'is-higher' };
    case 'LOWER':
      return { label: '目标更低', icon: ArrowDown, className: 'is-lower' };
    case 'UNKNOWN':
      return { label: '未知', icon: CircleHelp, className: 'is-unknown' };
    default:
      return { label: '不匹配', icon: X, className: 'is-wrong' };
  }
}

function AttributeCell({ definition, feedback }: { definition: AttributeDefinition; feedback: AttributeFeedback }) {
  const meta = statusMeta(feedback);
  const Icon = meta.icon;
  return (
    <div className={`attribute-cell ${meta.className}`}>
      <div className="attribute-topline">
        <span>{definition.label}</span>
        <Icon size={15} strokeWidth={2.4} />
      </div>
      <strong>
        {feedback.displayValue}
        {definition.suffix ?? ''}
      </strong>
      <small>{meta.label}</small>
    </div>
  );
}

function GuessCard({ guess, index, newest = false }: { guess: GuessComparison; index: number; newest?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article className={`guess-card ${newest ? 'is-newest' : ''}`}>
      <div className="guess-card-header">
        <div>
          <span className="eyebrow">第 {index + 1} 次猜测</span>
          <h3>{guess.playerName}</h3>
        </div>
        {guess.isCorrect && <span className="solved-chip"><Check size={15} /> 命中</span>}
      </div>

      <div className="attribute-grid">
        {primaryAttributes.map((definition) => (
          <AttributeCell key={definition.key} definition={definition} feedback={guess.feedbacks[definition.key]} />
        ))}
      </div>

      <button className="advanced-toggle" onClick={() => setExpanded((value) => !value)}>
        <span>{expanded ? '收起专业线索' : '展开打法与装备'}</span>
        {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </button>

      {expanded && (
        <div className="attribute-grid advanced-grid">
          {advancedAttributes.map((definition) => (
            <AttributeCell key={definition.key} definition={definition} feedback={guess.feedbacks[definition.key]} />
          ))}
        </div>
      )}
    </article>
  );
}

function ProgressDots({ count }: { count: number }) {
  return (
    <div className="progress-dots" aria-label={`已猜 ${count} 次，最多 ${MAX_GUESSES} 次`}>
      {Array.from({ length: MAX_GUESSES }, (_, index) => (
        <span key={index} className={index < count ? 'filled' : ''} />
      ))}
    </div>
  );
}

export default function RedesignApp() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [view, setView] = useState<View>('lobby');
  const [mode, setMode] = useState<Mode>('daily');
  const [target, setTarget] = useState<Player>(() => getDailyPlayer(getDailySeed()));
  const [guesses, setGuesses] = useState<GuessComparison[]>([]);
  const [guessedIds, setGuessedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [isSurrendered, setIsSurrendered] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [message, setMessage] = useState('输入一位球员，逐步排除答案');
  const inputRef = useRef<HTMLInputElement>(null);

  const isWon = guesses.some((guess) => guess.isCorrect);
  const isGameOver = isWon || isSurrendered || guesses.length >= MAX_GUESSES;

  useEffect(() => {
    document.documentElement.dataset.ttsTheme = theme;
    localStorage.setItem('tts-theme', theme);
  }, [theme]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const challenge = params.get('challenge');
    if (!challenge) return;
    const decoded = decodeChallenge(challenge);
    if (decoded) {
      setMode('challenge');
      setTarget(decoded);
      setView('arena');
      setMessage('好友挑战已载入');
    }
  }, []);

  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return PLAYERS_DATABASE.filter((player) => {
      if (guessedIds.includes(player.id)) return false;
      return (
        player.name.toLowerCase().includes(term) ||
        player.nameEn?.toLowerCase().includes(term) ||
        player.association.toLowerCase().includes(term) ||
        player.aliases.some((alias) => alias.toLowerCase().includes(term)) ||
        player.pinyinInitials?.toLowerCase().includes(term)
      );
    }).slice(0, 6);
  }, [query, guessedIds]);

  function resetGame(nextMode: Mode, nextTarget: Player) {
    setMode(nextMode);
    setTarget(nextTarget);
    setGuesses([]);
    setGuessedIds([]);
    setQuery('');
    setIsSurrendered(false);
    setHistoryOpen(false);
    setMessage('输入一位球员，逐步排除答案');
    setView('arena');
    window.setTimeout(() => inputRef.current?.focus(), 120);
  }

  function startDaily() {
    playTap(soundEnabled);
    resetGame('daily', getDailyPlayer(getDailySeed()));
  }

  function startFree() {
    playTap(soundEnabled);
    resetGame('free', getRandomPlayer('入门', '全部'));
  }

  function submitGuess(player: Player) {
    if (isGameOver) return;
    const comparison = compareGuess(player, target);
    const nextGuesses = [...guesses, comparison];
    setGuesses(nextGuesses);
    setGuessedIds((items) => [...items, player.id]);
    setQuery('');
    setHistoryOpen(false);

    if (comparison.isCorrect) {
      setMessage(`命中！你用 ${nextGuesses.length} 次猜中了答案`);
      playTap(soundEnabled, 'success');
    } else if (nextGuesses.length >= MAX_GUESSES) {
      setMessage(`本局结束，答案是 ${target.name}`);
      playTap(soundEnabled, 'error');
    } else {
      const correctCount = Object.values(comparison.feedbacks).filter((item) => item.status === 'CORRECT').length;
      setMessage(`锁定了 ${correctCount} 项相同特征`);
      playTap(soundEnabled);
    }
    navigator.vibrate?.(comparison.isCorrect ? [20, 30, 20] : 12);
  }

  async function shareResult() {
    const text = isWon
      ? `我用 ${guesses.length} 次猜中了今日乒乓球星，你能更快吗？`
      : `今日乒乓猜星答案是 ${target.name}，来试试你能否猜中。`;
    try {
      if (navigator.share) await navigator.share({ title: '乒乓猜星', text, url: window.location.href });
      else await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      setMessage('分享内容已准备好');
    } catch {
      setMessage('分享已取消');
    }
  }

  const latestGuess = guesses.at(-1);
  const pastGuesses = guesses.slice(0, -1).reverse();

  if (view === 'lobby') {
    return (
      <main className="redesign-shell lobby-shell">
        <header className="app-header">
          <div className="brand-mark"><span className="ball-dot" />乒乓猜星</div>
          <div className="header-actions">
            <button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="切换主题">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-button" onClick={() => setSoundEnabled((value) => !value)} aria-label="切换声音">
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </header>

        <section className="hero-card">
          <span className="eyebrow">DAILY TABLE TENNIS CHALLENGE</span>
          <h1>今天的神秘球星<br />是谁？</h1>
          <p>每次猜测都会给出属性反馈。用最少的回合，锁定今天的答案。</p>
          <div className="hero-court" aria-hidden="true">
            <span className="court-line" />
            <span className="hero-ball" />
          </div>
          <button className="primary-button" onClick={startDaily}>
            开始今日挑战 <ArrowUp size={18} className="button-arrow" />
          </button>
        </section>

        <section className="lobby-secondary">
          <button className="secondary-card" onClick={startFree}>
            <div><span>自由练习</span><small>随机一位热门球员</small></div>
            <RotateCcw size={18} />
          </button>
          <div className="lobby-note">
            <strong>9 次机会</strong>
            <span>先看基础信息，再展开打法与装备</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="redesign-shell arena-shell">
      <header className="app-header compact-header">
        <button className="back-button" onClick={() => setView('lobby')}>
          <ArrowLeft size={18} />
          <span>返回</span>
        </button>
        <div className="arena-title">
          <span>{mode === 'daily' ? '今日挑战' : mode === 'challenge' ? '好友挑战' : '自由练习'}</span>
          <small>{getDailySeed()}</small>
        </div>
        <div className="header-actions">
          <button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="切换主题">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="icon-button" onClick={() => setSoundEnabled((value) => !value)} aria-label="切换声音">
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      <section className="game-status">
        <div className="status-copy">
          <span className="eyebrow">GUESS {Math.min(guesses.length + (isGameOver ? 0 : 1), MAX_GUESSES)} / {MAX_GUESSES}</span>
          <h2>{isGameOver ? (isWon ? '你猜中了' : '本局结束') : '锁定神秘球星'}</h2>
          <p>{message}</p>
        </div>
        <ProgressDots count={guesses.length} />
      </section>

      {!isGameOver && (
        <section className="search-panel">
          <div className="search-box">
            <Search size={19} />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="输入球员姓名、拼音首字母或协会"
              autoComplete="off"
            />
            {query && <button onClick={() => setQuery('')} aria-label="清空"><X size={17} /></button>}
          </div>
          {suggestions.length > 0 && (
            <div className="suggestion-list">
              {suggestions.map((player) => (
                <button key={player.id} onClick={() => submitGuess(player)}>
                  <div>
                    <strong>{player.name}</strong>
                    <span>{player.nameEn || player.association}</span>
                  </div>
                  <small>{player.association} · {player.difficulty}</small>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {latestGuess && <GuessCard guess={latestGuess} index={guesses.length - 1} newest />}

      {pastGuesses.length > 0 && (
        <section className="history-section">
          <button className="history-toggle" onClick={() => setHistoryOpen((value) => !value)}>
            <span>历史猜测 <b>{pastGuesses.length}</b></span>
            {historyOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {historyOpen && (
            <div className="history-list">
              {pastGuesses.map((guess, reverseIndex) => {
                const originalIndex = guesses.length - reverseIndex - 2;
                return <GuessCard key={`${guess.playerName}-${originalIndex}`} guess={guess} index={originalIndex} />;
              })}
            </div>
          )}
        </section>
      )}

      {!latestGuess && !isGameOver && (
        <section className="empty-state">
          <div className="empty-ball" />
          <h3>从熟悉的球星开始</h3>
          <p>猜错也会获得线索。基础属性会直接显示，打法与装备可以按需展开。</p>
        </section>
      )}

      {!isGameOver && (
        <footer className="arena-actions">
          <button className="ghost-button" onClick={() => setMessage('提示系统将在下一轮接回原有逻辑')}>
            <CircleHelp size={17} /> 属性提示
          </button>
          <button className="ghost-button danger" onClick={() => { setIsSurrendered(true); setMessage(`答案是 ${target.name}`); playTap(soundEnabled, 'error'); }}>
            认输
          </button>
        </footer>
      )}

      {isGameOver && (
        <section className="result-sheet">
          <span className="eyebrow">MATCH COMPLETE</span>
          <h2>{target.name}</h2>
          <p>{target.signature}</p>
          <div className="result-stats">
            <div><strong>{isWon ? guesses.length : '—'}</strong><span>猜中回合</span></div>
            <div><strong>{target.association}</strong><span>所属协会</span></div>
            <div><strong>{target.difficulty}</strong><span>题目难度</span></div>
          </div>
          <div className="result-actions">
            <button className="secondary-button" onClick={() => resetGame(mode, mode === 'daily' ? getDailyPlayer(getDailySeed()) : getRandomPlayer('入门', '全部'))}>
              <RotateCcw size={17} /> 再来一局
            </button>
            <button className="primary-button small" onClick={shareResult}>
              <Share2 size={17} /> 分享结果
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
