document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();

  const esc = DB.Util.escapar;
  const jogador = DB.Jogadores.get(new URLSearchParams(window.location.search).get('id'));
  if (!jogador) {
    document.getElementById('nome-jogador').textContent = 'Jogador não encontrado';
    UI.montarFooter();
    return;
  }

  const time = DB.Times.get(jogador.timeId);
  const s = DB.Estatisticas.doJogador(jogador.id);

  document.getElementById('page-title').textContent = `${jogador.nome} — Copa 2026 — FUTSTATS`;
  document.getElementById('breadcrumb').innerHTML = `<a href="index.html">Início</a> / <a href="time.html?id=${time.id}">${esc(time.nome)}</a> / <span>${esc(jogador.nome)}</span>`;
  document.getElementById('avatar-mount').innerHTML = `<span class="avatar" style="width:96px;height:96px;font-size:38px;">${esc(DB.Util.iniciais(jogador.nome))}
    <span class="shirt-num" style="min-width:30px;height:30px;font-size:14px;border-radius:15px;">${jogador.numero ?? '–'}</span></span>`;
  document.getElementById('eyebrow-jogador').textContent = `${jogador.posicao}${jogador.capitao ? ' · Capitão' : ''}`;
  document.getElementById('nome-jogador').textContent = jogador.nome;
  document.getElementById('fatos-jogador').innerHTML = `
    <a class="fact" href="time.html?id=${time.id}">${UI.bandeira(time, 'sm')} <strong>${esc(time.nome)}</strong></a>
    ${jogador.clube ? `<span class="fact">${UI.bandeiraClube(jogador.clubePais)} <strong>${esc(jogador.clube)}</strong></span>` : ''}
    ${jogador.idade != null ? `<span class="fact">Idade <strong>${jogador.idade}</strong></span>` : ''}`;

  const tile = (l, v, classe = '') => `<div class="stat-tile ${classe}"><div class="v">${v}</div><div class="l">${l}</div></div>`;
  document.getElementById('tiles-jogador').innerHTML = [
    tile('Jogos', s.jogos), tile('Minutos', s.minutos), tile('Titular', s.titular),
    tile('Gols', s.gols, 'gold'), tile('Assistências', s.assistencias, 'gold'), tile('Participações', s.participacoes),
    tile('De pênalti', s.penaltis), tile('Jogos com gol', s.jogosComGol), tile('Amarelos', s.amarelos), tile('Vermelhos', s.vermelhos),
  ].join('');

  const ROTULO = {
    gol: ['⚽', 'Gol'], gol_contra: ['⚽', 'Gol contra'], assistencia: ['🎯', 'Assistência'],
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
    linha('Nascimento', jogador.nascimento ? DB.Util.formatarData(`${jogador.nascimento}T12:00`) : '—'),
    linha('Jogos pela seleção*', jogador.jogosSelecao ?? '—'),
    linha('Gols pela seleção*', jogador.golsSelecao ?? '—'),
    linha('Técnico', esc(time.tecnico || '—')),
  ].join('') + '<li><span style="font-size:11.5px;">* até a convocação final (02/06/2026)</span><span></span></li>';

  UI.montarFooter();
});
