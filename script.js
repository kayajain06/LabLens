// script.js - position value bubbles along the bar and attach accessible popovers
// Requires window.GLOSSARY from glossary.js

(function () {
  const popover = document.getElementById('popover');
  let activeTarget = null;

  // Escape helper
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Show glossary popover for titles
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

  // Show status popover for value bubble
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

  // Position popover near the target (simple centered-below placement with collision checks)
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

  // Position every bubble along its card's bar according to data-min/data-max and the numeric value
  function positionAllBubbles() {
    const cards = Array.from(document.querySelectorAll('.card'));
    cards.forEach(card => {
      const bar = card.querySelector('.bar');
      const bubble = card.querySelector('.value-bubble');
      if (!bar || !bubble) return;

      const min = parseFloat(card.dataset.min);
      const max = parseFloat(card.dataset.max);
      const rawValue = parseFloat(bubble.dataset.value);

      const barRect = bar.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      // fallback placement if numbers invalid
      if (isNaN(min) || isNaN(max) || isNaN(rawValue) || max === min) {
        const xDefault = barRect.left - cardRect.left + 6;
        bubble.style.left = `${Math.round(xDefault)}px`;
        bubble.style.top = `${Math.round(barRect.top - cardRect.top - ((bubble.offsetHeight || 26) / 2) - 6)}px`;`;
        bubble.style.position = 'absolute';
        return;
      }

      // clamp slightly beyond edges so extreme values still show near ends
      const margin = (max - min) * 0.02; // 2% margin
      const clamped = Math.max(min - margin, Math.min(max + margin, rawValue));

      // fraction across the bar
      let frac = (clamped - min) / (max - min);
      frac = Math.max(0, Math.min(1, frac));

      const availableWidth = barRect.width;
      // x relative to card left
      const x = (barRect.left - cardRect.left) + frac * availableWidth;

      // compute top so the bubble vertically overlaps the bar (centered on the bar)
      const bubbleHeight = bubble.offsetHeight || 26;
      const barCenterRelativeToCard = (barRect.top - cardRect.top) + (barRect.height / 2);
      const top = Math.round(barCenterRelativeToCard - (bubbleHeight / 2));

      bubble.style.left = `${Math.round(x)}px`;
      bubble.style.top = `${top}px`;
      bubble.style.position = 'absolute';
    });
  }

  // Attach interactions to titles and value bubbles
  function initInteractions() {
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

    // keyboard: Escape to close; Enter/Space toggle
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
    // position after layout
    positionAllBubbles();
    // reposition on resize/scroll
    window.addEventListener('resize', positionAllBubbles);
    window.addEventListener('scroll', positionAllBubbles, true);
    // extra safety after fonts load
    setTimeout(positionAllBubbles, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
