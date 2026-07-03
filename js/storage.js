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
})();
