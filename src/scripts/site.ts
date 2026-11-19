import { renderContrast } from '../utils/contrast';
import { renderCode } from '../utils/code';
const menu = document.querySelector<HTMLButtonElement>('.menu-toggle')!;
const community =
  document.querySelector<HTMLButtonElement>('.community-toggle')!;
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Open menu');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
community.addEventListener('click', () =>
  community.setAttribute(
    'aria-expanded',
    String(community.getAttribute('aria-expanded') !== 'true'),
  ),
);
document.addEventListener('click', (e) => {
  if (!(e.target as Element).closest('.community'))
    community.setAttribute('aria-expanded', 'false');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMenu();
    community.setAttribute('aria-expanded', 'false');
  }
});
matchMedia('(min-width: 992px)').addEventListener('change', closeMenu);
document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((group) => {
  const tabs = [
    ...group.querySelectorAll<HTMLButtonElement>(
      ':scope > [role=tablist] > [role=tab]',
    ),
  ];
  function select(index: number) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls')!);
      if (panel) panel.hidden = i !== index;
    });
  }
  group
    .querySelectorAll<HTMLButtonElement>('[data-select-tab]')
    .forEach((button) =>
      button.addEventListener('click', () => {
        const index = Number(button.dataset.selectTab);
        if (Number.isInteger(index) && index >= 0 && index < tabs.length) {
          select(index);
          tabs[index].focus({ preventScroll: true });
        }
      }),
    );
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', (e) => {
      let next = index;
      if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (e.key === 'ArrowLeft')
        next = (index - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else return;
      e.preventDefault();
      select(next);
      tabs[next].focus();
    });
  });
});
const dialog = document.querySelector<HTMLDialogElement>('#submission-dialog')!;
function selectForm(type: string) {
  document
    .querySelectorAll<HTMLElement>('.dialog-tabs [data-form]')
    .forEach((t) =>
      t.setAttribute('aria-selected', String(t.dataset.form === type)),
    );
  document.querySelector('#dialog-heading')!.textContent =
    type === 'press'
      ? 'Submit News Feature'
      : type === 'newsletter'
        ? 'Sign up for Newsletter'
        : 'Submit New Event';
  for (const kind of ['event', 'press', 'newsletter']) {
    const section = dialog.querySelector<HTMLElement>(`.${kind}-fields`)!;
    section.hidden = type !== kind;
    section
      .querySelectorAll<HTMLInputElement>('input,textarea')
      .forEach((i) => (i.disabled = type !== kind));
  }
  dialog.querySelector('.form-status')!.textContent = '';
}
document.querySelectorAll<HTMLElement>('[data-dialog]').forEach((b) =>
  b.addEventListener('click', () => {
    selectForm(b.dataset.dialog!);
    closeMenu();
    dialog.showModal();
  }),
);
dialog
  .querySelectorAll<HTMLElement>('[data-form]')
  .forEach((t) =>
    t.addEventListener('click', () => selectForm(t.dataset.form!)),
  );
dialog
  .querySelector('.dialog-close')!
  .addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  }
});
dialog.querySelector('form')!.addEventListener('submit', (e) => {
  e.preventDefault();
  dialog.querySelector('.form-status')!.textContent =
    'Not sent: this local preview has no submission backend.';
});
const palette = document.querySelector<HTMLElement>('.palette-section');
function luminance(hex: string) {
  const c = hex
    .match(/[a-f\d]{2}/gi)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
if (palette) {
  const buttons = [
    ...palette.querySelectorAll<HTMLButtonElement>('[data-color]'),
  ];
  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      const hex = b.dataset.color!,
        lum = luminance(hex);
      palette.style.backgroundColor = hex;
      palette.style.setProperty('--palette-paper', hex);
      palette.style.color = lum > 0.179 ? '#080815' : '#FFFFFF';
      palette.querySelector('.color-name')!.textContent = b.dataset.name!;
      palette.querySelector('.color-hex')!.textContent = hex;
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const entries = buttons
        .map((x) => {
          const l = luminance(x.dataset.color!),
            ratio = (Math.max(l, lum) + 0.05) / (Math.min(l, lum) + 0.05);
          return ratio >= 3
            ? { hex: x.dataset.color!, rating: ratio >= 4.5 ? 'AA' : 'AA18' }
            : null;
        })
        .filter(
          (entry): entry is { hex: string; rating: string } => entry !== null,
        );
      renderContrast(palette.querySelector('.accessible-colors')!, entries);
      palette.querySelector('.copy-color')!.textContent = 'Copy Hex Code';
    }),
  );
  palette.querySelector('.copy-color')!.addEventListener('click', async (e) => {
    try {
      await navigator.clipboard.writeText(
        palette.querySelector('.color-hex')!.textContent!,
      );
      (e.target as HTMLElement).textContent = 'Copied!';
    } catch {
      (e.target as HTMLElement).textContent = 'Select hex code to copy';
    }
  });
}
document.querySelectorAll<HTMLButtonElement>('[data-logo-color]').forEach((b) =>
  b.addEventListener('click', () => {
    const showcase = document.querySelector<HTMLElement>('.logo-showcase')!;
    const section = showcase.closest<HTMLElement>('.brand-logos')!;
    section.style.backgroundColor = b.dataset.logoColor!;
    section.style.setProperty('--logo-paper', b.dataset.logoColor!);
    section.style.color =
      b.dataset.variant === 'primary' ? '#080815' : '#FFFFFF';
    showcase.style.backgroundColor = 'transparent';
    showcase
      .querySelectorAll<HTMLImageElement>('img')
      .forEach((i) => (i.src = i.dataset[b.dataset.variant!]!));
    document
      .querySelectorAll('[data-logo-color]')
      .forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  }),
);

// Keyboard parity for the logo swatches and submission tabs.
for (const selector of ['[data-logo-color]', '.dialog-tabs [role=tab]']) {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>(selector)];
  buttons.forEach((b, i) =>
    b.addEventListener('keydown', (e) => {
      const next =
        e.key === 'ArrowRight'
          ? (i + 1) % buttons.length
          : e.key === 'ArrowLeft'
            ? (i + buttons.length - 1) % buttons.length
            : e.key === 'Home'
              ? 0
              : e.key === 'End'
                ? buttons.length - 1
                : -1;
      if (next < 0) return;
      e.preventDefault();
      buttons[next].click();
      buttons[next].focus();
    }),
  );
}
// Small native illustrations replace the original animation runtime. No third-party JS.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
if (!reduceMotion.matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const root = entry.target as HTMLElement;
        observer.unobserve(root);
        const frames = JSON.parse(root.dataset.loopCodes!) as string[];
        const code = root.querySelector('code')!;
        const humanRow = root.closest<HTMLElement>('.performance-row.humans');
        let index = humanRow ? frames.length - 1 : 0;
        // The source phone row grows from the rendered monospace line's intrinsic
        // width, not from a timed width animation or a list of viewport constants.
        const resizeHumanRow = () => {
          if (!humanRow) return;
          if (
            reduceMotion.matches ||
            !matchMedia('(max-width:479px)').matches
          ) {
            delete humanRow.dataset.intrinsic;
            humanRow.style.removeProperty('--human-row-width');
            return;
          }
          const section = humanRow.closest<HTMLElement>('.performance')!;
          const sheet = humanRow.querySelector<HTMLElement>('.human-code')!;
          const body = root.querySelector<HTMLElement>('.terminal-body')!;
          const sideInsets = (e: Element) => {
            const s = getComputedStyle(e);
            return (
              parseFloat(s.paddingLeft) +
              parseFloat(s.paddingRight) +
              parseFloat(s.borderLeftWidth) +
              parseFloat(s.borderRightWidth)
            );
          };
          const frame = document.createRange();
          frame.selectNodeContents(code);
          const sectionStyle = getComputedStyle(section);
          const available =
            section.clientWidth -
            parseFloat(sectionStyle.paddingLeft) -
            parseFloat(sectionStyle.paddingRight);
          const intrinsic =
            frame.getBoundingClientRect().width +
            sideInsets(sheet) +
            sideInsets(root) +
            sideInsets(body);
          humanRow.dataset.intrinsic = '';
          humanRow.style.setProperty(
            '--human-row-width',
            `${Math.max(available, intrinsic)}px`,
          );
        };
        if (humanRow) {
          addEventListener('resize', resizeHumanRow);
          reduceMotion.addEventListener('change', resizeHumanRow);
        }
        const cycle = () => {
          if (!root.isConnected || reduceMotion.matches) return;
          index = (index + 1) % frames.length;
          const next = frames[index];
          let cursor = 0;
          renderCode(code, '');
          const type = () => {
            if (!root.isConnected || reduceMotion.matches) return;
            renderCode(code, next.slice(0, ++cursor));
            resizeHumanRow();
            root.dataset.typing = cursor < next.length ? 'typing' : 'complete';
            root.dataset.frame = String(index);
            if (cursor < next.length) setTimeout(type, 24);
            else setTimeout(cycle, 4000);
          };
          type();
        };
        setTimeout(cycle, humanRow ? 0 : 4000);
      }
    },
    { threshold: 0.3 },
  );
  document
    .querySelectorAll<HTMLElement>('[data-loop-codes]')
    .forEach((e) => observer.observe(e));
}

// Persistent brand navigation follows the viewport reading midpoint.
const brandLinks = [
  ...document.querySelectorAll<HTMLAnchorElement>('.brand-sidebar a'),
];
if (brandLinks.length) {
  let pending = false;
  const updateBrandSection = () => {
    // Follow the section intersecting the viewport's reading midpoint. A marker
    // clears beyond the final section; the rail itself remains independently usable.
    const midpoint = innerHeight / 2;
    let active: HTMLAnchorElement | undefined;
    for (const link of brandLinks) {
      const rect = document.querySelector(link.hash)!.getBoundingClientRect();
      if (rect.top <= midpoint && rect.bottom >= midpoint) active = link;
    }
    for (const link of brandLinks) {
      if (link === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    pending = false;
  };
  const observe = new IntersectionObserver(updateBrandSection, {
    threshold: [0, 0.1, 0.5, 1],
  });
  brandLinks.forEach((link) =>
    observe.observe(document.querySelector(link.hash)!),
  );
  addEventListener(
    'scroll',
    () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(updateBrandSection);
      }
    },
    { passive: true },
  );
  addEventListener('resize', updateBrandSection);
  updateBrandSection();
}
// Locally drawn dashboard, resource gauges and rolling counters: no animation runtime.
const illustrations = document.querySelectorAll<HTMLElement>(
  '[data-illustration]',
);
const artObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const root = entry.target as HTMLElement;
      root.classList.toggle(
        'is-playing',
        entry.isIntersecting && !reduceMotion.matches,
      );
      if (root.dataset.illustration === 'gauges') {
        const svg = root.querySelector('svg')!;
        if (entry.isIntersecting && !reduceMotion.matches) {
          if (!root.dataset.gaugesStarted) {
            root
              .querySelectorAll<SVGAnimateTransformElement>('animateTransform')
              .forEach((animation) => animation.beginElement());
            root.dataset.gaugesStarted = 'true';
          }
          svg.unpauseAnimations();
        } else svg.pauseAnimations();
      }
      if (!entry.isIntersecting) root.dataset.started = '';
      if (
        root.dataset.illustration !== 'counter' ||
        !entry.isIntersecting ||
        reduceMotion.matches ||
        root.dataset.started
      )
        continue;
      root.dataset.started = 'true';
      const start = performance.now();
      const tick = (now: number) => {
        if (
          !root.isConnected ||
          reduceMotion.matches ||
          !root.classList.contains('is-playing')
        )
          return;
        const phase = ((now - start) % 12000) / 12000;
        const progress = Math.min(1, phase * 1.6);
        const rows = Math.round(progress * 1e11);
        root.querySelector('#rows-value')!.textContent = String(rows)
          .padStart(12, '0')
          .split('')
          .join(' ');
        root.querySelector('#cost-value')!.textContent = (
          progress * 1.07
        ).toFixed(2);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  },
  { threshold: 0.1 },
);
illustrations.forEach((art) => artObserver.observe(art));

reduceMotion.addEventListener('change', () => {
  for (const art of illustrations) {
    if (reduceMotion.matches) {
      art.classList.remove('is-playing');
      art.querySelector('svg')?.pauseAnimations();
      art.dataset.started = '';
    } else {
      artObserver.unobserve(art);
      artObserver.observe(art);
    }
  }
});
