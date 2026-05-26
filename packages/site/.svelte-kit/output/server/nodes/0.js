import * as universal from '../entries/pages/_layout.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.js";
export const imports = ["_app/immutable/nodes/0.CtVitfRI.js","_app/immutable/chunks/scheduler.CNwRqMkk.js","_app/immutable/chunks/index.07a8Qjgb.js","_app/immutable/chunks/stores.4-0UsGor.js","_app/immutable/chunks/entry.BlZEh-MS.js","_app/immutable/chunks/index.BLAEFYc9.js","_app/immutable/chunks/lang.Bp33zFYR.js"];
export const stylesheets = ["_app/immutable/assets/0.Coun3Zo_.css"];
export const fonts = [];
