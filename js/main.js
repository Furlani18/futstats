document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();
  DB.MataMata.sincronizar();

  const comp = DB.Contexto.get();
  const ehCopa = DB.Contexto.ehCopa();
  const esc = DB.Util.escapar;
  const nTimes = DB.Times.all().length;
  const descricao = DB.Torneio.descricaoFase();
  document.getElementById('hero-fase').textContent = /encerrad|aguardando/i.test(descricao) ? descricao : `Em disputa: ${descricao}`;
  if (!ehCopa) {
    document.title = `${comp.curto} ${comp.temporada} — FUTSTATS`;
    document.getElementById('hero-titulo').innerHTML = `${esc(comp.curto)}<br><span class="gold">${esc(comp.temporada)}</span>`;
    document.getElementById('hero-sub').innerHTML = `<strong>${esc(comp.sede)}</strong> · ${esc(comp.periodo)}`;
  }
  montarTopoCampeonato(comp, nTimes);

  // ---------- KPIs ----------
  const r = DB.Estatisticas.resumo();
  const artilheiro = DB.Estatisticas.ranking('gols', 1)[0];
  const garcom = DB.Estatisticas.ranking('assistencias', 1)[0];
  const goleada = r.maiorGoleada;
  const nomeCurto = time => (time ? time.codigo : '—');
  const kpi = (label, valor, nota) => `
    <div class="kpi"><div class="kpi-label">${label}</div><div class="kpi-value">${valor}</div><div class="kpi-note">${nota || '&nbsp;'}</div></div>`;
  const conta = (valor, decimais = 0) => `<span data-contar="${valor}" data-decimais="${decimais}">${Number(valor).toFixed(decimais).replace('.', ',')}</span>`;
  document.getElementById('kpis').innerHTML = [
    kpi('Jogos disputados', `${conta(r.jogos)}<span style="font-size:18px;color:var(--text-faint)">/${totalPrevisto()}</span>`, `${r.totalJogos} cadastrados`),
    kpi('Gols', conta(r.gols), `${r.penaltis} de pênalti · ${r.golsContra} contra`),
    kpi('Média por jogo', conta(r.media, 2)),
    kpi('Artilheiro', artilheiro ? conta(artilheiro.gols) : '—', artilheiro ? DB.Util.escapar(artilheiro.jogador.nome) : 'sem gols cadastrados'),
    kpi('Líder em assistências', garcom ? conta(garcom.assistencias) : '—', garcom ? DB.Util.escapar(garcom.jogador.nome) : 'sem assistências'),
    kpi('Maior goleada', goleada ? `${goleada.golsMandante}–${goleada.golsVisitante}` : '—',
      goleada ? `${nomeCurto(DB.Times.get(goleada.mandanteId))} x ${nomeCurto(DB.Times.get(goleada.visitanteId))}` : ''),
  ].join('');
  UI.animarNumeros(document.getElementById('kpis'));

  // ---------- Jogo em destaque: ao vivo › próximo › último resultado ----------
  montarDestaque();

  // ---------- Seus times (favoritos deste campeonato) ----------
  montarFavoritos();

  // ---------- Partidas: rodada atual (com setas) quando o campeonato tem rodadas ----------
  const rodadasComJogos = DB.Estatisticas.rodadas
    .map(r => ({ ...r, jogos: DB.Jogos.all().filter(r.filtro).sort((a, b) => new Date(a.data) - new Date(b.data)) }))
    .filter(r => r.jogos.length);
  if (rodadasComJogos.length) {
    // Atual = primeira com jogo por terminar; se todas acabaram, a última.
    let indice = rodadasComJogos.findIndex(r => r.jogos.some(j => j.status !== 'encerrado'));
    if (indice < 0) indice = rodadasComJogos.length - 1;
    const atual = indice;
    const titulo = document.getElementById('titulo-jogos');
    titulo.closest('.panel-header').classList.add('rodada-header');
    titulo.insertAdjacentHTML('beforebegin', '<button type="button" class="rodada-seta" id="rodada-ant" aria-label="Rodada anterior">‹</button>');
    titulo.insertAdjacentHTML('afterend', '<button type="button" class="rodada-seta" id="rodada-prox" aria-label="Próxima rodada">›</button>');
    const desenhar = () => {
      const r = rodadasComJogos[indice];
      const encerrados = r.jogos.filter(j => j.status === 'encerrado').length;
      const aoVivoR = r.jogos.some(j => j.status === 'ao_vivo');
      titulo.innerHTML = `<span class="rodada-nome">${esc(r.label)}${indice === atual ? ' <span class="rodada-tag">atual</span>' : ''}</span>
        <small class="rodada-info">${aoVivoR ? '<span class="live-dot"></span> ao vivo · ' : ''}${encerrados}/${r.jogos.length} encerrados</small>`;
      document.getElementById('lista-jogos').innerHTML = UI.listaPorDia(r.jogos);
      document.getElementById('rodada-ant').disabled = indice === 0;
      document.getElementById('rodada-prox').disabled = indice === rodadasComJogos.length - 1;
    };
    document.getElementById('rodada-ant').addEventListener('click', () => { if (indice > 0) { indice--; desenhar(); } });
    document.getElementById('rodada-prox').addEventListener('click', () => { if (indice < rodadasComJogos.length - 1) { indice++; desenhar(); } });
    desenhar();
  }

  // ---------- Partidas: ao vivo + próximas; senão, últimos resultados ----------
  const todos = DB.Jogos.all().sort((a, b) => new Date(a.data) - new Date(b.data));
  const aoVivo = todos.filter(j => j.status === 'ao_vivo');
  const proximos = todos.filter(j => j.status === 'agendado').slice(0, 8);
  const ultimos = todos.filter(j => j.status === 'encerrado').slice(-6).reverse();
  const lista = document.getElementById('lista-jogos');
  if (rodadasComJogos.length) {
    // Já montado acima, rodada a rodada.
  } else if (aoVivo.length || proximos.length) {
    document.getElementById('titulo-jogos').textContent = aoVivo.length ? 'Ao vivo e próximos jogos' : 'Próximos jogos';
    lista.innerHTML = UI.listaPorDia([...aoVivo, ...proximos]);
  } else if (ultimos.length) {
    document.getElementById('titulo-jogos').textContent = 'Últimos resultados';
    lista.innerHTML = ultimos.map(j => UI.linhaJogo(j, { comData: true })).join('');
  } else {
    lista.innerHTML = UI.vazio('Nenhuma partida cadastrada ainda', 'Os jogos aparecem aqui assim que forem cadastrados no painel.');
  }

  // ---------- Tabela / grupos / confrontos, conforme o formato ----------
  const tipo = comp.tipo;
  const miniGrupos = document.getElementById('mini-grupos');
  if (tipo === 'liga' || tipo === 'champions') {
    document.getElementById('titulo-tabela').textContent = tipo === 'champions' ? 'Fase de liga' : 'Classificação';
    miniGrupos.classList.remove('grid-2');
    miniGrupos.innerHTML = UI.tabelaLiga({ compacta: true, forma: true });
    document.getElementById('legenda-grupos').innerHTML = UI.legendaZonas(comp.zonas);
  } else if (tipo === 'mata_mata') {
    document.getElementById('titulo-tabela').textContent = 'Confrontos';
    document.querySelector('#titulo-tabela + a').href = 'chaveamento.html';
    document.querySelector('#titulo-tabela + a').textContent = 'Chaveamento →';
    miniGrupos.classList.remove('grid-2');
    const fases = (comp.fases || []).map(f => [f, DB.MataMata.confrontos(f)]).filter(([, cs]) => cs.length);
    const [fase, confrontos] = fases.find(([, cs]) => cs.some(c => !c.encerrado)) || fases[fases.length - 1] || [];
    miniGrupos.innerHTML = confrontos
      ? `<div class="bracket-round-title" style="padding:12px 18px 0;text-align:left;">${DB.Util.faseLabel(fase)}</div><div class="confrontos-grid">${confrontos.map(UI.cartaoConfronto).join('')}</div>`
      : UI.vazio('Nenhum confronto cadastrado', 'Os jogos aparecem aqui assim que forem cadastrados no painel.');
  } else miniGrupos.innerHTML = DB.Grupos.letras.map(letra => `
    <div style="border-bottom:1px solid var(--border);border-right:1px solid var(--border-soft);">
      <div style="padding:10px 18px 0;" class="group-title"><span class="group-letter" style="width:24px;height:24px;font-size:15px;">${letra}</span>
        <a href="grupos.html#grupo-${letra}" style="font-weight:800;font-size:13px;color:var(--text-dim);">GRUPO ${letra}</a></div>
      ${UI.tabelaGrupo(letra, { compacta: true })}
    </div>`).join('');
  if (tipo === 'copa_mundo' || tipo === 'grupos_mata') document.getElementById('legenda-grupos').innerHTML = UI.legendaZonas();

  // ---------- Rankings ----------
  document.getElementById('top-artilheiros').innerHTML = UI.listaLideres('gols', 5, 'gols', 'Nenhum gol cadastrado ainda.');
  document.getElementById('top-assistencias').innerHTML = UI.listaLideres('assistencias', 5, 'assist.', 'Nenhuma assistência cadastrada ainda.');

  const ataques = DB.Estatisticas.porTime().filter(t => t.J > 0)
    .sort((a, b) => b.GP - a.GP || b.SG - a.SG).slice(0, 5);
  document.getElementById('top-ataques').innerHTML = ataques.length ? `
    <ol class="leader-list">${ataques.map((t, i) => `
      <li><a class="leader" href="time.html?id=${t.time.id}">
        <span class="rank">${i + 1}</span>${UI.bandeira(t.time)}
        <span class="info"><span class="nome">${esc(t.time.nome)}</span><span class="sub">${t.J} jogos · ${t.GC} sofridos</span></span>
        <span class="valor">${t.GP}<small>gols</small></span>
      </a></li>`).join('')}</ol>` : UI.vazio('Sem jogos disputados', '');

  // ---------- Seleções / clubes ----------
  if (!ehCopa) {
    document.getElementById('eyebrow-times').textContent = `${nTimes} clubes${DB.Grupos.letras.length ? ` · ${DB.Grupos.letras.length} grupos` : ''}`;
    document.getElementById('titulo-times').textContent = 'Clubes';
    document.getElementById('link-times').textContent = 'Ver todos →';
  }
  // --tc: cor do time para a sombra ao passar o mouse; o nome de transição faz o escudo
  // "voar" desta grade até o topo da página do time.
  document.getElementById('grid-times').innerHTML = DB.Times.all().map(t => `
    <a class="team-card" href="time.html?id=${t.id}" style="--tc:${UI.corDoTime(t)}">
      <span class="vt-escudo" style="view-transition-name:escudo-${t.id}">${UI.bandeira(t, 'lg')}</span>
      <span><span class="nome">${esc(t.nome)}</span><br><span class="meta">${t.tipo === 'clube'
        ? esc([DB.Grupos.deTime(t.id) && `Grupo ${DB.Grupos.deTime(t.id)}`, t.tecnico].filter(Boolean).join(' · '))
        : `Grupo ${t.grupo} · ${t.confederacao}`}</span></span>
    </a>`).join('');

  UI.montarFooter();
});

function montarDestaque() {
  const mount = document.getElementById('destaque');
  const jogos = DB.Jogos.all().filter(j => j.mandanteId && j.visitanteId).sort((a, b) => new Date(a.data) - new Date(b.data));
  const agora = Date.now();
  const aoVivo = jogos.find(j => j.status === 'ao_vivo');
  const proximo = jogos.find(j => j.status === 'agendado' && new Date(j.data).getTime() > agora)
    || jogos.find(j => j.status === 'agendado');
  const ultimo = [...jogos].reverse().find(j => j.status === 'encerrado');
  const jogo = aoVivo || proximo || ultimo;
  if (!jogo) {
    // Sem jogos: o card mostra o logo do campeonato em destaque.
    const comp = DB.Contexto.get();
    // Sem jogos: um mosaico com os escudos/bandeiras de todos os participantes.
    const times = DB.Times.all();
    mount.innerHTML = `
      <div class="featured featured-vazio">
        <div class="featured-label"><span>${times.length} ${DB.Contexto.ehCopa() ? 'seleções' : 'clubes'} na disputa</span><span>Temporada ${DB.Util.escapar(comp.temporada)}</span></div>
        <div class="mosaico-escudos">${times.map(t => `<a href="time.html?id=${t.id}" title="${DB.Util.escapar(t.nome)}">${UI.bandeira(t, 'lg')}</a>`).join('')}</div>
        <div class="featured-foot">Os jogos aparecem aqui assim que forem cadastrados no painel.</div>
      </div>`;
    return;
  }

  const m = DB.Times.get(jogo.mandanteId), v = DB.Times.get(jogo.visitanteId);
  const tipo = jogo === aoVivo ? 'vivo' : jogo === proximo ? 'proximo' : 'ultimo';
  const rotulo = { vivo: '<span class="live-dot"></span> Ao vivo', proximo: 'Próximo jogo', ultimo: 'Último resultado' }[tipo];
  const lado = t => `<span class="featured-team">${UI.bandeira(t, 'xl')}<span class="nome">${DB.Util.escapar(t.nome)}</span></span>`;
  // Capa de revista: as bandeiras/escudos dos dois lados, gigantes e desfocados ao fundo.
  const fundo = t => {
    const img = t.tipo === 'clube' ? t.escudo : DB.Util.bandeiraUrl(t.iso, 320);
    const c = DB.Util.coresTime(t);
    return `<span style="background:linear-gradient(135deg, ${c.primaria}, ${c.secundaria})">${img ? `<img src="${DB.Util.escapar(img)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</span>`;
  };
  const futuro = new Date(jogo.data).getTime() > agora;
  const centro = tipo === 'proximo'
    ? (futuro ? '<div class="countdown" id="contagem"></div>' : `<div class="featured-score" style="font-size:30px;">${DB.Util.formatarHora(jogo.data)}<small>${DB.Util.formatarData(jogo.data)}</small></div>`)
    : `<div class="featured-score${tipo === 'vivo' ? ' live' : ''}">${jogo.golsMandante ?? 0}–${jogo.golsVisitante ?? 0}${
      jogo.penaltisMandante != null ? `<small>pên. ${jogo.penaltisMandante}–${jogo.penaltisVisitante}</small>` : ''}</div>`;
  const gols = UI.temPlacar(jogo)
    ? [UI.autoresResumo(jogo, m.id, 2), UI.autoresResumo(jogo, v.id, 2)].filter(Boolean).join(' · ')
    : '';

  mount.innerHTML = `
    <a class="featured featured-capa" href="jogo.html?id=${jogo.id}">
      <span class="featured-fundo" aria-hidden="true">${fundo(m)}${fundo(v)}</span>
      <div class="featured-label${tipo === 'vivo' ? ' live' : ''}"><span>${rotulo}</span><span>${UI.rotuloJogo(jogo)}</span></div>
      <div class="featured-teams">${lado(m)}${centro}${lado(v)}</div>
      <div class="featured-foot">${gols || `${DB.Util.formatarDiaLongo(jogo.data)} · ${DB.Util.formatarHora(jogo.data)}${jogo.local ? ` · ${DB.Util.escapar(jogo.local.split(',').pop().trim())}` : ''}`}</div>
    </a>`;

  const contagem = document.getElementById('contagem');
  if (contagem) {
    const alvo = new Date(jogo.data).getTime();
    const tick = () => {
      const resta = Math.max(0, alvo - Date.now());
      const d = Math.floor(resta / 864e5), h = Math.floor(resta / 36e5) % 24, mi = Math.floor(resta / 6e4) % 60, s = Math.floor(resta / 1e3) % 60;
      const bloco = (n, l) => `<div><b>${String(n).padStart(2, '0')}</b><span>${l}</span></div>`;
      contagem.innerHTML = bloco(d, 'dias') + bloco(h, 'horas') + bloco(mi, 'min') + bloco(s, 'seg');
      if (resta > 0) setTimeout(tick, 1000);
    };
    tick();
  }
}

// Times seguidos (estrela na página do time) que estão neste campeonato: último resultado e próximo jogo.
function montarFavoritos() {
  const esc = DB.Util.escapar;
  const mount = document.getElementById('favoritos');
  const ids = UI.Favoritos.lista();
  const times = DB.Times.all().filter(t => ids.includes(t.id));
  if (!times.length) { mount.hidden = true; return; }
  const comp = DB.Contexto.get();
  const tabela = comp.tipo === 'liga' || comp.tipo === 'champions' ? DB.Classificacao.liga() : null;
  const resumoJogo = (j, timeId) => {
    if (!j) return '<span class="fav-vazio">—</span>';
    const casa = j.mandanteId === timeId;
    const adv = DB.Times.get(casa ? j.visitanteId : j.mandanteId);
    let marcador = '';
    if (UI.temPlacar(j)) {
      const pro = casa ? j.golsMandante : j.golsVisitante, contra = casa ? j.golsVisitante : j.golsMandante;
      const r = j.status === 'ao_vivo' ? 'vivo' : pro > contra ? 'V' : pro < contra ? 'D' : 'E';
      marcador = `<span class="fav-res fav-${r}">${pro}–${contra}</span>`;
    } else {
      marcador = `<span class="fav-data">${DB.Util.formatarData(j.data).slice(0, 5)} · ${DB.Util.formatarHora(j.data)}</span>`;
    }
    return `<a class="fav-jogo" href="jogo.html?id=${j.id}">${marcador}<span class="fav-adv">${casa ? 'x' : '@'} ${UI.bandeira(adv, 'sm')} ${esc(adv ? adv.nome : 'A definir')}</span></a>`;
  };
  document.getElementById('lista-favoritos').innerHTML = times.map(t => {
    const jogos = DB.Jogos.doTime(t.id);
    const ultimo = [...jogos].reverse().find(j => j.status === 'encerrado' || j.status === 'ao_vivo');
    const proximo = jogos.find(j => j.status === 'agendado');
    const linha = tabela && tabela.find(l => l.timeId === t.id);
    return `<div class="fav-card">
      <a class="fav-time" href="time.html?id=${t.id}">${UI.bandeira(t, 'lg')}<span><b>${esc(t.nome)}</b>${linha && linha.J ? `<small>${linha.posicao}º · ${linha.P} pts</small>` : ''}</span></a>
      <div class="fav-jogos">
        <div><span class="fav-rotulo">${ultimo && ultimo.status === 'ao_vivo' ? 'Ao vivo' : 'Último'}</span>${resumoJogo(ultimo, t.id)}</div>
        <div><span class="fav-rotulo">Próximo</span>${resumoJogo(proximo, t.id)}</div>
      </div>
    </div>`;
  }).join('');
  mount.hidden = false;
}

// Total de jogos previstos no campeonato (para o "x/104").
function totalPrevisto() {
  const comp = DB.Contexto.get();
  if (comp.totalJogos) return comp.totalJogos;
  const n = DB.Times.all().length;
  return comp.tipo === 'liga' ? n * (n - 1) : DB.Jogos.all().length;
}

// Logo, marca-d'água e chips de informação no topo da página inicial.
function montarTopoCampeonato(comp, nTimes) {
  const esc = DB.Util.escapar;
  if (comp.logo) {
    const placa = document.getElementById('hero-logo');
    placa.innerHTML = `<img src="${comp.logo}" alt="${esc(comp.nome)}">`;
    placa.hidden = false;
    const marca = document.getElementById('hero-marca');
    marca.src = comp.logo;
    marca.hidden = false;
    document.querySelector('.hero').classList.add('com-marca');
  }
  const chip = (icone, texto) => `<span class="hero-chip">${icone}<span>${texto}</span></span>`;
  const n = DB.Times.all().length;
  const rodadas = comp.tipo === 'liga' ? (n - 1) * 2 : comp.tipo === 'champions' ? comp.rodadasLiga : null;
  const chips = [
    comp.iso ? chip(UI.bandeiraPais(comp.iso), esc(comp.sede)) : chip(UI.icone('globo'), esc(comp.regiao)),
    chip(UI.icone('camisa'), `${nTimes} ${DB.Contexto.ehCopa() ? 'seleções' : 'clubes'}`),
    rodadas ? chip(UI.icone('calendario'), `${rodadas} rodadas`) : '',
    DB.Grupos.letras.length ? chip(UI.icone('grade'), `${DB.Grupos.letras.length} grupos`) : '',
    comp.totalJogos ? chip(UI.icone('bola'), `${comp.totalJogos} jogos`) : '',
  ];
  // Líder atual nas ligas e na fase de liga da Champions.
  if (comp.tipo === 'liga' || comp.tipo === 'champions') {
    const lider = DB.Classificacao.liga()[0];
    if (lider && lider.J) chips.push(chip(UI.bandeira(DB.Times.get(lider.timeId), 'sm'), `Líder: <b>${esc(lider.nome)}</b> · ${lider.P} pts`));
  }
  document.getElementById('hero-chips').innerHTML = chips.filter(Boolean).join('');
}
