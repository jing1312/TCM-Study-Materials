import { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Gamepad2,
  Heart,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trophy,
  X
} from 'lucide-react';
import { Flashcard } from '../components/Flashcard';
import { cards, chapterNames, type ChapterId } from '../data/cards';
import { useAutoHideOnScroll } from '../hooks/useAutoHideOnScroll';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { includesQuery } from '../utils/text';

type ChapterFilter = 'all' | ChapterId;
type MasteryStatus = 'mastered' | 'unmastered';
type StatusFilter = 'all' | MasteryStatus | 'fresh';
type MasteryMap = Record<number, MasteryStatus>;

const chapterOptions: Array<{ id: ChapterFilter; label: string }> = [
  { id: 'all', label: '全部' },
  ...Object.entries(chapterNames).map(([id]) => ({
    id: Number(id) as ChapterId,
    label: id === '12' ? '高频' : `第${id}章`
  }))
];

const statusOptions: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'fresh', label: '新关卡' },
  { id: 'unmastered', label: '再挑战' },
  { id: 'mastered', label: '已通关' }
];

export function FlashcardsPage() {
  const [mastery, setMastery] = useLocalStorageState<MasteryMap>('tcm_mastery', {});
  const [chapter, setChapter] = useState<ChapterFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [expandedControls, setExpandedControls] = useState(false);
  const navHidden = useAutoHideOnScroll();

  const normalizedQuery = query.trim().toLocaleLowerCase();

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (chapter !== 'all' && card.ch !== chapter) return false;

      const status = mastery[card.id];
      if (statusFilter === 'fresh' && status) return false;
      if (statusFilter === 'mastered' && status !== 'mastered') return false;
      if (statusFilter === 'unmastered' && status !== 'unmastered') return false;

      if (!normalizedQuery) return true;
      return includesQuery(card.front, normalizedQuery) || includesQuery(card.back, normalizedQuery);
    });
  }, [chapter, mastery, normalizedQuery, statusFilter]);

  const masteredCount = filteredCards.filter((card) => mastery[card.id] === 'mastered').length;
  const unmasteredCount = filteredCards.filter((card) => mastery[card.id] === 'unmastered').length;
  const progress = filteredCards.length ? Math.round((masteredCount / filteredCards.length) * 100) : 0;

  const totalMastered = cards.filter((card) => mastery[card.id] === 'mastered').length;
  const totalUnmastered = cards.filter((card) => mastery[card.id] === 'unmastered').length;
  const totalProgress = Math.round((totalMastered / cards.length) * 100);
  const level = Math.max(1, Math.floor(totalMastered / 8) + 1);
  const levelStart = Math.floor(totalMastered / 8) * 8;
  const nextLevelAt = Math.min(cards.length, levelStart + 8);
  const levelSpan = Math.max(nextLevelAt - levelStart, 1);
  const levelProgress = totalMastered >= cards.length ? 100 : Math.round(((totalMastered - levelStart) / levelSpan) * 100);
  const cardsToNextLevel = Math.max(nextLevelAt - totalMastered, 0);
  const nextLevelGoal = totalMastered >= cards.length ? '全图通关' : `距 Lv.${level + 1} 还差 ${cardsToNextLevel} 张`;

  function setCardMastery(id: number, status: MasteryStatus) {
    setMastery((current) => ({ ...current, [id]: status }));
  }

  function clearCardMastery(id: number) {
    setMastery((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function resetAll() {
    const confirmed = window.confirm('确认重置所有掌握进度？');
    if (confirmed) setMastery({});
  }

  return (
    <main className="flashcards-game min-h-screen text-slate-800">
      <div className={navHidden ? 'flashcard-nav auto-hide-nav nav-hidden sticky top-0 z-40 border-b border-teal-100/90 bg-[#fffaf3]/90 backdrop-blur' : 'flashcard-nav auto-hide-nav sticky top-0 z-40 border-b border-teal-100/90 bg-[#fffaf3]/90 backdrop-blur'}>
        <div className="h-1.5 bg-[#ffe8dc]">
          <div className="h-full bg-[linear-gradient(90deg,#6ee7c8,#ffd0b5,#f9a8d4)] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3">
          <div className="flashcard-toolbar flex flex-wrap items-center gap-3">
            <a className="secondary-button flashcard-home-button" href="./" title="返回全套首页">
              全套
            </a>

            <div className="flashcard-title-block flex min-w-0 items-center gap-2">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#ffb7a0] text-white shadow-sm">
                <Gamepad2 size={19} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold tracking-normal">中医卡片闯关</h1>
                <p className="text-xs text-slate-500">Lv.{level} · {totalMastered} 张通关 · {totalUnmastered} 张待挑战</p>
              </div>
            </div>

            <div className="flashcard-search flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-teal-100 bg-white px-3 py-2 shadow-sm focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-200/60">
              <Search size={17} className="shrink-0 text-slate-500" aria-hidden="true" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索考点、关键词或答案"
                type="search"
              />
              {query ? (
                <button className="icon-button" type="button" onClick={() => setQuery('')} title="清空搜索" aria-label="清空搜索">
                  <X size={16} />
                </button>
              ) : null}
            </div>

            <button className="secondary-button flashcard-control-button" type="button" onClick={() => setExpandedControls((value) => !value)}>
              <ChevronDown className={expandedControls ? 'rotate-180 transition' : 'transition'} size={17} aria-hidden="true" />
              筛选
            </button>

            <button className="secondary-button flashcard-control-button" type="button" onClick={resetAll}>
              <RotateCcw size={17} aria-hidden="true" />
              重置
            </button>
          </div>

          <div className={expandedControls ? 'grid gap-3' : 'hidden gap-3 md:grid'}>
            <SegmentedControl
              label="章节"
              options={chapterOptions}
              value={chapter}
              onChange={(value) => setChapter(value as ChapterFilter)}
            />
            <SegmentedControl
              label="状态"
              options={statusOptions}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
            />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-5">
        <div className="game-hud mb-4">
          <div className="game-stat">
            <Trophy size={18} aria-hidden="true" />
            <span className="game-label">等级</span>
            <span className="game-value">Lv.{level}</span>
          </div>
          <div className="game-stat">
            <Star size={18} aria-hidden="true" />
            <span className="game-label">总进度</span>
            <span className="game-value">{totalProgress}%</span>
          </div>
          <div className="game-stat">
            <Heart size={18} aria-hidden="true" />
            <span className="game-label">已通关</span>
            <span className="game-value">{totalMastered}</span>
          </div>
          <div className="game-meter" aria-label={`总进度 ${totalProgress}%`}>
            <div style={{ width: `${totalProgress}%` }} />
          </div>
        </div>

        <div className="game-quest mb-4">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles size={17} className="text-[#ff9f84]" aria-hidden="true" />
            <span className="font-semibold text-[#2f8f7c]">下一等级</span>
          </div>
          <div className="game-quest-meter" aria-label={`等级进度 ${levelProgress}%`}>
            <div style={{ width: `${levelProgress}%` }} />
          </div>
          <span className="text-sm font-semibold text-[#a85640]">{nextLevelGoal}</span>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="rounded-md bg-white px-2.5 py-1 shadow-sm ring-1 ring-teal-100">{filteredCards.length} 张本关</span>
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-200">{masteredCount} 通关</span>
              <span className="rounded-md bg-[#fff0e8] px-2.5 py-1 text-[#c46a52] ring-1 ring-[#ffd6c7]">{unmasteredCount} 待挑战</span>
              <span className="rounded-md bg-pink-50 px-2.5 py-1 text-pink-600 ring-1 ring-pink-100">{progress}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Sparkles size={16} className="text-[#f59f85]" aria-hidden="true" />
            <span>{chapter === 'all' ? '全地图' : chapterNames[chapter]}</span>
          </div>
        </div>

        {filteredCards.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCards.map((card) => (
              <Flashcard
                key={card.id}
                card={card}
                status={mastery[card.id]}
                onSetStatus={setCardMastery}
                onClearStatus={clearCardMastery}
              />
            ))}
          </div>
        ) : (
          <div className="grid min-h-[320px] place-items-center rounded-lg border border-dashed border-[#ffd6c7] bg-white text-center">
            <div>
              <p className="font-medium text-slate-800">没有匹配的卡片</p>
              <p className="mt-1 text-sm text-slate-500">调整搜索词或筛选条件</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

interface SegmentedControlProps {
  label: string;
  options: Array<{ id: string | number; label: string }>;
  value: string | number;
  onChange: (value: string | number) => void;
}

function SegmentedControl({ label, options, value, onChange }: SegmentedControlProps) {
  return (
    <div className="grid gap-2 md:grid-cols-[3rem_1fr] md:items-center">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="segment-options">
        {options.map((option) => {
          const selected = String(option.id) === String(value);
          return (
            <button
              key={String(option.id)}
              className={selected ? 'segment-button segment-button-active' : 'segment-button'}
              type="button"
              onClick={() => onChange(option.id)}
            >
              {selected ? <Check size={14} aria-hidden="true" /> : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
