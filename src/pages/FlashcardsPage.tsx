import { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Layers3,
  RotateCcw,
  Search,
  Sparkles,
  X
} from 'lucide-react';
import { Flashcard } from '../components/Flashcard';
import { cards, chapterNames, type ChapterId } from '../data/cards';
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
  { id: 'fresh', label: '未标记' },
  { id: 'unmastered', label: '未掌握' },
  { id: 'mastered', label: '已掌握' }
];

export function FlashcardsPage() {
  const [mastery, setMastery] = useLocalStorageState<MasteryMap>('tcm_mastery', {});
  const [chapter, setChapter] = useState<ChapterFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [expandedControls, setExpandedControls] = useState(false);

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
    <main className="min-h-screen bg-sky-50 text-slate-950">
      <div className="sticky top-0 z-40 border-b border-sky-200/80 bg-sky-50/95 backdrop-blur">
        <div className="h-1.5 bg-sky-100">
          <div className="h-full bg-[linear-gradient(90deg,#2563eb,#14b8a6,#7c3aed)] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <a className="secondary-button" href="./" title="返回全套首页">
              全套
            </a>

            <div className="flex min-w-0 items-center gap-2">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white">
                <Layers3 size={19} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold tracking-normal">中医药学概论速记卡片</h1>
                <p className="text-xs text-slate-500">{cards.length} 张卡片 · {totalMastered} 已掌握 · {totalUnmastered} 待巩固</p>
              </div>
            </div>

            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-sky-200 bg-white px-3 py-2 shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/15">
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

            <button className="secondary-button" type="button" onClick={() => setExpandedControls((value) => !value)}>
              <ChevronDown className={expandedControls ? 'rotate-180 transition' : 'transition'} size={17} aria-hidden="true" />
              筛选
            </button>

            <button className="secondary-button" type="button" onClick={resetAll}>
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
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="rounded-md bg-white px-2.5 py-1 shadow-sm ring-1 ring-sky-100">{filteredCards.length} 张匹配</span>
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-200">{masteredCount} 已掌握</span>
              <span className="rounded-md bg-fuchsia-50 px-2.5 py-1 text-fuchsia-700 ring-1 ring-fuchsia-200">{unmasteredCount} 未掌握</span>
              <span className="rounded-md bg-rose-50 px-2.5 py-1 text-rose-700 ring-1 ring-rose-200">{progress}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Sparkles size={16} className="text-indigo-600" aria-hidden="true" />
            <span>{chapter === 'all' ? '全章节' : chapterNames[chapter]}</span>
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
          <div className="grid min-h-[320px] place-items-center rounded-lg border border-dashed border-sky-200 bg-white text-center">
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
      <div className="flex gap-1.5 overflow-x-auto pb-1">
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
