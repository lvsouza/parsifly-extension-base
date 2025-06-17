class X {
  constructor(t) {
    this.key = t.key, "action" in t && (this.action = t.action), "actions" in t && (this.actions = t.actions);
  }
  isSingle() {
    return typeof this.action == "function";
  }
  isMulti() {
    return Array.isArray(this.actions);
  }
}
class Y {
  constructor(t) {
    this.key = t.key, this.getItems = t.getItems, this.onItemClick = t.onItemClick, this.onItemDoubleClick = t.onItemDoubleClick;
  }
}
class x {
  constructor(t) {
    this.key = t.key, this.tabs = t.tabs, this.actions = t.actions;
  }
}
class Q {
  constructor(t) {
    this.key = t.key, this.dataProvider = t.dataProvider;
  }
}
class V {
  constructor(t) {
    this.key = t.key, this.action = t.action;
  }
}
class J {
  constructor(t) {
    this.key = t.key, this.actions = t.actions, this.dataProvider = t.dataProvider;
  }
}
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const $ = Symbol("Comlink.proxy"), D = Symbol("Comlink.endpoint"), M = Symbol("Comlink.releaseProxy"), w = Symbol("Comlink.finalizer"), f = Symbol("Comlink.thrown"), C = (e) => typeof e == "object" && e !== null || typeof e == "function", T = {
  canHandle: (e) => C(e) && e[$],
  serialize(e) {
    const { port1: t, port2: n } = new MessageChannel();
    return S(e, t), [n, [n]];
  },
  deserialize(e) {
    return e.start(), p(e);
  }
}, A = {
  canHandle: (e) => C(e) && f in e,
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
}, I = /* @__PURE__ */ new Map([
  ["proxy", T],
  ["throw", A]
]);
function R(e, t) {
  for (const n of e)
    if (t === n || n === "*" || n instanceof RegExp && n.test(t))
      return !0;
  return !1;
}
function S(e, t = globalThis, n = ["*"]) {
  t.addEventListener("message", function a(s) {
    if (!s || !s.data)
      return;
    if (!R(n, s.origin)) {
      console.warn(`Invalid origin '${s.origin}' for comlink proxy`);
      return;
    }
    const { id: r, type: y, path: l } = Object.assign({ path: [] }, s.data), d = (s.data.argumentList || []).map(E);
    let i;
    try {
      const o = l.slice(0, -1).reduce((c, v) => c[v], e), u = l.reduce((c, v) => c[v], e);
      switch (y) {
        case "GET":
          i = u;
          break;
        case "SET":
          o[l.slice(-1)[0]] = E(s.data.value), i = !0;
          break;
        case "APPLY":
          i = u.apply(o, d);
          break;
        case "CONSTRUCT":
          {
            const c = new u(...d);
            i = F(c);
          }
          break;
        case "ENDPOINT":
          {
            const { port1: c, port2: v } = new MessageChannel();
            S(e, v), i = W(c, [c]);
          }
          break;
        case "RELEASE":
          i = void 0;
          break;
        default:
          return;
      }
    } catch (o) {
      i = { value: o, [f]: 0 };
    }
    Promise.resolve(i).catch((o) => ({ value: o, [f]: 0 })).then((o) => {
      const [u, c] = b(o);
      t.postMessage(Object.assign(Object.assign({}, u), { id: r }), c), y === "RELEASE" && (t.removeEventListener("message", a), j(t), w in e && typeof e[w] == "function" && e[w]());
    }).catch((o) => {
      const [u, c] = b({
        value: new TypeError("Unserializable return value"),
        [f]: 0
      });
      t.postMessage(Object.assign(Object.assign({}, u), { id: r }), c);
    });
  }), t.start && t.start();
}
function N(e) {
  return e.constructor.name === "MessagePort";
}
function j(e) {
  N(e) && e.close();
}
function p(e, t) {
  const n = /* @__PURE__ */ new Map();
  return e.addEventListener("message", function(s) {
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
  }), P(e, n, [], t);
}
function k(e) {
  if (e)
    throw new Error("Proxy has been released and is not useable");
}
function O(e) {
  return h(e, /* @__PURE__ */ new Map(), {
    type: "RELEASE"
  }).then(() => {
    j(e);
  });
}
const m = /* @__PURE__ */ new WeakMap(), g = "FinalizationRegistry" in globalThis && new FinalizationRegistry((e) => {
  const t = (m.get(e) || 0) - 1;
  m.set(e, t), t === 0 && O(e);
});
function z(e, t) {
  const n = (m.get(t) || 0) + 1;
  m.set(t, n), g && g.register(e, t, e);
}
function B(e) {
  g && g.unregister(e);
}
function P(e, t, n = [], a = function() {
}) {
  let s = !1;
  const r = new Proxy(a, {
    get(y, l) {
      if (k(s), l === M)
        return () => {
          B(r), O(e), t.clear(), s = !0;
        };
      if (l === "then") {
        if (n.length === 0)
          return { then: () => r };
        const d = h(e, t, {
          type: "GET",
          path: n.map((i) => i.toString())
        }).then(E);
        return d.then.bind(d);
      }
      return P(e, t, [...n, l]);
    },
    set(y, l, d) {
      k(s);
      const [i, o] = b(d);
      return h(e, t, {
        type: "SET",
        path: [...n, l].map((u) => u.toString()),
        value: i
      }, o).then(E);
    },
    apply(y, l, d) {
      k(s);
      const i = n[n.length - 1];
      if (i === D)
        return h(e, t, {
          type: "ENDPOINT"
        }).then(E);
      if (i === "bind")
        return P(e, t, n.slice(0, -1));
      const [o, u] = _(d);
      return h(e, t, {
        type: "APPLY",
        path: n.map((c) => c.toString()),
        argumentList: o
      }, u).then(E);
    },
    construct(y, l) {
      k(s);
      const [d, i] = _(l);
      return h(e, t, {
        type: "CONSTRUCT",
        path: n.map((o) => o.toString()),
        argumentList: d
      }, i).then(E);
    }
  });
  return z(r, e), r;
}
function H(e) {
  return Array.prototype.concat.apply([], e);
}
function _(e) {
  const t = e.map(b);
  return [t.map((n) => n[0]), H(t.map((n) => n[1]))];
}
const L = /* @__PURE__ */ new WeakMap();
function W(e, t) {
  return L.set(e, t), e;
}
function F(e) {
  return Object.assign(e, { [$]: !0 });
}
function b(e) {
  for (const [t, n] of I)
    if (n.canHandle(e)) {
      const [a, s] = n.serialize(e);
      return [
        {
          type: "HANDLER",
          name: t,
          value: a
        },
        s
      ];
    }
  return [
    {
      type: "RAW",
      value: e
    },
    L.get(e) || []
  ];
}
function E(e) {
  switch (e.type) {
    case "HANDLER":
      return I.get(e.name).deserialize(e.value);
    case "RAW":
      return e.value;
  }
}
function h(e, t, n, a) {
  return new Promise((s) => {
    const r = U();
    t.set(r, s), e.start && e.start(), e.postMessage(Object.assign({ id: r }, n), a);
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
    this._events = /* @__PURE__ */ new Map(), S({ callEvent: this._callExtensionEvent.bind(this) }), this._studioWrapper = p(self);
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
    const a = this._events.get(t);
    if (G.DEBUG && console.log(this._events.keys()), !a)
      throw new Error(`[EXTENSION] Event with key "${t}" was not found.`);
    return a(...n);
  }
}
const q = (e) => ({
  /**
   * Allow you to call a custom command from application
   * 
   * @param key Name of the command
   * @param args List of arguments to be forwarded to the command call
   */
  callCustomDataProvider: async (t, ...n) => await e.callStudioEvent(t, ...n),
  /**
   * Allow you to get the entire project object or get parts with ...project.pages(), .services(), .components() and more.
   */
  project: Object.assign(
    async () => await e.callStudioEvent("project:get"),
    {
      set: async (t) => await e.callStudioEvent("project:set", t),
      pages: Object.assign(
        async () => await e.callStudioEvent("project.pages:get"),
        async (t) => await e.callStudioEvent("project.pages:get", t),
        {
          set: async (t, n) => await e.callStudioEvent("project.pages:set", t, n),
          add: Object.assign(
            async (t) => await e.callStudioEvent("project.pages:add", t),
            async (t, n) => await e.callStudioEvent("project.pages:add", t, n)
          ),
          del: Object.assign(
            async () => await e.callStudioEvent("project.pages:del"),
            async (t) => await e.callStudioEvent("project.pages:del", t)
          )
        }
      ),
      components: Object.assign(
        async () => await e.callStudioEvent("project.components:get"),
        async (t) => await e.callStudioEvent("project.components:get", t),
        {
          set: async (t, n) => await e.callStudioEvent("project.components:set", t, n),
          add: Object.assign(
            async (t) => await e.callStudioEvent("project.components:add", t),
            async (t, n) => await e.callStudioEvent("project.components:add", t, n)
          ),
          del: Object.assign(
            async () => await e.callStudioEvent("project.components:del"),
            async (t) => await e.callStudioEvent("project.components:del", t)
          )
        }
      ),
      services: Object.assign(
        async () => await e.callStudioEvent("project.services:get"),
        async (t) => await e.callStudioEvent("project.services:get", t),
        {
          set: async (t, n) => await e.callStudioEvent("project.services:set", t, n),
          add: Object.assign(
            async (t) => await e.callStudioEvent("project.services:add", t),
            async (t, n) => await e.callStudioEvent("project.services:add", t, n)
          ),
          del: Object.assign(
            async () => await e.callStudioEvent("project.services:del"),
            async (t) => await e.callStudioEvent("project.services:del", t)
          )
        }
      )
    }
  )
});
class Z {
  constructor() {
    this._eventLink = new K(), this.application = {
      platformActions: {
        register: async (t) => {
          t.action ? this._eventLink.setExtensionEvent(`platformActions:${t.key}`, t.action) : t.actions && t.actions.forEach((n) => {
            this._eventLink.setExtensionEvent(`platformActions:${t.key}:actions:${n.key}`, n.action);
          });
        },
        unregister: async (t) => {
          t.action ? this._eventLink.removeExtensionEvent(`platformActions:${t.key}`) : t.actions && t.actions.forEach((n) => {
            this._eventLink.removeExtensionEvent(`platformActions:${t.key}:actions:${n.key}`);
          });
        }
      },
      parsers: {
        register: async (t) => {
          this._eventLink.setExtensionEvent(`parsers:${t.key}`, t.parser);
        },
        unregister: async (t) => {
          this._eventLink.removeExtensionEvent(`parsers:${t.key}`);
        }
      },
      views: {
        register: async (t) => {
          var n, a;
          t instanceof x ? (t.tabs.forEach((s) => {
            this._eventLink.setExtensionEvent(`views:${t.key}:tabsView:${s.key}:loadItems:${s.dataProvider.key}`, s.dataProvider.getItems), s.dataProvider.onItemClick && this._eventLink.setExtensionEvent(`views:${t.key}:tabsView:${s.key}:onItemClick:${s.dataProvider.key}`, s.dataProvider.onItemClick), s.dataProvider.onItemDoubleClick && this._eventLink.setExtensionEvent(`views:${t.key}:tabsView:${s.key}:onItemDoubleClick:${s.dataProvider.key}`, s.dataProvider.onItemDoubleClick);
          }), (n = t.actions) == null || n.forEach((s) => {
            this._eventLink.setExtensionEvent(`views:${t.key}:actions:${s.key}`, s.action);
          })) : (this._eventLink.setExtensionEvent(`views:${t.key}:loadItems:${t.dataProvider.key}`, t.dataProvider.getItems), t.dataProvider.onItemClick && this._eventLink.setExtensionEvent(`views:${t.key}:onItemClick:${t.dataProvider.key}`, t.dataProvider.onItemClick), t.dataProvider.onItemDoubleClick && this._eventLink.setExtensionEvent(`views:${t.key}:onItemDoubleClick:${t.dataProvider.key}`, t.dataProvider.onItemDoubleClick), (a = t.actions) == null || a.forEach((s) => {
            this._eventLink.setExtensionEvent(`views:${t.key}:actions:${s.key}`, s.action);
          }));
        },
        unregister: async (t) => {
          var n, a;
          t instanceof x ? (t.tabs.forEach((s) => {
            this._eventLink.removeExtensionEvent(`views:${t.key}:tabsView:${s.key}:loadItems:${s.dataProvider.key}`), s.dataProvider.onItemClick && this._eventLink.removeExtensionEvent(`views:${t.key}:tabsView:${s.key}:onItemClick:${s.dataProvider.key}`), s.dataProvider.onItemDoubleClick && this._eventLink.removeExtensionEvent(`views:${t.key}:tabsView:${s.key}:onItemDoubleClick:${s.dataProvider.key}`);
          }), (n = t.actions) == null || n.forEach((s) => {
            this._eventLink.removeExtensionEvent(`views:${t.key}:actions:${s.key}`);
          })) : (this._eventLink.removeExtensionEvent(`views:${t.key}:loadItems:${t.dataProvider.key}`), t.dataProvider.onItemClick && this._eventLink.removeExtensionEvent(`views:${t.key}:onItemClick:${t.dataProvider.key}`), t.dataProvider.onItemDoubleClick && this._eventLink.removeExtensionEvent(`views:${t.key}:onItemDoubleClick:${t.dataProvider.key}`), (a = t.actions) == null || a.forEach((s) => {
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
        downloadFile: async (t, n, a) => await this._eventLink.callStudioEvent("download:file", t, n, a),
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
class tt {
  constructor(t) {
    if (this.key = t.key, this.icon = t.icon, this.extra = t.extra, this.description = t.description, "title" in t && t.title !== void 0 && (this.title = t.title), "label" in t && t.label !== void 0 && (this.label = t.label), "children" in t && t.children !== void 0 && (this.children = t.children), this.title && this.label || !this.title && !this.label)
      throw new Error("ListViewItem must have either a `title` or a `label`, but not both.");
  }
}
class et {
  constructor(t) {
    this.key = t.key, this.parser = t.parser;
  }
}
export {
  V as Action,
  G as Envs,
  Z as ExtensionBase,
  Y as ListProvider,
  tt as ListViewItem,
  et as Parser,
  X as PlatformAction,
  Q as TabView,
  x as TabsView,
  J as View
};
//# sourceMappingURL=index.es.js.map
