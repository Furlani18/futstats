document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  DB.MataMata.sincronizar();

  const esc = DB.Util.escapar;
  const jogo = DB.Jogos.get(new URLSearchParams(window.location.search).get('id'));

  if (!jogo) {
    document.getElementById('hero-jogo').innerHTML = '<p style="grid-column:1/-1;text-align:center;">Jogo não encontrado.</p>';
    UI.montarFooter();
    return;
  }

  const mandante = DB.Times.get(jogo.mandanteId);
  const visitante = DB.Times.get(jogo.visitanteId);
  const nome = t => (t ? t.nome : 'A definir');
  const rotuloFase = UI.rotuloJogo(jogo);
  const linkFase = jogo.fase === 'grupos' ? `grupos.html#grupo-${jogo.grupo}` : 'chaveamento.html';

  document.getElementById('page-title').textContent = `${nome(mandante)} x ${nome(visitante)} — Copa 2026 — FUTSTATS`;
  document.getElementById('breadcrumb').innerHTML = `<a href="index.html">Início</a> / <a href="partidas.html">Partidas</a> / <a href="${linkFase}">${jogo.fase === 'grupos' ? `Grupo ${jogo.grupo}` : DB.Util.faseLabel(jogo.fase)}</a>`;
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
  ].join('');

  // ---------- Lateral ----------
  if (jogo.fase === 'grupos') {
    document.getElementById('titulo-lateral').textContent = `Grupo ${jogo.grupo}`;
    document.getElementById('link-lateral').href = `grupos.html#grupo-${jogo.grupo}`;
    document.getElementById('corpo-lateral').innerHTML = UI.tabelaGrupo(jogo.grupo, { compacta: true });
  } else {
    document.getElementById('titulo-lateral').textContent = 'Mata-mata';
    document.getElementById('link-lateral').href = 'chaveamento.html';
    document.getElementById('corpo-lateral').innerHTML = DB.Jogos.porFase(jogo.fase).map(UI.linhaJogoCompacta).join('');
  }

  // ---------- Navegação entre jogos da mesma fase/grupo ----------
  const relacionados = (jogo.fase === 'grupos' ? DB.Jogos.porGrupo(jogo.grupo) : DB.Jogos.porFase(jogo.fase))
    .sort((a, b) => new Date(a.data) - new Date(b.data));
  const i = relacionados.findIndex(j => j.id === jogo.id);
  const anterior = relacionados[i - 1], proximo = relacionados[i + 1];
  const confronto = j => `${nome(DB.Times.get(j.mandanteId))} x ${nome(DB.Times.get(j.visitanteId))}`;
  document.getElementById('nav-jogo').innerHTML = `
    ${anterior ? `<a href="jogo.html?id=${anterior.id}">◀ <span>${confronto(anterior)}</span></a>` : '<a class="disabled">◀ Jogo anterior</a>'}
    ${proximo ? `<a class="prox" href="jogo.html?id=${proximo.id}"><span>${confronto(proximo)}</span> ▶</a>` : '<a class="disabled prox">Próximo jogo ▶</a>'}`;

  UI.montarFooter();
});
