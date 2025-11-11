// script.js - position value bubbles along the bar and attach accessible popovers
// Updated so the green (normal) segment spans exactly from data-min to data-max
// and yellow segments extend on both sides. Bubbles are centered above the bar
// and placed according to the numeric value mapped to the extended scale.
// Requires window.GLOSSARY from glossary.js

(function () {
  const popover = document.getElementById('popover');
  let activeTarget = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Popover helpers
  function showGlossaryFor(target) {
    const key = target.dataset.term;
    const entry = window.GLOSSARY && window.GLOSSARY[key];
    if (!entry) return;
    popover.innerHTML = `
      <h4>${escapeHtml(entry.title)}</h4>
      <p>${escapeHtml(entry.text)}</p>
      ${
        entry.action
          ? `<p class="action">${escapeHtml(entry.action)}</p>`
          : ""
      }
    `;
    popover.setAttribute('aria-hidden', 'false');
    activeTarget = target;

    const rect = target.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();

    let top = rect.bottom + 8;
    let left = rect.left;

    // keep within viewport horizontally
    const maxLeft = window.innerWidth - popRect.width - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;

    // and vertically (if near bottom, show above)
    if (top + popRect.height + 8 > window.innerHeight) {
      top = rect.top - popRect.height - 8;
    }

    popover.style.transform = 'scale(1)';
    popover.style.top = `${Math.round(top)}px`;
    popover.style.left = `${Math.round(left)}px`;
  }

  function hidePopover() {
    popover.setAttribute('aria-hidden', 'true');
    popover.style.transform = 'scale(.96)';
    activeTarget = null;
  }

  function positionAllBubbles() {
    const cards = Array.from(document.querySelectorAll('.card'));
    cards.forEach(card => {
      const bar = card.querySelector('.bar');
      const leftSeg = card.querySelector('.bar-inner .bar-yellow.left');
      const greenSeg = card.querySelector('.bar-inner .bar-green');
      const rightSeg = card.querySelector('.bar-inner .bar-yellow.right');
      const bubble = card.querySelector('.value-bubble');

      if (!bar || !bubble || !leftSeg || !greenSeg || !rightSeg) return;

      const min = parseFloat(card.dataset.min);
      const max = parseFloat(card.dataset.max);
      const rawValue = parseFloat(bubble.dataset.value);

      const barRect = bar.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      // Fallback if numbers are not usable
      if (isNaN(min) || isNaN(max) || isNaN(rawValue) || max === min) {
        leftSeg.style.width = '25%';
        greenSeg.style.width = '50%';
        rightSeg.style.width = '25%';

        const bubbleHeight = bubble.offsetHeight || 26;
        const arrowHeight = 8;
        const gap = 2;
        const xFallback = (barRect.left - cardRect.left) + (barRect.width / 2);
        const topFallback = (barRect.top - cardRect.top) - bubbleHeight - arrowHeight + gap;

        bubble.style.position = 'absolute';
        bubble.style.left = `${Math.round(xFallback)}px`;
        bubble.style.top = `${Math.round(topFallback)}px`;
        return;
      }

      // Normal range width
      const normalWidth = max - min;

      // Extend bar to cover out-of-range values:
      // full span = [min - 1.5*(max-min), max + 1.5*(max-min)]
      const extension = normalWidth * 1.5;
      const spanStart = min - extension;
      const spanEnd = max + extension;
      const totalSpan = spanEnd - spanStart;

      // Fractions where the normal range begins/ends within the full span
      const minFrac = (min - spanStart) / totalSpan;
      const maxFrac = (max - spanStart) / totalSpan;

      const leftPct  = minFrac * 100;
      const greenPct = (maxFrac - minFrac) * 100;
      const rightPct = 100 - leftPct - greenPct;

      // Apply segment widths (left yellow, green, right yellow)
      leftSeg.style.width = `${leftPct}%`;
      greenSeg.style.width = `${greenPct}%`;
      rightSeg.style.width = `${rightPct}%`;

      // Position the normal range labels under the edges of the green segment
      const labelsContainer = card.querySelector('.range-labels');
      if (labelsContainer) {
        const labelSpans = labelsContainer.querySelectorAll('span');
        if (labelSpans.length >= 2) {
          const labelsRect = labelsContainer.getBoundingClientRect();
          const offsetCardToLabelsLeft = labelsRect.left - cardRect.left;
          const availableWidth = barRect.width;

          const minX = (barRect.left - cardRect.left) + minFrac * availableWidth - offsetCardToLabelsLeft;
          const maxX = (barRect.left - cardRect.left) + maxFrac * availableWidth - offsetCardToLabelsLeft;

          labelSpans[0].style.position = 'absolute';
          labelSpans[0].style.left = `${Math.round(minX)}px`;

          labelSpans[1].style.position = 'absolute';
          labelSpans[1].style.left = `${Math.round(maxX)}px`;
        }
      }

      // Compute bubble position: map rawValue onto spanStart..spanEnd and clamp
      const clamped = Math.max(spanStart, Math.min(spanEnd, rawValue));
      const frac = (clamped - spanStart) / totalSpan;
      const availableWidthForBubble = barRect.width;
      const x = (barRect.left - cardRect.left) + frac * availableWidthForBubble;

      // Place bubble just ABOVE the bar, pointer aimed at bar
      const bubbleHeight = bubble.offsetHeight || 26;
      const arrowHeight = 8;
      const gap = 2;
      const top = (barRect.top - cardRect.top) - bubbleHeight - arrowHeight + gap;

      bubble.style.position = 'absolute';
      bubble.style.left = `${Math.round(x)}px`;
      bubble.style.top = `${Math.round(top)}px`;
    });
  }

  function initInteractions() {
    // Titles
    const titles = Array.from(document.querySelectorAll('.card-title'));
    titles.forEach(title => {
      title.addEventListener('mouseenter', () => showGlossaryFor(title));
      title.addEventListener('mouseleave', () => setTimeout(() => { if (!popover.matches(':hover')) hidePopover(); }, 120));
      title.addEventListener('focus', () => showGlossaryFor(title));
      title.addEventListener('blur', () => hidePopover());
      title.addEventListener('click', (ev) => {
        ev.preventDefault();
        const isOpen = popover.getAttribute('aria-hidden') === 'false' && activeTarget === title;
        if (isOpen) {
          hidePopover();
        } else {
          showGlossaryFor(title);
        }
      });
    });

    // Value bubbles
    const bubbles = Array.from(document.querySelectorAll('.value-bubble.interactive'));
    bubbles.forEach(bubble => {
      bubble.addEventListener('mouseenter', () => showGlossaryFor(bubble));
      bubble.addEventListener('mouseleave', () => setTimeout(() => { if (!popover.matches(':hover')) hidePopover(); }, 120));
      bubble.addEventListener('focus', () => showGlossaryFor(bubble));
      bubble.addEventListener('blur', () => hidePopover());
      bubble.addEventListener('click', (ev) => {
        ev.preventDefault();
        const isOpen = popover.getAttribute('aria-hidden') === 'false' && activeTarget === bubble;
        if (isOpen) {
          hidePopover();
        } else {
          showGlossaryFor(bubble);
        }
      });
    });

    // Hide popover when clicking outside
    document.addEventListener('click', (ev) => {
      if (!activeTarget) return;
      if (activeTarget.contains(ev.target) || popover.contains(ev.target)) return;
      hidePopover();
    });

    // Esc key closes
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') hidePopover();
    });
  }

  function init() {
    initInteractions();
    positionAllBubbles();
    // reposition on resize/scroll
    window.addEventListener('resize', positionAllBubbles);
    window.addEventListener('scroll', positionAllBubbles, true);
    // ensure correct after fonts/images
    setTimeout(positionAllBubbles, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
