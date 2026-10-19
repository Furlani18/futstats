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

  const NAV = [
    ['inicio', 'index.html', 'Início'],
    ['partidas', 'partidas.html', 'Partidas'],
    ['grupos', 'grupos.html', 'Grupos'],
    ['chaveamento', 'chaveamento.html', 'Mata-mata'],
    ['estatisticas', 'estatisticas.html', 'Estatísticas'],
    ['premios', 'premios.html', 'Prêmios'],
    ['simulador', 'simulador.html', 'Simulador'],
    ['selecoes', 'selecoes.html', 'Seleções'],
  ];

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
      <div class="host-stripe"></div>
      <div class="topbar">
        <div class="topbar-inner">
          <a class="topbar-logo" href="index.html">
            <span class="logo-mark">⚽</span>FUT<span class="accent">STATS</span>
            <span class="logo-tag">Copa 2026</span>
          </a>
          <button type="button" class="search-btn" id="btn-busca" aria-label="Buscar jogador ou seleção" title="Buscar (Ctrl+K)">
            <span aria-hidden="true">⌕</span><span class="search-btn-txt">Buscar</span><kbd>Ctrl K</kbd>
          </button>
          <input type="checkbox" id="nav-toggle" class="nav-toggle-checkbox">
          <label for="nav-toggle" class="nav-toggle-btn" aria-label="Abrir menu">☰</label>
          <nav class="topbar-nav">
            ${NAV.map(([id, href, label]) => `<a href="${href}" class="${secao === id ? 'active' : ''}">${label}</a>`).join('')}
            <a href="login.html" class="nav-admin">Painel</a>
          </nav>
        </div>
      </div>`;
    ativarBusca();
  }

  // ---------- Busca global (jogadores e seleções) ----------
  const normalizar = texto => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function buscar(termo) {
    const t = normalizar(termo).trim();
    if (t.length < 2) return [];
    const times = DB.Times.all();
    const porId = Object.fromEntries(times.map(x => [x.id, x]));
    const resultados = [];
    times.forEach(time => {
      const alvo = normalizar(`${time.nome} ${time.codigo}`);
      if (alvo.includes(t)) resultados.push({ tipo: 'time', peso: alvo.startsWith(t) ? 0 : 1, time });
    });
    DB.Jogadores.all().forEach(jogador => {
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
        ${bandeira(r.time)}<span class="busca-txt"><b>${esc(r.time.nome)}</b><small>Seleção · Grupo ${r.time.grupo} · ${r.time.confederacao}</small></span></a>`;
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
    const largura = { sm: 40, '': 40, lg: 80, xl: 160 }[tamanho] || 40;
    const url = DB.Util.bandeiraUrl(time.iso, largura);
    if (!url) return `<span class="${classe} flag-fallback">${esc(time.codigo || DB.Util.iniciais(time.nome))}</span>`;
    return `<span class="${classe}"><img src="${url}" alt="" loading="lazy" onerror="this.remove()"></span>`;
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

  function avatar(jogador) {
    const num = jogador.numero != null ? `<span class="shirt-num">${jogador.numero}</span>` : '';
    return `<span class="avatar">${esc(DB.Util.iniciais(jogador.nome))}${num}</span>`;
  }

  // ---------- Jogos ----------
  function badge(status) {
    const ponto = status === 'ao_vivo' ? '<span class="live-dot"></span>' : '';
    return `<span class="badge badge-${status}">${ponto}${DB.Util.statusLabel(status)}</span>`;
  }

  function rotuloJogo(jogo) {
    if (jogo.fase === 'grupos') return `Grupo ${jogo.grupo}${jogo.rodada ? ` · ${jogo.rodada}ª rodada` : ''}`;
    return DB.Util.faseLabel(jogo.fase);
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

  function linhaJogo(jogo, opts = {}) {
    const m = DB.Times.get(jogo.mandanteId), v = DB.Times.get(jogo.visitanteId);
    const vencedor = jogo.status === 'encerrado' ? DB.MataMata.vencedor(jogo) : null;
    const hora = jogo.status === 'ao_vivo'
      ? '<span class="match-time live"><span class="live-dot"></span>AO VIVO</span>'
      : `<span class="match-time">${opts.comData ? DB.Util.formatarData(jogo.data).slice(0, 5) : DB.Util.formatarHora(jogo.data)}</span>`;
    const lado = (time, classe) => `
      <span class="match-side ${classe}${vencedor && time && vencedor !== time.id ? ' perdeu' : ''}">
        ${classe === 'home' ? `<span class="nome">${time ? esc(time.nome) : 'A definir'}</span>${bandeira(time)}` : `${bandeira(time)}<span class="nome">${time ? esc(time.nome) : 'A definir'}</span>`}
      </span>`;
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
    const terceiros = new Set(DB.Classificacao.terceiros().filter(t => t.classificado).map(t => t.timeId));
    const algumJogo = tabela.some(t => t.J > 0);
    const completa = !opts.compacta;
    const linhas = tabela.map(t => {
      const time = DB.Times.get(t.timeId);
      const zona = !algumJogo ? '' : t.posicao <= 2 ? `zona-${t.posicao}` : (t.posicao === 3 && terceiros.has(t.timeId)) ? 'zona-3' : '';
      return `<tr class="${zona}">
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
            <th>#</th><th class="left">Seleção</th><th>J</th>
            ${completa ? '<th>V</th><th>E</th><th>D</th><th>Gols</th>' : ''}
            <th>SG</th><th class="strong">Pts</th>
            ${opts.forma ? '<th>Últimos</th>' : ''}
          </tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>`;
  }

  function legendaZonas() {
    return `<div class="legend">
      <span><i style="background:var(--accent)"></i>Classificado aos 32avos</span>
      <span><i style="background:var(--blue)"></i>Entre os 8 melhores 3ºs</span>
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
        <span class="shirt">${j.numero ?? ''}${item.pts != null ? `<span class="pts">${item.pts}</span>` : ''}</span>
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
    bandeira, bandeiraClube, crestHtml, timeLink, avatar,
    badge, rotuloJogo, temPlacar, placarHtml, linhaJogo, linhaJogoCompacta, listaPorDia, formaRecente,
    tabelaGrupo, legendaZonas, listaLideres, vazio, campinho, nomeCurto,
  };
})();
