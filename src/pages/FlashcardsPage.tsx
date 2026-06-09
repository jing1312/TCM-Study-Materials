import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Gamepad2,
  Heart,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Star,
  Trophy,
  X
} from 'lucide-react';
import { BackToTop } from '../components/BackToTop';
import { Flashcard } from '../components/Flashcard';
import { cards, chapterNames, type ChapterId, type StudyCard } from '../data/cards';
import { useAutoHideOnScroll } from '../hooks/useAutoHideOnScroll';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { includesQuery } from '../utils/text';

type ChapterFilter = 'all' | ChapterId;
type MasteryStatus = 'mastered' | 'unmastered';
type StatusFilter = 'all' | MasteryStatus | 'fresh';
type MasteryMap = Record<number, MasteryStatus>;
type EditableCardFields = Omit<StudyCard, 'id'>;

interface CardLibraryState {
  customCards: StudyCard[];
  editedCards: Record<number, EditableCardFields>;
  deletedCardIds: number[];
}

interface CardEditorState {
  mode: 'add' | 'edit';
  id?: number;
  ch: ChapterId;
  front: string;
  answer: string;
}

const emptyCardLibrary: CardLibraryState = {
  customCards: [],
  editedCards: {},
  deletedCardIds: []
};

function getInitialVisibleCards() {
  if (typeof window === 'undefined') return 48;
  if (window.innerWidth < 560) return 18;
  if (window.innerWidth < 900) return 36;
  return 48;
}

function getVisibleCardStep() {
  if (typeof window === 'undefined') return 36;
  if (window.innerWidth < 560) return 18;
  if (window.innerWidth < 900) return 24;
  return 36;
}

const chapterOptions: Array<{ id: ChapterFilter; label: string }> = [
  { id: 'all', label: '全部' },
  ...Object.entries(chapterNames).map(([id]) => ({
    id: Number(id) as ChapterId,
    label: id === '12' ? '高频' : `第${id}章`
  }))
];

const editableChapterOptions = Object.entries(chapterNames).map(([id, label]) => ({
  id: Number(id) as ChapterId,
  label
}));

const statusOptions: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'fresh', label: '新关卡' },
  { id: 'unmastered', label: '再挑战' },
  { id: 'mastered', label: '已通关' }
];

export function FlashcardsPage() {
  const [mastery, setMastery] = useLocalStorageState<MasteryMap>('tcm_mastery', {});
  const [cardLibrary, setCardLibrary] = useLocalStorageState<CardLibraryState>('tcm_card_library_v1', emptyCardLibrary);
  const [chapter, setChapter] = useState<ChapterFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [expandedControls, setExpandedControls] = useState(false);
  const [visibleCount, setVisibleCount] = useState(getInitialVisibleCards);
  const [editor, setEditor] = useState<CardEditorState | null>(null);
  const [editorError, setEditorError] = useState('');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isEmbedded = isEmbeddedWindow();
  const navHidden = useAutoHideOnScroll(48, true);
  const showBackToTop = !isEmbedded;

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const allCards = useMemo(() => {
    const deletedIds = new Set(cardLibrary.deletedCardIds);
    const baseCards = cards
      .filter((card) => !deletedIds.has(card.id))
      .map((card) => {
        const edited = cardLibrary.editedCards[card.id];
        return edited ? { id: card.id, ...edited } : card;
      });

    return [...cardLibrary.customCards, ...baseCards];
  }, [cardLibrary]);

  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      if (chapter !== 'all' && card.ch !== chapter) return false;

      const status = mastery[card.id];
      if (statusFilter === 'fresh' && status) return false;
      if (statusFilter === 'mastered' && status !== 'mastered') return false;
      if (statusFilter === 'unmastered' && status !== 'unmastered') return false;

      if (!normalizedQuery) return true;
      return includesQuery(card.front, normalizedQuery) || includesQuery(card.back, normalizedQuery);
    });
  }, [allCards, chapter, mastery, normalizedQuery, statusFilter]);

  useEffect(() => {
    setVisibleCount(getInitialVisibleCards());
  }, [chapter, normalizedQuery, statusFilter]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || visibleCount >= filteredCards.length || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) => Math.min(count + getVisibleCardStep(), filteredCards.length));
        }
      },
      { rootMargin: '900px 0px 900px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [filteredCards.length, visibleCount]);

  const filteredStats = useMemo(() => {
    let mastered = 0;
    let unmastered = 0;

    for (const card of filteredCards) {
      if (mastery[card.id] === 'mastered') mastered += 1;
      if (mastery[card.id] === 'unmastered') unmastered += 1;
    }

    return {
      mastered,
      unmastered,
      progress: filteredCards.length ? Math.round((mastered / filteredCards.length) * 100) : 0
    };
  }, [filteredCards, mastery]);

  const totalStats = useMemo(() => {
    let mastered = 0;
    let unmastered = 0;

    for (const card of allCards) {
      if (mastery[card.id] === 'mastered') mastered += 1;
      if (mastery[card.id] === 'unmastered') unmastered += 1;
    }

    return {
      mastered,
      unmastered,
      progress: allCards.length ? Math.round((mastered / allCards.length) * 100) : 0
    };
  }, [allCards, mastery]);

  const masteredCount = filteredStats.mastered;
  const unmasteredCount = filteredStats.unmastered;
  const progress = filteredStats.progress;
  const totalMastered = totalStats.mastered;
  const totalUnmastered = totalStats.unmastered;
  const totalProgress = totalStats.progress;
  const visibleCards = filteredCards.slice(0, Math.min(visibleCount, filteredCards.length));
  const hasMoreCards = visibleCards.length < filteredCards.length;
  const level = Math.max(1, Math.floor(totalMastered / 8) + 1);
  const levelStart = Math.floor(totalMastered / 8) * 8;
  const nextLevelAt = Math.min(allCards.length, levelStart + 8);
  const cardsToNextLevel = Math.max(nextLevelAt - totalMastered, 0);
  const nextLevelGoal = totalMastered >= allCards.length ? '全图通关' : `距 Lv.${level + 1} 还差 ${cardsToNextLevel} 张`;

  const setCardMastery = useCallback((id: number, status: MasteryStatus) => {
    setMastery((current) => ({ ...current, [id]: status }));
  }, [setMastery]);

  const clearCardMastery = useCallback((id: number) => {
    setMastery((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, [setMastery]);

  const resetAll = useCallback(() => {
    const confirmed = window.confirm('确认重置所有掌握进度？');
    if (confirmed) setMastery({});
  }, [setMastery]);

  const openAddCard = useCallback(() => {
    setEditor({
      mode: 'add',
      ch: chapter === 'all' ? 12 : chapter,
      front: '',
      answer: ''
    });
    setEditorError('');
  }, [chapter]);

  const saveCardEdit = useCallback((id: number, front: string, back: string) => {
    const isCustom = cardLibrary.customCards.some((c) => c.id === id);
    if (isCustom) {
      setCardLibrary((current) => ({
        ...current,
        customCards: current.customCards.map((c) => c.id === id ? { ...c, front, back } : c),
      }));
    } else {
      setCardLibrary((current) => ({
        ...current,
        editedCards: { ...current.editedCards, [id]: { ch: cards.find((c) => c.id === id)?.ch ?? 12, front, back } },
      }));
    }
  }, [cardLibrary.customCards, setCardLibrary]);

  const closeEditor = useCallback(() => {
    setEditor(null);
    setEditorError('');
  }, []);

  const saveEditorCard = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;

    const front = editor.front.trim();
    const answer = editor.answer.trim();
    if (!front || !answer) {
      setEditorError('正面和背面都要填写。');
      return;
    }

    const cardFields: EditableCardFields = {
      ch: editor.ch,
      front,
      back: editableTextToCardBack(answer)
    };

    setCardLibrary((current) => {
      if (editor.mode === 'add') {
        return {
          ...current,
          customCards: [...current.customCards, { id: Date.now(), ...cardFields }]
        };
      }

      const editingCustom = current.customCards.some((card) => card.id === editor.id);
      if (editingCustom) {
        return {
          ...current,
          customCards: current.customCards.map((card) => (card.id === editor.id ? { id: card.id, ...cardFields } : card))
        };
      }

      return {
        ...current,
        editedCards: {
          ...current.editedCards,
          [editor.id as number]: cardFields
        }
      };
    });

    setChapter(editor.ch);
    setStatusFilter('all');
    setEditor(null);
    setEditorError('');
  }, [editor, setCardLibrary]);

  const deleteCard = useCallback((card: StudyCard) => {
    const confirmed = window.confirm('确认删除这张卡片？');
    if (!confirmed) return;

    setCardLibrary((current) => {
      const editingCustom = current.customCards.some((item) => item.id === card.id);
      if (editingCustom) {
        return {
          ...current,
          customCards: current.customCards.filter((item) => item.id !== card.id)
        };
      }

      const nextEditedCards = { ...current.editedCards };
      delete nextEditedCards[card.id];
      return {
        ...current,
        editedCards: nextEditedCards,
        deletedCardIds: Array.from(new Set([...current.deletedCardIds, card.id]))
      };
    });

    clearCardMastery(card.id);
  }, [clearCardMastery, setCardLibrary]);

  const restoreDefaultCards = useCallback(() => {
    const confirmed = window.confirm('恢复默认卡片库？新增、修改和删除的卡片会清空，学习进度会保留。');
    if (confirmed) setCardLibrary(emptyCardLibrary);
  }, [setCardLibrary]);

  const showMoreCards = useCallback(() => {
    setVisibleCount((count) => Math.min(count + getVisibleCardStep(), filteredCards.length));
  }, [filteredCards.length]);

  return (
    <main className="flashcards-game min-h-screen text-slate-800">
      <div className={navHidden ? 'flashcard-nav auto-hide-nav nav-hidden' : 'flashcard-nav auto-hide-nav'}>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3">
          <div className="flashcard-toolbar flex flex-wrap items-center gap-3">
            <a className="secondary-button flashcard-home-button" href="./" title="返回全套首页">
              全套
            </a>

            <div className="flashcard-title-block flex min-w-0 items-center gap-2">
              <div className="flashcard-title-icon grid size-9 shrink-0 place-items-center rounded-lg text-white shadow-sm">
                <Gamepad2 size={19} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold tracking-normal">中医卡片闯关</h1>
                <p className="flashcard-subtitle text-xs">Lv.{level} · {totalMastered} 张通关 · {totalUnmastered} 张待挑战</p>
              </div>
            </div>

            <div className="flashcard-search flex min-w-[220px] flex-1 items-center gap-2 rounded-lg px-3 py-2">
              <Search size={17} className="shrink-0" aria-hidden="true" />
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

            <button className="secondary-button flashcard-control-button" type="button" onClick={openAddCard}>
              <Plus size={17} aria-hidden="true" />
              新增
            </button>

            <button className="secondary-button flashcard-control-button" type="button" onClick={restoreDefaultCards}>
              <RotateCcw size={17} aria-hidden="true" />
              默认库
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
          <div className="game-progress" aria-label={`总进度 ${totalProgress}%`}>
            <div className="game-progress-head">
              <span>总进度</span>
              <strong>{totalMastered} / {allCards.length}</strong>
            </div>
            <div className="game-meter">
              <div style={{ width: `${totalProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="game-quest mb-4">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles size={17} className="text-[#ff9f84]" aria-hidden="true" />
            <span className="font-semibold text-[#2f8f7c]">下一等级</span>
          </div>
          <span className="text-sm font-semibold text-[#a85640]">{nextLevelGoal}</span>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flashcard-summary flex flex-wrap items-center gap-2 text-sm">
              <span>{filteredCards.length} 张本关</span>
              <span className="summary-mastered">{masteredCount} 通关</span>
              <span className="summary-unmastered">{unmasteredCount} 待挑战</span>
              <span className="summary-progress">{progress}%</span>
            </div>
          </div>

          <div className="flashcard-map-label flex items-center gap-2 text-sm">
            <Sparkles size={16} aria-hidden="true" />
            <span>{chapter === 'all' ? '全地图' : chapterNames[chapter]}</span>
          </div>
        </div>

        {filteredCards.length ? (
          <div className="flashcard-list grid gap-4">
            {visibleCards.map((card) => (
              <Flashcard
                key={card.id}
                card={card}
                status={mastery[card.id]}
                onSetStatus={setCardMastery}
                onClearStatus={clearCardMastery}
                onSaveEdit={saveCardEdit}
                onDelete={deleteCard}
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

        {hasMoreCards ? (
          <div className="flashcard-load-more" ref={loadMoreRef}>
            <button className="secondary-button" type="button" onClick={showMoreCards}>
              加载更多
            </button>
            <span>{visibleCards.length} / {filteredCards.length}</span>
          </div>
        ) : null}
      </section>

      {editor && editor.mode === 'add' ? (
        <div className="card-editor-backdrop" role="presentation">
          <form className="card-editor-panel" onSubmit={saveEditorCard}>
            <div className="card-editor-head">
              <div>
                <h2>新增卡片</h2>
                <p>内容会保存在当前浏览器</p>
              </div>
              <button className="icon-button h-9 w-9" type="button" onClick={closeEditor} title="关闭" aria-label="关闭">
                <X size={18} />
              </button>
            </div>

            {editorError ? <div className="card-editor-error">{editorError}</div> : null}

            <label className="card-editor-field">
              <span>章节</span>
              <select value={editor.ch} onChange={(event) => setEditor((current) => current ? { ...current, ch: Number(event.target.value) as ChapterId } : current)}>
                {editableChapterOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="card-editor-field">
              <span>正面</span>
              <textarea
                value={editor.front}
                onChange={(event) => setEditor((current) => current ? { ...current, front: event.target.value } : current)}
                rows={3}
                placeholder="写问题、关键词或考点"
              />
            </label>

            <label className="card-editor-field">
              <span>背面</span>
              <textarea
                value={editor.answer}
                onChange={(event) => setEditor((current) => current ? { ...current, answer: event.target.value } : current)}
                rows={7}
                placeholder="写答案；换行会自动显示为分行"
              />
            </label>

            <div className="card-editor-actions">
              <button className="secondary-button" type="button" onClick={closeEditor}>
                取消
              </button>
              <button className="success-button" type="submit">
                <Save size={16} aria-hidden="true" />
                保存
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {showBackToTop ? <BackToTop /> : null}
    </main>
  );
}

function isEmbeddedWindow() {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function cardBackToEditableText(back: string) {
  return decodeHtmlEntities(back.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p>/gi, '\n').replace(/<[^>]*>/g, ''));
}

function editableTextToCardBack(text: string) {
  return text
    .trim()
    .split(/\n+/)
    .map((line) => escapeHtml(line.trim()))
    .filter(Boolean)
    .join('<br>');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decodeHtmlEntities(value: string) {
  if (typeof document === 'undefined') return value;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
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
