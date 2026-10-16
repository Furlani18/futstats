document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();

  DB.MataMata.sincronizar();

  document.getElementById('grid-grupos').innerHTML = DB.Grupos.letras.map(letra => cardGrupo(letra)).join('');

  const terceiros = DB.Classificacao.terceiros();
  document.querySelector('#tabela-terceiros tbody').innerHTML = terceiros.map(t => `
    <tr class="terceiros-row ${t.classificado ? 'classificado' : 'eliminado'}">
      <td>${t.posicaoGeral}</td><td>${t.nome}</td><td>${t.grupo}</td>
      <td>${t.P}</td><td>${t.J}</td><td>${t.V}</td><td>${t.E}</td><td>${t.D}</td><td>${t.SG}</td><td>${t.GP}</td>
    </tr>`).join('');

  UI.montarFooter();
});

function cardGrupo(letra) {
  const tabela = DB.Classificacao.grupo(letra);
  const jogos = DB.Jogos.porGrupo(letra);
  const completo = DB.Grupos.completo(letra);

  const linhasTabela = tabela.map(t => `
    <tr><td>${t.posicao}</td><td>${t.nome}</td><td>${t.P}</td><td>${t.J}</td><td>${t.V}</td><td>${t.E}</td><td>${t.D}</td><td>${t.SG}</td></tr>`).join('');

  const linhasJogos = jogos.map(j => {
    const m = DB.Times.get(j.mandanteId), v = DB.Times.get(j.visitanteId);
    const placar = (j.status === 'agendado' || j.status === 'adiado') ? 'vs' : `${j.golsMandante} - ${j.golsVisitante}`;
    return `<a href="jogo.html?id=${j.id}" class="panel-body" style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);padding:8px 4px;font-size:12.5px;">
      <span>${m ? m.nome : '—'}</span><strong>${placar}</strong><span>${v ? v.nome : '—'}</span>
    </a>`;
  }).join('');

  return `
    <div class="panel" id="grupo-${letra}">
      <div class="panel-header">
        <span class="group-card-header">
          <span class="group-letter">Grupo ${letra}</span>
        </span>
        <span class="group-status">${completo ? 'Encerrado' : 'Em andamento'}</span>
      </div>
      <div class="panel-body">
        <table class="standings-table">
          <thead><tr><th>#</th><th>Time</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th></tr></thead>
          <tbody>${linhasTabela}</tbody>
        </table>
        <details style="margin-top:10px;">
          <summary style="cursor:pointer;color:var(--text-dim);font-size:12.5px;font-weight:700;">Jogos do grupo</summary>
          <div style="margin-top:6px;">${linhasJogos}</div>
        </details>
      </div>
    </div>`;
}
