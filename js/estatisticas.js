document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();
  DB.MataMata.sincronizar();

  const esc = DB.Util.escapar;
  const r = DB.Estatisticas.resumo();
  const kpi = (label, valor, decimais = 0) => `<div class="kpi"><div class="kpi-label">${label}</div>
    <div class="kpi-value"><span data-contar="${valor}" data-decimais="${decimais}">${Number(valor).toFixed(decimais).replace('.', ',')}</span></div></div>`;
  document.getElementById('kpis').innerHTML = [
    kpi('Jogos', r.jogos),
    kpi('Gols', r.gols),
    kpi('Média de gols', r.media, 2),
    kpi('Gols de pênalti', r.penaltis),
    kpi('Cartões amarelos', r.amarelos),
    kpi('Cartões vermelhos', r.vermelhos),
  ].join('');
  UI.animarNumeros(document.getElementById('kpis'));

  document.getElementById('lista-gols').innerHTML = UI.listaLideres('gols', 10, 'gols', 'Nenhum gol com autor cadastrado ainda.');
  document.getElementById('lista-assist').innerHTML = UI.listaLideres('assistencias', 10, 'assist.', 'Nenhuma assistência cadastrada ainda.');
  document.getElementById('lista-part').innerHTML = UI.listaLideres('participacoes', 10, 'G+A', 'Sem participações em gols ainda.');

  // ---------- Tabela completa de jogadores ----------
  const jogadores = DB.Estatisticas.porJogador()
    .filter(l => l.gols || l.assistencias || l.amarelos || l.vermelhos || l.minutos)
    .sort((a, b) => b.gols - a.gols || b.assistencias - a.assistencias || a.jogador.nome.localeCompare(b.jogador.nome));
  const zero = v => (v ? v : '<span style="color:var(--text-faint)">0</span>');
  document.querySelector('#tabela-jogadores tbody').innerHTML = jogadores.length
    ? jogadores.map((l, i) => {
      const time = DB.Times.get(l.jogador.timeId);
      return `<tr>
        <td class="pos">${i + 1}</td>
        <td class="left"><a class="team-inline" href="jogador.html?id=${l.jogador.id}"><span class="nome">${esc(l.jogador.nome)}</span></a></td>
        <td class="left">${UI.timeLink(time)}</td>
        <td class="dim">${esc(l.jogador.posicao)}</td>
        <td>${zero(l.jogos)}</td><td>${zero(l.minutos)}</td>
        <td class="strong">${zero(l.gols)}</td><td>${zero(l.penaltis)}</td><td>${zero(l.assistencias)}</td>
        <td>${zero(l.participacoes)}</td><td class="dim">${l.golsPor90 != null && l.gols ? l.golsPor90.toFixed(2).replace('.', ',') : '–'}</td><td>${zero(l.amarelos)}</td><td>${zero(l.vermelhos)}</td>
      </tr>`;
    }).join('')
    : `<tr><td colspan="13">${UI.vazio('Nenhum lance cadastrado ainda', 'Gols, assistências e cartões aparecem aqui conforme forem lançados nos jogos.')}</td></tr>`;

  // ---------- Seleções ----------
  const times = DB.Estatisticas.porTime()
    .sort((a, b) => b.GP - a.GP || b.SG - a.SG || a.GC - b.GC || a.time.nome.localeCompare(b.time.nome));
  document.querySelector('#tabela-times tbody').innerHTML = times.map((t, i) => `
    <tr${t.J ? '' : ' class="eliminado"'}>
      <td class="pos">${i + 1}</td><td class="left">${UI.timeLink(t.time)}</td>
      <td>${t.J}</td><td>${t.V}</td><td>${t.E}</td><td>${t.D}</td>
      <td class="strong">${t.GP}</td><td>${t.GC}</td><td>${t.SG > 0 ? '+' : ''}${t.SG}</td>
      <td>${t.media.toFixed(2).replace('.', ',')}</td><td>${t.semSofrer}</td><td>${t.CA}</td><td>${t.CV}</td>
    </tr>`).join('');

  document.getElementById('lista-cartoes').innerHTML = UI.listaLideres('cartoes', 10, '', 'Nenhum cartão cadastrado ainda.');

  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
  UI.montarFooter();
});
