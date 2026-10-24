import { useRegisterSW } from 'virtual:pwa-register/preact';
import { ui } from '../content/ui';

// Nunca recarrega sozinho: só quando o jogador toca em "atualizar".
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;
  return (
    <div class="toast" role="status">
      <span>{ui.update.message}</span>
      <button class="btn primary" onClick={() => updateServiceWorker(true)}>
        {ui.update.action}
      </button>
      <button class="btn" onClick={() => setNeedRefresh(false)}>
        {ui.update.later}
      </button>
    </div>
  );
}
