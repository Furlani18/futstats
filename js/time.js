document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  DB.MataMata.sincronizar();

  const params = new URLSearchParams(window.location.search);
  const time = DB.Times.get(params.get('id'));

  if (!time) {
    document.getElementById('nome-time').textContent = 'Time não encontrado';
    UI.montarFooter();
    return;
  }

  document.getElementById('page-title').textContent = `${time.nome} — FUTSTATS`;
  document.getElementById('breadcrumb-nome').textContent = time.nome;
  document.getElementById('nome-time').textContent = time.nome;
  document.getElementById('meta-time').textContent = `Grupo ${time.grupo} · ${time.confederacao} · Ranking FIFA #${time.rankingFifa}`;
  document.getElementById('crest-mount').innerHTML = UI.crestHtml(time, 84);

  document.querySelector('#tabela-grupo-time tbody').innerHTML = UI.linhasClassificacao(DB.Classificacao.grupo(time.grupo));

  const jogadores = DB.Jogadores.all().filter(j => j.timeId === time.id);
  document.getElementById('grid-jogadores').innerHTML = jogadores.map(j => `
    <div class="player-card">
      <div class="avatar" style="display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--text-dim);">${DB.Util.iniciais(j.nome)}</div>
      <div class="name">${j.nome}</div>
      <div class="meta">${j.posicao} · ${j.idade} anos</div>
    </div>`).join('');

  const jogos = DB.Jogos.all()
    .filter(j => j.mandanteId === time.id || j.visitanteId === time.id)
    .sort((a, b) => new Date(a.data) - new Date(b.data));
  document.getElementById('jogos-time').innerHTML = jogos.length
    ? jogos.map(UI.linhaJogo).join('')
    : '<div class="panel-body" style="color:var(--text-dim);">Nenhum jogo cadastrado.</div>';

  UI.montarFooter();
});
