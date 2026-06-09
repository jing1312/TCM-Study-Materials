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
  const toolbarVisibleRef = useRef(false);
  const statusClass = status === 'mastered' ? 'is-mastered' : status === 'unmastered' ? 'is-unmastered' : '';

  // --- 用 ref 管理 contentEditable 内容，避免 React 重新渲染干扰编辑 ---
  useEffect(() => {
    if (frontRef.current) frontRef.current.innerHTML = card.front;
  }, [card.front]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // hasSeenBack 控制背面 div 是否渲染，必须在依赖中以确保 ref 可用时设置内容
    if (backRef.current) backRef.current.innerHTML = card.back;
  }, [card.back, hasSeenBack]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // 在可编辑区域 mouseUp 后检查选区（显示/隐藏工具栏）
  function handleMouseUp() {
    if (!editing) return;
    setTimeout(() => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        // 保存选区（工具栏按钮点击时需要恢复）
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        const rect = sel.getRangeAt(0).getBoundingClientRect();
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
        if (toolbarVisibleRef.current) {
          toolbarVisibleRef.current = false;
          setToolbar({ show: false, x: 0, y: 0 });
        }
      }
    }, 10);
  }

  // 工具栏按钮 mousedown：阻止默认行为 + 保存当前选区
  function handleFormatBtnMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }

  // 恢复选区并执行格式命令
  // 格式按钮：先恢复选区再判断 toggle
  function applyBold() {
    const range = savedRangeRef.current;
    if (range) {
      const sel = window.getSelection();
      if (sel) { sel.removeAllRanges(); sel.addRange(range); }
    }
    document.execCommand('bold', false);
    const sel2 = window.getSelection();
    if (sel2 && sel2.rangeCount > 0 && !sel2.isCollapsed) savedRangeRef.current = sel2.getRangeAt(0).cloneRange();
  }

  function applyBlue() {
    const range = savedRangeRef.current;
    if (range) {
      const sel = window.getSelection();
      if (sel) { sel.removeAllRanges(); sel.addRange(range); }
    }
    const color = document.queryCommandValue('foreColor');
    document.execCommand('foreColor', false, (color === 'rgb(37, 99, 235)' || color === '#2563eb') ? '#1e293b' : '#2563eb');
    const sel2 = window.getSelection();
    if (sel2 && sel2.rangeCount > 0 && !sel2.isCollapsed) savedRangeRef.current = sel2.getRangeAt(0).cloneRange();
  }

  function applyRed() {
    const range = savedRangeRef.current;
    if (range) {
      const sel = window.getSelection();
      if (sel) { sel.removeAllRanges(); sel.addRange(range); }
    }
    const color = document.queryCommandValue('foreColor');
    document.execCommand('foreColor', false, (color === 'rgb(220, 38, 38)' || color === '#dc2626') ? '#1e293b' : '#dc2626');
    const sel2 = window.getSelection();
    if (sel2 && sel2.rangeCount > 0 && !sel2.isCollapsed) savedRangeRef.current = sel2.getRangeAt(0).cloneRange();
  }

  function applyHighlight() {
    const range = savedRangeRef.current;
    if (range) {
      const sel = window.getSelection();
      if (sel) { sel.removeAllRanges(); sel.addRange(range); }
    }
    const bg = document.queryCommandValue('hiliteColor') || document.queryCommandValue('backColor');
    document.execCommand('hiliteColor', false, (bg === 'rgb(253, 224, 71)' || bg === '#fde047' || bg === 'yellow') ? 'transparent' : '#fde047');
    const sel2 = window.getSelection();
    if (sel2 && sel2.rangeCount > 0 && !sel2.isCollapsed) savedRangeRef.current = sel2.getRangeAt(0).cloneRange();
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
        >
          <button type="button" className="fmt-btn fmt-bold" onMouseDown={handleFormatBtnMouseDown} onClick={applyBold} title="加粗 (再点取消)">
            <strong>B</strong>
          </button>
          <button type="button" className="fmt-btn fmt-blue" onMouseDown={handleFormatBtnMouseDown} onClick={applyBlue} title="蓝色字体 (再点取消)">
            A
          </button>
          <button type="button" className="fmt-btn fmt-red" onMouseDown={handleFormatBtnMouseDown} onClick={applyRed} title="红色字体 (再点取消)">
            A
          </button>
          <button type="button" className="fmt-btn fmt-highlight" onMouseDown={handleFormatBtnMouseDown} onClick={applyHighlight} title="黄色高亮 (再点取消)">
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
