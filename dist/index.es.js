class q {
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
class X {
  constructor(e) {
    this.key = e.key, this.getItems = e.getItems;
  }
}
class L {
  constructor(e) {
    this.key = e.key, this.tabs = e.tabs, this.actions = e.actions;
  }
}
class Y {
  constructor(e) {
    this.key = e.key, this.dataProvider = e.dataProvider;
  }
}
class p {
  constructor(e) {
    this.key = e.key, this.action = e.action;
  }
}
class Q {
  constructor(e) {
    this.key = e.key, this.actions = e.actions, this.dataProvider = e.dataProvider;
  }
}
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const S = Symbol("Comlink.proxy"), A = Symbol("Comlink.endpoint"), R = Symbol("Comlink.releaseProxy"), b = Symbol("Comlink.finalizer"), k = Symbol("Comlink.thrown"), $ = (t) => typeof t == "object" && t !== null || typeof t == "function", N = {
  canHandle: (t) => $(t) && t[S],
  serialize(t) {
    const { port1: e, port2: n } = new MessageChannel();
    return _(t, e), [n, [n]];
  },
  deserialize(t) {
    return t.start(), C(t);
  }
}, j = {
  canHandle: (t) => $(t) && k in t,
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
}, M = /* @__PURE__ */ new Map([
  ["proxy", N],
  ["throw", j]
]);
function z(t, e) {
  for (const n of t)
    if (e === n || n === "*" || n instanceof RegExp && n.test(e))
      return !0;
  return !1;
}
function _(t, e = globalThis, n = ["*"]) {
  e.addEventListener("message", function i(s) {
    if (!s || !s.data)
      return;
    if (!z(n, s.origin)) {
      console.warn(`Invalid origin '${s.origin}' for comlink proxy`);
      return;
    }
    const { id: a, type: y, path: l } = Object.assign({ path: [] }, s.data), u = (s.data.argumentList || []).map(d);
    let r;
    try {
      const o = l.slice(0, -1).reduce((c, E) => c[E], t), h = l.reduce((c, E) => c[E], t);
      switch (y) {
        case "GET":
          r = h;
          break;
        case "SET":
          o[l.slice(-1)[0]] = d(s.data.value), r = !0;
          break;
        case "APPLY":
          r = h.apply(o, u);
          break;
        case "CONSTRUCT":
          {
            const c = new h(...u);
            r = F(c);
          }
          break;
        case "ENDPOINT":
          {
            const { port1: c, port2: E } = new MessageChannel();
            _(t, E), r = W(c, [c]);
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
      const [h, c] = w(o);
      e.postMessage(Object.assign(Object.assign({}, h), { id: a }), c), y === "RELEASE" && (e.removeEventListener("message", i), T(e), b in t && typeof t[b] == "function" && t[b]());
    }).catch((o) => {
      const [h, c] = w({
        value: new TypeError("Unserializable return value"),
        [k]: 0
      });
      e.postMessage(Object.assign(Object.assign({}, h), { id: a }), c);
    });
  }), e.start && e.start();
}
function B(t) {
  return t.constructor.name === "MessagePort";
}
function T(t) {
  B(t) && t.close();
}
function C(t, e) {
  const n = /* @__PURE__ */ new Map();
  return t.addEventListener("message", function(s) {
    const { data: a } = s;
    if (!a || !a.id)
      return;
    const y = n.get(a.id);
    if (y)
      try {
        y(a);
      } finally {
        n.delete(a.id);
      }
  }), x(t, n, [], e);
}
function v(t) {
  if (t)
    throw new Error("Proxy has been released and is not useable");
}
function I(t) {
  return f(t, /* @__PURE__ */ new Map(), {
    type: "RELEASE"
  }).then(() => {
    T(t);
  });
}
const m = /* @__PURE__ */ new WeakMap(), g = "FinalizationRegistry" in globalThis && new FinalizationRegistry((t) => {
  const e = (m.get(t) || 0) - 1;
  m.set(t, e), e === 0 && I(t);
});
function V(t, e) {
  const n = (m.get(e) || 0) + 1;
  m.set(e, n), g && g.register(t, e, t);
}
function D(t) {
  g && g.unregister(t);
}
function x(t, e, n = [], i = function() {
}) {
  let s = !1;
  const a = new Proxy(i, {
    get(y, l) {
      if (v(s), l === R)
        return () => {
          D(a), I(t), e.clear(), s = !0;
        };
      if (l === "then") {
        if (n.length === 0)
          return { then: () => a };
        const u = f(t, e, {
          type: "GET",
          path: n.map((r) => r.toString())
        }).then(d);
        return u.then.bind(u);
      }
      return x(t, e, [...n, l]);
    },
    set(y, l, u) {
      v(s);
      const [r, o] = w(u);
      return f(t, e, {
        type: "SET",
        path: [...n, l].map((h) => h.toString()),
        value: r
      }, o).then(d);
    },
    apply(y, l, u) {
      v(s);
      const r = n[n.length - 1];
      if (r === A)
        return f(t, e, {
          type: "ENDPOINT"
        }).then(d);
      if (r === "bind")
        return x(t, e, n.slice(0, -1));
      const [o, h] = P(u);
      return f(t, e, {
        type: "APPLY",
        path: n.map((c) => c.toString()),
        argumentList: o
      }, h).then(d);
    },
    construct(y, l) {
      v(s);
      const [u, r] = P(l);
      return f(t, e, {
        type: "CONSTRUCT",
        path: n.map((o) => o.toString()),
        argumentList: u
      }, r).then(d);
    }
  });
  return V(a, t), a;
}
function H(t) {
  return Array.prototype.concat.apply([], t);
}
function P(t) {
  const e = t.map(w);
  return [e.map((n) => n[0]), H(e.map((n) => n[1]))];
}
const O = /* @__PURE__ */ new WeakMap();
function W(t, e) {
  return O.set(t, e), t;
}
function F(t) {
  return Object.assign(t, { [S]: !0 });
}
function w(t) {
  for (const [e, n] of M)
    if (n.canHandle(t)) {
      const [i, s] = n.serialize(t);
      return [
        {
          type: "HANDLER",
          name: e,
          value: i
        },
        s
      ];
    }
  return [
    {
      type: "RAW",
      value: t
    },
    O.get(t) || []
  ];
}
function d(t) {
  switch (t.type) {
    case "HANDLER":
      return M.get(t.name).deserialize(t.value);
    case "RAW":
      return t.value;
  }
}
function f(t, e, n, i) {
  return new Promise((s) => {
    const a = U();
    e.set(a, s), t.start && t.start(), t.postMessage(Object.assign({ id: a }, n), i);
  });
}
function U() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}
const G = {
  DEBUG: !1
};
class K {
  constructor() {
    this._events = /* @__PURE__ */ new Map(), _({ callEvent: this._callExtensionEvent.bind(this) }), this._studioWrapper = C(self);
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
    const i = this._events.get(e);
    if (G.DEBUG && console.log(this._events.keys()), !i)
      throw new Error(`[EXTENSION] Event with key "${e}" was not found.`);
    return i(...n);
  }
}
class J {
  constructor() {
    this._eventLink = new K(), this.application = {
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
          var n, i;
          e instanceof L ? (e.tabs.forEach((s) => {
            this._eventLink.setExtensionEvent(`views:${e.key}:tabsView:${s.key}:loadItems:${s.dataProvider.key}`, s.dataProvider.getItems);
          }), (n = e.actions) == null || n.forEach((s) => {
            this._eventLink.setExtensionEvent(`views:${e.key}:actions:${s.key}`, s.action);
          })) : (this._eventLink.setExtensionEvent(`views:${e.key}:loadItems:${e.dataProvider.key}`, e.dataProvider.getItems), (i = e.actions) == null || i.forEach((s) => {
            this._eventLink.setExtensionEvent(`views:${e.key}:actions:${s.key}`, s.action);
          }));
        },
        unregister: async (e) => {
          var n, i;
          e instanceof L ? (e.tabs.forEach((s) => {
            this._eventLink.removeExtensionEvent(`views:${e.key}:tabsView:${s.key}:loadItems:${s.dataProvider.key}`);
          }), (n = e.actions) == null || n.forEach((s) => {
            this._eventLink.removeExtensionEvent(`views:${e.key}:actions:${s.key}`);
          })) : (this._eventLink.removeExtensionEvent(`views:${e.key}:loadItems:${e.dataProvider.key}`), (i = e.actions) == null || i.forEach((s) => {
            this._eventLink.removeExtensionEvent(`views:${e.key}:actions:${s.key}`);
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
        downloadFile: async (e, n, i) => await this._eventLink.callStudioEvent("download:file", e, n, i),
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
class Z {
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
  p as Action,
  G as Envs,
  J as ExtensionBase,
  X as ListProvider,
  Z as ListViewItem,
  ee as Parser,
  q as PlatformAction,
  Y as TabView,
  L as TabsView,
  Q as View
};
//# sourceMappingURL=index.es.js.map
