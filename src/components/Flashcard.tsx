import { useState } from 'react';
import { Check, Rotate3D, Sparkles, Undo2, X } from 'lucide-react';
import { chapterNames, type StudyCard } from '../data/cards';

type MasteryStatus = 'mastered' | 'unmastered';

interface FlashcardProps {
  card: StudyCard;
  status?: MasteryStatus;
  onSetStatus: (id: number, status: MasteryStatus) => void;
  onClearStatus: (id: number) => void;
}

export function Flashcard({ card, status, onSetStatus, onClearStatus }: FlashcardProps) {
  const [flipped, setFlipped] = useState(status === 'mastered');
  const statusClass = status === 'mastered' ? 'is-mastered' : status === 'unmastered' ? 'is-unmastered' : '';

  return (
    <article className={`flashcard ${statusClass}`}>
      <button className="flashcard-stage" type="button" onClick={() => setFlipped((value) => !value)} aria-pressed={flipped}>
        <div className={flipped ? 'flashcard-inner is-flipped' : 'flashcard-inner'}>
          <section className="flashcard-face flashcard-front">
            <CardHeader card={card} status={status} />
            <div className="flashcard-question">
              {card.front}
            </div>
            <div className="flashcard-flip-hint flex items-center justify-center gap-1.5 text-xs font-medium">
              <Rotate3D size={15} aria-hidden="true" />
              翻牌
            </div>
          </section>

          <section className="flashcard-face flashcard-back">
            <CardHeader card={card} status={status} inverted />
            <div className="flashcard-answer" dangerouslySetInnerHTML={{ __html: card.back }} />
            <div className="flashcard-flip-hint is-back flex items-center justify-center gap-1.5 text-xs font-medium">
              <Rotate3D size={15} aria-hidden="true" />
              答案卡
            </div>
          </section>
        </div>
      </button>

      <div className="flashcard-actions">
        <button className="success-button" type="button" onClick={() => onSetStatus(card.id, 'mastered')}>
          <Check size={16} aria-hidden="true" />
          通关
        </button>
        <button className="warning-button" type="button" onClick={() => onSetStatus(card.id, 'unmastered')}>
          <X size={16} aria-hidden="true" />
          再练
        </button>
        <button className="icon-button flashcard-clear-button h-9 w-9" type="button" onClick={() => onClearStatus(card.id)} title="取消标记" aria-label="取消标记">
          <Undo2 size={16} />
        </button>
      </div>
    </article>
  );
}

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
