const UI = (() => {
  const esc = texto => DB.Util.escapar(texto);

  function paginaAtual() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  const SECOES = {
    'index.html': 'inicio',
    'partidas.html': 'partidas', 'jogo.html': 'partidas',
    'grupos.html': 'grupos',
    'chaveamento.html': 'chaveamento',
    'estatisticas.html': 'estatisticas', 'jogador.html': 'estatisticas',
    'selecoes.html': 'selecoes', 'time.html': 'selecoes',
    'premios.html': 'premios',
    'simulador.html': 'simulador',
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
      ['selecoes', 'selecoes.html', rotuloTimes()],
    ].filter(Boolean);
  }

  // "Seleções" na Copa, "Clubes" nos demais.
  function rotuloTimes(singular = false) {
    if (DB.Contexto.ehCopa()) return singular ? 'Seleção' : 'Seleções';
    return singular ? 'Clube' : 'Clubes';
  }

  // ---------- Seletor de campeonato ----------
  function iconeCampeonato(comp, tamanho = 'sm') {
    if (comp.iso) return `<span class="flag flag-${tamanho}"><img src="${DB.Util.bandeiraUrl(comp.iso, 40)}" alt="" loading="lazy" onerror="this.remove()"></span>`;
    return `<span class="comp-icone" aria-hidden="true">${comp.icone || '🏆'}</span>`;
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
        || (pagina === 'grupos.html' && DB.Contexto.tipo() === 'mata_mata');
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

  function montarTopbar() {
    const mount = document.getElementById('topbar-mount');
    if (!mount) return;
    ativarPreCarregamento();
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
            <span aria-hidden="true">⌕</span><span class="search-btn-txt">Buscar</span><kbd>Ctrl K</kbd>
          </button>
          <button type="button" class="theme-btn" id="btn-tema" aria-label="Alternar tema claro/escuro" title="Tema claro/escuro"></button>
          <input type="checkbox" id="nav-toggle" class="nav-toggle-checkbox">
          <label for="nav-toggle" class="nav-toggle-btn" aria-label="Abrir menu">☰</label>
          <nav class="topbar-nav">
            ${navDoCampeonato().map(([id, href, label]) => `<a href="${href}" class="${secao === id ? 'active' : ''}"${secao === id ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
            <a href="login.html" class="nav-admin">Painel</a>
          </nav>
        </div>
      </div>`;
    ativarBusca();
    ativarSeletor();
    ativarTema();
    montarBarraInferior(secao);
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

  function abrirBusca() {
    if (document.getElementById('busca-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'busca-overlay';
    overlay.className = 'busca-overlay';
    overlay.innerHTML = `
      <div class="busca-box" role="dialog" aria-label="Buscar">
        <input type="search" id="busca-input" placeholder="Buscar jogador, seleção ou clube…" autocomplete="off">
        <div class="busca-resultados" id="busca-resultados"><div class="busca-dica">Digite ao menos 2 letras. Ex.: <b>Vini</b>, <b>Japão</b>, <b>Real Madrid</b></div></div>
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
    document.getElementById('busca-overlay')?.remove();
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

  // ---------- Tema claro/escuro ----------
  function temaAtual() {
    const escolhido = document.documentElement.dataset.theme;
    if (escolhido) return escolhido;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function ativarTema() {
    const botao = document.getElementById('btn-tema');
    if (!botao) return;
    const atualizar = () => { botao.textContent = temaAtual() === 'light' ? '🌙' : '☀️'; };
    botao.addEventListener('click', () => {
      const novo = temaAtual() === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = novo;
      try { localStorage.setItem('fs_tema', novo); } catch (e) { /* sem armazenamento: vale só nesta página */ }
      atualizar();
    });
    atualizar();
  }

  // ---------- Barra de navegação inferior (celular) ----------
  const ICONES = {
    inicio: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    partidas: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 4.5h-5L8 10z"/>',
    grupos: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/>',
    estatisticas: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    mais: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    chaveamento: '<path d="M4 5h5v6H4zM4 13h5v6H4zM9 8h4v8h-4M13 12h7"/>',
  };
  const icone = id => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONES[id]}</svg>`;

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
      + `<label for="nav-toggle" class="${noMais ? 'active' : ''}">${icone('mais')}<span>Mais</span></label>`;
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
    const repeticoes = jogos.length < 6 ? 4 : 2;
    mount.innerHTML = `<div class="ticker"><div class="ticker-track">${itens.repeat(repeticoes)}</div></div>`;
  }

  function montarFooter() {
    const mount = document.getElementById('footer-mount');
    if (!mount) return;
    mount.innerHTML = `
      <div class="host-stripe"></div>
      <div class="footer">
        <div class="footer-inner">
          <span>© 2026 FUTSTATS · Copa do Mundo FIFA 2026 — EUA, México e Canadá</span>
          <div class="footer-links">
            <a href="partidas.html">Partidas</a>
            <a href="estatisticas.html">Estatísticas</a>
            <a href="premios.html">Prêmios</a>
            <a href="simulador.html">Simulador</a>
            <a href="selecoes.html">Seleções</a>
            <a href="login.html">Painel administrativo</a>
          </div>
        </div>
      </div>`;
  }

  // ---------- Bandeiras e times ----------
  function bandeira(time, tamanho = '') {
    const classe = `flag${tamanho ? ` flag-${tamanho}` : ''}`;
    if (!time) return `<span class="${classe}"></span>`;
    if (time.tipo === 'clube') {
      // Distintivo com a sigla nas cores do clube: usado quando não há escudo
      // ou enquanto/se a imagem do escudo não carregar.
      const c = DB.Util.coresTime(time);
      const distintivo = `<span class="${classe} crest" style="background:${c.primaria};color:${c.texto};box-shadow:inset 0 -3px 0 ${c.secundaria}, 0 0 0 1px var(--flag-ring);" title="${esc(time.nome)}">${esc(time.codigo || DB.Util.iniciais(time.nome))}</span>`;
      if (!time.escudo) return distintivo;
      return `<span class="${classe} crest-img" title="${esc(time.nome)}"><img src="${esc(time.escudo)}" alt="" loading="lazy" onerror="this.parentNode.outerHTML=this.parentNode.dataset.reserva" ></span>`
        .replace('class="', `data-reserva="${esc(distintivo)}" class="`);
    }
    const largura = { sm: 40, '': 40, lg: 80, xl: 160 }[tamanho] || 40;
    const url = DB.Util.bandeiraUrl(time.iso, largura);
    if (!url) return `<span class="${classe} flag-fallback">${esc(time.codigo || DB.Util.iniciais(time.nome))}</span>`;
    return `<span class="${classe}"><img src="${url}" alt="" loading="lazy" onerror="this.remove()"></span>`;
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
      let zona = '';
      if (algumJogo && ehCopa) zona = t.posicao <= 2 ? `zona-${t.posicao}` : (t.posicao === 3 && terceiros.has(t.timeId)) ? 'zona-3' : '';
      else if (algumJogo) { const z = zonasGrupo.find(x => t.posicao >= x.de && t.posicao <= x.ate); zona = z ? `zona-cor zona-${z.cor}` : ''; }
      return `<tr class="${zona}${opts.destaque === t.timeId ? ' destaque-time' : ''}">
        <td class="pos">${t.posicao}</td>
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
          <thead><tr>
            <th>#</th><th class="left">${rotuloTimes(true)}</th><th>J</th>
            ${completa ? '<th>V</th><th>E</th><th>D</th><th>Gols</th>' : ''}
            <th>SG</th><th class="strong">Pts</th>
            ${opts.forma ? '<th>Últimos</th>' : ''}
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
          <thead><tr>
            <th>#</th><th class="left">${rotuloTimes(true)}</th><th class="strong">Pts</th><th>J</th>
            ${completa ? '<th>V</th><th>E</th><th>D</th><th>Gols</th>' : ''}
            <th>SG</th>
            ${completa ? '<th title="Aproveitamento">%</th>' : ''}
            ${opts.forma ? '<th>Últimos</th>' : ''}
          </tr></thead>
          <tbody>${tabela.map(t => `
            <tr class="${algumJogo && t.zona ? `zona-cor zona-${t.zona.cor}` : ''}${opts.destaque === t.timeId ? ' destaque-time' : ''}"${algumJogo && t.zona ? ` title="${esc(t.zona.rotulo)}"` : ''}>
              <td class="pos">${t.posicao}</td>
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
      <div class="bracket-team ${classe(c.timeA)}">${bandeira(a, 'sm')}<span class="nome">${a ? esc(a.nome) : 'A definir'}</span><span class="gols">${c.comPlacar ? c.golsA : ''}</span></div>
      <div class="bracket-team ${classe(c.timeB)}">${bandeira(b, 'sm')}<span class="nome">${b ? esc(b.nome) : 'A definir'}</span><span class="gols">${c.comPlacar ? c.golsB : ''}</span></div>
      <div class="pernas">${pernas}${c.penaltis ? `<span class="perna">Pênaltis ${c.penaltis[0]}–${c.penaltis[1]}</span>` : ''}</div>
    </div>`;
  }

  // ---------- Rankings de jogadores ----------
  function linhaLider(l, i, campo, rotulo) {
    const time = DB.Times.get(l.jogador.timeId);
    const valor = campo === 'cartoes' ? `${l.amarelos}<small>🟨 ${l.vermelhos ? `· ${l.vermelhos} 🟥` : ''}</small>` : `${l[campo]}<small>${rotulo}</small>`;
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

  function vazio(titulo, texto) {
    return `<div class="empty"><strong>${titulo}</strong>${texto || ''}</div>`;
  }

  return {
    montarTopbar, montarTicker, montarFooter,
    bandeira, bandeiraClube, bandeiraPais, nomePais, crestHtml, timeLink, avatar,
    badge, rotuloJogo, temPlacar, placarHtml, linhaJogo, linhaJogoCompacta, listaPorDia, formaRecente,
    tabelaGrupo, tabelaLiga, cartaoConfronto, legendaZonas, listaLideres, vazio, campinho, nomeCurto, rotuloTimes, iconeCampeonato,
    autoresResumo, animarNumeros, estiloCores,
  };
})();
