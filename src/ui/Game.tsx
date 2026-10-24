import {
  ChevronLeft,
  LayoutDashboard,
  Newspaper,
  NotebookText,
  SlidersHorizontal,
  Wallet,
  type LucideIcon,
} from 'lucide-preact';
import { useState } from 'preact/hooks';
import type { ComponentType } from 'preact';
import type { GameState } from '../engine';
import { money } from '../content/format';
import { ui } from '../content/ui';
import { Journal } from './tabs/Journal';
import { Placeholder } from './tabs/Placeholder';
import { Portfolio } from './tabs/Portfolio';
import { Summary } from './tabs/Summary';

export interface TabProps {
  state: GameState;
  update: (s: GameState) => void;
}

type TabId = keyof typeof ui.tabs;

const tabs: { id: TabId; icon: LucideIcon; view: ComponentType<TabProps> }[] = [
  { id: 'summary', icon: LayoutDashboard, view: Summary },
  { id: 'portfolio', icon: NotebookText, view: Portfolio },
  {
    id: 'policies',
    icon: SlidersHorizontal,
    view: () => <Placeholder title={ui.policies.title} text={ui.policies.soon} />,
  },
  {
    id: 'pocket',
    icon: Wallet,
    view: () => <Placeholder title={ui.pocket.title} text={ui.pocket.soon} />,
  },
  { id: 'journal', icon: Newspaper, view: Journal },
];

export function Game({ state, update, onMenu }: TabProps & { onMenu: () => void }) {
  const [tab, setTab] = useState<TabId>('summary');
  const View = tabs.find((t) => t.id === tab)!.view;

  return (
    <div class="game">
      <header class="topbar">
        <button class="icon-btn" onClick={onMenu} aria-label={ui.header.back}>
          <ChevronLeft size={20} />
        </button>
        <span class="mono">{ui.header.week(state.week)}</span>
        <span class="mono green">{money(state.cash)}</span>
      </header>
      <section class="content">
        <View state={state} update={update} />
      </section>
      <nav class="tabbar">
        {tabs.map(({ id, icon: Icon }) => (
          <button
            key={id}
            class={id === tab ? 'tab active' : 'tab'}
            onClick={() => setTab(id)}
            aria-current={id === tab ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{ui.tabs[id]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
