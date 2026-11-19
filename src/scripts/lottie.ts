// The SVG light build deliberately excludes expressions/eval. Only local JSON
// fetched from an HTML data attribute is loaded (including RTD's mount prefix).
const motion = matchMedia('(prefers-reduced-motion: reduce)');
for (const root of document.querySelectorAll<HTMLElement>('[data-lottie]')) {
  const container = root.querySelector<HTMLElement>('[data-lottie-player]')!;
  let animation: import('lottie-web').AnimationItem | undefined;
  let visible = false;
  let loading = false;
  const sync = async () => {
    if (!visible || document.hidden || motion.matches) {
      animation?.pause();
      if (motion.matches) root.classList.remove('lottie-ready');
      return;
    }
    if (animation) {
      root.classList.add('lottie-ready');
      animation.play();
      return;
    }
    if (loading) return;
    loading = true;
    try {
      const [{ default: lottie }, response] = await Promise.all([
        import('lottie-web/build/player/lottie_light'),
        fetch(container.dataset.src!),
      ]);
      if (!response.ok) throw new Error('Animation download failed');
      animation = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        animationData: await response.json(),
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
      });
      animation.addEventListener('enterFrame', () => {
        root.dataset.frame = String(animation!.currentFrame);
      });
      animation.addEventListener('DOMLoaded', () => {
        root.dataset.loaded = 'true';
        void sync();
      });
    } catch (error) {
      // Keep the accessible local poster if loading/rendering is unavailable.
      console.warn('Local animation unavailable', error);
      loading = false;
    }
  };
  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      void sync();
    },
    { threshold: 0.1 },
  );
  observer.observe(root);
  motion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  addEventListener(
    'pagehide',
    () => {
      observer.disconnect();
      animation?.destroy();
      motion.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    },
    { once: true },
  );
}
