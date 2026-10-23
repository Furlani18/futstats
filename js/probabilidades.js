// Probabilidades por Monte Carlo: simula milhares de vezes o que falta do campeonato
// e conta como cada time terminou. Cada placar é sorteado por Poisson a partir da força
// (Elo) dos dois lados:
//   • Copa: o Elo parte do ranking FIFA (1º = 1850, cada posição −7) e os anfitriões ganham +50 em casa;
//   • clubes: todos partem de 1500 e o mandante ganha +60;
//   • os resultados reais já disputados ajustam o Elo (fórmula do World Football Elo, K = 30).
// Não grava nada: recebe a lista de jogos (`fonte`) e devolve as contagens.
const Probabilidades = (() => {
  const GOLS_BASE = 1.3;   // média de gols de cada time num jogo equilibrado
  const PESO_ELO = 0.45;   // quanto a diferença de Elo desloca a média de gols
  const MANDO_CLUBES = 60;
  const MANDO_SEDE = 50;
  const SEDES_COPA = ['MEX', 'USA', 'CAN'];
  const ETAPAS_COPA = ['32avos', 'Oitavas', 'Quartas', 'Semifinal', 'Final', 'Campeão'];

  // Poisson por transformada inversa: um único sorteio por time. `zero` = e^(−média),
  // que pode vir pronto (jogos pendentes têm sempre a mesma média).
  function poisson(media, rand, zero = Math.exp(-media)) {
    const u = rand();
    let k = 0, p = zero, acumulado = zero;
    while (u > acumulado && k < 12) { k++; p *= media / k; acumulado += p; }
    return k;
  }

  function medias(eloM, eloV) {
    const d = (eloM - eloV) / 400;
    return [GOLS_BASE * 10 ** (d * PESO_ELO), GOLS_BASE * 10 ** (-d * PESO_ELO)];
  }

  function placar(eloM, eloV, rand) {
    const [mm, mv] = medias(eloM, eloV);
    return [poisson(mm, rand), poisson(mv, rand)];
  }

  function encerrado(j) {
    return j.status === 'encerrado' && j.golsMandante != null && j.golsVisitante != null;
  }

  // Elo de cada time: base do formato + ajuste pelos resultados reais (em ordem de data).
  function calcularElo(times, reais, { ehCopa, mando }) {
    const elo = {};
    times.forEach(t => { elo[t.id] = ehCopa ? 1850 - ((t.rankingFifa || 48) - 1) * 7 : 1500; });
    [...reais].sort((a, b) => new Date(a.data) - new Date(b.data)).forEach(j => {
      if (!(j.mandanteId in elo) || !(j.visitanteId in elo)) return;
      const vantagem = mando(j);
      const esperado = 1 / (1 + 10 ** (-(elo[j.mandanteId] + vantagem - elo[j.visitanteId]) / 400));
      const real = j.golsMandante > j.golsVisitante ? 1 : j.golsMandante < j.golsVisitante ? 0 : 0.5;
      const saldo = Math.abs(j.golsMandante - j.golsVisitante);
      const multiplicador = saldo <= 1 ? 1 : saldo === 2 ? 1.5 : (11 + saldo) / 8;
      const delta = 30 * multiplicador * (real - esperado);
      elo[j.mandanteId] += delta;
      elo[j.visitanteId] -= delta;
    });
    return elo;
  }

  // Vantagem de jogar em casa: anfitriões na Copa (fase de grupos), mandante nos clubes.
  function funcaoMando(ehCopa) {
    if (!ehCopa) return () => MANDO_CLUBES;
    const sedes = new Set(DB.Times.all().filter(t => SEDES_COPA.includes(t.codigo)).map(t => t.id));
    return j => (sedes.has(j.mandanteId) ? MANDO_SEDE : 0) - (sedes.has(j.visitanteId) ? MANDO_SEDE : 0);
  }

  function prepararPendentes(fonte, elo, mando) {
    const fixos = fonte.filter(encerrado);
    const pendentes = fonte.filter(j => !encerrado(j)).map(j => {
      const [mm, mv] = medias((elo[j.mandanteId] ?? 1500) + mando(j), elo[j.visitanteId] ?? 1500);
      return { base: j, mm, mv, zm: Math.exp(-mm), zv: Math.exp(-mv) };
    });
    return { fixos, pendentes };
  }

  // Só os campos que a classificação lê: copiar o jogo inteiro a cada sorteio sai caro.
  function sortearRestantes(fixos, pendentes, rand) {
    const jogos = fixos.slice();
    pendentes.forEach(p => {
      const j = p.base;
      jogos.push({
        fase: j.fase, grupo: j.grupo, rodada: j.rodada, data: j.data, mandanteId: j.mandanteId, visitanteId: j.visitanteId,
        golsMandante: poisson(p.mm, rand, p.zm), golsVisitante: poisson(p.mv, rand, p.zv), status: 'encerrado', cartoes: [],
      });
    });
    return jogos;
  }

  // ---------- Fase de grupos (Copa e Libertadores); na Copa, também o mata-mata ----------
  function motorGrupos({ fonte, rand = Math.random }) {
    const ehCopa = DB.Contexto.ehCopa();
    const letras = DB.Grupos.letras;
    const times = DB.Times.all();
    const mando = funcaoMando(ehCopa);
    const reais = DB.Jogos.all().filter(j => j.fase === 'grupos' || (ehCopa && j.fase !== 'grupos')).filter(encerrado);
    const elo = calcularElo(times, reais, { ehCopa, mando });
    const { fixos, pendentes } = prepararPendentes(fonte, elo, mando);
    const grupoDe = {};
    letras.forEach(l => DB.Grupos.times(l).forEach(t => { grupoDe[t.id] = l; }));
    const posicoes = {};
    const etapas = {};
    Object.keys(grupoDe).forEach(id => { posicoes[id] = [0, 0, 0, 0, 0, 0]; etapas[id] = ETAPAS_COPA.map(() => 0); });
    let total = 0;

    // Resultado real do mata-mata, quando o confronto sorteado é o mesmo que aconteceu.
    const vencedorReal = (id, a, b) => {
      const j = DB.Jogos.get(id);
      if (!j || !encerrado(j)) return null;
      const mesmos = (j.mandanteId === a && j.visitanteId === b) || (j.mandanteId === b && j.visitanteId === a);
      return mesmos ? DB.MataMata.vencedor(j) : null;
    };

    function jogoEliminatorio(a, b, id) {
      const real = vencedorReal(id, a, b);
      if (real) return real;
      const [ga, gb] = placar(elo[a], elo[b], rand);
      if (ga !== gb) return ga > gb ? a : b;
      // Prorrogação e pênaltis: quase uma moeda, com leve vantagem para o mais forte.
      const chance = Math.max(0.35, Math.min(0.65, 0.5 + (elo[a] - elo[b]) / 2000));
      return rand() < chance ? a : b;
    }

    function mataMataCopa(tabelas) {
      const terceiros = DB.Classificacao.terceiros(null, tabelas);
      const gruposTerceiros = terceiros.filter(t => t.classificado).map(t => t.grupo);
      const atribuicao = DB.MataMata.resolverTerceiros(gruposTerceiros);
      const sobra = gruposTerceiros.filter(g => !Object.values(atribuicao).includes(g));
      let rodada = DB.MataMata.POOLS_R32.map(slot => {
        const a = tabelas[slot.a.grupo][slot.a.pos - 1].timeId;
        const letraB = slot.tipo === 'cruzamento' ? slot.b.grupo : (atribuicao[slot.matchNum] || sobra.shift());
        const b = tabelas[letraB][slot.tipo === 'cruzamento' ? slot.b.pos - 1 : 2].timeId;
        return [a, b, `j_r32_${slot.matchNum}`];
      });
      const fases = ['r16', 'qf', 'sf'];
      for (let etapa = 0; etapa < 5; etapa++) {
        rodada.forEach(([a, b]) => { etapas[a][etapa]++; etapas[b][etapa]++; });
        const vencedores = rodada.map(([a, b, id]) => jogoEliminatorio(a, b, id));
        if (vencedores.length === 1) { etapas[vencedores[0]][5]++; return; }
        const fase = fases[etapa] || 'final';
        rodada = [];
        for (let i = 0; i < vencedores.length; i += 2) rodada.push([vencedores[i], vencedores[i + 1], fase === 'final' ? 'j_final_1' : `j_${fase}_${i / 2 + 1}`]);
      }
    }

    function rodar(n) {
      for (let s = 0; s < n; s++) {
        const jogos = sortearRestantes(fixos, pendentes, rand);
        const tabelas = {};
        letras.forEach(l => {
          tabelas[l] = DB.Classificacao.grupo(l, jogos);
          tabelas[l].forEach((linha, i) => { posicoes[linha.timeId][i]++; });
        });
        if (ehCopa) mataMataCopa(tabelas);
        total++;
      }
      return total;
    }

    function resultado() {
      return {
        simulacoes: total, pendentes: pendentes.length, etapas: ehCopa ? ETAPAS_COPA : null,
        times: Object.keys(grupoDe).map(id => ({
          timeId: id, grupo: grupoDe[id], elo: Math.round(elo[id]),
          posicoes: posicoes[id].map(c => (total ? c / total : 0)),
          etapas: ehCopa ? etapas[id].map(c => (total ? c / total : 0)) : null,
        })),
      };
    }

    return { rodar, resultado, pendentes: pendentes.length };
  }

  // ---------- Pontos corridos (ligas e fase de liga da Champions) ----------
  function motorLiga({ fonte, rand = Math.random }) {
    const times = DB.Times.all();
    const mando = funcaoMando(false);
    const reais = DB.Jogos.all().filter(j => j.fase === 'liga' && encerrado(j));
    const elo = calcularElo(times, reais, { ehCopa: false, mando });
    const { fixos, pendentes } = prepararPendentes(fonte.filter(j => j.fase === 'liga'), elo, mando);
    const n = times.length;
    const posicoes = Object.fromEntries(times.map(t => [t.id, new Array(n).fill(0)]));
    let total = 0;

    function rodar(qtd) {
      for (let s = 0; s < qtd; s++) {
        DB.Classificacao.liga(sortearRestantes(fixos, pendentes, rand)).forEach((linha, i) => { posicoes[linha.timeId][i]++; });
        total++;
      }
      return total;
    }

    function resultado() {
      return {
        simulacoes: total, pendentes: pendentes.length,
        times: times.map(t => {
          const probs = posicoes[t.id].map(c => (total ? c / total : 0));
          return { timeId: t.id, elo: Math.round(elo[t.id]), posicoes: probs, posicaoMedia: probs.reduce((s, p, i) => s + p * (i + 1), 0) };
        }),
      };
    }

    return { rodar, resultado, pendentes: pendentes.length };
  }

  // Soma das probabilidades das posições de uma zona ({ de, ate }).
  function chanceZona(posicoes, zona) {
    let soma = 0;
    for (let p = zona.de; p <= zona.ate; p++) soma += posicoes[p - 1] || 0;
    return soma;
  }

  return { motorGrupos, motorLiga, chanceZona, poisson, placar, calcularElo, ETAPAS_COPA };
})();
