import { memo, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Check, Pencil, Rotate3D, Save, Sparkles, Trash2, Undo2, X } from 'lucide-react';
import { chapterNames, type StudyCard } from '../data/cards';

type MasteryStatus = 'mastered' | 'unmastered';

interface FlashcardProps {
  card: StudyCard;
  status?: MasteryStatus;
  onSetStatus: (id: number, status: MasteryStatus) => void;
  onClearStatus: (id: number) => void;
  onSaveEdit: (id: number, front: string, back: string) => void;
  onDelete: (card: StudyCard) => void;
}

export const Flashcard = memo(function Flashcard({ card, status, onSetStatus, onClearStatus, onSaveEdit, onDelete }: FlashcardProps) {
  const [flipped, setFlipped] = useState(status === 'mastered');
  const [hasSeenBack, setHasSeenBack] = useState(status === 'mastered');
  const [editing, setEditing] = useState(false);
  const [toolbar, setToolbar] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // --- 选区保存/恢复机制 ---
  const savedRangeRef = useRef<Range | null>(null);
  const toolbarClickedRef = useRef(false);
  const toolbarVisibleRef = useRef(false);
  const statusClass = status === 'mastered' ? 'is-mastered' : status === 'unmastered' ? 'is-unmastered' : '';

  // --- 用 ref 管理 contentEditable 内容，避免 React 重新渲染干扰编辑 ---
  useEffect(() => {
    if (frontRef.current) frontRef.current.innerHTML = card.front;
  }, [card.front]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (backRef.current) backRef.current.innerHTML = card.back;
  }, [card.back]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleFlipped() {
    if (editing) return;
    if (!flipped) setHasSeenBack(true);
    setFlipped((value) => !value);
  }

  function handleStageKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (editing) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggleFlipped();
  }

  // Enter edit mode
  function startEditing() {
    setEditing(true);
    setFlipped(true);
    setHasSeenBack(true);
  }

  // Save and exit edit mode
  function saveEditing() {
    const frontText = frontRef.current?.innerHTML ?? card.front;
    const backText = backRef.current?.innerHTML ?? card.back;
    onSaveEdit(card.id, frontText, backText);
    setEditing(false);
    setToolbar({ show: false, x: 0, y: 0 });
    toolbarVisibleRef.current = false;
    window.getSelection()?.removeAllRanges();
  }

  // 在可编辑区域按下鼠标时保存选区（防止工具栏点击丢失选区）
  function handleEditableMouseDown() {
    toolbarClickedRef.current = false;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }

  // 检查文字选区并显示/隐藏工具栏
  function handleMouseUp() {
    if (!editing) return;

    // 如果点击了工具栏按钮，恢复保存的选区并跳过状态更新
    if (toolbarClickedRef.current) {
      toolbarClickedRef.current = false;
      if (savedRangeRef.current) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedRangeRef.current);
        }
      }
      return; // 不触发 setToolbar，避免无意义的重新渲染
    }

    setTimeout(() => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const cardRect = cardRef.current?.getBoundingClientRect();
        if (cardRect) {
          toolbarVisibleRef.current = true;
          setToolbar({
            show: true,
            x: rect.left + rect.width / 2 - cardRect.left,
            y: rect.top - cardRect.top - 44,
          });
        }
      } else {
        // 只在工具栏确实可见时才更新状态（避免无意义的重新渲染导致光标跳动）
        if (toolbarVisibleRef.current) {
          toolbarVisibleRef.current = false;
          setToolbar({ show: false, x: 0, y: 0 });
        }
      }
    }, 10);
  }

  // 恢复之前保存的选区
  function restoreSelection() {
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  }

  // 格式命令：先恢复选区，再执行格式操作
  function applyBold() {
    restoreSelection();
    document.execCommand('bold', false);
  }

  function applyBlue() {
    restoreSelection();
    const color = document.queryCommandValue('foreColor');
    if (color === 'rgb(37, 99, 235)' || color === '#2563eb') {
      document.execCommand('foreColor', false, '#1e293b');
    } else {
      document.execCommand('foreColor', false, '#2563eb');
    }
  }

  function applyRed() {
    restoreSelection();
    const color = document.queryCommandValue('foreColor');
    if (color === 'rgb(220, 38, 38)' || color === '#dc2626') {
      document.execCommand('foreColor', false, '#1e293b');
    } else {
      document.execCommand('foreColor', false, '#dc2626');
    }
  }

  function applyHighlight() {
    restoreSelection();
    const bg = document.queryCommandValue('hiliteColor') || document.queryCommandValue('backColor');
    if (bg === 'rgb(253, 224, 71)' || bg === '#fde047' || bg === 'yellow') {
      document.execCommand('hiliteColor', false, 'transparent');
    } else {
      document.execCommand('hiliteColor', false, '#fde047');
    }
  }

  // Close toolbar when clicking outside
  useEffect(() => {
    if (!editing) return;
    function handleClick(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          if (toolbarVisibleRef.current) {
            toolbarVisibleRef.current = false;
            setToolbar({ show: false, x: 0, y: 0 });
          }
        }
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [editing]);

  return (
    <article ref={cardRef} className={`flashcard ${statusClass} ${flipped ? 'is-flipped' : ''} ${editing ? 'is-editing' : ''}`}>
      {/* Floating format toolbar */}
      {editing && toolbar.show && (
        <div
          ref={toolbarRef}
          className="flashcard-format-toolbar"
          style={{ left: toolbar.x, top: toolbar.y }}
          onMouseDown={(e) => {
            e.preventDefault(); // 防止失去焦点和选区
            toolbarClickedRef.current = true; // 标记为工具栏点击
          }}
        >
          <button type="button" className="fmt-btn fmt-bold" onClick={applyBold} title="加粗 (再点取消)">
            <strong>B</strong>
          </button>
          <button type="button" className="fmt-btn fmt-blue" onClick={applyBlue} title="蓝色字体 (再点取消)">
            A
          </button>
          <button type="button" className="fmt-btn fmt-red" onClick={applyRed} title="红色字体 (再点取消)">
            A
          </button>
          <button type="button" className="fmt-btn fmt-highlight" onClick={applyHighlight} title="黄色高亮 (再点取消)">
            <span style={{ background: '#fde047', padding: '0 3px', borderRadius: 2 }}>A</span>
          </button>
        </div>
      )}

      <div
        className="flashcard-stage"
        role="button"
        tabIndex={0}
        onClick={toggleFlipped}
        onKeyDown={handleStageKeyDown}
        aria-pressed={flipped}
        aria-label={flipped ? `回到题目：${card.front}` : `查看答案：${card.front}`}
      >
        <div className={flipped ? 'flashcard-inner is-flipped' : 'flashcard-inner'}>
          <section className="flashcard-face flashcard-front" aria-hidden={flipped}>
            <CardHeader card={card} status={status} />
            <div
              ref={frontRef}
              className="flashcard-question"
              contentEditable={editing}
              suppressContentEditableWarning
              onMouseDown={handleEditableMouseDown}
              onMouseUp={handleMouseUp}
              onClick={(e) => editing && e.stopPropagation()}
            />
            {!editing && (
              <div className="flashcard-flip-hint flex items-center justify-center gap-1.5 text-xs font-medium">
                <Rotate3D size={15} aria-hidden="true" />
                翻牌
              </div>
            )}
          </section>

          <section className="flashcard-face flashcard-back" aria-hidden={!flipped}>
            <CardHeader card={card} status={status} inverted />
            {hasSeenBack ? (
              <div
                ref={backRef}
                className="flashcard-answer"
                contentEditable={editing}
                suppressContentEditableWarning
                onMouseDown={handleEditableMouseDown}
                onMouseUp={handleMouseUp}
                onClick={(e) => editing && e.stopPropagation()}
              />
            ) : (
              <div className="flashcard-answer flashcard-answer-placeholder">翻开后显示答案</div>
            )}
            {!editing && (
              <div className="flashcard-flip-hint is-back flex items-center justify-center gap-1.5 text-xs font-medium">
                <Rotate3D size={15} aria-hidden="true" />
                答案卡
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="flashcard-actions">
        {editing ? (
          <button className="success-button" type="button" onClick={saveEditing}>
            <Save size={16} aria-hidden="true" />
            保存
          </button>
        ) : (
          <>
            <button className="success-button" type="button" onClick={() => onSetStatus(card.id, 'mastered')}>
              <Check size={16} aria-hidden="true" />
              通关
            </button>
            <button className="warning-button" type="button" onClick={() => onSetStatus(card.id, 'unmastered')}>
              <X size={16} aria-hidden="true" />
              再练
            </button>
          </>
        )}
        <button
          className={`icon-button flashcard-edit-button h-9 w-9 ${editing ? 'is-active' : ''}`}
          type="button"
          onClick={editing ? saveEditing : startEditing}
          title={editing ? '保存修改' : '修改卡片'}
          aria-label={editing ? '保存修改' : '修改卡片'}
        >
          {editing ? <Save size={16} /> : <Pencil size={16} />}
        </button>
        <button className="icon-button flashcard-delete-button h-9 w-9" type="button" onClick={() => onDelete(card)} title="删除卡片" aria-label="删除卡片">
          <Trash2 size={16} />
        </button>
        <button className="icon-button flashcard-clear-button h-9 w-9" type="button" onClick={() => onClearStatus(card.id)} title="取消标记" aria-label="取消标记">
          <Undo2 size={16} />
        </button>
      </div>
    </article>
  );
});

function CardHeader({ card, status, inverted = false }: { card: StudyCard; status?: MasteryStatus; inverted?: boolean }) {
  const label =
    status === 'mastered' ? '已通关' : status === 'unmastered' ? '再挑战' : '新关卡';

  return (
    <div className="flex items-start justify-between gap-2">
      <div className={inverted ? 'flashcard-chapter is-back flex items-center gap-1 text-xs font-semibold' : 'flashcard-chapter flex items-center gap-1 text-xs font-semibold'}>
        <Sparkles size={13} aria-hidden="true" />
        {chapterNames[card.ch]}
      </div>
      <span className={inverted ? 'status-pill status-pill-dark' : 'status-pill'}>{label}</span>
    </div>
  );
}
