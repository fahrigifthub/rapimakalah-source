import { register } from 'node:module';

register('./repairs/loader.js', import.meta.url);
await import('./index.js');
