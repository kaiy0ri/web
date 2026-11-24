// Site-wide behaviour, loaded on every page (external file — strict CSP).
// 1) Scroll-reveal: elements with .reveal spawn in the first time they scroll into view.
// 2) "Days since last update" in the footer.
(() => {
  const root = document.documentElement;
  root.classList.add("js"); // CSS only hides .reveal when JS is present

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  // --- Scroll reveal ---
  const revealables = [...document.querySelectorAll(".reveal")];
  if (revealables.length) {
    if (reduce.matches || !("IntersectionObserver" in window)) {
      revealables.forEach((el) => el.classList.add("in"));
    } else {
      const io = new IntersectionObserver(
        (entries, obs) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              obs.unobserve(entry.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
      );
      revealables.forEach((el) => io.observe(el));
    }
  }

  // --- "X days since last update" (computed in the browser so it never goes stale) ---
  for (const el of document.querySelectorAll(".updated[data-updated]")) {
    const then = new Date(el.dataset.updated);
    if (isNaN(then)) continue;
    const days = Math.max(0, Math.floor((Date.now() - then.getTime()) / 864e5));
    el.textContent = days === 0 ? "Updated today" : days === 1 ? "1 day since last update" : `${days} days since last update`;
    el.title = `Last update: ${then.toLocaleString()}`;
  }

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
