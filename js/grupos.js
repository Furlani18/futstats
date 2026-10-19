document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();
  DB.MataMata.sincronizar();

  document.getElementById('grid-grupos').innerHTML = DB.Grupos.letras.map(cardGrupo).join('');

  const algumJogo = DB.Jogos.porFase('grupos').some(j => j.status !== 'agendado');
  document.querySelector('#tabela-terceiros tbody').innerHTML = DB.Classificacao.terceiros().map(t => {
    const time = DB.Times.get(t.timeId);
    const classe = !algumJogo ? '' : t.classificado ? 'zona-3' : 'eliminado';
    return `<tr class="${classe}">
      <td class="pos">${t.posicaoGeral}</td><td class="left">${UI.timeLink(time)}</td><td>${t.grupo}</td>
      <td>${t.J}</td><td>${t.V}</td><td>${t.E}</td><td>${t.D}</td><td class="dim">${t.GP}:${t.GC}</td>
      <td>${t.SG > 0 ? '+' : ''}${t.SG}</td><td class="strong">${t.P}</td>
    </tr>`;
  }).join('');

  // Rola até o grupo do link (#grupo-X) depois de montar a página.
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();

  UI.montarFooter();
});

function cardGrupo(letra) {
  const jogos = [...DB.Jogos.porGrupo(letra)].sort((a, b) => new Date(a.data) - new Date(b.data));
  const encerrados = jogos.filter(j => j.status === 'encerrado').length;
  const completo = DB.Grupos.completo(letra);

  const linhasJogos = jogos.map(UI.linhaJogoCompacta).join('');

  return `
    <div class="panel" id="grupo-${letra}">
      <div class="panel-header">
        <span class="group-title"><span class="group-letter">${letra}</span><span class="panel-title">Grupo ${letra}</span></span>
        <span class="group-status${completo ? ' done' : ''}">${completo ? 'Encerrado' : `${encerrados}/6 jogos`}</span>
      </div>
      ${UI.tabelaGrupo(letra, { forma: true })}
      ${UI.legendaZonas()}
      <details class="group-games"${jogos.length ? '' : ' hidden'}>
        <summary>Jogos do grupo (${jogos.length})</summary>
        ${linhasJogos}
      </details>
    </div>`;
}
