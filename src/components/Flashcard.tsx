import { useState } from 'react';
import { Check, Rotate3D, Undo2, X } from 'lucide-react';
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
          <section className="flashcard-face bg-white">
            <CardHeader card={card} status={status} />
            <div className="grid flex-1 place-items-center px-1 text-center text-[15px] font-semibold leading-7 text-slate-950">
              {card.front}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500">
              <Rotate3D size={15} aria-hidden="true" />
              题面
            </div>
          </section>

          <section className="flashcard-face flashcard-back bg-indigo-950 text-indigo-50">
            <CardHeader card={card} status={status} inverted />
            <div className="flashcard-answer" dangerouslySetInnerHTML={{ __html: card.back }} />
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-200">
              <Rotate3D size={15} aria-hidden="true" />
              答案
            </div>
          </section>
        </div>
      </button>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <button className="success-button" type="button" onClick={() => onSetStatus(card.id, 'mastered')}>
          <Check size={16} aria-hidden="true" />
          已掌握
        </button>
        <button className="warning-button" type="button" onClick={() => onSetStatus(card.id, 'unmastered')}>
          <X size={16} aria-hidden="true" />
          未掌握
        </button>
        <button className="icon-button h-9 w-9 border border-sky-200 bg-white" type="button" onClick={() => onClearStatus(card.id)} title="取消标记" aria-label="取消标记">
          <Undo2 size={16} />
        </button>
      </div>
    </article>
  );
}

function CardHeader({ card, status, inverted = false }: { card: StudyCard; status?: MasteryStatus; inverted?: boolean }) {
  const label =
    status === 'mastered' ? '已掌握' : status === 'unmastered' ? '未掌握' : '未标记';

  return (
    <div className="flex items-start justify-between gap-2">
      <div className={inverted ? 'text-xs font-semibold text-cyan-200' : 'text-xs font-semibold text-indigo-700'}>
        {chapterNames[card.ch]}
      </div>
      <span className={inverted ? 'status-pill status-pill-dark' : 'status-pill'}>{label}</span>
    </div>
  );
}
