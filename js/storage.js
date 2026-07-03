/* ─────────────────────────────────────────────────────────────────────────
   Folio — storage.js
   Guarded localStorage access. Persistence failures must never be silent:
   callers check the return value and surface an error state (decision #21
   in handoff.md).
   ───────────────────────────────────────────────────────────────────────── */
(function () {
    "use strict";
    const Folio = (window.Folio = window.Folio || {});

    Folio.store = {
        /* read(key) → { ok:true, data:Object|null } | { ok:false, error } */
        read(key) {
            try {
                const raw = localStorage.getItem(key);
                return { ok: true, data: raw ? JSON.parse(raw) : null };
            } catch (error) {
                return { ok: false, error };
            }
        },

        /* write(key, value) → true on success, false on quota/any failure */
        write(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                return false;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                /* removing is best-effort */
            }
        },
    };

    /* ── Named slots (decision #15 in handoff.md) ──
       One mechanism for every "multiple documents" need: résumé profiles,
       budget scenarios, and whatever comes next. A slot store wraps one
       localStorage key with the envelope:
         { slotsVersion, activeId, slots: [{ id, name, updatedAt, data }] }
       Legacy singleton saves under the same key migrate to slot #1 on load. */
    Folio.slots = {
        open(key, { defaultName = "Default" } = {}) {
            let env = null;
            const genId = () =>
                Date.now().toString(36) +
                Math.random().toString(36).slice(2, 7);
            const freshEnv = () => ({
                slotsVersion: 1,
                activeId: "s0",
                slots: [
                    {
                        id: "s0",
                        name: defaultName,
                        updatedAt: Date.now(),
                        data: null,
                    },
                ],
            });
            const persist = () => Folio.store.write(key, env);

            const api = {
                /* → { ok:true } | { ok:false, error } (falls back to a fresh env) */
                load() {
                    const res = Folio.store.read(key);
                    if (!res.ok) {
                        env = freshEnv();
                        return res;
                    }
                    const d = res.data;
                    if (d && Array.isArray(d.slots) && d.slots.length) {
                        env = d;
                        if (!env.slots.some((s) => s.id === env.activeId))
                            env.activeId = env.slots[0].id;
                    } else if (d) {
                        /* legacy singleton blob → becomes slot #1 */
                        env = freshEnv();
                        env.slots[0].data = d;
                        persist();
                    } else {
                        env = freshEnv();
                    }
                    return { ok: true };
                },
                list: () =>
                    env.slots.map((s) => ({
                        id: s.id,
                        name: s.name,
                        updatedAt: s.updatedAt,
                    })),
                activeId: () => env.activeId,
                active: () =>
                    env.slots.find((s) => s.id === env.activeId) ||
                    env.slots[0],
                getData: () => api.active().data,
                setData(data) {
                    const s = api.active();
                    s.data = data;
                    s.updatedAt = Date.now();
                    return persist();
                },
                switchTo(id) {
                    if (env.slots.some((s) => s.id === id)) env.activeId = id;
                    return persist();
                },
                create(name, data = null) {
                    const s = {
                        id: genId(),
                        name,
                        updatedAt: Date.now(),
                        data,
                    };
                    env.slots.push(s);
                    env.activeId = s.id;
                    return persist();
                },
                duplicate(id, name) {
                    const src = env.slots.find((s) => s.id === id);
                    if (!src) return false;
                    const copy = {
                        id: genId(),
                        name,
                        updatedAt: Date.now(),
                        data: src.data
                            ? JSON.parse(JSON.stringify(src.data))
                            : null,
                    };
                    env.slots.push(copy);
                    env.activeId = copy.id;
                    return persist();
                },
                rename(id, name) {
                    const s = env.slots.find((s) => s.id === id);
                    if (s) {
                        s.name = name;
                        s.updatedAt = Date.now();
                    }
                    return persist();
                },
                /* refuses to remove the last slot */
                remove(id) {
                    if (env.slots.length <= 1) return false;
                    const i = env.slots.findIndex((s) => s.id === id);
                    if (i < 0) return false;
                    env.slots.splice(i, 1);
                    if (env.activeId === id)
                        env.activeId = env.slots[Math.max(0, i - 1)].id;
                    return persist();
                },
            };
            return api;
        },
    };
})();
