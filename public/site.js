// Site-wide behaviour, loaded on every page (external file — strict CSP).
// The header dropdowns.
(() => {
  // --- Header dropdowns (<details>): only one open at a time; close on outside click, Escape or choosing a link ---
  const dds = [...document.querySelectorAll(".nav-dd")];
  dds.forEach((d) => d.addEventListener("toggle", () => {
    if (!d.open) return;
    dds.forEach((o) => { if (o !== d) o.open = false; });
    // Where the button sits relative to its menu, so the menu can grow out of the button's shape (styles.css).
    const s = d.querySelector("summary").getBoundingClientRect(), p = d.querySelector(".nav-panel");
    const r = p.getBoundingClientRect(), [, dy = 0] = getComputedStyle(p).translate.split(" ").map(parseFloat); // minus the opening slide
    p.style.setProperty("--tx", `${s.left - r.left}px`);
    p.style.setProperty("--tw", `${s.width}px`);
    p.style.setProperty("--th", `${s.height}px`);
    p.style.setProperty("--ty", `${s.top - (r.top - (dy || 0))}px`);
  }));
  document.addEventListener("click", (e) => dds.forEach((d) => { if (d.open && (!d.contains(e.target) || e.target.closest(".nav-panel a"))) d.open = false; }));
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = dds.find((d) => d.open);
    if (open) { open.open = false; open.querySelector("summary").focus(); }
  });
})();
