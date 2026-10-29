// Mapa das sedes da Copa 2026: SVG esquemático (contorno simplificado em longitude/latitude,
// projeção equirretangular), um ponto por estádio, do tamanho do número de jogos.
// Três modos: as sedes, a viagem de uma seleção (rota e km) e o dia a dia do torneio.
// Capacidades aproximadas, na configuração da Copa.
const SEDES_2026 = [
  { estadio: 'BC Place', cidade: 'Vancouver', pais: 'ca', lon: -123.11, lat: 49.28, capacidade: 54000, rotulo: [10, -8, 'start'] },
  { estadio: 'Lumen Field', cidade: 'Seattle', pais: 'us', lon: -122.33, lat: 47.6, capacidade: 69000, rotulo: [10, 4, 'start'] },
  { estadio: "Levi's Stadium", cidade: 'São Francisco', pais: 'us', lon: -121.97, lat: 37.4, capacidade: 71000, rotulo: [10, 4, 'start'] },
  { estadio: 'SoFi Stadium', cidade: 'Los Angeles', pais: 'us', lon: -118.34, lat: 33.95, capacidade: 70000, rotulo: [10, 4, 'start'] },
  { estadio: 'Estadio Akron', cidade: 'Guadalajara', pais: 'mx', lon: -103.46, lat: 20.68, capacidade: 48000, rotulo: [-10, 4, 'end'] },
  { estadio: 'Estadio Azteca', cidade: 'Cidade do México', pais: 'mx', lon: -99.15, lat: 19.3, capacidade: 83000, rotulo: [10, 14, 'start'] },
  { estadio: 'Estadio BBVA', cidade: 'Monterrey', pais: 'mx', lon: -100.24, lat: 25.67, capacidade: 53500, rotulo: [-10, 4, 'end'] },
  { estadio: 'NRG Stadium', cidade: 'Houston', pais: 'us', lon: -95.41, lat: 29.68, capacidade: 72000, rotulo: [10, 12, 'start'] },
  { estadio: 'AT&T Stadium', cidade: 'Dallas', pais: 'us', lon: -97.09, lat: 32.75, capacidade: 94000, rotulo: [-10, 4, 'end'] },
  { estadio: 'Arrowhead Stadium', cidade: 'Kansas City', pais: 'us', lon: -94.48, lat: 39.05, capacidade: 73000, rotulo: [-10, 4, 'end'] },
  { estadio: 'Mercedes-Benz Stadium', cidade: 'Atlanta', pais: 'us', lon: -84.4, lat: 33.75, capacidade: 75000, rotulo: [-10, 4, 'end'] },
  { estadio: 'Hard Rock Stadium', cidade: 'Miami', pais: 'us', lon: -80.24, lat: 25.96, capacidade: 65000, rotulo: [10, 4, 'start'] },
  { estadio: 'Gillette Stadium', cidade: 'Boston', pais: 'us', lon: -71.26, lat: 42.09, capacidade: 65000, rotulo: [10, -4, 'start'] },
  { estadio: 'MetLife Stadium', cidade: 'Nova York/Nova Jersey', pais: 'us', lon: -74.07, lat: 40.81, capacidade: 82500, rotulo: [10, 10, 'start'], final: true },
  { estadio: 'Lincoln Financial Field', cidade: 'Filadélfia', pais: 'us', lon: -75.17, lat: 39.9, capacidade: 69000, rotulo: [-10, 12, 'end'] },
  { estadio: 'BMO Field', cidade: 'Toronto', pais: 'ca', lon: -79.42, lat: 43.63, capacidade: 45000, rotulo: [-10, -6, 'end'] },
];

// Contorno simplificado (EUA contíguo, sul do Canadá até 52°N e México), lagos e fronteiras.
const MAPA_2026 = {
  terra: [[-128, 52], [-127.5, 50.5], [-125, 48.8], [-124.7, 48.4], [-124, 46.2], [-124.1, 43], [-124.4, 40.4], [-123, 38], [-122.4, 37.2], [-121.8, 36.5], [-120.6, 34.6], [-118.5, 34], [-117.2, 32.7],
    [-116.8, 31.5], [-115.8, 30], [-114.2, 28], [-112.2, 26], [-110.3, 23.2], [-109.5, 23.1], [-110.5, 24.5], [-111.5, 26.2], [-112.8, 28.5], [-114.8, 31.6],
    [-113, 31.3], [-111.5, 29], [-110, 27], [-108.8, 25.5], [-106.4, 23.2], [-105.3, 21.5], [-105.6, 20.4], [-104.3, 19.1], [-102, 17.9], [-99.9, 16.8], [-97, 15.8], [-95, 16.1], [-93, 15.6], [-92.2, 14.5],
    [-91, 14], [-88.5, 15.8], [-88.3, 18.4], [-87.5, 21.5], [-90.3, 21.3], [-90.5, 19.5], [-91.8, 18.6], [-94.5, 18.2], [-96, 19.2], [-97.2, 21], [-97.5, 23], [-97.4, 25.9],
    [-97.2, 27.6], [-96, 28.6], [-94.6, 29.4], [-93, 29.7], [-90.5, 29.1], [-89.2, 29.2], [-89.5, 30.2], [-88, 30.4], [-86.5, 30.4], [-85, 29.7], [-84, 30], [-82.8, 28], [-82, 26.5], [-81, 25.1], [-80.3, 25.4],
    [-80, 26.8], [-80.6, 28.5], [-81.4, 30.5], [-81, 31.8], [-79.2, 33.2], [-77.9, 34], [-75.5, 35.3], [-76, 36.9], [-75.6, 38], [-74.9, 38.9], [-74, 40.5], [-73, 40.8], [-71, 41.4], [-70, 41.7], [-70.6, 42.6],
    [-70.2, 43.7], [-68, 44.4], [-66.9, 44.8], [-64.8, 45.8], [-61, 45.6], [-60, 46.3], [-64.5, 47.9], [-65, 49.2], [-67.5, 49.3], [-64, 50.2], [-60, 50.2], [-60, 52]],
  lagos: [
    [[-92.1, 46.7], [-90, 46.6], [-87, 46.5], [-84.6, 46.5], [-85, 47.5], [-86.5, 48.7], [-88.5, 48.4], [-90, 47.9], [-91.5, 47.1]],
    [[-87.8, 41.7], [-86.5, 42], [-86.2, 43.5], [-85.6, 45.5], [-85, 46], [-86.5, 45.9], [-87.5, 45.3], [-87.9, 44], [-87.8, 42.5]],
    [[-82.5, 43], [-82.3, 44.3], [-81.6, 45.3], [-80.3, 45.3], [-81, 46.1], [-83.6, 46.1], [-84.6, 45.8], [-84, 44.5], [-83.3, 44]],
    [[-83.4, 41.7], [-81.5, 41.5], [-79, 42.6], [-79.8, 42.9], [-81.5, 42.6], [-83, 42.1]],
    [[-79.8, 43.3], [-78, 43.4], [-76.2, 43.5], [-76.4, 44.2], [-77.5, 44], [-79.4, 43.7]],
  ],
  fronteiras: [
    [[-117.1, 32.5], [-114.7, 32.7], [-111, 31.3], [-108.2, 31.3], [-108.2, 31.8], [-106.5, 31.8], [-104.5, 29.6], [-103, 29], [-102.4, 29.8], [-101, 29.8], [-99.5, 27.5], [-97.2, 25.9]],
    [[-123.3, 49], [-95.2, 49], [-89.6, 48], [-84.6, 46.5], [-82.4, 43], [-79, 43.2], [-76.3, 44.2], [-74.7, 45], [-71.5, 45], [-70, 46.7], [-69.2, 47.4], [-67.8, 47.1], [-67.8, 45.7], [-67, 44.9]],
  ],
};

document.addEventListener('DOMContentLoaded', () => {
  // As sedes são da Copa: abre sempre nela (o link do menu só aparece na Copa).
  if (!DB.Contexto.ehCopa()) { DB.Contexto.definir('copa2026'); }
  UI.montarTopbar();
  UI.montarTicker();
  DB.MataMata.sincronizar();
  const esc = DB.Util.escapar;
  const PAISES = { us: 'Estados Unidos', mx: 'México', ca: 'Canadá' };
  const nomeCurto = s => s.cidade.replace('Nova York/Nova Jersey', 'Nova York/NJ');

  // ---------- Partidas por sede ----------
  // Jogos cadastrados (pelo nome do estádio no local); sem nenhum cadastrado, o calendário oficial.
  // Formato único: { data, sede, mandanteId, visitanteId, jogo?, rotulo }.
  const porNome = Object.fromEntries(DB.Times.all().map(t => [t.nome, t]));
  const sedeDoLocal = local => SEDES_2026.findIndex(s => (local || '').startsWith(s.estadio));
  const cadastrados = DB.Jogos.all().filter(j => j.data && sedeDoLocal(j.local) !== -1);
  const usaCadastro = cadastrados.length > 0;
  const partidas = (usaCadastro
    ? cadastrados.map(j => ({ data: j.data, sede: sedeDoLocal(j.local), mandanteId: j.mandanteId, visitanteId: j.visitanteId, jogo: j, rotulo: UI.rotuloJogo(j) }))
    : (typeof CALENDARIO_GRUPOS_2026 !== 'undefined' ? CALENDARIO_GRUPOS_2026 : []).map(c => ({
      data: c.data, sede: SEDES_2026.findIndex(s => s.estadio === c.estadio),
      mandanteId: (porNome[c.mandante] || {}).id, visitanteId: (porNome[c.visitante] || {}).id, rotulo: `Grupo ${c.grupo} · ${c.rodada}ª rodada`,
    })).filter(p => p.sede !== -1)
  ).sort((a, b) => a.data.localeCompare(b.data));
  const jogosDa = i => partidas.filter(p => p.sede === i);
  const qtd = SEDES_2026.map((s, i) => jogosDa(i).length);
  const maxQtd = Math.max(1, ...qtd);
  const diaDe = p => p.data.slice(0, 10);
  const dias = [...new Set(partidas.map(diaDe))];

  // Distância em linha reta entre duas sedes (fórmula de haversine), em km.
  function km(a, b) {
    const R = 6371, rad = g => (g * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(h)));
  }

  // ---------- Desenho do mapa ----------
  // Projeção: equirretangular com a longitude encolhida por cos(35°).
  const LON0 = -128, LAT0 = 52, ESCALA = 14, COS = Math.cos((35 * Math.PI) / 180);
  const px = lon => (lon - LON0) * ESCALA * COS, py = lat => (LAT0 - lat) * ESCALA;
  const L = Math.round(px(-60)), A = Math.round(py(13));
  const caminho = (pts, fechar = true) => pts.map(([lon, lat], i) => `${i ? 'L' : 'M'}${px(lon).toFixed(1)},${py(lat).toFixed(1)}`).join(' ') + (fechar ? ' Z' : '');
  const raio = i => 6 + (qtd[i] / maxQtd) * 6;
  // Grade de 10 em 10 graus, como num mapa de verdade.
  const grade = [
    ...[-120, -110, -100, -90, -80, -70].map(lon => `M${px(lon).toFixed(1)},0 V${A}`),
    ...[20, 30, 40, 50].map(lat => `M0,${py(lat).toFixed(1)} H${L}`),
  ].join(' ');

  const mapa = document.getElementById('sedes-mapa');
  mapa.innerHTML = `
    <svg viewBox="0 0 ${L} ${A}" role="img" aria-label="Mapa das 16 sedes da Copa nos EUA, México e Canadá">
      <defs>
        <radialGradient id="mapa-oceano" cx="45%" cy="35%" r="80%"><stop offset="0" stop-color="var(--mapa-oceano-1)"/><stop offset="1" stop-color="var(--mapa-oceano-2)"/></radialGradient>
        <linearGradient id="mapa-relevo" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="var(--mapa-terra-1)"/><stop offset="1" stop-color="var(--mapa-terra)"/></linearGradient>
        <filter id="mapa-sombra" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity=".35"/></filter>
        ${['us', 'mx', 'ca', 'final'].map(k => `<radialGradient id="halo-${k}"><stop offset="0" stop-color="var(--sede-${k})" stop-opacity=".55"/><stop offset="1" stop-color="var(--sede-${k})" stop-opacity="0"/></radialGradient>`).join('')}
        <marker id="mapa-seta" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--gold)"/></marker>
      </defs>
      <rect class="mapa-oceano" width="${L}" height="${A}" fill="url(#mapa-oceano)"/>
      <path class="mapa-grade" d="${grade}"/>
      <path class="mapa-terra" d="${caminho(MAPA_2026.terra)}" fill="url(#mapa-relevo)" filter="url(#mapa-sombra)"/>
      ${MAPA_2026.lagos.map(l => `<path class="mapa-lago" d="${caminho(l)}"/>`).join('')}
      ${MAPA_2026.fronteiras.map(f => `<path class="mapa-fronteira" d="${caminho(f, false)}"/>`).join('')}
      <text class="mapa-pais" x="${px(-101)}" y="${py(40.5)}">ESTADOS UNIDOS</text>
      <text class="mapa-pais" x="${px(-106.5)}" y="${py(29)}">MÉXICO</text>
      <text class="mapa-pais" x="${px(-108)}" y="${py(50.6)}">CANADÁ</text>
      <g id="mapa-rotas"></g>
      ${SEDES_2026.map((s, i) => {
        const x = px(s.lon), y = py(s.lat), r = raio(i);
        const [dx, dy, ancora] = s.rotulo;
        return `<g class="mapa-sede${s.final ? ' final' : ''}" data-i="${i}" data-pais="${s.pais}" tabindex="0" role="button" aria-label="${esc(`${s.cidade}: ${s.estadio}, ${qtd[i]} jogos`)}">
          <circle class="mapa-halo" cx="${x}" cy="${y}" r="${r * 2.6}" fill="url(#halo-${s.final ? 'final' : s.pais})"/>
          <circle class="mapa-pulso" cx="${x}" cy="${y}" r="${r}"/>
          <circle cx="${x}" cy="${y}" r="${r + 8}" fill="transparent"/>
          <circle class="mapa-ponto" cx="${x}" cy="${y}" r="${r}" style="fill:var(--sede-${s.pais})"/>
          ${s.final ? `<path class="mapa-estrela" transform="translate(${x - 6},${y - 6}) scale(.5)" d="M12 2l3 6.3 6.9 1-5 4.8 1.2 6.9L12 17.8 5.9 21l1.2-6.9-5-4.8 6.9-1z"/>` : ''}
          <text class="mapa-rotulo" x="${x + dx}" y="${y + dy}" text-anchor="${ancora}">${esc(nomeCurto(s))}</text>
        </g>`;
      }).join('')}
    </svg>
    <div class="mapa-cartao" id="mapa-cartao" hidden></div>`;

  // ---------- Cartão ao passar o mouse (ou focar pelo teclado) ----------
  const cartao = document.getElementById('mapa-cartao');
  const agora = Date.now();
  const inicio = p => new Date(`${p.data.slice(0, 16)}:00-03:00`).getTime();
  function mostrarCartao(i, alvo) {
    const s = SEDES_2026[i];
    const lista = jogosDa(i);
    const prox = lista.find(p => inicio(p) > agora);
    const t = id => DB.Times.get(id);
    cartao.innerHTML = `<b>${esc(s.estadio)}</b>
      <span>${UI.bandeiraPais(s.pais)} ${esc(s.cidade)}</span>
      <span>${s.capacidade.toLocaleString('pt-BR')} lugares · ${lista.length} jogo${lista.length === 1 ? '' : 's'}${s.final ? ' · <em>final</em>' : ''}</span>
      ${prox ? `<span class="mapa-cartao-prox">Próximo: ${DB.Util.formatarData(prox.data).slice(0, 5)} · ${esc(t(prox.mandanteId)?.codigo || '?')} x ${esc(t(prox.visitanteId)?.codigo || '?')}</span>` : ''}`;
    cartao.hidden = false;
    const caixa = mapa.getBoundingClientRect(), ponto = alvo.querySelector('.mapa-ponto').getBoundingClientRect();
    const x = ponto.left + ponto.width / 2 - caixa.left, y = ponto.top - caixa.top;
    const esquerda = Math.min(Math.max(8, x - cartao.offsetWidth / 2), caixa.width - cartao.offsetWidth - 8);
    cartao.style.left = `${esquerda}px`;
    cartao.style.top = `${y - cartao.offsetHeight - 10 < 0 ? y + ponto.height + 14 : y - cartao.offsetHeight - 10}px`;
  }
  const esconderCartao = () => { cartao.hidden = true; };

  // ---------- Modos: sedes, viagem de uma seleção, dia a dia ----------
  let modo = 'sedes';
  let sedeAtiva = SEDES_2026.findIndex(s => s.final);
  const rotas = document.getElementById('mapa-rotas');
  const controles = document.getElementById('sedes-controles');
  const detalhe = document.getElementById('sede-detalhe');
  let tocando = null;

  const destacar = conjunto => document.querySelectorAll('.mapa-sede').forEach(g => {
    const i = Number(g.dataset.i);
    g.classList.toggle('apagada', !!conjunto && !conjunto.has(i));
    g.classList.toggle('ativa', modo === 'sedes' ? i === sedeAtiva : !!conjunto && conjunto.has(i));
  });

  const linhaPartida = (p, extra = '') => {
    if (p.jogo) return `<div class="sede-jogo"><span class="sede-data">${DB.Util.formatarData(p.data).slice(0, 5)}</span>${UI.linhaJogoCompacta(p.jogo)}<span class="sede-fase">${esc(p.rotulo)}${extra}</span></div>`;
    const m = DB.Times.get(p.mandanteId), v = DB.Times.get(p.visitanteId);
    return `<div class="sede-jogo"><span class="sede-data">${DB.Util.formatarData(p.data).slice(0, 5)}</span>
      <span class="mini-match"><span class="team-inline home">${esc(m ? m.nome : '?')} ${UI.bandeira(m, 'sm')}</span><span class="placar vs">${DB.Util.formatarHora(p.data)}</span><span class="team-inline">${UI.bandeira(v, 'sm')} ${esc(v ? v.nome : '?')}</span></span>
      <span class="sede-fase">${esc(p.rotulo)}${extra}</span></div>`;
  };

  // Sedes: ficha do estádio e os jogos dele.
  function selecionar(i) {
    sedeAtiva = i;
    const s = SEDES_2026[i];
    destacar(null);
    document.querySelectorAll('#sedes-lista .chip').forEach(b => { const ativo = Number(b.dataset.i) === i; b.classList.toggle('active', ativo); b.setAttribute('aria-pressed', ativo); });
    const lista = jogosDa(i);
    detalhe.innerHTML = `
      <div class="panel-header"><span class="panel-title">${esc(s.estadio)}</span>${s.final ? `<span class="sede-tag">${UI.icone('trofeu')} Final</span>` : ''}</div>
      <ul class="info-list">
        <li><span>Cidade</span><span>${esc(s.cidade)}</span></li>
        <li><span>País</span><span>${UI.bandeiraPais(s.pais)} ${PAISES[s.pais]}</span></li>
        <li><span>Capacidade (aprox.)</span><span>${s.capacidade.toLocaleString('pt-BR')}</span></li>
        <li><span>Jogos ${usaCadastro ? 'cadastrados' : 'da fase de grupos'}</span><span><b>${lista.length}</b></span></li>
      </ul>
      <div class="sede-jogos">${lista.map(p => linhaPartida(p)).join('') || UI.vazio('Nenhum jogo marcado aqui', '')}</div>
      ${usaCadastro ? '' : '<p class="grafico-nota" style="padding:10px 18px;">Pelo calendário oficial (horários de Brasília). Os jogos do mata-mata aparecem quando forem definidos.</p>'}`;
  }

  // Viagem: o caminho de uma seleção entre as sedes, com a distância de cada trecho.
  function desenharViagem(timeId) {
    const time = DB.Times.get(timeId);
    const paradas = partidas.filter(p => p.mandanteId === timeId || p.visitanteId === timeId);
    const pontos = paradas.map(p => SEDES_2026[p.sede]);
    let total = 0;
    const trechos = pontos.slice(1).map((b, i) => {
      const a = pontos[i];
      const d = km(a, b);
      total += d;
      if (a === b) return '';
      // Arco: curva puxada para o lado, proporcional ao tamanho do trecho.
      const x1 = px(a.lon), y1 = py(a.lat), x2 = px(b.lon), y2 = py(b.lat);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
      const cx = mx - dy * 0.22, cy = my + dx * 0.22;
      return `<path class="mapa-rota" style="animation-delay:${i * 0.45}s" d="M${x1.toFixed(1)},${y1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" pathLength="1" marker-end="url(#mapa-seta)"/>`;
    }).join('');
    // Paradas numeradas (sedes repetidas mostram os números juntos).
    const porSede = {};
    paradas.forEach((p, n) => { (porSede[p.sede] = porSede[p.sede] || []).push(n + 1); });
    // Cidades vizinhas (Nova York e Filadélfia): a etiqueta de cima sobe até não encostar na outra.
    const colocadas = [];
    const numeros = Object.entries(porSede).map(([i, ns]) => {
      const s = SEDES_2026[i];
      const texto = ns.join('·');
      const w = 10 + texto.length * 7, x = px(s.lon);
      let y = py(s.lat) - 30;
      while (colocadas.some(c => Math.abs(c.x - x) < (c.w + w) / 2 + 2 && Math.abs(c.y - y) < 19)) y -= 20;
      colocadas.push({ x, y, w });
      const linha = y < py(s.lat) - 30 ? `<line x1="${x}" y1="${y + 17}" x2="${x}" y2="${py(s.lat) - 8}"/>` : '';
      return `<g class="mapa-parada">${linha}<rect x="${x - w / 2}" y="${y}" width="${w}" height="17" rx="8.5"/><text x="${x}" y="${y + 12}" text-anchor="middle">${texto}</text></g>`;
    }).join('');
    rotas.innerHTML = trechos + numeros;
    destacar(new Set(paradas.map(p => p.sede)));

    detalhe.innerHTML = `
      <div class="panel-header"><span class="panel-title">${UI.bandeira(time, 'sm')} Viagem de ${esc(time ? time.nome : '')}</span></div>
      <div class="viagem-resumo">
        <div><b>${total.toLocaleString('pt-BR')}</b><span>km entre as sedes</span></div>
        <div><b>${new Set(paradas.map(p => p.sede)).size}</b><span>cidade${new Set(paradas.map(p => p.sede)).size === 1 ? '' : 's'}</span></div>
        <div><b>${paradas.length}</b><span>jogo${paradas.length === 1 ? '' : 's'}</span></div>
      </div>
      <ol class="viagem-lista">${paradas.map((p, n) => {
        const s = SEDES_2026[p.sede];
        const adv = DB.Times.get(p.mandanteId === timeId ? p.visitanteId : p.mandanteId);
        const trecho = n ? km(SEDES_2026[paradas[n - 1].sede], s) : 0;
        return `<li><span class="viagem-n">${n + 1}</span><span class="viagem-txt"><b>${esc(nomeCurto(s))}</b>
          <small>${DB.Util.formatarData(p.data).slice(0, 5)} · contra ${UI.bandeira(adv, 'sm')} ${esc(adv ? adv.nome : 'a definir')} · ${esc(p.rotulo)}</small></span>
          <span class="viagem-km">${n ? (trecho ? `+${trecho.toLocaleString('pt-BR')} km` : 'mesma cidade') : 'estreia'}</span></li>`;
      }).join('')}</ol>
      ${paradas.length ? '<p class="grafico-nota" style="padding:4px 18px 14px;">Distâncias em linha reta entre os estádios.</p>' : UI.vazio('Sem jogos desta seleção', '')}`;
  }

  // Dia a dia: as sedes com jogo no dia escolhido.
  function desenharDia(n) {
    const dia = dias[n];
    const doDia = partidas.filter(p => diaDe(p) === dia);
    rotas.innerHTML = '';
    destacar(new Set(doDia.map(p => p.sede)));
    const rotulo = document.getElementById('dia-rotulo');
    if (rotulo) rotulo.textContent = `${DB.Util.formatarDiaLongo(`${dia}T12:00`)} · ${doDia.length} jogo${doDia.length === 1 ? '' : 's'}`;
    detalhe.innerHTML = `
      <div class="panel-header"><span class="panel-title">${esc(DB.Util.formatarDiaLongo(`${dia}T12:00`))}</span><span class="campanha-resumo">Dia ${n + 1} de ${dias.length}</span></div>
      <div class="sede-jogos">${doDia.map(p => linhaPartida(p, ` · ${esc(nomeCurto(SEDES_2026[p.sede]))}`)).join('')}</div>`;
  }

  function parar() {
    clearInterval(tocando);
    tocando = null;
    const b = document.getElementById('dia-play');
    if (b) { b.innerHTML = UI.icone('play'); b.setAttribute('aria-label', 'Passar os dias'); }
  }

  function trocarModo(novo) {
    modo = novo;
    parar();
    esconderCartao();
    rotas.innerHTML = '';
    document.querySelectorAll('#sedes-modos .chip').forEach(b => { const ativo = b.dataset.modo === novo; b.classList.toggle('active', ativo); b.setAttribute('aria-pressed', ativo); });
    document.getElementById('sedes-lista').hidden = novo !== 'sedes';
    mapa.classList.toggle('modo-viagem', novo === 'viagem');
    if (novo === 'sedes') { controles.innerHTML = ''; selecionar(sedeAtiva); return; }
    if (novo === 'viagem') {
      const times = DB.Times.all().filter(t => partidas.some(p => p.mandanteId === t.id || p.visitanteId === t.id)).sort((a, b) => a.nome.localeCompare(b.nome));
      const favorito = UI.Favoritos.lista().find(id => times.some(t => t.id === id));
      const inicial = favorito || (times.find(t => t.nome === 'Brasil') || times[0] || {}).id;
      controles.innerHTML = `<label class="sedes-controle">Seleção <select id="viagem-time">${times.map(t => `<option value="${t.id}" ${t.id === inicial ? 'selected' : ''}>${esc(t.nome)}</option>`).join('')}</select></label>`;
      document.getElementById('viagem-time').addEventListener('change', e => desenharViagem(e.target.value));
      if (inicial) desenharViagem(inicial);
      return;
    }
    // Dia a dia: começa hoje (se a Copa estiver rolando) ou no primeiro dia.
    const hoje = new Date().toISOString().slice(0, 10);
    const inicialDia = Math.max(0, dias.findIndex(d => d >= hoje) === -1 ? 0 : dias.findIndex(d => d >= hoje));
    controles.innerHTML = `<div class="sedes-controle dia-controle">
        <button type="button" class="btn btn-ghost btn-sm" id="dia-play" aria-label="Passar os dias">${UI.icone('play')}</button>
        <input type="range" id="dia-faixa" min="0" max="${Math.max(0, dias.length - 1)}" value="${inicialDia}" aria-label="Dia do torneio">
        <span id="dia-rotulo" class="dia-rotulo"></span>
      </div>`;
    const faixa = document.getElementById('dia-faixa');
    faixa.addEventListener('input', () => { parar(); desenharDia(Number(faixa.value)); });
    document.getElementById('dia-play').addEventListener('click', e => {
      if (tocando) { parar(); return; }
      if (Number(faixa.value) >= dias.length - 1) faixa.value = 0;
      e.currentTarget.innerHTML = UI.icone('pausa');
      e.currentTarget.setAttribute('aria-label', 'Pausar');
      desenharDia(Number(faixa.value));
      tocando = setInterval(() => {
        if (Number(faixa.value) >= dias.length - 1) { parar(); return; }
        faixa.value = Number(faixa.value) + 1;
        desenharDia(Number(faixa.value));
      }, 1100);
    });
    if (dias.length) desenharDia(inicialDia);
  }

  // ---------- Interação ----------
  document.getElementById('sedes-lista').innerHTML = SEDES_2026.map((s, i) =>
    `<button type="button" class="chip" data-i="${i}" aria-pressed="false">${esc(s.cidade)}</button>`).join('');
  document.querySelectorAll('.mapa-sede').forEach(g => {
    const i = Number(g.dataset.i);
    const abrir = () => { if (modo !== 'sedes') trocarModo('sedes'); selecionar(i); };
    g.addEventListener('click', abrir);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
    g.addEventListener('pointerenter', () => mostrarCartao(i, g));
    g.addEventListener('focus', () => mostrarCartao(i, g));
    g.addEventListener('pointerleave', esconderCartao);
    g.addEventListener('blur', esconderCartao);
  });
  document.querySelectorAll('#sedes-lista .chip').forEach(b => b.addEventListener('click', () => selecionar(Number(b.dataset.i))));
  document.querySelectorAll('#sedes-modos .chip').forEach(b => b.addEventListener('click', () => trocarModo(b.dataset.modo)));
  trocarModo('sedes');
  UI.montarFooter();
});
