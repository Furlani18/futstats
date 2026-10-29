document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();
  DB.MataMata.sincronizar();

  const comp = DB.Contexto.get();
  UI.botoesExportar(document.getElementById('exportar'), () => {
    const nome = id => (DB.Times.get(id) || {}).nome || 'A definir';
    const linhas = DB.Jogos.all().sort((a, b) => new Date(a.data) - new Date(b.data)).map(j => [
      DB.Util.formatarData(j.data), DB.Util.formatarHora(j.data), UI.rotuloJogo(j), nome(j.mandanteId),
      UI.temPlacar(j) ? j.golsMandante : '', UI.temPlacar(j) ? j.golsVisitante : '', nome(j.visitanteId), j.local || '', DB.Util.statusLabel(j.status)]);
    UI.baixarCSV(`futstats-${comp.id}-partidas.csv`, [['Data', 'Hora (Brasília)', 'Fase', 'Mandante', 'Gols mandante', 'Gols visitante', 'Visitante', 'Estádio', 'Situação'], ...linhas]);
  });
  const FASES = {
    copa_mundo: [['', 'Todas'], ['grupos', 'Fase de grupos'], ['r32', '32avos'], ['r16', 'Oitavas'], ['qf', 'Quartas'], ['sf', 'Semifinais'], ['finais', 'Finais']],
    liga: [],
    champions: [['', 'Todas'], ['liga', 'Fase de liga'], ['playoff', 'Playoff'], ['oitavas', 'Oitavas'], ['quartas', 'Quartas'], ['semi', 'Semifinais'], ['final', 'Final']],
    grupos_mata: [['', 'Todas'], ['grupos', 'Fase de grupos'], ['oitavas', 'Oitavas'], ['quartas', 'Quartas'], ['semi', 'Semifinais'], ['final', 'Final']],
    mata_mata: [['', 'Todas'], ['oitavas', 'Oitavas'], ['quartas', 'Quartas'], ['semi', 'Semifinais'], ['final', 'Final']],
  }[comp.tipo] || [];
  const STATUS = [['', 'Todos'], ['ao_vivo', 'Ao vivo'], ['encerrado', 'Encerrados'], ['agendado', 'Agendados']];
  const filtro = { fase: '', status: '', rodada: '' };

  // Rodada atual: a primeira com jogo pendente (ou a última cadastrada).
  const rodadas = [...new Set(DB.Jogos.all().filter(j => j.rodada && (j.fase === 'liga' || j.fase === 'grupos')).map(j => j.rodada))].sort((a, b) => a - b);
  if (comp.tipo === 'liga' && rodadas.length) {
    const pendente = DB.Jogos.all().filter(j => j.fase === 'liga' && j.status !== 'encerrado').sort((a, b) => a.rodada - b.rodada)[0];
    filtro.rodada = String(pendente ? pendente.rodada : rodadas[rodadas.length - 1]);
  }

  function chips(id, opcoes, chave) {
    const mount = document.getElementById(id);
    mount.innerHTML = opcoes.map(([valor, label]) =>
      `<button type="button" class="chip${filtro[chave] === valor ? ' active' : ''}" data-valor="${valor}">${label}</button>`).join('');
    mount.querySelectorAll('.chip').forEach(btn => btn.addEventListener('click', () => {
      filtro[chave] = btn.dataset.valor;
      if (chave === 'fase') filtro.rodada = '';
      render();
    }));
  }

  function seletorRodada() {
    const mostra = rodadas.length && (comp.tipo === 'liga' || filtro.fase === 'liga' || filtro.fase === 'grupos');
    const mount = document.getElementById('filtro-rodada');
    if (!mostra) { mount.innerHTML = ''; return; }
    mount.innerHTML = `<label class="chip" style="display:inline-flex;align-items:center;gap:8px;cursor:default;">Rodada
      <select id="sel-rodada" class="chip-select">
        <option value="">Todas</option>
        ${rodadas.map(r => `<option value="${r}" ${String(r) === filtro.rodada ? 'selected' : ''}>${r}ª</option>`).join('')}
      </select></label>
      ${filtro.rodada ? `<button type="button" class="chip" data-passo="-1" ${rodadas[0] === Number(filtro.rodada) ? 'disabled' : ''}>◀</button>
      <button type="button" class="chip" data-passo="1" ${rodadas[rodadas.length - 1] === Number(filtro.rodada) ? 'disabled' : ''}>▶</button>` : ''}`;
    document.getElementById('sel-rodada').addEventListener('change', e => { filtro.rodada = e.target.value; render(); });
    mount.querySelectorAll('[data-passo]').forEach(b => b.addEventListener('click', () => {
      const i = rodadas.indexOf(Number(filtro.rodada)) + Number(b.dataset.passo);
      if (rodadas[i]) { filtro.rodada = String(rodadas[i]); render(); }
    }));
  }

  function render() {
    if (FASES.length) chips('filtro-fase', FASES, 'fase');
    seletorRodada();
    chips('filtro-status', STATUS, 'status');
    let jogos = DB.Jogos.all();
    if (filtro.fase === 'finais') jogos = jogos.filter(j => j.fase === 'final' || j.fase === 'terceiro');
    else if (filtro.fase) jogos = jogos.filter(j => j.fase === filtro.fase);
    if (filtro.rodada) jogos = jogos.filter(j => String(j.rodada) === filtro.rodada && (j.fase === 'liga' || j.fase === 'grupos'));
    if (filtro.status) jogos = jogos.filter(j => j.status === filtro.status);
    jogos.sort((a, b) => new Date(a.data) - new Date(b.data));
    document.getElementById('lista-partidas').innerHTML = jogos.length
      ? UI.listaPorDia(jogos)
      : UI.vazio('Nenhuma partida encontrada', DB.Jogos.all().length ? 'Tente outro filtro.' : 'As partidas aparecem aqui assim que forem cadastradas no painel.');
  }

  document.querySelector('.page-hero .lead').textContent = `Todos os jogos de ${comp.nome} por data, em horário de Brasília.`;
  render();
  UI.montarFooter();
});
