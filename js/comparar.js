document.addEventListener('DOMContentLoaded', () => {
  const esc = DB.Util.escapar;
  const params = new URLSearchParams(window.location.search);
  // Abre no campeonato do primeiro jogador do link, se vier um.
  const doLink = DB.Jogadores.get(params.get('a'));
  if (doLink && !params.get('c')) DB.Contexto.ajustarPara({ timeId: doLink.timeId });
  UI.montarTopbar();
  UI.montarTicker();
  const comp = DB.Contexto.get();
  document.getElementById('eyebrow-comparar').textContent = `${comp.curto} ${comp.temporada}`;

  const linhas = Object.fromEntries(DB.Estatisticas.porJogador().map(l => [l.jogador.id, l]));
  const notas = DB.Estatisticas.notasTemporada();
  // Na lista, primeiro quem jogou (por participação em gols), depois o resto do elenco.
  const jogadores = DB.Jogadores.all().slice().sort((a, b) => {
    const la = linhas[a.id], lb = linhas[b.id];
    return (lb ? lb.participacoes * 1000 + lb.minutos : -1) - (la ? la.participacoes * 1000 + la.minutos : -1) || a.nome.localeCompare(b.nome);
  });
  const rotulo = j => {
    const t = DB.Times.get(j.timeId);
    return `${j.nome} — ${t ? t.nome : ''}`;
  };
  const porRotulo = new Map(jogadores.map(j => [rotulo(j), j]));
  document.getElementById('lista-jogadores').innerHTML = jogadores.map(j => `<option value="${esc(rotulo(j))}"></option>`).join('');

  const campoA = document.getElementById('busca-a');
  const campoB = document.getElementById('busca-b');
  let a = doLink || null;
  let b = DB.Jogadores.get(params.get('b')) || null;
  // Sem link: sugere os dois maiores participantes em gols.
  if (!a && !b) {
    const top = DB.Estatisticas.ranking('participacoes', 2);
    a = top[0] ? top[0].jogador : null;
    b = top[1] ? top[1].jogador : null;
  }
  if (a) campoA.value = rotulo(a);
  if (b) campoB.value = rotulo(b);

  const escolher = (campo, lado) => {
    const j = porRotulo.get(campo.value);
    if (!j) return;
    if (lado === 'a') a = j; else b = j;
    const url = new URL(window.location.href);
    if (a) url.searchParams.set('a', a.id);
    if (b) url.searchParams.set('b', b.id);
    history.replaceState(null, '', url);
    render();
  };
  campoA.addEventListener('change', () => escolher(campoA, 'a'));
  campoB.addEventListener('change', () => escolher(campoB, 'b'));
  [campoA, campoB].forEach(c => c.addEventListener('focus', () => c.select()));

  const vazio = { jogos: 0, titular: 0, minutos: 0, gols: 0, assistencias: 0, participacoes: 0, penaltis: 0, jogosComGol: 0, amarelos: 0, vermelhos: 0, golsPor90: null };

  function cabeca(j) {
    const t = DB.Times.get(j.timeId);
    const n = notas[j.id];
    return `<a class="cmp-jogador" href="jogador.html?id=${j.id}">
      <span class="avatar" style="width:72px;height:72px;font-size:28px;${UI.estiloCores(j.timeId)}">${esc(DB.Util.iniciais(j.nome))}${j.numero != null ? `<span class="shirt-num">${j.numero}</span>` : ''}</span>
      <span class="cmp-nome">${esc(j.nome)}</span>
      <span class="cmp-sub">${UI.bandeira(t, 'sm')} ${t ? esc(t.nome) : ''} · ${esc(j.posicao)}</span>
      ${n ? `<span class="cmp-nota">${UI.notaHtml(Math.round(n.media * 10) / 10)}<small>nota média</small></span>` : ''}
    </a>`;
  }

  function render() {
    const box = document.getElementById('comparacao');
    if (!a || !b) {
      box.innerHTML = UI.vazio('Escolha dois jogadores', 'Digite o nome nos campos acima.');
      return;
    }
    const sa = { ...vazio, ...(linhas[a.id] || {}) }, sb = { ...vazio, ...(linhas[b.id] || {}) };
    const na = notas[a.id], nb = notas[b.id];
    const por90 = (s, campo) => (s.minutos >= 90 ? (s[campo] * 90) / s.minutos : null);
    const fmt = (v, casas = 0) => (v == null ? '—' : Number(v).toFixed(casas).replace('.', ','));
    // [rótulo, valor A, valor B, casas decimais, menor é melhor?]
    const itens = [
      ['Nota média', na && na.media, nb && nb.media, 2],
      ['Jogos', sa.jogos, sb.jogos],
      ['Titular', sa.titular, sb.titular],
      ['Minutos', sa.minutos, sb.minutos],
      ['Gols', sa.gols, sb.gols],
      ['Assistências', sa.assistencias, sb.assistencias],
      ['Participações em gol', sa.participacoes, sb.participacoes],
      ['Gols por 90 min', por90(sa, 'gols'), por90(sb, 'gols'), 2],
      ['G+A por 90 min', por90(sa, 'participacoes'), por90(sb, 'participacoes'), 2],
      ['Jogos com gol', sa.jogosComGol, sb.jogosComGol],
      ['Gols de pênalti', sa.penaltis, sb.penaltis],
      ['Cartões amarelos', sa.amarelos, sb.amarelos, 0, true],
      ['Cartões vermelhos', sa.vermelhos, sb.vermelhos, 0, true],
    ];
    const corA = DB.Util.coresTime(DB.Times.get(a.timeId)).primaria;
    let corB = DB.Util.coresTime(DB.Times.get(b.timeId)).primaria;
    if (corB.toLowerCase() === corA.toLowerCase()) corB = DB.Util.coresTime(DB.Times.get(b.timeId)).secundaria;
    let vitA = 0, vitB = 0;
    const linhasHtml = itens.map(([rot, va, vb, casas = 0, menor = false]) => {
      const x = va ?? 0, y = vb ?? 0;
      const total = x + y;
      const pa = total ? (x / total) * 100 : 50;
      const ganhaA = va != null && (vb == null || (menor ? x < y : x > y));
      const ganhaB = vb != null && (va == null || (menor ? y < x : y > x));
      if (ganhaA) vitA++;
      if (ganhaB) vitB++;
      return `<div class="est-linha">
        <div class="est-valores"><b class="${ganhaA ? 'lider' : ''}" style="--c:${corA}">${fmt(va, casas)}</b><span>${rot}</span><b class="${ganhaB ? 'lider' : ''}" style="--c:${corB}">${fmt(vb, casas)}</b></div>
        <div class="est-barras"><span class="est-barra" style="width:${pa}%;background:${corA}"></span><span class="est-barra" style="width:${100 - pa}%;background:${corB}"></span></div>
      </div>`;
    }).join('');
    box.innerHTML = `
      <div class="cmp-topo">${cabeca(a)}<div class="cmp-placar"><b>${vitA}</b><span>x</span><b>${vitB}</b><small>quesitos</small></div>${cabeca(b)}</div>
      <div class="est-jogo">${linhasHtml}</div>
      ${!linhas[a.id] || !linhas[b.id] ? '<p class="cmp-aviso">Jogador sem minutos ou lances no campeonato aparece com zeros.</p>' : ''}`;
    document.getElementById('page-title').textContent = `${a.nome} x ${b.nome} — Comparar — FUTSTATS`;
  }

  render();
  UI.montarFooter();
});
