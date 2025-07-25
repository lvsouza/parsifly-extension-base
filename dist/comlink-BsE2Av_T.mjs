/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const M = Symbol("Comlink.proxy"), z = Symbol("Comlink.endpoint"), N = Symbol("Comlink.releaseProxy"), x = Symbol("Comlink.finalizer"), h = Symbol("Comlink.thrown"), S = (e) => typeof e == "object" && e !== null || typeof e == "function", H = {
  canHandle: (e) => S(e) && e[M],
  serialize(e) {
    const { port1: t, port2: r } = new MessageChannel();
    return R(e, t), [r, [r]];
  },
  deserialize(e) {
    return e.start(), I(e);
  }
}, L = {
  canHandle: (e) => S(e) && h in e,
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
  ["proxy", H],
  ["throw", L]
]);
function V(e, t) {
  for (const r of e)
    if (t === r || r === "*" || r instanceof RegExp && r.test(t))
      return !0;
  return !1;
}
function R(e, t = globalThis, r = ["*"]) {
  t.addEventListener("message", function g(n) {
    if (!n || !n.data)
      return;
    if (!V(r, n.origin)) {
      console.warn(`Invalid origin '${n.origin}' for comlink proxy`);
      return;
    }
    const { id: a, type: f, path: c } = Object.assign({ path: [] }, n.data), l = (n.data.argumentList || []).map(y);
    let s;
    try {
      const o = c.slice(0, -1).reduce((i, d) => i[d], e), u = c.reduce((i, d) => i[d], e);
      switch (f) {
        case "GET":
          s = u;
          break;
        case "SET":
          o[c.slice(-1)[0]] = y(n.data.value), s = !0;
          break;
        case "APPLY":
          s = u.apply(o, l);
          break;
        case "CONSTRUCT":
          {
            const i = new u(...l);
            s = U(i);
          }
          break;
        case "ENDPOINT":
          {
            const { port1: i, port2: d } = new MessageChannel();
            R(e, d), s = F(i, [i]);
          }
          break;
        case "RELEASE":
          s = void 0;
          break;
        default:
          return;
      }
    } catch (o) {
      s = { value: o, [h]: 0 };
    }
    Promise.resolve(s).catch((o) => ({ value: o, [h]: 0 })).then((o) => {
      const [u, i] = p(o);
      t.postMessage(Object.assign(Object.assign({}, u), { id: a }), i), f === "RELEASE" && (t.removeEventListener("message", g), T(t), x in e && typeof e[x] == "function" && e[x]());
    }).catch((o) => {
      const [u, i] = p({
        value: new TypeError("Unserializable return value"),
        [h]: 0
      });
      t.postMessage(Object.assign(Object.assign({}, u), { id: a }), i);
    });
  }), t.start && t.start();
}
function _(e) {
  return e.constructor.name === "MessagePort";
}
function T(e) {
  _(e) && e.close();
}
function I(e, t) {
  const r = /* @__PURE__ */ new Map();
  return e.addEventListener("message", function(n) {
    const { data: a } = n;
    if (!a || !a.id)
      return;
    const f = r.get(a.id);
    if (f)
      try {
        f(a);
      } finally {
        r.delete(a.id);
      }
  }), P(e, r, [], t);
}
function w(e) {
  if (e)
    throw new Error("Proxy has been released and is not useable");
}
function C(e) {
  return m(e, /* @__PURE__ */ new Map(), {
    type: "RELEASE"
  }).then(() => {
    T(e);
  });
}
const E = /* @__PURE__ */ new WeakMap(), b = "FinalizationRegistry" in globalThis && new FinalizationRegistry((e) => {
  const t = (E.get(e) || 0) - 1;
  E.set(e, t), t === 0 && C(e);
});
function W(e, t) {
  const r = (E.get(t) || 0) + 1;
  E.set(t, r), b && b.register(e, t, e);
}
function j(e) {
  b && b.unregister(e);
}
function P(e, t, r = [], g = function() {
}) {
  let n = !1;
  const a = new Proxy(g, {
    get(f, c) {
      if (w(n), c === N)
        return () => {
          j(a), C(e), t.clear(), n = !0;
        };
      if (c === "then") {
        if (r.length === 0)
          return { then: () => a };
        const l = m(e, t, {
          type: "GET",
          path: r.map((s) => s.toString())
        }).then(y);
        return l.then.bind(l);
      }
      return P(e, t, [...r, c]);
    },
    set(f, c, l) {
      w(n);
      const [s, o] = p(l);
      return m(e, t, {
        type: "SET",
        path: [...r, c].map((u) => u.toString()),
        value: s
      }, o).then(y);
    },
    apply(f, c, l) {
      w(n);
      const s = r[r.length - 1];
      if (s === z)
        return m(e, t, {
          type: "ENDPOINT"
        }).then(y);
      if (s === "bind")
        return P(e, t, r.slice(0, -1));
      const [o, u] = k(l);
      return m(e, t, {
        type: "APPLY",
        path: r.map((i) => i.toString()),
        argumentList: o
      }, u).then(y);
    },
    construct(f, c) {
      w(n);
      const [l, s] = k(c);
      return m(e, t, {
        type: "CONSTRUCT",
        path: r.map((o) => o.toString()),
        argumentList: l
      }, s).then(y);
    }
  });
  return W(a, e), a;
}
function D(e) {
  return Array.prototype.concat.apply([], e);
}
function k(e) {
  const t = e.map(p);
  return [t.map((r) => r[0]), D(t.map((r) => r[1]))];
}
const O = /* @__PURE__ */ new WeakMap();
function F(e, t) {
  return O.set(e, t), e;
}
function U(e) {
  return Object.assign(e, { [M]: !0 });
}
function p(e) {
  for (const [t, r] of A)
    if (r.canHandle(e)) {
      const [g, n] = r.serialize(e);
      return [
        {
          type: "HANDLER",
          name: t,
          value: g
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
function y(e) {
  switch (e.type) {
    case "HANDLER":
      return A.get(e.name).deserialize(e.value);
    case "RAW":
      return e.value;
  }
}
function m(e, t, r, g) {
  return new Promise((n) => {
    const a = G();
    t.set(a, n), e.start && e.start(), e.postMessage(Object.assign({ id: a }, r), g);
  });
}
function G() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}
export {
  R as e,
  I as w
};
//# sourceMappingURL=comlink-BsE2Av_T.mjs.map
