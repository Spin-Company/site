// Spin home: section entrances, the working camera screen, the pinned steps and the beta letter.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // Entrances: each section's parts arrive in reading order, once.
  const reveals = document.querySelectorAll('.reveal');
  const enter = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      const group = [...el.closest('section, header, footer').querySelectorAll('.reveal:not(.is-in)')];
      el.style.setProperty('--delay', `${Math.max(0, group.indexOf(el)) * 80}ms`);
      el.classList.add('is-in');
      enter.unobserve(el);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  reveals.forEach((el) => enter.observe(el));

  // The camera screen: real labels and cues from the app, a counter that ticks by itself.
  const EXERCISES = {
    squat: {
      title: 'Приседания', subtitle: 'Подход 1 из 3 · цель 12', target: 12, every: 2200,
      unit: (n) => plural(n, 'повтор', 'повтора', 'повторов'),
      cues: [
        ['Подтверждённые повторения', 'Считаем только устойчивые кадры.'],
        ['Держите колени на ширине плеч', 'Направляйте колени по линии стоп в следующем повторении'],
      ],
    },
    plank: {
      title: 'Планка', subtitle: 'Подход 1 из 2 · цель 40 с', target: 40, every: 1000,
      unit: () => 'секунд удержания',
      cues: [
        ['Подтверждённое удержание', 'Считаем только устойчивые кадры.'],
        ['Держите корпус прямо', 'Не провисайте — держите тело прямо'],
      ],
    },
    bridge: {
      title: 'Ягодичный мостик', subtitle: 'Подход 1 из 3 · цель 15', target: 15, every: 2000,
      unit: (n) => plural(n, 'повтор', 'повтора', 'повторов'),
      cues: [
        ['Подтверждённые повторения', 'Считаем только устойчивые кадры.'],
        ['Поднимите бёдра выше', 'Толкните таз вверх до прямой линии от плеч до коленей'],
      ],
    },
  };
  const ORDER = ['squat', 'plank', 'bridge'];

  const demo = document.querySelector('[data-demo]');
  if (demo) {
    const field = (name) => demo.querySelector(`[data-field="${name}"]`);
    const digits = field('value');
    const cue = field('cue');
    const buttons = document.querySelectorAll('[data-exercise]');
    let current = 'squat';
    let count = 0;
    let timer = 0;
    let rotate = true;
    let visible = true;

    const setCue = ([title, message]) => {
      if (field('cueTitle').textContent === title) return;
      field('cueTitle').textContent = title;
      field('cueMessage').textContent = message;
      cue.classList.remove('is-swap');
      void cue.offsetWidth;
      cue.classList.add('is-swap');
    };

    const show = (n) => {
      const ex = EXERCISES[current];
      field('unit').textContent = ex.unit(n);
      if (reduce.matches) { digits.textContent = n; return; }
      digits.classList.remove('is-in');
      digits.classList.add('is-out');
      setTimeout(() => {
        digits.textContent = n;
        digits.classList.remove('is-out');
        void digits.offsetWidth;
        digits.classList.add('is-in');
      }, 140);
    };

    const tick = () => {
      const ex = EXERCISES[current];
      count += 1;
      show(count);
      // A form cue appears mid-set, as it would in the app, then clears.
      const third = Math.round(ex.target / 3);
      setCue(count >= third && count < third * 2 ? ex.cues[1] : ex.cues[0]);
      if (count >= ex.target) {
        stop();
        timer = setTimeout(() => (rotate ? select(next(), false) : restart()), 2400);
        return;
      }
      timer = setTimeout(tick, ex.every);
    };

    const stop = () => clearTimeout(timer);
    const restart = () => {
      stop();
      count = 0;
      digits.textContent = '0';
      field('unit').textContent = EXERCISES[current].unit(0);
      setCue(EXERCISES[current].cues[0]);
      if (visible && !document.hidden) timer = setTimeout(tick, 900);
    };
    const next = () => ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

    const select = (key, byHand) => {
      if (byHand) rotate = false;
      current = key;
      const ex = EXERCISES[key];
      field('title').textContent = ex.title;
      field('subtitle').textContent = ex.subtitle;
      demo.querySelectorAll('[data-photo]').forEach((img) => img.classList.toggle('is-active', img.dataset.photo === key));
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.exercise === key)));
      restart();
    };

    buttons.forEach((b) => b.addEventListener('click', () => select(b.dataset.exercise, true)));

    // Pause off screen and in a hidden tab.
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) restart(); else stop();
    }).observe(demo);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : visible && restart()));
  }

  // Rest timer fragment counts down while it is on screen.
  const rest = document.querySelector('[data-rest]');
  if (rest) {
    let left = 45;
    let id = 0;
    const draw = () => (rest.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`);
    new IntersectionObserver(([entry]) => {
      clearInterval(id);
      if (!entry.isIntersecting) return;
      id = setInterval(() => { left = left > 0 ? left - 1 : 45; draw(); }, 1000);
    }).observe(rest);
  }

  // Pinned steps: the step nearest the middle of the screen sets the phone's state.
  const steps = document.querySelectorAll('.step');
  const howPhone = document.querySelector('.how-stage .phone');
  if (steps.length && howPhone) {
    const stepObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        steps.forEach((s) => s.classList.toggle('is-active', s === entry.target));
        howPhone.dataset.state = entry.target.dataset.step;
      }
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => stepObserver.observe(s));
  }

  // Beta request: open a written letter instead of posting anywhere.
  const form = document.querySelector('[data-beta]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const body = [
      name ? `Меня зовут ${name}.` : '',
      'Хочу попробовать Spin в TestFlight.',
      `Опыт тренировок: ${data.get('level')}.`,
      'Модель iPhone: ',
    ].filter(Boolean).join('\n');
    location.href = `mailto:spin.company@yandex.ru?subject=${encodeURIComponent('Хочу в бету Spin')}&body=${encodeURIComponent(body)}`;
  });

  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
})();
