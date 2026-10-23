// Mapa das sedes da Copa 2026: SVG esquemático (contorno simplificado em longitude/latitude,
// projeção equirretangular), um ponto por estádio, do tamanho do número de jogos.
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

  // Jogos cadastrados de cada sede (pelo nome do estádio no local); sem cadastro, o calendário oficial.
  const jogos = DB.Jogos.all();
  const porNome = Object.fromEntries(DB.Times.all().map(t => [t.nome, t]));
  const jogosDa = sede => {
    const cadastrados = jogos.filter(j => (j.local || '').startsWith(sede.estadio)).sort((a, b) => new Date(a.data) - new Date(b.data));
    if (cadastrados.length) return { lista: cadastrados, cadastrados: true };
    const calendario = (typeof CALENDARIO_GRUPOS_2026 !== 'undefined' ? CALENDARIO_GRUPOS_2026 : []).filter(c => c.estadio === sede.estadio);
    return { lista: calendario, cadastrados: false };
  };

  // Projeção: equirretangular com a longitude encolhida por cos(35°).
  const LON0 = -128, LAT0 = 52, ESCALA = 14, COS = Math.cos((35 * Math.PI) / 180);
  const px = lon => (lon - LON0) * ESCALA * COS, py = lat => (LAT0 - lat) * ESCALA;
  const L = Math.round(px(-60)), A = Math.round(py(13));
  const caminho = (pts, fechar = true) => pts.map(([lon, lat], i) => `${i ? 'L' : 'M'}${px(lon).toFixed(1)},${py(lat).toFixed(1)}`).join(' ') + (fechar ? ' Z' : '');
  const qtd = SEDES_2026.map(s => jogosDa(s).lista.length);
  const maxQtd = Math.max(1, ...qtd);

  document.getElementById('sedes-mapa').innerHTML = `
    <svg viewBox="0 0 ${L} ${A}" role="img" aria-label="Mapa esquemático das 16 sedes nos EUA, México e Canadá">
      <path class="mapa-terra" d="${caminho(MAPA_2026.terra)}"/>
      ${MAPA_2026.lagos.map(l => `<path class="mapa-lago" d="${caminho(l)}"/>`).join('')}
      ${MAPA_2026.fronteiras.map(f => `<path class="mapa-fronteira" d="${caminho(f, false)}"/>`).join('')}
      ${SEDES_2026.map((s, i) => {
        const x = px(s.lon), y = py(s.lat), r = 6 + (qtd[i] / maxQtd) * 6;
        const [dx, dy, ancora] = s.rotulo;
        return `<g class="mapa-sede" data-i="${i}" tabindex="0" role="button" aria-label="${esc(`${s.cidade}: ${s.estadio}, ${qtd[i]} jogos`)}">
          <circle cx="${x}" cy="${y}" r="${r + 8}" fill="transparent"/>
          <circle class="mapa-ponto" cx="${x}" cy="${y}" r="${r}" style="fill:var(--sede-${s.pais})"/>
          ${s.final ? `<text class="mapa-estrela" x="${x}" y="${y + 4}" text-anchor="middle">★</text>` : ''}
          <text class="mapa-rotulo" x="${x + dx}" y="${y + dy}" text-anchor="${ancora}">${esc(s.cidade.replace('Nova York/Nova Jersey', 'Nova York/NJ'))}</text>
          <title>${esc(`${s.estadio} · ${s.cidade} · ${qtd[i]} jogos`)}</title>
        </g>`;
      }).join('')}
    </svg>`;

  document.getElementById('sedes-lista').innerHTML = SEDES_2026.map((s, i) =>
    `<button type="button" class="chip" data-i="${i}" aria-pressed="false">${esc(s.cidade)}</button>`).join('');

  function selecionar(i) {
    const s = SEDES_2026[i];
    document.querySelectorAll('.mapa-sede').forEach(g => g.classList.toggle('ativa', Number(g.dataset.i) === i));
    document.querySelectorAll('#sedes-lista .chip').forEach(b => { const ativo = Number(b.dataset.i) === i; b.classList.toggle('active', ativo); b.setAttribute('aria-pressed', ativo); });
    const { lista, cadastrados } = jogosDa(s);
    const linhas = cadastrados
      ? lista.map(j => `<div class="sede-jogo"><span class="sede-data">${DB.Util.formatarData(j.data).slice(0, 5)}</span>${UI.linhaJogoCompacta(j)}<span class="sede-fase">${esc(UI.rotuloJogo(j))}</span></div>`).join('')
      : lista.map(c => {
        const m = porNome[c.mandante], v = porNome[c.visitante];
        return `<div class="sede-jogo"><span class="sede-data">${DB.Util.formatarData(c.data).slice(0, 5)}</span>
          <span class="mini-match"><span class="team-inline home">${esc(c.mandante)} ${UI.bandeira(m, 'sm')}</span><span class="placar vs">${DB.Util.formatarHora(c.data)}</span><span class="team-inline">${UI.bandeira(v, 'sm')} ${esc(c.visitante)}</span></span>
          <span class="sede-fase">Grupo ${c.grupo} · ${c.rodada}ª rodada</span></div>`;
      }).join('');
    document.getElementById('sede-detalhe').innerHTML = `
      <div class="panel-header"><span class="panel-title">${esc(s.estadio)}</span>${s.final ? '<span class="sede-tag">★ Final</span>' : ''}</div>
      <ul class="info-list">
        <li><span>Cidade</span><span>${esc(s.cidade)}</span></li>
        <li><span>País</span><span>${UI.bandeiraPais(s.pais)} ${PAISES[s.pais]}</span></li>
        <li><span>Capacidade (aprox.)</span><span>${s.capacidade.toLocaleString('pt-BR')}</span></li>
        <li><span>Jogos ${cadastrados ? 'cadastrados' : 'da fase de grupos'}</span><span><b>${lista.length}</b></span></li>
      </ul>
      <div class="sede-jogos">${linhas || UI.vazio('Nenhum jogo marcado aqui', '')}</div>
      ${cadastrados ? '' : '<p class="grafico-nota" style="padding-top:10px;">Pelo calendário oficial (horários de Brasília). Os jogos do mata-mata aparecem quando forem definidos.</p>'}`;
  }

  document.querySelectorAll('.mapa-sede').forEach(g => {
    g.addEventListener('click', () => selecionar(Number(g.dataset.i)));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selecionar(Number(g.dataset.i)); } });
  });
  document.querySelectorAll('#sedes-lista .chip').forEach(b => b.addEventListener('click', () => selecionar(Number(b.dataset.i))));
  selecionar(SEDES_2026.findIndex(s => s.final));
  UI.montarFooter();
});
