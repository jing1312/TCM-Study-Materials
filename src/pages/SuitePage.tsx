import { useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, Layers3, NotebookTabs } from 'lucide-react';

const assetVersion = '20260607-flow-cards';

const modules = [
  {
    id: 'plan',
    label: '学习计划',
    href: './3天学习计划.html',
    icon: CalendarDays
  },
  {
    id: 'cards',
    label: '速记卡片',
    href: './速记卡片.html',
    icon: Layers3
  },
  {
    id: 'mnemonics',
    label: '重点口诀',
    href: './重点难点口诀.html',
    icon: NotebookTabs
  },
  {
    id: 'quiz',
    label: '自测模拟',
    href: './自测模拟题.html',
    icon: ClipboardList
  }
];

export function SuitePage() {
  const [activeId, setActiveId] = useState(modules[0].id);
  const activeModule = useMemo(() => modules.find((module) => module.id === activeId) ?? modules[0], [activeId]);
  const activeHref = `${activeModule.href}?v=${assetVersion}`;

  return (
    <main className="suite-shell">
      <nav className="suite-nav" aria-label="学习模块">
        <div className="suite-nav-inner">
          <a className="suite-brand" href="./">
            中医药学概论
          </a>

          <div className="suite-tabs" role="tablist" aria-label="学习模块">
            {modules.map((module) => {
              const selected = module.id === activeId;
              return (
                <button
                  key={module.id}
                  className={selected ? 'suite-tab suite-tab-active' : 'suite-tab'}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveId(module.id)}
                >
                  <module.icon size={17} aria-hidden="true" />
                  {module.label}
                </button>
              );
            })}
          </div>

          <a className="suite-open-link" href={activeHref}>
            新窗口打开
          </a>
        </div>
      </nav>

      <iframe className="suite-frame" title={activeModule.label} src={activeHref} />
    </main>
  );
}
