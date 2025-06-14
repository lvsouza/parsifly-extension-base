class X {
  constructor(e) {
    this.key = e.key, "action" in e && (this.action = e.action), "actions" in e && (this.actions = e.actions);
  }
  isSingle() {
    return typeof this.action == "function";
  }
  isMulti() {
    return Array.isArray(this.actions);
  }
}
class Y {
  constructor(e) {
    this.key = e.key, this.getItems = e.getItems, this.onItemClick = e.onItemClick, this.onItemDoubleClick = e.onItemDoubleClick;
  }
}
class L {
  constructor(e) {
    this.key = e.key, this.tabs = e.tabs, this.actions = e.actions;
  }
}
class Q {
  constructor(e) {
    this.key = e.key, this.dataProvider = e.dataProvider;
  }
}
class V {
  constructor(e) {
    this.key = e.key, this.action = e.action;
  }
}
class J {
  constructor(e) {
    this.key = e.key, this.actions = e.actions, this.dataProvider = e.dataProvider;
  }
}
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const C = Symbol("Comlink.proxy"), O = Symbol("Comlink.endpoint"), A = Symbol("Comlink.releaseProxy"), b = Symbol("Comlink.finalizer"), f = Symbol("Comlink.thrown"), I = (t) => typeof t == "object" && t !== null || typeof t == "function", R = {
  canHandle: (t) => I(t) && t[C],
  serialize(t) {
    const { port1: e, port2: n } = new MessageChannel();
    return _(t, e), [n, [n]];
  },
  deserialize(t) {
    return t.start(), M(t);
  }
}, N = {
  canHandle: (t) => I(t) && f in t,
  serialize({ value: t }) {
    let e;
    return t instanceof Error ? e = {
      isError: !0,
      value: {
        message: t.message,
        name: t.name,
        stack: t.stack
      }
    } : e = { isError: !1, value: t }, [e, []];
  },
  deserialize(t) {
    throw t.isError ? Object.assign(new Error(t.value.message), t.value) : t.value;
  }
}, w = /* @__PURE__ */ new Map([
  ["proxy", R],
  ["throw", N]
]);
function j(t, e) {
  for (const n of t)
    if (e === n || n === "*" || n instanceof RegExp && n.test(e))
      return !0;
  return !1;
}
function _(t, e = globalThis, n = ["*"]) {
  e.addEventListener("message", function s(i) {
    if (!i || !i.data)
      return;
    if (!j(n, i.origin)) {
      console.warn(`Invalid origin '${i.origin}' for comlink proxy`);
      return;
    }
    const { id: a, type: k, path: l } = Object.assign({ path: [] }, i.data), d = (i.data.argumentList || []).map(y);
    let r;
    try {
      const o = l.slice(0, -1).reduce((c, v) => c[v], t), u = l.reduce((c, v) => c[v], t);
      switch (k) {
        case "GET":
          r = u;
          break;
        case "SET":
          o[l.slice(-1)[0]] = y(i.data.value), r = !0;
          break;
        case "APPLY":
          r = u.apply(o, d);
          break;
        case "CONSTRUCT":
          {
            const c = new u(...d);
            r = U(c);
          }
          break;
        case "ENDPOINT":
          {
            const { port1: c, port2: v } = new MessageChannel();
            _(t, v), r = F(c, [c]);
          }
          break;
        case "RELEASE":
          r = void 0;
          break;
        default:
          return;
      }
    } catch (o) {
      r = { value: o, [f]: 0 };
    }
    Promise.resolve(r).catch((o) => ({ value: o, [f]: 0 })).then((o) => {
      const [u, c] = P(o);
      e.postMessage(Object.assign(Object.assign({}, u), { id: a }), c), k === "RELEASE" && (e.removeEventListener("message", s), S(e), b in t && typeof t[b] == "function" && t[b]());
    }).catch((o) => {
      const [u, c] = P({
        value: new TypeError("Unserializable return value"),
        [f]: 0
      });
      e.postMessage(Object.assign(Object.assign({}, u), { id: a }), c);
    });
  }), e.start && e.start();
}
function z(t) {
  return t.constructor.name === "MessagePort";
}
function S(t) {
  z(t) && t.close();
}
function M(t, e) {
  const n = /* @__PURE__ */ new Map();
  return t.addEventListener("message", function(i) {
    const { data: a } = i;
    if (!a || !a.id)
      return;
    const k = n.get(a.id);
    if (k)
      try {
        k(a);
      } finally {
        n.delete(a.id);
      }
  }), x(t, n, [], e);
}
function E(t) {
  if (t)
    throw new Error("Proxy has been released and is not useable");
}
function D(t) {
  return h(t, /* @__PURE__ */ new Map(), {
    type: "RELEASE"
  }).then(() => {
    S(t);
  });
}
const m = /* @__PURE__ */ new WeakMap(), g = "FinalizationRegistry" in globalThis && new FinalizationRegistry((t) => {
  const e = (m.get(t) || 0) - 1;
  m.set(t, e), e === 0 && D(t);
});
function B(t, e) {
  const n = (m.get(e) || 0) + 1;
  m.set(e, n), g && g.register(t, e, t);
}
function H(t) {
  g && g.unregister(t);
}
function x(t, e, n = [], s = function() {
}) {
  let i = !1;
  const a = new Proxy(s, {
    get(k, l) {
      if (E(i), l === A)
        return () => {
          H(a), D(t), e.clear(), i = !0;
        };
      if (l === "then") {
        if (n.length === 0)
          return { then: () => a };
        const d = h(t, e, {
          type: "GET",
          path: n.map((r) => r.toString())
        }).then(y);
        return d.then.bind(d);
      }
      return x(t, e, [...n, l]);
    },
    set(k, l, d) {
      E(i);
      const [r, o] = P(d);
      return h(t, e, {
        type: "SET",
        path: [...n, l].map((u) => u.toString()),
        value: r
      }, o).then(y);
    },
    apply(k, l, d) {
      E(i);
      const r = n[n.length - 1];
      if (r === O)
        return h(t, e, {
          type: "ENDPOINT"
        }).then(y);
      if (r === "bind")
        return x(t, e, n.slice(0, -1));
      const [o, u] = $(d);
      return h(t, e, {
        type: "APPLY",
        path: n.map((c) => c.toString()),
        argumentList: o
      }, u).then(y);
    },
    construct(k, l) {
      E(i);
      const [d, r] = $(l);
      return h(t, e, {
        type: "CONSTRUCT",
        path: n.map((o) => o.toString()),
        argumentList: d
      }, r).then(y);
    }
  });
  return B(a, t), a;
}
function W(t) {
  return Array.prototype.concat.apply([], t);
}
function $(t) {
  const e = t.map(P);
  return [e.map((n) => n[0]), W(e.map((n) => n[1]))];
}
const T = /* @__PURE__ */ new WeakMap();
function F(t, e) {
  return T.set(t, e), t;
}
function U(t) {
  return Object.assign(t, { [C]: !0 });
}
function P(t) {
  for (const [e, n] of w)
    if (n.canHandle(t)) {
      const [s, i] = n.serialize(t);
      return [
        {
          type: "HANDLER",
          name: e,
          value: s
        },
        i
      ];
    }
  return [
    {
      type: "RAW",
      value: t
    },
    T.get(t) || []
  ];
}
function y(t) {
  switch (t.type) {
    case "HANDLER":
      return w.get(t.name).deserialize(t.value);
    case "RAW":
      return t.value;
  }
}
function h(t, e, n, s) {
  return new Promise((i) => {
    const a = G();
    e.set(a, i), t.start && t.start(), t.postMessage(Object.assign({ id: a }, n), s);
  });
}
function G() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}
const K = {
  DEBUG: !1
};
class q {
  constructor() {
    this._events = /* @__PURE__ */ new Map(), _({ callEvent: this._callExtensionEvent.bind(this) }), this._studioWrapper = M(self);
  }
  setExtensionEvent(e, n) {
    this._events.set(e, n);
  }
  removeExtensionEvent(e) {
    this._events.delete(e);
  }
  async callStudioEvent(e, ...n) {
    return this._studioWrapper.callEvent(e, ...n);
  }
  async _callExtensionEvent(e, ...n) {
    const s = this._events.get(e);
    if (K.DEBUG && console.log(this._events.keys()), !s)
      throw new Error(`[EXTENSION] Event with key "${e}" was not found.`);
    return s(...n);
  }
}
class Z {
  constructor() {
    this._eventLink = new q(), this.application = {
      platformActions: {
        register: async (e) => {
          e.action ? this._eventLink.setExtensionEvent(`platformActions:${e.key}`, e.action) : e.actions && e.actions.forEach((n) => {
            this._eventLink.setExtensionEvent(`platformActions:${e.key}:actions:${n.key}`, n.action);
          });
        },
        unregister: async (e) => {
          e.action ? this._eventLink.removeExtensionEvent(`platformActions:${e.key}`) : e.actions && e.actions.forEach((n) => {
            this._eventLink.removeExtensionEvent(`platformActions:${e.key}:actions:${n.key}`);
          });
        }
      },
      parsers: {
        register: async (e) => {
          this._eventLink.setExtensionEvent(`parsers:${e.key}`, e.parser);
        },
        unregister: async (e) => {
          this._eventLink.removeExtensionEvent(`parsers:${e.key}`);
        }
      },
      views: {
        register: async (e) => {
          var n, s;
          e instanceof L ? (e.tabs.forEach((i) => {
            this._eventLink.setExtensionEvent(`views:${e.key}:tabsView:${i.key}:loadItems:${i.dataProvider.key}`, i.dataProvider.getItems), i.dataProvider.onItemClick && this._eventLink.setExtensionEvent(`views:${e.key}:tabsView:${i.key}:onItemClick:${i.dataProvider.key}`, i.dataProvider.onItemClick), i.dataProvider.onItemDoubleClick && this._eventLink.setExtensionEvent(`views:${e.key}:tabsView:${i.key}:onItemDoubleClick:${i.dataProvider.key}`, i.dataProvider.onItemDoubleClick);
          }), (n = e.actions) == null || n.forEach((i) => {
            this._eventLink.setExtensionEvent(`views:${e.key}:actions:${i.key}`, i.action);
          })) : (this._eventLink.setExtensionEvent(`views:${e.key}:loadItems:${e.dataProvider.key}`, e.dataProvider.getItems), e.dataProvider.onItemClick && this._eventLink.setExtensionEvent(`views:${e.key}:onItemClick:${e.dataProvider.key}`, e.dataProvider.onItemClick), e.dataProvider.onItemDoubleClick && this._eventLink.setExtensionEvent(`views:${e.key}:onItemDoubleClick:${e.dataProvider.key}`, e.dataProvider.onItemDoubleClick), (s = e.actions) == null || s.forEach((i) => {
            this._eventLink.setExtensionEvent(`views:${e.key}:actions:${i.key}`, i.action);
          }));
        },
        unregister: async (e) => {
          var n, s;
          e instanceof L ? (e.tabs.forEach((i) => {
            this._eventLink.removeExtensionEvent(`views:${e.key}:tabsView:${i.key}:loadItems:${i.dataProvider.key}`), i.dataProvider.onItemClick && this._eventLink.removeExtensionEvent(`views:${e.key}:tabsView:${i.key}:onItemClick:${i.dataProvider.key}`), i.dataProvider.onItemDoubleClick && this._eventLink.removeExtensionEvent(`views:${e.key}:tabsView:${i.key}:onItemDoubleClick:${i.dataProvider.key}`);
          }), (n = e.actions) == null || n.forEach((i) => {
            this._eventLink.removeExtensionEvent(`views:${e.key}:actions:${i.key}`);
          })) : (this._eventLink.removeExtensionEvent(`views:${e.key}:loadItems:${e.dataProvider.key}`), e.dataProvider.onItemClick && this._eventLink.removeExtensionEvent(`views:${e.key}:onItemClick:${e.dataProvider.key}`), e.dataProvider.onItemDoubleClick && this._eventLink.removeExtensionEvent(`views:${e.key}:onItemDoubleClick:${e.dataProvider.key}`), (s = e.actions) == null || s.forEach((i) => {
            this._eventLink.removeExtensionEvent(`views:${e.key}:actions:${i.key}`);
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
        callCustomCommand: async (e, ...n) => await this._eventLink.callStudioEvent(e, ...n),
        /**
         * Allow you to download some content in a file
         * 
         * @param fileName Name of the generated file
         * @param fileType extension of the file
         * @param fileContent file content in string
         */
        downloadFile: async (e, n, s) => await this._eventLink.callStudioEvent("download:file", e, n, s),
        /**
         * Allow you to download a lot of files and folders as zip
         * 
         * @param downloadName Name of the download as zip
         * @param files List of files or folders to download
         */
        downloadFiles: async (e, n) => await this._eventLink.callStudioEvent("download:files", e, n),
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
          feedback: async (e, n) => await this._eventLink.callStudioEvent("editor:feedback", e, n),
          /**
           * Allow to capture user freeform text input
           * 
           * @param props Props to configure the quick pick
           */
          showQuickPick: async (e) => await this._eventLink.callStudioEvent("editor:quickPick:show", e),
          /**
           * Allow to set primary side bar view by key
           * 
           * @param key Key to identify the view to show in the side bar
           */
          showPrimarySideBarByKey: async (e) => await this._eventLink.callStudioEvent("editor:primarySideBar:showByKey", e),
          /**
           * Allow to set secondary side bar view by key
           * 
           * @param key Key to identify the view to show in the side bar
           */
          showSecondarySideBarByKey: async (e) => await this._eventLink.callStudioEvent("editor:secondarySideBar:showByKey", e)
        }
      },
      dataProviders: {
        /**
         * Allow you to call a custom command from application
         * 
         * @param key Name of the command
         * @param args List of arguments to be forwarded to the command call
         */
        callCustomDataProvider: async (e, ...n) => await this._eventLink.callStudioEvent(e, ...n),
        /**
         * Allow you to get the entire project object or get parts with ...project.pages(), .services(), .components() and more.
         */
        project: Object.assign(
          async () => await this._eventLink.callStudioEvent("project"),
          {
            pages: async (e) => await this._eventLink.callStudioEvent("project.pages", e),
            services: async (e) => await this._eventLink.callStudioEvent("project.services", e),
            components: async (e) => await this._eventLink.callStudioEvent("project.components", e)
          }
        )
      }
    }, this._eventLink.setExtensionEvent("activate", this.activate.bind(this)), this._eventLink.setExtensionEvent("deactivate", this.deactivate.bind(this));
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
}
class p {
  constructor(e) {
    if (this.key = e.key, this.icon = e.icon, this.extra = e.extra, this.description = e.description, "title" in e && e.title !== void 0 && (this.title = e.title), "label" in e && e.label !== void 0 && (this.label = e.label), "children" in e && e.children !== void 0 && (this.children = e.children), this.title && this.label || !this.title && !this.label)
      throw new Error("ListViewItem must have either a `title` or a `label`, but not both.");
  }
}
class ee {
  constructor(e) {
    this.key = e.key, this.parser = e.parser;
  }
}
export {
  V as Action,
  K as Envs,
  Z as ExtensionBase,
  Y as ListProvider,
  p as ListViewItem,
  ee as Parser,
  X as PlatformAction,
  Q as TabView,
  L as TabsView,
  J as View
};
//# sourceMappingURL=index.es.js.map
