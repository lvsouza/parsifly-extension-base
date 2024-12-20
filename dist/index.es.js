/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const T = Symbol("Comlink.proxy"), z = Symbol("Comlink.endpoint"), N = Symbol("Comlink.releaseProxy"), x = Symbol("Comlink.finalizer"), w = Symbol("Comlink.thrown"), M = (e) => typeof e == "object" && e !== null || typeof e == "function", F = {
  canHandle: (e) => M(e) && e[T],
  serialize(e) {
    const { port1: t, port2: n } = new MessageChannel();
    return A(e, t), [n, [n]];
  },
  deserialize(e) {
    return e.start(), C(e);
  }
}, v = {
  canHandle: (e) => M(e) && w in e,
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
}, S = /* @__PURE__ */ new Map([
  ["proxy", F],
  ["throw", v]
]);
function H(e, t) {
  for (const n of e)
    if (t === n || n === "*" || n instanceof RegExp && n.test(t))
      return !0;
  return !1;
}
function A(e, t = globalThis, n = ["*"]) {
  t.addEventListener("message", function f(r) {
    if (!r || !r.data)
      return;
    if (!H(n, r.origin)) {
      console.warn(`Invalid origin '${r.origin}' for comlink proxy`);
      return;
    }
    const { id: s, type: d, path: c } = Object.assign({ path: [] }, r.data), l = (r.data.argumentList || []).map(g);
    let a;
    try {
      const o = c.slice(0, -1).reduce((i, h) => i[h], e), u = c.reduce((i, h) => i[h], e);
      switch (d) {
        case "GET":
          a = u;
          break;
        case "SET":
          o[c.slice(-1)[0]] = g(r.data.value), a = !0;
          break;
        case "APPLY":
          a = u.apply(o, l);
          break;
        case "CONSTRUCT":
          {
            const i = new u(...l);
            a = D(i);
          }
          break;
        case "ENDPOINT":
          {
            const { port1: i, port2: h } = new MessageChannel();
            A(e, h), a = j(i, [i]);
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
      const [u, i] = p(o);
      t.postMessage(Object.assign(Object.assign({}, u), { id: s }), i), d === "RELEASE" && (t.removeEventListener("message", f), R(t), x in e && typeof e[x] == "function" && e[x]());
    }).catch((o) => {
      const [u, i] = p({
        value: new TypeError("Unserializable return value"),
        [w]: 0
      });
      t.postMessage(Object.assign(Object.assign({}, u), { id: s }), i);
    });
  }), t.start && t.start();
}
function L(e) {
  return e.constructor.name === "MessagePort";
}
function R(e) {
  L(e) && e.close();
}
function C(e, t) {
  const n = /* @__PURE__ */ new Map();
  return e.addEventListener("message", function(r) {
    const { data: s } = r;
    if (!s || !s.id)
      return;
    const d = n.get(s.id);
    if (d)
      try {
        d(s);
      } finally {
        n.delete(s.id);
      }
  }), k(e, n, [], t);
}
function y(e) {
  if (e)
    throw new Error("Proxy has been released and is not useable");
}
function O(e) {
  return m(e, /* @__PURE__ */ new Map(), {
    type: "RELEASE"
  }).then(() => {
    R(e);
  });
}
const E = /* @__PURE__ */ new WeakMap(), b = "FinalizationRegistry" in globalThis && new FinalizationRegistry((e) => {
  const t = (E.get(e) || 0) - 1;
  E.set(e, t), t === 0 && O(e);
});
function V(e, t) {
  const n = (E.get(t) || 0) + 1;
  E.set(t, n), b && b.register(e, t, e);
}
function I(e) {
  b && b.unregister(e);
}
function k(e, t, n = [], f = function() {
}) {
  let r = !1;
  const s = new Proxy(f, {
    get(d, c) {
      if (y(r), c === N)
        return () => {
          I(s), O(e), t.clear(), r = !0;
        };
      if (c === "then") {
        if (n.length === 0)
          return { then: () => s };
        const l = m(e, t, {
          type: "GET",
          path: n.map((a) => a.toString())
        }).then(g);
        return l.then.bind(l);
      }
      return k(e, t, [...n, c]);
    },
    set(d, c, l) {
      y(r);
      const [a, o] = p(l);
      return m(e, t, {
        type: "SET",
        path: [...n, c].map((u) => u.toString()),
        value: a
      }, o).then(g);
    },
    apply(d, c, l) {
      y(r);
      const a = n[n.length - 1];
      if (a === z)
        return m(e, t, {
          type: "ENDPOINT"
        }).then(g);
      if (a === "bind")
        return k(e, t, n.slice(0, -1));
      const [o, u] = P(l);
      return m(e, t, {
        type: "APPLY",
        path: n.map((i) => i.toString()),
        argumentList: o
      }, u).then(g);
    },
    construct(d, c) {
      y(r);
      const [l, a] = P(c);
      return m(e, t, {
        type: "CONSTRUCT",
        path: n.map((o) => o.toString()),
        argumentList: l
      }, a).then(g);
    }
  });
  return V(s, e), s;
}
function W(e) {
  return Array.prototype.concat.apply([], e);
}
function P(e) {
  const t = e.map(p);
  return [t.map((n) => n[0]), W(t.map((n) => n[1]))];
}
const _ = /* @__PURE__ */ new WeakMap();
function j(e, t) {
  return _.set(e, t), e;
}
function D(e) {
  return Object.assign(e, { [T]: !0 });
}
function p(e) {
  for (const [t, n] of S)
    if (n.canHandle(e)) {
      const [f, r] = n.serialize(e);
      return [
        {
          type: "HANDLER",
          name: t,
          value: f
        },
        r
      ];
    }
  return [
    {
      type: "RAW",
      value: e
    },
    _.get(e) || []
  ];
}
function g(e) {
  switch (e.type) {
    case "HANDLER":
      return S.get(e.name).deserialize(e.value);
    case "RAW":
      return e.value;
  }
}
function m(e, t, n, f) {
  return new Promise((r) => {
    const s = U();
    t.set(s, r), e.start && e.start(), e.postMessage(Object.assign({ id: s }, n), f);
  });
}
function U() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}
class G {
  constructor() {
    this.platformActions = [], this.application = {
      downloadFile: async (t, n, f) => await this._mainThread.downloadFile(t, n, f),
      downloadFiles: async (t, n) => await this._mainThread.downloadFiles(t, n),
      feedback: async (t, n) => await this._mainThread.feedback(t, n)
    }, A({
      activate: this.activate.bind(this),
      deactivate: this.deactivate.bind(this),
      platformActions: this._platformActions.bind(this)
    }), this._mainThread = C(self);
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
  _platformActions(t) {
    this.platformActions.forEach((n) => n.key === t ? n.action() : {});
  }
}
export {
  G as ExtensionBase
};
//# sourceMappingURL=index.es.js.map
