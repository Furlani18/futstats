document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  DB.MataMata.sincronizar();

  const params = new URLSearchParams(window.location.search);
  const jogo = DB.Jogos.get(params.get('id'));

  if (!jogo) {
    document.getElementById('hero-jogo').innerHTML = '<p>Jogo não encontrado.</p>';
    UI.montarFooter();
    return;
  }

  const mandante = DB.Times.get(jogo.mandanteId);
  const visitante = DB.Times.get(jogo.visitanteId);
  const placar = (jogo.status === 'agendado' || jogo.status === 'adiado')
    ? 'vs'
    : `${jogo.golsMandante} - ${jogo.golsVisitante}`;
  const pens = (jogo.penaltisMandante != null && jogo.penaltisVisitante != null)
    ? ` <span style="font-size:16px;color:var(--text-dim);">(pên. ${jogo.penaltisMandante}-${jogo.penaltisVisitante})</span>`
    : '';

  const faseLabel = DB.Util.faseLabel(jogo.fase);
  const linkFase = jogo.fase === 'grupos' ? `grupos.html#grupo-${jogo.grupo}` : 'chaveamento.html';
  const rotuloFase = jogo.fase === 'grupos' ? `Grupo ${jogo.grupo}` : faseLabel;

  document.getElementById('page-title').textContent = `${mandante.nome} x ${visitante.nome} — FUTSTATS`;
  document.getElementById('breadcrumb').innerHTML = `<a href="index.html">Início</a> / <a href="${linkFase}">${rotuloFase}</a> / <span>${mandante.nome} x ${visitante.nome}</span>`;

  document.getElementById('hero-jogo').innerHTML = `
    <div class="hero-team"><a href="time.html?id=${mandante.id}">${UI.crestHtml(mandante, 76)}<div class="name">${mandante.nome}</div></a></div>
    <div>
      <div class="hero-score">${placar}${pens}</div>
      <div class="hero-status">${UI.badge(jogo.status)}</div>
    </div>
    <div class="hero-team"><a href="time.html?id=${visitante.id}">${UI.crestHtml(visitante, 76)}<div class="name">${visitante.nome}</div></a></div>`;

  const cartoes = (jogo.cartoesAmarelosMandante || jogo.cartoesVermelhosMandante || jogo.cartoesAmarelosVisitante || jogo.cartoesVermelhosVisitante)
    ? `<p><strong>Cartões:</strong> ${mandante.nome} ${jogo.cartoesAmarelosMandante || 0}🟨 ${jogo.cartoesVermelhosMandante || 0}🟥
       · ${visitante.nome} ${jogo.cartoesAmarelosVisitante || 0}🟨 ${jogo.cartoesVermelhosVisitante || 0}🟥</p>`
    : '';

  document.getElementById('detalhes-jogo').innerHTML = `
    <p><strong>Torneio:</strong> ${DB.Torneio.nome}</p>
    <p><strong>Fase:</strong> ${faseLabel}${jogo.fase === 'grupos' ? ` — Grupo ${jogo.grupo} (rodada ${jogo.rodada})` : ''}</p>
    <p><strong>Data:</strong> ${DB.Util.formatarDataHora(jogo.data)}</p>
    <p><strong>Local:</strong> ${jogo.local}</p>
    ${jogo.projetado ? '<p><strong>Confronto:</strong> ainda projetado — pode mudar até a fase anterior terminar.</p>' : ''}
    ${cartoes}`;

  if (jogo.fase === 'grupos') {
    document.getElementById('titulo-mini-classificacao').textContent = `Classificação — Grupo ${jogo.grupo}`;
    document.getElementById('corpo-lateral').innerHTML = `
      <table class="standings-table" id="tabela-mini">
        <thead><tr><th>#</th><th>Time</th><th>P</th><th>SG</th></tr></thead>
        <tbody>${UI.linhasClassificacao(DB.Classificacao.grupo(jogo.grupo), { colunas: 'jogo' })}</tbody>
      </table>`;
  } else {
    document.getElementById('titulo-mini-classificacao').textContent = 'Chaveamento';
    document.getElementById('corpo-lateral').innerHTML = `
      <p style="color:var(--text-dim);font-size:13px;">Jogo da fase eliminatória — ${faseLabel}.</p>
      <a href="chaveamento.html" class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:8px;">Ver chaveamento completo</a>`;
  }

  const relacionados = jogo.fase === 'grupos'
    ? DB.Jogos.porGrupo(jogo.grupo)
    : DB.Jogos.porFase(jogo.fase);
  const ordenados = [...relacionados].sort((a, b) => new Date(a.data) - new Date(b.data));
  const indiceAtual = ordenados.findIndex(j => j.id === jogo.id);
  const anterior = indiceAtual > 0 ? ordenados[indiceAtual - 1] : null;
  const proximo = indiceAtual < ordenados.length - 1 ? ordenados[indiceAtual + 1] : null;

  document.getElementById('nav-jogo').innerHTML = `
    ${anterior
      ? `<a href="jogo.html?id=${anterior.id}">◀ <span>${confrontoLabel(anterior)}</span></a>`
      : '<a class="disabled">◀ Jogo anterior</a>'}
    ${proximo
      ? `<a class="prox" href="jogo.html?id=${proximo.id}"><span>${confrontoLabel(proximo)}</span> ▶</a>`
      : '<a class="disabled prox">Próximo jogo ▶</a>'}
  `;

  UI.montarFooter();
});

function confrontoLabel(j) {
  const m = DB.Times.get(j.mandanteId);
  const v = DB.Times.get(j.visitanteId);
  return `${m ? m.nome : '—'} x ${v ? v.nome : '—'}`;
}
