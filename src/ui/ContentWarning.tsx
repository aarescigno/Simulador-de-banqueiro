import { ui } from '../content/ui';

export function ContentWarning({ onClose }: { onClose: () => void }) {
  return (
    <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="aviso-titulo">
      <div class="sheet">
        <h2 id="aviso-titulo">{ui.warning.title}</h2>
        {ui.warning.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p class="dim small">{ui.warning.cvv}</p>
        <button class="btn primary wide" onClick={onClose}>
          {ui.warning.ok}
        </button>
      </div>
    </div>
  );
}
