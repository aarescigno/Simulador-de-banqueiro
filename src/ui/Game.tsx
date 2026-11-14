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
import { Pocket } from './tabs/Pocket';
import { Policies } from './tabs/Policies';
import { Portfolio } from './tabs/Portfolio';
import { Summary } from './tabs/Summary';
import { Num } from './fx/Num';

export type TabId = keyof typeof ui.tabs;

export interface TabProps {
  state: GameState;
  update: (s: GameState) => void;
  goTo: (tab: TabId) => void;
}

const tabs: { id: TabId; icon: LucideIcon; view: ComponentType<TabProps> }[] = [
  { id: 'summary', icon: LayoutDashboard, view: Summary },
  { id: 'portfolio', icon: NotebookText, view: Portfolio },
  { id: 'policies', icon: SlidersHorizontal, view: Policies },
  { id: 'pocket', icon: Wallet, view: Pocket },
  { id: 'journal', icon: Newspaper, view: Journal },
];

interface GameProps {
  state: GameState;
  update: (s: GameState) => void;
  onMenu: () => void;
}

export function Game({ state, update, onMenu }: GameProps) {
  const [tab, setTab] = useState<TabId>('summary');
  const View = tabs.find((t) => t.id === tab)!.view;

  return (
    <div class="game">
      <header class="topbar">
        <button class="icon-btn" onClick={onMenu} aria-label={ui.header.back}>
          <ChevronLeft size={20} />
        </button>
        <span class="mono week-tick" key={state.week}>
          {ui.header.week(state.week)}
        </span>
        <Num class="mono green cash" value={state.cash} format={money} delta />
      </header>
      <section class="content">
        <div class="tab-view" key={tab}>
          <View state={state} update={update} goTo={setTab} />
        </div>
      </section>
      <nav class="tabbar" style={{ '--i': tabs.findIndex((t) => t.id === tab) }}>
        <span class="tab-indicator" aria-hidden="true" />
        {tabs.map(({ id, icon: Icon }) => (
          <button
            key={id}
            class={id === tab ? 'tab active' : 'tab'}
            onClick={() => setTab(id)}
            aria-current={id === tab ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{ui.tabs[id]}</span>
            {id === 'portfolio' && state.requests.length > 0 && (
              <span class="badge mono" key={state.requests.length}>
                {state.requests.length}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
