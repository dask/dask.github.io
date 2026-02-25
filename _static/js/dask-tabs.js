document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.tabs').forEach(function (tabContainer) {
    var links = tabContainer.querySelectorAll('.tab-link[data-tab]');
    var panes = tabContainer.querySelectorAll('.tab-pane[data-tab]');

    if (!links.length) return; // Skip tab groups without data-tab

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        activateTab(links, panes, link.getAttribute('data-tab'));
      });
    });
  });

  // Deep-link: activate tab from URL query param
  var params = new URLSearchParams(window.location.search);
  var tabParam = params.get('tab');
  if (tabParam) {
    var targetLink = document.querySelector('.tab-link[data-tab="' + tabParam + '"]');
    if (targetLink) {
      targetLink.click();
    }
  }
});

function activateTab(links, panes, target) {
  links.forEach(function (l) {
    l.classList.remove('is-active');
  });
  panes.forEach(function (p) {
    p.classList.remove('is-tab-active');
  });

  links.forEach(function (l) {
    if (l.getAttribute('data-tab') === target) {
      l.classList.add('is-active');
    }
  });
  panes.forEach(function (p) {
    if (p.getAttribute('data-tab') === target) {
      p.classList.add('is-tab-active');
    }
  });
}
