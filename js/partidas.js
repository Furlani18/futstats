document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();
  DB.MataMata.sincronizar();

  const FASES = [['', 'Todas'], ['grupos', 'Fase de grupos'], ['r32', '32avos'], ['r16', 'Oitavas'], ['qf', 'Quartas'], ['sf', 'Semifinais'], ['finais', 'Finais']];
  const STATUS = [['', 'Todos'], ['ao_vivo', 'Ao vivo'], ['encerrado', 'Encerrados'], ['agendado', 'Agendados']];
  const filtro = { fase: '', status: '' };

  function chips(id, opcoes, chave) {
    const mount = document.getElementById(id);
    mount.innerHTML = opcoes.map(([valor, label]) =>
      `<button type="button" class="chip${filtro[chave] === valor ? ' active' : ''}" data-valor="${valor}">${label}</button>`).join('');
    mount.querySelectorAll('.chip').forEach(btn => btn.addEventListener('click', () => {
      filtro[chave] = btn.dataset.valor;
      render();
    }));
  }

  function render() {
    chips('filtro-fase', FASES, 'fase');
    chips('filtro-status', STATUS, 'status');
    let jogos = DB.Jogos.all();
    if (filtro.fase === 'finais') jogos = jogos.filter(j => j.fase === 'final' || j.fase === 'terceiro');
    else if (filtro.fase) jogos = jogos.filter(j => j.fase === filtro.fase);
    if (filtro.status) jogos = jogos.filter(j => j.status === filtro.status);
    jogos.sort((a, b) => new Date(a.data) - new Date(b.data));
    document.getElementById('lista-partidas').innerHTML = jogos.length
      ? UI.listaPorDia(jogos)
      : UI.vazio('Nenhuma partida encontrada', DB.Jogos.all().length ? 'Tente outro filtro.' : 'As partidas aparecem aqui assim que forem cadastradas no painel.');
  }

  render();
  UI.montarFooter();
});
