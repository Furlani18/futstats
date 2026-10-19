document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();

  const esc = DB.Util.escapar;
  const comp = DB.Contexto.get();
  const ehCopa = DB.Contexto.ehCopa();
  const CONFEDERACOES = ['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];
  const temGrupos = DB.Grupos.letras.length > 0;
  const variosPaises = new Set(DB.Times.all().map(t => t.iso)).size > 1;

  const modos = ehCopa
    ? [['confederacao', 'Por confederação'], ['grupo', 'Por grupo']]
    : [['todos', 'Todos'], ...(temGrupos ? [['grupo', 'Por grupo']] : []), ...(variosPaises ? [['pais', 'Por país']] : [])];
  let modo = modos[0][0];

  if (!ehCopa) {
    document.getElementById('migalha').textContent = 'Clubes';
    document.getElementById('eyebrow').textContent = `Elencos atuais · ${comp.curto} ${comp.temporada}`;
    document.getElementById('titulo').textContent = `Os ${DB.Times.all().length} clubes`;
    document.getElementById('lead').textContent = 'Elencos, técnicos e estádios atualizados pela Wikipedia (outubro de 2026). Clique num clube para ver elenco e números no campeonato.';
    document.title = `Clubes — ${comp.curto} ${comp.temporada} — FUTSTATS`;
  }

  // Nome do país em português a partir do código ISO da bandeira.
  const ESPECIAIS = { 'gb-eng': 'Inglaterra', 'gb-sct': 'Escócia', 'gb-wls': 'País de Gales', 'gb-nir': 'Irlanda do Norte', xk: 'Kosovo' };
  let regioes = null;
  try { regioes = new Intl.DisplayNames(['pt-BR'], { type: 'region' }); } catch (e) { /* navegador antigo */ }
  const nomePais = iso => ESPECIAIS[iso] || (regioes && iso ? regioes.of(iso.toUpperCase()) : (iso || '—').toUpperCase());

  function cartao(t) {
    const meta = t.tipo === 'clube'
      ? [modo !== 'grupo' && DB.Grupos.deTime(t.id) && `Grupo ${DB.Grupos.deTime(t.id)}`, t.tecnico].filter(Boolean).join(' · ')
      : `${modo === 'grupo' ? t.confederacao : `Grupo ${t.grupo}`} · ${t.tecnico || ''}`;
    return `
      <a class="team-card" href="time.html?id=${t.id}">
        ${UI.bandeira(t, 'lg')}
        <span><span class="nome">${esc(t.nome)}</span><br><span class="meta">${esc(meta)}</span></span>
      </a>`;
  }

  function render() {
    document.getElementById('filtro').innerHTML = modos.length > 1
      ? modos.map(([v, l]) => `<button type="button" class="chip${modo === v ? ' active' : ''}" data-v="${v}">${l}</button>`).join('')
      : '';
    document.querySelectorAll('#filtro .chip').forEach(b => b.addEventListener('click', () => { modo = b.dataset.v; render(); }));

    const times = DB.Times.all();
    let blocos;
    if (modo === 'grupo') blocos = DB.Grupos.letras.map(l => [`Grupo ${l}`, DB.Grupos.times(l)]);
    else if (modo === 'confederacao') blocos = CONFEDERACOES.map(c => [c, times.filter(t => t.confederacao === c).sort((a, b) => a.rankingFifa - b.rankingFifa)]);
    else if (modo === 'pais') {
      const paises = [...new Set(times.map(t => t.iso))].sort((a, b) => nomePais(a).localeCompare(nomePais(b)));
      blocos = paises.map(iso => [nomePais(iso), times.filter(t => t.iso === iso).sort((a, b) => a.nome.localeCompare(b.nome))]);
    } else blocos = [['', [...times].sort((a, b) => a.nome.localeCompare(b.nome))]];

    document.getElementById('conteudo').innerHTML = blocos.filter(([, lista]) => lista.length).map(([titulo, lista]) => `
      <div class="conf-group">
        ${titulo ? `<div class="section-head" style="margin-top:8px;"><h2 class="section-title">${esc(titulo)} <span style="color:var(--text-faint);font-size:20px;">${lista.length}</span></h2></div>` : ''}
        <div class="team-grid">${lista.map(cartao).join('')}</div>
      </div>`).join('');
  }

  render();
  UI.montarFooter();
});
