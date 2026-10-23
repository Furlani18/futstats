// Página "Meus favoritos": times e jogadores seguidos, em todos os campeonatos cadastrados.
document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();
  const esc = DB.Util.escapar;
  const times = UI.Favoritos.lista().map(id => DB.Times.get(id)).filter(Boolean);
  const jogadores = UI.FavoritosJogadores.lista().map(id => DB.Jogadores.get(id)).filter(Boolean);

  if (!times.length && !jogadores.length) {
    const vazio = document.getElementById('fav-vazio');
    vazio.hidden = false;
    vazio.innerHTML = `<div class="panel">${UI.vazio('Você ainda não segue ninguém',
      'Abra a página de um time ou jogador e toque na estrela ☆ ao lado do nome. Comece pelas <a href="selecoes.html">seleções e clubes</a> ou pela <a href="estatisticas.html">artilharia</a>.')}</div>`;
    UI.montarFooter();
    return;
  }
  document.getElementById('fav-conteudo').hidden = false;

  // ---------- Jogos dos times seguidos (todos os campeonatos) ----------
  const ids = new Set(times.map(t => t.id));
  const doSeguido = j => ids.has(j.mandanteId) || ids.has(j.visitanteId);
  const todos = DB.Jogos.todos().filter(j => j.data && doSeguido(j)).sort((a, b) => new Date(a.data) - new Date(b.data));
  const proximos = todos.filter(j => j.status !== 'encerrado');
  const ultimos = todos.filter(j => j.status === 'encerrado').slice(-10).reverse();
  const nomeComp = j => (DB.Contexto.lista.find(c => c.id === (j.competicaoId || 'copa2026')) || {}).curto || '';
  const comCampeonato = j => `<div class="fav-linha"><span class="fav-comp">${esc(nomeComp(j))} · ${DB.Util.formatarData(j.data).slice(0, 5)}</span>${UI.linhaJogoCompacta(j)}</div>`;
  document.getElementById('fav-proximos').innerHTML = proximos.length
    ? proximos.slice(0, 20).map(comCampeonato).join('')
    : UI.vazio(times.length ? 'Nenhum jogo marcado' : 'Siga um time para ver os jogos dele aqui', '');
  document.getElementById('fav-ultimos').innerHTML = ultimos.length ? ultimos.map(comCampeonato).join('') : UI.vazio('Sem resultados ainda', '');
  const botaoIcs = document.getElementById('btn-ics-favoritos');
  if (proximos.length) {
    botaoIcs.hidden = false;
    botaoIcs.title = `Baixar ${proximos.length} jogo${proximos.length === 1 ? '' : 's'} para o Google Agenda, Outlook ou celular`;
    botaoIcs.addEventListener('click', () => UI.baixarIcs(proximos, 'Meus times · FUTSTATS', 'futstats-meus-times'));
  }

  // ---------- Times ----------
  document.getElementById('fav-qtd-times').textContent = times.length ? `${times.length}` : '';
  document.getElementById('fav-times').innerHTML = times.length ? times.map(t => {
    const comps = DB.Contexto.competicoesDoTime(t.id);
    const proximo = UI.proximosDoTime(t.id)[0];
    const adv = proximo && DB.Times.get(proximo.mandanteId === t.id ? proximo.visitanteId : proximo.mandanteId);
    return `<div class="fav-item">
      <a class="fav-time" href="time.html?id=${t.id}">${UI.bandeira(t, 'lg')}<span><b>${esc(t.nome)}</b><small>${comps.map(c => esc(c.curto)).join(' · ')}</small></span></a>
      ${proximo ? `<a class="fav-prox" href="jogo.html?id=${proximo.id}">Próximo: ${proximo.mandanteId === t.id ? 'x' : '@'} ${UI.bandeira(adv, 'sm')} ${esc(adv ? adv.nome : 'A definir')} · ${DB.Util.formatarData(proximo.data).slice(0, 5)}</a>` : ''}
      <button type="button" class="bolao-remover" data-tipo="time" data-id="${t.id}" aria-label="Deixar de seguir ${esc(t.nome)}" title="Deixar de seguir">✕</button>
    </div>`;
  }).join('') : UI.vazio('Nenhum time seguido', '');

  // ---------- Jogadores: números somados em todos os campeonatos ----------
  const numeros = {};
  jogadores.forEach(j => { numeros[j.id] = { gols: 0, assistencias: 0, cartoes: 0 }; });
  DB.Jogos.todos().filter(j => j.status === 'encerrado' || j.status === 'ao_vivo').forEach(jogo => {
    (jogo.gols || []).forEach(g => {
      if (g.tipo !== 'contra' && numeros[g.jogadorId]) numeros[g.jogadorId].gols++;
      if (g.tipo !== 'contra' && numeros[g.assistenciaId]) numeros[g.assistenciaId].assistencias++;
    });
    (jogo.cartoes || []).forEach(c => { if (numeros[c.jogadorId]) numeros[c.jogadorId].cartoes++; });
  });
  document.getElementById('fav-qtd-jogadores').textContent = jogadores.length ? `${jogadores.length}` : '';
  document.getElementById('fav-jogadores').innerHTML = jogadores.length ? jogadores.map(j => {
    const t = DB.Times.get(j.timeId), n = numeros[j.id];
    return `<div class="fav-item">
      <a class="leader" href="jogador.html?id=${j.id}">${UI.avatar(j)}
        <span class="info"><span class="nome">${esc(j.nome)}</span><span class="sub">${UI.bandeira(t, 'sm')} ${t ? esc(t.nome) : ''} · ${esc(j.posicao)}</span></span>
        <span class="valor">${n.gols}<small>G</small> ${n.assistencias}<small>A</small></span></a>
      <button type="button" class="bolao-remover" data-tipo="jogador" data-id="${j.id}" aria-label="Deixar de seguir ${esc(j.nome)}" title="Deixar de seguir">✕</button>
    </div>`;
  }).join('') : UI.vazio('Nenhum jogador seguido', 'Toque na ☆ na página de um jogador.');

  document.querySelectorAll('.fav-item .bolao-remover').forEach(b => b.addEventListener('click', () => {
    (b.dataset.tipo === 'time' ? UI.Favoritos : UI.FavoritosJogadores).alternar(b.dataset.id);
    window.location.reload();
  }));

  UI.montarFooter();
});
