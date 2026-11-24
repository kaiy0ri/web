// Liquid glass for the navigation layer (the header and its menus; see styles.css).
// 1) Rim light: the specular edge turns toward the pointer (one rAF per pointer move, nothing else per frame).
// 2) Refraction (Chromium): each glass element gets its own SVG lens, sized to it and rebuilt only on resize.
// 3) The hover capsule that slides between the header's menu items.
// External file because the strict Content-Security-Policy allows no inline code. No library.
(() => {
  const els = [...document.querySelectorAll(".glass")];
  if (!els.length) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const plain = matchMedia("(prefers-reduced-transparency: reduce), (prefers-contrast: more)").matches;

  // --- Rim light ---
  if (!reduce && !plain) {
    let ev = null;
    addEventListener("pointermove", (e) => {
      if (!ev) requestAnimationFrame(() => {
        for (const el of els) {
          const r = el.getBoundingClientRect();
          if (!r.width) continue;
          const a = Math.atan2(ev.clientY - (r.top + r.height / 2), ev.clientX - (r.left + r.width / 2));
          el.style.setProperty("--glint", `${Math.round((a * 180) / Math.PI + 90)}deg`); // CSS angles start at the top
        }
        ev = null;
      });
      ev = e;
    }, { passive: true });
  }

  // --- Hover capsule: one highlight that slides to whichever menu item is under the pointer or focused. ---
  const menu = document.querySelector(".nav-menu");
  if (menu) {
    const items = [...menu.querySelectorAll("summary, .nav-plain")];
    const nav = menu.closest(".nav");
    const place = (item) => {
      const m = nav.getBoundingClientRect(), r = item.getBoundingClientRect();
      menu.style.setProperty("--hl-x", `${r.left - m.left}px`);
      menu.style.setProperty("--hl-y", `${r.top - m.top}px`);
      menu.style.setProperty("--hl-w", `${r.width}px`);
      menu.style.setProperty("--hl-h", `${r.height}px`);
      menu.classList.add("hl-on");
    };
    // At rest the capsule sits on the open menu's button, or hides.
    const rest = () => {
      const open = menu.querySelector(".nav-dd[open] summary");
      if (open) place(open); else menu.classList.remove("hl-on");
    };
    items.forEach((it) => {
      it.addEventListener("pointerenter", () => place(it));
      it.addEventListener("focus", () => place(it));
      it.addEventListener("blur", rest);
    });
    menu.addEventListener("pointerleave", rest);
    menu.querySelectorAll(".nav-dd").forEach((d) => d.addEventListener("toggle", rest));
  }

  // --- Refraction ---
  // shortcut: only Chromium can run an SVG filter on the backdrop, and navigator.userAgentData exists only there.
  // Other browsers keep the CSS-only glass from styles.css. Swap for a real feature test if one appears.
  if (plain || !navigator.userAgentData) return;
  document.documentElement.classList.add("lens-on");

  const NS = "http://www.w3.org/2000/svg";
  const make = (name, attrs) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };
  const defs = make("svg", { class: "glass-defs", "aria-hidden": "true", focusable: "false" });
  document.body.append(defs);

  // How far light bends across the bezel, from the rim (x = 0) to where the glass goes flat (x = 1).
  // The surface is a convex squircle, h = (1 - (1 - x)^4)^(1/4): flat in the middle, rolling off steeply at the rim.
  // A ray through a surface tilted by θ leaves at asin(sin θ / n); the sideways shift grows with tan of the
  // difference. Sampled once into a table, normalised so the rim bends the most.
  const N = 128, IOR = 1.5, bend = new Float32Array(N + 1);
  {
    const h = (x) => Math.pow(1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 4), 0.25);
    let max = 0;
    for (let i = 0; i <= N; i++) {
      const x = Math.max(i / N, 1e-4), slope = (h(x + 1e-3) - h(x - 1e-3)) / 2e-3;
      const t = Math.atan(slope);
      bend[i] = Math.tan(t - Math.asin(Math.sin(t) / IOR));
      max = Math.max(max, bend[i]);
    }
    for (let i = 0; i <= N; i++) bend[i] /= max;
  }

  // Displacement map for a rounded rectangle: neutral grey where the glass is flat; inside the bezel the red and
  // green channels point each pixel further in, so content is pulled in and magnified toward the rim.
  function lensMap(w, h, radius, bezel) {
    const s = 0.5; // half resolution is plenty for a smooth map
    const cw = Math.max(1, Math.round(w * s)), ch = Math.max(1, Math.round(h * s));
    const canvas = document.createElement("canvas");
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(cw, ch);
    const hx = w / 2, hy = h / 2, r = Math.min(radius, hx, hy);
    for (let y = 0, i = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++, i += 4) {
        const px = (x + 0.5) / s - hx, py = (y + 0.5) / s - hy;
        const qx = Math.abs(px) - (hx - r), qy = Math.abs(py) - (hy - r);
        let nx = 0, ny = 0, dist; // outward normal, and distance in from the edge
        if (qx > 0 && qy > 0) {
          const l = Math.hypot(qx, qy) || 1;
          dist = r - l; nx = (qx / l) * Math.sign(px); ny = (qy / l) * Math.sign(py);
        } else if (qx > qy) { dist = r - qx; nx = Math.sign(px); }
        else { dist = r - qy; ny = Math.sign(py); }
        const u = dist / bezel;
        const mag = dist < 0 || u >= 1 ? 0 : bend[Math.round(u * N)];
        img.data[i] = 128 - nx * mag * 127;
        img.data[i + 1] = 128 - ny * mag * 127;
        img.data[i + 2] = 128;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL(); // a data: image, which the CSP's img-src allows
  }

  let count = 0;
  function apply(el) {
    const w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    const cs = getComputedStyle(el);
    const radius = parseFloat(cs.borderTopLeftRadius) || 0;
    const bezel = Math.min(parseFloat(cs.getPropertyValue("--glass-bezel")) || 20, w / 2, h / 2);
    const scale = bezel * 2.4; // the rim pulls content in by up to 1.2 bezel widths
    const id = (el.dataset.glassId ||= `glass-${++count}`);
    document.getElementById(id)?.remove();

    const f = make("filter", { id, x: 0, y: 0, width: w, height: h, filterUnits: "userSpaceOnUse", "color-interpolation-filters": "sRGB" });
    f.append(make("feImage", { href: lensMap(w, h, radius, bezel), x: 0, y: 0, width: w, height: h, preserveAspectRatio: "none", result: "map" }));
    // One pass per colour, each bent a little less, so the rim splits into a faint fringe like real glass.
    const keep = { r: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", g: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", b: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" };
    [["r", 1], ["g", 0.96], ["b", 0.92]].forEach(([c, k]) => {
      f.append(make("feDisplacementMap", { in: "SourceGraphic", in2: "map", scale: scale * k, xChannelSelector: "R", yChannelSelector: "G", result: `d${c}` }));
      f.append(make("feColorMatrix", { in: `d${c}`, type: "matrix", values: keep[c], result: c }));
    });
    f.append(make("feBlend", { in: "r", in2: "g", mode: "screen", result: "rg" }));
    f.append(make("feBlend", { in: "rg", in2: "b", mode: "screen" }));
    defs.append(f);

    // styles.css puts this between the blur and the tone on the glass layer (::after).
    el.style.setProperty("--lens", `url(#${id})`);
  }

  // One lens per glass element. The menus are hidden until opened, so theirs is built the first time they show.
  const ro = new ResizeObserver((entries) => requestAnimationFrame(() => entries.forEach((e) => apply(e.target))));
  els.forEach((el) => ro.observe(el));
})();
