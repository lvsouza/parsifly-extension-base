/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const S = Symbol("Comlink.proxy"), R = Symbol("Comlink.endpoint"), j = Symbol("Comlink.releaseProxy"), T = Symbol("Comlink.finalizer"), g = Symbol("Comlink.thrown"), x = (e) => typeof e == "object" && e !== null || typeof e == "function", z = {
  canHandle: (e) => x(e) && e[S],
  serialize(e) {
    const { port1: t, port2: r } = new MessageChannel();
    return P(e, t), [r, [r]];
  },
  deserialize(e) {
    return e.start(), v(e);
  }
}, B = {
  canHandle: (e) => x(e) && g in e,
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
}, A = /* @__PURE__ */ new Map([
  ["proxy", z],
  ["throw", B]
]);
function N(e, t) {
  for (const r of e)
    if (t === r || r === "*" || r instanceof RegExp && r.test(t))
      return !0;
  return !1;
}
function P(e, t = globalThis, r = ["*"]) {
  t.addEventListener("message", function a(n) {
    if (!n || !n.data)
      return;
    if (!N(r, n.origin)) {
      console.warn(`Invalid origin '${n.origin}' for comlink proxy`);
      return;
    }
    const { id: s, type: d, path: l } = Object.assign({ path: [] }, n.data), u = (n.data.argumentList || []).map(h);
    let i;
    try {
      const o = l.slice(0, -1).reduce((c, y) => c[y], e), f = l.reduce((c, y) => c[y], e);
      switch (d) {
        case "GET":
          i = f;
          break;
        case "SET":
          o[l.slice(-1)[0]] = h(n.data.value), i = !0;
          break;
        case "APPLY":
          i = f.apply(o, u);
          break;
        case "CONSTRUCT":
          {
            const c = new f(...u);
            i = D(c);
          }
          break;
        case "ENDPOINT":
          {
            const { port1: c, port2: y } = new MessageChannel();
            P(e, y), i = F(c, [c]);
          }
          break;
        case "RELEASE":
          i = void 0;
          break;
        default:
          return;
      }
    } catch (o) {
      i = { value: o, [g]: 0 };
    }
    Promise.resolve(i).catch((o) => ({ value: o, [g]: 0 })).then((o) => {
      const [f, c] = b(o);
      t.postMessage(Object.assign(Object.assign({}, f), { id: s }), c), d === "RELEASE" && (t.removeEventListener("message", a), M(t), T in e && typeof e[T] == "function" && e[T]());
    }).catch((o) => {
      const [f, c] = b({
        value: new TypeError("Unserializable return value"),
        [g]: 0
      });
      t.postMessage(Object.assign(Object.assign({}, f), { id: s }), c);
    });
  }), t.start && t.start();
}
function H(e) {
  return e.constructor.name === "MessagePort";
}
function M(e) {
  H(e) && e.close();
}
function v(e, t) {
  const r = /* @__PURE__ */ new Map();
  return e.addEventListener("message", function(n) {
    const { data: s } = n;
    if (!s || !s.id)
      return;
    const d = r.get(s.id);
    if (d)
      try {
        d(s);
      } finally {
        r.delete(s.id);
      }
  }), k(e, r, [], t);
}
function m(e) {
  if (e)
    throw new Error("Proxy has been released and is not useable");
}
function C(e) {
  return w(e, /* @__PURE__ */ new Map(), {
    type: "RELEASE"
  }).then(() => {
    M(e);
  });
}
const p = /* @__PURE__ */ new WeakMap(), E = "FinalizationRegistry" in globalThis && new FinalizationRegistry((e) => {
  const t = (p.get(e) || 0) - 1;
  p.set(e, t), t === 0 && C(e);
});
function I(e, t) {
  const r = (p.get(t) || 0) + 1;
  p.set(t, r), E && E.register(e, t, e);
}
function L(e) {
  E && E.unregister(e);
}
function k(e, t, r = [], a = function() {
}) {
  let n = !1;
  const s = new Proxy(a, {
    get(d, l) {
      if (m(n), l === j)
        return () => {
          L(s), C(e), t.clear(), n = !0;
        };
      if (l === "then") {
        if (r.length === 0)
          return { then: () => s };
        const u = w(e, t, {
          type: "GET",
          path: r.map((i) => i.toString())
        }).then(h);
        return u.then.bind(u);
      }
      return k(e, t, [...r, l]);
    },
    set(d, l, u) {
      m(n);
      const [i, o] = b(u);
      return w(e, t, {
        type: "SET",
        path: [...r, l].map((f) => f.toString()),
        value: i
      }, o).then(h);
    },
    apply(d, l, u) {
      m(n);
      const i = r[r.length - 1];
      if (i === R)
        return w(e, t, {
          type: "ENDPOINT"
        }).then(h);
      if (i === "bind")
        return k(e, t, r.slice(0, -1));
      const [o, f] = _(u);
      return w(e, t, {
        type: "APPLY",
        path: r.map((c) => c.toString()),
        argumentList: o
      }, f).then(h);
    },
    construct(d, l) {
      m(n);
      const [u, i] = _(l);
      return w(e, t, {
        type: "CONSTRUCT",
        path: r.map((o) => o.toString()),
        argumentList: u
      }, i).then(h);
    }
  });
  return I(s, e), s;
}
function V(e) {
  return Array.prototype.concat.apply([], e);
}
function _(e) {
  const t = e.map(b);
  return [t.map((r) => r[0]), V(t.map((r) => r[1]))];
}
const O = /* @__PURE__ */ new WeakMap();
function F(e, t) {
  return O.set(e, t), e;
}
function D(e) {
  return Object.assign(e, { [S]: !0 });
}
function b(e) {
  for (const [t, r] of A)
    if (r.canHandle(e)) {
      const [a, n] = r.serialize(e);
      return [
        {
          type: "HANDLER",
          name: t,
          value: a
        },
        n
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
      return A.get(e.name).deserialize(e.value);
    case "RAW":
      return e.value;
  }
}
function w(e, t, r, a) {
  return new Promise((n) => {
    const s = W();
    t.set(s, n), e.start && e.start(), e.postMessage(Object.assign({ id: s }, r), a);
  });
}
function W() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}
class U {
  constructor() {
    this.platformActions = [], this.parsers = [], this.views = [], this.application = {
      commands: {
        callCustomCommand: async (t, ...r) => await this._mainThread[t](...r),
        downloadFile: async (t, r, a) => await this._mainThread["download:file"](t, r, a),
        downloadFiles: async (t, r) => await this._mainThread["download:files"](t, r),
        editor: {
          feedback: async (t, r) => await this._mainThread["editor:feedback"](t, r),
          showQuickPick: async (t) => await this._mainThread["editor:quickPick:show"](t),
          showPrimarySideBarByKey: async (t) => await this._mainThread["editor:primarySideBar:showByKey"](t),
          showSecondarySideBarByKey: async (t) => await this._mainThread["editor:secondarySideBar:showByKey"](t),
          setSideBarItems: async (t, r) => await this._mainThread["editor:sideBar:setItems"](t, r)
        }
      },
      dataProviders: {
        callCustomDataProvider: async (t, ...r) => await this._mainThread[t](...r),
        project: Object.assign(
          async () => await this._mainThread.project(),
          {
            pages: async (t) => await this._mainThread["project.pages"](t),
            services: async (t) => await this._mainThread["project.services"](t),
            components: async (t) => await this._mainThread["project.components"](t)
          }
        )
      }
    }, P({
      activate: this.activate.bind(this),
      deactivate: this.deactivate.bind(this),
      views: this._views.bind(this),
      parsers: this._parsers.bind(this),
      platformActions: this._platformActions.bind(this)
    }), this._mainThread = v(self);
  }
  /**
   * Método chamado automaticamente ao ativar a extensão.
   * Pode ser sobrescrito pelas classes derivadas.
   */
  activate() {
    console.log("Extension activated (base implementation).");
  }
  /**
   * Método chamado automaticamente ao desativar a extensão.
   * Pode ser sobrescrito pelas classes derivadas.
   */
  deactivate() {
    console.log("Extension deactivated (base implementation).");
  }
  async _platformActions(t) {
    const r = this.platformActions.flatMap((a) => "action" in a ? [a] : a.actions).find((a) => a.key === t);
    if (!r) throw new Error(`Action with key "${t}" not found`);
    return await r.action();
  }
  async _parsers(t) {
    const r = this.parsers.find((a) => a.key === t);
    if (!r) throw new Error(`Parser with key "${t}" not found`);
    return await r.parser();
  }
  async _views(t, r) {
    const a = this.views.find((s) => s.key === t);
    if (!a) throw new Error(`Parser with key "${t}" not found`);
    const n = a.actions.find((s) => s.key === r);
    if (!n) throw new Error(`View action with key "${t}" not found`);
    return await n.action();
  }
}
export {
  U as ExtensionBase
};
//# sourceMappingURL=index.es.js.map
