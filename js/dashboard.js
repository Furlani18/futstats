AdminUI.guardarAutenticacao();

document.addEventListener('DOMContentLoaded', () => {
  AdminUI.montarSidebar();
  AdminUI.montarTopbar();
  DB.MataMata.sincronizar();

  const gruposEncerrados = DB.Grupos.letras.filter(letra => DB.Grupos.completo(letra)).length;
  const totalTimes = DB.Times.all().length;
  const totalJogadores = DB.Jogadores.all().length;
  const aoVivo = DB.Jogos.aoVivo();

  document.getElementById('kpi-grid').innerHTML = `
    <div class="kpi-card"><div class="kpi-label">Fase atual</div><div class="kpi-value" style="font-size:22px;">${DB.Util.faseLabel(DB.Torneio.faseAtual())}</div></div>
    <div class="kpi-card"><div class="kpi-label">Grupos encerrados</div><div class="kpi-value">${gruposEncerrados}/12</div></div>
    <div class="kpi-card"><div class="kpi-label">Seleções · Jogadores</div><div class="kpi-value">${totalTimes} · ${totalJogadores}</div></div>
    <div class="kpi-card"><div class="kpi-label">Jogos ao vivo</div><div class="kpi-value">${aoVivo.length}</div></div>`;

  document.getElementById('tbody-ao-vivo').innerHTML = aoVivo.length
    ? aoVivo.map(linhaAoVivo).join('')
    : linhaVazia(4, 'Nenhum jogo ao vivo agora.');

  const proximos = DB.Jogos.proximos(6);
  document.getElementById('tbody-proximos').innerHTML = proximos.length
    ? proximos.map(linhaProximo).join('')
    : linhaVazia(4, 'Nenhum jogo agendado.');
});

function linhaAoVivo(jogo) {
  const mandante = DB.Times.get(jogo.mandanteId);
  const visitante = DB.Times.get(jogo.visitanteId);
  return `<tr>
    <td>${UI.rotuloJogo(jogo)}</td>
    <td>${mandante ? mandante.nome : '—'} x ${visitante ? visitante.nome : '—'}</td>
    <td>${jogo.golsMandante} : ${jogo.golsVisitante}</td>
    <td>${jogo.local}</td>
  </tr>`;
}

function linhaProximo(jogo) {
  const mandante = DB.Times.get(jogo.mandanteId);
  const visitante = DB.Times.get(jogo.visitanteId);
  return `<tr>
    <td>${DB.Util.formatarDataHora(jogo.data)}</td>
    <td>${UI.rotuloJogo(jogo)}</td>
    <td>${mandante ? mandante.nome : '—'} x ${visitante ? visitante.nome : '—'}</td>
    <td>${jogo.local}</td>
  </tr>`;
}

function linhaVazia(colspan, texto) {
  return `<tr><td colspan="${colspan}" style="text-align:center;color:var(--text-dim);padding:24px;">${texto}</td></tr>`;
}
