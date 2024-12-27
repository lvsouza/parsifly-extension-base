/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const T = Symbol("Comlink.proxy"), z = Symbol("Comlink.endpoint"), N = Symbol("Comlink.releaseProxy"), k = Symbol("Comlink.finalizer"), w = Symbol("Comlink.thrown"), M = (t) => typeof t == "object" && t !== null || typeof t == "function", F = {
  canHandle: (t) => M(t) && t[T],
  serialize(t) {
    const { port1: e, port2: r } = new MessageChannel();
    return A(t, e), [r, [r]];
  },
  deserialize(t) {
    return t.start(), C(t);
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
function A(t, e = globalThis, r = ["*"]) {
  e.addEventListener("message", function o(n) {
    if (!n || !n.data)
      return;
    if (!H(r, n.origin)) {
      console.warn(`Invalid origin '${n.origin}' for comlink proxy`);
      return;
    }
    const { id: s, type: d, path: l } = Object.assign({ path: [] }, n.data), u = (n.data.argumentList || []).map(h);
    let a;
    try {
      const i = l.slice(0, -1).reduce((c, m) => c[m], t), f = l.reduce((c, m) => c[m], t);
      switch (d) {
        case "GET":
          a = f;
          break;
        case "SET":
          i[l.slice(-1)[0]] = h(n.data.value), a = !0;
          break;
        case "APPLY":
          a = f.apply(i, u);
          break;
        case "CONSTRUCT":
          {
            const c = new f(...u);
            a = D(c);
          }
          break;
        case "ENDPOINT":
          {
            const { port1: c, port2: m } = new MessageChannel();
            A(t, m), a = j(c, [c]);
          }
          break;
        case "RELEASE":
          a = void 0;
          break;
        default:
          return;
      }
    } catch (i) {
      a = { value: i, [w]: 0 };
    }
    Promise.resolve(a).catch((i) => ({ value: i, [w]: 0 })).then((i) => {
      const [f, c] = b(i);
      e.postMessage(Object.assign(Object.assign({}, f), { id: s }), c), d === "RELEASE" && (e.removeEventListener("message", o), R(e), k in t && typeof t[k] == "function" && t[k]());
    }).catch((i) => {
      const [f, c] = b({
        value: new TypeError("Unserializable return value"),
        [w]: 0
      });
      e.postMessage(Object.assign(Object.assign({}, f), { id: s }), c);
    });
  }), e.start && e.start();
}
function L(t) {
  return t.constructor.name === "MessagePort";
}
function R(t) {
  L(t) && t.close();
}
function C(t, e) {
  const r = /* @__PURE__ */ new Map();
  return t.addEventListener("message", function(n) {
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
  }), x(t, r, [], e);
}
function y(t) {
  if (t)
    throw new Error("Proxy has been released and is not useable");
}
function O(t) {
  return g(t, /* @__PURE__ */ new Map(), {
    type: "RELEASE"
  }).then(() => {
    R(t);
  });
}
const p = /* @__PURE__ */ new WeakMap(), E = "FinalizationRegistry" in globalThis && new FinalizationRegistry((t) => {
  const e = (p.get(t) || 0) - 1;
  p.set(t, e), e === 0 && O(t);
});
function V(t, e) {
  const r = (p.get(e) || 0) + 1;
  p.set(e, r), E && E.register(t, e, t);
}
function I(t) {
  E && E.unregister(t);
}
function x(t, e, r = [], o = function() {
}) {
  let n = !1;
  const s = new Proxy(o, {
    get(d, l) {
      if (y(n), l === N)
        return () => {
          I(s), O(t), e.clear(), n = !0;
        };
      if (l === "then") {
        if (r.length === 0)
          return { then: () => s };
        const u = g(t, e, {
          type: "GET",
          path: r.map((a) => a.toString())
        }).then(h);
        return u.then.bind(u);
      }
      return x(t, e, [...r, l]);
    },
    set(d, l, u) {
      y(n);
      const [a, i] = b(u);
      return g(t, e, {
        type: "SET",
        path: [...r, l].map((f) => f.toString()),
        value: a
      }, i).then(h);
    },
    apply(d, l, u) {
      y(n);
      const a = r[r.length - 1];
      if (a === z)
        return g(t, e, {
          type: "ENDPOINT"
        }).then(h);
      if (a === "bind")
        return x(t, e, r.slice(0, -1));
      const [i, f] = P(u);
      return g(t, e, {
        type: "APPLY",
        path: r.map((c) => c.toString()),
        argumentList: i
      }, f).then(h);
    },
    construct(d, l) {
      y(n);
      const [u, a] = P(l);
      return g(t, e, {
        type: "CONSTRUCT",
        path: r.map((i) => i.toString()),
        argumentList: u
      }, a).then(h);
    }
  });
  return V(s, t), s;
}
function W(t) {
  return Array.prototype.concat.apply([], t);
}
function P(t) {
  const e = t.map(b);
  return [e.map((r) => r[0]), W(e.map((r) => r[1]))];
}
const _ = /* @__PURE__ */ new WeakMap();
function j(t, e) {
  return _.set(t, e), t;
}
function D(t) {
  return Object.assign(t, { [T]: !0 });
}
function b(t) {
  for (const [e, r] of S)
    if (r.canHandle(t)) {
      const [o, n] = r.serialize(t);
      return [
        {
          type: "HANDLER",
          name: e,
          value: o
        },
        n
      ];
    }
  return [
    {
      type: "RAW",
      value: t
    },
    _.get(t) || []
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
function g(t, e, r, o) {
  return new Promise((n) => {
    const s = U();
    e.set(s, n), t.start && t.start(), t.postMessage(Object.assign({ id: s }, r), o);
  });
}
function U() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}
class G {
  constructor() {
    this.platformActions = [], this.parsers = [], this.application = {
      downloadFile: async (e, r, o) => await this._mainThread.downloadFile(e, r, o),
      downloadFiles: async (e, r) => await this._mainThread.downloadFiles(e, r),
      feedback: async (e, r) => await this._mainThread.feedback(e, r)
    }, A({
      activate: this.activate.bind(this),
      deactivate: this.deactivate.bind(this),
      parsers: this._parsers.bind(this),
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
  _platformActions(e) {
    const r = this.platformActions.find((o) => o.key === e);
    if (!r) throw new Error(`Action with key "${e}" not found`);
    r.action();
  }
  _parsers(e, r) {
    const o = this.parsers.find((n) => n.key === e);
    if (!o) throw new Error(`Parser with key "${e}" not found`);
    return o.parser(r);
  }
}
export {
  G as ExtensionBase
};
//# sourceMappingURL=index.es.js.map
