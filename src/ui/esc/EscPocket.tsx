import { BedDouble, Citrus, TreePalm, type LucideIcon } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { laranjaFor } from '../../content/pocket';
import { screen } from '../../content/esc';
import { escUi } from '../../content/escLoans';
import { money, percent } from '../../content/format';
import { crisis as crisisParams, pocket as params } from '../../content/params';
import { ui } from '../../content/ui';
import {
  decide,
  distributable,
  protectedWealth,
  stashFee,
  heatBand,
  type Compartment,
} from '../../engine';
import { ConfirmBar } from '../ConfirmBar';
import { Storefront } from '../art';
import type { TabProps } from '../Game';
import { Num } from '../fx/Num';

const order: Compartment[] = ['own', 'laranja', 'offshore'];
const icons: Record<Compartment, LucideIcon> = {
  own: BedDouble,
  laranja: Citrus,
  offshore: TreePalm,
};

/** Bolso do degrau 2: compartimentos, distribuir, capitalizar, aposentar e a ficha do caderninho. */
export function EscPocket({ state, update }: TabProps) {
  const [text, setText] = useState('');
  const [ask, setAsk] = useState<{ text: string; run: () => void } | null>(null);
  const amount = Number(text) || 0;
  const p = state.pocket;
  const esc = state.esc!;
  const laranja = laranjaFor(state.seed);
  const free = distributable(state);
  const t = escUi.pocket;

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
  /** Motivo de o valor não poder ser distribuído, ou null. */
  const distBlock = (to: Compartment): string | null => {
    if (free < 1) return t.nothing;
    if (amount < 1) return ui.pocket.noAmount;
    if (amount > free) return t.available(money(free));
    if (to === 'offshore' && amount < params.offshore.min) {
      return ui.pocket.belowMin(money(params.offshore.min));
    }
    return null;
  };
  const doDistribute = (to: Compartment) => {
    const fee = stashFee(to, amount);
    const a = money(amount);
    const run = () => {
      update(decide(state, { type: 'distribute', to, amount }));
      setText('');
    };
    const question =
      to === 'laranja'
        ? ui.pocket.confirmStash.laranja(a, laranja.short, money(fee))
        : to === 'offshore'
          ? ui.pocket.confirmStash.offshore(a, money(fee))
          : null;
    if (question) setAsk({ text: question, run });
    else run();
  };
  const capBlock = free < 1 || amount < 1 || amount > free;
  const f = esc.ficha;
  const rows: [string, string][] = [
    [screen.ficha.weeks, String(f.weeks)],
    [screen.ficha.complaints, String(f.complaints)],
    [screen.ficha.raids, String(f.raids)],
    [screen.ficha.bribes, String(f.bribes)],
    [screen.ficha.heat, ui.heat[heatBand(f.heat)]],
    [screen.ficha.primo, f.primoGone ? screen.ficha.primoGone : screen.ficha.primoActive],
    [screen.ficha.mesada, f.mesada ? screen.ficha.mesadaOk : screen.ficha.mesadaNo],
    [screen.ficha.militia, screen.militia[f.militia]],
  ];

  return (
    <div class="stack">
      <h2>{ui.pocket.title}</h2>
      <div class="stat">
        <span class="dim small">{ui.pocket.protectedLabel}</span>
        <Num class="mono big green" value={protectedWealth(state)} format={money} />
        <span class="dim small">{ui.pocket.tagline}</span>
      </div>
      {p.blocked > 0 && (
        <div class="inquiry-bar small amber">
          {ui.pocket.blocked(money(p.blocked), p.blockedUntil)}
        </div>
      )}

      <h3>{t.distribute}</h3>
      <p class="small dim">{t.distributeHint}</p>
      <p class="small">{free > 0 ? t.available(money(free)) : t.nothing}</p>
      <div class="stack tight">
        <label class="small dim" for="esc-amount">
          {ui.pocket.amountLabel}
        </label>
        <input
          id="esc-amount"
          class="field"
          inputMode="numeric"
          placeholder={ui.pocket.amountHint}
          value={text}
          onInput={(e) => setText(e.currentTarget.value.replace(/\D/g, '').slice(0, 12))}
        />
        <div class="row">
          <button class="chip" onClick={() => setText(String(free))}>
            {ui.pocket.shortcuts.all}
          </button>
          <button class="chip" onClick={() => setText('')}>
            {ui.pocket.shortcuts.zero}
          </button>
        </div>
      </div>

      {order.map((c) => {
        const Icon = icons[c];
        const reason = distBlock(c);
        return (
          <article key={c} class="card stack tight">
            <div class="row between">
              <strong class="row compartment">
                <Icon size={16} color="var(--dim)" aria-hidden="true" />
                {names[c]}
              </strong>
              <Num class="mono" value={p[c]} format={money} />
            </div>
            <p class="small dim phrase">{phrases[c]}</p>
            <button class="btn" disabled={!!reason} onClick={() => doDistribute(c)}>
              {c === 'laranja' ? t.to.laranja(laranja.short) : t.to[c]}
            </button>
            {reason && reason !== ui.pocket.noAmount && reason !== t.nothing && (
              <span class="small dim">{reason}</span>
            )}
          </article>
        );
      })}
      {ask && (
        <ConfirmBar
          text={ask.text}
          onYes={() => {
            const run = ask.run;
            setAsk(null);
            run();
          }}
          onNo={() => setAsk(null)}
        />
      )}

      <h3>{t.capitalize}</h3>
      <p class="small dim">{t.capitalizeHint}</p>
      <button
        class="btn"
        disabled={capBlock}
        onClick={() =>
          setAsk({
            text: t.confirmCapitalize(money(amount)),
            run: () => {
              update(decide(state, { type: 'capitalize', amount }));
              setText('');
            },
          })
        }
      >
        {t.capitalizeBtn(money(amount))}
      </button>
      <p class="small dim">{t.noReturn}</p>

      <div class="stack tight">
        <button
          class="btn wide"
          onClick={() =>
            setAsk({ text: t.confirmRetire, run: () => update(decide(state, { type: 'retire' })) })
          }
          disabled={state.week < crisisParams.retireFromWeek}
        >
          {t.retire}
        </button>
      </div>

      <details class="card stack tight">
        <summary>{t.fichaTitle}</summary>
        <Storefront />
        <p class="dim small">{screen.book(esc.soldLoans, money(esc.sold))}</p>
        {esc.leftover > 0 && <p class="dim small">{screen.leftover(money(esc.leftover))}</p>}
        <ul class="parts">
          {rows.map(([label, value]) => (
            <li key={label} class="row between">
              <span class="dim">{label}</span>
              <span class="mono">{value}</span>
            </li>
          ))}
        </ul>
      </details>

      <p class="small dim">{t.realLife}</p>
    </div>
  );
}
