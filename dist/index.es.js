/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const S = Symbol("Comlink.proxy"), R = Symbol("Comlink.endpoint"), j = Symbol("Comlink.releaseProxy"), T = Symbol("Comlink.finalizer"), g = Symbol("Comlink.thrown"), x = (t) => typeof t == "object" && t !== null || typeof t == "function", z = {
  canHandle: (t) => x(t) && t[S],
  serialize(t) {
    const { port1: e, port2: r } = new MessageChannel();
    return P(t, e), [r, [r]];
  },
  deserialize(t) {
    return t.start(), v(t);
  }
}, B = {
  canHandle: (t) => x(t) && g in t,
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
}, A = /* @__PURE__ */ new Map([
  ["proxy", z],
  ["throw", B]
]);
function N(t, e) {
  for (const r of t)
    if (e === r || r === "*" || r instanceof RegExp && r.test(e))
      return !0;
  return !1;
}
function P(t, e = globalThis, r = ["*"]) {
  e.addEventListener("message", function a(n) {
    if (!n || !n.data)
      return;
    if (!N(r, n.origin)) {
      console.warn(`Invalid origin '${n.origin}' for comlink proxy`);
      return;
    }
    const { id: s, type: f, path: u } = Object.assign({ path: [] }, n.data), l = (n.data.argumentList || []).map(h);
    let i;
    try {
      const o = u.slice(0, -1).reduce((c, y) => c[y], t), d = u.reduce((c, y) => c[y], t);
      switch (f) {
        case "GET":
          i = d;
          break;
        case "SET":
          o[u.slice(-1)[0]] = h(n.data.value), i = !0;
          break;
        case "APPLY":
          i = d.apply(o, l);
          break;
        case "CONSTRUCT":
          {
            const c = new d(...l);
            i = D(c);
          }
          break;
        case "ENDPOINT":
          {
            const { port1: c, port2: y } = new MessageChannel();
            P(t, y), i = F(c, [c]);
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
      const [d, c] = b(o);
      e.postMessage(Object.assign(Object.assign({}, d), { id: s }), c), f === "RELEASE" && (e.removeEventListener("message", a), M(e), T in t && typeof t[T] == "function" && t[T]());
    }).catch((o) => {
      const [d, c] = b({
        value: new TypeError("Unserializable return value"),
        [g]: 0
      });
      e.postMessage(Object.assign(Object.assign({}, d), { id: s }), c);
    });
  }), e.start && e.start();
}
function H(t) {
  return t.constructor.name === "MessagePort";
}
function M(t) {
  H(t) && t.close();
}
function v(t, e) {
  const r = /* @__PURE__ */ new Map();
  return t.addEventListener("message", function(n) {
    const { data: s } = n;
    if (!s || !s.id)
      return;
    const f = r.get(s.id);
    if (f)
      try {
        f(s);
      } finally {
        r.delete(s.id);
      }
  }), k(t, r, [], e);
}
function m(t) {
  if (t)
    throw new Error("Proxy has been released and is not useable");
}
function C(t) {
  return w(t, /* @__PURE__ */ new Map(), {
    type: "RELEASE"
  }).then(() => {
    M(t);
  });
}
const p = /* @__PURE__ */ new WeakMap(), E = "FinalizationRegistry" in globalThis && new FinalizationRegistry((t) => {
  const e = (p.get(t) || 0) - 1;
  p.set(t, e), e === 0 && C(t);
});
function I(t, e) {
  const r = (p.get(e) || 0) + 1;
  p.set(e, r), E && E.register(t, e, t);
}
function L(t) {
  E && E.unregister(t);
}
function k(t, e, r = [], a = function() {
}) {
  let n = !1;
  const s = new Proxy(a, {
    get(f, u) {
      if (m(n), u === j)
        return () => {
          L(s), C(t), e.clear(), n = !0;
        };
      if (u === "then") {
        if (r.length === 0)
          return { then: () => s };
        const l = w(t, e, {
          type: "GET",
          path: r.map((i) => i.toString())
        }).then(h);
        return l.then.bind(l);
      }
      return k(t, e, [...r, u]);
    },
    set(f, u, l) {
      m(n);
      const [i, o] = b(l);
      return w(t, e, {
        type: "SET",
        path: [...r, u].map((d) => d.toString()),
        value: i
      }, o).then(h);
    },
    apply(f, u, l) {
      m(n);
      const i = r[r.length - 1];
      if (i === R)
        return w(t, e, {
          type: "ENDPOINT"
        }).then(h);
      if (i === "bind")
        return k(t, e, r.slice(0, -1));
      const [o, d] = _(l);
      return w(t, e, {
        type: "APPLY",
        path: r.map((c) => c.toString()),
        argumentList: o
      }, d).then(h);
    },
    construct(f, u) {
      m(n);
      const [l, i] = _(u);
      return w(t, e, {
        type: "CONSTRUCT",
        path: r.map((o) => o.toString()),
        argumentList: l
      }, i).then(h);
    }
  });
  return I(s, t), s;
}
function V(t) {
  return Array.prototype.concat.apply([], t);
}
function _(t) {
  const e = t.map(b);
  return [e.map((r) => r[0]), V(e.map((r) => r[1]))];
}
const O = /* @__PURE__ */ new WeakMap();
function F(t, e) {
  return O.set(t, e), t;
}
function D(t) {
  return Object.assign(t, { [S]: !0 });
}
function b(t) {
  for (const [e, r] of A)
    if (r.canHandle(t)) {
      const [a, n] = r.serialize(t);
      return [
        {
          type: "HANDLER",
          name: e,
          value: a
        },
        n
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
function h(t) {
  switch (t.type) {
    case "HANDLER":
      return A.get(t.name).deserialize(t.value);
    case "RAW":
      return t.value;
  }
}
function w(t, e, r, a) {
  return new Promise((n) => {
    const s = W();
    e.set(s, n), t.start && t.start(), t.postMessage(Object.assign({ id: s }, r), a);
  });
}
function W() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}
class U {
  constructor() {
    this.platformActions = [], this.parsers = [], this.views = [], this.application = {
      commands: {
        callCustomCommand: async (e, ...r) => await this._mainThread[e](...r),
        downloadFile: async (e, r, a) => await this._mainThread["download:file"](e, r, a),
        downloadFiles: async (e, r) => await this._mainThread["download:files"](e, r),
        editor: {
          feedback: async (e, r) => await this._mainThread["editor:feedback"](e, r),
          showQuickPick: async (e) => await this._mainThread["editor:quickPick:show"](e),
          showPrimarySideBarByKey: async (e) => await this._mainThread["editor:primarySideBar:showByKey"](e),
          showSecondarySideBarByKey: async (e) => await this._mainThread["editor:secondarySideBar:showByKey"](e),
          setSideBarItems: async (e, r) => await this._mainThread["editor:sideBar:setItems"](e, r)
        }
      },
      dataProviders: {
        callCustomDataProvider: async (e, ...r) => await this._mainThread[e](...r),
        project: Object.assign(
          async () => await this._mainThread.project(),
          {
            pages: async (e) => await this._mainThread["project.pages"](e),
            services: async (e) => await this._mainThread["project.services"](e),
            components: async (e) => await this._mainThread["project.components"](e)
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
    console.log("Extensão ativada (método base).");
  }
  /**
   * Método chamado automaticamente ao desativar a extensão.
   * Pode ser sobrescrito pelas classes derivadas.
   */
  deactivate() {
    console.log("Extensão desativada (método base).");
  }
  async _platformActions(e) {
    const r = this.platformActions.flatMap((a) => "action" in a ? [a] : a.actions).find((a) => a.key === e);
    if (!r) throw new Error(`Action with key "${e}" not found`);
    return await r.action();
  }
  async _parsers(e, r) {
    const a = this.parsers.find((n) => n.key === e);
    if (!a) throw new Error(`Parser with key "${e}" not found`);
    return await a.parser(r);
  }
  async _views(e, r) {
    const a = this.views.find((s) => s.key === e);
    if (!a) throw new Error(`Parser with key "${e}" not found`);
    const n = a.actions.find((s) => s.key === r);
    if (!n) throw new Error(`View action with key "${e}" not found`);
    return await n.action();
  }
}
export {
  U as ExtensionBase
};
//# sourceMappingURL=index.es.js.map
