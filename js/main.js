document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();

  DB.MataMata.sincronizar();

  document.getElementById('titulo-hero').textContent = `${DB.Torneio.sede} · ${DB.Torneio.periodo}`;
  document.getElementById('eyebrow-fase').textContent = DB.Util.faseLabel(DB.Torneio.faseAtual());

  document.getElementById('lista-grupos').innerHTML = DB.Grupos.letras.map(letra => {
    const tabela = DB.Classificacao.grupo(letra);
    const lider = tabela[0];
    const completo = DB.Grupos.completo(letra);
    return `
      <a href="grupos.html#grupo-${letra}" class="panel-body" style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);">
        <span><strong>Grupo ${letra}</strong> — ${lider.nome}</span>
        <span class="badge badge-${completo ? 'encerrado' : 'agendado'}">${completo ? 'Definido' : 'Em jogo'}</span>
      </a>`;
  }).join('');

  const jogosRodada = DB.Jogos.all()
    .filter(j => j.status === 'ao_vivo' || j.status === 'agendado')
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(0, 8);
  document.getElementById('lista-jogos').innerHTML = jogosRodada.length
    ? jogosRodada.map(UI.linhaJogo).join('')
    : '<div class="panel-body" style="color:var(--text-dim);">Nenhum jogo agendado no momento.</div>';

  document.getElementById('grid-times').innerHTML = DB.Times.all().map(t => `
    <a class="player-card" href="time.html?id=${t.id}">
      ${UI.crestHtml(t, 56)}
      <div class="name" style="margin-top:12px;">${t.nome}</div>
      <div class="meta">Grupo ${t.grupo} · ${t.confederacao}</div>
    </a>`).join('');

  const terceiros = DB.Classificacao.terceiros().slice(0, 8);
  document.querySelector('#tabela-terceiros-mini tbody').innerHTML = terceiros.map(t => `
    <tr class="terceiros-row classificado">
      <td>${t.posicaoGeral}</td><td>${t.nome}</td><td>${t.grupo}</td><td>${t.P}</td><td>${t.SG}</td>
    </tr>`).join('');

  UI.montarFooter();
});
