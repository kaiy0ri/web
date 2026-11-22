// Home page mock: the five stages become tabs (WAI-ARIA tabs pattern: arrows, Home, End).
// Without this script the Spec view shows on its own. No library; the CSP allows only same-origin scripts.
(() => {
  const mock = document.querySelector(".mock");
  const list = mock && mock.querySelector('[role="tablist"]');
  if (!list) return;
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const badge = mock.querySelector(".mock-badge");
  mock.classList.add("tabs-on");

  const select = (tab, focus) => {
    const at = tabs.indexOf(tab);
    tabs.forEach((t, i) => {
      const on = i === at;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      t.classList.toggle("past", i < at);
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    badge.textContent = tab.dataset.badge;
    if (focus) tab.focus();
  };

  tabs.forEach((t) => t.addEventListener("click", () => select(t)));
  list.addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (i < 0 || next === undefined) return;
    e.preventDefault();
    select(tabs[(next + tabs.length) % tabs.length], true);
  });

  // Ship loops back: "Plan v2 from feedback" opens the Idea view.
  for (const btn of mock.querySelectorAll("[data-goto]")) {
    btn.addEventListener("click", () => select(document.getElementById(btn.dataset.goto), true));
  }

  // Build view: ticking tasks updates the count and moves the "now" highlight to the first open task.
  const boxes = [...mock.querySelectorAll(".mock-build input")];
  const count = mock.querySelector(".mock-count");
  const update = () => {
    count.textContent = `${boxes.filter((b) => b.checked).length} of ${boxes.length} tasks done`;
    const first = boxes.find((b) => !b.checked);
    boxes.forEach((b) => b.closest("li").classList.toggle("now", b === first));
  };
  boxes.forEach((b) => b.addEventListener("change", update));
})();
