class V {
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
    this.key = e.key, this.getItems = e.getItems, this.onItemClick = e.onItemClick, this.onItemDoubleClick = e.onItemDoubleClick;
  }
}
class $ {
  constructor(e) {
    this.key = e.key, this.tabs = e.tabs, this.actions = e.actions;
  }
}
class Y {
  constructor(e) {
    this.key = e.key, this.dataProvider = e.dataProvider;
  }
}
class Q {
  constructor(e) {
    this.key = e.key, this.action = e.action;
  }
}
class J {
  constructor(e) {
    this._messageSenderListeners = /* @__PURE__ */ new Map(), this.webView = {
      sendMessage: async (...n) => {
        this._messageSenderListeners.forEach((i) => i(...n));
      }
    }, this.key = e.key, this.actions = e.actions, this.onDidReceiveMessage = e.onDidReceiveMessage;
  }
  __internal_subscribeToSend(e, n) {
    this._messageSenderListeners.set(e, n);
  }
  __internal_removeSubscribeToSend(e) {
    this._messageSenderListeners.delete(e);
  }
}
class Z {
  constructor(e) {
    this.key = e.key, this.actions = e.actions, this.dataProvider = e.dataProvider;
  }
}
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const x = Symbol("Comlink.proxy"), O = Symbol("Comlink.endpoint"), D = Symbol("Comlink.releaseProxy"), _ = Symbol("Comlink.finalizer"), f = Symbol("Comlink.thrown"), C = (t) => typeof t == "object" && t !== null || typeof t == "function", T = {
  canHandle: (t) => C(t) && t[x],
  serialize(t) {
    const { port1: e, port2: n } = new MessageChannel();
    return P(t, e), [n, [n]];
  },
  deserialize(t) {
    return t.start(), L(t);
  }
}, R = {
  canHandle: (t) => C(t) && f in t,
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
}, I = /* @__PURE__ */ new Map([
  ["proxy", T],
  ["throw", R]
]);
function A(t, e) {
  for (const n of t)
    if (e === n || n === "*" || n instanceof RegExp && n.test(e))
      return !0;
  return !1;
}
function P(t, e = globalThis, n = ["*"]) {
  e.addEventListener("message", function i(s) {
    if (!s || !s.data)
      return;
    if (!A(n, s.origin)) {
      console.warn(`Invalid origin '${s.origin}' for comlink proxy`);
      return;
    }
    const { id: r, type: y, path: l } = Object.assign({ path: [] }, s.data), d = (s.data.argumentList || []).map(E);
    let a;
    try {
      const o = l.slice(0, -1).reduce((c, v) => c[v], t), u = l.reduce((c, v) => c[v], t);
      switch (y) {
        case "GET":
          a = u;
          break;
        case "SET":
          o[l.slice(-1)[0]] = E(s.data.value), a = !0;
          break;
        case "APPLY":
          a = u.apply(o, d);
          break;
        case "CONSTRUCT":
          {
            const c = new u(...d);
            a = F(c);
          }
          break;
        case "ENDPOINT":
          {
            const { port1: c, port2: v } = new MessageChannel();
            P(t, v), a = W(c, [c]);
          }
          break;
        case "RELEASE":
          a = void 0;
          break;
        default:
          return;
      }
    } catch (o) {
      a = { value: o, [f]: 0 };
    }
    Promise.resolve(a).catch((o) => ({ value: o, [f]: 0 })).then((o) => {
      const [u, c] = b(o);
      e.postMessage(Object.assign(Object.assign({}, u), { id: r }), c), y === "RELEASE" && (e.removeEventListener("message", i), j(e), _ in t && typeof t[_] == "function" && t[_]());
    }).catch((o) => {
      const [u, c] = b({
        value: new TypeError("Unserializable return value"),
        [f]: 0
      });
      e.postMessage(Object.assign(Object.assign({}, u), { id: r }), c);
    });
  }), e.start && e.start();
}
function N(t) {
  return t.constructor.name === "MessagePort";
}
function j(t) {
  N(t) && t.close();
}
function L(t, e) {
  const n = /* @__PURE__ */ new Map();
  return t.addEventListener("message", function(s) {
    const { data: r } = s;
    if (!r || !r.id)
      return;
    const y = n.get(r.id);
    if (y)
      try {
        y(r);
      } finally {
        n.delete(r.id);
      }
  }), S(t, n, [], e);
}
function k(t) {
  if (t)
    throw new Error("Proxy has been released and is not useable");
}
function p(t) {
  return h(t, /* @__PURE__ */ new Map(), {
    type: "RELEASE"
  }).then(() => {
    j(t);
  });
}
const m = /* @__PURE__ */ new WeakMap(), g = "FinalizationRegistry" in globalThis && new FinalizationRegistry((t) => {
  const e = (m.get(t) || 0) - 1;
  m.set(t, e), e === 0 && p(t);
});
function z(t, e) {
  const n = (m.get(e) || 0) + 1;
  m.set(e, n), g && g.register(t, e, t);
}
function B(t) {
  g && g.unregister(t);
}
function S(t, e, n = [], i = function() {
}) {
  let s = !1;
  const r = new Proxy(i, {
    get(y, l) {
      if (k(s), l === D)
        return () => {
          B(r), p(t), e.clear(), s = !0;
        };
      if (l === "then") {
        if (n.length === 0)
          return { then: () => r };
        const d = h(t, e, {
          type: "GET",
          path: n.map((a) => a.toString())
        }).then(E);
        return d.then.bind(d);
      }
      return S(t, e, [...n, l]);
    },
    set(y, l, d) {
      k(s);
      const [a, o] = b(d);
      return h(t, e, {
        type: "SET",
        path: [...n, l].map((u) => u.toString()),
        value: a
      }, o).then(E);
    },
    apply(y, l, d) {
      k(s);
      const a = n[n.length - 1];
      if (a === O)
        return h(t, e, {
          type: "ENDPOINT"
        }).then(E);
      if (a === "bind")
        return S(t, e, n.slice(0, -1));
      const [o, u] = w(d);
      return h(t, e, {
        type: "APPLY",
        path: n.map((c) => c.toString()),
        argumentList: o
      }, u).then(E);
    },
    construct(y, l) {
      k(s);
      const [d, a] = w(l);
      return h(t, e, {
        type: "CONSTRUCT",
        path: n.map((o) => o.toString()),
        argumentList: d
      }, a).then(E);
    }
  });
  return z(r, t), r;
}
function H(t) {
  return Array.prototype.concat.apply([], t);
}
function w(t) {
  const e = t.map(b);
  return [e.map((n) => n[0]), H(e.map((n) => n[1]))];
}
const M = /* @__PURE__ */ new WeakMap();
function W(t, e) {
  return M.set(t, e), t;
}
function F(t) {
  return Object.assign(t, { [x]: !0 });
}
function b(t) {
  for (const [e, n] of I)
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
    M.get(t) || []
  ];
}
function E(t) {
  switch (t.type) {
    case "HANDLER":
      return I.get(t.name).deserialize(t.value);
    case "RAW":
      return t.value;
  }
}
function h(t, e, n, i) {
  return new Promise((s) => {
    const r = U();
    e.set(r, s), t.start && t.start(), t.postMessage(Object.assign({ id: r }, n), i);
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
    this._events = /* @__PURE__ */ new Map(), P({ callEvent: this._callExtensionEvent.bind(this) }), this._studioWrapper = L(self);
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
const q = (t) => ({
  /**
   * Allow you to call a custom command from application
   * 
   * @param key Name of the command
   * @param args List of arguments to be forwarded to the command call
   */
  callCustomDataProvider: async (e, ...n) => await t.callStudioEvent(e, ...n),
  /**
   * Allow you to get the entire project object or get parts with ...project.pages(), .services(), .components() and more.
   */
  project: Object.assign(
    async () => await t.callStudioEvent("project:get"),
    {
      set: async (e) => await t.callStudioEvent("project:set", e),
      pages: Object.assign(
        async () => await t.callStudioEvent("project.pages:get"),
        async (e) => await t.callStudioEvent("project.pages:get", e),
        {
          set: async (e, n) => await t.callStudioEvent("project.pages:set", e, n),
          add: Object.assign(
            async (e) => await t.callStudioEvent("project.pages:add", e),
            async (e, n) => await t.callStudioEvent("project.pages:add", e, n)
          ),
          del: Object.assign(
            async () => await t.callStudioEvent("project.pages:del"),
            async (e) => await t.callStudioEvent("project.pages:del", e)
          )
        }
      ),
      components: Object.assign(
        async () => await t.callStudioEvent("project.components:get"),
        async (e) => await t.callStudioEvent("project.components:get", e),
        {
          set: async (e, n) => await t.callStudioEvent("project.components:set", e, n),
          add: Object.assign(
            async (e) => await t.callStudioEvent("project.components:add", e),
            async (e, n) => await t.callStudioEvent("project.components:add", e, n)
          ),
          del: Object.assign(
            async () => await t.callStudioEvent("project.components:del"),
            async (e) => await t.callStudioEvent("project.components:del", e)
          )
        }
      ),
      services: Object.assign(
        async () => await t.callStudioEvent("project.services:get"),
        async (e) => await t.callStudioEvent("project.services:get", e),
        {
          set: async (e, n) => await t.callStudioEvent("project.services:set", e, n),
          add: Object.assign(
            async (e) => await t.callStudioEvent("project.services:add", e),
            async (e, n) => await t.callStudioEvent("project.services:add", e, n)
          ),
          del: Object.assign(
            async () => await t.callStudioEvent("project.services:del"),
            async (e) => await t.callStudioEvent("project.services:del", e)
          )
        }
      )
    }
  )
});
class ee {
  constructor() {
    this._eventLink = new K(), this.application = {
      platformActions: {
        register: (e) => {
          e.action ? this._eventLink.setExtensionEvent(`platformActions:${e.key}`, e.action) : e.actions && e.actions.forEach((n) => {
            this._eventLink.setExtensionEvent(`platformActions:${e.key}:actions:${n.key}`, n.action);
          });
        },
        unregister: (e) => {
          e.action ? this._eventLink.removeExtensionEvent(`platformActions:${e.key}`) : e.actions && e.actions.forEach((n) => {
            this._eventLink.removeExtensionEvent(`platformActions:${e.key}:actions:${n.key}`);
          });
        }
      },
      parsers: {
        register: (e) => {
          this._eventLink.setExtensionEvent(`parsers:${e.key}`, e.parser);
        },
        unregister: (e) => {
          this._eventLink.removeExtensionEvent(`parsers:${e.key}`);
        }
      },
      views: {
        refresh: async (e) => {
          await this._eventLink.callStudioEvent(`views:${e.key}:refresh`);
        },
        register: (e) => {
          var n, i;
          e instanceof $ ? (e.tabs.forEach((s) => {
            this._eventLink.setExtensionEvent(`views:${e.key}:tabsView:${s.key}:loadItems:${s.dataProvider.key}`, s.dataProvider.getItems), s.dataProvider.onItemClick && this._eventLink.setExtensionEvent(`views:${e.key}:tabsView:${s.key}:onItemClick:${s.dataProvider.key}`, s.dataProvider.onItemClick), s.dataProvider.onItemDoubleClick && this._eventLink.setExtensionEvent(`views:${e.key}:tabsView:${s.key}:onItemDoubleClick:${s.dataProvider.key}`, s.dataProvider.onItemDoubleClick);
          }), (n = e.actions) == null || n.forEach((s) => {
            this._eventLink.setExtensionEvent(`views:${e.key}:actions:${s.key}`, s.action);
          })) : (this._eventLink.setExtensionEvent(`views:${e.key}:loadItems:${e.dataProvider.key}`, e.dataProvider.getItems), e.dataProvider.onItemClick && this._eventLink.setExtensionEvent(`views:${e.key}:onItemClick:${e.dataProvider.key}`, e.dataProvider.onItemClick), e.dataProvider.onItemDoubleClick && this._eventLink.setExtensionEvent(`views:${e.key}:onItemDoubleClick:${e.dataProvider.key}`, e.dataProvider.onItemDoubleClick), (i = e.actions) == null || i.forEach((s) => {
            this._eventLink.setExtensionEvent(`views:${e.key}:actions:${s.key}`, s.action);
          }));
        },
        unregister: (e) => {
          var n, i;
          e instanceof $ ? (e.tabs.forEach((s) => {
            this._eventLink.removeExtensionEvent(`views:${e.key}:tabsView:${s.key}:loadItems:${s.dataProvider.key}`), s.dataProvider.onItemClick && this._eventLink.removeExtensionEvent(`views:${e.key}:tabsView:${s.key}:onItemClick:${s.dataProvider.key}`), s.dataProvider.onItemDoubleClick && this._eventLink.removeExtensionEvent(`views:${e.key}:tabsView:${s.key}:onItemDoubleClick:${s.dataProvider.key}`);
          }), (n = e.actions) == null || n.forEach((s) => {
            this._eventLink.removeExtensionEvent(`views:${e.key}:actions:${s.key}`);
          })) : (this._eventLink.removeExtensionEvent(`views:${e.key}:loadItems:${e.dataProvider.key}`), e.dataProvider.onItemClick && this._eventLink.removeExtensionEvent(`views:${e.key}:onItemClick:${e.dataProvider.key}`), e.dataProvider.onItemDoubleClick && this._eventLink.removeExtensionEvent(`views:${e.key}:onItemDoubleClick:${e.dataProvider.key}`), (i = e.actions) == null || i.forEach((s) => {
            this._eventLink.removeExtensionEvent(`views:${e.key}:actions:${s.key}`);
          }));
        }
      },
      editors: {
        /**
         * Allow you to open a item in a editor based on the item type
         * 
         * @param key Identifier of a item to be opened for some editor
         */
        open: async (e) => {
          await this._eventLink.callStudioEvent("editors:open", e);
        },
        register: (e) => {
          var n;
          this._eventLink.setExtensionEvent(`editors:${e.key}:forwardEvents:receive`, async (...i) => {
            var s;
            return (s = e.onDidReceiveMessage) == null ? void 0 : s.call(e, ...i);
          }), e.__internal_subscribeToSend(`editors:${e.key}:forwardEvents:send`, async (...i) => await this._eventLink.callStudioEvent(`editors:${e.key}:forwardEvents:send`, ...i)), (n = e.actions) == null || n.forEach((i) => {
            this._eventLink.setExtensionEvent(`editors:${e.key}:actions:${i.key}`, i.action);
          });
        },
        unregister: (e) => {
          var n;
          this._eventLink.removeExtensionEvent(`editors:${e.key}:forwardEvents:receive`), e.__internal_removeSubscribeToSend(`editors:${e.key}:forwardEvents:send`), (n = e.actions) == null || n.forEach((i) => {
            this._eventLink.removeExtensionEvent(`editors:${e.key}:actions:${i.key}`);
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
      dataProviders: q(this._eventLink)
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
class te {
  constructor(e) {
    if (this.key = e.key, this.icon = e.icon, this.extra = e.extra, this.description = e.description, "title" in e && e.title !== void 0 && (this.title = e.title), "label" in e && e.label !== void 0 && (this.label = e.label), "children" in e && e.children !== void 0 && (this.children = e.children), this.title && this.label || !this.title && !this.label)
      throw new Error("ListViewItem must have either a `title` or a `label`, but not both.");
  }
}
class ne {
  constructor(e) {
    this.key = e.key, this.parser = e.parser;
  }
}
export {
  Q as Action,
  J as Editor,
  G as Envs,
  ee as ExtensionBase,
  X as ListProvider,
  te as ListViewItem,
  ne as Parser,
  V as PlatformAction,
  Y as TabView,
  $ as TabsView,
  Z as View
};
//# sourceMappingURL=index.es.js.map
