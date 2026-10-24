import { ui } from '../content/ui';

export function App() {
  return (
    <main class="menu">
      <h1>{ui.title}</h1>
      <p class="dim">{ui.tagline}</p>
      <p class="version mono">{ui.version(__APP_VERSION__)}</p>
    </main>
  );
}
