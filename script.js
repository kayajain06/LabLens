// script.js - position value bubbles along the bar and attach accessible popovers
// Updated so the green (normal) segment spans exactly from data-min to data-max
// and yellow segments extend on both sides. Bubbles are centered over the bar
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
      ${entry.action ? `<p class="action">${escapeHtml(entry.action)}</p>` : ''}
    `;
    openPopoverFor(target);
  }

  function showValueStatusFor(target) {
    const bubbleKey = target.dataset.bubbleTerm;
    const entry = window.GLOSSARY && window.GLOSSARY[bubbleKey];
    if (!entry) return;
    const state = target.dataset.valueState || 'normal';
    const text = state === 'normal' ? (entry.text_normal || '') : (entry.text_warning || entry.text_normal || '');
    popover.innerHTML = `
      <h4>${escapeHtml(entry.title)}</h4>
      <p>${escapeHtml(text)}</p>
    `;
    openPopoverFor(target);
  }

  function openPopoverFor(target) {
    popover.setAttribute('aria-hidden', 'false');
    positionPopoverNextTo(target);
    activeTarget = target;
    target.setAttribute('aria-describedby', 'popover');
  }

  function hidePopover() {
    popover.setAttribute('aria-hidden', 'true');
    if (activeTarget) activeTarget.removeAttribute('aria-describedby');
    activeTarget = null;
  }

  function positionPopoverNextTo(target) {
    const rect = target.getBoundingClientRect();
    popover.style.left = '0px';
    popover.style.top = '0px';
    const popRect = popover.getBoundingClientRect();
    const spacing = 8;
    let top = rect.bottom + spacing;
    let left = rect.left + (rect.width / 2) - (popRect.width / 2);

    if (left + popRect.width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popRect.width - 12);
    }
    if (left < 12) left = 12;
    if (top + popRect.height > window.innerHeight - 12) {
      top = rect.top - popRect.height - spacing;
    }
    if (top < 12) top = 12;

    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
  }

  // Core: position bars and bubbles
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

      // If invalid numbers, fallback to equal thirds
      if (isNaN(min) || isNaN(max) || isNaN(rawValue) || max === min) {
        leftSeg.style.width = '25%';
        greenSeg.style.width = '50%';
        rightSeg.style.width = '25%';
        // place bubble at left quarter as fallback
        bubble.style.position = 'absolute';
        bubble.style.left = `25%`;
        bubble.style.top = `${Math.round((bar.getBoundingClientRect().top - card.getBoundingClientRect().top) - (bubble.offsetHeight || 26) / 2)}px`;
        return;
      }

      // Decide extension on both sides (choose half the normal width so green occupies ~50% by default)
      const normalWidth = max - min;
      const extension = Math.max(normalWidth * 0.5, normalWidth * 0.25); // at least 25% but ideally 50%
      const spanStart = min - extension;    // left-most value shown on the bar
      const spanEnd = max + extension;      // right-most value shown on the bar
      const totalSpan = spanEnd - spanStart;

      const barRect = bar.getBoundingClientRect();

      // Compute percentages for the three segments (left yellow, green, right yellow)
      const leftPct = ((min - spanStart) / totalSpan) * 100;
      const greenPct = ((max - min) / totalSpan) * 100;
      const rightPct = ((spanEnd - max) / totalSpan) * 100;

      // Apply segment widths
      leftSeg.style.width = `${leftPct}%`;
      greenSeg.style.width = `${greenPct}%`;
      rightSeg.style.width = `${rightPct}%`;

      // Compute bubble position: map rawValue onto spanStart..spanEnd
      const clamped = Math.max(spanStart, Math.min(spanEnd, rawValue));
      const frac = (clamped - spanStart) / totalSpan;
      const availableWidth = barRect.width;
      const cardRect = card.getBoundingClientRect();

      const x = (barRect.left - cardRect.left) + frac * availableWidth;

      // vertically center bubble on the bar (so it overlaps)
      const bubbleHeight = bubble.offsetHeight || 26;
      const barCenterRelativeToCard = (barRect.top - cardRect.top) + (barRect.height / 2);
      const top = Math.round(barCenterRelativeToCard - (bubbleHeight / 2));

      bubble.style.position = 'absolute';
      bubble.style.left = `${Math.round(x)}px`;
      bubble.style.top = `${top}px`;
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
        if (isOpen) hidePopover(); else showGlossaryFor(title);
      });
      title.setAttribute('role', 'button');
    });

    // Bubbles
    const bubbles = Array.from(document.querySelectorAll('.value-bubble.interactive'));
    bubbles.forEach(bubble => {
      bubble.addEventListener('mouseenter', () => showValueStatusFor(bubble));
      bubble.addEventListener('mouseleave', () => setTimeout(() => { if (!popover.matches(':hover')) hidePopover(); }, 120));
      bubble.addEventListener('focus', () => showValueStatusFor(bubble));
      bubble.addEventListener('blur', () => hidePopover());
      bubble.addEventListener('click', (ev) => {
        ev.preventDefault();
        const isOpen = popover.getAttribute('aria-hidden') === 'false' && activeTarget === bubble;
        if (isOpen) hidePopover(); else showValueStatusFor(bubble);
      });
      bubble.setAttribute('role', 'button');
    });

    // clicking outside closes
    document.addEventListener('click', (ev) => {
      if (popover.getAttribute('aria-hidden') === 'false') {
        const path = ev.composedPath ? ev.composedPath() : (ev.path || []);
        if (!path.includes(popover) && !path.includes(activeTarget)) {
          hidePopover();
        }
      }
    });

    popover.addEventListener('mouseleave', () => {
      setTimeout(() => { if (!activeTarget || !activeTarget.matches(':hover')) hidePopover(); }, 120);
    });

    // keyboard support
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        hidePopover();
        if (activeTarget) activeTarget.blur();
      }
      if ((ev.key === 'Enter' || ev.key === ' ') && document.activeElement) {
        const el = document.activeElement;
        if (el.classList && (el.classList.contains('card-title') || el.classList.contains('interactive'))) {
          ev.preventDefault();
          const isOpen = popover.getAttribute('aria-hidden') === 'false' && activeTarget === el;
          if (isOpen) hidePopover();
          else {
            if (el.classList.contains('card-title')) showGlossaryFor(el);
            else showValueStatusFor(el);
          }
        }
      }
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
