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
      `Abra a página de um time ou jogador e toque na estrela ${UI.icone('estrela')} ao lado do nome. Comece pelas <a href="selecoes.html">seleções e clubes</a> ou pela <a href="estatisticas.html">artilharia</a>.`)}</div>`;
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

  // ---------- Lembretes: aviso 30 minutos antes dos jogos dos times seguidos ----------
  function renderLembretes() {
    const caixa = document.getElementById('lembretes');
    if (!UI.Lembretes.suportado()) {
      caixa.innerHTML = '<p class="grafico-nota">Este navegador não mostra notificações. Use <b>Exportar para a agenda</b> para receber os avisos pelo calendário do celular.</p>';
      return;
    }
    const negado = Notification.permission === 'denied';
    const ativos = UI.Lembretes.ativos();
    const pendentes = UI.Lembretes.pendentes();
    const prox = pendentes[0];
    caixa.innerHTML = `<p class="grafico-nota">${ativos
      ? `Ligados: você recebe um aviso 30 minutos antes de cada jogo dos seus times enquanto o site (ou o app instalado) estiver aberto.${prox ? ` Próximo: <b>${esc((DB.Times.get(prox.mandanteId) || {}).nome || '')} x ${esc((DB.Times.get(prox.visitanteId) || {}).nome || '')}</b>, ${DB.Util.formatarDataHora(prox.data)}.` : ''}`
      : negado ? 'As notificações estão bloqueadas para este site. Libere nas configurações do navegador (cadeado ao lado do endereço) e volte aqui.'
      : 'Receba um aviso 30 minutos antes de cada jogo dos times que você segue. Sem servidor, o aviso chega com o site ou o app aberto; para avisos com tudo fechado, exporte para a agenda.'}</p>
      <div class="bolao-acoes">${ativos
        ? '<button type="button" class="btn btn-ghost" id="btn-lembretes-off">Desligar lembretes</button>'
        : `<button type="button" class="btn btn-primary" id="btn-lembretes-on" ${negado || !times.length ? 'disabled' : ''}>${UI.icone('sino')} Ligar lembretes</button>`}</div>`;
    document.getElementById('btn-lembretes-on')?.addEventListener('click', async () => { await UI.Lembretes.ativar(); renderLembretes(); });
    document.getElementById('btn-lembretes-off')?.addEventListener('click', () => { UI.Lembretes.desativar(); renderLembretes(); });
  }
  renderLembretes();
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
      <button type="button" class="bolao-remover" data-tipo="time" data-id="${t.id}" aria-label="Deixar de seguir ${esc(t.nome)}" title="Deixar de seguir">${UI.icone('fechar')}</button>
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
      <button type="button" class="bolao-remover" data-tipo="jogador" data-id="${j.id}" aria-label="Deixar de seguir ${esc(j.nome)}" title="Deixar de seguir">${UI.icone('fechar')}</button>
    </div>`;
  }).join('') : UI.vazio('Nenhum jogador seguido', `Toque na ${UI.icone('estrela')} na página de um jogador.`);

  document.querySelectorAll('.fav-item .bolao-remover').forEach(b => b.addEventListener('click', () => {
    (b.dataset.tipo === 'time' ? UI.Favoritos : UI.FavoritosJogadores).alternar(b.dataset.id);
    window.location.reload();
  }));

  UI.montarFooter();
});
