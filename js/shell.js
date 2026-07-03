/* ─────────────────────────────────────────────────────────────────────────
   Folio — shell.js
   Shared page chrome: HTML escaping + toast notifications.
   Classic script (no modules) so file:// keeps working. Exposes window.Folio.
   Pages that use the toast need a `<div class="toast" id="toast"></div>`.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
    "use strict";
    const Folio = (window.Folio = window.Folio || {});

    /* Escape a string for safe interpolation into innerHTML templates. */
    Folio.esc = function (s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    };

    /* Toast with optional action button: Folio.toast("removed", {label:"Undo", fn}) */
    Folio.toast = function (msg, action) {
        const el = document.getElementById("toast");
        if (!el) return;
        el.innerHTML = "";
        const span = document.createElement("span");
        span.textContent = msg;
        el.appendChild(span);
        if (action) {
            const b = document.createElement("button");
            b.className = "toast-action";
            b.textContent = action.label;
            b.onclick = () => {
                el.classList.remove("show");
                action.fn();
            };
            el.appendChild(b);
        }
        el.classList.add("show");
        clearTimeout(el._t);
        el._t = setTimeout(
            () => el.classList.remove("show"),
            action ? 4500 : 1800,
        );
    };

    /* True when the user asked the OS for less motion. */
    Folio.reducedMotion = () =>
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
})();
