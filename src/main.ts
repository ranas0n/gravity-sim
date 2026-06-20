import './styles.css';
import { createApp } from './app/createApp';

const disposeApp = createApp();

window.addEventListener('beforeunload', disposeApp, { once: true });
