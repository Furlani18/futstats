const UI = (() => {
  const esc = texto => DB.Util.escapar(texto);

  // ---------- Ícones (SVG próprios, traço de 2px em grade 24×24) ----------
  // Substituem os emojis, que mudam de desenho entre Windows, Android e iPhone.
  // Nos HTML fixos, use <i data-icone="nome"></i>: o topo troca pelo SVG ao montar a página.
  const ICONES = {
    inicio: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    partidas: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 4.5h-5L8 10z"/>',
    grupos: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/>',
    estatisticas: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    mais: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    chaveamento: '<path d="M4 5h5v6H4zM4 13h5v6H4zM9 8h4v8h-4M13 12h7"/>',
    bola: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5l4.3 3.1-1.6 5H9.3l-1.6-5zM12 7.5V3M16.3 10.6l4.2-1.4M14.7 15.6l2.6 3.6M9.3 15.6l-2.6 3.6M7.7 10.6L3.5 9.2"/>',
    assistencia: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    estrela: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 2.9 1-6.2L3 9.6l6.2-.9z"/>',
    'estrela-cheia': '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 2.9 1-6.2L3 9.6l6.2-.9z" fill="currentColor"/>',
    balanca: '<path d="M12 4v16M8 20h8M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    escudo: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>',
    dado: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    play: '<path d="M7 4.5l12 7.5-12 7.5z" fill="currentColor"/>',
    pausa: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>',
    avancar: '<path d="M5 5l9 7-9 7z" fill="currentColor"/><path d="M18 5v14"/>',
    trocar: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
    voltar: '<path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/>',
    repetir: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    globo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    camisa: '<path d="M8 3L3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z"/>',
    grade: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    prancheta: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
    estadio: '<ellipse cx="12" cy="9" rx="9" ry="4"/><path d="M3 9v6c0 2.2 4 4 9 4s9-1.8 9-4V9M7 12.5v4.8M12 13v6M17 12.5v4.8"/>',
    bolo: '<path d="M4 21h16M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M5 16.5c1.5 1 3 1 3.5 0s2-1 3.5 0 2 1 3.5 0 2-1 3.5 0M12 12V8.5M12 5.5v.5"/>',
    capitao: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M14.5 10a2.5 2.5 0 1 0 0 4"/>',
    busca: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    lua: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    refletor: '<path d="M8 3h8l1.5 6h-11zM12 9v12M8 21h8M4 4.5L2.5 3.5M20 4.5l1.5-1M3.5 8H2M20.5 8H22"/>',
    paleta: '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.6-.7 1.6-1.6 0-1-.8-1.4-.8-2.3 0-.9.7-1.6 1.6-1.6H17a4 4 0 0 0 4-4C21 6.8 17 3 12 3z"/><circle cx="7.5" cy="11" r="1" fill="currentColor"/><circle cx="9.5" cy="7" r="1" fill="currentColor"/><circle cx="14.5" cy="7" r="1" fill="currentColor"/>',
    linhas: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>',
    folga: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    trofeu: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 21h6M10 17h4v4h-4z"/>',
    fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
    aviso: '<path d="M12 3.5l9.5 17h-19zM12 10v4.5M12 17.5v.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    luva: '<path d="M7 21v-4l-3-5a1.5 1.5 0 0 1 2.6-1.5L8 13V5.5a1.5 1.5 0 0 1 3 0V11V4.5a1.5 1.5 0 0 1 3 0V11V5.5a1.5 1.5 0 0 1 3 0V13l1-1.8a1.5 1.5 0 0 1 2.6 1.4L18 17v4z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    chuteira: '<path d="M3 16.5h7.5L14 12h2.5a4.5 4.5 0 0 1 4.5 4.5v1.5H3zM3 19.5h18M6.5 16.5v-3M9.5 16.5v-2"/>',
    pino: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  };
  function icone(id, classe = '') {
    return `<svg class="ico${classe ? ` ${classe}` : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONES[id] || ''}</svg>`;
  }
  // Troca os marcadores <i data-icone="nome"> do HTML fixo pelos SVGs.
  function hidratarIcones(raiz = document) {
    raiz.querySelectorAll('i[data-icone]').forEach(el => { el.outerHTML = icone(el.dataset.icone, el.className); });
  }

  function paginaAtual() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  const SECOES = {
    'index.html': 'inicio',
    'partidas.html': 'partidas', 'jogo.html': 'partidas',
    'grupos.html': 'grupos',
    'chaveamento.html': 'chaveamento',
    'estatisticas.html': 'estatisticas', 'jogador.html': 'estatisticas', 'comparar.html': 'estatisticas',
    'selecoes.html': 'selecoes', 'time.html': 'selecoes',
    'premios.html': 'premios',
    'simulador.html': 'simulador',
    'bolao.html': 'bolao',
    'sedes.html': 'sedes',
  };

  // Itens do menu de cada formato de campeonato.
  function navDoCampeonato() {
    const tipo = DB.Contexto.tipo();
    const tabela = { copa_mundo: 'Grupos', grupos_mata: 'Grupos', liga: 'Classificação', champions: 'Classificação' }[tipo];
    const temMataMata = tipo !== 'liga';
    const temSimulador = tipo !== 'mata_mata';
    return [
      ['inicio', 'index.html', 'Início'],
      ['partidas', 'partidas.html', 'Partidas'],
      tabela && ['grupos', 'grupos.html', tabela],
      temMataMata && ['chaveamento', 'chaveamento.html', 'Mata-mata'],
      ['estatisticas', 'estatisticas.html', 'Estatísticas'],
      ['premios', 'premios.html', 'Prêmios'],
      temSimulador && ['simulador', 'simulador.html', 'Simulador'],
      ['bolao', 'bolao.html', 'Bolão'],
      ['selecoes', 'selecoes.html', rotuloTimes()],
      tipo === 'copa_mundo' && ['sedes', 'sedes.html', 'Sedes'],
    ].filter(Boolean);
  }

  // "Seleções" na Copa, "Clubes" nos demais.
  function rotuloTimes(singular = false) {
    if (DB.Contexto.ehCopa()) return singular ? 'Seleção' : 'Seleções';
    return singular ? 'Clube' : 'Clubes';
  }

  // ---------- Seletor de campeonato ----------
  function iconeCampeonato(comp, tamanho = 'sm') {
    if (comp.logo) return `<span class="logo-plate logo-plate-${tamanho}"><img src="${comp.logo}" alt="" loading="lazy" onerror="this.parentNode.remove()"></span>`;
    if (comp.iso) return `<span class="flag flag-${tamanho}"><img src="${DB.Util.bandeiraUrl(comp.iso, 40)}" alt="" loading="lazy" onerror="this.remove()"></span>`;
    return `<span class="comp-icone" aria-hidden="true">${icone('trofeu')}</span>`;
  }

  function seletorCampeonato() {
    const atual = DB.Contexto.get();
    const regioes = [...new Set(DB.Contexto.lista.map(c => c.regiao))];
    return `
      <details class="comp-select" id="comp-select">
        <summary aria-label="Escolher campeonato">${iconeCampeonato(atual)}<span class="comp-nome">${esc(atual.curto)}</span><span class="comp-temp">${esc(atual.temporada)}</span><span class="comp-seta" aria-hidden="true">▾</span></summary>
        <div class="comp-menu" role="menu">
          ${regioes.map(r => `<div class="comp-grupo">${esc(r)}</div>
            ${DB.Contexto.lista.filter(c => c.regiao === r).map(c => `
              <button type="button" role="menuitem" class="comp-item${c.id === atual.id ? ' ativo' : ''}" data-comp="${c.id}">
                ${iconeCampeonato(c)}<span><b>${esc(c.curto)}</b><small>${esc(c.temporada)}</small></span>
              </button>`).join('')}`).join('')}
        </div>
      </details>`;
  }

  function ativarSeletor() {
    const caixa = document.getElementById('comp-select');
    if (!caixa) return;
    caixa.querySelectorAll('[data-comp]').forEach(botao => botao.addEventListener('click', () => {
      DB.Contexto.definir(botao.dataset.comp);
      // Páginas de um item específico (jogo, time, jogador) não fazem sentido em outro campeonato.
      const pagina = paginaAtual();
      const especifica = ['jogo.html', 'time.html', 'jogador.html'].includes(pagina);
      const semEssaPagina = (pagina === 'chaveamento.html' && DB.Contexto.tipo() === 'liga')
        || (pagina === 'simulador.html' && DB.Contexto.tipo() === 'mata_mata')
        || (pagina === 'grupos.html' && DB.Contexto.tipo() === 'mata_mata')
        || (pagina === 'sedes.html' && !DB.Contexto.ehCopa());
      window.location.href = especifica || semEssaPagina ? 'index.html' : pagina;
    }));
    document.addEventListener('click', e => { if (!caixa.contains(e.target)) caixa.open = false; });
  }

  // Pré-carrega a página do link ao passar o mouse/tocar: a troca de página fica instantânea
  // (navegadores sem suporte simplesmente ignoram).
  function ativarPreCarregamento() {
    if (!HTMLScriptElement.supports || !HTMLScriptElement.supports('speculationrules')) return;
    const regras = document.createElement('script');
    regras.type = 'speculationrules';
    regras.textContent = JSON.stringify({
      prerender: [{ where: { and: [{ href_matches: '/*' }, { not: { href_matches: '*login.html*' } }] }, eagerness: 'moderate' }],
    });
    document.head.appendChild(regras);
  }

  // Cores do campeonato selecionado: destaque (--comp-cor) e a faixa do topo.
  // Ficam salvas para o <head> da próxima página já abrir com elas (sem piscar).
  function aplicarTemaCampeonato() {
    let tema = DB.Contexto.get().tema;
    const camisa = TemaTime.time();
    if (camisa) {
      // Destaque na cor do time que aparece no fundo do tema; faixa nas cores do uniforme.
      // A faixa do meio usa uma cor que apareça no fundo (a secundária branca some no tema claro).
      const c = DB.Util.coresTime(camisa);
      const cor = corDoTime(camisa);
      tema = { cor, faixa: [c.primaria, corDoTime(camisa, cor), c.primaria] };
    }
    if (!tema) return;
    const lum = hex => {
      const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const cores = {
      '--comp-cor': tema.cor,
      '--on-cor': lum(tema.cor) > 0.3 ? '#0b0f1a' : '#ffffff',
      '--host-1': tema.faixa[0], '--host-2': tema.faixa[1], '--host-3': tema.faixa[2],
    };
    Object.entries(cores).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    try { localStorage.setItem('fs_cores', JSON.stringify(cores)); } catch (e) { /* sem armazenamento */ }
  }

  // Logo do campeonato no topo das páginas internas (menos seleção/clube/jogador, que têm visual próprio).
  function logoNoTopoDaPagina() {
    const comp = DB.Contexto.get();
    const topo = document.querySelector('.page-hero');
    if (!comp.logo || !topo || ['time.html', 'jogador.html'].includes(paginaAtual())) return;
    topo.classList.add('page-hero-comp');
    const container = topo.querySelector('.container');
    container.insertAdjacentHTML('beforeend', `<div class="page-hero-logo logo-plate logo-plate-lg" aria-hidden="true"><img src="${comp.logo}" alt=""></div>`);
  }

  function montarTopbar() {
    const mount = document.getElementById('topbar-mount');
    if (!mount) return;
    aplicarTemaCampeonato();
    ativarPreCarregamento();
    // Títulos de aba escritos para a Copa: troca pelo campeonato aberto.
    const compAberto = DB.Contexto.get();
    if (!DB.Contexto.ehCopa() && document.title.includes('Copa do Mundo FIFA 2026')) {
      document.title = document.title.replace('Copa do Mundo FIFA 2026', `${compAberto.curto} ${compAberto.temporada}`);
    }
    const secao = SECOES[paginaAtual()] || '';
    mount.innerHTML = `
      <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <div class="host-stripe"></div>
      <div class="topbar">
        <div class="topbar-inner">
          <a class="topbar-logo" href="index.html">
            <span class="logo-mark"><img src="favicon.svg" alt=""></span>FUT<span class="accent">STATS</span>
          </a>
          ${seletorCampeonato()}
          <button type="button" class="search-btn" id="btn-busca" aria-label="Buscar jogador ou seleção" title="Buscar (Ctrl+K)">
            ${icone('busca')}<span class="search-btn-txt">Buscar</span><kbd>Ctrl K</kbd>
          </button>
          <button type="button" class="theme-btn" id="btn-tema" aria-label="Aparência: tema, densidade e cores" title="Aparência" aria-expanded="false" aria-controls="aparencia"></button>
          <input type="checkbox" id="nav-toggle" class="nav-toggle-checkbox" tabindex="-1" aria-hidden="true">
          <button type="button" class="nav-toggle-btn" data-menu aria-controls="menu-principal" aria-expanded="false" aria-label="Abrir menu">${icone('menu')}</button>
          <nav class="topbar-nav" id="menu-principal" aria-label="Menu principal">
            ${navDoCampeonato().map(([id, href, label]) => `<a href="${href}" class="${secao === id ? 'active' : ''}"${secao === id ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
            <a href="login.html" class="nav-admin">Painel</a>
          </nav>
        </div>
      </div>`;
    ativarBusca();
    ativarSeletor();
    logoNoTopoDaPagina();
    ativarTema();
    montarBarraInferior(secao);
    ativarMenu();
    hidratarIcones();
    const principal = document.querySelector('main');
    if (principal && !principal.id) principal.id = 'conteudo';
  }

  // ---------- Busca global (jogadores e seleções) ----------
  const normalizar = texto => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function buscar(termo) {
    const t = normalizar(termo).trim();
    if (t.length < 2) return [];
    const times = DB.Times.todos();
    const porId = Object.fromEntries(times.map(x => [x.id, x]));
    const resultados = [];
    times.forEach(time => {
      const alvo = normalizar(`${time.nome} ${time.codigo}`);
      if (alvo.includes(t)) resultados.push({ tipo: 'time', peso: alvo.startsWith(t) ? 0 : 1, time });
    });
    DB.Jogadores.todos().forEach(jogador => {
      const nome = normalizar(jogador.nome);
      const clube = normalizar(jogador.clube);
      const casaNome = nome.includes(t);
      if (!casaNome && !clube.includes(t)) return;
      const inicioPalavra = nome.split(/\s+/).some(parte => parte.startsWith(t));
      resultados.push({ tipo: 'jogador', peso: !casaNome ? 4 : nome.startsWith(t) ? 1 : inicioPalavra ? 2 : 3, jogador, time: porId[jogador.timeId] });
    });
    return resultados.sort((a, b) => a.peso - b.peso || (a.tipo === 'time' ? -1 : 1)).slice(0, 12);
  }

  function itemBusca(r, i) {
    if (r.tipo === 'time') {
      return `<a class="busca-item" href="time.html?id=${r.time.id}" data-i="${i}">
        ${bandeira(r.time)}<span class="busca-txt"><b>${esc(r.time.nome)}</b><small>${r.time.tipo === 'clube'
          ? `Clube · ${esc(DB.Contexto.competicoesDoTime(r.time.id).map(c => c.curto).join(', '))}`
          : `Seleção · Grupo ${r.time.grupo} · ${r.time.confederacao}`}</small></span></a>`;
    }
    return `<a class="busca-item" href="jogador.html?id=${r.jogador.id}" data-i="${i}">
      ${avatar(r.jogador)}<span class="busca-txt"><b>${esc(r.jogador.nome)}</b>
      <small>${r.time ? esc(r.time.nome) : ''} · ${esc(r.jogador.posicao)}${r.jogador.clube ? ` · ${esc(r.jogador.clube)}` : ''}</small></span></a>`;
  }

  let focoAntesDaBusca = null;
  function abrirBusca() {
    if (document.getElementById('busca-overlay')) return;
    focoAntesDaBusca = document.activeElement;
    const overlay = document.createElement('div');
    overlay.id = 'busca-overlay';
    overlay.className = 'busca-overlay';
    overlay.innerHTML = `
      <div class="busca-box" role="dialog" aria-modal="true" aria-label="Buscar">
        <input type="search" id="busca-input" placeholder="Buscar jogador, seleção ou clube…" autocomplete="off" aria-label="Buscar jogador, seleção ou clube" aria-controls="busca-resultados">
        <div class="busca-resultados" id="busca-resultados" aria-live="polite"><div class="busca-dica">Digite ao menos 2 letras. Ex.: <b>Vini</b>, <b>Japão</b>, <b>Real Madrid</b></div></div>
      </div>`;
    document.body.appendChild(overlay);
    const input = document.getElementById('busca-input');
    const lista = document.getElementById('busca-resultados');
    let ativo = 0;
    const marcar = () => lista.querySelectorAll('.busca-item').forEach((el, i) => el.classList.toggle('ativo', i === ativo));
    input.addEventListener('input', () => {
      const r = buscar(input.value);
      ativo = 0;
      lista.innerHTML = r.length ? r.map(itemBusca).join('')
        : `<div class="busca-dica">${input.value.trim().length < 2 ? 'Digite ao menos 2 letras.' : 'Nada encontrado.'}</div>`;
      marcar();
    });
    input.addEventListener('keydown', e => {
      const itens = lista.querySelectorAll('.busca-item');
      if (e.key === 'ArrowDown' && itens.length) { ativo = (ativo + 1) % itens.length; marcar(); e.preventDefault(); }
      if (e.key === 'ArrowUp' && itens.length) { ativo = (ativo - 1 + itens.length) % itens.length; marcar(); e.preventDefault(); }
      if (e.key === 'Enter' && itens[ativo]) window.location.href = itens[ativo].href;
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) fecharBusca(); });
    input.focus();
  }

  function fecharBusca() {
    const overlay = document.getElementById('busca-overlay');
    if (!overlay) return;
    overlay.remove();
    focoAntesDaBusca?.focus?.();
  }

  function ativarBusca() {
    document.getElementById('btn-busca')?.addEventListener('click', abrirBusca);
    document.addEventListener('keydown', e => {
      const digitando = /input|textarea|select/i.test(document.activeElement?.tagName || '');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); abrirBusca(); }
      else if (e.key === '/' && !digitando) { e.preventDefault(); abrirBusca(); }
      else if (e.key === 'Escape') fecharBusca();
    });
  }

  // ---------- Aparência: tema (escuro, claro, estádio), densidade e camisa do time ----------
  // Tudo fica no localStorage e o <head> de cada página reaplica antes de desenhar (sem piscar).
  const TEMAS = [['dark', 'Escuro', 'lua'], ['light', 'Claro', 'sol'], ['estadio', 'Estádio', 'refletor']];

  function temaAtual() {
    const escolhido = document.documentElement.dataset.theme;
    if (escolhido) return escolhido;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function guardar(chave, valor) {
    try { if (valor == null) localStorage.removeItem(chave); else localStorage.setItem(chave, valor); } catch (e) { /* vale só nesta página */ }
  }

  // "Vestir a camisa": o destaque e a faixa do topo passam a usar as cores de um time.
  const TemaTime = {
    id() { try { return localStorage.getItem('fs_tema_time'); } catch (e) { return null; } },
    time() { const id = this.id(); return id ? DB.Times.get(id) : null; },
    definir(id) { guardar('fs_tema_time', id); aplicarTemaCampeonato(); },
  };

  function ativarTema() {
    const botao = document.getElementById('btn-tema');
    if (!botao) return;
    const atualizarBotao = () => { botao.innerHTML = icone((TEMAS.find(t => t[0] === temaAtual()) || TEMAS[0])[2]); };
    let painel = null;
    const fechar = () => { if (!painel) return; painel.remove(); painel = null; botao.setAttribute('aria-expanded', 'false'); };
    const desenhar = () => {
      const tema = temaAtual();
      const compacta = document.documentElement.dataset.densidade === 'compacta';
      const camisa = TemaTime.time();
      const opcao = (grupo, valor, rotulo, ico, ativo) => `<button type="button" class="ap-opcao${ativo ? ' ativa' : ''}" data-${grupo}="${valor}" aria-pressed="${ativo}">${icone(ico)}<span>${rotulo}</span></button>`;
      painel.innerHTML = `
        <div class="ap-grupo"><span class="ap-rotulo">Tema</span><div class="ap-opcoes">${TEMAS.map(([v, r, ic]) => opcao('tema', v, r, ic, tema === v)).join('')}</div></div>
        <div class="ap-grupo"><span class="ap-rotulo">Densidade</span><div class="ap-opcoes">${opcao('densidade', 'normal', 'Normal', 'folga', !compacta)}${opcao('densidade', 'compacta', 'Compacta', 'linhas', compacta)}</div></div>
        <div class="ap-grupo"><span class="ap-rotulo">Cores</span>${camisa
          ? `<div class="ap-camisa">${bandeira(camisa, 'sm')}<span>Vestindo a camisa do <b>${esc(camisa.nome)}</b></span><button type="button" class="ap-tirar" data-tirar>${icone('fechar')}<span class="sr-only">Voltar às cores do campeonato</span></button></div>`
          : `<p class="ap-dica">${icone('camisa')} Na página de um time, toque em <b>Vestir a camisa</b> para o site ficar nas cores dele.</p>`}</div>`;
    };
    botao.addEventListener('click', e => {
      e.stopPropagation();
      if (painel) { fechar(); return; }
      painel = document.createElement('div');
      painel.className = 'aparencia';
      painel.id = 'aparencia';
      painel.setAttribute('role', 'dialog');
      painel.setAttribute('aria-label', 'Aparência');
      botao.after(painel);
      botao.setAttribute('aria-expanded', 'true');
      desenhar();
      painel.addEventListener('click', ev => {
        ev.stopPropagation();
        const b = ev.target.closest('button');
        if (!b) return;
        const grupo = b.dataset.tema ? 'tema' : b.dataset.densidade ? 'densidade' : null;
        if (b.dataset.tema) {
          document.documentElement.dataset.theme = b.dataset.tema;
          guardar('fs_tema', b.dataset.tema);
          aplicarTemaCampeonato();   // a cor do time depende do fundo do tema
        } else if (b.dataset.densidade) {
          if (b.dataset.densidade === 'compacta') document.documentElement.dataset.densidade = 'compacta';
          else delete document.documentElement.dataset.densidade;
          guardar('fs_densidade', b.dataset.densidade === 'compacta' ? 'compacta' : null);
        } else if (b.hasAttribute('data-tirar')) TemaTime.definir(null);
        atualizarBotao();
        desenhar();
        (grupo ? painel.querySelector(`[data-${grupo}].ativa`) : painel.querySelector('.ap-opcao.ativa'))?.focus();
      });
      painel.querySelector('.ap-opcao.ativa')?.focus();
    });
    document.addEventListener('click', fechar);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && painel) { fechar(); botao.focus(); } });
    atualizarBotao();
  }

  // ---------- Menu recolhido (☰ no topo, "Mais" na barra inferior) ----------
  // Botões de verdade (focáveis pelo teclado) que ligam a caixa #nav-toggle, da qual o CSS depende.
  function ativarMenu() {
    const caixa = document.getElementById('nav-toggle');
    const botoes = () => document.querySelectorAll('[data-menu]');
    const definir = aberto => {
      caixa.checked = aberto;
      botoes().forEach(b => { b.setAttribute('aria-expanded', aberto); if (b.classList.contains('nav-toggle-btn')) b.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu'); });
      if (aberto) document.querySelector('#menu-principal a')?.focus();
    };
    botoes().forEach(b => b.addEventListener('click', () => definir(!caixa.checked)));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && caixa.checked) { definir(false); document.querySelector('[data-menu]')?.focus(); }
    });
  }

  // ---------- Barra de navegação inferior (celular) ----------
  function montarBarraInferior(secao) {
    if (document.querySelector('.bottom-nav')) return;
    const tipo = DB.Contexto.tipo();
    const terceiro = tipo === 'mata_mata' ? ['chaveamento', 'chaveamento.html', 'Chave'] : ['grupos', 'grupos.html', tipo === 'liga' || tipo === 'champions' ? 'Tabela' : 'Grupos'];
    const principais = [['inicio', 'index.html', 'Início'], ['partidas', 'partidas.html', 'Partidas'], terceiro, ['estatisticas', 'estatisticas.html', 'Números']];
    const noMais = !principais.some(([id]) => id === secao) && secao;
    const barra = document.createElement('nav');
    barra.className = 'bottom-nav';
    barra.setAttribute('aria-label', 'Navegação principal');
    barra.innerHTML = principais.map(([id, href, label]) =>
      `<a href="${href}" class="${secao === id ? 'active' : ''}"${secao === id ? ' aria-current="page"' : ''}>${icone(id)}<span>${label}</span></a>`).join('')
      + `<button type="button" data-menu aria-controls="menu-principal" aria-expanded="false" class="${noMais ? 'active' : ''}">${icone('mais')}<span>Mais</span></button>`;
    document.body.appendChild(barra);
    document.body.classList.add('com-barra-inferior');
  }

  // ---------- Números que contam até o valor ----------
  // Elementos com data-contar="154" (e opcional data-decimais="2") animam do 0 ao valor.
  function animarNumeros(raiz = document) {
    const reduzir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    raiz.querySelectorAll('[data-contar]').forEach(el => {
      const alvo = Number(el.dataset.contar);
      const casas = Number(el.dataset.decimais || 0);
      const formatar = v => v.toFixed(casas).replace('.', ',');
      if (reduzir || !alvo) { el.textContent = formatar(alvo); return; }
      const duracao = 900;
      const inicio = performance.now();
      const passo = agora => {
        const t = Math.min(1, (agora - inicio) / duracao);
        el.textContent = formatar(alvo * (1 - (1 - t) ** 3));
        if (t < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
  }

  function montarTicker() {
    const mount = document.getElementById('ticker-mount');
    if (!mount) return;
    const encerrados = DB.Jogos.all()
      .filter(j => j.status === 'encerrado')
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 12);
    const jogos = [...DB.Jogos.aoVivo(), ...encerrados];
    if (!jogos.length) { mount.innerHTML = ''; return; }
    const itens = jogos.map(j => {
      const m = DB.Times.get(j.mandanteId), v = DB.Times.get(j.visitanteId);
      const vivo = j.status === 'ao_vivo' ? '<span class="live-dot"></span>' : '';
      return `<a class="ticker-item" href="jogo.html?id=${j.id}">${vivo}${bandeira(m, 'sm')} ${m ? m.codigo : '—'}
        <strong>${j.golsMandante ?? 0}–${j.golsVisitante ?? 0}</strong> ${v ? v.codigo : '—'} ${bandeira(v, 'sm')}</a>`;
    }).join('');
    // Duplica a faixa para a rolagem infinita; com poucos itens repete mais vezes.
    // As cópias ficam escondidas do leitor de tela e fora da ordem do Tab.
    const repeticoes = jogos.length < 6 ? 4 : 2;
    const copia = itens.replace(/<a class="ticker-item"/g, '<a class="ticker-item" tabindex="-1"');
    mount.innerHTML = `<section class="ticker" aria-label="Resultados recentes"><div class="ticker-track">${itens}<span class="ticker-copia" aria-hidden="true">${copia.repeat(repeticoes - 1)}</span></div></section>`;
  }

  function montarFooter() {
    const mount = document.getElementById('footer-mount');
    if (!mount) return;
    mount.innerHTML = `
      <div class="host-stripe"></div>
      <div class="footer">
        <div class="footer-inner">
          <span>© 2026 FUTSTATS · Copa do Mundo FIFA 2026 e campeonatos de clubes</span>
          <nav class="footer-links" aria-label="Links do rodapé">
            <a href="partidas.html">Partidas</a>
            <a href="estatisticas.html">Estatísticas</a>
            <a href="comparar.html">Comparar</a>
            <a href="bolao.html">Bolão</a>
            <a href="favoritos.html">Favoritos</a>
            <a href="sedes.html?c=copa2026">Sedes da Copa</a>
            <a href="sobre.html">Sobre o projeto</a>
            <a href="login.html">Painel administrativo</a>
          </nav>
        </div>
      </div>`;
  }

  // ---------- Bandeiras e times ----------
  function bandeira(time, tamanho = '') {
    const classe = `flag${tamanho ? ` flag-${tamanho}` : ''}`;
    if (!time) return `<span class="${classe}"></span>`;
    if (time.tipo === 'clube') {
      // Escudo gerado com as cores do clube: usado quando não há escudo
      // ou enquanto/se a imagem do escudo não carregar.
      const distintivo = escudoGerado(time, tamanho);
      if (!time.escudo) return distintivo;
      return `<span class="${classe} crest-img" title="${esc(time.nome)}"><img src="${esc(time.escudo)}" alt="" loading="lazy" onerror="this.parentNode.outerHTML=this.parentNode.dataset.reserva" ></span>`
        .replace('class="', `data-reserva="${esc(distintivo)}" class="`);
    }
    const largura = { sm: 40, '': 40, lg: 80, xl: 160 }[tamanho] || 40;
    const url = DB.Util.bandeiraUrl(time.iso, largura);
    if (!url) return `<span class="${classe} flag-fallback">${esc(time.codigo || DB.Util.iniciais(time.nome))}</span>`;
    return `<span class="${classe}"><img src="${url}" alt="" loading="lazy" onerror="this.remove()"></span>`;
  }

  // Escudo em SVG nas cores do clube. O desenho (liso, listras, faixa, diagonal ou metades)
  // sai sempre o mesmo para o mesmo clube: vem de um hash do id.
  const DESENHOS_ESCUDO = [
    () => '',
    s => [8, 16, 24, 32].map(x => `<rect x="${x - 2}" y="0" width="4" height="46" fill="${s}"/>`).join(''),
    s => `<rect x="0" y="17" width="40" height="11" fill="${s}"/>`,
    s => `<path d="M-4 8 L10 -4 L46 34 L32 46 Z" fill="${s}"/>`,
    s => `<rect x="20" y="0" width="20" height="46" fill="${s}"/>`,
  ];
  let contadorEscudo = 0;
  function escudoGerado(time, tamanho = '') {
    const c = DB.Util.coresTime(time);
    let hash = 0;
    for (const ch of String(time.id)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    const desenho = DESENHOS_ESCUDO[hash % DESENHOS_ESCUDO.length](c.secundaria);
    const id = `esc${++contadorEscudo}`;
    const sigla = esc(time.codigo || DB.Util.iniciais(time.nome)).slice(0, 4);
    const contorno = 'M20 1.5 L37.5 6.5 V22 C37.5 33.5 30 40.5 20 44.5 C10 40.5 2.5 33.5 2.5 22 V6.5 Z';
    // No tamanho pequeno a sigla ficaria ilegível: só as cores.
    const texto = tamanho === 'sm' ? '' : `<text x="20" y="${sigla.length > 3 ? 27 : 28}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="${sigla.length > 3 ? 10 : 12}" fill="${c.texto}" stroke="${c.primaria}" stroke-width="2.5" paint-order="stroke" stroke-linejoin="round">${sigla}</text>`;
    return `<span class="flag${tamanho ? ` flag-${tamanho}` : ''} crest-img crest-svg" title="${esc(time.nome)}"><svg viewBox="0 0 40 46" aria-hidden="true">
      <defs><clipPath id="${id}"><path d="${contorno}"/></clipPath></defs>
      <g clip-path="url(#${id})"><rect width="40" height="46" fill="${c.primaria}"/>${desenho}</g>
      <path d="${contorno}" fill="none" stroke="${c.secundaria}" stroke-width="2"/>
      <path d="${contorno}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>
      ${texto}</svg></span>`;
  }

  // Nacionalidade (código ISO) → bandeira e nome do país em português.
  const PAISES_ESPECIAIS = { 'gb-eng': 'Inglaterra', 'gb-sct': 'Escócia', 'gb-wls': 'País de Gales', 'gb-nir': 'Irlanda do Norte', xk: 'Kosovo' };
  let nomesRegiao = null;
  try { nomesRegiao = new Intl.DisplayNames(['pt-BR'], { type: 'region' }); } catch (e) { /* navegador antigo */ }
  function nomePais(iso) {
    if (!iso) return '—';
    if (PAISES_ESPECIAIS[iso]) return PAISES_ESPECIAIS[iso];
    try { return nomesRegiao ? nomesRegiao.of(iso.toUpperCase()) : iso.toUpperCase(); } catch (e) { return iso.toUpperCase(); }
  }
  function bandeiraPais(iso, tamanho = 'sm') {
    const url = DB.Util.bandeiraUrl(iso, 40);
    return url ? `<span class="flag flag-${tamanho}" title="${esc(nomePais(iso))}"><img src="${url}" alt="" loading="lazy" onerror="this.remove()"></span>` : '';
  }

  function bandeiraClube(codigoPais) {
    const url = DB.Util.bandeiraFifa(codigoPais, 40);
    return url ? `<span class="flag flag-sm" title="${esc(codigoPais)}"><img src="${url}" alt="" loading="lazy" onerror="this.remove()"></span>` : '';
  }

  // Mantido para páginas antigas/admin.
  function crestHtml(time, tamanho) {
    return bandeira(time, tamanho >= 70 ? 'xl' : tamanho >= 40 ? 'lg' : '');
  }

  function timeLink(time, opts = {}) {
    if (!time) return '<span class="team-inline"><span class="flag"></span><span class="nome">A definir</span></span>';
    const nome = opts.codigo ? time.codigo : time.nome;
    return `<a class="team-inline" href="time.html?id=${time.id}">${bandeira(time, opts.tamanho || '')}<span class="nome">${esc(nome)}</span></a>`;
  }

  function estiloCores(timeId) {
    const c = DB.Util.coresTime(DB.Times.get(timeId));
    return `background:${c.primaria};color:${c.texto};box-shadow:0 0 0 2px ${c.secundaria};`;
  }

  function avatar(jogador) {
    const num = jogador.numero != null ? `<span class="shirt-num">${jogador.numero}</span>` : '';
    return `<span class="avatar" style="${estiloCores(jogador.timeId)}">${esc(DB.Util.iniciais(jogador.nome))}${num}</span>`;
  }

  // ---------- Jogos ----------
  function badge(status) {
    const ponto = status === 'ao_vivo' ? '<span class="live-dot"></span>' : '';
    return `<span class="badge badge-${status}">${ponto}${DB.Util.statusLabel(status)}</span>`;
  }

  function rotuloJogo(jogo) {
    if (jogo.fase === 'grupos') return `Grupo ${jogo.grupo}${jogo.rodada ? ` · ${jogo.rodada}ª rodada` : ''}`;
    if (jogo.fase === 'liga') return `${jogo.rodada || '?'}ª rodada`;
    const perna = jogo.perna === 1 ? ' · ida' : jogo.perna === 2 ? ' · volta' : '';
    return DB.Util.faseLabel(jogo.fase) + perna;
  }

  function temPlacar(jogo) {
    return (jogo.status === 'encerrado' || jogo.status === 'ao_vivo') && jogo.golsMandante != null && jogo.golsVisitante != null;
  }

  function placarHtml(jogo) {
    if (!temPlacar(jogo)) return '<span class="match-score vs">vs</span>';
    const pen = (jogo.penaltisMandante != null && jogo.penaltisVisitante != null)
      ? `<span class="pen">pên. ${jogo.penaltisMandante}–${jogo.penaltisVisitante}</span>` : '';
    return `<span class="match-score${jogo.status === 'ao_vivo' ? ' live' : ''}">${jogo.golsMandante} – ${jogo.golsVisitante}${pen}</span>`;
  }

  // "R. Jiménez 12', 60+2' · Vega 69'" — resumo curto dos gols de um lado.
  function autoresResumo(jogo, timeId, limite = 3) {
    const porAutor = new Map();
    [...(jogo.gols || [])]
      .filter(g => g.timeId === timeId)
      .sort((a, b) => DB.Util.minutoNumero(a.minuto) - DB.Util.minutoNumero(b.minuto))
      .forEach(g => {
        const j = DB.Jogadores.get(g.jogadorId);
        const nome = j ? nomeCurto(j.nome) : 'Gol';
        const sufixo = g.tipo === 'penalti' ? ' (p)' : g.tipo === 'contra' ? ' (c)' : '';
        if (!porAutor.has(nome)) porAutor.set(nome, []);
        porAutor.get(nome).push(`${g.minuto ? `${g.minuto}'` : ''}${sufixo}`.trim());
      });
    const itens = [...porAutor].map(([nome, mins]) => `${esc(nome)} ${esc(mins.filter(Boolean).join(', '))}`.trim());
    return itens.length > limite ? `${itens.slice(0, limite).join(' · ')} …` : itens.join(' · ');
  }

  function linhaJogo(jogo, opts = {}) {
    const m = DB.Times.get(jogo.mandanteId), v = DB.Times.get(jogo.visitanteId);
    const vencedor = jogo.status === 'encerrado' ? DB.MataMata.vencedor(jogo) : null;
    const hora = jogo.status === 'ao_vivo'
      ? '<span class="match-time live"><span class="live-dot"></span>AO VIVO</span>'
      : `<span class="match-time">${opts.comData ? DB.Util.formatarData(jogo.data).slice(0, 5) : DB.Util.formatarHora(jogo.data)}</span>`;
    const lado = (time, classe) => {
      const gols = time && temPlacar(jogo) ? autoresResumo(jogo, time.id) : '';
      const texto = `<span class="side-txt"><span class="nome">${time ? esc(time.nome) : 'A definir'}</span>${gols ? `<span class="mini-gols">${gols}</span>` : ''}</span>`;
      return `
      <span class="match-side ${classe}${vencedor && time && vencedor !== time.id ? ' perdeu' : ''}">
        ${classe === 'home' ? `${texto}${bandeira(time)}` : `${bandeira(time)}${texto}`}
      </span>`;
    };
    return `
      <a class="match-row" href="jogo.html?id=${jogo.id}">
        ${hora}
        ${lado(m, 'home')}
        ${placarHtml(jogo)}
        ${lado(v, 'away')}
        <span class="match-tag">${jogo.fase === 'grupos' ? `Grupo ${jogo.grupo}${jogo.rodada ? ` · R${jogo.rodada}` : ''}` : rotuloJogo(jogo)}<span>${esc((jogo.local || '').split(',').pop().trim())}</span></span>
      </a>`;
  }

  // Versão estreita para colunas laterais.
  function linhaJogoCompacta(jogo) {
    const m = DB.Times.get(jogo.mandanteId), v = DB.Times.get(jogo.visitanteId);
    const placar = temPlacar(jogo)
      ? `<span class="placar">${jogo.golsMandante} – ${jogo.golsVisitante}</span>`
      : `<span class="placar vs">${DB.Util.formatarData(jogo.data).slice(0, 5)}</span>`;
    return `<a href="jogo.html?id=${jogo.id}" class="mini-match">
      <span class="team-inline home">${m ? esc(m.nome) : 'A definir'} ${bandeira(m, 'sm')}</span>
      ${placar}
      <span class="team-inline">${bandeira(v, 'sm')} ${v ? esc(v.nome) : 'A definir'}</span>
    </a>`;
  }

  // Lista de jogos agrupada por dia.
  function listaPorDia(jogos) {
    let diaAtual = '';
    return jogos.map(j => {
      const dia = j.data.slice(0, 10);
      const cabecalho = dia !== diaAtual ? `<div class="day-head">${DB.Util.formatarDiaLongo(j.data)}</div>` : '';
      diaAtual = dia;
      return cabecalho + linhaJogo(j);
    }).join('');
  }

  // Últimos resultados de um time (V/E/D), do mais antigo para o mais recente.
  function formaRecente(timeId, limite = 5) {
    const jogos = DB.Jogos.doTime(timeId).filter(j => j.status === 'encerrado' && j.golsMandante != null).slice(-limite);
    if (!jogos.length) return '<span class="dim">—</span>';
    return `<span class="form-pills">${jogos.map(j => {
      const pro = j.mandanteId === timeId ? j.golsMandante : j.golsVisitante;
      const contra = j.mandanteId === timeId ? j.golsVisitante : j.golsMandante;
      const r = pro > contra ? 'V' : pro < contra ? 'D' : 'E';
      return `<span class="form-pill ${r}" title="${pro}–${contra}">${r}</span>`;
    }).join('')}</span>`;
  }

  // ---------- Classificação ----------
  function tabelaGrupo(letra, opts = {}) {
    const tabela = DB.Classificacao.grupo(letra);
    const ehCopa = DB.Contexto.ehCopa();
    const terceiros = new Set(ehCopa ? DB.Classificacao.terceiros().filter(t => t.classificado).map(t => t.timeId) : []);
    const zonasGrupo = DB.Contexto.get().zonasGrupo || [];
    const algumJogo = tabela.some(t => t.J > 0);
    const completa = !opts.compacta;
    const linhas = tabela.map(t => {
      const time = DB.Times.get(t.timeId);
      let zona = '', textoZona = '';
      if (algumJogo && ehCopa) {
        zona = t.posicao <= 2 ? `zona-${t.posicao}` : (t.posicao === 3 && terceiros.has(t.timeId)) ? 'zona-3' : '';
        textoZona = t.posicao <= 2 ? 'classificado' : zona ? 'entre os melhores terceiros' : '';
      } else if (algumJogo) {
        const z = zonasGrupo.find(x => t.posicao >= x.de && t.posicao <= x.ate);
        zona = z ? `zona-cor zona-${z.cor}` : '';
        textoZona = z ? z.rotulo : '';
      }
      // A zona aparece pela cor; o texto oculto diz o mesmo para leitores de tela.
      return `<tr class="${zona}${opts.destaque === t.timeId ? ' destaque-time' : ''}">
        <td class="pos">${t.posicao}${textoZona ? `<span class="sr-only"> (${esc(textoZona)})</span>` : ''}</td>
        <td class="left">${timeLink(time)}</td>
        <td>${t.J}</td>
        ${completa ? `<td>${t.V}</td><td>${t.E}</td><td>${t.D}</td><td class="dim">${t.GP}:${t.GC}</td>` : ''}
        <td>${t.SG > 0 ? '+' : ''}${t.SG}</td>
        <td class="strong">${t.P}</td>
        ${opts.forma ? `<td>${formaRecente(t.timeId, 3)}</td>` : ''}
      </tr>`;
    }).join('');
    return `
      <div class="table-scroll">
        <table class="stats-table">
          <caption class="sr-only">Classificação${DB.Grupos.letras.length ? ` do grupo ${letra}` : ''}</caption>
          <thead><tr>
            <th scope="col">#</th><th scope="col" class="left">${rotuloTimes(true)}</th><th scope="col">J</th>
            ${completa ? '<th scope="col">V</th><th scope="col">E</th><th scope="col">D</th><th scope="col">Gols</th>' : ''}
            <th scope="col">SG</th><th scope="col" class="strong">Pts</th>
            ${opts.forma ? '<th scope="col">Últimos</th>' : ''}
          </tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>`;
  }

  function legendaZonas(zonas) {
    if (!zonas && !DB.Contexto.ehCopa()) zonas = DB.Contexto.get().zonasGrupo || DB.Contexto.get().zonas;
    if (zonas) {
      return `<div class="legend">${zonas.map(z => `<span><i style="background:var(--zona-${z.cor})"></i>${esc(z.rotulo)}</span>`).join('')}</div>`;
    }
    return `<div class="legend">
      <span><i style="background:var(--accent)"></i>Classificado aos 32avos</span>
      <span><i style="background:var(--blue)"></i>Entre os 8 melhores 3ºs</span>
    </div>`;
  }

  // Tabela de pontos corridos / fase de liga. opts: { compacta, limite, destaque (timeId), fonte, forma }
  function tabelaLiga(opts = {}) {
    let tabela = DB.Classificacao.liga(opts.fonte);
    const algumJogo = tabela.some(t => t.J > 0);
    if (opts.limite) tabela = tabela.slice(0, opts.limite);
    const completa = !opts.compacta;
    return `
      <div class="table-scroll">
        <table class="stats-table">
          <caption class="sr-only">Classificação</caption>
          <thead><tr>
            <th scope="col">#</th><th scope="col" class="left">${rotuloTimes(true)}</th><th scope="col" class="strong">Pts</th><th scope="col">J</th>
            ${completa ? '<th scope="col">V</th><th scope="col">E</th><th scope="col">D</th><th scope="col">Gols</th>' : ''}
            <th scope="col">SG</th>
            ${completa ? '<th scope="col" title="Aproveitamento">%</th>' : ''}
            ${opts.forma ? '<th scope="col">Últimos</th>' : ''}
          </tr></thead>
          <tbody>${tabela.map(t => `
            <tr class="${algumJogo && t.zona ? `zona-cor zona-${t.zona.cor}` : ''}${opts.destaque === t.timeId ? ' destaque-time' : ''}"${algumJogo && t.zona ? ` title="${esc(t.zona.rotulo)}"` : ''}>
              <td class="pos">${t.posicao}${algumJogo && t.zona ? `<span class="sr-only"> (${esc(t.zona.rotulo)})</span>` : ''}</td>
              <td class="left">${timeLink(DB.Times.get(t.timeId))}</td>
              <td class="strong">${t.P}</td>
              <td>${t.J}</td>
              ${completa ? `<td>${t.V}</td><td>${t.E}</td><td>${t.D}</td><td class="dim">${t.GP}:${t.GC}</td>` : ''}
              <td>${t.SG > 0 ? '+' : ''}${t.SG}</td>
              ${completa ? `<td class="dim">${t.aproveitamento}</td>` : ''}
              ${opts.forma ? `<td>${formaRecente(t.timeId, 5)}</td>` : ''}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // Cartão de um confronto de mata-mata (ida e volta com agregado).
  function cartaoConfronto(c) {
    const a = DB.Times.get(c.timeA), b = DB.Times.get(c.timeB);
    const classe = id => (!c.vencedor ? '' : c.vencedor === id ? 'vencedor' : 'perdedor');
    const pernas = c.jogos.map(j => {
      const m = DB.Times.get(j.mandanteId), v = DB.Times.get(j.visitanteId);
      const placar = temPlacar(j) ? `${j.golsMandante}–${j.golsVisitante}` : DB.Util.formatarDataHora(j.data);
      return `<a class="perna" href="jogo.html?id=${j.id}">${j.perna === 2 ? 'Volta' : j.perna === 1 ? 'Ida' : 'Jogo'}: ${m ? esc(m.codigo) : '?'} ${placar} ${v ? esc(v.codigo) : '?'}</a>`;
    }).join('');
    return `<div class="bracket-match confronto">
      <div class="bracket-team ${classe(c.timeA)}"${c.timeA ? ` data-time="${c.timeA}"` : ''}>${bandeira(a, 'sm')}<span class="nome">${a ? esc(a.nome) : 'A definir'}</span><span class="gols">${c.comPlacar ? c.golsA : ''}</span></div>
      <div class="bracket-team ${classe(c.timeB)}"${c.timeB ? ` data-time="${c.timeB}"` : ''}>${bandeira(b, 'sm')}<span class="nome">${b ? esc(b.nome) : 'A definir'}</span><span class="gols">${c.comPlacar ? c.golsB : ''}</span></div>
      <div class="pernas">${pernas}${c.penaltis ? `<span class="perna">Pênaltis ${c.penaltis[0]}–${c.penaltis[1]}</span>` : ''}</div>
    </div>`;
  }

  // ---------- Rankings de jogadores ----------
  function linhaLider(l, i, campo, rotulo) {
    const time = DB.Times.get(l.jogador.timeId);
    const valor = campo === 'cartoes'
      ? `${l.amarelos}<small><span class="card-icon" title="Amarelos"></span>${l.vermelhos ? ` · ${l.vermelhos} <span class="card-icon red" title="Vermelhos"></span>` : ''}</small>`
      : `${l[campo]}<small>${rotulo}</small>`;
    return `
      <li>
        <a class="leader${i === 0 ? ' destaque' : ''}" href="jogador.html?id=${l.jogador.id}">
          <span class="rank">${i + 1}</span>
          ${avatar(l.jogador)}
          <span class="info">
            <span class="nome">${esc(l.jogador.nome)}</span>
            <span class="sub">${bandeira(time, 'sm')} ${time ? esc(time.nome) : ''} · ${esc(l.jogador.posicao)}</span>
          </span>
          <span class="valor">${valor}</span>
        </a>
      </li>`;
  }

  function listaLideres(criterio, limite, rotulo, vazio) {
    const lista = DB.Estatisticas.ranking(criterio, limite);
    if (!lista.length) return `<div class="empty">${vazio || 'Nenhum lance cadastrado ainda.'}</div>`;
    return `<ol class="leader-list">${lista.map((l, i) => linhaLider(l, i, criterio, rotulo)).join('')}</ol>`;
  }

  // Nome curto para caber no campinho: "Vinícius Júnior" → "Vinícius Júnior"; "Gabriel Magalhães" → "G. Magalhães".
  function nomeCurto(nome) {
    const partes = String(nome).split(' ').filter(Boolean);
    if (partes.length <= 1 || nome.length <= 13) return nome;
    return `${partes[0][0]}. ${partes.slice(1).join(' ')}`;
  }

  // Campinho: `linhas` vai do ataque (topo) ao goleiro (base); cada item é
  // { jogador, tags, pts } ou null (vaga não preenchida).
  function campinho(linhas) {
    const jogadorHtml = item => {
      if (!item) return '<span class="pitch-player vazio"><span class="shirt"></span><span class="nome">—</span></span>';
      const j = item.jogador;
      return `<a class="pitch-player${j.posicao === 'Goleiro' ? ' gk' : ''}" href="jogador.html?id=${j.id}" title="${esc(j.nome)}">
        <span class="shirt" style="${j.posicao === 'Goleiro' ? '' : estiloCores(j.timeId)}">${j.numero ?? ''}${item.pts != null ? `<span class="pts">${item.pts}</span>` : ''}</span>
        <span class="nome">${esc(nomeCurto(j.nome))}</span>
        <span class="tags">${item.tags || ''}</span>
      </a>`;
    };
    return `<div class="pitch">${linhas.filter(l => l.length).map(l => `<div class="pitch-row">${l.map(jogadorHtml).join('')}</div>`).join('')}</div>`;
  }

  // ---------- Campinho no estilo Google (goleiro em cima) ----------
  // Pílula da nota: verde ≥ 6,5 · amarela 6,0–6,4 · laranja abaixo · azul ≥ 9.
  function notaHtml(nota, classe = '') {
    if (nota == null) return '';
    const faixa = nota >= 9 ? 'top' : nota >= 6.5 ? 'boa' : nota >= 6 ? 'media' : 'ruim';
    return `<span class="nota nota-${faixa} ${classe}" title="Nota">${nota.toFixed(1)}</span>`;
  }

  // "Foto" do jogador (iniciais nas cores do time) com ícones nos cantos e a nota embaixo.
  function fotoJogador(jogador, { cantos = '', nota = null } = {}) {
    return `<span class="lu-foto" style="${estiloCores(jogador.timeId)}">${esc(DB.Util.iniciais(jogador.nome))}${cantos}${notaHtml(nota, 'lu-nota')}</span>`;
  }

  function jogadorNoCampo(jogador, opts = {}) {
    return `<a class="lu-jogador" href="jogador.html?id=${jogador.id}" title="${esc(jogador.nome)}">
      ${fotoJogador(jogador, opts)}
      <span class="lu-nome">${jogador.numero != null && opts.numero !== false ? `${jogador.numero} ` : ''}${esc(nomeCurto(jogador.nome))}</span>
      ${opts.extra || ''}
    </a>`;
  }

  // `linhas`: listas de HTML de jogadores, do goleiro (topo) ao ataque.
  function campoGoogle(linhas, topoHtml = '') {
    return `${topoHtml}
      <div class="lu-campo">
        <span class="lu-area" aria-hidden="true"></span><span class="lu-pequena" aria-hidden="true"></span><span class="lu-meia-lua" aria-hidden="true"></span><span class="lu-circulo" aria-hidden="true"></span>
        ${linhas.filter(l => l.length).map(l => `<div class="lu-linha">${l.join('')}</div>`).join('')}
      </div>`;
  }

  // ---------- Favoritos: times e jogadores seguidos (ficam só neste navegador) ----------
  function listaFavoritos(chave) {
    return {
      lista() {
        try { return JSON.parse(localStorage.getItem(chave)) || []; } catch (e) { return []; }
      },
      tem(id) { return this.lista().includes(id); },
      alternar(id) {
        const atual = this.lista();
        const nova = atual.includes(id) ? atual.filter(x => x !== id) : [...atual, id];
        try { localStorage.setItem(chave, JSON.stringify(nova)); } catch (e) { /* sem armazenamento */ }
        return nova.includes(id);
      },
    };
  }
  const Favoritos = listaFavoritos('fs_favoritos');
  const FavoritosJogadores = listaFavoritos('fs_favoritos_jogadores');

  // Botão ☆/★ de seguir (página do time e do jogador).
  function ligarBotaoFavorito(botao, lista, id, rotulo) {
    const pintar = ativo => {
      botao.innerHTML = icone(ativo ? 'estrela-cheia' : 'estrela');
      botao.classList.toggle('ativo', ativo);
      botao.setAttribute('aria-pressed', ativo);
      botao.title = ativo ? 'Deixar de seguir' : `Seguir ${rotulo} (aparece em Favoritos)`;
      botao.setAttribute('aria-label', botao.title);
    };
    pintar(lista.tem(id));
    botao.hidden = false;
    botao.addEventListener('click', () => pintar(lista.alternar(id)));
  }

  // ---------- Calendário (.ics) para Google Agenda, Outlook e celular ----------
  // As datas do site estão no horário de Brasília (UTC−3, sem horário de verão desde 2019).
  function arquivoIcs(jogos, nomeCalendario) {
    const formato = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');   // 20260611T190000Z
    const inicio = iso => new Date(`${iso.slice(0, 16)}:00-03:00`);
    const texto = t => String(t || '').replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');
    // Linhas de no máximo 75 caracteres (continuação começa com espaço), como pede o padrão.
    const dobrar = linha => linha.length <= 75 ? linha : linha.match(/.{1,74}/g).join('\r\n ');
    const base = window.location.href.replace(/[^/]*$/, '');
    const agora = formato(new Date());
    const eventos = jogos.map(j => {
      const m = DB.Times.get(j.mandanteId), v = DB.Times.get(j.visitanteId);
      const comp = DB.Contexto.lista.find(c => c.id === (j.competicaoId || 'copa2026'));
      return ['BEGIN:VEVENT', `UID:${j.id}@futstats`, `DTSTAMP:${agora}`, `DTSTART:${formato(inicio(j.data))}`, `DTEND:${formato(new Date(inicio(j.data).getTime() + 2 * 36e5))}`,
        `SUMMARY:${texto(`${m ? m.nome : 'A definir'} x ${v ? v.nome : 'A definir'}${comp ? ` — ${comp.curto}` : ''}`)}`,
        j.local ? `LOCATION:${texto(j.local)}` : '',
        `DESCRIPTION:${texto(`${rotuloJogo(j)} · ${base}jogo.html?id=${j.id}`)}`,
        'END:VEVENT'].filter(Boolean);
    });
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FUTSTATS//Calendario//PT-BR', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${texto(nomeCalendario)}`,
      ...eventos.flat(), 'END:VCALENDAR'].map(dobrar).join('\r\n') + '\r\n';
  }

  function baixarIcs(jogos, nomeCalendario, arquivo) {
    const blob = new Blob([arquivoIcs(jogos, nomeCalendario)], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${arquivo}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  // Próximos jogos (agendados ou ao vivo) de um time em todos os campeonatos.
  function proximosDoTime(timeId) {
    return DB.Jogos.todos()
      .filter(j => (j.mandanteId === timeId || j.visitanteId === timeId) && j.status !== 'encerrado' && j.data)
      .sort((a, b) => new Date(a.data) - new Date(b.data));
  }

  // Gráfico de linha simples em SVG (sem bibliotecas). `pontos`: [{x, y, rotulo}]; y invertido opcional.
  function graficoLinha(pontos, { yMin, yMax, inverter = false, altura = 200, largura = 600, rotuloY = v => v, cor = 'var(--gold)', marcasY = [] } = {}) {
    if (!pontos.length) return '';
    // Largura em pixels reais do contêiner: o SVG fica 1:1 e o texto não encolhe no celular.
    const L = Math.max(280, Math.round(largura)), A = altura, m = { e: 34, d: 14, t: 14, b: 26 };
    const xs = pontos.map(p => p.x);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const px = x => m.e + (xMax === xMin ? (L - m.e - m.d) / 2 : ((x - xMin) / (xMax - xMin)) * (L - m.e - m.d));
    const py = y => {
      const t = (y - yMin) / ((yMax - yMin) || 1);
      return m.t + (inverter ? t : 1 - t) * (A - m.t - m.b);
    };
    const caminho = pontos.map((p, i) => `${i ? 'L' : 'M'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ');
    const area = `${caminho} L${px(pontos[pontos.length - 1].x).toFixed(1)},${A - m.b} L${px(pontos[0].x).toFixed(1)},${A - m.b} Z`;
    const passoX = Math.max(1, Math.ceil(pontos.length / 10));
    const gid = `gl-${Math.random().toString(36).slice(2, 8)}`;
    return `<svg class="grafico-linha" viewBox="0 0 ${L} ${A}" width="${L}" height="${A}" role="img" style="color:${cor}">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".28"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
      <g>
        ${marcasY.map(v => `<line class="gl-grade" x1="${m.e}" x2="${L - m.d}" y1="${py(v)}" y2="${py(v)}"/><text class="gl-eixo" x="${m.e - 8}" y="${py(v) + 4}" text-anchor="end">${rotuloY(v)}</text>`).join('')}
        ${pontos.map((p, i) => (i % passoX === 0 || i === pontos.length - 1) ? `<text class="gl-eixo" x="${px(p.x)}" y="${A - 6}" text-anchor="middle">${p.x}</text>` : '').join('')}
        <path d="${area}" fill="url(#${gid})" stroke="none"/>
        <path d="${caminho}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${pontos.map(p => `<circle cx="${px(p.x)}" cy="${py(p.y)}" r="4" fill="currentColor"><title>${esc(p.rotulo || '')}</title></circle>`).join('')}
      </g>
    </svg>`;
  }

  // Os mesmos números do gráfico numa tabela só para leitores de tela (o SVG sozinho não é lido).
  function tabelaOculta(titulo, cabecalhos, linhas) {
    // A tabela vai dentro de um div oculto: uma <table> não respeita width: 1px e alargaria a página.
    return `<div class="sr-only"><table><caption>${esc(titulo)}</caption><thead><tr>${cabecalhos.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${linhas.map(l => `<tr>${l.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  // Várias linhas no mesmo eixo (ex.: campanha de dois times). `series`: [{ nome, cor, pontos: [{x, y, rotulo}] }].
  function graficoLinhas(series, { yMin, yMax, inverter = false, altura = 220, largura = 600, rotuloY = v => v, marcasY = [] } = {}) {
    const todos = series.flatMap(s => s.pontos);
    if (!todos.length) return '';
    const L = Math.max(280, Math.round(largura)), A = altura, m = { e: 34, d: 14, t: 14, b: 26 };
    const xs = [...new Set(todos.map(p => p.x))].sort((a, b) => a - b);
    const xMin = xs[0], xMax = xs[xs.length - 1];
    const px = x => m.e + (xMax === xMin ? (L - m.e - m.d) / 2 : ((x - xMin) / (xMax - xMin)) * (L - m.e - m.d));
    const py = y => m.t + (inverter ? (y - yMin) / ((yMax - yMin) || 1) : 1 - (y - yMin) / ((yMax - yMin) || 1)) * (A - m.t - m.b);
    const passoX = Math.max(1, Math.ceil(xs.length / 10));
    const legenda = series.length > 1
      ? `<div class="gl-legenda">${series.map(s => `<span><i style="background:${s.cor}"></i>${esc(s.nome)}</span>`).join('')}</div>` : '';
    return `${legenda}<svg class="grafico-linha" viewBox="0 0 ${L} ${A}" width="${L}" height="${A}" role="img" aria-label="${esc(series.map(s => s.nome).join(' x '))}">
      ${marcasY.map(v => `<line class="gl-grade" x1="${m.e}" x2="${L - m.d}" y1="${py(v)}" y2="${py(v)}"/><text class="gl-eixo" x="${m.e - 8}" y="${py(v) + 4}" text-anchor="end">${rotuloY(v)}</text>`).join('')}
      ${xs.map((x, i) => (i % passoX === 0 || i === xs.length - 1) ? `<text class="gl-eixo" x="${px(x)}" y="${A - 6}" text-anchor="middle">${x}</text>` : '').join('')}
      ${series.map(s => `<g style="color:${s.cor}">
        <path d="${s.pontos.map((p, i) => `${i ? 'L' : 'M'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${s.pontos.map(p => `<circle class="gl-ponto" cx="${px(p.x)}" cy="${py(p.y)}" r="4" fill="currentColor"><title>${esc(`${s.nome} · ${p.rotulo || p.y}`)}</title></circle>`).join('')}
      </g>`).join('')}
    </svg>${tabelaOculta('Dados do gráfico', ['', ...series.map(s => s.nome)], xs.map(x => [x, ...series.map(s => { const p = s.pontos.find(q => q.x === x); return p ? (p.rotulo || p.y) : '—'; })]))}`;
  }

  // Colunas verticais a partir de zero. `itens`: [{ rotulo, valor, titulo, cor? }]; `media` desenha uma linha de referência.
  function graficoBarras(itens, { altura = 200, largura = 600, cor = 'var(--gold)', media = null, rotuloMedia = '', formatar = v => v, max: teto = null } = {}) {
    if (!itens.length) return '';
    const L = Math.max(280, Math.round(largura)), A = altura, m = { e: 30, d: 10, t: 18, b: 26 };
    const max = teto || Math.max(1, ...itens.map(i => i.valor), media || 0);
    const passo = (L - m.e - m.d) / itens.length;
    const larguraBarra = Math.max(4, Math.min(40, passo - 2));
    const py = v => m.t + (1 - v / max) * (A - m.t - m.b);
    const passoRotulo = Math.max(1, Math.ceil(itens.length / 14));
    const marcas = [0, Math.round(max / 2), max].filter((v, i, a) => a.indexOf(v) === i);
    return `<svg class="grafico-barras" viewBox="0 0 ${L} ${A}" width="${L}" height="${A}" role="img">
      ${marcas.map(v => `<line class="gl-grade" x1="${m.e}" x2="${L - m.d}" y1="${py(v)}" y2="${py(v)}"/><text class="gl-eixo" x="${m.e - 6}" y="${py(v) + 4}" text-anchor="end">${formatar(v)}</text>`).join('')}
      ${itens.map((it, i) => {
        const x = m.e + i * passo + (passo - larguraBarra) / 2;
        const y = py(it.valor), h = Math.max(0, A - m.b - y);
        // Ponta arredondada (4px) só em cima: a base fica reta sobre o eixo.
        const r = Math.min(4, larguraBarra / 2, h);
        const caminho = h ? `M${x},${A - m.b} V${y + r} Q${x},${y} ${x + r},${y} H${x + larguraBarra - r} Q${x + larguraBarra},${y} ${x + larguraBarra},${y + r} V${A - m.b} Z` : '';
        return `<g class="gb-item">
          <rect x="${m.e + i * passo}" y="${m.t}" width="${passo}" height="${A - m.t - m.b}" fill="transparent"><title>${esc(it.titulo || `${it.rotulo}: ${formatar(it.valor)}`)}</title></rect>
          ${caminho ? `<path d="${caminho}" fill="${it.cor || cor}" pointer-events="none"/>` : ''}
          ${i % passoRotulo === 0 ? `<text class="gl-eixo" x="${x + larguraBarra / 2}" y="${A - 8}" text-anchor="middle">${esc(it.rotulo)}</text>` : ''}
        </g>`;
      }).join('')}
      ${media != null ? `<line class="gb-media" x1="${m.e}" x2="${L - m.d}" y1="${py(media)}" y2="${py(media)}"/><text class="gl-eixo" x="${L - m.d}" y="${py(media) - 5}" text-anchor="end">${esc(rotuloMedia)}</text>` : ''}
    </svg>${tabelaOculta('Dados do gráfico', ['Item', 'Valor'], itens.map(it => [it.titulo || it.rotulo, formatar(it.valor)]))}`;
  }

  // Radar: `eixos` = rótulos; cada série tem `valores` de 0 a 1 (e `textos` para a dica de cada ponto).
  function graficoRadar(eixos, series, { tamanho = 320 } = {}) {
    const n = eixos.length, c = tamanho / 2, raio = c - 58;
    const ponto = (i, v) => {
      const ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
      return [c + Math.cos(ang) * raio * v, c + Math.sin(ang) * raio * v];
    };
    const poligono = v => eixos.map((_, i) => ponto(i, v).map(x => x.toFixed(1)).join(',')).join(' ');
    const legenda = series.length > 1
      ? `<div class="gl-legenda">${series.map(s => `<span><i style="background:${s.cor}"></i>${esc(s.nome)}</span>`).join('')}</div>` : '';
    return `${legenda}<svg class="grafico-radar" viewBox="0 0 ${tamanho} ${tamanho}" width="${tamanho}" height="${tamanho}" role="img" aria-label="Perfil: ${esc(eixos.join(', '))}">
      ${[0.25, 0.5, 0.75, 1].map(v => `<polygon class="gr-anel" points="${poligono(v)}"/>`).join('')}
      ${eixos.map((rotulo, i) => {
        const [x, y] = ponto(i, 1), [tx, ty] = ponto(i, 1.2);
        const ancora = Math.abs(tx - c) < 8 ? 'middle' : tx > c ? 'start' : 'end';
        return `<line class="gr-eixo" x1="${c}" y1="${c}" x2="${x}" y2="${y}"/><text class="gl-eixo gr-rotulo" x="${tx}" y="${ty + 4}" text-anchor="${ancora}">${esc(rotulo)}</text>`;
      }).join('')}
      ${series.map(s => `<g style="color:${s.cor}">
        <polygon points="${s.valores.map((v, i) => ponto(i, Math.max(0.02, v)).map(x => x.toFixed(1)).join(',')).join(' ')}" fill="currentColor" fill-opacity=".18" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        ${s.valores.map((v, i) => { const [x, y] = ponto(i, Math.max(0.02, v)); return `<circle cx="${x}" cy="${y}" r="4" fill="currentColor" stroke="var(--panel)" stroke-width="2"><title>${esc(`${s.nome} · ${eixos[i]}: ${(s.textos || [])[i] ?? Math.round(v * 100)}`)}</title></circle>`; }).join('')}
      </g>`).join('')}
    </svg>${tabelaOculta('Perfil (0 a 100 em relação ao melhor da posição)', ['Quesito', ...series.map(s => s.nome)], eixos.map((e, i) => [e, ...series.map(s => `${Math.round(s.valores[i] * 100)} (${(s.textos || [])[i] ?? ''})`)]))}`;
  }

  // Cor de gráfico legível para o time no tema atual: a primária; se ela sumir no fundo
  // (branca no tema claro, quase preta no escuro), a secundária; se as duas sumirem, a do tema.
  // `evitar`: a cor do outro time, para os dois não ficarem iguais.
  function corDoTime(time, evitar) {
    const c = DB.Util.coresTime(time);
    const lum = hex => {
      const h = hex.replace('#', '');
      const cheio = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
      const [r, g, b] = [0, 2, 4].map(i => parseInt(cheio.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const fundo = temaAtual() === 'light' ? 1 : lum('#10151f');
    const contraste = hex => { const [a, b] = [lum(hex), fundo].sort((x, y) => y - x); return (a + 0.05) / (b + 0.05); };
    const opcoes = [c.primaria, c.secundaria].filter(x => /^#[0-9a-f]{3,6}$/i.test(x) && contraste(x) >= 2.2
      && (!evitar || x.toLowerCase() !== evitar.toLowerCase()));
    return opcoes[0] || (evitar && evitar !== 'var(--gold)' ? 'var(--gold)' : 'var(--blue)');
  }

  // Carta de jogador no estilo figurinha: moldura ouro (nota ≥ 7,5), prata (≥ 6,8) ou bronze;
  // sem nota (não jogou), moldura neutra. `linha` = números do jogador no campeonato.
  const POS_CARTA = { Goleiro: 'GOL', Defensor: 'DEF', 'Meio-campo': 'MEI', 'Meia ofensivo': 'MEI', Atacante: 'ATA' };
  function cartaJogador(jogador, { nota = null, linha = null, link = true } = {}) {
    const time = DB.Times.get(jogador.timeId);
    const nivel = nota == null ? 'base' : nota >= 7.5 ? 'ouro' : nota >= 6.8 ? 'prata' : 'bronze';
    const l = linha || {};
    const numeros = jogador.posicao === 'Goleiro'
      ? [['J', l.jogos || 0], ['MIN', l.minutos || 0], ['CA', l.amarelos || 0]]
      : [['GOL', l.gols || 0], ['ASS', l.assistencias || 0], ['J', l.jogos || 0], ['MIN', l.minutos || 0]];
    const notaTxt = nota != null ? nota.toFixed(1).replace('.', ',') : '–';
    const tag = link ? 'a' : 'div';
    return `<${tag} class="carta carta-${nivel}"${link ? ` href="jogador.html?id=${jogador.id}"` : ''} aria-label="${esc(`${jogador.nome}, ${jogador.posicao}${nota != null ? `, nota ${notaTxt}` : ''}`)}">
      <span class="carta-brilho" aria-hidden="true"></span>
      <span class="carta-topo" aria-hidden="true"><span class="carta-nota">${notaTxt}</span><span class="carta-pos">${POS_CARTA[jogador.posicao] || esc(jogador.posicao || '')}</span>${bandeira(time, 'sm')}</span>
      <span class="carta-foto" style="${estiloCores(jogador.timeId)}" aria-hidden="true">${esc(DB.Util.iniciais(jogador.nome))}${jogador.numero != null ? `<span class="carta-num">${jogador.numero}</span>` : ''}</span>
      <span class="carta-nome">${esc(nomeCurto(jogador.nome))}</span>
      <span class="carta-stats">${numeros.map(([r, v]) => `<span><b>${v}</b>${r}</span>`).join('')}</span>
    </${tag}>`;
  }

  // Chaveamento: passar o mouse (ou o foco) num time acende o caminho dele e apaga o resto;
  // com o campeão definido, o caminho dele fica aceso o tempo todo.
  function destacarCaminhos(raiz, campeaoId) {
    if (!raiz) return;
    const marcar = (id, classe) => raiz.querySelectorAll(`.bracket-team[data-time="${id}"]`).forEach(el => {
      el.classList.add(classe);
      el.closest('.bracket-match')?.classList.add(classe);
    });
    if (campeaoId) { raiz.classList.add('tem-campeao'); marcar(campeaoId, 'caminho-campeao'); }
    let atual = null;
    const focar = id => {
      if (id === atual) return;
      atual = id;
      raiz.querySelectorAll('.caminho').forEach(el => el.classList.remove('caminho'));
      raiz.classList.toggle('com-foco', !!id);
      if (id) marcar(id, 'caminho');
    };
    raiz.addEventListener('mouseover', e => { const t = e.target.closest('.bracket-team[data-time]'); if (t) focar(t.dataset.time); });
    raiz.addEventListener('mouseleave', () => focar(null));
    raiz.addEventListener('focusin', e => {
      const m = e.target.closest('.bracket-match');
      const t = m && (m.querySelector('.bracket-team.vencedor[data-time]') || m.querySelector('.bracket-team[data-time]'));
      focar(t ? t.dataset.time : null);
    });
    raiz.addEventListener('focusout', e => { if (!raiz.contains(e.relatedTarget)) focar(null); });
  }

  function vazio(titulo, texto) {
    return `<div class="empty"><strong>${titulo}</strong>${texto || ''}</div>`;
  }

  return {
    montarTopbar, montarTicker, montarFooter,
    bandeira, bandeiraClube, bandeiraPais, nomePais, crestHtml, timeLink, avatar,
    badge, rotuloJogo, temPlacar, placarHtml, linhaJogo, linhaJogoCompacta, listaPorDia, formaRecente,
    tabelaGrupo, tabelaLiga, cartaoConfronto, legendaZonas, listaLideres, vazio, campinho, nomeCurto, rotuloTimes, iconeCampeonato,
    autoresResumo, animarNumeros, estiloCores,
    notaHtml, fotoJogador, jogadorNoCampo, campoGoogle, Favoritos, FavoritosJogadores, ligarBotaoFavorito, graficoLinha,
    graficoLinhas, graficoBarras, graficoRadar, corDoTime, escudoGerado, arquivoIcs, baixarIcs, proximosDoTime,
    icone, hidratarIcones, TemaTime, temaAtual, cartaJogador, destacarCaminhos,
  };
})();
