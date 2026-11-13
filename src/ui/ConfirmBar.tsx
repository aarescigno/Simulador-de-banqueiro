import { ui } from '../content/ui';

/** Confirmação dentro do jogo, no lugar do window.confirm: frase de aviso e dois botões. */
export function ConfirmBar(props: { text: string; onYes: () => void; onNo: () => void }) {
  return (
    <div class="inquiry-bar stack tight" role="alertdialog">
      <span class="small amber">{props.text}</span>
      <div class="pair">
        <button class="btn danger" onClick={props.onYes}>
          {ui.confirm.yes}
        </button>
        <button class="btn" onClick={props.onNo}>
          {ui.confirm.no}
        </button>
      </div>
    </div>
  );
}
