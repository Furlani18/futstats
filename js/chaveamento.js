document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();

  const chave = DB.MataMata.sincronizar();

  document.getElementById('bracket').innerHTML = [
    colunaHtml('32avos de final', chave.r32),
    colunaHtml('Oitavas de final', chave.r16),
    colunaHtml('Quartas de final', chave.qf),
    colunaHtml('Semifinais', chave.sf),
  ].join('');

  document.getElementById('bloco-final').innerHTML = cartaoHtml(chave.final);
  document.getElementById('bloco-terceiro').innerHTML = cartaoHtml(chave.terceiro);

  UI.montarFooter();
});

function ladoHtml(timeId, rotulo, gols, classe) {
  const time = timeId ? DB.Times.get(timeId) : null;
  const nome = time ? time.nome : rotulo;
  return `<div class="bracket-team ${classe}">${time ? UI.bandeira(time, 'sm') : ''}<span class="nome">${DB.Util.escapar(nome)}</span><span class="gols">${gols ?? ''}</span></div>`;
}

function cartaoHtml(item) {
  const jogo = item.jogoId ? DB.Jogos.get(item.jogoId) : null;
  const comPlacar = jogo && UI.temPlacar(jogo);
  const vencedor = jogo && jogo.status === 'encerrado' ? DB.MataMata.vencedor(jogo) : null;
  const classe = id => (!vencedor ? '' : vencedor === id ? 'vencedor' : 'perdedor');
  const pen = jogo && jogo.penaltisMandante != null && jogo.penaltisVisitante != null
    ? `<div class="bracket-meta">Pênaltis: ${jogo.penaltisMandante}–${jogo.penaltisVisitante}</div>` : '';
  const data = jogo ? `<div class="bracket-meta">${DB.Util.formatarDataHora(jogo.data)}</div>` : '';
  const corpo = `
    ${ladoHtml(jogo && jogo.mandanteId, item.labelMandante, comPlacar ? jogo.golsMandante : null, jogo ? classe(jogo.mandanteId) : '')}
    ${ladoHtml(jogo && jogo.visitanteId, item.labelVisitante, comPlacar ? jogo.golsVisitante : null, jogo ? classe(jogo.visitanteId) : '')}
    ${pen || (comPlacar ? '' : data)}`;
  return jogo
    ? `<a class="bracket-match${item.projetado ? ' projetado' : ''}" href="jogo.html?id=${jogo.id}">${corpo}</a>`
    : `<div class="bracket-match projetado">${corpo}</div>`;
}

function colunaHtml(titulo, itens) {
  return `
    <div class="bracket-round">
      <div class="bracket-round-title">${titulo}</div>
      ${itens.map(cartaoHtml).join('')}
    </div>`;
}
