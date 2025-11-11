// script.js - positions value bubbles on the bar and attaches accessible popovers.
// The green (normal) segment spans exactly from data-min to data-max.
// Yellow segments extend on both sides using an extended numeric scale:
//   [min - 1.5 * (max - min), max + 1.5 * (max - min)]
// Bubbles sit above the bar and are mapped to this full span.
// Requires window.GLOSSARY from glossary.js.

(function () {
  const popover = document.getElementById('popover');
  let activeTarget = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // -------- Popover helpers --------

  function renderPopoverContent(entry) {
    popover.innerHTML = `
      <h4>${escapeHtml(entry.title)}</h4>
      <p>${escapeHtml(entry.text)}</p>
      ${
        entry.action
          ? `<p class="action">${escapeHtml(entry.action)}</p>`
          : ""
      }
    `;
  }

  function showPopoverFor(target) {
    const key = target.dataset.term;
    if (!key || !window.GLOSSARY) return;
    const entry = window.GLOSSARY[key];
    if (!entry) return;

    renderPopoverContent(entry);
    popover.setAttribute("aria-hidden", "false");
    activeTarget = target;

    const rect = target.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();

    let top = rect.bottom + 8;
    let left = rect.left;

    // keep within viewport horizontally
    const maxLeft = window.innerWidth - popRect.width - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;

    // if too close to bottom, show above the target instead
    if (top + popRect.height + 8 > window.innerHeight) {
      top = rect.top - popRect.height - 8;
    }

    popover.style.top = `${Math.round(top)}px`;
    popover.style.left = `${Math.round(left)}px`;
  }

  function hidePopover() {
    popover.setAttribute("aria-hidden", "true");
    activeTarget = null;
  }

  // -------- Bubble + bar layout --------

  function positionAllBubbles() {
    const cards = Array.from(document.querySelectorAll(".card"));

    cards.forEach((card) => {
      const bar = card.querySelector(".bar");
      const leftSeg = card.querySelector(".bar-inner .bar-yellow.left");
      const greenSeg = card.querySelector(".bar-inner .bar-green");
      const rightSeg = card.querySelector(".bar-inner .bar-yellow.right");
      const bubble = card.querySelector(".value-bubble");

      if (!bar || !bubble || !leftSeg || !greenSeg || !rightSeg) return;

      const min = parseFloat(card.dataset.min);
      const max = parseFloat(card.dataset.max);
      const rawValue = parseFloat(bubble.dataset.value);

      const barRect = bar.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      // Fallback layout if values are missing/invalid
      if (
        isNaN(min) ||
        isNaN(max) ||
        isNaN(rawValue) ||
        max === min
      ) {
        leftSeg.style.width = "25%";
        greenSeg.style.width = "50%";
        rightSeg.style.width = "25%";

        const bubbleHeight = bubble.offsetHeight || 26;
        const arrowHeight = 8;

        const barTopInCard = barRect.top - cardRect.top;
        const barLeftInCard = barRect.left - cardRect.left;
        const centerX = barLeftInCard + barRect.width / 2;

        const top =
          barTopInCard - bubbleHeight - arrowHeight;

        bubble.style.position = "absolute";
        bubble.style.left = `${Math.round(centerX)}px`;
        bubble.style.top = `${Math.round(top)}px`;
        return;
      }

      const normalWidth = max - min;
      const extension = normalWidth * 1.5;

      // Extended numeric span for the whole bar
      const spanStart = min - extension;
      const spanEnd = max + extension;
      const totalSpan = spanEnd - spanStart;

      // Fractions where the normal range begins/ends within that span
      const minFrac = (min - spanStart) / totalSpan;
      const maxFrac = (max - spanStart) / totalSpan;

      const leftPct = minFrac * 100;
      const greenPct = (maxFrac - minFrac) * 100;
      const rightPct = 100 - leftPct - greenPct;

      // Set yellow–green–yellow segment widths
      leftSeg.style.width = `${leftPct}%`;
      greenSeg.style.width = `${greenPct}%`;
      rightSeg.style.width = `${rightPct}%`;

      // ---- Range labels under edges of green ----
      const labelsContainer = card.querySelector(".range-labels");
      if (labelsContainer) {
        const labelSpans = labelsContainer.querySelectorAll("span");
        if (labelSpans.length >= 2) {
          const labelsRect = labelsContainer.getBoundingClientRect();

          const barLeftInCard = barRect.left - cardRect.left;
          const labelsLeftInCard = labelsRect.left - cardRect.left;
          const offset = barLeftInCard - labelsLeftInCard;
          const barWidth = barRect.width;

          const minX = offset + minFrac * barWidth;
          const maxX = offset + maxFrac * barWidth;

          labelSpans[0].style.position = "absolute";
          labelSpans[0].style.left = `${Math.round(minX)}px`;

          labelSpans[1].style.position = "absolute";
          labelSpans[1].style.left = `${Math.round(maxX)}px`;
        }
      }

      // ---- Bubble position above bar ----

      // Map value onto extended span, clamped to edges
      const clamped = Math.max(spanStart, Math.min(spanEnd, rawValue));
      const frac = (clamped - spanStart) / totalSpan;

      const barLeftInCard = barRect.left - cardRect.left;
      const barTopInCard = barRect.top - cardRect.top;
      const barWidth = barRect.width;

      const centerX = barLeftInCard + frac * barWidth;

      const bubbleHeight = bubble.offsetHeight || 26;
      const arrowHeight = 8; // must match the CSS triangle size
      const top =
        barTopInCard - bubbleHeight - arrowHeight; // guaranteed ABOVE the bar

      bubble.style.position = "absolute";
      bubble.style.left = `${Math.round(centerX)}px`;
      bubble.style.top = `${Math.round(top)}px`;
    });
  }

  // -------- Interaction wiring --------

  function initInteractions() {
    // Titles
    const titles = Array.from(document.querySelectorAll(".card-title"));
    titles.forEach((title) => {
      title.addEventListener("mouseenter", () => showPopoverFor(title));
      title.addEventListener("mouseleave", () => {
        setTimeout(() => {
          if (!popover.matches(":hover")) hidePopover();
        }, 120);
      });
      title.addEventListener("focus", () => showPopoverFor(title));
      title.addEventListener("blur", () => hidePopover());
      title.addEventListener("click", (ev) => {
        ev.preventDefault();
        const isOpen =
          popover.getAttribute("aria-hidden") === "false" &&
          activeTarget === title;
        if (isOpen) hidePopover();
        else showPopoverFor(title);
      });
    });

    // Value bubbles with descriptions
    const bubbles = Array.from(
      document.querySelectorAll(".value-bubble.interactive")
    );
    bubbles.forEach((bubble) => {
      bubble.addEventListener("mouseenter", () => showPopoverFor(bubble));
      bubble.addEventListener("mouseleave", () => {
        setTimeout(() => {
          if (!popover.matches(":hover")) hidePopover();
        }, 120);
      });
      bubble.addEventListener("focus", () => showPopoverFor(bubble));
      bubble.addEventListener("blur", () => hidePopover());
      bubble.addEventListener("click", (ev) => {
        ev.preventDefault();
        const isOpen =
          popover.getAttribute("aria-hidden") === "false" &&
          activeTarget === bubble;
        if (isOpen) hidePopover();
        else showPopoverFor(bubble);
      });
    });

    // Clicking outside closes the popover
    document.addEventListener("click", (ev) => {
      if (!activeTarget) return;
      if (
        activeTarget.contains(ev.target) ||
        popover.contains(ev.target)
      ) {
        return;
      }
      hidePopover();
    });

