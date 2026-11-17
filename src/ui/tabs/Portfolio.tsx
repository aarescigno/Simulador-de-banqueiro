import { useState } from 'preact/hooks';
import { collateralText } from '../../content/collateral';
import { params } from '../../content/params';
import { money, percent } from '../../content/format';
import { ui } from '../../content/ui';
import { ConfirmBar } from '../ConfirmBar';
import { RequestCard } from '../RequestCard';
import { Empty, Face, Installments, Stamp, type Tone } from '../art';
import { decide, isPrimoOut, levelFor, type GameState, type Level, type Loan } from '../../engine';
import type { TabProps } from '../Game';

const levelOrder: Level[] = ['conversa', 'pressao', 'primo'];

const stampTone: Record<Exclude<Loan['status'], 'active'>, Tone> = {
  paid: 'green',
  defaulted: 'red',
  lost: 'red',
  sold: 'dim',
  forgiven: 'amber',
};

export function Portfolio({ state, update }: TabProps) {
  const active = state.loans.filter((l) => l.status === 'active');
  const closed = state.loans
    .filter((l) => l.status !== 'active')
    .sort((a, b) => (b.endWeek ?? 0) - (a.endWeek ?? 0))
    .slice(0, 15);

  return (
    <div class="stack">
      <h2>{ui.portfolio.requests}</h2>
      {state.requests.length === 0 && (
        <>
          <Empty kind="requests" />
          <p class="dim">{ui.portfolio.noRequests}</p>
        </>
      )}
      {state.requests.map((r) => (
        <RequestCard
          key={r.id}
          request={r}
          limits={params.terms}
          memory="agiota"
          header={
            <div class="debtor">
              <Face debtor={r.debtor} tone="dim" />
              <div>
                <strong>{r.debtor.short}</strong>
                <div class="dim small">
                  {r.debtor.name} · {r.debtor.profession}
                </div>
              </div>
              <span class="mono amber big right">{money(r.amount)}</span>
            </div>
          }
          canLend={r.amount <= state.cash}
          noLendLabel={ui.portfolio.noCash}
          onLend={(monthlyRate, weeks, collateral) =>
            update(
              decide(state, { type: 'accept', requestId: r.id, monthlyRate, weeks, collateral }),
            )
          }
          onRefuse={() => update(decide(state, { type: 'refuse', requestId: r.id }))}
        />
      ))}

      <h2>{ui.portfolio.active}</h2>
      {active.length === 0 && (
        <>
          <Empty kind="loans" />
          <p class="dim">{ui.portfolio.noLoans}</p>
        </>
      )}
      {state.primoGone && <p class="amber small">{ui.levels.primoGone}</p>}
      {active.map((l) => (
        <LoanRow key={l.id} loan={l} state={state} update={update} />
      ))}

      {closed.length > 0 && (
        <>
          <h2>{ui.portfolio.closed}</h2>
          {closed.map((l) => (
            <LoanRow key={l.id} loan={l} state={state} update={update} />
          ))}
        </>
      )}
    </div>
  );
}

function LoanRow({
  loan: l,
  state,
  update,
}: {
  loan: Loan;
  state: GameState;
  update: (s: GameState) => void;
}) {
  const [askForgive, setAskForgive] = useState(false);
  const level = l.status === 'active' ? levelFor(state.policy, l, isPrimoOut(state)) : null;
  let status: string;
  let tone = 'dim';
  if (l.status === 'paid') {
    status = ui.portfolio.paid(money(l.totalPaid - l.principal));
    tone = 'green';
  } else if (l.status === 'defaulted') {
    status = ui.portfolio.defaulted(money(l.totalDue - l.totalPaid - l.recovered));
    tone = 'red';
  } else if (l.status === 'lost') {
    status = ui.portfolio.lost(money(l.totalDue - l.totalPaid));
    tone = 'red';
  } else if (l.status === 'sold') {
    status = ui.portfolio.sold;
  } else if (l.status === 'forgiven') {
    status = ui.portfolio.forgivenStatus(money(l.totalDue - l.totalPaid));
  } else if (l.missedStreak > 0) {
    status = ui.portfolio.late(l.missedStreak);
    tone = l.missedStreak >= 2 ? 'red' : 'amber';
  } else {
    status = ui.portfolio.upToDate;
    tone = 'green';
  }

  return (
    <article class={`card loan ${l.status !== 'active' ? 'closed art-stamped' : ''}`}>
      <div class="debtor">
        <Face debtor={l.debtor} tone={tone as Tone} />
        <div>
          <strong>{l.debtor.short}</strong>
          <div class={`small ${tone}`}>{status}</div>
        </div>
        <div class="right mono small">
          <div>{money(l.principal)}</div>
          <div class="dim">{ui.portfolio.rateShort(percent(l.monthlyRate))}</div>
        </div>
      </div>
      {l.status !== 'active' && (
        <div class="art-stamp-row">
          <Stamp text={ui.art.stamps[l.status]} tone={stampTone[l.status]} decorative />
        </div>
      )}
      {l.status === 'active' && (
        <Installments total={l.weeks} paid={l.paidInstallments} missed={l.missedStreak} />
      )}
      {l.status === 'active' && (
        <div class="row between small mono dim">
          <span>{ui.portfolio.progress(l.paidInstallments, l.weeks)}</span>
          <span>{ui.portfolio.installment(money(l.installment))}</span>
        </div>
      )}
      {level && <div class="small amber">{ui.portfolio.levelNow(ui.levels[level].name)}</div>}
      {l.status === 'active' && l.collateral && (
        <div class="small dim">
          {ui.portfolio.guarantee(collateralText[l.collateral.kind].label)}
        </div>
      )}
      {l.status === 'active' && (
        <div class="stack tight">
          <div class="row">
            <button
              class={`chip ${l.override === null ? 'on' : ''}`}
              aria-pressed={l.override === null}
              onClick={() =>
                update(decide(state, { type: 'setOverride', loanId: l.id, override: null }))
              }
            >
              {ui.portfolio.rule}
            </button>
            {levelOrder.map((lv) => (
              <button
                key={lv}
                class={`chip ${l.override === lv ? 'on' : ''}`}
                aria-pressed={l.override === lv}
                disabled={lv === 'primo' && state.primoGone}
                onClick={() =>
                  update(decide(state, { type: 'setOverride', loanId: l.id, override: lv }))
                }
              >
                {ui.levels[lv].chip}
              </button>
            ))}
          </div>
          {askForgive ? (
            <ConfirmBar
              text={ui.portfolio.confirmForgive(money(l.totalDue - l.totalPaid))}
              onYes={() => {
                setAskForgive(false);
                update(decide(state, { type: 'forgive', loanId: l.id }));
              }}
              onNo={() => setAskForgive(false)}
            />
          ) : (
            <button class="btn" onClick={() => setAskForgive(true)}>
              {ui.portfolio.forgive}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
