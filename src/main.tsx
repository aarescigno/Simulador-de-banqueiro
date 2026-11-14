import { render } from 'preact';
import { App } from './ui/App';
import './ui/theme.css';
import './ui/fx.css';

render(<App />, document.getElementById('app')!);
