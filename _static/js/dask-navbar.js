document.addEventListener('DOMContentLoaded', function () {
  // --- Mobile hamburger menu toggle ---
  var navButton = document.querySelector('.menu-button');
  var navMenu = document.querySelector('.nav-menu');

  if (navButton && navMenu) {
    navButton.addEventListener('click', function () {
      var isOpen = navMenu.hasAttribute('data-nav-menu-open');
      if (isOpen) {
        closeMenu();
      } else {
        navMenu.setAttribute('data-nav-menu-open', '');
        navButton.classList.add('is-open');
        navButton.setAttribute('aria-expanded', 'true');
      }
    });
  }

  function closeMenu() {
    if (!navMenu) return;
    navMenu.removeAttribute('data-nav-menu-open');
    navButton.classList.remove('is-open');
    navButton.setAttribute('aria-expanded', 'false');
  }

  // --- Desktop Community dropdown toggle ---
  var dropdownToggles = document.querySelectorAll('.dropdown-toggle');

  dropdownToggles.forEach(function (toggle) {
    var list = toggle.parentElement.querySelector('.dropdown-list');
    if (!list) return;

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      var isOpen = list.classList.contains('is-open');
      closeAllDropdowns();
      if (!isOpen) {
        list.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });

  function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-list.is-open').forEach(function (list) {
      list.classList.remove('is-open');
    });
    dropdownToggles.forEach(function (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  // --- Close on outside click ---
  document.addEventListener('click', function (e) {
    if (navMenu && navMenu.hasAttribute('data-nav-menu-open')) {
      if (!navMenu.contains(e.target) && !navButton.contains(e.target)) {
        closeMenu();
      }
    }

    var openDropdown = document.querySelector('.dropdown-list.is-open');
    if (openDropdown) {
      var dropdown = openDropdown.closest('.dropdown');
      if (dropdown && !dropdown.contains(e.target)) {
        closeAllDropdowns();
      }
    }
  });

  // --- Close on Escape key ---
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeMenu();
      closeAllDropdowns();
    }
  });
});
