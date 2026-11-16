(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* ---------- Menu mobile ---------- */
  const navBtn = $('#nav-toggle');
  const nav = $('#nav');
  function setNav(open) {
    nav.classList.toggle('open', open);
    navBtn.setAttribute('aria-expanded', String(open));
    navBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  navBtn.addEventListener('click', () => setNav(!nav.classList.contains('open')));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setNav(false)));

  /* ---------- Timecode do hero (estilo VHS) ---------- */
  const tc = $('#timecode');
  const startTime = Date.now();
  setInterval(() => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    tc.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  }, 1000);

  /* ---------- Easter egg: 5 cliques no título ---------- */
  const title = $('#hero-title');
  let clicks = 0;
  let clickTimer;
  title.addEventListener('click', () => {
    clicks += 1;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => { clicks = 0; }, 1500);
    if (clicks >= 5) {
      clicks = 0;
      title.classList.add('active');
      toast('Fizeste noclip… Boa sorte a sair daqui.');
      setTimeout(() => title.classList.remove('active'), 1200);
      setTimeout(() => $('#salas').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }), 900);
    }
  });

  /* ---------- Animar ao entrar no ecrã ---------- */
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    if (reduceMotion) { el.textContent = target; return; }
    const duration = 1400;
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  function activate(el) {
    el.classList.add('visible');
    if (el.dataset.count) countUp(el);
    if (el.dataset.width) el.style.width = el.dataset.width + '%';
  }

  const animated = $$('.reveal, [data-count], [data-width]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        activate(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.2 });
    animated.forEach((el) => io.observe(el));
  } else {
    animated.forEach(activate);
  }

  /* ---------- Quiz ---------- */
  const questions = [
    {
      q: 'Quem realizou Backrooms (2026)?',
      o: ['James Wan', 'Kane Parsons', 'Osgood Perkins', 'Shawn Levy'],
      a: 1,
      e: 'Kane Parsons, também conhecido como Kane Pixels, assina aqui a sua primeira longa-metragem.'
    },
    {
      q: 'Que estúdio distribuiu o filme?',
      o: ['Blumhouse', 'NEON', 'A24', 'Warner Bros.'],
      a: 2,
      e: 'Foi a A24, e tornou-se o filme mais rentável da produtora.'
    },
    {
      q: 'Qual é a profissão de Clark, a personagem de Chiwetel Ejiofor?',
      o: ['Dono de uma loja de móveis', 'Polícia', 'Professor', 'Cirurgião'],
      a: 0,
      e: 'Clark é dono de uma loja de móveis e arquiteto falhado. A porta fica na cave da loja.'
    },
    {
      q: 'Quem faz de terapeuta, a Dr. Mary Kline?',
      o: ['Lukita Maxwell', 'Renate Reinsve', 'Avan Jogia', 'Finn Bennett'],
      a: 1,
      e: 'Renate Reinsve interpreta a terapeuta que entra nos Backrooms para salvar o paciente.'
    },
    {
      q: 'Onde começou a série que deu origem ao filme?',
      o: ['Netflix', 'Twitch', 'YouTube', 'Vimeo'],
      a: 2,
      e: 'Parsons publicou os curtas no YouTube a partir do início de 2022.'
    },
    {
      q: 'Qual foi, aproximadamente, o orçamento do filme?',
      o: ['10 milhões de dólares', '50 milhões de dólares', '100 milhões de dólares', '200 milhões de dólares'],
      a: 0,
      e: 'Cerca de 10 M$, o que torna a bilheteira de mais de 400 M$ ainda mais impressionante.'
    }
  ];

  const quizBox = $('#quiz-box');
  let qi = 0;
  let score = 0;

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function renderQuestion() {
    const item = questions[qi];
    quizBox.replaceChildren();
    quizBox.appendChild(el('p', 'quiz-progress', `Pergunta ${qi + 1} de ${questions.length}`));
    quizBox.appendChild(el('p', 'quiz-q', item.q));

    const list = el('div', 'quiz-options');
    const explain = el('p', 'quiz-explain');
    const next = el('button', 'btn quiz-next', qi === questions.length - 1 ? 'Ver resultado' : 'Seguinte');
    next.type = 'button';
    next.hidden = true;

    item.o.forEach((text, idx) => {
      const b = el('button', 'quiz-option', text);
      b.type = 'button';
      b.addEventListener('click', () => {
        $$('.quiz-option', list).forEach((btn, i) => {
          btn.disabled = true;
          if (i === item.a) btn.classList.add('correct');
        });
        if (idx === item.a) {
          score += 1;
          explain.textContent = 'Certo! ' + item.e;
        } else {
          b.classList.add('wrong');
          explain.textContent = 'Não era essa. ' + item.e;
        }
        next.hidden = false;
        next.focus();
      });
      list.appendChild(b);
    });

    next.addEventListener('click', () => {
      qi += 1;
      qi < questions.length ? renderQuestion() : renderResult();
    });

    quizBox.append(list, explain, next);
  }

  function renderResult() {
    quizBox.replaceChildren();
    const ratio = score / questions.length;
    let msg = 'Perdeste-te nos corredores. Vê a secção da sinopse e tenta outra vez.';
    if (ratio >= 0.5) msg = 'Nada mau. Já sabes mais do que o suficiente para não te perderes.';
    if (ratio >= 0.85) msg = 'Especialista em Backrooms! Provavelmente não vais fazer noclip por acidente.';
    quizBox.appendChild(el('p', 'quiz-progress', 'Resultado final'));
    quizBox.appendChild(el('p', 'quiz-score', `${score} / ${questions.length}`));
    quizBox.appendChild(el('p', '', msg));
    const again = el('button', 'btn', 'Jogar outra vez');
    again.type = 'button';
    again.addEventListener('click', () => { qi = 0; score = 0; renderQuestion(); });
    quizBox.appendChild(again);
  }

  renderQuestion();

  /* ---------- Gerador de salas ---------- */
  const parts = {
    carpet: [
      'A carpete está húmida e tem um amarelo doentio.',
      'A carpete parece ter sido pisada há poucos segundos.',
      'O papel de parede descasca e cheira a bolor.'
    ],
    light: [
      'Os tubos fluorescentes zumbem num tom grave.',
      'Uma luz pisca ao ritmo da tua respiração.',
      'Metade das luzes está apagada.',
      'A luz é demasiado forte e não faz sombras.'
    ],
    thing: [
      'Há uma cadeira de escritório virada para a parede.',
      'Uma pilha de móveis bloqueia um dos corredores.',
      'Uma porta aberta dá para outra sala igual.',
      'No chão está uma câmara de vídeo ainda a gravar.',
      'Um corredor termina numa parede sem porta.'
    ],
    sound: [
      'Ao longe, ouves passos.',
      'O silêncio é total, e isso preocupa-te.',
      'Algo arrasta móveis nas salas ao lado.',
      'Ouves uma voz a repetir o teu nome.'
    ]
  };

  const roomBox = $('.room');
  const roomTitle = $('#room-title');
  const roomText = $('#room-text');
  const roomExit = $('#room-exit');

  $('#noclip').addEventListener('click', () => {
    const n = Math.floor(Math.random() * 9999) + 1;
    const chance = Math.floor(Math.random() * 6); // 0 a 5 %
    roomTitle.textContent = `Sala ${n}`;
    roomText.textContent = [pick(parts.carpet), pick(parts.light), pick(parts.thing), pick(parts.sound)].join(' ');
    roomExit.textContent = chance === 0
      ? 'Saída: nenhuma à vista.'
      : `Probabilidade de encontrar a saída: ${chance}%.`;
    roomBox.classList.remove('flash');
    void roomBox.offsetWidth; // reinicia a animação
    roomBox.classList.add('flash');
  });

  /* ---------- Modo lanterna ---------- */
  const fab = $('#flashlight-toggle');
  const root = document.documentElement;
  let flashlightOn = false;

  function moveLight(x, y) {
    root.style.setProperty('--fx', x + 'px');
    root.style.setProperty('--fy', y + 'px');
  }

  fab.addEventListener('click', () => {
    flashlightOn = !flashlightOn;
    document.body.classList.toggle('flashlight', flashlightOn);
    fab.setAttribute('aria-pressed', String(flashlightOn));
    if (flashlightOn) {
      moveLight(window.innerWidth / 2, window.innerHeight / 2);
      toast('Lanterna ligada. Mexe o rato ou o dedo.');
    }
  });

  window.addEventListener('pointermove', (e) => { if (flashlightOn) moveLight(e.clientX, e.clientY); });
  window.addEventListener('touchstart', (e) => {
    if (flashlightOn && e.touches[0]) moveLight(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (flashlightOn && e.touches[0]) moveLight(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
})();
