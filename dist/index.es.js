/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const T = Symbol("Comlink.proxy"), z = Symbol("Comlink.endpoint"), N = Symbol("Comlink.releaseProxy"), k = Symbol("Comlink.finalizer"), w = Symbol("Comlink.thrown"), M = (t) => typeof t == "object" && t !== null || typeof t == "function", F = {
  canHandle: (t) => M(t) && t[T],
  serialize(t) {
    const { port1: e, port2: r } = new MessageChannel();
    return P(t, e), [r, [r]];
  },
  deserialize(t) {
    return t.start(), _(t);
  }
}, v = {
  canHandle: (t) => M(t) && w in t,
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
}, S = /* @__PURE__ */ new Map([
  ["proxy", F],
  ["throw", v]
]);
function H(t, e) {
  for (const r of t)
    if (e === r || r === "*" || r instanceof RegExp && r.test(e))
      return !0;
  return !1;
}
function P(t, e = globalThis, r = ["*"]) {
  e.addEventListener("message", function a(n) {
    if (!n || !n.data)
      return;
    if (!H(r, n.origin)) {
      console.warn(`Invalid origin '${n.origin}' for comlink proxy`);
      return;
    }
    const { id: i, type: d, path: l } = Object.assign({ path: [] }, n.data), u = (n.data.argumentList || []).map(h);
    let s;
    try {
      const o = l.slice(0, -1).reduce((c, y) => c[y], t), f = l.reduce((c, y) => c[y], t);
      switch (d) {
        case "GET":
          s = f;
          break;
        case "SET":
          o[l.slice(-1)[0]] = h(n.data.value), s = !0;
          break;
        case "APPLY":
          s = f.apply(o, u);
          break;
        case "CONSTRUCT":
          {
            const c = new f(...u);
            s = D(c);
          }
          break;
        case "ENDPOINT":
          {
            const { port1: c, port2: y } = new MessageChannel();
            P(t, y), s = j(c, [c]);
          }
          break;
        case "RELEASE":
          s = void 0;
          break;
        default:
          return;
      }
    } catch (o) {
      s = { value: o, [w]: 0 };
    }
    Promise.resolve(s).catch((o) => ({ value: o, [w]: 0 })).then((o) => {
      const [f, c] = b(o);
      e.postMessage(Object.assign(Object.assign({}, f), { id: i }), c), d === "RELEASE" && (e.removeEventListener("message", a), R(e), k in t && typeof t[k] == "function" && t[k]());
    }).catch((o) => {
      const [f, c] = b({
        value: new TypeError("Unserializable return value"),
        [w]: 0
      });
      e.postMessage(Object.assign(Object.assign({}, f), { id: i }), c);
    });
  }), e.start && e.start();
}
function L(t) {
  return t.constructor.name === "MessagePort";
}
function R(t) {
  L(t) && t.close();
}
function _(t, e) {
  const r = /* @__PURE__ */ new Map();
  return t.addEventListener("message", function(n) {
    const { data: i } = n;
    if (!i || !i.id)
      return;
    const d = r.get(i.id);
    if (d)
      try {
        d(i);
      } finally {
        r.delete(i.id);
      }
  }), x(t, r, [], e);
}
function m(t) {
  if (t)
    throw new Error("Proxy has been released and is not useable");
}
function C(t) {
  return g(t, /* @__PURE__ */ new Map(), {
    type: "RELEASE"
  }).then(() => {
    R(t);
  });
}
const p = /* @__PURE__ */ new WeakMap(), E = "FinalizationRegistry" in globalThis && new FinalizationRegistry((t) => {
  const e = (p.get(t) || 0) - 1;
  p.set(t, e), e === 0 && C(t);
});
function V(t, e) {
  const r = (p.get(e) || 0) + 1;
  p.set(e, r), E && E.register(t, e, t);
}
function I(t) {
  E && E.unregister(t);
}
function x(t, e, r = [], a = function() {
}) {
  let n = !1;
  const i = new Proxy(a, {
    get(d, l) {
      if (m(n), l === N)
        return () => {
          I(i), C(t), e.clear(), n = !0;
        };
      if (l === "then") {
        if (r.length === 0)
          return { then: () => i };
        const u = g(t, e, {
          type: "GET",
          path: r.map((s) => s.toString())
        }).then(h);
        return u.then.bind(u);
      }
      return x(t, e, [...r, l]);
    },
    set(d, l, u) {
      m(n);
      const [s, o] = b(u);
      return g(t, e, {
        type: "SET",
        path: [...r, l].map((f) => f.toString()),
        value: s
      }, o).then(h);
    },
    apply(d, l, u) {
      m(n);
      const s = r[r.length - 1];
      if (s === z)
        return g(t, e, {
          type: "ENDPOINT"
        }).then(h);
      if (s === "bind")
        return x(t, e, r.slice(0, -1));
      const [o, f] = A(u);
      return g(t, e, {
        type: "APPLY",
        path: r.map((c) => c.toString()),
        argumentList: o
      }, f).then(h);
    },
    construct(d, l) {
      m(n);
      const [u, s] = A(l);
      return g(t, e, {
        type: "CONSTRUCT",
        path: r.map((o) => o.toString()),
        argumentList: u
      }, s).then(h);
    }
  });
  return V(i, t), i;
}
function W(t) {
  return Array.prototype.concat.apply([], t);
}
function A(t) {
  const e = t.map(b);
  return [e.map((r) => r[0]), W(e.map((r) => r[1]))];
}
const O = /* @__PURE__ */ new WeakMap();
function j(t, e) {
  return O.set(t, e), t;
}
function D(t) {
  return Object.assign(t, { [T]: !0 });
}
function b(t) {
  for (const [e, r] of S)
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
      return S.get(t.name).deserialize(t.value);
    case "RAW":
      return t.value;
  }
}
function g(t, e, r, a) {
  return new Promise((n) => {
    const i = U();
    e.set(i, n), t.start && t.start(), t.postMessage(Object.assign({ id: i }, r), a);
  });
}
function U() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}
class q {
  constructor() {
    this.platformActions = [], this.parsers = [], this.application = {
      downloadFile: async (e, r, a) => await this._mainThread.downloadFile(e, r, a),
      downloadFiles: async (e, r) => await this._mainThread.downloadFiles(e, r),
      feedback: async (e, r) => await this._mainThread.feedback(e, r),
      quickPick: async (e) => await this._mainThread.quickPick(e)
    }, P({
      activate: this.activate.bind(this),
      deactivate: this.deactivate.bind(this),
      parsers: this._parsers.bind(this),
      platformActions: this._platformActions.bind(this)
    }), this._mainThread = _(self);
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
}
export {
  q as ExtensionBase
};
//# sourceMappingURL=index.es.js.map
