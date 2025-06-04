class U {
  constructor(t) {
    this.key = t.key, this.getItems = t.getItems;
  }
}
class K {
  constructor(t) {
    this.key = t.key, this.action = t.action;
  }
}
class G {
  constructor(t) {
    this.key = t.key, this.actions = t.actions, this.dataProvider = t.dataProvider;
  }
}
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const x = Symbol("Comlink.proxy"), T = Symbol("Comlink.endpoint"), R = Symbol("Comlink.releaseProxy"), p = Symbol("Comlink.finalizer"), w = Symbol("Comlink.thrown"), P = (e) => typeof e == "object" && e !== null || typeof e == "function", I = {
  canHandle: (e) => P(e) && e[x],
  serialize(e) {
    const { port1: t, port2: n } = new MessageChannel();
    return _(e, t), [n, [n]];
  },
  deserialize(e) {
    return e.start(), M(e);
  }
}, N = {
  canHandle: (e) => P(e) && w in e,
  serialize({ value: e }) {
    let t;
    return e instanceof Error ? t = {
      isError: !0,
      value: {
        message: e.message,
        name: e.name,
        stack: e.stack
      }
    } : t = { isError: !1, value: e }, [t, []];
  },
  deserialize(e) {
    throw e.isError ? Object.assign(new Error(e.value.message), e.value) : e.value;
  }
}, L = /* @__PURE__ */ new Map([
  ["proxy", I],
  ["throw", N]
]);
function $(e, t) {
  for (const n of e)
    if (t === n || n === "*" || n instanceof RegExp && n.test(t))
      return !0;
  return !1;
}
function _(e, t = globalThis, n = ["*"]) {
  t.addEventListener("message", function r(s) {
    if (!s || !s.data)
      return;
    if (!$(n, s.origin)) {
      console.warn(`Invalid origin '${s.origin}' for comlink proxy`);
      return;
    }
    const { id: i, type: f, path: l } = Object.assign({ path: [] }, s.data), u = (s.data.argumentList || []).map(h);
    let a;
    try {
      const o = l.slice(0, -1).reduce((c, E) => c[E], e), d = l.reduce((c, E) => c[E], e);
      switch (f) {
        case "GET":
          a = d;
          break;
        case "SET":
          o[l.slice(-1)[0]] = h(s.data.value), a = !0;
          break;
        case "APPLY":
          a = d.apply(o, u);
          break;
        case "CONSTRUCT":
          {
            const c = new d(...u);
            a = W(c);
          }
          break;
        case "ENDPOINT":
          {
            const { port1: c, port2: E } = new MessageChannel();
            _(e, E), a = V(c, [c]);
          }
          break;
        case "RELEASE":
          a = void 0;
          break;
        default:
          return;
      }
    } catch (o) {
      a = { value: o, [w]: 0 };
    }
    Promise.resolve(a).catch((o) => ({ value: o, [w]: 0 })).then((o) => {
      const [d, c] = k(o);
      t.postMessage(Object.assign(Object.assign({}, d), { id: i }), c), f === "RELEASE" && (t.removeEventListener("message", r), A(t), p in e && typeof e[p] == "function" && e[p]());
    }).catch((o) => {
      const [d, c] = k({
        value: new TypeError("Unserializable return value"),
        [w]: 0
      });
      t.postMessage(Object.assign(Object.assign({}, d), { id: i }), c);
    });
  }), t.start && t.start();
}
function j(e) {
  return e.constructor.name === "MessagePort";
}
function A(e) {
  j(e) && e.close();
}
function M(e, t) {
  const n = /* @__PURE__ */ new Map();
  return e.addEventListener("message", function(s) {
    const { data: i } = s;
    if (!i || !i.id)
      return;
    const f = n.get(i.id);
    if (f)
      try {
        f(i);
      } finally {
        n.delete(i.id);
      }
  }), b(e, n, [], t);
}
function v(e) {
  if (e)
    throw new Error("Proxy has been released and is not useable");
}
function C(e) {
  return y(e, /* @__PURE__ */ new Map(), {
    type: "RELEASE"
  }).then(() => {
    A(e);
  });
}
const m = /* @__PURE__ */ new WeakMap(), g = "FinalizationRegistry" in globalThis && new FinalizationRegistry((e) => {
  const t = (m.get(e) || 0) - 1;
  m.set(e, t), t === 0 && C(e);
});
function z(e, t) {
  const n = (m.get(t) || 0) + 1;
  m.set(t, n), g && g.register(e, t, e);
}
function B(e) {
  g && g.unregister(e);
}
function b(e, t, n = [], r = function() {
}) {
  let s = !1;
  const i = new Proxy(r, {
    get(f, l) {
      if (v(s), l === R)
        return () => {
          B(i), C(e), t.clear(), s = !0;
        };
      if (l === "then") {
        if (n.length === 0)
          return { then: () => i };
        const u = y(e, t, {
          type: "GET",
          path: n.map((a) => a.toString())
        }).then(h);
        return u.then.bind(u);
      }
      return b(e, t, [...n, l]);
    },
    set(f, l, u) {
      v(s);
      const [a, o] = k(u);
      return y(e, t, {
        type: "SET",
        path: [...n, l].map((d) => d.toString()),
        value: a
      }, o).then(h);
    },
    apply(f, l, u) {
      v(s);
      const a = n[n.length - 1];
      if (a === T)
        return y(e, t, {
          type: "ENDPOINT"
        }).then(h);
      if (a === "bind")
        return b(e, t, n.slice(0, -1));
      const [o, d] = S(u);
      return y(e, t, {
        type: "APPLY",
        path: n.map((c) => c.toString()),
        argumentList: o
      }, d).then(h);
    },
    construct(f, l) {
      v(s);
      const [u, a] = S(l);
      return y(e, t, {
        type: "CONSTRUCT",
        path: n.map((o) => o.toString()),
        argumentList: u
      }, a).then(h);
    }
  });
  return z(i, e), i;
}
function H(e) {
  return Array.prototype.concat.apply([], e);
}
function S(e) {
  const t = e.map(k);
  return [t.map((n) => n[0]), H(t.map((n) => n[1]))];
}
const O = /* @__PURE__ */ new WeakMap();
function V(e, t) {
  return O.set(e, t), e;
}
function W(e) {
  return Object.assign(e, { [x]: !0 });
}
function k(e) {
  for (const [t, n] of L)
    if (n.canHandle(e)) {
      const [r, s] = n.serialize(e);
      return [
        {
          type: "HANDLER",
          name: t,
          value: r
        },
        s
      ];
    }
  return [
    {
      type: "RAW",
      value: e
    },
    O.get(e) || []
  ];
}
function h(e) {
  switch (e.type) {
    case "HANDLER":
      return L.get(e.name).deserialize(e.value);
    case "RAW":
      return e.value;
  }
}
function y(e, t, n, r) {
  return new Promise((s) => {
    const i = F();
    t.set(i, s), e.start && e.start(), e.postMessage(Object.assign({ id: i }, n), r);
  });
}
function F() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}
class D {
  constructor() {
    this._events = /* @__PURE__ */ new Map(), _({ callEvent: this._callExtensionEvent.bind(this) }), this._studioWrapper = M(self);
  }
  setExtensionEvent(t, n) {
    this._events.set(t, n);
  }
  removeExtensionEvent(t) {
    this._events.delete(t);
  }
  async callStudioEvent(t, ...n) {
    return this._studioWrapper.callEvent(t, ...n);
  }
  async _callExtensionEvent(t, ...n) {
    const r = this._events.get(t);
    if (!r)
      throw new Error(`[EXTENSION] Event with key "${t}" was not found.`);
    return r(...n);
  }
}
class q {
  constructor() {
    this._eventLink = new D(), this.platformActions = [], this.parsers = [], this.views = [], this.application = {
      views: {
        register: async (t) => {
          var n;
          this._eventLink.setExtensionEvent(`views:${t.key}:loadItems:${t.dataProvider.key}`, t.dataProvider.getItems), (n = t.actions) == null || n.forEach((r) => {
            this._eventLink.setExtensionEvent(`views:${t.key}:actions:${r.key}`, r.action);
          });
        },
        unregister: async (t) => {
          var n;
          this._eventLink.removeExtensionEvent(`views:${t.key}:loadItems:${t.dataProvider.key}`), (n = t.actions) == null || n.forEach((r) => {
            this._eventLink.removeExtensionEvent(`views:${t.key}:actions:${r.key}`);
          });
        }
      },
      commands: {
        /**
         * Allow you to call a custom command from application
         * 
         * @param key Name of the command
         * @param args List of arguments to be forwarded to the command call
         */
        callCustomCommand: async (t, ...n) => await this._eventLink.callStudioEvent(t, ...n),
        /**
         * Allow you to download some content in a file
         * 
         * @param fileName Name of the generated file
         * @param fileType extension of the file
         * @param fileContent file content in string
         */
        downloadFile: async (t, n, r) => await this._eventLink.callStudioEvent("download:file", t, n, r),
        /**
         * Allow you to download a lot of files and folders as zip
         * 
         * @param downloadName Name of the download as zip
         * @param files List of files or folders to download
         */
        downloadFiles: async (t, n) => await this._eventLink.callStudioEvent("download:files", t, n),
        /**
         * Grouped methods to editor configuration
         */
        editor: {
          /**
           * Allow to show some feedback to the platform user
           * 
           * @param message Message of the feedback
           * @param type type of the feedback
           */
          feedback: async (t, n) => await this._eventLink.callStudioEvent("editor:feedback", t, n),
          /**
           * Allow to capture user freeform text input
           * 
           * @param props Props to configure the quick pick
           */
          showQuickPick: async (t) => await this._eventLink.callStudioEvent("editor:quickPick:show", t),
          /**
           * Allow to set primary side bar view by key
           * 
           * @param key Key to identify the view to show in the side bar
           */
          showPrimarySideBarByKey: async (t) => await this._eventLink.callStudioEvent("editor:primarySideBar:showByKey", t),
          /**
           * Allow to set secondary side bar view by key
           * 
           * @param key Key to identify the view to show in the side bar
           */
          showSecondarySideBarByKey: async (t) => await this._eventLink.callStudioEvent("editor:secondarySideBar:showByKey", t)
        }
      },
      dataProviders: {
        /**
         * Allow you to call a custom command from application
         * 
         * @param key Name of the command
         * @param args List of arguments to be forwarded to the command call
         */
        callCustomDataProvider: async (t, ...n) => await this._eventLink.callStudioEvent(t, ...n),
        /**
         * Allow you to get the entire project object or get parts with ...project.pages(), .services(), .components() and more.
         */
        project: Object.assign(
          async () => await this._eventLink.callStudioEvent("project"),
          {
            pages: async (t) => await this._eventLink.callStudioEvent("project.pages", t),
            services: async (t) => await this._eventLink.callStudioEvent("project.services", t),
            components: async (t) => await this._eventLink.callStudioEvent("project.components", t)
          }
        )
      }
    }, this._eventLink.setExtensionEvent("activate", this.activate.bind(this)), this._eventLink.setExtensionEvent("deactivate", this.deactivate.bind(this)), this._eventLink.setExtensionEvent("parsers", this._parsers.bind(this)), this._eventLink.setExtensionEvent("platformActions", this._platformActions.bind(this));
  }
  /**
   * Automatically called when the extension start.
   */
  async activate() {
    console.log("Extension activated (base implementation).");
  }
  /**
   * Automatically called when the extension stop.
   */
  async deactivate() {
    console.log("Extension deactivated (base implementation).");
  }
  async _platformActions(t) {
    const n = this.platformActions.flatMap((r) => "action" in r ? [r] : r.actions).find((r) => r.key === t);
    if (!n) throw new Error(`Action with key "${t}" not found`);
    return await n.action();
  }
  async _parsers(t) {
    const n = this.parsers.find((r) => r.key === t);
    if (!n) throw new Error(`Parser with key "${t}" not found`);
    return await n.parser();
  }
}
export {
  K as Action,
  q as ExtensionBase,
  U as ListProvider,
  G as View
};
//# sourceMappingURL=index.es.js.map
