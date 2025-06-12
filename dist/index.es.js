class K {
  constructor(t) {
    this.key = t.key, this.getItems = t.getItems;
  }
}
class L {
  constructor(t) {
    this.key = t.key, this.tabs = t.tabs, this.actions = t.actions;
  }
}
class q {
  constructor(t) {
    this.key = t.key, this.dataProvider = t.dataProvider;
  }
}
class X {
  constructor(t) {
    this.key = t.key, this.action = t.action;
  }
}
class Y {
  constructor(t) {
    this.key = t.key, this.actions = t.actions, this.dataProvider = t.dataProvider;
  }
}
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const S = Symbol("Comlink.proxy"), I = Symbol("Comlink.endpoint"), O = Symbol("Comlink.releaseProxy"), b = Symbol("Comlink.finalizer"), k = Symbol("Comlink.thrown"), A = (e) => typeof e == "object" && e !== null || typeof e == "function", R = {
  canHandle: (e) => A(e) && e[S],
  serialize(e) {
    const { port1: t, port2: n } = new MessageChannel();
    return x(e, t), [n, [n]];
  },
  deserialize(e) {
    return e.start(), M(e);
  }
}, N = {
  canHandle: (e) => A(e) && k in e,
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
}, $ = /* @__PURE__ */ new Map([
  ["proxy", R],
  ["throw", N]
]);
function j(e, t) {
  for (const n of e)
    if (t === n || n === "*" || n instanceof RegExp && n.test(t))
      return !0;
  return !1;
}
function x(e, t = globalThis, n = ["*"]) {
  t.addEventListener("message", function i(s) {
    if (!s || !s.data)
      return;
    if (!j(n, s.origin)) {
      console.warn(`Invalid origin '${s.origin}' for comlink proxy`);
      return;
    }
    const { id: a, type: d, path: l } = Object.assign({ path: [] }, s.data), u = (s.data.argumentList || []).map(f);
    let r;
    try {
      const o = l.slice(0, -1).reduce((c, E) => c[E], e), h = l.reduce((c, E) => c[E], e);
      switch (d) {
        case "GET":
          r = h;
          break;
        case "SET":
          o[l.slice(-1)[0]] = f(s.data.value), r = !0;
          break;
        case "APPLY":
          r = h.apply(o, u);
          break;
        case "CONSTRUCT":
          {
            const c = new h(...u);
            r = W(c);
          }
          break;
        case "ENDPOINT":
          {
            const { port1: c, port2: E } = new MessageChannel();
            x(e, E), r = H(c, [c]);
          }
          break;
        case "RELEASE":
          r = void 0;
          break;
        default:
          return;
      }
    } catch (o) {
      r = { value: o, [k]: 0 };
    }
    Promise.resolve(r).catch((o) => ({ value: o, [k]: 0 })).then((o) => {
      const [h, c] = g(o);
      t.postMessage(Object.assign(Object.assign({}, h), { id: a }), c), d === "RELEASE" && (t.removeEventListener("message", i), p(t), b in e && typeof e[b] == "function" && e[b]());
    }).catch((o) => {
      const [h, c] = g({
        value: new TypeError("Unserializable return value"),
        [k]: 0
      });
      t.postMessage(Object.assign(Object.assign({}, h), { id: a }), c);
    });
  }), t.start && t.start();
}
function z(e) {
  return e.constructor.name === "MessagePort";
}
function p(e) {
  z(e) && e.close();
}
function M(e, t) {
  const n = /* @__PURE__ */ new Map();
  return e.addEventListener("message", function(s) {
    const { data: a } = s;
    if (!a || !a.id)
      return;
    const d = n.get(a.id);
    if (d)
      try {
        d(a);
      } finally {
        n.delete(a.id);
      }
  }), _(e, n, [], t);
}
function v(e) {
  if (e)
    throw new Error("Proxy has been released and is not useable");
}
function T(e) {
  return y(e, /* @__PURE__ */ new Map(), {
    type: "RELEASE"
  }).then(() => {
    p(e);
  });
}
const m = /* @__PURE__ */ new WeakMap(), w = "FinalizationRegistry" in globalThis && new FinalizationRegistry((e) => {
  const t = (m.get(e) || 0) - 1;
  m.set(e, t), t === 0 && T(e);
});
function B(e, t) {
  const n = (m.get(t) || 0) + 1;
  m.set(t, n), w && w.register(e, t, e);
}
function V(e) {
  w && w.unregister(e);
}
function _(e, t, n = [], i = function() {
}) {
  let s = !1;
  const a = new Proxy(i, {
    get(d, l) {
      if (v(s), l === O)
        return () => {
          V(a), T(e), t.clear(), s = !0;
        };
      if (l === "then") {
        if (n.length === 0)
          return { then: () => a };
        const u = y(e, t, {
          type: "GET",
          path: n.map((r) => r.toString())
        }).then(f);
        return u.then.bind(u);
      }
      return _(e, t, [...n, l]);
    },
    set(d, l, u) {
      v(s);
      const [r, o] = g(u);
      return y(e, t, {
        type: "SET",
        path: [...n, l].map((h) => h.toString()),
        value: r
      }, o).then(f);
    },
    apply(d, l, u) {
      v(s);
      const r = n[n.length - 1];
      if (r === I)
        return y(e, t, {
          type: "ENDPOINT"
        }).then(f);
      if (r === "bind")
        return _(e, t, n.slice(0, -1));
      const [o, h] = P(u);
      return y(e, t, {
        type: "APPLY",
        path: n.map((c) => c.toString()),
        argumentList: o
      }, h).then(f);
    },
    construct(d, l) {
      v(s);
      const [u, r] = P(l);
      return y(e, t, {
        type: "CONSTRUCT",
        path: n.map((o) => o.toString()),
        argumentList: u
      }, r).then(f);
    }
  });
  return B(a, e), a;
}
function D(e) {
  return Array.prototype.concat.apply([], e);
}
function P(e) {
  const t = e.map(g);
  return [t.map((n) => n[0]), D(t.map((n) => n[1]))];
}
const C = /* @__PURE__ */ new WeakMap();
function H(e, t) {
  return C.set(e, t), e;
}
function W(e) {
  return Object.assign(e, { [S]: !0 });
}
function g(e) {
  for (const [t, n] of $)
    if (n.canHandle(e)) {
      const [i, s] = n.serialize(e);
      return [
        {
          type: "HANDLER",
          name: t,
          value: i
        },
        s
      ];
    }
  return [
    {
      type: "RAW",
      value: e
    },
    C.get(e) || []
  ];
}
function f(e) {
  switch (e.type) {
    case "HANDLER":
      return $.get(e.name).deserialize(e.value);
    case "RAW":
      return e.value;
  }
}
function y(e, t, n, i) {
  return new Promise((s) => {
    const a = F();
    t.set(a, s), e.start && e.start(), e.postMessage(Object.assign({ id: a }, n), i);
  });
}
function F() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}
const U = {
  DEBUG: !1
};
class G {
  constructor() {
    this._events = /* @__PURE__ */ new Map(), x({ callEvent: this._callExtensionEvent.bind(this) }), this._studioWrapper = M(self);
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
    const i = this._events.get(t);
    if (U.DEBUG && console.log(this._events.keys()), !i)
      throw new Error(`[EXTENSION] Event with key "${t}" was not found.`);
    return i(...n);
  }
}
class Q {
  constructor() {
    this._eventLink = new G(), this.platformActions = [], this.parsers = [], this.views = [], this.application = {
      views: {
        register: async (t) => {
          var n, i;
          t instanceof L ? (t.tabs.forEach((s) => {
            this._eventLink.setExtensionEvent(`views:${t.key}:tabsView:${s.key}:loadItems:${s.dataProvider.key}`, s.dataProvider.getItems);
          }), (n = t.actions) == null || n.forEach((s) => {
            this._eventLink.setExtensionEvent(`views:${t.key}:actions:${s.key}`, s.action);
          })) : (this._eventLink.setExtensionEvent(`views:${t.key}:loadItems:${t.dataProvider.key}`, t.dataProvider.getItems), (i = t.actions) == null || i.forEach((s) => {
            this._eventLink.setExtensionEvent(`views:${t.key}:actions:${s.key}`, s.action);
          }));
        },
        unregister: async (t) => {
          var n, i;
          t instanceof L ? (t.tabs.forEach((s) => {
            this._eventLink.removeExtensionEvent(`views:${t.key}:tabsView:${s.key}:loadItems:${s.dataProvider.key}`);
          }), (n = t.actions) == null || n.forEach((s) => {
            this._eventLink.removeExtensionEvent(`views:${t.key}:actions:${s.key}`);
          })) : (this._eventLink.removeExtensionEvent(`views:${t.key}:loadItems:${t.dataProvider.key}`), (i = t.actions) == null || i.forEach((s) => {
            this._eventLink.removeExtensionEvent(`views:${t.key}:actions:${s.key}`);
          }));
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
        downloadFile: async (t, n, i) => await this._eventLink.callStudioEvent("download:file", t, n, i),
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
    const n = this.platformActions.flatMap((i) => "action" in i ? [i] : i.actions).find((i) => i.key === t);
    if (!n) throw new Error(`Action with key "${t}" not found`);
    return await n.action();
  }
  async _parsers(t) {
    const n = this.parsers.find((i) => i.key === t);
    if (!n) throw new Error(`Parser with key "${t}" not found`);
    return await n.parser();
  }
}
class J {
  constructor(t) {
    if (this.key = t.key, this.icon = t.icon, this.extra = t.extra, this.description = t.description, "title" in t && t.title !== void 0 && (this.title = t.title), "label" in t && t.label !== void 0 && (this.label = t.label), "children" in t && t.children !== void 0 && (this.children = t.children), this.title && this.label || !this.title && !this.label)
      throw new Error("ListViewItem must have either a `title` or a `label`, but not both.");
  }
}
export {
  X as Action,
  U as Envs,
  Q as ExtensionBase,
  K as ListProvider,
  J as ListViewItem,
  q as TabView,
  L as TabsView,
  Y as View
};
//# sourceMappingURL=index.es.js.map
