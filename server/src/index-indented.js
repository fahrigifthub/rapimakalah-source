import { register } from 'node:module';
register('./repairs/indent-loader.js', import.meta.url);
await import('./index.js');
