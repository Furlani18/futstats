document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();
  DB.MataMata.sincronizar();

  const fase = DB.Torneio.faseAtual();
  document.getElementById('hero-fase').textContent = fase === 'encerrado' ? 'Torneio encerrado' : `Em disputa: ${DB.Util.faseLabel(fase)}`;

  // ---------- KPIs ----------
  const r = DB.Estatisticas.resumo();
  const artilheiro = DB.Estatisticas.ranking('gols', 1)[0];
  const garcom = DB.Estatisticas.ranking('assistencias', 1)[0];
  const goleada = r.maiorGoleada;
  const nomeCurto = time => (time ? time.codigo : '—');
  const kpi = (label, valor, nota) => `
    <div class="kpi"><div class="kpi-label">${label}</div><div class="kpi-value">${valor}</div><div class="kpi-note">${nota || '&nbsp;'}</div></div>`;
  document.getElementById('kpis').innerHTML = [
    kpi('Jogos disputados', `${r.jogos}<span style="font-size:18px;color:var(--text-faint)">/104</span>`, `${r.totalJogos} cadastrados`),
    kpi('Gols', r.gols, `${r.penaltis} de pênalti · ${r.golsContra} contra`),
    kpi('Média por jogo', r.media.toFixed(2).replace('.', ',')),
    kpi('Artilheiro', artilheiro ? artilheiro.gols : '—', artilheiro ? DB.Util.escapar(artilheiro.jogador.nome) : 'sem gols cadastrados'),
    kpi('Líder em assistências', garcom ? garcom.assistencias : '—', garcom ? DB.Util.escapar(garcom.jogador.nome) : 'sem assistências'),
    kpi('Maior goleada', goleada ? `${goleada.golsMandante}–${goleada.golsVisitante}` : '—',
      goleada ? `${nomeCurto(DB.Times.get(goleada.mandanteId))} x ${nomeCurto(DB.Times.get(goleada.visitanteId))}` : ''),
  ].join('');

  // ---------- Partidas: ao vivo + próximas; senão, últimos resultados ----------
  const todos = DB.Jogos.all().sort((a, b) => new Date(a.data) - new Date(b.data));
  const aoVivo = todos.filter(j => j.status === 'ao_vivo');
  const proximos = todos.filter(j => j.status === 'agendado').slice(0, 8);
  const ultimos = todos.filter(j => j.status === 'encerrado').slice(-6).reverse();
  const lista = document.getElementById('lista-jogos');
  if (aoVivo.length || proximos.length) {
    document.getElementById('titulo-jogos').textContent = aoVivo.length ? 'Ao vivo e próximos jogos' : 'Próximos jogos';
    lista.innerHTML = UI.listaPorDia([...aoVivo, ...proximos]);
  } else if (ultimos.length) {
    document.getElementById('titulo-jogos').textContent = 'Últimos resultados';
    lista.innerHTML = ultimos.map(j => UI.linhaJogo(j, { comData: true })).join('');
  } else {
    lista.innerHTML = UI.vazio('Nenhuma partida cadastrada ainda', 'Os jogos aparecem aqui assim que forem cadastrados no painel.');
  }

  // ---------- Mini-tabelas dos grupos ----------
  document.getElementById('mini-grupos').innerHTML = DB.Grupos.letras.map(letra => `
    <div style="border-bottom:1px solid var(--border);border-right:1px solid var(--border-soft);">
      <div style="padding:10px 18px 0;" class="group-title"><span class="group-letter" style="width:24px;height:24px;font-size:15px;">${letra}</span>
        <a href="grupos.html#grupo-${letra}" style="font-weight:800;font-size:13px;color:var(--text-dim);">GRUPO ${letra}</a></div>
      ${UI.tabelaGrupo(letra, { compacta: true })}
    </div>`).join('');
  document.getElementById('legenda-grupos').innerHTML = UI.legendaZonas();

  // ---------- Rankings ----------
  document.getElementById('top-artilheiros').innerHTML = UI.listaLideres('gols', 5, 'gols', 'Nenhum gol cadastrado ainda.');
  document.getElementById('top-assistencias').innerHTML = UI.listaLideres('assistencias', 5, 'assist.', 'Nenhuma assistência cadastrada ainda.');

  const ataques = DB.Estatisticas.porTime().filter(t => t.J > 0)
    .sort((a, b) => b.GP - a.GP || b.SG - a.SG).slice(0, 5);
  document.getElementById('top-ataques').innerHTML = ataques.length ? `
    <ol class="leader-list">${ataques.map((t, i) => `
      <li><a class="leader" href="time.html?id=${t.time.id}">
        <span class="rank">${i + 1}</span>${UI.bandeira(t.time)}
        <span class="info"><span class="nome">${t.time.nome}</span><span class="sub">${t.J} jogos · ${t.GC} sofridos</span></span>
        <span class="valor">${t.GP}<small>gols</small></span>
      </a></li>`).join('')}</ol>` : UI.vazio('Sem jogos disputados', '');

  // ---------- Seleções ----------
  document.getElementById('grid-times').innerHTML = DB.Times.all().map(t => `
    <a class="team-card" href="time.html?id=${t.id}">
      ${UI.bandeira(t, 'lg')}
      <span><span class="nome">${t.nome}</span><br><span class="meta">Grupo ${t.grupo} · ${t.confederacao}</span></span>
    </a>`).join('');

  UI.montarFooter();
});
