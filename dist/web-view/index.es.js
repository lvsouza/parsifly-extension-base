import { e as i, w as r } from "../comlink-BsE2Av_T.mjs";
const d = () => {
  if (window.studioApi) return window.studioApi;
  const t = /* @__PURE__ */ new Set(), o = new MessageChannel();
  i({
    async send(...e) {
      t.forEach((n) => n(...e));
    }
  }, o.port1), window.parent.postMessage({ type: "connect" }, "*", [o.port2]);
  const s = r(o.port1);
  return window.studioApi = {
    send: s.send,
    subscribeToMessage(e) {
      return t.add(e), () => t.delete(e);
    }
  }, window.studioApi;
};
export {
  d as acquireStudioApi
};
//# sourceMappingURL=index.es.js.map
