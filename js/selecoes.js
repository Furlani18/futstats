document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();

  const CONFEDERACOES = ['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];
  let modo = 'confederacao';

  function cartao(t) {
    return `
      <a class="team-card" href="time.html?id=${t.id}">
        ${UI.bandeira(t, 'lg')}
        <span><span class="nome">${t.nome}</span><br>
        <span class="meta">${modo === 'grupo' ? t.confederacao : `Grupo ${t.grupo}`} · ${DB.Util.escapar(t.tecnico || '')}</span></span>
      </a>`;
  }

  function render() {
    document.getElementById('filtro').innerHTML = [['confederacao', 'Por confederação'], ['grupo', 'Por grupo']]
      .map(([v, l]) => `<button type="button" class="chip${modo === v ? ' active' : ''}" data-v="${v}">${l}</button>`).join('');
    document.querySelectorAll('#filtro .chip').forEach(b => b.addEventListener('click', () => { modo = b.dataset.v; render(); }));

    const times = DB.Times.all();
    const blocos = modo === 'grupo'
      ? DB.Grupos.letras.map(l => [`Grupo ${l}`, DB.Grupos.times(l)])
      : CONFEDERACOES.map(c => [c, times.filter(t => t.confederacao === c).sort((a, b) => a.rankingFifa - b.rankingFifa)]);
    document.getElementById('conteudo').innerHTML = blocos.filter(([, lista]) => lista.length).map(([titulo, lista]) => `
      <div class="conf-group">
        <div class="section-head" style="margin-top:8px;"><h2 class="section-title">${titulo} <span style="color:var(--text-faint);font-size:20px;">${lista.length}</span></h2></div>
        <div class="team-grid">${lista.map(cartao).join('')}</div>
      </div>`).join('');
  }

  render();
  UI.montarFooter();
});
