import { register } from 'node:module';
register('./repairs/bibliography-loader.js', import.meta.url);
await import('./index.js');
