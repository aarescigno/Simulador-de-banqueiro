import { useState } from 'preact/hooks';
import { collateralText } from '../../content/collateral';
import { cities, porteLabel } from '../../content/companies';
import { escUi } from '../../content/escLoans';
import { money, percent } from '../../content/format';
import { escLoans } from '../../content/params';
import { ui } from '../../content/ui';
import {
  decide,
  escCanAccept,
  escHeadroom,
  executionQuote,
  type Company,
  type GameState,
  type Loan,
} from '../../engine';
import { ConfirmBar } from '../ConfirmBar';
import { RequestCard } from '../RequestCard';
import { Empty, Face, Installments, Stamp, type Tone } from '../art';
import type { TabProps } from '../Game';

const stampTone: Record<Exclude<Loan['status'], 'active'>, Tone> = {
  paid: 'green',
  defaulted: 'red',
  lost: 'red',
  sold: 'dim',
  forgiven: 'amber',
};

/** Chips de sinal da empresa: faturamento, anos de CNPJ, nome limpo ou no Serasa. */
function Signs({ company: c }: { company: Company }) {
  const t = escUi.portfolio;
  return (
    <div class="row">
      <span class="chip static">{t.revenue(money(c.revenue))}</span>
      <span class="chip static">{t.years(c.years)}</span>
      <span class={`chip static ${c.serasa ? 'amber' : ''}`}>{c.serasa ? t.serasa : t.clean}</span>
    </div>
  );
}

export function EscPortfolio({ state, update }: TabProps) {
  const active = state.loans.filter((l) => l.status === 'active');
  const closed = state.loans
    .filter((l) => l.status !== 'active')
    .sort((a, b) => (b.endWeek ?? 0) - (a.endWeek ?? 0))
    .slice(0, 15);
  const free = escHeadroom(state);

  return (
    <div class="stack">
      <h2>{ui.portfolio.requests}</h2>
      {state.requests.length === 0 && (
        <>
          <Empty kind="requests" />
          <p class="dim">{ui.portfolio.noRequests}</p>
        </>
      )}
      {state.requests.map((r) => {
        const c = r.company!;
        const over = r.amount > free;
        return (
          <RequestCard
            key={r.id}
            request={r}
            limits={escLoans.terms}
            memory="esc"
            header={
              <>
                <div class="debtor">
                  <Face debtor={r.debtor} tone="dim" />
                  <div>
                    <strong>{c.name}</strong>
                    <div class="dim small">
                      {escUi.portfolio.owner(r.debtor.short, porteLabel[c.porte])}
                    </div>
                    <div class="dim small">
                      {c.city}
                      {c.cityKind === 'vizinho' && ` · ${cities.neighborTag}`}
                    </div>
                  </div>
                  <span class="mono amber big right">{money(r.amount)}</span>
                </div>
                <Signs company={c} />
              </>
            }
            canLend={escCanAccept(state, r.id)}
            noLendLabel={over ? escUi.portfolio.overLimit(money(free)) : ui.portfolio.noCash}
            onLend={(monthlyRate, weeks, collateral) =>
              update(
                decide(state, { type: 'accept', requestId: r.id, monthlyRate, weeks, collateral }),
              )
            }
            onRefuse={() => update(decide(state, { type: 'refuse', requestId: r.id }))}
          />
        );
      })}

      <h2>{ui.portfolio.active}</h2>
      {active.length === 0 && (
        <>
          <Empty kind="loans" />
          <p class="dim">{ui.portfolio.noLoans}</p>
        </>
      )}
      {active.map((l) => (
        <EscLoanRow key={l.id} loan={l} state={state} update={update} />
      ))}

      {closed.length > 0 && (
        <>
          <h2>{ui.portfolio.closed}</h2>
          {closed.map((l) => (
            <EscLoanRow key={l.id} loan={l} state={state} update={update} />
          ))}
        </>
      )}
    </div>
  );
}

function EscLoanRow({
  loan: l,
  state,
  update,
}: {
  loan: Loan;
  state: GameState;
  update: (s: GameState) => void;
}) {
  const [ask, setAsk] = useState(false);
  const name = l.company?.name ?? l.debtor.short;
  let status: string;
  let tone = 'dim';
  if (l.status === 'paid') {
    status = ui.portfolio.paid(money(l.totalPaid - l.principal));
    tone = 'green';
  } else if (l.status === 'defaulted') {
    status = ui.portfolio.defaulted(money(l.totalDue - l.totalPaid - l.recovered));
    tone = 'red';
  } else if (l.status === 'sold') {
    status = ui.portfolio.sold;
  } else if (l.status !== 'active') {
    status = ui.portfolio.lost(money(l.totalDue - l.totalPaid));
    tone = 'red';
  } else if (l.missedStreak > 0) {
    status = ui.portfolio.late(l.missedStreak);
    tone = l.missedStreak >= 2 ? 'red' : 'amber';
  } else {
    status = ui.portfolio.upToDate;
    tone = 'green';
  }
  const step = l.escLevel && l.escLevel !== 'execucao' ? l.escLevel : null;

  return (
    <article class={`card loan ${l.status !== 'active' ? 'closed art-stamped' : ''}`}>
      <div class="debtor">
        <Face debtor={l.debtor} tone={tone as Tone} />
        <div>
          <strong>{name}</strong>
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
        <>
          <Installments total={l.weeks} paid={l.paidInstallments} missed={l.missedStreak} />
          <div class="row between small mono dim">
            <span>{ui.portfolio.progress(l.paidInstallments, l.weeks)}</span>
            <span>{ui.portfolio.installment(money(l.installment))}</span>
          </div>
          {step && l.missedStreak > 0 && (
            <div class="small amber">{escUi.portfolio.stepNow[step]}</div>
          )}
          {l.collateral && (
            <div class="small dim">
              {ui.portfolio.guarantee(collateralText[l.collateral.kind].label)}
            </div>
          )}
          {l.missedStreak > 0 &&
            (ask ? (
              <ConfirmBar
                text={escUi.portfolio.confirmExecute(name, money(executionQuote(l)))}
                onYes={() => {
                  setAsk(false);
                  update(decide(state, { type: 'execute', loanId: l.id }));
                }}
                onNo={() => setAsk(false)}
              />
            ) : (
              <button class="btn" onClick={() => setAsk(true)}>
                {escUi.portfolio.execute}
              </button>
            ))}
        </>
      )}
    </article>
  );
}
