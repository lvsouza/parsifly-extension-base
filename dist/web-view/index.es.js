import { e as a, w as d } from "../comlink-BsE2Av_T.mjs";
const w = () => {
  if (window.studioApi) return window.studioApi;
  const t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), o = new MessageChannel();
  a({
    async send(...e) {
      const s = [];
      for (const i of n)
        s.push(i(...e));
      await Promise.all(s);
    },
    async sendDragEvent(...e) {
      const s = [];
      for (const i of t)
        s.push(i(...e));
      await Promise.all(s);
    }
  }, o.port1), window.parent.postMessage({ type: "connect" }, "*", [o.port2]);
  const r = d(o.port1);
  return window.studioApi = {
    send: r.send,
    subscribeToMessage(e) {
      return n.add(e), () => n.delete(e);
    },
    subscribeToDragEvent(e) {
      return t.add(e), () => t.delete(e);
    }
  }, window.studioApi;
};
export {
  w as acquireStudioApi
};
//# sourceMappingURL=index.es.js.map
