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

    /* ── Slot switcher (decision #15) ──
       Renders a <select> + "⋯" menu for a Folio.slots store inside
       `container`. One implementation for résumé profiles, budget
       scenarios, and future studios.

       opts:
         noun         — "profile" / "scenario" (used in labels)
         blankData()  — data for a newly created slot
         beforeSwitch() — save current state into the active slot
         onSwitch()   — apply the (new) active slot's data to the page   */
    Folio.slotSwitcher = function (container, store, opts) {
        const noun = opts.noun || "profile";
        let menu = null;

        document.addEventListener("click", () => {
            if (menu) menu.classList.remove("open");
        });

        function switchAnd(fn) {
            if (opts.beforeSwitch) opts.beforeSwitch();
            fn();
            if (opts.onSwitch) opts.onSwitch();
            render();
        }

        function render() {
            container.innerHTML = "";

            const sel = document.createElement("select");
            sel.className = "slot-select";
            sel.title = `Switch ${noun}`;
            sel.setAttribute("aria-label", `Active ${noun}`);
            store.list().forEach((s) => {
                const o = document.createElement("option");
                o.value = s.id;
                o.textContent = s.name;
                if (s.id === store.activeId()) o.selected = true;
                sel.appendChild(o);
            });
            sel.onchange = () => switchAnd(() => store.switchTo(sel.value));

            const btn = document.createElement("button");
            btn.className = "slot-menu-btn";
            btn.textContent = "⋯";
            btn.title = `Manage ${noun}s`;
            btn.setAttribute("aria-label", `Manage ${noun}s`);

            menu = document.createElement("div");
            menu.className = "slot-menu";
            const item = (label, fn, danger) => {
                const b = document.createElement("button");
                b.textContent = label;
                if (danger) b.className = "danger";
                b.onclick = () => {
                    menu.classList.remove("open");
                    fn();
                };
                menu.appendChild(b);
            };

            item(`New ${noun}`, () => {
                const name = prompt(
                    `Name for the new ${noun}:`,
                    `New ${noun}`,
                );
                if (!name || !name.trim()) return;
                switchAnd(() =>
                    store.create(
                        name.trim(),
                        opts.blankData ? opts.blankData() : null,
                    ),
                );
            });
            item("Duplicate", () => {
                if (opts.beforeSwitch) opts.beforeSwitch();
                const cur = store.active();
                const name = prompt(
                    "Name for the copy:",
                    `Copy of ${cur.name}`,
                );
                if (!name || !name.trim()) return;
                store.duplicate(cur.id, name.trim());
                if (opts.onSwitch) opts.onSwitch();
                render();
            });
            item("Rename", () => {
                const cur = store.active();
                const name = prompt(`Rename this ${noun}:`, cur.name);
                if (!name || !name.trim()) return;
                store.rename(cur.id, name.trim());
                render();
            });
            item(
                "Delete",
                () => {
                    if (store.list().length <= 1) {
                        Folio.toast(`can't delete the only ${noun}`);
                        return;
                    }
                    const cur = store.active();
                    if (
                        !confirm(
                            `Delete "${cur.name}"? This can't be undone.`,
                        )
                    )
                        return;
                    switchAnd(() => store.remove(cur.id));
                },
                true,
            );

            btn.onclick = (e) => {
                e.stopPropagation();
                menu.classList.toggle("open");
            };

            container.appendChild(sel);
            container.appendChild(btn);
            container.appendChild(menu);
        }

        render();
        return { refresh: render };
    };
})();
