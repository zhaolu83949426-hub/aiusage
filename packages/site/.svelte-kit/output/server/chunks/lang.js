import { w as writable } from "./index.js";
function createLangStore() {
  const { subscribe, update } = writable("zh");
  return {
    subscribe,
    toggle: () => update((v) => v === "zh" ? "en" : "zh")
  };
}
const lang = createLangStore();
export {
  lang as l
};
