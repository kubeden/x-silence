// X Silence - Content Script
// Transforms X/Twitter into a write-only experience

(function() {
  'use strict';

  // Track current page type
  let currentPageType = null;
  let lastUrl = location.href;

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
    // Check if it's a user profile
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
  }

  // Check for URL changes (lightweight)
  function checkUrlChange() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      updatePageClasses();
    }
  }

  // Initialize
  function init() {
    // Set up body class immediately
    if (document.body) {
      updatePageClasses();
    }

    // Listen for URL changes via popstate
    window.addEventListener('popstate', updatePageClasses);

    // Intercept pushState/replaceState for SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
      originalPushState.apply(this, arguments);
      updatePageClasses();
    };

    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      updatePageClasses();
    };

    // Fallback: periodic URL check (every 500ms) for edge cases
    setInterval(checkUrlChange, 500);
  }

  // Wait for body to exist
  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
