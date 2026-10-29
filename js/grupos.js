document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();
  DB.MataMata.sincronizar();

  const comp = DB.Contexto.get();
  // Imprimir a tabela e baixar em planilha (todos os grupos ou a tabela única).
  UI.botoesExportar(document.getElementById('exportar'), () => {
    const cab = ['Pos', 'Time', 'P', 'J', 'V', 'E', 'D', 'GP', 'GC', 'SG'];
    const linha = (l, i) => [l.posicao || i + 1, (DB.Times.get(l.timeId) || {}).nome, l.P, l.J, l.V, l.E, l.D, l.GP, l.GC, l.SG];
    const ehLiga = comp.tipo === 'liga' || comp.tipo === 'champions';
    const linhas = ehLiga ? [cab, ...DB.Classificacao.liga().map(linha)]
      : [['Grupo', ...cab], ...DB.Grupos.letras.flatMap(letra => DB.Classificacao.grupo(letra).map((l, i) => [letra, ...linha(l, i)]))];
    UI.baixarCSV(`futstats-${comp.id}-classificacao.csv`, linhas);
  });
  const texto = (id, valor) => { document.getElementById(id).textContent = valor; };
  if (comp.tipo === 'liga' || comp.tipo === 'champions') {
    // Tabela única: pontos corridos ou fase de liga da Champions.
    texto('migalha', 'Classificação');
    texto('eyebrow', comp.tipo === 'champions' ? 'Fase de liga · 36 clubes · 8 rodadas' : `${DB.Times.all().length} clubes · pontos corridos`);
    texto('titulo', `Classificação · ${comp.curto}`);
    texto('lead', `Desempate: ${(comp.desempate || ['P', 'SG', 'GP']).map(c => ({ P: 'pontos', V: 'vitórias', SG: 'saldo de gols', GP: 'gols marcados' }[c])).join(' → ')}.`);
    document.getElementById('painel-liga').hidden = false;
    document.getElementById('tabela-liga').innerHTML = UI.tabelaLiga({ forma: true });
    document.getElementById('legenda-liga').innerHTML = UI.legendaZonas(comp.zonas);
    document.getElementById('secao-terceiros').hidden = true;
    UI.montarFooter();
    return;
  }
  if (comp.tipo === 'mata_mata') { window.location.replace('chaveamento.html'); return; }
  if (comp.tipo === 'grupos_mata') {
    texto('eyebrow', 'Fase de grupos');
    texto('titulo', `${DB.Grupos.letras.length} grupos · ${DB.Times.all().length} clubes`);
    texto('lead', 'Os dois primeiros de cada grupo vão às oitavas de final; o terceiro disputa o playoff da Sul-Americana.');
    document.getElementById('secao-terceiros').hidden = true;
  }

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
        <span class="group-status${completo ? ' done' : ''}">${completo ? 'Encerrado' : `${encerrados}/${DB.Grupos.jogosPrevistos(letra)} jogos`}</span>
      </div>
      ${UI.tabelaGrupo(letra, { forma: true })}
      ${UI.legendaZonas()}
      <details class="group-games"${jogos.length ? '' : ' hidden'}>
        <summary>Jogos do grupo (${jogos.length})</summary>
        ${linhasJogos}
      </details>
    </div>`;
}
