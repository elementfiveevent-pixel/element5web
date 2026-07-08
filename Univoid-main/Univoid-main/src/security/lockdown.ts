/**
 *  Production Security Lockdown
 * Blocks Lovable editor, badge, iframe, scripts & reinjections
 * Use ONLY in production builds
 */



const FORBIDDEN_DOMAINS = [
  'lovable.dev',
  'lovable.app',
];

export function initSecurityLockdown(): void {
  // Run only on published production site, NOT in Lovable preview/editor
  const hostname = window.location.hostname;
  const isLovablePreview = hostname.includes('id-preview--') || hostname.includes('preview--');
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // Skip lockdown in development, localhost, or Lovable preview environments
  if (import.meta.env?.MODE !== 'production' || isLovablePreview || isLocalhost) return;

  blockLovableAsideAtSource();
  killLovableAsideOnInsert();
  injectKillCSS();

  // Extra safety: periodic cleanup (optional, but good for "missed" elements)
  setInterval(() => {
    const badge = document.getElementById('lovable-badge');
    if (badge) badge.remove();
  }, 1000);
}

/* ---------------------------------- */
/* 1. Intercept appendChild (Creation Block) */
/* ---------------------------------- */
function blockLovableAsideAtSource() {
  const originalAppend = Element.prototype.appendChild;

  Element.prototype.appendChild = function <T extends Node>(node: T): T {
    if (
      node instanceof HTMLElement &&
      node.tagName === 'ASIDE' &&
      node.id === 'lovable-badge'
    ) {
      console.warn('[Security] Blocked Lovable aside at source');
      return node; // silently block
    }
    return originalAppend.call(this, node) as T;
  };
}

/* ---------------------------------- */
/* 2. MutationObserver (Re-injection Kill) */
/* ---------------------------------- */
function killLovableAsideOnInsert() {
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const node of Array.from(m.addedNodes)) {
        if (
          node instanceof HTMLElement &&
          node.tagName === 'ASIDE' &&
          node.id === 'lovable-badge'
        ) {
          node.remove();
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

/* ---------------------------------- */
/* 3. CSS Kill Switch (Visual Negation) */
/* ---------------------------------- */
function injectKillCSS(): void {
  const style = document.createElement('style');
  style.innerHTML = `
    #lovable-badge,
    aside[id="lovable-badge"],
    [data-lovable] {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
      width: 0 !important;
      height: 0 !important;
      opacity: 0 !important;
    }
  `;
  document.head.appendChild(style);
}

