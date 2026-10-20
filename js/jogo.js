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
      <div class="home">${resumoAutores(jogo.mandanteId)}</div><div class="ball">⚽</div><div>${resumoAutores(jogo.visitanteId)}</div>`;
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
      icone = '⚽';
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
  const ORDEM_LINHAS = ['Goleiro', 'Defensor', 'Meio-campo', 'Meia ofensivo', 'Atacante'];
  const POS_CURTA = { Goleiro: 'Goleiro', Defensor: 'Defensor', 'Meio-campo': 'Meio-campo', 'Meia ofensivo': 'Meia', Atacante: 'Atacante' };
  const esc_ = esc;

  // Foto do jogador: iniciais nas cores do time, com ícones de gol, assistência, cartão e substituição nos cantos.
  function fotoJogador(j, { saida = true } = {}) {
    const golsJ = gols.filter(x => x.jogadorId === j.id && x.tipo !== 'contra').length;
    const assist = gols.filter(x => x.assistenciaId === j.id && x.tipo !== 'contra').length;
    const cartoes = (jogo.cartoes || []).filter(c => c.jogadorId === j.id);
    const vermelho = cartoes.some(c => c.tipo !== 'amarelo');
    const p = minutos[j.id];
    const conta = n => (n > 1 ? `<b>${n}</b>` : '');
    return `<span class="lu-foto" style="${UI.estiloCores(j.timeId)}">${esc_(DB.Util.iniciais(j.nome))}
      ${saida && p && p.saiu != null ? `<span class="lu-ic lu-saiu" title="Substituído aos ${p.saiu}'">↓</span>` : ''}
      ${cartoes.length ? `<span class="lu-ic lu-cartao${vermelho ? ' vermelho' : ''}" title="${vermelho ? 'Cartão vermelho' : 'Cartão amarelo'}"></span>` : ''}
      ${golsJ ? `<span class="lu-ic lu-gol" title="${golsJ} gol${golsJ > 1 ? 's' : ''}">⚽${conta(golsJ)}</span>` : ''}
      ${assist ? `<span class="lu-ic lu-assist" title="${assist} assistência${assist > 1 ? 's' : ''}">👟${conta(assist)}</span>` : ''}
    </span>`;
  }

  function campinhoTime(time, escTime) {
    const titulares = escTime.titulares.map(id => DB.Jogadores.get(id)).filter(Boolean);
    // Posição em que jogou nesta partida (definida no painel) ou a do cadastro.
    const posicaoNoJogo = j => (escTime.posicoes || {})[j.id] || j.posicao;
    const porLinha = pos => titulares.filter(j => posicaoNoJogo(j) === pos);
    const formacao = ['Defensor', 'Meio-campo', 'Meia ofensivo', 'Atacante'].map(pos => porLinha(pos).length).filter(Boolean).join('-');
    const jogadorHtml = j => `<a class="lu-jogador" href="jogador.html?id=${j.id}" title="${esc_(j.nome)}">
      ${fotoJogador(j)}
      <span class="lu-nome">${j.numero != null ? `${j.numero} ` : ''}${esc_(UI.nomeCurto(j.nome))}</span>
    </a>`;
    const linhas = ORDEM_LINHAS.map(porLinha).filter(l => l.length);
    return `
      <div class="lu-topo">${UI.bandeira(time, 'sm')}<span class="lu-time">${esc_(time.nome)}</span>${formacao ? `<span class="lu-formacao">${formacao}</span>` : ''}</div>
      <div class="lu-campo">
        <span class="lu-area" aria-hidden="true"></span><span class="lu-pequena" aria-hidden="true"></span><span class="lu-meia-lua" aria-hidden="true"></span><span class="lu-circulo" aria-hidden="true"></span>
        ${linhas.map(l => `<div class="lu-linha">${l.map(jogadorHtml).join('')}</div>`).join('')}
      </div>`;
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
        ${fotoJogador(j, { saida: false })}
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
      abas.addEventListener('click', e => {
        const aba = e.target.closest('.lu-aba');
        if (!aba) return;
        abas.querySelectorAll('.lu-aba').forEach(b => { b.classList.toggle('ativa', b === aba); b.setAttribute('aria-selected', b === aba); });
        document.querySelectorAll('.lu-painel').forEach(p => { p.hidden = p.dataset.time !== aba.dataset.time; });
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

  // ---------- Compartilhar ----------
  if (mandante && visitante && typeof Compartilhar !== 'undefined') {
    document.getElementById('compartilhar').innerHTML = `
      <button type="button" class="btn btn-ghost" id="btn-imagem">📷 ${UI.temPlacar(jogo) ? 'Compartilhar resultado' : 'Compartilhar jogo'}</button>`;
    document.getElementById('btn-imagem').addEventListener('click', async (e) => {
      const botao = e.currentTarget;
      botao.disabled = true;
      try { await Compartilhar.jogo(jogo); } finally { botao.disabled = false; }
    });
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
    (jogo.cartoes || []).length ? linha('Cartões', `${mandante ? mandante.codigo : ''} ${cartoesDe(jogo.mandanteId, 'amarelo')}🟨 ${cartoesDe(jogo.mandanteId, 'vermelho')}🟥 · ${visitante ? visitante.codigo : ''} ${cartoesDe(jogo.visitanteId, 'amarelo')}🟨 ${cartoesDe(jogo.visitanteId, 'vermelho')}🟥`) : '',
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
