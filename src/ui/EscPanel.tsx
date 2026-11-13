import { useState } from 'preact/hooks';
import { laranjaFor } from '../content/pocket';
import { money } from '../content/format';
import { panel, progressStrip, routeOrder, routes } from '../content/esc';
import { esc as E } from '../content/params';
import {
  carteiraSale,
  decide,
  escAvailable,
  escOpenBlock,
  escReady,
  launderQuote,
  type GameState,
  type LaunderRoute,
} from '../engine';
import { ConfirmBar } from './ConfirmBar';

interface Props {
  state: GameState;
  update: (s: GameState) => void;
}

/** Painel "Abrir uma ESC", no Bolso: cedo demais, as quatro rotas, em andamento ou pronto. */
export function EscPanel({ state, update }: Props) {
  const [ask, setAsk] = useState<{ text: string; run: () => void } | null>(null);
  const l = state.laundering;
  const confirm = ask && (
    <ConfirmBar
      text={ask.text}
      onYes={() => {
        setAsk(null);
        ask.run();
      }}
      onNo={() => setAsk(null)}
    />
  );

  let body;
  if (l && escReady(state)) {
    const sale = carteiraSale(state);
    const block = escOpenBlock(state);
    body = (
      <>
        <p class="green small">{progressStrip(l.route, l.readyWeek, l.capital, true)}</p>
        <p>{panel.ready()}</p>
        <p class="small dim">{panel.sale(sale.loans.length, money(sale.price))}</p>
        <p class="small dim">{panel.leftover}</p>
        {block && block !== 'notReady' && <p class="small amber">{panel.blocks[block]}</p>}
        <button
          class="btn primary wide"
          disabled={block !== null}
          onClick={() =>
            setAsk({
              text: panel.confirmOpen(money(sale.price)),
              run: () => update(decide(state, { type: 'openEsc' })),
            })
          }
        >
          {panel.open}
        </button>
        {confirm}
      </>
    );
  } else if (l) {
    body = <p class="small mono">{progressStrip(l.route, l.readyWeek, l.capital, false)}</p>;
  } else if (state.week < E.fromWeek) {
    body = <p class="small dim">{panel.tooEarly(E.fromWeek)}</p>;
  } else if (!escAvailable(state)) {
    body = <p class="small amber">{panel.crisis}</p>;
  } else {
    body = (
      <>
        <p class="small dim">{panel.capital()}</p>
        {routeOrder.map((route) => (
          <RouteCard
            key={route}
            route={route}
            state={state}
            onChoose={(text) =>
              setAsk({
                text,
                run: () => update(decide(state, { type: 'launder', route })),
              })
            }
            asked={!!ask}
          />
        ))}
        {confirm}
      </>
    );
  }

  return (
    <section class="stack tight esc-panel">
      <h2>{panel.title}</h2>
      <p class="small dim">{panel.intro}</p>
      {body}
      <p class="small dim">{panel.realLife}</p>
    </section>
  );
}

function RouteCard(props: {
  route: LaunderRoute;
  state: GameState;
  onChoose: (confirmText: string) => void;
  asked: boolean;
}) {
  const { route, state } = props;
  const laranja = laranjaFor(state.seed);
  const t = routes[route];
  const q = launderQuote(state, route);
  const affordable = q.outlay <= state.cash;
  const costValue = route === 'laranja' ? q.cost + q.fee : route === 'devagar' ? 0 : q.cost;
  return (
    <article class="card stack tight">
      <strong>{t.name(laranja)}</strong>
      <p class="small phrase">{t.what(laranja)}</p>
      <p class="small dim phrase">{t.cost(money(costValue))}</p>
      <p class="small dim phrase">{t.term}</p>
      <p class="small dim phrase">{t.risk(laranja)}</p>
      {route === 'laranja' && q.fromLaranja > 0 && (
        <p class="small dim phrase">{panel.usesLaranja(laranja.short, money(q.fromLaranja))}</p>
      )}
      <p class="small mono phrase">{panel.outlay(money(q.outlay))}</p>
      <button
        class="btn"
        disabled={!affordable}
        onClick={() => props.onChoose(panel.confirmChoose(t.name(laranja), money(q.outlay)))}
      >
        {panel.choose}
      </button>
      {!affordable && <span class="small dim">{panel.noCash}</span>}
    </article>
  );
}
