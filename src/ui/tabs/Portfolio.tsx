import { useState } from 'preact/hooks';
import { collateralText } from '../../content/collateral';
import { params } from '../../content/params';
import { money, percent } from '../../content/format';
import { ui } from '../../content/ui';
import { decide, quote, type CollateralKind, type Loan, type LoanRequest } from '../../engine';
import type { TabProps } from '../Game';

export function Portfolio({ state, update }: TabProps) {
  const active = state.loans.filter((l) => l.status === 'active');
  const closed = state.loans
    .filter((l) => l.status !== 'active')
    .sort((a, b) => (b.endWeek ?? 0) - (a.endWeek ?? 0))
    .slice(0, 15);

  return (
    <div class="stack">
      <h2>{ui.portfolio.requests}</h2>
      {state.requests.length === 0 && <p class="dim">{ui.portfolio.noRequests}</p>}
      {state.requests.map((r) => (
        <RequestCard
          key={r.id}
          request={r}
          cash={state.cash}
          onLend={(monthlyRate, weeks, collateral) =>
            update(
              decide(state, { type: 'accept', requestId: r.id, monthlyRate, weeks, collateral }),
            )
          }
          onRefuse={() => update(decide(state, { type: 'refuse', requestId: r.id }))}
        />
      ))}

      <h2>{ui.portfolio.active}</h2>
      {active.length === 0 && <p class="dim">{ui.portfolio.noLoans}</p>}
      {active.map((l) => (
        <LoanRow key={l.id} loan={l} />
      ))}

      {closed.length > 0 && (
        <>
          <h2>{ui.portfolio.closed}</h2>
          {closed.map((l) => (
            <LoanRow key={l.id} loan={l} />
          ))}
        </>
      )}
    </div>
  );
}

// Lembra os últimos termos usados enquanto o app está aberto.
let lastTerms = { rate: params.terms.rate.default, weeks: params.terms.weeks.default };

function RequestCard({
  request: r,
  cash,
  onLend,
  onRefuse,
}: {
  request: LoanRequest;
  cash: number;
  onLend: (rate: number, weeks: number, collateral: CollateralKind | null) => void;
  onRefuse: () => void;
}) {
  const [rate, setRate] = useState(lastTerms.rate);
  const [weeks, setWeeks] = useState(lastTerms.weeks);
  const [collateral, setCollateral] = useState<CollateralKind | null>(null);
  const counter = r.counter;
  const q = quote(r.amount, { monthlyRate: rate, weeks });
  const affordable = r.amount <= cash;
  const { rate: rl, weeks: wl } = params.terms;

  return (
    <article class="card stack">
      <div class="debtor">
        <span class="avatar mono">{r.debtor.initials}</span>
        <div>
          <strong>{r.debtor.short}</strong>
          <div class="dim small">
            {r.debtor.name} · {r.debtor.profession}
          </div>
        </div>
        <span class="mono amber big right">{money(r.amount)}</span>
      </div>
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
            disabled={!affordable}
            onClick={() => {
              lastTerms = { rate: counter.rate, weeks };
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
          disabled={!affordable}
          onClick={() => {
            lastTerms = { rate, weeks };
            onLend(rate, weeks, collateral);
          }}
        >
          {affordable ? ui.portfolio.lend : ui.portfolio.noCash}
        </button>
        <button class="btn grow-btn" onClick={onRefuse}>
          {ui.portfolio.refuse}
        </button>
      </div>
    </article>
  );
}

function LoanRow({ loan: l }: { loan: Loan }) {
  let status: string;
  let tone = 'dim';
  if (l.status === 'paid') {
    status = ui.portfolio.paid(money(l.totalPaid - l.principal));
    tone = 'green';
  } else if (l.status === 'defaulted') {
    status = ui.portfolio.defaulted(money(l.totalDue - l.totalPaid - l.recovered));
    tone = 'red';
  } else if (l.missedStreak > 0) {
    status = ui.portfolio.late(l.missedStreak);
    tone = l.missedStreak >= 2 ? 'red' : 'amber';
  } else {
    status = ui.portfolio.upToDate;
    tone = 'green';
  }

  return (
    <article class={`card loan ${l.status !== 'active' ? 'closed' : ''}`}>
      <div class="debtor">
        <span class="avatar mono">{l.debtor.initials}</span>
        <div>
          <strong>{l.debtor.short}</strong>
          <div class={`small ${tone}`}>{status}</div>
        </div>
        <div class="right mono small">
          <div>{money(l.principal)}</div>
          <div class="dim">{ui.portfolio.rateShort(percent(l.monthlyRate))}</div>
        </div>
      </div>
      {l.status === 'active' && (
        <div class="row between small mono dim">
          <span>{ui.portfolio.progress(l.paidInstallments, l.weeks)}</span>
          <span>{ui.portfolio.installment(money(l.installment))}</span>
        </div>
      )}
      {l.status === 'active' && l.collateral && (
        <div class="small dim">
          {ui.portfolio.guarantee(collateralText[l.collateral.kind].label)}
        </div>
      )}
    </article>
  );
}
