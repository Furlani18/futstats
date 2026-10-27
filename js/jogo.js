document.addEventListener('DOMContentLoaded', () => {
  const esc = DB.Util.escapar;
  const jogo = DB.Jogos.get(new URLSearchParams(window.location.search).get('id'));
  if (jogo) DB.Contexto.ajustarPara({ jogo });
  UI.montarTopbar();
  DB.MataMata.sincronizar();
  const comp = DB.Contexto.get();

  if (!jogo) {
    document.getElementById('hero-jogo').innerHTML = '<p style="grid-column:1/-1;text-align:center;">Jogo não encontrado.</p>';
    UI.montarFooter();
    return;
  }

  const mandante = DB.Times.get(jogo.mandanteId);
  const visitante = DB.Times.get(jogo.visitanteId);
  const nome = t => (t ? t.nome : 'A definir');
  const rotuloFase = UI.rotuloJogo(jogo);
  const linkFase = jogo.fase === 'grupos' ? `grupos.html#grupo-${jogo.grupo}` : jogo.fase === 'liga' ? 'grupos.html' : 'chaveamento.html';
  const rotuloMigalha = jogo.fase === 'grupos' ? `Grupo ${jogo.grupo}` : jogo.fase === 'liga' ? 'Classificação' : DB.Util.faseLabel(jogo.fase);

  document.getElementById('page-title').textContent = `${nome(mandante)} x ${nome(visitante)} — ${comp.curto} ${comp.temporada} — FUTSTATS`;
  document.getElementById('breadcrumb').innerHTML = `<a href="index.html">${esc(comp.curto)}</a> / <a href="partidas.html">Partidas</a> / <a href="${linkFase}">${rotuloMigalha}</a>`;
  document.getElementById('meta-jogo').innerHTML = `${rotuloFase} · ${DB.Util.formatarDiaLongo(jogo.data)} · ${DB.Util.formatarHora(jogo.data)}`;

  // ---------- Placar ----------
  const placar = UI.temPlacar(jogo)
    ? `${jogo.golsMandante} – ${jogo.golsVisitante}${jogo.penaltisMandante != null && jogo.penaltisVisitante != null
      ? `<span class="pen">pênaltis ${jogo.penaltisMandante}–${jogo.penaltisVisitante}</span>` : ''}`
    : 'vs';
  const ladoHero = t => (t
    ? `<a class="match-hero-team" href="time.html?id=${t.id}">${UI.bandeira(t, 'xl')}<span class="nome">${esc(t.nome)}</span></a>`
    : '<div class="match-hero-team"><span class="flag flag-xl"></span><span class="nome">A definir</span></div>');
  document.getElementById('hero-jogo').innerHTML = `
    ${ladoHero(mandante)}
    <div>
      <div class="match-hero-score${UI.temPlacar(jogo) ? '' : ' vs'}">${placar}</div>
      <div style="text-align:center;margin-top:8px;">${UI.badge(jogo.status)}</div>
    </div>
    ${ladoHero(visitante)}`;

  // ---------- Autores dos gols (resumo sob o placar) ----------
  const gols = [...(jogo.gols || [])].sort((a, b) => DB.Util.minutoNumero(a.minuto) - DB.Util.minutoNumero(b.minuto));
  const resumoAutores = timeId => {
    const porAutor = {};
    gols.filter(g => g.timeId === timeId).forEach(g => {
      const j = DB.Jogadores.get(g.jogadorId);
      const chave = g.jogadorId || 'x';
      const sufixo = g.tipo === 'penalti' ? ' (pên.)' : g.tipo === 'contra' ? ' (contra)' : '';
      (porAutor[chave] = porAutor[chave] || { nome: j ? j.nome : 'Gol', minutos: [] }).minutos.push(`${g.minuto ? `${g.minuto}'` : ''}${sufixo}`.trim() || '–');
    });
    return Object.values(porAutor).map(a => `${esc(a.nome)} ${a.minutos.join(', ')}`).join('<br>');
  };
  if (gols.length) {
    document.getElementById('autores').innerHTML = `
      <div class="home">${resumoAutores(jogo.mandanteId)}</div><div class="ball">${UI.icone('bola')}</div><div>${resumoAutores(jogo.visitanteId)}</div>`;
  }

  // ---------- Linha do tempo ----------
  const eventos = [
    ...gols.map(g => ({ ...g, evento: 'gol' })),
    ...(jogo.cartoes || []).map(c => ({ ...c, evento: 'cartao' })),
  ].sort((a, b) => DB.Util.minutoNumero(a.minuto) - DB.Util.minutoNumero(b.minuto));

  const ICONE_CARTAO = { amarelo: '<span class="card-icon"></span>', segundo_amarelo: '<span class="card-icon second"></span>', vermelho: '<span class="card-icon red"></span>' };
  const NOME_CARTAO = { amarelo: 'Cartão amarelo', segundo_amarelo: 'Segundo amarelo', vermelho: 'Cartão vermelho' };
  const linkJogador = j => (j ? `<a href="jogador.html?id=${j.id}">${esc(j.nome)}</a>` : 'Jogador não informado');

  function itemLinha(e) {
    const jogador = DB.Jogadores.get(e.jogadorId);
    let icone, titulo, detalhe;
    if (e.evento === 'gol') {
      icone = UI.icone('bola', e.tipo === 'contra' ? 'ico-contra' : '');
      titulo = linkJogador(jogador);
      const assist = e.assistenciaId ? DB.Jogadores.get(e.assistenciaId) : null;
      detalhe = e.tipo === 'contra' ? 'Gol contra'
        : e.tipo === 'penalti' ? 'Gol de pênalti'
        : assist ? `Assistência: ${linkJogador(assist)}` : 'Gol';
    } else {
      icone = ICONE_CARTAO[e.tipo] || ICONE_CARTAO.amarelo;
      titulo = linkJogador(jogador);
      detalhe = NOME_CARTAO[e.tipo] || 'Cartão';
    }
    // Gol contra aparece do lado do time beneficiado (o placar); cartão, do lado do time do jogador.
    const doMandante = e.timeId === jogo.mandanteId;
    const conteudo = (lado) => `<span class="tl-side ${lado}">
      ${lado === 'home' ? `<span class="txt"><b>${titulo}</b><small>${detalhe}</small></span><span class="tl-icon">${icone}</span>`
        : `<span class="tl-icon">${icone}</span><span class="txt"><b>${titulo}</b><small>${detalhe}</small></span>`}
    </span>`;
    return `<li class="tl-item">
      ${doMandante ? conteudo('home') : '<span></span>'}
      <span class="tl-min">${e.minuto ? `${esc(e.minuto)}'` : '–'}</span>
      ${doMandante ? '<span></span>' : conteudo('away')}
    </li>`;
  }

  document.getElementById('timeline').innerHTML = eventos.length
    ? `<ul class="timeline">${eventos.map(itemLinha).join('')}</ul>`
    : UI.vazio(jogo.status === 'agendado' ? 'A partida ainda não começou' : 'Nenhum lance cadastrado',
      jogo.status === 'agendado' ? '' : 'Gols, assistências e cartões aparecem aqui quando forem lançados no painel.');

  // ---------- Escalações (campinho + banco, no estilo do Google) ----------
  const minutos = DB.Estatisticas.minutosNoJogo(jogo);
  const notas = DB.Estatisticas.notasDoJogo(jogo);
  const ORDEM_LINHAS = ['Goleiro', 'Defensor', 'Meio-campo', 'Meia ofensivo', 'Atacante'];
  const POS_CURTA = { Goleiro: 'Goleiro', Defensor: 'Defensor', 'Meio-campo': 'Meio-campo', 'Meia ofensivo': 'Meia', Atacante: 'Atacante' };
  const esc_ = esc;

  // Ícones nos cantos da "foto": substituição, cartão, gol e assistência.
  function cantos(j, { saida = true } = {}) {
    const golsJ = gols.filter(x => x.jogadorId === j.id && x.tipo !== 'contra').length;
    const assist = gols.filter(x => x.assistenciaId === j.id && x.tipo !== 'contra').length;
    const cartoes = (jogo.cartoes || []).filter(c => c.jogadorId === j.id);
    const vermelho = cartoes.some(c => c.tipo !== 'amarelo');
    const p = minutos[j.id];
    const conta = n => (n > 1 ? `<b>${n}</b>` : '');
    return [
      saida && p && p.saiu != null ? `<span class="lu-ic lu-saiu" title="Substituído aos ${p.saiu}'">↓</span>` : '',
      cartoes.length ? `<span class="lu-ic lu-cartao${vermelho ? ' vermelho' : ''}" title="${vermelho ? 'Cartão vermelho' : 'Cartão amarelo'}"></span>` : '',
      golsJ ? `<span class="lu-ic lu-gol" title="${golsJ} gol${golsJ > 1 ? 's' : ''}">${UI.icone('bola')}${conta(golsJ)}</span>` : '',
      assist ? `<span class="lu-ic lu-assist" title="${assist} assistência${assist > 1 ? 's' : ''}">${UI.icone('chuteira')}${conta(assist)}</span>` : '',
    ].join('');
  }

  function campinhoTime(time, escTime) {
    const titulares = escTime.titulares.map(id => DB.Jogadores.get(id)).filter(Boolean);
    // Posição em que jogou nesta partida (definida no painel) ou a do cadastro.
    const posicaoNoJogo = j => (escTime.posicoes || {})[j.id] || j.posicao;
    const porLinha = pos => titulares.filter(j => posicaoNoJogo(j) === pos);
    const formacao = ['Defensor', 'Meio-campo', 'Meia ofensivo', 'Atacante'].map(pos => porLinha(pos).length).filter(Boolean).join('-');
    const notasTime = titulares.map(j => notas[j.id]).filter(n => n != null);
    const media = notasTime.length ? notasTime.reduce((s, n) => s + n, 0) / notasTime.length : null;
    const topo = `<div class="lu-topo">${UI.bandeira(time, 'sm')}<span class="lu-time">${esc_(time.nome)}</span>
      ${media != null ? `<span class="lu-media" title="Nota média dos titulares">${UI.notaHtml(Math.round(media * 10) / 10)}</span>` : ''}
      ${formacao ? `<span class="lu-formacao">${formacao}</span>` : ''}</div>`;
    return UI.campoGoogle(ORDEM_LINHAS.map(pos => porLinha(pos).map(j => UI.jogadorNoCampo(j, { cantos: cantos(j), nota: notas[j.id] }))), topo);
  }

  // Banco: quem entrou (com o minuto) e depois quem não saiu do banco.
  function bancoTime(time, escTime) {
    const subs = [...(escTime.substituicoes || [])].sort((a, b) => DB.Util.minutoNumero(a.minuto) - DB.Util.minutoNumero(b.minuto));
    const entraram = subs.map(s => ({ jogador: DB.Jogadores.get(s.entraId), sub: s })).filter(x => x.jogador);
    const idsEntraram = new Set(entraram.map(x => x.jogador.id));
    const naoUsados = DB.Jogadores.all()
      .filter(j => j.timeId === time.id && !escTime.titulares.includes(j.id) && !idsEntraram.has(j.id))
      .sort((a, b) => (a.numero ?? 99) - (b.numero ?? 99))
      .map(j => ({ jogador: j }));
    return [...entraram, ...naoUsados].map(({ jogador: j, sub }) => {
      const saiu = sub && DB.Jogadores.get(sub.saiId);
      const detalhe = sub
        ? `<span class="lu-entrou" title="${saiu ? `Entrou no lugar de ${esc_(saiu.nome)}` : 'Entrou'}"><span class="lu-seta">↑</span>${sub.minuto ? `${esc_(sub.minuto)}'` : ''}${saiu ? `<span class="lu-lugar"> · ${esc_(UI.nomeCurto(saiu.nome))}</span>` : ''}</span>`
        : `<span class="lu-pos">${POS_CURTA[j.posicao] || esc_(j.posicao || '')}${j.numero != null ? ` nº${j.numero}` : ''}</span>`;
      return `<a class="lu-reserva" href="jogador.html?id=${j.id}">
        ${UI.fotoJogador(j, { cantos: cantos(j, { saida: false }), nota: sub ? notas[j.id] : null })}
        <span class="lu-info"><span class="lu-rnome">${esc_(j.nome)}</span>${detalhe}</span>
      </a>`;
    });
  }

  const comEscalacao = [mandante, visitante].filter(t => t && ((jogo.escalacoes || {})[t.id]?.titulares || []).length);
  if (comEscalacao.length) {
    document.getElementById('painel-escalacoes').hidden = false;
    document.getElementById('escalacoes').innerHTML = comEscalacao.map((t, i) =>
      `<div class="lu-painel" data-time="${t.id}" role="tabpanel" ${i ? 'hidden' : ''}>${campinhoTime(t, jogo.escalacoes[t.id])}</div>`).join('');
    const abas = document.getElementById('abas-escalacoes');
    if (comEscalacao.length > 1) {
      abas.innerHTML = comEscalacao.map((t, i) =>
        `<button type="button" class="lu-aba${i ? '' : ' ativa'}" role="tab" aria-selected="${!i}" data-time="${t.id}">${UI.bandeira(t, 'sm')}<span>${esc_(t.codigo || t.nome)}</span></button>`).join('');
      const ativar = aba => {
        abas.querySelectorAll('.lu-aba').forEach(b => { b.classList.toggle('ativa', b === aba); b.setAttribute('aria-selected', b === aba); b.tabIndex = b === aba ? 0 : -1; });
        document.querySelectorAll('.lu-painel').forEach(p => { p.hidden = p.dataset.time !== aba.dataset.time; });
      };
      abas.querySelectorAll('.lu-aba').forEach((b, i) => { b.tabIndex = i ? -1 : 0; });
      abas.addEventListener('click', e => {
        const aba = e.target.closest('.lu-aba');
        if (aba) ativar(aba);
      });
      // Padrão de abas: setas esquerda/direita trocam de time.
      abas.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const lista = [...abas.querySelectorAll('.lu-aba')];
        const atual = lista.indexOf(document.activeElement);
        const proxima = lista[(atual + (e.key === 'ArrowRight' ? 1 : -1) + lista.length) % lista.length];
        ativar(proxima);
        proxima.focus();
        e.preventDefault();
      });
    }

    // Banco lado a lado: mandante à esquerda, visitante à direita (espelhado).
    const colunas = [mandante, visitante].map(t => (t && (jogo.escalacoes || {})[t.id] ? bancoTime(t, jogo.escalacoes[t.id]) : []));
    const total = Math.max(colunas[0].length, colunas[1].length);
    if (total) {
      document.getElementById('painel-banco').hidden = false;
      document.getElementById('banco').innerHTML = `
        <div class="lu-banco-topo">${mandante ? UI.bandeira(mandante, 'sm') : '<span></span>'}<span class="panel-title">Banco</span>${visitante ? UI.bandeira(visitante, 'sm') : '<span></span>'}</div>
        <div class="lu-banco">${Array.from({ length: total }, (_, i) => `
          <div class="lu-banco-linha">
            <div class="lu-lado">${colunas[0][i] || ''}</div>
            <div class="lu-lado direita">${colunas[1][i] || ''}</div>
          </div>`).join('')}
        </div>`;
    }
  }

  // ---------- Estatísticas da partida (barras comparativas) ----------
  const est = jogo.estatisticas || {};
  const contaCartoes = (timeId, amarelo) => (jogo.cartoes || []).filter(c => c.timeId === timeId && (amarelo ? c.tipo === 'amarelo' : c.tipo !== 'amarelo')).length;
  const linhasEst = [
    ['posse', 'Posse de bola', '%'],
    ['finalizacoes', 'Finalizações'],
    ['noAlvo', 'Finalizações no alvo'],
    ['escanteios', 'Escanteios'],
    ['faltas', 'Faltas'],
    ['impedimentos', 'Impedimentos'],
    ['defesas', 'Defesas do goleiro'],
  ].filter(([k]) => Array.isArray(est[k]) && est[k].some(v => v != null && v !== ''))
    .map(([k, rotulo, sufixo = '']) => [rotulo, Number(est[k][0]) || 0, Number(est[k][1]) || 0, sufixo]);
  if (linhasEst.length) {
    linhasEst.push(['Cartões amarelos', contaCartoes(jogo.mandanteId, true), contaCartoes(jogo.visitanteId, true), '']);
    const vm = contaCartoes(jogo.mandanteId, false), vv = contaCartoes(jogo.visitanteId, false);
    if (vm || vv) linhasEst.push(['Cartões vermelhos', vm, vv, '']);
  }
  if (linhasEst.length && mandante && visitante) {
    const corM = DB.Util.coresTime(mandante).primaria;
    const corV = DB.Util.coresTime(visitante).primaria;
    // Times com a mesma cor principal: o visitante usa a secundária.
    const corV2 = corV.toLowerCase() === corM.toLowerCase() ? DB.Util.coresTime(visitante).secundaria : corV;
    document.getElementById('painel-estatisticas').hidden = false;
    document.getElementById('estatisticas-jogo').innerHTML = `
      <div class="est-cabeca">${UI.timeLink(mandante)}${UI.timeLink(visitante)}</div>
      ${linhasEst.map(([rotulo, a, b, suf]) => {
        const total = a + b;
        const pa = total ? (a / total) * 100 : 50;
        return `<div class="est-linha">
          <div class="est-valores"><b class="${a > b ? 'lider' : ''}" style="--c:${corM}">${a}${suf}</b><span>${rotulo}</span><b class="${b > a ? 'lider' : ''}" style="--c:${corV2}">${b}${suf}</b></div>
          <div class="est-barras"><span class="est-barra" style="width:${pa}%;background:${corM}"></span><span class="est-barra" style="width:${100 - pa}%;background:${corV2}"></span></div>
        </div>`;
      }).join('')}`;
  }

  // ---------- Forma recente e confronto direto ----------
  if (mandante && visitante) {
    const formaDe = time => DB.Jogos.doTime(time.id)
      .filter(j => j.status === 'encerrado' && j.id !== jogo.id && new Date(j.data) <= new Date(jogo.data))
      .slice(-5)
      .map(j => {
        const casa = j.mandanteId === time.id;
        const pro = casa ? j.golsMandante : j.golsVisitante;
        const contra = casa ? j.golsVisitante : j.golsMandante;
        const r = pro > contra ? 'V' : pro < contra ? 'D' : 'E';
        const adv = DB.Times.get(casa ? j.visitanteId : j.mandanteId);
        return `<a class="forma-pill forma-${r}" href="jogo.html?id=${j.id}" title="${pro}–${contra} ${casa ? 'x' : '@'} ${esc(adv ? adv.nome : '')}">${r}</a>`;
      }).join('');
    const fm = formaDe(mandante), fv = formaDe(visitante);
    // Só os encontros anteriores a este jogo.
    const h2h = DB.Estatisticas.confrontoDireto(mandante.id, visitante.id);
    const anteriores = h2h.jogos.filter(j => j.id !== jogo.id && new Date(j.data) <= new Date(jogo.data));
    let vA = 0, vB = 0, emp = 0;
    anteriores.forEach(j => {
      const ga = j.mandanteId === mandante.id ? j.golsMandante : j.golsVisitante;
      const gb = j.mandanteId === mandante.id ? j.golsVisitante : j.golsMandante;
      if (ga > gb) vA++; else if (gb > ga) vB++; else emp++;
    });
    const corA = DB.Util.coresTime(mandante).primaria, corB = DB.Util.coresTime(visitante).primaria;
    const resumoH2h = anteriores.length
      ? `<div class="h2h-placar">
          <div><b>${vA}</b><span>${esc(mandante.nome)}</span></div>
          <div><b>${emp}</b><span>Empates</span></div>
          <div><b>${vB}</b><span>${esc(visitante.nome)}</span></div>
        </div>
        <div class="h2h-barra"><span style="flex:${vA};background:${corA}"></span><span style="flex:${emp};background:var(--text-faint)"></span><span style="flex:${vB};background:${corB}"></span></div>
        <div class="match-list">${anteriores.slice(0, 5).map(UI.linhaJogoCompacta).join('')}</div>`
      : '<div class="h2h-vazio">Nenhum encontro anterior cadastrado entre os dois.</div>';
    document.getElementById('painel-h2h').hidden = false;
    document.getElementById('corpo-h2h').innerHTML = `
      ${fm || fv ? `<div class="h2h-titulo">Últimos jogos</div>
      <div class="h2h-forma">
        <div class="h2h-forma-time">${UI.bandeira(mandante, 'sm')}<span>${esc(mandante.nome)}</span><div class="forma-pills">${fm || '<small>—</small>'}</div></div>
        <div class="h2h-forma-time">${UI.bandeira(visitante, 'sm')}<span>${esc(visitante.nome)}</span><div class="forma-pills">${fv || '<small>—</small>'}</div></div>
      </div>` : ''}
      <div class="h2h-titulo">Confronto direto</div>
      ${resumoH2h}`;
  }

  // ---------- Compartilhar ----------
  if (mandante && visitante && typeof Compartilhar !== 'undefined') {
    document.getElementById('compartilhar').innerHTML = `
      <button type="button" class="btn btn-ghost" id="btn-imagem">${UI.icone('camera')} ${UI.temPlacar(jogo) ? 'Compartilhar resultado' : 'Compartilhar jogo'}</button>`;
    document.getElementById('btn-imagem').addEventListener('click', async (e) => {
      const botao = e.currentTarget;
      botao.disabled = true;
      try { await Compartilhar.jogo(jogo); } finally { botao.disabled = false; }
    });
  }

  // ---------- Reviver a partida: relógio, placar e lances minuto a minuto ----------
  if (mandante && visitante && jogo.status === 'encerrado' && UI.temPlacar(jogo)) {
    document.getElementById('compartilhar').insertAdjacentHTML('afterbegin',
      `<button type="button" class="btn btn-ghost" id="btn-reviver">${UI.icone('play')} Reviver ao vivo</button>`);
    document.getElementById('btn-reviver').addEventListener('click', reviverPartida);
  }

  function reviverPartida() {
    const hero = document.getElementById('hero-jogo');
    const placarEl = hero.querySelector('.match-hero-score');
    const badgeEl = hero.querySelector('.badge');
    const timeline = document.getElementById('timeline');
    const botao = document.getElementById('btn-reviver');
    const original = { placar: placarEl.innerHTML, badge: badgeEl.outerHTML, timeline: timeline.innerHTML, autores: document.getElementById('autores').innerHTML };
    const duracao = jogo.prorrogacao ? 120 : 90;
    const nomeJ = id => { const j = DB.Jogadores.get(id); return j ? esc(j.nome) : 'Jogador'; };

    // Lances com o minuto em número (acréscimo vira fração: 45+2 → 45,02); sem minuto, no apito final.
    const lances = [
      ...gols.map(g => ({ min: DB.Util.minutoNumero(g.minuto), tipo: 'gol', e: g })),
      ...(jogo.cartoes || []).map(c => ({ min: DB.Util.minutoNumero(c.minuto), tipo: 'cartao', e: c })),
      ...Object.entries(jogo.escalacoes || {}).flatMap(([timeId, esc_]) => (esc_.substituicoes || []).map(s => ({ min: DB.Util.minutoNumero(s.minuto), tipo: 'sub', e: { ...s, timeId } }))),
      { min: 45.99, tipo: 'apito', texto: 'Fim do primeiro tempo' },
      ...(jogo.prorrogacao ? [{ min: 90.99, tipo: 'apito', texto: 'Fim do tempo normal · prorrogação' }] : []),
    ].map(l => ({ ...l, min: l.min >= 999 ? duracao + 0.98 : l.min })).sort((a, b) => a.min - b.min);

    let placar = [0, 0], minuto = 0, i = 0, velocidade = 1, pausado = false, relogio = null;
    placarEl.classList.remove('vs');
    badgeEl.outerHTML = '<span class="badge badge-ao_vivo" id="badge-replay"><span class="live-dot"></span><span id="relogio-replay">0\'</span></span>';
    document.getElementById('autores').innerHTML = '';
    timeline.innerHTML = `<div class="replay-barra">
        <button type="button" class="btn btn-ghost" id="replay-pausa" aria-label="Pausar">${UI.icone('pausa')}</button>
        <div class="replay-trilho" aria-hidden="true"><span id="replay-progresso"></span></div>
        <button type="button" class="btn btn-ghost" id="replay-vel" title="Velocidade">1×</button>
        <button type="button" class="btn btn-ghost" id="replay-fim">Pular ${UI.icone('avancar')}</button>
      </div>
      <ul class="timeline replay-feed" id="replay-feed" aria-live="polite"></ul>`;
    botao.disabled = true;
    const feed = document.getElementById('replay-feed');
    const desenharPlacar = (animar) => {
      placarEl.innerHTML = `${placar[0]} – ${placar[1]}`;
      if (animar) { placarEl.classList.remove('gol-anim'); void placarEl.offsetWidth; placarEl.classList.add('gol-anim'); }
    };
    desenharPlacar(false);

    const mostrar = l => {
      let html;
      if (l.tipo === 'apito') html = `<li class="replay-apito">${UI.icone('relogio')} ${l.texto}</li>`;
      else if (l.tipo === 'sub') {
        const lado = l.e.timeId === jogo.mandanteId ? 'home' : 'away';
        const txt = `<span class="txt"><b>${nomeJ(l.e.entraId)}</b><small>Entrou no lugar de ${nomeJ(l.e.saiId)}</small></span>`;
        const ic = `<span class="tl-icon">${UI.icone('trocar')}</span>`;
        html = `<li class="tl-item">${lado === 'home' ? `<span class="tl-side home">${txt}${ic}</span>` : '<span></span>'}<span class="tl-min">${esc(l.e.minuto || '')}'</span>${lado === 'away' ? `<span class="tl-side away">${ic}${txt}</span>` : '<span></span>'}</li>`;
      } else {
        html = itemLinha({ ...l.e, evento: l.tipo === 'gol' ? 'gol' : 'cartao' });
        if (l.tipo === 'gol') {
          placar[l.e.timeId === jogo.mandanteId ? 0 : 1]++;
          desenharPlacar(true);
          html = html.replace('class="tl-item"', 'class="tl-item replay-gol"');
        }
      }
      feed.insertAdjacentHTML('afterbegin', html);
    };

    function terminar() {
      clearInterval(relogio);
      while (i < lances.length) mostrar(lances[i++]);
      placarEl.innerHTML = original.placar;
      document.getElementById('badge-replay').outerHTML = original.badge;
      document.getElementById('autores').innerHTML = original.autores;
      feed.insertAdjacentHTML('afterbegin', `<li class="replay-apito">${UI.icone('relogio')} Fim de jogo</li>`);
      document.querySelector('.replay-barra').outerHTML = `<div class="replay-barra"><button type="button" class="btn btn-ghost" id="replay-voltar">${UI.icone('voltar')} Voltar ao lance a lance</button></div>`;
      document.getElementById('replay-voltar').addEventListener('click', () => { timeline.innerHTML = original.timeline; });
      botao.disabled = false;
      botao.innerHTML = `${UI.icone('repetir')} Reviver de novo`;
    }

    // 1 minuto de jogo = 160 ms (90' em ~15 s) na velocidade 1×.
    const tick = () => {
      if (pausado) return;
      minuto += 1;
      while (i < lances.length && lances[i].min < minuto) mostrar(lances[i++]);
      const shown = Math.min(Math.floor(minuto), duracao);
      document.getElementById('relogio-replay').textContent = `${shown}'`;
      document.getElementById('replay-progresso').style.width = `${(minuto / (duracao + 1)) * 100}%`;
      if (minuto > duracao) terminar();
    };
    const iniciar = () => { clearInterval(relogio); relogio = setInterval(tick, 160 / velocidade); };
    document.getElementById('replay-pausa').addEventListener('click', e => {
      pausado = !pausado;
      e.currentTarget.innerHTML = UI.icone(pausado ? 'play' : 'pausa');
      e.currentTarget.setAttribute('aria-label', pausado ? 'Continuar' : 'Pausar');
    });
    document.getElementById('replay-vel').addEventListener('click', e => {
      velocidade = velocidade === 1 ? 2 : velocidade === 2 ? 4 : 1;
      e.currentTarget.textContent = `${velocidade}×`;
      iniciar();
    });
    document.getElementById('replay-fim').addEventListener('click', terminar);
    document.querySelector('.match-hero').scrollIntoView({ behavior: 'smooth', block: 'start' });
    iniciar();
  }

  // ---------- Agregado (mata-mata de ida e volta) ----------
  const confrontoDoJogo = !DB.Contexto.ehCopa() && !['liga', 'grupos'].includes(jogo.fase)
    ? DB.MataMata.confrontos(jogo.fase).find(c => c.jogos.some(j => j.id === jogo.id)) : null;
  const agregado = confrontoDoJogo && confrontoDoJogo.pernas === 2 && confrontoDoJogo.comPlacar
    ? `${DB.Times.get(confrontoDoJogo.timeA).codigo} ${confrontoDoJogo.golsA}–${confrontoDoJogo.golsB} ${DB.Times.get(confrontoDoJogo.timeB).codigo}${
      confrontoDoJogo.vencedor ? ` · classificado: ${esc(DB.Times.get(confrontoDoJogo.vencedor).nome)}` : ''}`
    : '';

  // ---------- Informações ----------
  const cartoesDe = (timeId, tipo) => (jogo.cartoes || []).filter(c => c.timeId === timeId && (tipo === 'amarelo' ? c.tipo === 'amarelo' : c.tipo !== 'amarelo')).length;
  const linha = (rotulo, valor) => `<li><span>${rotulo}</span><span>${valor}</span></li>`;
  document.getElementById('info-jogo').innerHTML = [
    linha('Competição', DB.Torneio.nome),
    linha('Fase', rotuloFase),
    linha('Data', `${DB.Util.formatarData(jogo.data)} · ${DB.Util.formatarHora(jogo.data)} (Brasília)`),
    linha('Estádio', esc(jogo.local || '—')),
    (jogo.cartoes || []).length ? linha('Cartões', `${mandante ? mandante.codigo : ''} ${cartoesDe(jogo.mandanteId, 'amarelo')}<span class="card-icon" title="Amarelos"></span> ${cartoesDe(jogo.mandanteId, 'vermelho')}<span class="card-icon red" title="Vermelhos"></span> · ${visitante ? visitante.codigo : ''} ${cartoesDe(jogo.visitanteId, 'amarelo')}<span class="card-icon" title="Amarelos"></span> ${cartoesDe(jogo.visitanteId, 'vermelho')}<span class="card-icon red" title="Vermelhos"></span>`) : '',
    jogo.projetado ? linha('Confronto', 'Projetado — pode mudar') : '',
    agregado ? linha('Agregado', agregado) : '',
  ].join('');

  // ---------- Lateral ----------
  if (jogo.fase === 'liga') {
    document.getElementById('titulo-lateral').textContent = 'Classificação';
    document.getElementById('link-lateral').href = 'grupos.html';
    document.getElementById('corpo-lateral').innerHTML = UI.tabelaLiga({ compacta: true, limite: comp.tipo === 'champions' ? 36 : 20 });
  } else if (confrontoDoJogo) {
    document.getElementById('titulo-lateral').textContent = DB.Util.faseLabel(jogo.fase);
    document.getElementById('link-lateral').href = 'chaveamento.html';
    document.getElementById('corpo-lateral').innerHTML = `<div style="padding:14px 18px;">${UI.cartaoConfronto(confrontoDoJogo)}</div>`;
  } else if (jogo.fase === 'grupos') {
    document.getElementById('titulo-lateral').textContent = `Grupo ${jogo.grupo}`;
    document.getElementById('link-lateral').href = `grupos.html#grupo-${jogo.grupo}`;
    document.getElementById('corpo-lateral').innerHTML = UI.tabelaGrupo(jogo.grupo, { compacta: true });
  } else {
    document.getElementById('titulo-lateral').textContent = 'Mata-mata';
    document.getElementById('link-lateral').href = 'chaveamento.html';
    document.getElementById('corpo-lateral').innerHTML = DB.Jogos.porFase(jogo.fase).map(UI.linhaJogoCompacta).join('');
  }

  // ---------- Navegação entre jogos da mesma fase/grupo ----------
  const relacionados = (jogo.fase === 'grupos' ? DB.Jogos.porGrupo(jogo.grupo)
    : jogo.fase === 'liga' ? DB.Jogos.all().filter(j => j.fase === 'liga' && j.rodada === jogo.rodada) : DB.Jogos.porFase(jogo.fase))
    .sort((a, b) => new Date(a.data) - new Date(b.data));
  const i = relacionados.findIndex(j => j.id === jogo.id);
  const anterior = relacionados[i - 1], proximo = relacionados[i + 1];
  const confronto = j => `${nome(DB.Times.get(j.mandanteId))} x ${nome(DB.Times.get(j.visitanteId))}`;
  document.getElementById('nav-jogo').innerHTML = `
    ${anterior ? `<a href="jogo.html?id=${anterior.id}">◀ <span>${confronto(anterior)}</span></a>` : '<a class="disabled">◀ Jogo anterior</a>'}
    ${proximo ? `<a class="prox" href="jogo.html?id=${proximo.id}"><span>${confronto(proximo)}</span> ▶</a>` : '<a class="disabled prox">Próximo jogo ▶</a>'}`;

  UI.montarFooter();
});
