// Comparação lado a lado: jogadores (padrão) ou times (?modo=times). Links: ?a=<id>&b=<id>.
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const modoTimes = params.get('modo') === 'times';
  // Abre no campeonato do primeiro item do link, se vier um.
  const doLink = modoTimes ? DB.Times.get(params.get('a')) : DB.Jogadores.get(params.get('a'));
  if (doLink && !params.get('c')) DB.Contexto.ajustarPara({ timeId: modoTimes ? doLink.id : doLink.timeId });
  UI.montarTopbar();
  UI.montarTicker();
  const comp = DB.Contexto.get();
  document.getElementById('eyebrow-comparar').textContent = `${comp.curto} ${comp.temporada}`;
  const abaAtiva = document.getElementById(modoTimes ? 'aba-times' : 'aba-jogadores');
  abaAtiva.classList.add('active');
  abaAtiva.setAttribute('aria-selected', 'true');
  document.getElementById(modoTimes ? 'aba-jogadores' : 'aba-times').setAttribute('aria-selected', 'false');
  if (modoTimes) compararTimes(doLink);
  else compararJogadores(doLink);
  UI.montarFooter();
});

// Linhas "valor A · rótulo · valor B" com barras proporcionais.
// itens: [rótulo, valor A, valor B, casas decimais, menor é melhor?, neutro (não conta no placar)?]
function linhasComparacao(itens, corA, corB) {
  const fmt = (v, casas = 0) => (v == null ? '—' : Number(v).toFixed(casas).replace('.', ','));
  let vitA = 0, vitB = 0;
  const html = itens.map(([rot, va, vb, casas = 0, menor = false, neutro = false]) => {
    let x = va ?? 0, y = vb ?? 0;
    // Valores negativos (saldo de gols): desloca os dois para a barra continuar proporcional.
    const base = Math.min(0, x, y);
    x -= base; y -= base;
    const total = x + y;
    // Quando menor é melhor (posição, derrotas), a barra maior fica com quem tem o número menor.
    const pa = total ? ((menor ? y : x) / total) * 100 : 50;
    const ganhaA = !neutro && va != null && (vb == null || (menor ? va < vb : va > vb));
    const ganhaB = !neutro && vb != null && (va == null || (menor ? vb < va : vb > va));
    if (ganhaA) vitA++;
    if (ganhaB) vitB++;
    return `<div class="est-linha">
      <div class="est-valores"><b class="${ganhaA ? 'lider' : ''}" style="--c:${corA}">${fmt(va, casas)}</b><span>${rot}</span><b class="${ganhaB ? 'lider' : ''}" style="--c:${corB}">${fmt(vb, casas)}</b></div>
      <div class="est-barras" aria-hidden="true"><span class="est-barra" style="width:${pa}%;background:${corA}"></span><span class="est-barra" style="width:${100 - pa}%;background:${corB}"></span></div>
    </div>`;
  }).join('');
  return { html, vitA, vitB };
}

// Campo de busca com <datalist>: escolhe o item pelo texto e atualiza ?a=/?b= no endereço.
function ligarEscolha(campo, porRotulo, aoEscolher) {
  campo.addEventListener('change', () => {
    const item = porRotulo.get(campo.value);
    if (item) aoEscolher(item);
  });
  campo.addEventListener('focus', () => campo.select());
}

function atualizarUrl(a, b) {
  const url = new URL(window.location.href);
  if (a) url.searchParams.set('a', a.id);
  if (b) url.searchParams.set('b', b.id);
  history.replaceState(null, '', url);
}

function compararJogadores(doLink) {
  const esc = DB.Util.escapar;
  const params = new URLSearchParams(window.location.search);
  const linhas = Object.fromEntries(DB.Estatisticas.porJogador().map(l => [l.jogador.id, l]));
  const listaLinhas = Object.values(linhas);
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
  ligarEscolha(campoA, porRotulo, j => { a = j; atualizarUrl(a, b); render(); });
  ligarEscolha(campoB, porRotulo, j => { b = j; atualizarUrl(a, b); render(); });

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
    const graficos = document.getElementById('cmp-graficos');
    if (!a || !b) {
      box.innerHTML = UI.vazio('Escolha dois jogadores', 'Digite o nome nos campos acima.');
      graficos.hidden = true;
      return;
    }
    const sa = { ...vazio, ...(linhas[a.id] || {}) }, sb = { ...vazio, ...(linhas[b.id] || {}) };
    const na = notas[a.id], nb = notas[b.id];
    const por90 = (s, campo) => (s.minutos >= 90 ? (s[campo] * 90) / s.minutos : null);
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
    const corA = UI.corDoTime(DB.Times.get(a.timeId));
    const corB = UI.corDoTime(DB.Times.get(b.timeId), corA);
    const { html, vitA, vitB } = linhasComparacao(itens, corA, corB);
    box.innerHTML = `
      <div class="cmp-topo">${cabeca(a)}<div class="cmp-placar"><b>${vitA}</b><span>x</span><b>${vitB}</b><small>quesitos</small></div>${cabeca(b)}</div>
      <div class="est-jogo">${html}</div>
      ${!linhas[a.id] || !linhas[b.id] ? '<p class="cmp-aviso">Jogador sem minutos ou lances no campeonato aparece com zeros.</p>' : ''}`;
    document.getElementById('page-title').textContent = `${a.nome} x ${b.nome} — Comparar — FUTSTATS`;

    // Radar dos dois no mesmo gráfico (cada eixo relativo ao melhor da posição de cada um).
    const pa = DB.Estatisticas.perfil(a.id, listaLinhas, notas), pb = DB.Estatisticas.perfil(b.id, listaLinhas, notas);
    if (pa && pb) {
      graficos.hidden = false;
      graficos.innerHTML = `<section class="panel"><div class="panel-header"><span class="panel-title">Perfil lado a lado</span></div><div class="grafico-caixa" id="cmp-radar"></div>
        <p class="grafico-nota">Cada eixo vai de 0 ao melhor da posição de cada jogador no campeonato.</p></section>`;
      const caixa = document.getElementById('cmp-radar');
      caixa.innerHTML = UI.graficoRadar(pa.eixos, [
        { nome: a.nome, cor: corA, valores: pa.valores, textos: pa.textos },
        { nome: b.nome, cor: corB, valores: pb.valores, textos: pb.textos },
      ], { tamanho: Math.min(360, Math.max(280, caixa.clientWidth - 28)) });
    } else graficos.hidden = true;
  }

  render();
}

function compararTimes(doLink) {
  const esc = DB.Util.escapar;
  const params = new URLSearchParams(window.location.search);
  const comp = DB.Contexto.get();
  const ehLiga = comp.tipo === 'liga' || comp.tipo === 'champions';
  document.getElementById('escolha-jogadores').hidden = true;
  document.getElementById('escolha-times').hidden = false;
  document.getElementById('titulo-comparar').textContent = `Comparar ${UI.rotuloTimes().toLowerCase()}`;
  document.getElementById('lead-comparar').textContent = 'Campanha, ataque, defesa, disciplina e confronto direto de dois times do campeonato, frente a frente.';

  const times = DB.Times.all();
  const porRotulo = new Map(times.map(t => [t.nome, t]));
  document.getElementById('lista-times').innerHTML = times.map(t => `<option value="${esc(t.nome)}"></option>`).join('');
  const stats = Object.fromEntries(DB.Estatisticas.porTime().map(s => [s.time.id, s]));
  const tabelaLiga = ehLiga ? DB.Classificacao.liga() : null;
  const posicaoDe = id => {
    if (tabelaLiga) { const l = tabelaLiga.find(x => x.timeId === id); return l && l.J ? l.posicao : null; }
    const letra = DB.Grupos.deTime(id);
    if (!letra) return null;
    const l = DB.Classificacao.grupo(letra).find(x => x.timeId === id);
    return l && l.J ? l.posicao : null;
  };

  let a = doLink || null;
  let b = DB.Times.get(params.get('b')) || null;
  // Sem link: os dois primeiros da tabela (ou os dois melhores ataques).
  if (!a && !b) {
    const ordem = tabelaLiga ? tabelaLiga.map(l => l.timeId)
      : Object.values(stats).sort((x, y) => (y.V * 3 + y.E) - (x.V * 3 + x.E) || y.GP - x.GP).map(s => s.time.id);
    a = DB.Times.get(ordem[0]);
    b = DB.Times.get(ordem[1]);
  }
  const campoA = document.getElementById('time-a'), campoB = document.getElementById('time-b');
  if (a) campoA.value = a.nome;
  if (b) campoB.value = b.nome;
  ligarEscolha(campoA, porRotulo, t => { a = t; atualizarUrl(a, b); render(); });
  ligarEscolha(campoB, porRotulo, t => { b = t; atualizarUrl(a, b); render(); });

  function cabeca(t) {
    const pos = posicaoDe(t.id);
    const letra = DB.Grupos.deTime(t.id);
    const onde = tabelaLiga ? (pos ? `${pos}º na tabela` : 'Sem jogos') : letra ? `Grupo ${letra}${pos ? ` · ${pos}º` : ''}` : '';
    return `<a class="cmp-jogador" href="time.html?id=${t.id}">
      ${UI.bandeira(t, 'xl')}
      <span class="cmp-nome">${esc(t.nome)}</span>
      <span class="cmp-sub">${esc([onde, t.tecnico].filter(Boolean).join(' · '))}</span>
      <span class="cmp-forma">${UI.formaRecente(t.id, 5)}</span>
    </a>`;
  }

  function render() {
    const box = document.getElementById('comparacao');
    const graficos = document.getElementById('cmp-graficos');
    if (!a || !b || a.id === b.id) {
      box.innerHTML = UI.vazio('Escolha dois times diferentes', 'Digite o nome nos campos acima.');
      graficos.hidden = true;
      return;
    }
    const sa = stats[a.id], sb = stats[b.id];
    const aprov = s => (s.J ? ((s.V * 3 + s.E) / (s.J * 3)) * 100 : null);
    const porJogo = (s, campo) => (s.J ? s[campo] / s.J : null);
    const itens = [
      ['Posição', posicaoDe(a.id), posicaoDe(b.id), 0, true],
      ['Jogos', sa.J, sb.J, 0, false, true],
      ['Vitórias', sa.V, sb.V],
      ['Empates', sa.E, sb.E, 0, false, true],
      ['Derrotas', sa.D, sb.D, 0, true],
      ['Aproveitamento (%)', aprov(sa), aprov(sb)],
      ['Gols marcados', sa.GP, sb.GP],
      ['Gols sofridos', sa.GC, sb.GC, 0, true],
      ['Saldo de gols', sa.SG, sb.SG],
      ['Gols por jogo', porJogo(sa, 'GP'), porJogo(sb, 'GP'), 2],
      ['Sofridos por jogo', porJogo(sa, 'GC'), porJogo(sb, 'GC'), 2, true],
      ['Jogos sem sofrer gol', sa.semSofrer, sb.semSofrer],
      ['Cartões amarelos', sa.CA, sb.CA, 0, true],
      ['Cartões vermelhos', sa.CV, sb.CV, 0, true],
    ];
    const corA = UI.corDoTime(a), corB = UI.corDoTime(b, corA);
    const { html, vitA, vitB } = linhasComparacao(itens, corA, corB);
    box.innerHTML = `
      <div class="cmp-topo">${cabeca(a)}<div class="cmp-placar"><b>${vitA}</b><span>x</span><b>${vitB}</b><small>quesitos</small></div>${cabeca(b)}</div>
      <div class="est-jogo">${html}</div>
      ${!sa.J || !sb.J ? '<p class="cmp-aviso">Time sem jogos disputados no campeonato aparece com zeros.</p>' : ''}`;
    document.getElementById('page-title').textContent = `${a.nome} x ${b.nome} — Comparar — FUTSTATS`;

    // Confronto direto (todos os campeonatos cadastrados) e, nas ligas, a campanha rodada a rodada.
    const h2h = DB.Estatisticas.confrontoDireto(a.id, b.id);
    const resumoH2h = h2h.jogos.length
      ? `<div class="h2h-placar">
          <div><b>${h2h.vitoriasA}</b><span>${esc(a.nome)}</span></div>
          <div><b>${h2h.empates}</b><span>Empates</span></div>
          <div><b>${h2h.vitoriasB}</b><span>${esc(b.nome)}</span></div>
        </div>
        <div class="h2h-barra"><span style="flex:${h2h.vitoriasA};background:${corA}"></span><span style="flex:${h2h.empates};background:var(--text-faint)"></span><span style="flex:${h2h.vitoriasB};background:${corB}"></span></div>
        <p class="grafico-nota" style="padding:8px 0 0;">Gols: ${h2h.golsA} x ${h2h.golsB} em ${h2h.jogos.length} jogo${h2h.jogos.length === 1 ? '' : 's'}</p>
        <div class="match-list">${h2h.jogos.slice(0, 6).map(UI.linhaJogoCompacta).join('')}</div>`
      : '<div class="h2h-vazio">Nenhum jogo entre os dois cadastrado até agora.</div>';
    const evA = ehLiga ? DB.Estatisticas.evolucaoPosicao(a.id) : [], evB = ehLiga ? DB.Estatisticas.evolucaoPosicao(b.id) : [];
    graficos.hidden = false;
    graficos.innerHTML = `
      <section class="panel"><div class="panel-header"><span class="panel-title">Confronto direto</span></div><div class="h2h">${resumoH2h}</div></section>
      ${evA.length >= 2 ? '<section class="panel"><div class="panel-header"><span class="panel-title">Posição rodada a rodada</span></div><div class="grafico-caixa" id="cmp-campanha"></div></section>' : ''}`;
    if (evA.length >= 2) {
      const n = times.length;
      const caixa = document.getElementById('cmp-campanha');
      const serie = (t, ev, cor) => ({ nome: t.nome, cor, pontos: ev.map(e => ({ x: e.rodada, y: e.posicao, rotulo: `${e.rodada}ª rodada: ${e.posicao}º · ${e.pontos} pts` })) });
      caixa.innerHTML = UI.graficoLinhas([serie(a, evA, corA), serie(b, evB, corB)], {
        yMin: 1, yMax: n, inverter: true, rotuloY: v => `${v}º`, largura: caixa.clientWidth - 28,
        marcasY: [1, Math.round(n / 4), Math.round(n / 2), Math.round((3 * n) / 4), n].filter((v, i, l) => l.indexOf(v) === i),
      });
    }
  }

  render();
}
