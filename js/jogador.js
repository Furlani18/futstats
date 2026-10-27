document.addEventListener('DOMContentLoaded', () => {
  const esc = DB.Util.escapar;
  const params = new URLSearchParams(window.location.search);
  const jogador = DB.Jogadores.get(params.get('id'));
  if (jogador && !params.get('c')) DB.Contexto.ajustarPara({ timeId: jogador.timeId });
  UI.montarTopbar();
  UI.montarTicker();
  const comp = DB.Contexto.get();
  if (!jogador) {
    document.getElementById('nome-jogador').textContent = 'Jogador não encontrado';
    UI.montarFooter();
    return;
  }

  const time = DB.Times.get(jogador.timeId);
  const s = DB.Estatisticas.doJogador(jogador.id);
  const pintarTopo = time => {
    const c = DB.Util.coresTime(time);
    const topo = document.querySelector('.page-hero');
    topo.classList.add('hero-time');
    topo.style.setProperty('--time-1', c.primaria);
    topo.style.setProperty('--time-2', c.secundaria);
  };
  pintarTopo(time);

  document.getElementById('page-title').textContent = `${jogador.nome} — ${comp.curto} ${comp.temporada} — FUTSTATS`;
  document.getElementById('breadcrumb').innerHTML = `<a href="index.html">Início</a> / <a href="time.html?id=${time.id}">${esc(time.nome)}</a> / <span>${esc(jogador.nome)}</span>`;
  document.getElementById('avatar-mount').innerHTML = `<span class="avatar" style="width:96px;height:96px;font-size:38px;${UI.estiloCores(jogador.timeId)}">${esc(DB.Util.iniciais(jogador.nome))}
    <span class="shirt-num" style="min-width:30px;height:30px;font-size:14px;border-radius:15px;">${jogador.numero ?? '–'}</span></span>`;
  document.getElementById('eyebrow-jogador').textContent = `${jogador.posicao}${jogador.capitao ? ' · Capitão' : ''}`;
  document.getElementById('nome-jogador').textContent = jogador.nome;
  document.getElementById('fatos-jogador').innerHTML = `
    <a class="fact" href="time.html?id=${time.id}">${UI.bandeira(time, 'sm')} <strong>${esc(time.nome)}</strong></a>
    ${jogador.clube ? `<span class="fact">${UI.bandeiraClube(jogador.clubePais)} <strong>${esc(jogador.clube)}</strong></span>` : ''}
    ${jogador.nacionalidade ? `<span class="fact">${UI.bandeiraPais(jogador.nacionalidade)} <strong>${esc(UI.nomePais(jogador.nacionalidade))}</strong></span>` : ''}
    ${jogador.idade != null ? `<span class="fact">Idade <strong>${jogador.idade}</strong></span>` : ''}
    <a class="fact fact-acao" href="comparar.html?a=${jogador.id}">${UI.icone('balanca')} <strong>Comparar</strong></a>`;

  UI.ligarBotaoFavorito(document.getElementById('btn-favorito'), UI.FavoritosJogadores, jogador.id, 'este jogador');
  const notaCarta = DB.Estatisticas.notasTemporada()[jogador.id];
  document.getElementById('carta-mount').innerHTML = UI.cartaJogador(jogador, { nota: notaCarta ? Math.round(notaCarta.media * 10) / 10 : null, linha: s, link: false });

  const tile = (l, v, classe = '') => `<div class="stat-tile ${classe}"><div class="v">${v}</div><div class="l">${l}</div></div>`;
  const nota = DB.Estatisticas.notasTemporada()[jogador.id];
  document.getElementById('tiles-jogador').innerHTML = [
    nota ? tile('Nota média', UI.notaHtml(Math.round(nota.media * 10) / 10, 'nota-grande'), 'nota') : '',
    tile('Jogos', s.jogos), tile('Minutos', s.minutos), tile('Titular', s.titular),
    tile('Gols', s.gols, 'gold'), tile('Assistências', s.assistencias, 'gold'), tile('Participações', s.participacoes),
    tile('De pênalti', s.penaltis), tile('Jogos com gol', s.jogosComGol), tile('Amarelos', s.amarelos), tile('Vermelhos', s.vermelhos),
  ].join('');

  // ---------- Gráficos: radar do perfil e notas jogo a jogo ----------
  const cor = UI.corDoTime(time);
  const perfil = DB.Estatisticas.perfil(jogador.id);
  const jogosComNota = DB.Jogos.doTime(jogador.timeId)
    .filter(j => j.status === 'encerrado')
    .map(j => ({ jogo: j, nota: DB.Estatisticas.notasDoJogo(j)[jogador.id] }))
    .filter(x => x.nota != null);
  // Mostra os painéis antes de desenhar: a largura do gráfico vem do contêiner visível.
  document.getElementById('graficos-jogador').hidden = !perfil && !jogosComNota.length;
  document.getElementById('painel-perfil').hidden = !perfil;
  document.getElementById('painel-notas').hidden = !jogosComNota.length;
  if (perfil) {
    const caixa = document.getElementById('grafico-perfil');
    caixa.innerHTML = UI.graficoRadar(perfil.eixos, [{ nome: jogador.nome, cor, valores: perfil.valores, textos: perfil.textos }],
      { tamanho: Math.min(340, Math.max(280, caixa.clientWidth - 28)) });
    const plural = { Goleiro: 'goleiros', Defensor: 'defensores', 'Meio-campo': 'meio-campistas', Atacante: 'atacantes' }[perfil.posicao];
    document.getElementById('nota-perfil').textContent = `Cada eixo vai de 0 ao melhor ${perfil.pares > 4 && plural ? `entre os ${perfil.pares} ${plural}` : `entre os ${perfil.pares} jogadores`} com participação no campeonato.`;
  }
  if (jogosComNota.length) {
    const faixa = n => (n >= 9 ? 'var(--blue)' : n >= 6.5 ? 'var(--accent)' : n >= 6 ? 'var(--yellow-card)' : '#ff8a3d');
    const caixa = document.getElementById('grafico-notas');
    const media = jogosComNota.reduce((s, x) => s + x.nota, 0) / jogosComNota.length;
    caixa.innerHTML = UI.graficoBarras(jogosComNota.map(({ jogo, nota }) => {
      const adv = DB.Times.get(jogo.mandanteId === jogador.timeId ? jogo.visitanteId : jogo.mandanteId);
      return { rotulo: adv ? adv.codigo : '?', valor: nota, cor: faixa(nota), titulo: `${nota.toFixed(1)} contra ${adv ? adv.nome : '?'} (${jogo.golsMandante}–${jogo.golsVisitante}) · ${DB.Util.formatarData(jogo.data)}` };
    }), { largura: caixa.clientWidth - 28, altura: 200, media, rotuloMedia: `média ${media.toFixed(2).replace('.', ',')}`, max: 10, formatar: v => String(v) });
    document.getElementById('resumo-notas').textContent = `${jogosComNota.length} jogo${jogosComNota.length > 1 ? 's' : ''}`;
  }
  if (comp.tipo === 'copa_mundo') document.getElementById('titulo-lances').textContent = 'Lances na Copa';

  const ROTULO = {
    gol: [UI.icone('bola'), 'Gol'], gol_contra: [UI.icone('bola', 'ico-contra'), 'Gol contra'], assistencia: [UI.icone('assistencia'), 'Assistência'],
    amarelo: ['<span class="card-icon"></span>', 'Cartão amarelo'],
    segundo_amarelo: ['<span class="card-icon second"></span>', 'Segundo amarelo'],
    vermelho: ['<span class="card-icon red"></span>', 'Cartão vermelho'],
  };
  document.getElementById('lances').innerHTML = s.lances.length ? s.lances.map(l => {
    const j = l.jogo;
    const m = DB.Times.get(j.mandanteId), v = DB.Times.get(j.visitanteId);
    const [icone, texto] = ROTULO[l.tipo];
    let extra = '';
    if (l.tipo === 'gol' && l.detalhe.assistenciaId) {
      const a = DB.Jogadores.get(l.detalhe.assistenciaId);
      if (a) extra = ` · assistência de ${esc(a.nome)}`;
    } else if (l.tipo === 'assistencia') {
      const autor = DB.Jogadores.get(l.detalhe.jogadorId);
      if (autor) extra = ` para ${esc(autor.nome)}`;
    }
    if (l.tipo === 'gol' && l.detalhe.tipo === 'penalti') extra = ` (pênalti)${extra}`;
    return `<a class="leader" href="jogo.html?id=${j.id}">
      <span class="tl-icon">${icone}</span>
      <span class="tl-min">${l.detalhe.minuto ? `${esc(l.detalhe.minuto)}'` : '–'}</span>
      <span class="info"><span class="nome">${texto}${extra}</span>
        <span class="sub">${UI.bandeira(m, 'sm')} ${m.codigo} ${j.golsMandante}–${j.golsVisitante} ${v.codigo} ${UI.bandeira(v, 'sm')} · ${UI.rotuloJogo(j)} · ${DB.Util.formatarData(j.data)}</span></span>
      <span></span>
    </a>`;
  }).join('') : UI.vazio('Nenhum lance registrado', 'Gols, assistências e cartões deste jogador aparecem aqui.');

  const linha = (rotulo, valor) => `<li><span>${rotulo}</span><span>${valor}</span></li>`;
  document.getElementById('info-jogador').innerHTML = [
    linha('Número', jogador.numero ?? '—'),
    linha('Posição', esc(jogador.posicao)),
    jogador.nascimento ? linha('Nascimento', DB.Util.formatarData(`${jogador.nascimento}T12:00`)) : '',
    jogador.nacionalidade ? linha('Nacionalidade', `${UI.bandeiraPais(jogador.nacionalidade)} ${esc(UI.nomePais(jogador.nacionalidade))}`) : '',
    time.tipo !== 'clube' ? linha('Jogos pela seleção*', jogador.jogosSelecao ?? '—') : '',
    time.tipo !== 'clube' ? linha('Gols pela seleção*', jogador.golsSelecao ?? '—') : '',
    linha('Técnico', esc(time.tecnico || '—')),
  ].join('') + (time.tipo !== 'clube' ? '<li><span style="font-size:11.5px;">* até a convocação final (02/06/2026)</span><span></span></li>' : '');

  UI.montarFooter();
});
