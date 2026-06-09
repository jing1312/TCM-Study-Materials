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
  const statusClass = status === 'mastered' ? 'is-mastered' : status === 'unmastered' ? 'is-unmastered' : '';

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
    window.getSelection()?.removeAllRanges();
  }

  // Check text selection and show toolbar
  function handleMouseUp() {
    if (!editing) return;
    setTimeout(() => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const cardRect = cardRef.current?.getBoundingClientRect();
        if (cardRect) {
          setToolbar({
            show: true,
            x: rect.left + rect.width / 2 - cardRect.left,
            y: rect.top - cardRect.top - 44,
          });
        }
      } else {
        setToolbar({ show: false, x: 0, y: 0 });
      }
    }, 10);
  }

  // Format commands
  function applyFormat(command: string, value?: string) {
    document.execCommand(command, false, value);
    // Keep focus on the editable area
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      // Selection stays, toolbar stays
    }
  }

  function applyBold() {
    // Toggle bold: check if current selection is already bold
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const isBold = document.queryCommandState('bold');
      if (isBold) {
        document.execCommand('bold', false);
      } else {
        document.execCommand('bold', false);
      }
    }
  }

  function applyBlue() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const color = document.queryCommandValue('foreColor');
      // If already blue, remove (reset to black)
      if (color === 'rgb(37, 99, 235)' || color === '#2563eb') {
        document.execCommand('foreColor', false, '#1e293b');
      } else {
        document.execCommand('foreColor', false, '#2563eb');
      }
    }
  }

  function applyRed() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const color = document.queryCommandValue('foreColor');
      if (color === 'rgb(220, 38, 38)' || color === '#dc2626') {
        document.execCommand('foreColor', false, '#1e293b');
      } else {
        document.execCommand('foreColor', false, '#dc2626');
      }
    }
  }

  function applyHighlight() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const bg = document.queryCommandValue('hiliteColor') || document.queryCommandValue('backColor');
      if (bg === 'rgb(253, 224, 71)' || bg === '#fde047' || bg === 'yellow') {
        document.execCommand('hiliteColor', false, 'transparent');
      } else {
        document.execCommand('hiliteColor', false, '#fde047');
      }
    }
  }

  // Close toolbar when clicking outside
  useEffect(() => {
    if (!editing) return;
    function handleClick(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setToolbar({ show: false, x: 0, y: 0 });
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
          onMouseDown={(e) => e.preventDefault()}
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
              onMouseUp={handleMouseUp}
              onClick={(e) => editing && e.stopPropagation()}
              dangerouslySetInnerHTML={{ __html: card.front }}
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
                onMouseUp={handleMouseUp}
                onClick={(e) => editing && e.stopPropagation()}
                dangerouslySetInnerHTML={{ __html: card.back }}
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
