import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { laranjaFor } from '../../content/pocket';
import { money, percent } from '../../content/format';
import { crisis as crisisParams, pocket as params } from '../../content/params';
import { ui } from '../../content/ui';
import { decide, protectedWealth, stashFee, unstashFee, type Compartment } from '../../engine';
import { ConfirmBar } from '../ConfirmBar';
import { EscPanel } from '../EscPanel';
import type { TabProps } from '../Game';

const order: Compartment[] = ['own', 'laranja', 'offshore'];

export function Pocket({ state, update }: TabProps) {
  const [text, setText] = useState('');
  const [ask, setAsk] = useState<{
    key: Compartment | 'retire';
    text: string;
    run: () => void;
  } | null>(null);
  const amount = Number(text) || 0;
  const p = state.pocket;
  const laranja = laranjaFor(state.seed);
  const add = (n: number) => setText(String(amount + n));

  const names: Record<Compartment, string> = {
    own: ui.pocket.names.own,
    laranja: ui.pocket.names.laranja(laranja.short),
    offshore: ui.pocket.names.offshore,
  };
  const phrases: Record<Compartment, string> = {
    own: ui.pocket.texts.own,
    laranja: ui.pocket.texts.laranja(laranja.short, percent(params.laranja.fee * 100), laranja.his),
    offshore: ui.pocket.texts.offshore(
      percent(params.offshore.fee * 100),
      money(params.offshore.min),
    ),
  };

  /** Motivo de o valor não caber, ou null se cabe. */
  const stashBlock = (to: Compartment): string | null => {
    if (amount < 1) return ui.pocket.noAmount;
    if (amount > state.cash) return ui.pocket.noCash;
    if (to === 'offshore' && amount < params.offshore.min) {
      return ui.pocket.belowMin(money(params.offshore.min));
    }
    return null;
  };
  const takeBlock = (from: Compartment): string | null => {
    if (amount < 1) return ui.pocket.noAmount;
    if (amount > p[from]) return ui.pocket.noBalance;
    return null;
  };

  const doStash = (to: Compartment) => {
    const fee = stashFee(to, amount);
    const a = money(amount);
    const question =
      to === 'laranja'
        ? ui.pocket.confirmStash.laranja(a, laranja.short, money(fee))
        : to === 'offshore'
          ? ui.pocket.confirmStash.offshore(a, money(fee))
          : null;
    const run = () => {
      update(decide(state, { type: 'stash', to, amount }));
      setText('');
    };
    if (question) setAsk({ key: to, text: question, run });
    else run();
  };
  const doTake = (from: Compartment) => {
    const run = () => {
      update(decide(state, { type: 'unstash', from, amount }));
      setText('');
    };
    if (from === 'offshore') {
      const fee = money(unstashFee(from, amount));
      setAsk({ key: from, text: ui.pocket.confirmTake.offshore(money(amount), fee), run });
    } else run();
  };
  const confirmFor = (key: Compartment | 'retire') =>
    ask && ask.key === key ? (
      <ConfirmBar
        text={ask.text}
        onYes={() => {
          setAsk(null);
          ask.run();
        }}
        onNo={() => setAsk(null)}
      />
    ) : null;

  return (
    <div class="stack">
      <h2>{ui.pocket.title}</h2>
      <div class="stat">
        <span class="dim small">{ui.pocket.protectedLabel}</span>
        <span class="mono big green">{money(protectedWealth(state))}</span>
        <span class="dim small">{ui.pocket.tagline}</span>
      </div>
      {p.blocked > 0 && (
        <div class="inquiry-bar small amber">
          {ui.pocket.blocked(money(p.blocked), p.blockedUntil)}
        </div>
      )}

      <div class="stack tight">
        <label class="small dim" for="pocket-amount">
          {ui.pocket.amountLabel}
        </label>
        <input
          id="pocket-amount"
          class="field"
          inputMode="numeric"
          placeholder={ui.pocket.amountHint}
          value={text}
          onInput={(e) => setText(e.currentTarget.value.replace(/\D/g, '').slice(0, 12))}
        />
        <div class="row">
          <button class="chip" onClick={() => add(1_000)}>
            {ui.pocket.shortcuts.k1}
          </button>
          <button class="chip" onClick={() => add(5_000)}>
            {ui.pocket.shortcuts.k5}
          </button>
          <button class="chip" onClick={() => setText(String(state.cash))}>
            {ui.pocket.shortcuts.all}
          </button>
          <button class="chip" onClick={() => setText('')}>
            {ui.pocket.shortcuts.zero}
          </button>
        </div>
      </div>

      {order.map((c) => (
        <Card
          key={c}
          name={names[c]}
          phrase={phrases[c]}
          balance={p[c]}
          stashReason={stashBlock(c)}
          takeReason={takeBlock(c)}
          confirm={confirmFor(c)}
          onStash={() => doStash(c)}
          onTake={() => doTake(c)}
        />
      ))}

      <EscPanel state={state} update={update} />

      <div class="stack tight">
        {ask?.key === 'retire' ? (
          confirmFor('retire')
        ) : (
          <button
            class="btn wide"
            disabled={state.week < crisisParams.retireFromWeek}
            onClick={() =>
              setAsk({
                key: 'retire',
                text: ui.pocket.confirmRetire,
                run: () => update(decide(state, { type: 'retire' })),
              })
            }
          >
            {ui.pocket.retire}
          </button>
        )}
        {state.week < crisisParams.retireFromWeek && (
          <span class="small dim">{ui.pocket.retireTooEarly(crisisParams.retireFromWeek)}</span>
        )}
      </div>
    </div>
  );
}

function Card(props: {
  name: string;
  phrase: string;
  balance: number;
  stashReason: string | null;
  takeReason: string | null;
  onStash: () => void;
  onTake: () => void;
  confirm: ComponentChildren;
}) {
  return (
    <article class="card stack tight">
      <div class="row between">
        <strong>{props.name}</strong>
        <span class="mono">{money(props.balance)}</span>
      </div>
      <p class="small dim phrase">{props.phrase}</p>
      <div class="pair">
        <div class="stack tight">
          <button class="btn" disabled={!!props.stashReason} onClick={props.onStash}>
            {ui.pocket.stash}
          </button>
          {props.stashReason && props.stashReason !== ui.pocket.noAmount && (
            <span class="small dim">{props.stashReason}</span>
          )}
        </div>
        <div class="stack tight">
          <button class="btn" disabled={!!props.takeReason} onClick={props.onTake}>
            {ui.pocket.take}
          </button>
          {props.takeReason && props.takeReason !== ui.pocket.noAmount && (
            <span class="small dim">{props.takeReason}</span>
          )}
        </div>
      </div>
      {props.confirm}
    </article>
  );
}
