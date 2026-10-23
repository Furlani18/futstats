const DB = (() => {
  const SEED_VERSION = 'multi-2';

  // Cache em memória do que foi lido do localStorage: com milhares de jogadores,
  // reler e reconverter o JSON a cada consulta deixaria o site lento.
  const memoria = {};

  function ler(chave) {
    if (!(chave in memoria)) {
      const raw = localStorage.getItem(chave);
      memoria[chave] = { valor: raw ? JSON.parse(raw) : null, indice: null };
    }
    return memoria[chave].valor;
  }

  function gravar(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
    memoria[chave] = { valor, indice: null };
  }

  function indicePorId(chave) {
    ler(chave);
    const m = memoria[chave];
    if (!m.indice) m.indice = new Map((m.valor || []).map(item => [item.id, item]));
    return m.indice;
  }

  // Outra aba gravou algo: descarta o cache.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', e => { if (e.key) delete memoria[e.key]; else Object.keys(memoria).forEach(k => delete memoria[k]); });
  }

  function uid(prefixo) {
    return `${prefixo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  // `escopo` filtra o que pertence ao campeonato selecionado (all); `todos` ignora o filtro.
  // `carimbo` acrescenta campos a todo item criado (ex.: o campeonato do jogo).
  function makeStore(chave, prefixo, escopo, carimbo) {
    return {
      todos() { return [...(ler(chave) || [])]; },
      all() { const itens = this.todos(); return escopo ? escopo(itens) : itens; },
      get(id) { return indicePorId(chave).get(id) || null; },
      create(dados) {
        const itens = this.todos();
        const item = { id: uid(prefixo), ...(carimbo ? carimbo() : {}), ...dados };
        itens.push(item);
        gravar(chave, itens);
        return item;
      },
      update(id, patch) {
        const itens = this.todos();
        const indice = itens.findIndex(item => item.id === id);
        if (indice === -1) return null;
        itens[indice] = { ...itens[indice], ...patch };
        gravar(chave, itens);
        return itens[indice];
      },
      remove(id) {
        gravar(chave, this.todos().filter(item => item.id !== id));
      },
    };
  }

  // ==========================================================================
  // Dados da Copa do Mundo FIFA 2026 — 48 seleções, 12 grupos (A–L).
  // Grupos conforme o sorteio final oficial (05/12/2025, Washington D.C.).
  // ==========================================================================

  const GRUPOS_SEED = {
    A: ['México', 'África do Sul', 'Coreia do Sul', 'Tchéquia'],
    B: ['Canadá', 'Suíça', 'Catar', 'Bósnia e Herzegovina'],
    C: ['Brasil', 'Marrocos', 'Haiti', 'Escócia'],
    D: ['Estados Unidos', 'Paraguai', 'Austrália', 'Turquia'],
    E: ['Alemanha', 'Curaçao', 'Costa do Marfim', 'Equador'],
    F: ['Países Baixos', 'Japão', 'Tunísia', 'Suécia'],
    G: ['Bélgica', 'Egito', 'Irã', 'Nova Zelândia'],
    H: ['Espanha', 'Cabo Verde', 'Arábia Saudita', 'Uruguai'],
    I: ['França', 'Senegal', 'Noruega', 'Iraque'],
    J: ['Argentina', 'Argélia', 'Áustria', 'Jordânia'],
    K: ['Portugal', 'Uzbequistão', 'Colômbia', 'RD Congo'],
    L: ['Inglaterra', 'Croácia', 'Gana', 'Panamá'],
  };

  const LETRAS_GRUPOS = Object.keys(GRUPOS_SEED);

  // Códigos ISO 3166-1 alpha-2 (minúsculos) usados para buscar a bandeira de
  // cada seleção via flagcdn.com. Inglaterra usa o código regional "gb-eng"
  // porque não possui código ISO próprio (compete separada do Reino Unido).
  const ISO_PAIS = {
    'México': 'mx', 'África do Sul': 'za', 'Coreia do Sul': 'kr', 'Tchéquia': 'cz',
    'Canadá': 'ca', 'Suíça': 'ch', 'Catar': 'qa', 'Bósnia e Herzegovina': 'ba',
    'Brasil': 'br', 'Marrocos': 'ma', 'Haiti': 'ht', 'Escócia': 'gb-sct',
    'Estados Unidos': 'us', 'Paraguai': 'py', 'Austrália': 'au', 'Turquia': 'tr',
    'Alemanha': 'de', 'Curaçao': 'cw', 'Costa do Marfim': 'ci', 'Equador': 'ec',
    'Países Baixos': 'nl', 'Japão': 'jp', 'Tunísia': 'tn', 'Suécia': 'se',
    'Bélgica': 'be', 'Egito': 'eg', 'Irã': 'ir', 'Nova Zelândia': 'nz',
    'Espanha': 'es', 'Cabo Verde': 'cv', 'Arábia Saudita': 'sa', 'Uruguai': 'uy',
    'França': 'fr', 'Senegal': 'sn', 'Noruega': 'no', 'Iraque': 'iq',
    'Argentina': 'ar', 'Argélia': 'dz', 'Áustria': 'at', 'Jordânia': 'jo',
    'Portugal': 'pt', 'Uzbequistão': 'uz', 'Colômbia': 'co', 'RD Congo': 'cd',
    'Inglaterra': 'gb-eng', 'Croácia': 'hr', 'Gana': 'gh', 'Panamá': 'pa',
  };

  const CONFEDERACOES = {
    'México': 'CONCACAF', 'África do Sul': 'CAF', 'Coreia do Sul': 'AFC', 'Tchéquia': 'UEFA',
    'Canadá': 'CONCACAF', 'Suíça': 'UEFA', 'Catar': 'AFC', 'Bósnia e Herzegovina': 'UEFA',
    'Brasil': 'CONMEBOL', 'Marrocos': 'CAF', 'Haiti': 'CONCACAF', 'Escócia': 'UEFA',
    'Estados Unidos': 'CONCACAF', 'Paraguai': 'CONMEBOL', 'Austrália': 'AFC', 'Turquia': 'UEFA',
    'Alemanha': 'UEFA', 'Curaçao': 'CONCACAF', 'Costa do Marfim': 'CAF', 'Equador': 'CONMEBOL',
    'Países Baixos': 'UEFA', 'Japão': 'AFC', 'Tunísia': 'CAF', 'Suécia': 'UEFA',
    'Bélgica': 'UEFA', 'Egito': 'CAF', 'Irã': 'AFC', 'Nova Zelândia': 'OFC',
    'Espanha': 'UEFA', 'Cabo Verde': 'CAF', 'Arábia Saudita': 'AFC', 'Uruguai': 'CONMEBOL',
    'França': 'UEFA', 'Senegal': 'CAF', 'Noruega': 'UEFA', 'Iraque': 'AFC',
    'Argentina': 'CONMEBOL', 'Argélia': 'CAF', 'Áustria': 'UEFA', 'Jordânia': 'AFC',
    'Portugal': 'UEFA', 'Uzbequistão': 'AFC', 'Colômbia': 'CONMEBOL', 'RD Congo': 'CAF',
    'Inglaterra': 'UEFA', 'Croácia': 'UEFA', 'Gana': 'CAF', 'Panamá': 'CONCACAF',
  };

  // Ranking FIFA aproximado (posição 1 = melhor), usado apenas como último
  // critério de desempate — não é um dado oficial atualizado em tempo real.
  const RANKING_ORDER = [
    'Argentina', 'Espanha', 'França', 'Inglaterra', 'Brasil', 'Portugal', 'Países Baixos', 'Bélgica',
    'Alemanha', 'Croácia', 'Marrocos', 'Colômbia', 'Uruguai', 'Japão', 'Estados Unidos', 'México',
    'Suíça', 'Senegal', 'Irã', 'Equador', 'Áustria', 'Austrália', 'Egito', 'Tunísia',
    'Argélia', 'Canadá', 'Noruega', 'Suécia', 'Paraguai', 'Escócia', 'Gana', 'Costa do Marfim',
    'Arábia Saudita', 'Catar', 'Turquia', 'Panamá', 'África do Sul', 'Uzbequistão', 'Iraque', 'Jordânia',
    'Nova Zelândia', 'Bósnia e Herzegovina', 'Coreia do Sul', 'RD Congo', 'Cabo Verde', 'Curaçao', 'Haiti', 'Tchéquia',
  ];

  // Código FIFA de 3 letras de cada seleção (usado em placares compactos).
  const CODIGO_FIFA = {
    'México': 'MEX', 'África do Sul': 'RSA', 'Coreia do Sul': 'KOR', 'Tchéquia': 'CZE',
    'Canadá': 'CAN', 'Suíça': 'SUI', 'Catar': 'QAT', 'Bósnia e Herzegovina': 'BIH',
    'Brasil': 'BRA', 'Marrocos': 'MAR', 'Haiti': 'HAI', 'Escócia': 'SCO',
    'Estados Unidos': 'USA', 'Paraguai': 'PAR', 'Austrália': 'AUS', 'Turquia': 'TUR',
    'Alemanha': 'GER', 'Curaçao': 'CUW', 'Costa do Marfim': 'CIV', 'Equador': 'ECU',
    'Países Baixos': 'NED', 'Japão': 'JPN', 'Tunísia': 'TUN', 'Suécia': 'SWE',
    'Bélgica': 'BEL', 'Egito': 'EGY', 'Irã': 'IRN', 'Nova Zelândia': 'NZL',
    'Espanha': 'ESP', 'Cabo Verde': 'CPV', 'Arábia Saudita': 'KSA', 'Uruguai': 'URU',
    'França': 'FRA', 'Senegal': 'SEN', 'Noruega': 'NOR', 'Iraque': 'IRQ',
    'Argentina': 'ARG', 'Argélia': 'ALG', 'Áustria': 'AUT', 'Jordânia': 'JOR',
    'Portugal': 'POR', 'Uzbequistão': 'UZB', 'Colômbia': 'COL', 'RD Congo': 'COD',
    'Inglaterra': 'ENG', 'Croácia': 'CRO', 'Gana': 'GHA', 'Panamá': 'PAN',
  };

  // País do clube (código FIFA → ISO para a bandeira via flagcdn).
  const ISO_POR_FIFA = {
    ENG: 'gb-eng', SCO: 'gb-sct', WAL: 'gb-wls', GER: 'de', ESP: 'es', FRA: 'fr', ITA: 'it', KSA: 'sa', TUR: 'tr',
    USA: 'us', NED: 'nl', BRA: 'br', POR: 'pt', QAT: 'qa', BEL: 'be', MEX: 'mx', IRN: 'ir', CZE: 'cz',
    EGY: 'eg', RSA: 'za', UZB: 'uz', ARG: 'ar', UAE: 'ae', IRQ: 'iq', DEN: 'dk', SUI: 'ch', RUS: 'ru',
    JOR: 'jo', GRE: 'gr', CYP: 'cy', NZL: 'nz', KOR: 'kr', AUT: 'at', TUN: 'tn', NOR: 'no', JPN: 'jp',
    AUS: 'au', CRO: 'hr', CAN: 'ca', POL: 'pl', ECU: 'ec', SWE: 'se', ISR: 'il', PAR: 'py', MAS: 'my',
    MAR: 'ma', HUN: 'hu', ALG: 'dz', VEN: 've', SVN: 'si', SVK: 'sk', SRB: 'rs', ROU: 'ro', PAN: 'pa',
    IRL: 'ie', CRC: 'cr', CHI: 'cl', BUL: 'bg', URU: 'uy', THA: 'th', KAZ: 'kz', IDN: 'id', HON: 'hn',
    HAI: 'ht', GHA: 'gh', FIN: 'fi', COL: 'co', CHN: 'cn', BIH: 'ba', AZE: 'az', ARM: 'am',
  };

  const ELENCOS = typeof ELENCOS_2026 !== 'undefined' ? ELENCOS_2026 : {};

  const TIMES_SEED = [];
  LETRAS_GRUPOS.forEach((letra, gi) => {
    GRUPOS_SEED[letra].forEach((nome, pos) => {
      TIMES_SEED.push({
        id: `t${gi * 4 + pos + 1}`,
        nome,
        codigo: CODIGO_FIFA[nome],
        grupo: letra,
        posicaoPote: pos + 1,
        confederacao: CONFEDERACOES[nome] || '—',
        rankingFifa: RANKING_ORDER.indexOf(nome) + 1,
        iso: ISO_PAIS[nome] || null,
        tecnico: ELENCOS[nome] ? ELENCOS[nome].tecnico : '',
      });
    });
  });

  // Idade calculada na data de abertura da Copa (11/06/2026), como na lista oficial da FIFA.
  function idadeEm(nascimento, referencia = '2026-06-11') {
    if (!nascimento) return null;
    const [ay, am, ad] = nascimento.split('-').map(Number);
    const [ry, rm, rd] = referencia.split('-').map(Number);
    return ry - ay - ((rm < am || (rm === am && rd < ad)) ? 1 : 0);
  }

  const JOGADORES_SEED = TIMES_SEED.flatMap(time => (ELENCOS[time.nome]?.jogadores || []).map(j => ({
    id: `p_${time.id}_${j.n}`,
    timeId: time.id,
    numero: j.n,
    nome: j.nome,
    posicao: j.p,
    nascimento: j.nasc,
    idade: idadeEm(j.nasc),
    clube: j.clube,
    clubePais: j.cp,
    jogosSelecao: j.caps,
    golsSelecao: j.gs,
    capitao: !!j.cap,
    status: 'ativo',
  })));

  const HORARIOS = ['13:00', '16:00', '19:00', '22:00'];

  const FASES_LABELS = {
    liga: 'Fase de liga',
    playoff: 'Playoff',
    oitavas: 'Oitavas de final',
    quartas: 'Quartas de final',
    semi: 'Semifinal',
    grupos: 'Fase de grupos',
    r32: '32avos de final',
    r16: 'Oitavas de final',
    qf: 'Quartas de final',
    sf: 'Semifinal',
    terceiro: 'Disputa de 3º lugar',
    final: 'Final',
  };

  const TORNEIO_SEED = {
    id: 'wc2026',
    nome: 'Copa do Mundo FIFA 2026',
    tipo: 'Copa do Mundo',
    sede: 'Estados Unidos, México e Canadá',
    temporada: '2026',
    periodo: '11 de junho – 19 de julho de 2026',
  };

  // ==========================================================================
  // Clubes (js/clubes.js) — times e elencos das competições de clubes.
  // ==========================================================================
  const CLUBES = typeof CLUBES_2026 !== 'undefined' ? CLUBES_2026 : {};
  const COMP_CLUBES = typeof COMPETICOES_CLUBES !== 'undefined' ? COMPETICOES_CLUBES : {};
  const idClube = slug => `c_${slug}`;

  const CLUBES_SEED = Object.entries(CLUBES).map(([slug, c]) => ({
    id: idClube(slug), tipo: 'clube', nome: c.nome, codigo: c.sigla, iso: c.pais || null,
    cores: c.cores, tecnico: c.tecnico || '', estadio: c.estadio || '', escudo: c.escudo || null,
  }));

  const JOGADORES_CLUBES_SEED = Object.entries(CLUBES).flatMap(([slug, c]) => c.jogadores.map((j, i) => ({
    id: `p_${idClube(slug)}_${i + 1}`, timeId: idClube(slug), numero: j.n, nome: j.nome, posicao: j.p,
    nacionalidade: j.nat || null, capitao: !!j.cap, status: 'ativo', idade: null,
  })));

  // Garante que todos os clubes e elencos existam (sem mexer no que já foi editado).
  function garantirClubes() {
    if (!CLUBES_SEED.length) return;
    const times = ler('fs_times') || [];
    const idsTimes = new Set(times.map(t => t.id));
    const novosTimes = CLUBES_SEED.filter(t => !idsTimes.has(t.id));
    if (novosTimes.length) gravar('fs_times', [...times, ...novosTimes]);
    const jogadores = ler('fs_jogadores') || [];
    const comElenco = new Set(jogadores.map(j => j.timeId));
    const novos = JOGADORES_CLUBES_SEED.filter(j => !comElenco.has(j.timeId));
    if (novos.length) gravar('fs_jogadores', [...jogadores, ...novos]);
  }

  // Versão multi-1: chegam os clubes. Quem já tinha a versão da Copa (wc2026-2)
  // mantém jogos, gols e edições — só ganha os clubes e o campo competicaoId.
  function inicializarSeed() {
    const versao = localStorage.getItem('fs_seed_version');
    if (versao === SEED_VERSION) return;
    if (!JOGADORES_SEED.length || !CLUBES_SEED.length) return; // elencos.js/clubes.js não carregados nesta página
    if (versao === 'multi-1') {
      // multi-2: os clubes ganham o escudo (sem mexer em nada que foi editado).
      const escudos = Object.fromEntries(CLUBES_SEED.map(t => [t.id, t.escudo]));
      gravar('fs_times', (ler('fs_times') || []).map(t => (t.tipo === 'clube' && !t.escudo && escudos[t.id] ? { ...t, escudo: escudos[t.id] } : t)));
    } else if (versao === 'wc2026-2') {
      garantirClubes();
      gravar('fs_jogos', (ler('fs_jogos') || []).map(j => (j.competicaoId ? j : { ...j, competicaoId: 'copa2026' })));
    } else {
      gravar('fs_times', [...TIMES_SEED, ...CLUBES_SEED]);
      gravar('fs_jogadores', [...JOGADORES_SEED, ...JOGADORES_CLUBES_SEED]);
      gravar('fs_jogos', []);
      localStorage.removeItem('fs_dados_publicados');
    }
    gravar('fs_torneio', TORNEIO_SEED);
    localStorage.setItem('fs_seed_version', SEED_VERSION);
  }

  inicializarSeed();

  // ==========================================================================
  // Contexto — o campeonato selecionado. Vem de ?c= na URL (links compartilháveis)
  // ou da última escolha salva; todas as consultas "all()" ficam restritas a ele.
  // ==========================================================================
  const COMPS = typeof COMPETICOES !== 'undefined' ? COMPETICOES
    : [{ id: 'copa2026', tipo: 'copa_mundo', nome: 'Copa do Mundo FIFA 2026', curto: 'Copa do Mundo', temporada: '2026', totalJogos: 104 }];
  const PADRAO = 'copa2026';

  function compValida(id) {
    return COMPS.some(c => c.id === id);
  }

  let compAtual = (() => {
    let id = null;
    try {
      const daUrl = new URLSearchParams(window.location.search).get('c');
      if (compValida(daUrl)) { id = daUrl; localStorage.setItem('fs_comp', id); }
    } catch (e) { /* fora do navegador */ }
    if (!id) {
      const salvo = localStorage.getItem('fs_comp');
      id = compValida(salvo) ? salvo : PADRAO;
    }
    return id;
  })();

  const cacheIds = {};
  function idsTimesDe(compId) {
    if (cacheIds[compId]) return cacheIds[compId];
    const comp = COMPS.find(c => c.id === compId);
    let ids;
    if (!comp || comp.tipo === 'copa_mundo') ids = TIMES_SEED.map(t => t.id);
    else ids = ((COMP_CLUBES[compId] || {}).clubes || []).map(idClube);
    cacheIds[compId] = ids;
    return ids;
  }

  const Contexto = {
    lista: COMPS,
    id: () => compAtual,
    get: () => COMPS.find(c => c.id === compAtual) || COMPS[0],
    tipo: () => (COMPS.find(c => c.id === compAtual) || COMPS[0]).tipo,
    ehCopa: () => Contexto.tipo() === 'copa_mundo',
    definir(id) {
      if (!compValida(id)) return false;
      compAtual = id;
      try { localStorage.setItem('fs_comp', id); } catch (e) { /* sem armazenamento */ }
      return true;
    },
    idsTimes: (compId = compAtual) => idsTimesDe(compId),
    competicoesDoTime: timeId => COMPS.filter(c => idsTimesDe(c.id).includes(timeId)),
    // Abre o campeonato do item visitado (jogo ou time) se ele não for do atual.
    ajustarPara({ jogo, timeId }) {
      if (jogo) { this.definir(jogo.competicaoId || PADRAO); return; }
      if (timeId && !idsTimesDe(compAtual).includes(timeId)) {
        const primeira = this.competicoesDoTime(timeId)[0];
        if (primeira) this.definir(primeira.id);
      }
    },
    gruposClubes: (compId = compAtual) => {
      const g = (COMP_CLUBES[compId] || {}).grupos || {};
      return Object.fromEntries(Object.entries(g).map(([letra, slugs]) => [letra, slugs.map(idClube)]));
    },
  };

  const noEscopoTimes = itens => {
    const ids = idsTimesDe(compAtual);
    const ordem = new Map(ids.map((id, i) => [id, i]));
    return itens.filter(t => ordem.has(t.id)).sort((a, b) => ordem.get(a.id) - ordem.get(b.id));
  };
  const noEscopoJogadores = itens => {
    const ids = new Set(idsTimesDe(compAtual));
    return itens.filter(j => ids.has(j.timeId));
  };
  const noEscopoJogos = itens => itens.filter(j => (j.competicaoId || PADRAO) === compAtual);

  const Times = makeStore('fs_times', 't', noEscopoTimes);
  const Jogadores = makeStore('fs_jogadores', 'p', noEscopoJogadores);

  const Jogos = {
    ...makeStore('fs_jogos', 'j', noEscopoJogos, () => ({ competicaoId: compAtual })),
    aoVivo() {
      return this.all().filter(j => j.status === 'ao_vivo');
    },
    proximos(limite = 10) {
      return this.all()
        .filter(j => j.status === 'agendado')
        .sort((a, b) => new Date(a.data) - new Date(b.data))
        .slice(0, limite);
    },
    porGrupo(letra) {
      return this.all().filter(j => j.fase === 'grupos' && j.grupo === letra).sort((a, b) => a.rodada - b.rodada);
    },
    porFase(fase) {
      return this.all().filter(j => j.fase === fase).sort((a, b) => (a.matchNum || a.numero) - (b.matchNum || b.numero));
    },
    doTime(timeId) {
      return this.all()
        .filter(j => j.mandanteId === timeId || j.visitanteId === timeId)
        .sort((a, b) => new Date(a.data) - new Date(b.data));
    },
    comPlacar() {
      return this.all().filter(j => j.status === 'encerrado' || j.status === 'ao_vivo');
    },
    // Jogo de qualquer fase (liga, grupos ou mata-mata com perna 1/2).
    criar({ fase, rodada = null, grupo = null, perna = null, mandanteId, visitanteId, data, local }) {
      return this.create({
        fase, rodada, grupo, perna, mandanteId, visitanteId, data, local: local || '',
        status: 'agendado',
        golsMandante: null, golsVisitante: null, penaltisMandante: null, penaltisVisitante: null,
        gols: [], cartoes: [],
      });
    },
    // Turno e returno (método do círculo). `ids` = times; cria só confrontos que ainda não existem.
    gerarTurnoReturno({ ids, fase, grupo = null, inicio, intervaloDias = 7, rodadaInicial = 1 }) {
      const lista = ids.length % 2 ? [...ids, null] : [...ids];
      const n = lista.length;
      const turno = [];
      for (let r = 0; r < n - 1; r++) {
        const jogos = [];
        for (let i = 0; i < n / 2; i++) {
          const a = lista[i], b = lista[n - 1 - i];
          if (a && b) jogos.push(r % 2 === 0 ? [a, b] : [b, a]);
        }
        turno.push(jogos);
        lista.splice(1, 0, lista.pop());
      }
      const rodadas = [...turno, ...turno.map(js => js.map(([a, b]) => [b, a]))];
      const existentes = new Set(this.all().filter(j => j.fase === fase).map(j => `${j.mandanteId}>${j.visitanteId}`));
      const base = new Date(`${inicio}T16:00`);
      let criados = 0;
      rodadas.forEach((jogos, r) => {
        const dia = new Date(base.getTime() + r * intervaloDias * 864e5);
        const data = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}T16:00`;
        jogos.forEach(([m, v]) => {
          if (existentes.has(`${m}>${v}`)) return;
          const casa = Times.get(m);
          this.criar({ fase, grupo, rodada: rodadaInicial + r, mandanteId: m, visitanteId: v, data, local: casa ? casa.estadio || '' : '' });
          criados++;
        });
      });
      return criados;
    },
    criarJogoDeGrupo({ grupo, rodada, mandanteId, visitanteId, data, local }) {
      return this.create({
        fase: 'grupos', grupo, rodada, mandanteId, visitanteId, data, local,
        status: 'agendado',
        golsMandante: null, golsVisitante: null, penaltisMandante: null, penaltisVisitante: null,
        gols: [], cartoes: [],
      });
    },
    // Importa o calendário oficial da fase de grupos (js/calendario.js), sem placares.
    // Confrontos que já existem no mesmo grupo são mantidos como estão.
    importarCalendario(calendario) {
      const porNome = Object.fromEntries(Times.all().map(t => [t.nome, t]));
      const existentes = new Set(this.all().filter(j => j.fase === 'grupos')
        .map(j => [j.mandanteId, j.visitanteId].sort().join('|')));
      let criados = 0;
      calendario.forEach(c => {
        const m = porNome[c.mandante], v = porNome[c.visitante];
        if (!m || !v) return;
        const chave = [m.id, v.id].sort().join('|');
        if (existentes.has(chave)) return;
        existentes.add(chave);
        this.criarJogoDeGrupo({
          grupo: c.grupo, rodada: c.rodada, mandanteId: m.id, visitanteId: v.id,
          data: c.data, local: `${c.estadio}, ${c.cidade}`,
        });
        criados++;
      });
      return criados;
    },
  };

  // Times de cada grupo, guardados até a lista de times mudar (o simulador de
  // probabilidades calcula milhares de tabelas por segundo).
  let cacheGrupos = { base: null, comp: null, porLetra: {} };

  const Grupos = {
    get letras() {
      if (Contexto.ehCopa()) return LETRAS_GRUPOS;
      return Object.keys(Contexto.gruposClubes());
    },
    times(letra) {
      const base = ler('fs_times');
      if (cacheGrupos.base !== base || cacheGrupos.comp !== compAtual) cacheGrupos = { base, comp: compAtual, porLetra: {} };
      if (!cacheGrupos.porLetra[letra]) {
        cacheGrupos.porLetra[letra] = !Contexto.ehCopa()
          ? (Contexto.gruposClubes()[letra] || []).map(id => Times.get(id)).filter(Boolean)
          : Times.all().filter(t => t.grupo === letra).sort((a, b) => a.posicaoPote - b.posicaoPote);
      }
      return [...cacheGrupos.porLetra[letra]];
    },
    deTime(timeId) {
      if (Contexto.ehCopa()) return (Times.get(timeId) || {}).grupo || null;
      return Object.entries(Contexto.gruposClubes()).find(([, ids]) => ids.includes(timeId))?.[0] || null;
    },
    // Jogos previstos no grupo: turno único na Copa (6), turno e returno nos clubes (12).
    jogosPrevistos(letra) {
      const n = Grupos.times(letra).length;
      return Contexto.ehCopa() ? (n * (n - 1)) / 2 : n * (n - 1);
    },
    completo(letra) {
      const jogos = Jogos.porGrupo(letra);
      return jogos.length >= Grupos.jogosPrevistos(letra) && jogos.length > 0 && jogos.every(j => j.status === 'encerrado');
    },
    todosCompletos() {
      return LETRAS_GRUPOS.every(letra => Grupos.completo(letra));
    },
  };

  // ==========================================================================
  // Classificação — critérios de desempate oficiais da FIFA para a Copa 2026:
  // 1) pontos, 2) SG, 3) gols pró — os 3 primeiro aplicados exclusivamente
  //    entre os times empatados (mini-liga), reaplicados aos que restarem
  //    empatados dentro desse subgrupo; se não separar mais ninguém, then:
  // 4) SG geral, 5) gols pró geral, 6) conduta/fair play, 7) ranking FIFA.
  // ==========================================================================

  function statsEntre(idsSet, jogos) {
    const mini = {};
    idsSet.forEach(id => { mini[id] = { P: 0, GP: 0, GC: 0 }; });
    jogos.forEach(j => {
      if (!idsSet.has(j.mandanteId) || !idsSet.has(j.visitanteId)) return;
      mini[j.mandanteId].GP += j.golsMandante; mini[j.mandanteId].GC += j.golsVisitante;
      mini[j.visitanteId].GP += j.golsVisitante; mini[j.visitanteId].GC += j.golsMandante;
      if (j.golsMandante > j.golsVisitante) mini[j.mandanteId].P += 3;
      else if (j.golsMandante < j.golsVisitante) mini[j.visitanteId].P += 3;
      else { mini[j.mandanteId].P++; mini[j.visitanteId].P++; }
    });
    return mini;
  }

  function resolverPorCriteriosGerais(times) {
    return [...times].sort((a, b) =>
      b.SG - a.SG || b.GP - a.GP || b.fairPlay - a.fairPlay || a.rankingFifa - b.rankingFifa || a.nome.localeCompare(b.nome));
  }

  function resolverEmpate(empatados, jogos) {
    if (empatados.length <= 1) return empatados;
    const ids = new Set(empatados.map(t => t.timeId));
    const mini = statsEntre(ids, jogos);
    const comMini = empatados.map(t => ({
      ...t,
      _miniP: mini[t.timeId].P,
      _miniSG: mini[t.timeId].GP - mini[t.timeId].GC,
      _miniGP: mini[t.timeId].GP,
    }));
    comMini.sort((x, y) => y._miniP - x._miniP || y._miniSG - x._miniSG || y._miniGP - x._miniGP);

    const resultado = [];
    let i = 0;
    while (i < comMini.length) {
      let j = i + 1;
      while (j < comMini.length
        && comMini[j]._miniP === comMini[i]._miniP
        && comMini[j]._miniSG === comMini[i]._miniSG
        && comMini[j]._miniGP === comMini[i]._miniGP) j++;
      const subgrupo = comMini.slice(i, j);
      if (subgrupo.length > 1 && subgrupo.length < empatados.length) {
        // A mini-liga separou parte do grupo — reaplica exclusivamente ao que restou empatado.
        resultado.push(...resolverEmpate(subgrupo, jogos));
      } else if (subgrupo.length > 1) {
        // A mini-liga não separou ninguém: cai para os critérios gerais.
        resultado.push(...resolverPorCriteriosGerais(subgrupo));
      } else {
        resultado.push(subgrupo[0]);
      }
      i = j;
    }
    return resultado;
  }

  function ordenarComDesempate(lista, jogos) {
    const porPontos = [...lista].sort((a, b) => b.P - a.P);
    const resultado = [];
    let i = 0;
    while (i < porPontos.length) {
      let j = i + 1;
      while (j < porPontos.length && porPontos[j].P === porPontos[i].P) j++;
      const empatados = porPontos.slice(i, j);
      resultado.push(...(empatados.length > 1 ? resolverEmpate(empatados, jogos) : empatados));
      i = j;
    }
    return resultado.map((t, idx) => ({ ...t, posicao: idx + 1 }));
  }

  function zonaDe(posicao, zonas) {
    return (zonas || []).find(z => posicao >= z.de && posicao <= z.ate) || null;
  }

  // Pontos de conduta do regulamento: amarelo −1, vermelho por 2º amarelo −3, vermelho direto −4.
  const PONTOS_FAIR_PLAY = { amarelo: 1, segundo_amarelo: 3, vermelho: 4 };

  // `fonte` (opcional): lista de jogos a usar no lugar dos cadastrados — o simulador
  // passa os jogos reais + palpites sem gravar nada.
  function jogosDoGrupo(letra, fonte) {
    return fonte ? fonte.filter(j => j.fase === 'grupos' && j.grupo === letra) : Jogos.porGrupo(letra);
  }

  const Classificacao = {
    grupo(letra, fonte) {
      const times = Grupos.times(letra);
      const base = {};
      times.forEach(t => {
        base[t.id] = {
          timeId: t.id, nome: t.nome, grupo: letra, rankingFifa: t.rankingFifa || 999,
          P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0, CA: 0, CV: 0, fairPlay: 0,
        };
      });
      const jogos = jogosDoGrupo(letra, fonte).filter(j => j.status === 'encerrado');
      jogos.forEach(j => {
        const m = base[j.mandanteId], v = base[j.visitanteId];
        if (!m || !v) return;
        m.J++; v.J++;
        m.GP += j.golsMandante; m.GC += j.golsVisitante;
        v.GP += j.golsVisitante; v.GC += j.golsMandante;
        (j.cartoes || []).forEach(c => {
          const alvo = base[c.timeId];
          if (!alvo) return;
          if (c.tipo === 'amarelo') alvo.CA++;
          else alvo.CV++;
          alvo.fairPlay -= PONTOS_FAIR_PLAY[c.tipo] || 0;
        });
        if (j.golsMandante > j.golsVisitante) { m.V++; m.P += 3; v.D++; }
        else if (j.golsMandante < j.golsVisitante) { v.V++; v.P += 3; m.D++; }
        else { m.E++; v.E++; m.P++; v.P++; }
      });
      const lista = Object.values(base);
      lista.forEach(t => { t.SG = t.GP - t.GC; });
      return ordenarComDesempate(lista, jogos);
    },

    // Tabela única (pontos corridos ou fase de liga da Champions) com zonas do campeonato.
    liga(fonte) {
      const comp = Contexto.get();
      const base = {};
      Times.all().forEach(t => {
        base[t.id] = { timeId: t.id, nome: t.nome, P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0, CA: 0, CV: 0, ultimos: [] };
      });
      const jogos = (fonte || Jogos.all())
        .filter(j => j.fase === 'liga' && j.status === 'encerrado' && j.golsMandante != null && j.golsVisitante != null)
        // Datas no mesmo formato ISO ("2026-05-10T16:00"): comparar o texto dá a mesma ordem, sem criar Date.
        .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
      jogos.forEach(j => {
        const m = base[j.mandanteId], v = base[j.visitanteId];
        if (!m || !v) return;
        m.J++; v.J++;
        m.GP += j.golsMandante; m.GC += j.golsVisitante;
        v.GP += j.golsVisitante; v.GC += j.golsMandante;
        (j.cartoes || []).forEach(c => { const alvo = base[c.timeId]; if (alvo) { if (c.tipo === 'amarelo') alvo.CA++; else alvo.CV++; } });
        if (j.golsMandante > j.golsVisitante) { m.V++; m.P += 3; v.D++; }
        else if (j.golsMandante < j.golsVisitante) { v.V++; v.P += 3; m.D++; }
        else { m.E++; v.E++; m.P++; v.P++; }
      });
      const criterios = comp.desempate || ['P', 'SG', 'GP'];
      const lista = Object.values(base);
      lista.forEach(t => { t.SG = t.GP - t.GC; t.aproveitamento = t.J ? Math.round((t.P / (t.J * 3)) * 100) : 0; });
      lista.sort((a, b) => {
        for (const c of criterios) if (b[c] !== a[c]) return b[c] - a[c];
        return a.CV - b.CV || a.CA - b.CA || a.nome.localeCompare(b.nome);
      });
      return lista.map((t, i) => ({ ...t, posicao: i + 1, zona: zonaDe(i + 1, comp.zonas) }));
    },

    // `tabelas` (opcional): { letra: tabela } já calculadas, para não refazer os 12 grupos.
    terceiros(fonte, tabelas) {
      if (!Contexto.ehCopa()) return [];
      const linhas = LETRAS_GRUPOS.map(letra => {
        const tabela = tabelas ? tabelas[letra] : Classificacao.grupo(letra, fonte);
        return tabela[2];
      });
      const ordenados = [...linhas].sort((a, b) =>
        b.P - a.P || b.SG - a.SG || b.GP - a.GP || b.fairPlay - a.fairPlay || a.rankingFifa - b.rankingFifa || a.nome.localeCompare(b.nome));
      return ordenados.map((t, idx) => ({ ...t, posicaoGeral: idx + 1, classificado: idx < 8 }));
    },
  };

  // ==========================================================================
  // Mata-mata — estrutura fixa dos 32avos de final da Copa 2026 (16 jogos):
  // 8 cruzamentos diretos entre 1ºs/2ºs colocados + 8 jogos "1º colocado x
  // melhor 3º dentre um pool fixo de 5 grupos possíveis" (mesmo mecanismo do
  // Anexo C do regulamento oficial — aqui resolvido por casamento válido, não
  // pela tabela literal de 495 combinações).
  // ==========================================================================

  const POOLS_R32 = [
    { matchNum: 73, tipo: 'cruzamento', a: { pos: 2, grupo: 'A' }, b: { pos: 2, grupo: 'B' } },
    { matchNum: 74, tipo: 'terceiro', a: { pos: 1, grupo: 'E' }, pool: ['A', 'B', 'C', 'D', 'F'] },
    { matchNum: 75, tipo: 'cruzamento', a: { pos: 1, grupo: 'F' }, b: { pos: 2, grupo: 'C' } },
    { matchNum: 76, tipo: 'cruzamento', a: { pos: 1, grupo: 'C' }, b: { pos: 2, grupo: 'F' } },
    { matchNum: 77, tipo: 'terceiro', a: { pos: 1, grupo: 'I' }, pool: ['C', 'D', 'F', 'G', 'H'] },
    { matchNum: 78, tipo: 'cruzamento', a: { pos: 2, grupo: 'E' }, b: { pos: 2, grupo: 'I' } },
    { matchNum: 79, tipo: 'terceiro', a: { pos: 1, grupo: 'A' }, pool: ['C', 'E', 'F', 'H', 'I'] },
    { matchNum: 80, tipo: 'terceiro', a: { pos: 1, grupo: 'L' }, pool: ['E', 'H', 'I', 'J', 'K'] },
    { matchNum: 81, tipo: 'terceiro', a: { pos: 1, grupo: 'D' }, pool: ['B', 'E', 'F', 'I', 'J'] },
    { matchNum: 82, tipo: 'terceiro', a: { pos: 1, grupo: 'G' }, pool: ['A', 'E', 'H', 'I', 'J'] },
    { matchNum: 83, tipo: 'cruzamento', a: { pos: 2, grupo: 'K' }, b: { pos: 2, grupo: 'L' } },
    { matchNum: 84, tipo: 'cruzamento', a: { pos: 1, grupo: 'H' }, b: { pos: 2, grupo: 'J' } },
    { matchNum: 85, tipo: 'terceiro', a: { pos: 1, grupo: 'B' }, pool: ['E', 'F', 'G', 'I', 'J'] },
    { matchNum: 86, tipo: 'cruzamento', a: { pos: 1, grupo: 'J' }, b: { pos: 2, grupo: 'H' } },
    { matchNum: 87, tipo: 'terceiro', a: { pos: 1, grupo: 'K' }, pool: ['D', 'E', 'I', 'J', 'L'] },
    { matchNum: 88, tipo: 'cruzamento', a: { pos: 2, grupo: 'D' }, b: { pos: 2, grupo: 'G' } },
  ];

  const DATAS_FASE = {
    r32: ['2026-06-28', '2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03'],
    r16: ['2026-07-04', '2026-07-05', '2026-07-06', '2026-07-07'],
    qf: ['2026-07-09', '2026-07-10'],
    sf: ['2026-07-14'],
    terceiro: ['2026-07-18'],
    final: ['2026-07-19'],
  };

  function dataChave(fase, numero) {
    const datas = DATAS_FASE[fase] || ['2026-07-01'];
    const dia = datas[(numero - 1) % datas.length];
    const horario = HORARIOS[(numero - 1) % HORARIOS.length];
    return `${dia}T${horario}`;
  }

  // Estádios do mata-mata (a final é no MetLife e a disputa de 3º no Hard Rock).
  const SEDES_MATA_MATA = [
    'SoFi Stadium, Los Angeles', 'Gillette Stadium, Boston', 'Estadio BBVA, Monterrey', 'NRG Stadium, Houston',
    'MetLife Stadium, Nova York/Nova Jersey', 'AT&T Stadium, Dallas', 'Estadio Azteca, Cidade do México',
    'Mercedes-Benz Stadium, Atlanta', "Levi's Stadium, São Francisco", 'Lumen Field, Seattle', 'BMO Field, Toronto',
    'BC Place, Vancouver', 'Arrowhead Stadium, Kansas City', 'Lincoln Financial Field, Filadélfia',
    'Hard Rock Stadium, Miami', 'Estadio Akron, Guadalajara',
  ];

  function sedeChave(fase, numero) {
    if (fase === 'final') return 'MetLife Stadium, Nova York/Nova Jersey';
    if (fase === 'terceiro') return 'Hard Rock Stadium, Miami';
    return SEDES_MATA_MATA[(numero * 3 + fase.length) % SEDES_MATA_MATA.length];
  }

  function resolverPoolsTerceiros(gruposClassificados) {
    const slots = POOLS_R32.filter(s => s.tipo === 'terceiro');
    const usados = new Set();
    const atribuicao = {};
    function backtrack(i) {
      if (i === slots.length) return true;
      const slot = slots[i];
      for (const g of gruposClassificados) {
        if (usados.has(g) || !slot.pool.includes(g)) continue;
        usados.add(g); atribuicao[slot.matchNum] = g;
        if (backtrack(i + 1)) return true;
        usados.delete(g); delete atribuicao[slot.matchNum];
      }
      return false;
    }
    backtrack(0);
    return atribuicao;
  }

  function timePorPosicao(pos, letra, fonte) {
    const tabela = Classificacao.grupo(letra, fonte);
    return tabela[pos - 1] || null;
  }

  function ensureJogo(id, fase, numero, mandanteId, visitanteId, projetado) {
    const existente = Jogos.get(id);
    if (existente && existente.status === 'encerrado') return existente;
    if (existente) {
      // Mantém data/local editados no painel; se o confronto mudou, os lances antigos deixam de valer.
      const mudou = existente.mandanteId !== mandanteId || existente.visitanteId !== visitanteId;
      if (!mudou && existente.projetado === projetado) return existente;
      return Jogos.update(id, { mandanteId, visitanteId, projetado, ...(mudou ? { gols: [], cartoes: [] } : {}) });
    }
    const registro = {
      id, competicaoId: PADRAO, fase, numero, mandanteId, visitanteId, projetado,
      ...(fase === 'r32' ? { matchNum: numero } : {}),
      data: dataChave(fase, numero), local: sedeChave(fase, numero),
      golsMandante: null, golsVisitante: null, penaltisMandante: null, penaltisVisitante: null,
      status: 'agendado',
      gols: [], cartoes: [],
    };
    const itens = ler('fs_jogos') || [];
    itens.push(registro);
    gravar('fs_jogos', itens);
    return registro;
  }

  function vencedorId(jogo) {
    if (!jogo || jogo.status !== 'encerrado') return null;
    if (jogo.golsMandante > jogo.golsVisitante) return jogo.mandanteId;
    if (jogo.golsMandante < jogo.golsVisitante) return jogo.visitanteId;
    if (jogo.penaltisMandante != null && jogo.penaltisVisitante != null && jogo.penaltisMandante !== jogo.penaltisVisitante) {
      return jogo.penaltisMandante > jogo.penaltisVisitante ? jogo.mandanteId : jogo.visitanteId;
    }
    return null;
  }

  function perdedorId(jogo) {
    const v = vencedorId(jogo);
    if (!v) return null;
    return v === jogo.mandanteId ? jogo.visitanteId : jogo.mandanteId;
  }

  function nomeTime(id) {
    const t = id ? Times.get(id) : null;
    return t ? t.nome : null;
  }

  function montarR32(fonte) {
    const completos = fonte
      ? LETRAS_GRUPOS.every(l => { const js = jogosDoGrupo(l, fonte); return js.length === 6 && js.every(j => j.status === 'encerrado'); })
      : Grupos.todosCompletos();
    const terceiros = Classificacao.terceiros(fonte);
    const classificados3 = terceiros.filter(t => t.classificado).map(t => t.grupo);
    const atribuicao = classificados3.length === 8 ? resolverPoolsTerceiros(classificados3) : {};
    // Enquanto o grupo não teve jogos, mostra só a vaga ("1º Grupo A"); depois, o time que ocupa a vaga hoje.
    const rotulo = (time, pos, letra) => (time && jogosDoGrupo(letra, fonte).some(j => j.status !== 'agendado'))
      ? `${time.nome} (${pos}º ${letra})`
      : `${pos}º Grupo ${letra}`;
    return POOLS_R32.map(slot => {
      const timeA = timePorPosicao(slot.a.pos, slot.a.grupo, fonte);
      let timeB = null;
      let labelVisitante;
      if (slot.tipo === 'cruzamento') {
        timeB = timePorPosicao(slot.b.pos, slot.b.grupo, fonte);
        labelVisitante = rotulo(timeB, slot.b.pos, slot.b.grupo);
      } else {
        const letraAtribuida = atribuicao[slot.matchNum];
        timeB = letraAtribuida ? timePorPosicao(3, letraAtribuida, fonte) : null;
        labelVisitante = letraAtribuida ? rotulo(timeB, 3, letraAtribuida) : `3º colocado (${slot.pool.join('/')})`;
      }
      return {
        matchNum: slot.matchNum,
        mandanteId: timeA ? timeA.timeId : null,
        visitanteId: timeB ? timeB.timeId : null,
        labelMandante: rotulo(timeA, slot.a.pos, slot.a.grupo),
        labelVisitante,
        projetado: !completos,
      };
    });
  }

  // "Venc. BRA/NED" quando o jogo anterior já tem confronto; senão, só "A definir".
  function rotuloVencedor(jogo) {
    if (!jogo) return 'A definir';
    const codigo = id => (Times.get(id) || {}).codigo || '?';
    return `Venc. ${codigo(jogo.mandanteId)}/${codigo(jogo.visitanteId)}`;
  }

  function propagar(anterior, fase) {
    const resultado = [];
    for (let i = 0; i < anterior.length; i += 2) {
      const a = anterior[i], b = anterior[i + 1];
      const numero = i / 2 + 1;
      const jogoA = a.jogoId ? Jogos.get(a.jogoId) : null;
      const jogoB = b.jogoId ? Jogos.get(b.jogoId) : null;
      const vA = jogoA ? vencedorId(jogoA) : null;
      const vB = jogoB ? vencedorId(jogoB) : null;
      const projetado = !!(a.projetado || b.projetado || !vA || !vB);
      let jogoId = null;
      if (vA && vB) {
        const id = `j_${fase}_${numero}`;
        ensureJogo(id, fase, numero, vA, vB, a.projetado || b.projetado);
        jogoId = id;
      }
      resultado.push({
        numero, jogoId,
        labelMandante: vA ? nomeTime(vA) : rotuloVencedor(jogoA),
        labelVisitante: vB ? nomeTime(vB) : rotuloVencedor(jogoB),
        projetado,
      });
    }
    return resultado;
  }

  function propagarFinais(sf) {
    const a = sf[0], b = sf[1];
    const jogoA = a.jogoId ? Jogos.get(a.jogoId) : null;
    const jogoB = b.jogoId ? Jogos.get(b.jogoId) : null;
    const vA = jogoA ? vencedorId(jogoA) : null, vB = jogoB ? vencedorId(jogoB) : null;
    const pA = jogoA ? perdedorId(jogoA) : null, pB = jogoB ? perdedorId(jogoB) : null;
    const projetado = !!(a.projetado || b.projetado);

    let final = { jogoId: null, labelMandante: vA ? nomeTime(vA) : 'Vencedor SF1', labelVisitante: vB ? nomeTime(vB) : 'Vencedor SF2', projetado: true };
    if (vA && vB) {
      ensureJogo('j_final_1', 'final', 1, vA, vB, projetado);
      final = { jogoId: 'j_final_1', labelMandante: nomeTime(vA), labelVisitante: nomeTime(vB), projetado };
    }

    let terceiro = { jogoId: null, labelMandante: pA ? nomeTime(pA) : 'Perdedor SF1', labelVisitante: pB ? nomeTime(pB) : 'Perdedor SF2', projetado: true };
    if (pA && pB) {
      ensureJogo('j_terceiro_1', 'terceiro', 1, pA, pB, projetado);
      terceiro = { jogoId: 'j_terceiro_1', labelMandante: nomeTime(pA), labelVisitante: nomeTime(pB), projetado };
    }
    return { final, terceiro };
  }

  const MataMata = {
    POOLS_R32,
    // Grupos dos 8 melhores 3ºs → { matchNum: letra } (o simulador de probabilidades usa direto).
    resolverTerceiros: resolverPoolsTerceiros,
    // 32avos projetados a partir de uma lista de jogos (sem criar nada no armazenamento).
    projetarR32: fonte => montarR32(fonte),
    vencedor: vencedorId,
    perdedor: perdedorId,
    // Confrontos de uma fase de clubes: agrupa ida e volta e calcula o agregado.
    confrontos(fase, fonte) {
      const comp = Contexto.get();
      const unico = (comp.jogoUnico || []).includes(fase);
      const porChave = new Map();
      (fonte || Jogos.all()).filter(j => j.fase === fase)
        .sort((a, b) => (a.perna || 1) - (b.perna || 1) || new Date(a.data) - new Date(b.data))
        .forEach(j => {
          const chave = [j.mandanteId, j.visitanteId].sort().join('|');
          if (!porChave.has(chave)) porChave.set(chave, []);
          porChave.get(chave).push(j);
        });
      return [...porChave.values()].map(jogos => {
        const a = jogos[0].mandanteId, b = jogos[0].visitanteId;
        let golsA = 0, golsB = 0, comPlacar = 0;
        jogos.forEach(j => {
          if (j.golsMandante == null || j.golsVisitante == null || (j.status !== 'encerrado' && j.status !== 'ao_vivo')) return;
          comPlacar++;
          if (j.mandanteId === a) { golsA += j.golsMandante; golsB += j.golsVisitante; }
          else { golsA += j.golsVisitante; golsB += j.golsMandante; }
        });
        const pernas = unico ? 1 : 2;
        const ultimo = jogos[jogos.length - 1];
        const encerrado = jogos.length >= pernas && jogos.slice(0, pernas).every(j => j.status === 'encerrado');
        let vencedor = null, penaltis = null;
        if (encerrado) {
          if (golsA !== golsB) vencedor = golsA > golsB ? a : b;
          else if (ultimo.penaltisMandante != null && ultimo.penaltisVisitante != null && ultimo.penaltisMandante !== ultimo.penaltisVisitante) {
            vencedor = ultimo.penaltisMandante > ultimo.penaltisVisitante ? ultimo.mandanteId : ultimo.visitanteId;
            penaltis = ultimo.mandanteId === a ? [ultimo.penaltisMandante, ultimo.penaltisVisitante] : [ultimo.penaltisVisitante, ultimo.penaltisMandante];
          }
        }
        return { fase, jogos, timeA: a, timeB: b, golsA, golsB, comPlacar: comPlacar > 0, encerrado, vencedor, penaltis, pernas };
      });
    },
    sincronizar() {
      if (!Contexto.ehCopa()) return null;
      const r32Slots = montarR32();
      if (!Grupos.todosCompletos()) {
        // Grupos reabertos (jogo apagado/editado): descarta 32avos ainda não disputados.
        const restantes = Jogos.all().filter(j => !(j.fase === 'r32' && j.status === 'agendado'));
        if (restantes.length !== Jogos.all().length) gravar('fs_jogos', restantes);
      }
      const r32 = r32Slots.map(slot => {
        if (!slot.projetado && slot.mandanteId && slot.visitanteId) {
          const id = `j_r32_${slot.matchNum}`;
          ensureJogo(id, 'r32', slot.matchNum, slot.mandanteId, slot.visitanteId, slot.projetado);
          return { matchNum: slot.matchNum, jogoId: id, labelMandante: slot.labelMandante, labelVisitante: slot.labelVisitante, projetado: slot.projetado };
        }
        return { matchNum: slot.matchNum, jogoId: null, labelMandante: slot.labelMandante, labelVisitante: slot.labelVisitante, projetado: true };
      });
      const r16 = propagar(r32, 'r16');
      const qf = propagar(r16, 'qf');
      const sf = propagar(qf, 'sf');
      const { final, terceiro } = propagarFinais(sf);
      return { r32, r16, qf, sf, final, terceiro };
    },
  };

  // ==========================================================================
  // Estatísticas — calculadas a partir dos lances cadastrados em cada jogo:
  //   jogo.gols    = [{ id, timeId, jogadorId, assistenciaId, minuto, tipo: normal|penalti|contra }]
  //   jogo.cartoes = [{ id, timeId, jogadorId, minuto, tipo: amarelo|segundo_amarelo|vermelho }]
  // Em gol contra, timeId é a seleção beneficiada e jogadorId é o autor (do adversário).
  // ==========================================================================

  function minutoNumero(minuto) {
    if (!minuto) return 999; // lance sem minuto vai para o fim
    const [base = 0, acrescimo = 0] = String(minuto || '0').split('+').map(n => parseInt(n, 10) || 0);
    return base + acrescimo / 100;
  }

  function linhaJogadorVazia(jogador) {
    return {
      jogador, gols: 0, penaltis: 0, golsContra: 0, assistencias: 0,
      amarelos: 0, vermelhos: 0, jogosComGol: 0, participacoes: 0,
      jogos: 0, titular: 0, minutos: 0,
    };
  }

  // ---------- Escalações e minutos ----------
  //   jogo.escalacoes = { [timeId]: { titulares: [jogadorId…], substituicoes: [{ saiId, entraId, minuto }] } }
  //   jogo.prorrogacao = true quando o jogo foi a 120 minutos.
  // Titular joga do 0' até sair (substituição ou expulsão); reserva entra no minuto da troca.
  function duracaoJogo(jogo) {
    return jogo.prorrogacao ? 120 : 90;
  }

  function minutoInteiro(minuto, duracao) {
    const base = parseInt(String(minuto || '').split('+')[0], 10);
    return Number.isFinite(base) ? Math.max(0, Math.min(base, duracao)) : duracao;
  }

  function minutosNoJogo(jogo) {
    const resultado = {};
    const duracao = duracaoJogo(jogo);
    const expulsoEm = {};
    (jogo.cartoes || []).forEach(c => {
      if (c.tipo !== 'amarelo') expulsoEm[c.jogadorId] = minutoInteiro(c.minuto, duracao);
    });
    Object.entries(jogo.escalacoes || {}).forEach(([timeId, esc]) => {
      const entrada = {};
      (esc.titulares || []).forEach(id => { entrada[id] = 0; });
      const subs = [...(esc.substituicoes || [])].sort((a, b) => minutoNumero(a.minuto) - minutoNumero(b.minuto));
      const saida = {};
      subs.forEach(sub => {
        const m = minutoInteiro(sub.minuto, duracao);
        if (sub.saiId && entrada[sub.saiId] != null && saida[sub.saiId] == null) saida[sub.saiId] = m;
        if (sub.entraId && entrada[sub.entraId] == null) entrada[sub.entraId] = m;
      });
      Object.entries(entrada).forEach(([id, inicio]) => {
        const fim = Math.min(saida[id] ?? duracao, expulsoEm[id] ?? duracao);
        resultado[id] = {
          timeId, titular: inicio === 0 && (esc.titulares || []).includes(id),
          entrou: inicio, saiu: saida[id] ?? null, minutos: Math.max(0, fim - inicio),
        };
      });
    });
    return resultado;
  }

  function temEscalacao(jogo, timeId) {
    return !!(jogo.escalacoes && jogo.escalacoes[timeId] && (jogo.escalacoes[timeId].titulares || []).length);
  }

  // Rodadas para a "seleção da rodada", conforme o formato do campeonato.
  function rodadasDoCampeonato() {
    const comp = Contexto.get();
    const fases = (comp.fases || []).map(f => ({ id: f, label: (FASES_LABELS[f] || f).replace(' de final', ''), filtro: j => j.fase === f }));
    if (comp.tipo === 'liga') {
      const n = idsTimesDe(comp.id).length;
      const total = (n - (n % 2 ? 0 : 1)) * 2;
      return Array.from({ length: total }, (_, i) => ({ id: `r${i + 1}`, label: `${i + 1}ª rodada`, filtro: j => j.fase === 'liga' && j.rodada === i + 1 }));
    }
    if (comp.tipo === 'champions') {
      return [...Array.from({ length: comp.rodadasLiga || 8 }, (_, i) => ({ id: `r${i + 1}`, label: `${i + 1}ª rodada`, filtro: j => j.fase === 'liga' && j.rodada === i + 1 })), ...fases];
    }
    if (comp.tipo === 'grupos_mata') {
      return [...Array.from({ length: 6 }, (_, i) => ({ id: `g${i + 1}`, label: `${i + 1}ª rodada`, filtro: j => j.fase === 'grupos' && j.rodada === i + 1 })), ...fases];
    }
    if (comp.tipo === 'mata_mata') return fases;
    return RODADAS;
  }

  const RODADAS = [
    { id: 'g1', label: '1ª rodada', filtro: j => j.fase === 'grupos' && j.rodada === 1 },
    { id: 'g2', label: '2ª rodada', filtro: j => j.fase === 'grupos' && j.rodada === 2 },
    { id: 'g3', label: '3ª rodada', filtro: j => j.fase === 'grupos' && j.rodada === 3 },
    { id: 'r32', label: '32avos', filtro: j => j.fase === 'r32' },
    { id: 'r16', label: 'Oitavas', filtro: j => j.fase === 'r16' },
    { id: 'qf', label: 'Quartas', filtro: j => j.fase === 'qf' },
    { id: 'sf', label: 'Semifinais', filtro: j => j.fase === 'sf' },
    { id: 'finais', label: 'Finais', filtro: j => j.fase === 'final' || j.fase === 'terceiro' },
  ];

  // Prêmio de melhor jovem da FIFA: nascidos a partir de 1º de janeiro de 2005.
  const NASCIMENTO_JOVEM = '2005-01-01';

  // Nota do jogador na partida (3,0 a 10,0), calculada a partir do que foi lançado:
  // base 6,0 · resultado (±0,4) · gol (+1,0 ATA / +1,2 MEI / +1,5 DEF-GOL; pênalti vale 75%) · assistência +0,8 ·
  // gol contra −1,0 · cartões (−0,3 / −1,2 / −1,5) · defesa: sem sofrer gol (+1,0 GOL / +0,6 DEF / +0,2 MEI)
  // ou gols sofridos (−0,3 GOL / −0,2 DEF por gol). Resultado e defesa pesam pelos minutos jogados.
  // Uma nota digitada no painel (jogo.notas) substitui a calculada.
  function notasDoJogo(jogo) {
    if (!jogo || !['encerrado', 'ao_vivo'].includes(jogo.status) || jogo.golsMandante == null || jogo.golsVisitante == null) return {};
    const mins = minutosNoJogo(jogo);
    const duracao = duracaoJogo(jogo);
    const timeDe = {};
    Object.entries(mins).forEach(([id, p]) => { timeDe[id] = p.timeId; });
    // Sem escalação: entra quem tem lance (gol, assistência ou cartão), como se tivesse jogado tudo.
    const lancados = [...(jogo.gols || []).flatMap(g => [[g.jogadorId, g.timeId], [g.assistenciaId, g.timeId]]), ...(jogo.cartoes || []).map(c => [c.jogadorId, c.timeId])];
    lancados.forEach(([id]) => {
      if (!id || timeDe[id]) return;
      const j = Jogadores.get(id);
      if (j) timeDe[id] = j.timeId;
    });
    const sofridos = { [jogo.mandanteId]: jogo.golsVisitante, [jogo.visitanteId]: jogo.golsMandante };
    const feitos = { [jogo.mandanteId]: jogo.golsMandante, [jogo.visitanteId]: jogo.golsVisitante };
    const notas = {};
    Object.entries(timeDe).forEach(([id, timeId]) => {
      const jogador = Jogadores.get(id);
      if (!jogador || ![jogo.mandanteId, jogo.visitanteId].includes(timeId)) return;
      const posicao = (((jogo.escalacoes || {})[timeId] || {}).posicoes || {})[id] || jogador.posicao;
      const minutos = mins[id] ? mins[id].minutos : duracao;
      if (mins[id] && minutos <= 0) return;
      const peso = Math.min(1, minutos / duracao);
      let n = 6;
      const saldo = feitos[timeId] - sofridos[timeId];
      n += (saldo > 0 ? 0.4 : saldo < 0 ? -0.4 : 0) * peso;
      const sofreu = sofridos[timeId];
      if (posicao === 'Goleiro') n += (sofreu === 0 ? 1 : -0.3 * Math.min(sofreu, 5)) * peso;
      else if (posicao === 'Defensor') n += (sofreu === 0 ? 0.6 : -0.2 * Math.min(sofreu, 5)) * peso;
      else if (posicao === 'Meio-campo' && sofreu === 0) n += 0.2 * peso;
      const valorGol = { Atacante: 1, 'Meio-campo': 1.2, 'Meia ofensivo': 1.1, Defensor: 1.5, Goleiro: 1.5 }[posicao] || 1;
      (jogo.gols || []).forEach(g => {
        if (g.jogadorId === id) n += g.tipo === 'contra' ? -1 : g.tipo === 'penalti' ? valorGol * 0.75 : valorGol;
        if (g.assistenciaId === id && g.tipo !== 'contra') n += 0.8;
      });
      (jogo.cartoes || []).forEach(c => {
        if (c.jogadorId === id) n += c.tipo === 'amarelo' ? -0.3 : c.tipo === 'segundo_amarelo' ? -1.2 : -1.5;
      });
      notas[id] = Math.round(Math.max(3, Math.min(10, n)) * 10) / 10;
    });
    Object.entries(jogo.notas || {}).forEach(([id, valor]) => {
      const v = Number(valor);
      if (Number.isFinite(v) && v > 0) notas[id] = Math.round(Math.max(1, Math.min(10, v)) * 10) / 10;
    });
    return notas;
  }

  const Estatisticas = {
    notasDoJogo,

    // Média de notas de cada jogador nos jogos encerrados do campeonato.
    notasTemporada() {
      const soma = {};
      Jogos.all().filter(j => j.status === 'encerrado').forEach(jogo => {
        Object.entries(notasDoJogo(jogo)).forEach(([id, n]) => {
          const s = soma[id] || (soma[id] = { total: 0, jogos: 0 });
          s.total += n;
          s.jogos++;
        });
      });
      return Object.fromEntries(Object.entries(soma).map(([id, s]) => [id, { media: Math.round((s.total / s.jogos) * 100) / 100, jogos: s.jogos }]));
    },

    // Posição do time na tabela ao fim de cada rodada (ligas e fase de liga da Champions).
    evolucaoPosicao(timeId) {
      const jogos = Jogos.all().filter(j => j.fase === 'liga' && j.status === 'encerrado' && j.rodada);
      const rodadas = [...new Set(jogos.map(j => j.rodada))].sort((a, b) => a - b);
      return rodadas.map(r => {
        const tabela = Classificacao.liga(jogos.filter(j => j.rodada <= r));
        const linha = tabela.find(t => t.timeId === timeId);
        return linha ? { rodada: r, posicao: linha.posicao, pontos: linha.P, jogos: linha.J } : null;
      }).filter(Boolean);
    },

    // Histórico entre dois times em todos os campeonatos cadastrados.
    confrontoDireto(aId, bId) {
      const jogos = Jogos.todos()
        .filter(j => j.status === 'encerrado' && j.golsMandante != null && j.golsVisitante != null
          && ((j.mandanteId === aId && j.visitanteId === bId) || (j.mandanteId === bId && j.visitanteId === aId)))
        .sort((x, y) => new Date(y.data) - new Date(x.data));
      const r = { jogos, vitoriasA: 0, vitoriasB: 0, empates: 0, golsA: 0, golsB: 0 };
      jogos.forEach(j => {
        const ga = j.mandanteId === aId ? j.golsMandante : j.golsVisitante;
        const gb = j.mandanteId === aId ? j.golsVisitante : j.golsMandante;
        r.golsA += ga; r.golsB += gb;
        if (ga > gb) r.vitoriasA++; else if (gb > ga) r.vitoriasB++; else r.empates++;
      });
      return r;
    },

    porJogador() {
      const jogadores = Object.fromEntries(Jogadores.all().map(j => [j.id, j]));
      const linhas = {};
      const linha = id => {
        if (!jogadores[id]) return null;
        return linhas[id] || (linhas[id] = linhaJogadorVazia(jogadores[id]));
      };
      Jogos.comPlacar().forEach(jogo => {
        Object.entries(minutosNoJogo(jogo)).forEach(([id, p]) => {
          const l = linha(id);
          if (!l) return;
          l.jogos++;
          if (p.titular) l.titular++;
          l.minutos += p.minutos;
        });
        const marcaramNoJogo = new Set();
        (jogo.gols || []).forEach(g => {
          const autor = linha(g.jogadorId);
          if (autor) {
            if (g.tipo === 'contra') autor.golsContra++;
            else {
              autor.gols++;
              if (g.tipo === 'penalti') autor.penaltis++;
              marcaramNoJogo.add(g.jogadorId);
            }
          }
          const assistente = g.assistenciaId && g.tipo !== 'contra' ? linha(g.assistenciaId) : null;
          if (assistente) assistente.assistencias++;
        });
        marcaramNoJogo.forEach(id => { linhas[id].jogosComGol++; });
        (jogo.cartoes || []).forEach(c => {
          const l = linha(c.jogadorId);
          if (!l) return;
          if (c.tipo === 'amarelo') l.amarelos++;
          else l.vermelhos++;
        });
      });
      return Object.values(linhas).map(l => ({
        ...l,
        participacoes: l.gols + l.assistencias,
        golsPor90: l.minutos ? (l.gols * 90) / l.minutos : null,
      }));
    },

    minutosNoJogo,
    temEscalacao,
    get rodadas() { return rodadasDoCampeonato(); },

    // Chuteira de Ouro (critério FIFA: gols → assistências → menos minutos),
    // Luva de Ouro (jogos sem sofrer gol como goleiro titular que jogou até o fim)
    // e Melhor Jovem (nascidos em 2005 ou depois, por gols + assistências).
    premios() {
      const linhas = this.porJogador();
      const chuteira = linhas.filter(l => l.gols > 0).sort((a, b) =>
        b.gols - a.gols || b.assistencias - a.assistencias || (a.minutos || 9999) - (b.minutos || 9999)
        || a.jogador.nome.localeCompare(b.jogador.nome)).slice(0, 10);

      const luvas = {};
      Jogos.all().filter(j => j.status === 'encerrado').forEach(jogo => {
        const mins = minutosNoJogo(jogo);
        [[jogo.mandanteId, jogo.golsVisitante], [jogo.visitanteId, jogo.golsMandante]].forEach(([timeId, sofridos]) => {
          if (sofridos !== 0) return;
          Object.entries(mins).forEach(([id, p]) => {
            const jogador = Jogadores.get(id);
            if (!jogador || jogador.posicao !== 'Goleiro' || p.timeId !== timeId) return;
            if (!p.titular || p.saiu != null || p.minutos < duracaoJogo(jogo)) return;
            luvas[id] = luvas[id] || { jogador, semSofrer: 0, jogos: 0 };
            luvas[id].semSofrer++;
          });
        });
      });
      linhas.forEach(l => { if (luvas[l.jogador.id]) luvas[l.jogador.id].jogos = l.jogos; });
      const luva = Object.values(luvas).sort((a, b) => b.semSofrer - a.semSofrer || a.jogos - b.jogos
        || a.jogador.nome.localeCompare(b.jogador.nome)).slice(0, 10);

      const jovem = linhas.filter(l => l.jogador.nascimento && l.jogador.nascimento >= NASCIMENTO_JOVEM && (l.participacoes || l.minutos))
        .sort((a, b) => b.participacoes - a.participacoes || b.gols - a.gols || b.minutos - a.minutos
          || a.jogador.nome.localeCompare(b.jogador.nome)).slice(0, 10);

      return { chuteira, luva, jovem };
    },

    // Seleção da rodada no 4-3-3: os de maior nota em cada posição (nota média, se jogou mais de uma vez).
    selecaoDaRodada(rodadaId) {
      const rodada = rodadasDoCampeonato().find(r => r.id === rodadaId);
      if (!rodada) return null;
      const jogos = Jogos.all().filter(j => j.status === 'encerrado' && rodada.filtro(j));
      const dados = {};
      jogos.forEach(jogo => {
        Object.entries(notasDoJogo(jogo)).forEach(([id, nota]) => {
          const jogador = Jogadores.get(id);
          if (!jogador) return;
          // Posição em que jogou (definida no jogo); meia ofensivo conta como meio-campo no 4-3-3.
          const noJogo = (((jogo.escalacoes || {})[jogador.timeId] || {}).posicoes || {})[id] || jogador.posicao;
          const d = dados[id] || (dados[id] = { jogador, posicao: noJogo === 'Meia ofensivo' ? 'Meio-campo' : noJogo, soma: 0, jogos: 0, gols: 0, assistencias: 0, jogoId: jogo.id });
          d.soma += nota;
          d.jogos++;
        });
        (jogo.gols || []).forEach(g => {
          if (g.tipo === 'contra') return;
          if (dados[g.jogadorId]) dados[g.jogadorId].gols++;
          if (g.assistenciaId && dados[g.assistenciaId]) dados[g.assistenciaId].assistencias++;
        });
      });
      const lista = Object.values(dados).map(d => ({ ...d, nota: Math.round((d.soma / d.jogos) * 10) / 10, pontos: Math.round((d.soma / d.jogos) * 10) / 10 }));
      const ordenados = lista.sort((a, b) => b.nota - a.nota || b.gols - a.gols || a.jogador.nome.localeCompare(b.jogador.nome));
      const escolher = (posicao, n) => {
        const escolhidos = ordenados.filter(p => p.posicao === posicao).slice(0, n);
        while (escolhidos.length < n) escolhidos.push(null);
        return escolhidos;
      };
      return {
        rodada, jogos: jogos.length,
        linhas: [escolher('Atacante', 3), escolher('Meio-campo', 3), escolher('Defensor', 4), escolher('Goleiro', 1)],
      };
    },

    ranking(criterio, limite) {
      const desempate = {
        gols: (a, b) => b.gols - a.gols || b.assistencias - a.assistencias || a.penaltis - b.penaltis,
        assistencias: (a, b) => b.assistencias - a.assistencias || b.gols - a.gols,
        participacoes: (a, b) => b.participacoes - a.participacoes || b.gols - a.gols,
        cartoes: (a, b) => (b.vermelhos * 3 + b.amarelos) - (a.vermelhos * 3 + a.amarelos) || b.vermelhos - a.vermelhos,
      }[criterio];
      const valor = l => criterio === 'cartoes' ? l.amarelos + l.vermelhos : l[criterio];
      const lista = this.porJogador()
        .filter(l => valor(l) > 0)
        .sort((a, b) => desempate(a, b) || a.jogador.nome.localeCompare(b.jogador.nome));
      return limite ? lista.slice(0, limite) : lista;
    },

    doJogador(jogadorId) {
      const jogador = Jogadores.get(jogadorId);
      const linha = this.porJogador().find(l => l.jogador.id === jogadorId) || linhaJogadorVazia(jogador);
      const lances = [];
      Jogos.comPlacar().forEach(jogo => {
        (jogo.gols || []).forEach(g => {
          if (g.jogadorId === jogadorId) lances.push({ jogo, tipo: g.tipo === 'contra' ? 'gol_contra' : 'gol', detalhe: g });
          else if (g.assistenciaId === jogadorId && g.tipo !== 'contra') lances.push({ jogo, tipo: 'assistencia', detalhe: g });
        });
        (jogo.cartoes || []).forEach(c => {
          if (c.jogadorId === jogadorId) lances.push({ jogo, tipo: c.tipo, detalhe: c });
        });
      });
      lances.sort((a, b) => new Date(a.jogo.data) - new Date(b.jogo.data) || minutoNumero(a.detalhe.minuto) - minutoNumero(b.detalhe.minuto));
      return { ...linha, lances };
    },

    // Perfil para o radar: cada quesito de 0 a 1 em relação ao melhor da mesma posição
    // (entre quem jogou ou teve lance no campeonato; todos, se a posição tiver menos de 5).
    // Disciplina = 1 − (amarelos + 3 × vermelhos) / o pior da posição.
    perfil(jogadorId, linhas = this.porJogador(), notas = this.notasTemporada()) {
      const linha = linhas.find(l => l.jogador.id === jogadorId);
      if (!linha) return null;
      const grupo = p => (p === 'Meia ofensivo' ? 'Meio-campo' : p);
      let pares = linhas.filter(l => grupo(l.jogador.posicao) === grupo(linha.jogador.posicao));
      if (pares.length < 5) pares = linhas;
      const nota = l => (notas[l.jogador.id] ? notas[l.jogador.id].media : null);
      const cartoes = l => l.amarelos + 3 * l.vermelhos;
      const QUESITOS = [
        { rotulo: 'Gols', valor: l => l.gols },
        { rotulo: 'Assistências', valor: l => l.assistencias },
        { rotulo: 'Jogos com gol', valor: l => l.jogosComGol },
        { rotulo: 'Minutos', valor: l => l.minutos },
        { rotulo: 'Nota média', valor: nota, escala: v => (v - 4) / 6, texto: v => (v == null ? '—' : v.toFixed(2).replace('.', ',')) },
        { rotulo: 'Disciplina', valor: cartoes, inverso: true, texto: v => `${v} pt${v === 1 ? '' : 's'} em cartões` },
      ];
      return {
        posicao: grupo(linha.jogador.posicao), pares: pares.length,
        eixos: QUESITOS.map(q => q.rotulo),
        valores: QUESITOS.map(q => {
          const v = q.valor(linha);
          const max = Math.max(0, ...pares.map(q.valor).filter(x => x != null));
          if (q.inverso) return max ? 1 - v / max : 1;
          if (v == null || !max) return 0;
          return q.escala ? Math.max(0, Math.min(1, q.escala(v) / q.escala(max))) : v / max;
        }),
        textos: QUESITOS.map(q => (q.texto ? q.texto(q.valor(linha)) : String(q.valor(linha)))),
      };
    },

    porTime() {
      const linhas = Object.fromEntries(Times.all().map(t => [t.id, {
        time: t, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, semSofrer: 0, CA: 0, CV: 0,
      }]));
      Jogos.comPlacar().forEach(j => {
        const m = linhas[j.mandanteId], v = linhas[j.visitanteId];
        if (!m || !v || j.golsMandante == null || j.golsVisitante == null) return;
        [[m, j.golsMandante, j.golsVisitante], [v, j.golsVisitante, j.golsMandante]].forEach(([l, pro, contra]) => {
          l.J++; l.GP += pro; l.GC += contra;
          if (contra === 0) l.semSofrer++;
          if (pro > contra) l.V++; else if (pro < contra) l.D++; else l.E++;
        });
        (j.cartoes || []).forEach(c => {
          const l = linhas[c.timeId];
          if (!l) return;
          if (c.tipo === 'amarelo') l.CA++; else l.CV++;
        });
      });
      return Object.values(linhas).map(l => ({ ...l, SG: l.GP - l.GC, media: l.J ? l.GP / l.J : 0 }));
    },

    resumo() {
      const jogos = Jogos.comPlacar().filter(j => j.golsMandante != null && j.golsVisitante != null);
      const gols = jogos.reduce((soma, j) => soma + j.golsMandante + j.golsVisitante, 0);
      const cartoes = jogos.flatMap(j => j.cartoes || []);
      const lances = jogos.flatMap(j => j.gols || []);
      const maiorGoleada = [...jogos].sort((a, b) =>
        Math.abs(b.golsMandante - b.golsVisitante) - Math.abs(a.golsMandante - a.golsVisitante)
        || (b.golsMandante + b.golsVisitante) - (a.golsMandante + a.golsVisitante))[0] || null;
      return {
        jogos: jogos.length,
        totalJogos: Jogos.all().length,
        gols,
        media: jogos.length ? gols / jogos.length : 0,
        amarelos: cartoes.filter(c => c.tipo === 'amarelo').length,
        vermelhos: cartoes.filter(c => c.tipo !== 'amarelo').length,
        penaltis: lances.filter(g => g.tipo === 'penalti').length,
        golsContra: lances.filter(g => g.tipo === 'contra').length,
        maiorGoleada,
      };
    },
  };

  // ==========================================================================
  // Dados — backup em arquivo e publicação opcional via js/dados.js.
  // Se js/dados.js tiver dados publicados mais novos do que os que este navegador
  // já carregou, eles substituem os locais (é assim que os visitantes os recebem).
  // ==========================================================================

  const Dados = {
    exportar() {
      return {
        formato: 'futstats',
        versao: SEED_VERSION,
        geradoEm: new Date().toISOString(),
        times: Times.todos(),
        jogadores: Jogadores.todos(),
        jogos: Jogos.todos(),
      };
    },
    validar(dados) {
      if (!dados || dados.formato !== 'futstats') return 'Arquivo não é um backup do FUTSTATS.';
      if (!Array.isArray(dados.times) || !Array.isArray(dados.jogadores) || !Array.isArray(dados.jogos)) return 'Backup incompleto.';
      return null;
    },
    importar(dados) {
      const erro = this.validar(dados);
      if (erro) throw new Error(erro);
      gravar('fs_times', dados.times);
      gravar('fs_jogadores', dados.jogadores);
      gravar('fs_jogos', dados.jogos.map(j => (j.competicaoId ? j : { ...j, competicaoId: PADRAO })));
      garantirClubes();
      if (dados.geradoEm) localStorage.setItem('fs_dados_publicados', dados.geradoEm);
    },
    // Conteúdo do arquivo js/dados.js para publicar no repositório.
    arquivoPublicacao() {
      const dados = this.exportar();
      // Quem gera o arquivo já está com esses dados: não deve recarregá-los depois.
      localStorage.setItem('fs_dados_publicados', dados.geradoEm);
      return `// Dados publicados pelo painel do FUTSTATS em ${dados.geradoEm}.\n`
        + `// Substitua este arquivo para atualizar o que os visitantes veem.\n`
        + `window.DADOS_PUBLICADOS = ${JSON.stringify(dados)};\n`;
    },
  };

  function carregarDadosPublicados() {
    const publicados = typeof window !== 'undefined' ? window.DADOS_PUBLICADOS : null;
    if (!publicados || Dados.validar(publicados)) return;
    const jaCarregado = localStorage.getItem('fs_dados_publicados');
    if (jaCarregado && jaCarregado >= publicados.geradoEm) return;
    Dados.importar(publicados);
  }

  carregarDadosPublicados();

  const Torneio = {
    get nome() { return Contexto.get().nome; },
    get sede() { return Contexto.get().sede || ''; },
    get periodo() { return Contexto.get().periodo || ''; },
    // Texto da fase em andamento: "12ª rodada", "Oitavas de final"…
    descricaoFase() {
      const comp = Contexto.get();
      if (comp.tipo === 'copa_mundo') {
        const f = this.faseAtual();
        return f === 'encerrado' ? 'Torneio encerrado' : FASES_LABELS[f];
      }
      const jogos = Jogos.all();
      if (!jogos.length) return 'Aguardando jogos';
      const pendentes = jogos.filter(j => j.status !== 'encerrado').sort((a, b) => new Date(a.data) - new Date(b.data));
      if (!pendentes.length) return 'Encerrado';
      const j = pendentes[0];
      if (j.fase === 'liga' && comp.tipo === 'liga') return `${j.rodada || '?'}ª rodada`;
      if (j.fase === 'liga' || j.fase === 'grupos') return `${FASES_LABELS[j.fase]} · ${j.rodada || '?'}ª rodada`;
      return FASES_LABELS[j.fase] || j.fase;
    },
    faseAtual() {
      const ordem = ['grupos', 'r32', 'r16', 'qf', 'sf', 'terceiro', 'final'];
      const jogos = Jogos.all();
      for (const f of ordem) {
        const doFase = jogos.filter(j => j.fase === f);
        if (doFase.length && doFase.some(j => j.status !== 'encerrado')) return f;
      }
      const grupos = jogos.filter(j => j.fase === 'grupos');
      if (grupos.length && !grupos.every(j => j.status === 'encerrado')) return 'grupos';
      return jogos.some(j => j.fase === 'final' && j.status === 'encerrado') ? 'encerrado' : 'grupos';
    },
  };

  // ==========================================================================
  // Acesso ao painel — MODO DEMONSTRAÇÃO. O site é estático (sem servidor): tudo o que o
  // painel edita fica no localStorage do próprio navegador, então este login não protege
  // dados de ninguém. Ele só evita edições por engano. Mesmo assim, o código guarda apenas
  // o hash SHA-256 (com sal) de "usuário:senha", não a senha em texto, e espera alguns
  // segundos a cada 5 tentativas erradas. Proteção de verdade exigiria um back-end.
  // ==========================================================================
  function sha256(texto) {
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
      0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
      0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
      0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const bytes = Array.from(new TextEncoder().encode(texto));
    const bits = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push(i > 3 ? 0 : (bits >>> (i * 8)) & 0xff);
    const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let bloco = 0; bloco < bytes.length; bloco += 64) {
      const w = new Array(64);
      for (let i = 0; i < 16; i++) w[i] = (bytes[bloco + i * 4] << 24) | (bytes[bloco + i * 4 + 1] << 16) | (bytes[bloco + i * 4 + 2] << 8) | bytes[bloco + i * 4 + 3];
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, k] = h;
      for (let i = 0; i < 64; i++) {
        const t1 = (k + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        k = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      [a, b, c, d, e, f, g, k].forEach((v, i) => { h[i] = (h[i] + v) | 0; });
    }
    return h.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
  }

  const SAL_ACESSO = 'futstats:v1:';
  const HASH_ACESSO = '0ff4db5d253766d50c41e0c3cf787ae738d6f9701a90fcabdd249c6603745f6c'; // admin / futstats2026 (demo)
  const SESSAO_MS = 12 * 36e5;
  const ESPERA_MS = 30e3;

  function lerJson(chave) {
    try { return JSON.parse(localStorage.getItem(chave)); } catch (e) { return null; }
  }

  const Auth = {
    // Segundos até poder tentar de novo (depois de 5 erros seguidos).
    esperaRestante() {
      const t = lerJson('fs_auth_tentativas') || { erros: 0, ate: 0 };
      return Math.max(0, Math.ceil((t.ate - Date.now()) / 1000));
    },
    login(usuario, senha) {
      if (this.esperaRestante()) return false;
      if (sha256(`${SAL_ACESSO}${usuario}:${senha}`) === HASH_ACESSO) {
        localStorage.removeItem('fs_auth_tentativas');
        localStorage.setItem('fs_auth', JSON.stringify({ usuario, ts: Date.now() }));
        return true;
      }
      const t = lerJson('fs_auth_tentativas') || { erros: 0, ate: 0 };
      t.erros++;
      if (t.erros % 5 === 0) t.ate = Date.now() + ESPERA_MS;
      localStorage.setItem('fs_auth_tentativas', JSON.stringify(t));
      return false;
    },
    logout() { localStorage.removeItem('fs_auth'); },
    // A sessão vale 12 horas.
    isLogged() {
      const s = lerJson('fs_auth');
      if (!s || !s.ts || Date.now() - s.ts > SESSAO_MS) { if (s) this.logout(); return false; }
      return true;
    },
    usuarioAtual() {
      const s = lerJson('fs_auth');
      return s ? s.usuario : null;
    },
    sha256,
  };

  const CORES = ['#33e08a', '#ff8a3d', '#5b8cff', '#ff5470', '#c792ea', '#ffd166'];

  // Cores de cada seleção (camisa principal, detalhe) — usadas no topo da página
  // da seleção e nos avatares dos jogadores.
  const CORES_SELECAO = {
    MEX: ['#006847', '#ce1126'], RSA: ['#ffb612', '#007a4d'], KOR: ['#c60c30', '#003478'], CZE: ['#d7141a', '#11457e'],
    CAN: ['#d80621', '#ffffff'], SUI: ['#d52b1e', '#ffffff'], QAT: ['#8a1538', '#ffffff'], BIH: ['#002395', '#fecb00'],
    BRA: ['#ffdf00', '#009c3b'], MAR: ['#c1272d', '#006233'], HAI: ['#00209f', '#d21034'], SCO: ['#0065bd', '#ffffff'],
    USA: ['#0a3161', '#b31942'], PAR: ['#d52b1e', '#0038a8'], AUS: ['#ffcd00', '#00843d'], TUR: ['#e30a17', '#ffffff'],
    GER: ['#f2f2f2', '#dd0000'], CUW: ['#002b7f', '#f9e814'], CIV: ['#f77f00', '#009e60'], ECU: ['#ffdd00', '#034ea2'],
    NED: ['#f36c21', '#21468b'], JPN: ['#1d3a8a', '#bc002d'], TUN: ['#e70013', '#ffffff'], SWE: ['#fecc02', '#006aa7'],
    BEL: ['#c8102e', '#fae042'], EGY: ['#ce1126', '#c09300'], IRN: ['#ffffff', '#239f40'], NZL: ['#f2f2f2', '#111111'],
    ESP: ['#c60b1e', '#ffc400'], CPV: ['#003893', '#cf2027'], KSA: ['#006c35', '#ffffff'], URU: ['#5cbfeb', '#0b1f45'],
    FRA: ['#002654', '#ed2939'], IRQ: ['#007a3d', '#ce1126'], NOR: ['#ba0c2f', '#00205b'], SEN: ['#00853f', '#fdef42'],
    ARG: ['#74acdf', '#ffffff'], ALG: ['#006233', '#d21034'], AUT: ['#ed2939', '#ffffff'], JOR: ['#ce1126', '#007a3d'],
    POR: ['#da291c', '#046a38'], UZB: ['#0099b5', '#1eb53a'], COL: ['#fcd116', '#003893'], COD: ['#007fff', '#f7d618'],
    ENG: ['#f2f2f2', '#cf081f'], CRO: ['#ff0000', '#171796'], GHA: ['#f2f2f2', '#006b3f'], PAN: ['#da121a', '#005293'],
  };

  function luminancia(hex) {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const Util = {
    coresTime(time) {
      const [primaria, secundaria] = (time && time.cores) || (time && CORES_SELECAO[time.codigo]) || ['#5d667b', '#8f98ad'];
      return { primaria, secundaria, texto: luminancia(primaria) > 0.35 ? '#0b0f1a' : '#ffffff' };
    },
    minutoNumero,
    escapar(texto) {
      return String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    bandeiraFifa(codigo, largura = 40) {
      const iso = ISO_POR_FIFA[codigo];
      return iso ? `https://flagcdn.com/w${largura}/${iso}.png` : null;
    },
    formatarDiaLongo(iso) {
      return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    },
    formatarHora(iso) {
      return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    },
    formatarData(iso) {
      return new Date(iso).toLocaleDateString('pt-BR');
    },
    formatarDataHora(iso) {
      return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    },
    statusLabel(status) {
      return { agendado: 'Agendado', ao_vivo: 'Ao vivo', encerrado: 'Encerrado', adiado: 'Adiado' }[status] || status;
    },
    faseLabel(fase) {
      return FASES_LABELS[fase] || fase;
    },
    iniciais(nome) {
      return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
    },
    bandeiraUrl(iso, largura = 80) {
      return iso ? `https://flagcdn.com/w${largura}/${iso}.png` : null;
    },
    corPara(id) {
      let hash = 0;
      for (const ch of String(id)) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
      return CORES[Math.abs(hash) % CORES.length];
    },
  };

  return { Contexto, Times, Jogadores, Jogos, Grupos, Classificacao, MataMata, Estatisticas, Dados, Torneio, Auth, Util };
})();
