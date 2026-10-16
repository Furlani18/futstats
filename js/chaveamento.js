document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();

  const chave = DB.MataMata.sincronizar();

  document.getElementById('bracket').innerHTML = [
    colunaHtml('32avos de final', chave.r32),
    colunaHtml('Oitavas de final', chave.r16),
    colunaHtml('Quartas de final', chave.qf),
    colunaHtml('Semifinal', chave.sf),
  ].join('');

  document.getElementById('bloco-final').innerHTML = `<div class="bracket-round-title">Final</div>${cartaoHtml(chave.final)}`;
  document.getElementById('bloco-terceiro').innerHTML = `<div class="bracket-round-title">Disputa de 3º lugar</div>${cartaoHtml(chave.terceiro)}`;

  UI.montarFooter();
});

function dadosItem(item) {
  const jogo = item.jogoId ? DB.Jogos.get(item.jogoId) : null;
  const mandanteId = jogo ? jogo.mandanteId : null;
  const visitanteId = jogo ? jogo.visitanteId : null;
  const nomeM = mandanteId ? DB.Times.get(mandanteId).nome : item.labelMandante;
  const nomeV = visitanteId ? DB.Times.get(visitanteId).nome : item.labelVisitante;
  const finalizado = jogo && jogo.status === 'encerrado';
  const vencedorId = finalizado ? DB.MataMata.vencedor(jogo) : null;
  return {
    jogo, nomeM, nomeV,
    golsM: finalizado ? jogo.golsMandante : null,
    golsV: finalizado ? jogo.golsVisitante : null,
    penM: jogo ? jogo.penaltisMandante : null,
    penV: jogo ? jogo.penaltisVisitante : null,
    vencedorMandante: vencedorId && mandanteId === vencedorId,
    vencedorVisitante: vencedorId && visitanteId === vencedorId,
    projetado: item.projetado,
  };
}

function cartaoHtml(item) {
  const d = dadosItem(item);
  const pen = (d.penM != null && d.penV != null) ? `<div class="bracket-meta">Pênaltis: ${d.penM} x ${d.penV}</div>` : '';
  return `
    <div class="bracket-match${d.projetado ? ' projetado' : ''}">
      <div class="bracket-team${d.vencedorMandante ? ' vencedor' : ''}"><span>${d.nomeM}</span><span class="gols">${d.golsM ?? ''}</span></div>
      <div class="bracket-team${d.vencedorVisitante ? ' vencedor' : ''}"><span>${d.nomeV}</span><span class="gols">${d.golsV ?? ''}</span></div>
      ${pen}
    </div>`;
}

function colunaHtml(titulo, itens) {
  return `
    <div class="bracket-round">
      <div class="bracket-round-title">${titulo}</div>
      ${itens.map(cartaoHtml).join('')}
    </div>`;
}
