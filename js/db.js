const DB = (() => {
  const SEED_VERSION = 'wc2026-1';

  function ler(chave) {
    const raw = localStorage.getItem(chave);
    return raw ? JSON.parse(raw) : null;
  }

  function gravar(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
  }

  function uid(prefixo) {
    return `${prefixo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  function makeStore(chave, prefixo) {
    return {
      all() { return ler(chave) || []; },
      get(id) { return this.all().find(item => item.id === id) || null; },
      create(dados) {
        const itens = this.all();
        const item = { id: uid(prefixo), ...dados };
        itens.push(item);
        gravar(chave, itens);
        return item;
      },
      update(id, patch) {
        const itens = this.all();
        const indice = itens.findIndex(item => item.id === id);
        if (indice === -1) return null;
        itens[indice] = { ...itens[indice], ...patch };
        gravar(chave, itens);
        return itens[indice];
      },
      remove(id) {
        gravar(chave, this.all().filter(item => item.id !== id));
      },
    };
  }

  function hashStr(str) {
    let h = 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
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

  const TIMES_SEED = [];
  LETRAS_GRUPOS.forEach((letra, gi) => {
    GRUPOS_SEED[letra].forEach((nome, pos) => {
      TIMES_SEED.push({
        id: `t${gi * 4 + pos + 1}`,
        nome,
        grupo: letra,
        posicaoPote: pos + 1,
        confederacao: CONFEDERACOES[nome] || '—',
        rankingFifa: RANKING_ORDER.indexOf(nome) + 1,
        iso: ISO_PAIS[nome] || null,
      });
    });
  });

  const PRIMEIRO_NOMES = ['Lucas', 'Gabriel', 'Matheus', 'Rafael', 'Bruno', 'Diego', 'Thiago', 'André', 'Felipe', 'Rodrigo', 'Vinícius', 'Gustavo', 'Eduardo', 'Marcelo', 'Fábio', 'Renato', 'Carlos', 'Paulo', 'João', 'Pedro'];
  const SOBRENOMES = ['Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Costa', 'Almeida', 'Ferreira', 'Rodrigues', 'Gomes', 'Martins', 'Araújo', 'Barbosa', 'Ribeiro', 'Carvalho'];
  const POSICOES = ['Goleiro', 'Zagueiro', 'Lateral', 'Meio-campo', 'Atacante'];

  function gerarJogadoresPara(timeId, seedIndex, qtd = 5) {
    const jogadores = [];
    for (let i = 0; i < qtd; i++) {
      const nomeIdx = (seedIndex * 7 + i * 3) % PRIMEIRO_NOMES.length;
      const sobrenomeIdx = (seedIndex * 5 + i * 11) % SOBRENOMES.length;
      const posicao = POSICOES[i % POSICOES.length];
      const idade = 18 + ((seedIndex * 3 + i * 7) % 20);
      const rolo = (seedIndex + i) % 9;
      const status = rolo === 0 ? 'lesionado' : rolo === 5 ? 'suspenso' : 'ativo';
      jogadores.push({
        id: `p_${timeId}_${i + 1}`,
        nome: `${PRIMEIRO_NOMES[nomeIdx]} ${SOBRENOMES[sobrenomeIdx]}`,
        timeId,
        posicao,
        idade,
        status,
      });
    }
    return jogadores;
  }

  const JOGADORES_SEED = TIMES_SEED.flatMap((time, idx) => gerarJogadoresPara(time.id, idx + 1));

  // ---------- Sedes (16 cidades-sede reais: EUA, México e Canadá) ----------
  const SEDES = [
    'Atlanta', 'Boston', 'Dallas', 'Houston', 'Kansas City', 'Los Angeles', 'Miami',
    'Nova York/Nova Jersey', 'Filadélfia', 'São Francisco', 'Seattle',
    'Guadalajara', 'Cidade do México', 'Monterrey', 'Vancouver', 'Toronto',
  ];

  const HORARIOS = ['13:00', '16:00', '19:00', '22:00'];

  const DATAS_MD1 = ['2026-06-11', '2026-06-12', '2026-06-13', '2026-06-14'];
  const DATAS_MD2 = ['2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'];
  const DATAS_MD3 = ['2026-06-24', '2026-06-25', '2026-06-26', '2026-06-27'];

  const FASES_LABELS = {
    grupos: 'Fase de grupos',
    r32: '32avos de final',
    r16: 'Oitavas de final',
    qf: 'Quartas de final',
    sf: 'Semifinal',
    terceiro: 'Disputa de 3º lugar',
    final: 'Final',
  };

  let _venueIdx = 0;
  function proximaSede() {
    const sede = SEDES[_venueIdx % SEDES.length];
    _venueIdx++;
    return sede;
  }

  // Resultado simulado e determinístico (para popular o site com dados de
  // demonstração desde o início). Fica claro na UI que são dados ilustrativos.
  function golsSimulados(seed) {
    return hashStr(`${seed}:gols`) % 5;
  }
  function cartaoAmareloSimulado(seed) {
    return hashStr(`${seed}:ca`) % 3;
  }
  function cartaoVermelhoSimulado(seed) {
    return hashStr(`${seed}:cv`) % 6 === 0 ? 1 : 0;
  }

  function gerarJogosGrupo(letra, gi) {
    const ids = TIMES_SEED.filter(t => t.grupo === letra).sort((a, b) => a.posicaoPote - b.posicaoPote).map(t => t.id);
    const [a, b, c, d] = ids;
    const rodadas = [
      [[a, d], [b, c]],
      [[a, c], [d, b]],
      [[a, b], [c, d]],
    ];
    const jogos = [];
    rodadas.forEach((confrontos, rIdx) => {
      const dataBase = rIdx === 0 ? DATAS_MD1[gi % 4] : rIdx === 1 ? DATAS_MD2[gi % 4] : DATAS_MD3[gi % 4];
      confrontos.forEach(([mandanteId, visitanteId], cIdx) => {
        // Regra oficial: os 2 jogos da rodada decisiva de cada grupo (rodada 3)
        // acontecem sempre no mesmo horário.
        const horario = rIdx === 2
          ? HORARIOS[gi % 2 === 0 ? 1 : 2]
          : HORARIOS[(gi + rIdx + cIdx) % HORARIOS.length];
        const id = `j_grp_${letra}_${rIdx + 1}_${cIdx + 1}`;
        const gm = golsSimulados(`${id}:m`);
        const gv = golsSimulados(`${id}:v`);
        jogos.push({
          id,
          fase: 'grupos',
          grupo: letra,
          rodada: rIdx + 1,
          mandanteId, visitanteId,
          golsMandante: gm, golsVisitante: gv,
          data: `${dataBase}T${horario}`,
          local: proximaSede(),
          status: 'encerrado',
          penaltisMandante: null, penaltisVisitante: null,
          cartoesAmarelosMandante: cartaoAmareloSimulado(`${id}:m`),
          cartoesVermelhosMandante: cartaoVermelhoSimulado(`${id}:m`),
          cartoesAmarelosVisitante: cartaoAmareloSimulado(`${id}:v`),
          cartoesVermelhosVisitante: cartaoVermelhoSimulado(`${id}:v`),
        });
      });
    });
    return jogos;
  }

  const JOGOS_GRUPOS_SEED = LETRAS_GRUPOS.flatMap((letra, gi) => gerarJogosGrupo(letra, gi));

  const TORNEIO_SEED = {
    id: 'wc2026',
    nome: 'Copa do Mundo FIFA 2026',
    tipo: 'Copa do Mundo',
    sede: 'Estados Unidos, México e Canadá',
    temporada: '2026',
    periodo: '11 de junho – 19 de julho de 2026',
  };

  function inicializarSeed() {
    if (localStorage.getItem('fs_seed_version') === SEED_VERSION) return;
    gravar('fs_times', TIMES_SEED);
    gravar('fs_jogadores', JOGADORES_SEED);
    gravar('fs_jogos', JOGOS_GRUPOS_SEED);
    gravar('fs_torneio', TORNEIO_SEED);
    localStorage.setItem('fs_seed_version', SEED_VERSION);
  }

  inicializarSeed();

  const Times = makeStore('fs_times', 't');
  const Jogadores = makeStore('fs_jogadores', 'p');

  const Jogos = {
    ...makeStore('fs_jogos', 'j'),
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
  };

  const Grupos = {
    letras: LETRAS_GRUPOS,
    times(letra) {
      return Times.all().filter(t => t.grupo === letra).sort((a, b) => a.posicaoPote - b.posicaoPote);
    },
    completo(letra) {
      const jogos = Jogos.porGrupo(letra);
      return jogos.length === 6 && jogos.every(j => j.status === 'encerrado');
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

  const Classificacao = {
    grupo(letra) {
      const times = Grupos.times(letra);
      const base = {};
      times.forEach(t => {
        base[t.id] = {
          timeId: t.id, nome: t.nome, grupo: letra, rankingFifa: t.rankingFifa,
          P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0, CA: 0, CV: 0, fairPlay: 0,
        };
      });
      const jogos = Jogos.porGrupo(letra).filter(j => j.status === 'encerrado');
      jogos.forEach(j => {
        const m = base[j.mandanteId], v = base[j.visitanteId];
        if (!m || !v) return;
        m.J++; v.J++;
        m.GP += j.golsMandante; m.GC += j.golsVisitante;
        v.GP += j.golsVisitante; v.GC += j.golsMandante;
        m.CA += j.cartoesAmarelosMandante || 0; m.CV += j.cartoesVermelhosMandante || 0;
        v.CA += j.cartoesAmarelosVisitante || 0; v.CV += j.cartoesVermelhosVisitante || 0;
        if (j.golsMandante > j.golsVisitante) { m.V++; m.P += 3; v.D++; }
        else if (j.golsMandante < j.golsVisitante) { v.V++; v.P += 3; m.D++; }
        else { m.E++; v.E++; m.P++; v.P++; }
      });
      const lista = Object.values(base);
      lista.forEach(t => { t.SG = t.GP - t.GC; t.fairPlay = -(t.CA * 1 + t.CV * 4); });
      return ordenarComDesempate(lista, jogos);
    },

    terceiros() {
      const linhas = LETRAS_GRUPOS.map(letra => {
        const tabela = Classificacao.grupo(letra);
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

  function sedeChave(fase, numero) {
    if (fase === 'final') return 'Nova York/Nova Jersey';
    if (fase === 'terceiro') return 'Miami';
    return SEDES[(numero * 3 + fase.length) % SEDES.length];
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

  function timePorPosicao(pos, letra) {
    const tabela = Classificacao.grupo(letra);
    return tabela[pos - 1] || null;
  }

  function ensureJogo(id, fase, numero, mandanteId, visitanteId, projetado) {
    const existente = Jogos.get(id);
    if (existente && existente.status === 'encerrado') return existente;
    const dados = {
      fase, numero, mandanteId, visitanteId,
      data: dataChave(fase, numero), local: sedeChave(fase, numero), projetado,
    };
    if (fase === 'r32') dados.matchNum = numero;
    if (existente) return Jogos.update(id, dados);
    const registro = {
      id, ...dados,
      golsMandante: null, golsVisitante: null, penaltisMandante: null, penaltisVisitante: null,
      status: 'agendado',
      cartoesAmarelosMandante: 0, cartoesVermelhosMandante: 0,
      cartoesAmarelosVisitante: 0, cartoesVermelhosVisitante: 0,
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

  function montarR32() {
    const completos = Grupos.todosCompletos();
    const terceiros = Classificacao.terceiros();
    const classificados3 = terceiros.filter(t => t.classificado).map(t => t.grupo);
    const atribuicao = classificados3.length === 8 ? resolverPoolsTerceiros(classificados3) : {};
    return POOLS_R32.map(slot => {
      const timeA = timePorPosicao(slot.a.pos, slot.a.grupo);
      let timeB = null;
      let labelVisitante;
      if (slot.tipo === 'cruzamento') {
        timeB = timePorPosicao(slot.b.pos, slot.b.grupo);
        labelVisitante = `${slot.b.pos}º Grupo ${slot.b.grupo}`;
      } else {
        const letraAtribuida = atribuicao[slot.matchNum];
        timeB = letraAtribuida ? timePorPosicao(3, letraAtribuida) : null;
        labelVisitante = letraAtribuida ? `3º Grupo ${letraAtribuida}` : `3º colocado (${slot.pool.join('/')})`;
      }
      return {
        matchNum: slot.matchNum,
        mandanteId: timeA ? timeA.timeId : null,
        visitanteId: timeB ? timeB.timeId : null,
        labelMandante: `${slot.a.pos}º Grupo ${slot.a.grupo}`,
        labelVisitante,
        projetado: !completos,
      };
    });
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
        labelMandante: vA ? nomeTime(vA) : `Vencedor — ${a.labelMandante || ''} / ${a.labelVisitante || ''}`,
        labelVisitante: vB ? nomeTime(vB) : `Vencedor — ${b.labelMandante || ''} / ${b.labelVisitante || ''}`,
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
    vencedor: vencedorId,
    perdedor: perdedorId,
    sincronizar() {
      const r32Slots = montarR32();
      const r32 = r32Slots.map(slot => {
        if (slot.mandanteId && slot.visitanteId) {
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

  const Torneio = {
    ...TORNEIO_SEED,
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

  const Auth = {
    login(usuario, senha) {
      if (usuario === 'admin' && senha === 'futstats2026') {
        localStorage.setItem('fs_auth', JSON.stringify({ usuario, ts: Date.now() }));
        return true;
      }
      return false;
    },
    logout() { localStorage.removeItem('fs_auth'); },
    isLogged() { return !!localStorage.getItem('fs_auth'); },
    usuarioAtual() {
      const raw = localStorage.getItem('fs_auth');
      return raw ? JSON.parse(raw).usuario : null;
    },
  };

  const CORES = ['#33e08a', '#ff8a3d', '#5b8cff', '#ff5470', '#c792ea', '#ffd166'];

  const Util = {
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

  return { Times, Jogadores, Jogos, Grupos, Classificacao, MataMata, Torneio, Auth, Util };
})();
