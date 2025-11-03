// script.js - updated to position the value bubble along the bar according to the numeric value
// Requires GLOSSARY from glossary.js

(function () {
  const popover = document.getElementById('popover');
  let activeTarget = null;

  // Utility: escape HTML
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Show glossary for titles
  function showGlossaryFor(target) {
    const key = target.dataset.term;
    const entry = GLOSSARY[key];
    if (!entry) return;
    popover.innerHTML = `\n      <h4>${escapeHtml(entry.title)}</h4>\n      <p>${escapeHtml(entry.text)}</p>\n      ${entry.action ? `<p class="action">${escapeHtml(entry.action)}</p>` : ''}\n    `;
    popover.setAttribute('aria-hidden', 'false');
    positionPopoverNextTo(target);
    activeTarget = target;
    target.setAttribute('aria-describedby', 'popover');
  }

  // Show bubble status for value bubbles
  function showValueStatusFor(target) {
    const bubbleKey = target.dataset.bubbleTerm;
    const entry = GLOSSARY[bubbleKey];
    if (!entry) return;
    const state = target.dataset.valueState || 'normal';
    const text = state === 'normal' ? (entry.text_normal || '') : (entry.text_warning || entry.text_normal || '');
    popover.innerHTML = `\n      <h4>${escapeHtml(entry.title)}</h4>\n      <p>${escapeHtml(text)}</p>\n    `;
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

  // Position popover near the target
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

  // Place each bubble along its card's bar according to the value and min/max
  function positionAllBubbles() {
    const cards = Array.from(document.querySelectorAll('.card'));
    cards.forEach(card => {
      const bar = card.querySelector('.bar');
      const bubble = card.querySelector('.value-bubble');
      if (!bar || !bubble) return;

      const minAttr = card.dataset.min;
      const maxAttr = card.dataset.max;
      const valueAttr = bubble.dataset.value;

      const min = parseFloat(minAttr);
      const max = parseFloat(maxAttr);
      const rawValue = parseFloat(valueAttr);

      // If min/max/value are invalid, fallback to placing bubble at left
      if (isNaN(min) || isNaN(max) || isNaN(rawValue) || max === min) {
        // place bubble at start of bar (left)
        const barRect = bar.getBoundingClientRect();
        bubble.style.left = `${barRect.left + 8}px`;
        bubble.style.position = 'absolute';
        bubble.style.top = `${barRect.top - card.getBoundingClientRect().top - 22}px`;
        return;
      }

      // Clamp value between min and max, but allow values slightly outside to be clamped to ends
      const clamped = Math.max(Math.min(rawValue, max + (max - min) * 0.1), min - (max - min) * 0.1);

      // Determine percent across the bar (0..1)
      const percent = (clamped - min) / (max - min);

      // Compute pixel position relative to bar container
      const barRect = bar.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      // Inner available width (exclude 2px border)
      const availableWidth = barRect.width;

      // left position relative to card (bubble is positioned absolute inside .card)
      const x = barRect.left - cardRect.left + (percent * availableWidth);

      // Set bubble position (centered at x)
      bubble.style.left = `${Math.round(x)}px`;
      // Ensure bubble is absolutely positioned inside card
      bubble.style.position = 'absolute';
      // Set top relative to card so it sits above the bar
      const barTopRelative = barRect.top - cardRect.top;
      bubble.style.top = `${Math.round(barTopRelative - 22)}px`;
      // add transform to center horizontally (CSS already uses translateX(-50%)
    });
  }

  // Attach interactions for titles and bubbles
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
    });

    // Click outside closes popover
    document.addEventListener('click', (ev) => {
      if (popover.getAttribute('aria-hidden') === 'false') {
        const path = ev.composedPath ? ev.composedPath() : (ev.path || []);
        if (!path.includes(popover) && !path.includes(activeTarget)) {
          hidePopover();
        }
      }
    });

    // Keep popover open when hovering it
    popover.addEventListener('mouseleave', () => setTimeout(() => { if (!activeTarget || !activeTarget.matches(':hover')) hidePopover(); }, 120));

    // Keyboard support
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

  // Initialize everything
  function init() {
    initInteractions();
    // Position bubbles after layout completes
    positionAllBubbles();

    // Reposition on resize and scroll (use passive listeners)
    window.addEventListener('resize', () => positionAllBubbles());
    window.addEventListener('scroll', () => positionAllBubbles(), true);

    // Also reposition after fonts/images might load
    setTimeout(positionAllBubbles, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();