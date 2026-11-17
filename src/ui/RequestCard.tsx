import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { collateralText } from '../content/collateral';
import { money, percent } from '../content/format';
import { ui } from '../content/ui';
import { quote, type CollateralKind, type LoanRequest } from '../engine';

export interface TermLimits {
  rate: { min: number; max: number; step: number; default: number };
  weeks: { min: number; max: number; step: number; default: number };
}

// Lembra os últimos termos usados, por degrau, enquanto o app está aberto.
const lastTerms: Record<string, { rate: number; weeks: number }> = {};

interface Props {
  request: LoanRequest;
  limits: TermLimits;
  /** Degrau: cada um guarda os seus últimos termos. */
  memory: string;
  /** Cabeçalho do cartão (devedor, empresa, sinais). */
  header: ComponentChildren;
  canLend: boolean;
  /** Texto do botão quando não pode emprestar. */
  noLendLabel: string;
  /** Aviso âmbar logo abaixo do cabeçalho (ficha irregular). */
  warning?: string;
  /** Texto do botão de emprestar, no lugar do padrão. */
  lendLabel?: string;
  onLend: (rate: number, weeks: number, collateral: CollateralKind | null) => void;
  onRefuse: () => void;
}

/** Cartão de pedido: garantia, taxa e prazo, contraproposta, emprestar ou recusar. */
export function RequestCard({
  request: r,
  limits,
  memory,
  header,
  canLend,
  noLendLabel,
  warning,
  lendLabel,
  onLend,
  onRefuse,
}: Props) {
  const last = lastTerms[memory] ?? { rate: limits.rate.default, weeks: limits.weeks.default };
  const [rate, setRate] = useState(last.rate);
  const [weeks, setWeeks] = useState(last.weeks);
  const [collateral, setCollateral] = useState<CollateralKind | null>(null);
  const counter = r.counter;
  const q = quote(r.amount, { monthlyRate: rate, weeks });
  const { rate: rl, weeks: wl } = limits;

  return (
    <article class="card stack">
      {header}
      {warning && <p class="small amber">{warning}</p>}
      <p class="reason">“{r.reason}”</p>

      <div class="stack tight">
        <span class="dim small">{ui.portfolio.collateral}</span>
        <div class="row">
          <button
            class={`chip ${collateral === null ? 'on' : ''}`}
            aria-pressed={collateral === null}
            onClick={() => setCollateral(null)}
          >
            {ui.portfolio.noCollateral}
          </button>
          {r.assets.map((a) => {
            const t = collateralText[a.kind];
            return (
              <button
                key={a.kind}
                class={`chip ${collateral === a.kind ? 'on' : ''}`}
                aria-pressed={collateral === a.kind}
                onClick={() => setCollateral(a.kind)}
              >
                {ui.portfolio.asset(t.label, money(a.value), t.perMonth)}
              </button>
            );
          })}
        </div>
      </div>

      <label class="slider">
        <span class="row between">
          <span class="dim small">{ui.portfolio.rate}</span>
          <span class="mono">{ui.portfolio.rateValue(percent(rate))}</span>
        </span>
        <input
          type="range"
          min={rl.min}
          max={rl.max}
          step={rl.step}
          value={rate}
          onInput={(e) => setRate(Number(e.currentTarget.value))}
        />
      </label>
      <label class="slider">
        <span class="row between">
          <span class="dim small">{ui.portfolio.term}</span>
          <span class="mono">{ui.portfolio.termValue(weeks)}</span>
        </span>
        <input
          type="range"
          min={wl.min}
          max={wl.max}
          step={wl.step}
          value={weeks}
          onInput={(e) => setWeeks(Number(e.currentTarget.value))}
        />
      </label>
      <p class="mono small">{ui.portfolio.quote(money(q.installment), money(q.totalDue))}</p>

      {counter && (
        <div class="row between">
          <p class="reason amber">
            {ui.portfolio.counter(
              percent(counter.rate),
              counter.collateral && collateralText[counter.collateral].noun,
            )}
          </p>
          <button
            class="btn amber-btn"
            disabled={!canLend}
            onClick={() => {
              lastTerms[memory] = { rate: counter.rate, weeks };
              onLend(counter.rate, weeks, counter.collateral);
            }}
          >
            {ui.portfolio.takeCounter(percent(counter.rate))}
          </button>
        </div>
      )}

      <div class="row">
        <button
          class="btn primary grow-btn"
          disabled={!canLend}
          onClick={() => {
            lastTerms[memory] = { rate, weeks };
            onLend(rate, weeks, collateral);
          }}
        >
          {canLend ? (lendLabel ?? ui.portfolio.lend) : noLendLabel}
        </button>
        <button class="btn grow-btn" onClick={onRefuse}>
          {ui.portfolio.refuse}
        </button>
      </div>
    </article>
  );
}
