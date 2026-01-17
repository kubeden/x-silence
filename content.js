// X Silence - Content Script
// Transforms X/Twitter into a write-only experience

(function() {
  'use strict';

  // Track current page type
  let currentPageType = null;

  // Page type detection based on URL
  function getPageType() {
    const path = window.location.pathname;

    if (path === '/' || path === '/home') {
      return 'home';
    }
    if (path === '/notifications' || path.startsWith('/notifications/')) {
      return 'notifications';
    }
    if (path === '/messages' || path.startsWith('/messages/')) {
      return 'messages';
    }
    if (path === '/explore' || path.startsWith('/explore/') || path === '/search' || path.startsWith('/search/')) {
      return 'explore';
    }
    if (path.startsWith('/i/')) {
      return 'internal';
    }
    // Check if it's a user profile (starts with @ pattern - single path segment)
    const pathParts = path.split('/').filter(p => p);
    if (pathParts.length >= 1 && !['home', 'notifications', 'messages', 'explore', 'search', 'compose', 'settings', 'i'].includes(pathParts[0])) {
      return 'profile';
    }

    return 'other';
  }

  // Update body classes based on page type
  function updatePageClasses() {
    const pageType = getPageType();

    if (pageType === currentPageType) return;
    currentPageType = pageType;

    // Remove all x-silence page classes
    document.body.classList.remove(
      'x-silence-home',
      'x-silence-notifications',
      'x-silence-messages',
      'x-silence-explore',
      'x-silence-profile'
    );

    // Add current page class
    if (pageType !== 'other' && pageType !== 'internal') {
      document.body.classList.add(`x-silence-${pageType}`);
    }

    // Add placeholder message for hidden pages
    updatePlaceholder(pageType);
  }

  // Add or remove placeholder message
  function updatePlaceholder(pageType) {
    const existingPlaceholder = document.querySelector('.x-silence-placeholder');
    if (existingPlaceholder) {
      existingPlaceholder.remove();
    }

    // Only show placeholder on hidden pages
    if (['home', 'notifications', 'messages', 'explore'].includes(pageType)) {
      // Wait for primary column to exist
      setTimeout(() => {
        const primaryColumn = document.querySelector('[data-testid="primaryColumn"]');
        if (primaryColumn && !document.querySelector('.x-silence-placeholder')) {
          const placeholder = document.createElement('div');
          placeholder.className = 'x-silence-placeholder';

          let message = '';
          switch(pageType) {
            case 'home':
              message = '<h2>Silence Mode Active</h2><p>Timeline hidden. Use the compose box above to post.</p>';
              break;
            case 'notifications':
              message = '<h2>Notifications Hidden</h2><p>Stay focused. Your notifications are still there, just hidden.</p>';
              break;
            case 'messages':
              message = '<h2>Messages Hidden</h2><p>Direct messages are hidden to reduce distractions.</p>';
              break;
            case 'explore':
              message = '<h2>Explore Hidden</h2><p>Trending topics and explore content are hidden.</p>';
              break;
          }

          placeholder.innerHTML = `<div class="x-silence-placeholder-inner">${message}</div>`;

          // Insert after the header area
          const timeline = primaryColumn.querySelector('[data-testid="primaryColumn"] > div > div');
          if (timeline) {
            timeline.appendChild(placeholder);
          }
        }
      }, 500);
    }
  }

  // Remove notification badges
  function removeNotificationBadges() {
    // Remove numeric badges
    const badges = document.querySelectorAll('[aria-label*="unread items"]');
    badges.forEach(badge => {
      badge.style.display = 'none';
    });
  }

  // Hide engagement metrics that CSS might miss
  function hideMetrics() {
    // Additional metric hiding via JS for dynamic content
    const viewCountLinks = document.querySelectorAll('a[href$="/analytics"]');
    viewCountLinks.forEach(link => {
      link.style.display = 'none';
    });
  }

  // Main observer for dynamic content
  const observer = new MutationObserver((mutations) => {
    // Check if URL changed (SPA navigation)
    updatePageClasses();

    // Handle dynamic content
    removeNotificationBadges();
    hideMetrics();
  });

  // Initialize
  function init() {
    // Set up body class immediately
    if (document.body) {
      updatePageClasses();
    }

    // Start observing
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    // Also listen for URL changes via popstate
    window.addEventListener('popstate', updatePageClasses);

    // Intercept pushState/replaceState for SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
      originalPushState.apply(this, arguments);
      setTimeout(updatePageClasses, 0);
    };

    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      setTimeout(updatePageClasses, 0);
    };
  }

  // Wait for body to exist
  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
