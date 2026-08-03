/**
 * Premium one-pager craft pack — vanilla TS, zero deps.
 * Copy into project; call initPremiumOnePager() once on DOM ready.
 *
 * Markup conventions:
 * - Sections: <section id="..." data-chapter="Hero label"> (data-chapter optional)
 * - Reveal targets: class "pop-reveal" (or pass revealSelector)
 * - Optional host hooks via options
 */

export type PremiumOnePagerOptions = {
  /** CSS color tokens override via CSS variables on :root — optional */
  progressSelector?: string;
  revealSelector?: string;
  chapterRootId?: string;
  noiseClass?: string;
  sectionSelector?: string;
  /** Max chapters rendered in the rail (default 12) */
  maxChapters?: number;
  /** Skip chapter rail entirely (tools/apps) */
  enableChapters?: boolean;
  enableProgress?: boolean;
  enableReveal?: boolean;
  enableNoise?: boolean;
};

const REDUCED =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function ensureProgress(sel = "#pop-progress") {
  let el = document.querySelector<HTMLElement>(sel);
  if (!el) {
    el = document.createElement("div");
    el.id = sel.replace(/^#/, "") || "pop-progress";
    el.className = "pop-progress";
    el.setAttribute("aria-hidden", "true");
    document.body.prepend(el);
  }
  return el;
}

function ensureNoise(cls = "pop-noise") {
  let el = document.querySelector<HTMLElement>("." + cls);
  if (!el) {
    el = document.createElement("div");
    el.className = cls;
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
  }
  return el;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function buildChapters(
  sections: HTMLElement[],
  rootId = "pop-chapters",
  max = 12,
) {
  const list = sections.slice(0, max);
  let nav = document.getElementById(rootId);
  if (!nav) {
    nav = document.createElement("nav");
    nav.id = rootId;
    nav.className = "pop-chapters";
    nav.setAttribute("aria-label", "Sections");
    document.body.appendChild(nav);
  }
  nav.innerHTML = "";
  // nav itself is the list container for simpler CSS (.pop-chapters a)
  nav.className = "pop-chapters";
  list.forEach((sec, i) => {
    if (!sec.id) sec.id = `section-${i + 1}`;
    const a = document.createElement("a");
    a.href = `#${sec.id}`;
    a.textContent = pad2(i + 1);
    const label = sec.dataset.chapter || sec.getAttribute("aria-label") || sec.id;
    a.setAttribute("aria-label", label);
    a.addEventListener("click", (e) => {
      e.preventDefault();
      sec.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", `#${sec.id}`);
    });
    nav!.appendChild(a);
  });
  return {
    nav,
    links: Array.from(nav.querySelectorAll("a")) as HTMLAnchorElement[],
    sections: list,
  };
}

function bindProgress(el: HTMLElement) {
  let raf = 0;
  const update = () => {
    raf = 0;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const p = max > 0 ? clamp01(window.scrollY / max) : 0;
    el.style.width = `${(p * 100).toFixed(2)}%`;
  };
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(update);
  };
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    if (raf) cancelAnimationFrame(raf);
  };
}

function bindReveal(selector: string) {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (!nodes.length) return () => {};
  if (REDUCED || !("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("is-in"));
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const ent of entries) {
        if (!ent.isIntersecting) continue;
        (ent.target as HTMLElement).classList.add("is-in");
        io.unobserve(ent.target); // one-shot
      }
    },
    { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  nodes.forEach((n) => io.observe(n));
  return () => io.disconnect();
}

function bindChapterHighlight(
  sections: HTMLElement[],
  links: HTMLAnchorElement[],
) {
  if (!sections.length || !links.length) return () => {};
  const setCurrent = (idx: number) => {
    links.forEach((a, i) => {
      if (i === idx) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };
  if (!("IntersectionObserver" in window)) {
    setCurrent(0);
    return () => {};
  }
  let active = 0;
  const io = new IntersectionObserver(
    (entries) => {
      // pick the entry closest to top that is intersecting
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      const id = (visible[0].target as HTMLElement).id;
      const idx = sections.findIndex((s) => s.id === id);
      if (idx >= 0 && idx !== active) {
        active = idx;
        setCurrent(idx);
      }
    },
    { root: null, rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
  );
  sections.forEach((s) => io.observe(s));
  setCurrent(0);
  return () => io.disconnect();
}

export function initPremiumOnePager(opts: PremiumOnePagerOptions = {}) {
  const {
    progressSelector = "#pop-progress",
    revealSelector = ".pop-reveal",
    chapterRootId = "pop-chapters",
    noiseClass = "pop-noise",
    sectionSelector = "main section[id], main > section, [data-chapter]",
    maxChapters = 12,
    enableChapters = true,
    enableProgress = true,
    enableReveal = true,
    enableNoise = true,
  } = opts;

  const cleanups: Array<() => void> = [];

  if (enableNoise) ensureNoise(noiseClass);

  if (enableProgress && !REDUCED) {
    const bar = ensureProgress(progressSelector);
    cleanups.push(bindProgress(bar));
  }

  if (enableReveal) cleanups.push(bindReveal(revealSelector));

  if (enableChapters && !REDUCED) {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(sectionSelector),
    ).filter((s) => s.offsetParent !== null || s.getClientRects().length);
    // de-dupe
    const uniq = Array.from(new Set(sections)).slice(0, maxChapters);
    if (uniq.length >= 3) {
      const { links, sections: secs } = buildChapters(
        uniq,
        chapterRootId,
        maxChapters,
      );
      cleanups.push(bindChapterHighlight(secs, links));
    }
  }

  return () => cleanups.forEach((fn) => fn());
}

// Auto-init helper for plain script tags
export function autoInitPremiumOnePager() {
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => initPremiumOnePager(),
      { once: true },
    );
  } else {
    initPremiumOnePager();
  }
}
