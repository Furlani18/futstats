// Critérios de desempate da Copa 2026, ranking dos terceiros, 32avos e pontos corridos.
// Rodar: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const { novoAmbiente, jogoEncerrado, aleatorioComSemente } = require('./ambiente');

// Grupo A: t1 México, t2 África do Sul, t3 Coreia do Sul, t4 Tchéquia.
const ordem = tabela => Array.from(tabela, l => l.timeId);

function grupoA(DB, jogos) {
  jogos.forEach(([m, v, gm, gv, cartoes]) => jogoEncerrado(DB, { grupo: 'A', m, v, gm, gv, cartoes }));
  return DB.Classificacao.grupo('A');
}

test('pontuação: vitória vale 3, empate 1', () => {
  const { DB } = novoAmbiente();
  const tabela = grupoA(DB, [['t1', 't2', 2, 0], ['t3', 't4', 1, 1]]);
  const pontos = Object.fromEntries(Array.from(tabela, l => [l.timeId, l.P]));
  assert.deepEqual(pontos, { t1: 3, t2: 0, t3: 1, t4: 1 });
  const mexico = tabela.find(l => l.timeId === 't1');
  assert.equal(mexico.SG, 2);
  assert.equal(mexico.J, 1);
});

test('empate em pontos: confronto direto vale mais que o saldo geral', () => {
  const { DB } = novoAmbiente();
  // t1 e t2 terminam com 6 pontos; t2 tem saldo melhor (+4 x +1), mas t1 venceu o confronto direto.
  const tabela = grupoA(DB, [
    ['t1', 't2', 1, 0], ['t3', 't4', 0, 0], ['t1', 't3', 0, 1],
    ['t2', 't4', 3, 0], ['t1', 't4', 1, 0], ['t2', 't3', 2, 0],
  ]);
  assert.deepEqual(ordem(tabela).slice(0, 2), ['t1', 't2']);
  assert.ok(tabela[1].SG > tabela[0].SG, 'o 2º tem saldo geral maior que o 1º');
});

test('mini-liga sem separar ninguém: cai para o saldo geral', () => {
  const { DB } = novoAmbiente();
  // t1, t2 e t3 empatam entre si (1–1) e vencem t4 por placares diferentes.
  const tabela = grupoA(DB, [
    ['t1', 't2', 1, 1], ['t2', 't3', 1, 1], ['t3', 't1', 1, 1],
    ['t1', 't4', 3, 0], ['t2', 't4', 2, 0], ['t3', 't4', 1, 0],
  ]);
  assert.deepEqual(ordem(tabela), ['t1', 't2', 't3', 't4']);
});

test('três empatados: a mini-liga ordena pelo saldo entre eles', () => {
  const { DB } = novoAmbiente();
  // Ciclo t1 > t2 > t3 > t1, todos vencem t4: 6 pontos cada. Entre eles: t1 +1, t3 0, t2 −1.
  const tabela = grupoA(DB, [
    ['t1', 't2', 2, 0], ['t2', 't3', 1, 0], ['t3', 't1', 1, 0],
    ['t1', 't4', 1, 0], ['t2', 't4', 5, 0], ['t3', 't4', 1, 0],
  ]);
  assert.deepEqual(ordem(tabela), ['t1', 't3', 't2', 't4']);
});

test('tudo igual: decide o fair play (menos pontos de conduta)', () => {
  const { DB } = novoAmbiente();
  const cartoes = {
    t1: [{ timeId: 't1', tipo: 'amarelo' }],
    t2: [{ timeId: 't2', tipo: 'vermelho' }],
    t4: [{ timeId: 't4', tipo: 'amarelo' }, { timeId: 't4', tipo: 'amarelo' }],
  };
  const tabela = grupoA(DB, [
    ['t1', 't2', 0, 0, [...cartoes.t1, ...cartoes.t2]], ['t3', 't4', 0, 0, cartoes.t4],
    ['t1', 't3', 0, 0], ['t2', 't4', 0, 0], ['t1', 't4', 0, 0], ['t2', 't3', 0, 0],
  ]);
  // Conduta: t3 0, t1 −1, t4 −2, t2 −4.
  assert.deepEqual(ordem(tabela), ['t3', 't1', 't4', 't2']);
});

test('sem nenhum critério separando: vale o ranking FIFA', () => {
  const { DB } = novoAmbiente();
  const tabela = grupoA(DB, [
    ['t4', 't3', 0, 0], ['t2', 't1', 0, 0], ['t4', 't2', 0, 0],
    ['t3', 't1', 0, 0], ['t4', 't1', 0, 0], ['t3', 't2', 0, 0],
  ]);
  // México 16º, África do Sul 37º, Coreia do Sul 43º, Tchéquia 48º.
  assert.deepEqual(ordem(tabela), ['t1', 't2', 't3', 't4']);
});

// Preenche os 72 jogos da fase de grupos com placares aleatórios (semente fixa).
function gruposCompletos(DB, semente) {
  const sorteio = aleatorioComSemente(semente);
  const gols = () => Math.floor(sorteio() * 4);
  DB.Grupos.letras.forEach(letra => {
    const ids = Array.from(DB.Grupos.times(letra), t => t.id);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) jogoEncerrado(DB, { grupo: letra, m: ids[i], v: ids[j], gm: gols(), gv: gols() });
    }
  });
}

test('terceiros: 8 classificados, ordenados por pontos, saldo e gols', () => {
  for (const semente of [1, 2, 3, 4, 5]) {
    const { DB } = novoAmbiente();
    gruposCompletos(DB, semente);
    const terceiros = DB.Classificacao.terceiros();
    assert.equal(terceiros.length, 12);
    assert.equal(terceiros.filter(t => t.classificado).length, 8);
    for (let i = 1; i < terceiros.length; i++) {
      const a = terceiros[i - 1], b = terceiros[i];
      const chave = t => [t.P, t.SG, t.GP];
      const [pa, sa, ga] = chave(a), [pb, sb, gb] = chave(b);
      assert.ok(pa > pb || (pa === pb && (sa > sb || (sa === sb && ga >= gb))), `ordem errada entre ${a.nome} e ${b.nome}`);
    }
  }
});

test('32avos: 32 seleções diferentes e cada 3º num jogo que aceita o seu grupo', () => {
  for (const semente of [7, 11, 13, 17, 19, 23]) {
    const { DB } = novoAmbiente();
    gruposCompletos(DB, semente);
    const r32 = DB.MataMata.projetarR32();
    assert.equal(r32.length, 16);
    const ids = r32.flatMap(s => [s.mandanteId, s.visitanteId]);
    assert.ok(ids.every(Boolean), 'todo confronto tem os dois times');
    assert.equal(new Set(ids).size, 32);
    const grupoDe = Object.fromEntries(Array.from(DB.Times.all(), t => [t.id, t.grupo]));
    DB.MataMata.POOLS_R32.filter(p => p.tipo === 'terceiro').forEach(pool => {
      const jogo = r32.find(s => s.matchNum === pool.matchNum);
      assert.ok(pool.pool.includes(grupoDe[jogo.visitanteId]), `jogo ${pool.matchNum}: 3º do grupo ${grupoDe[jogo.visitanteId]} fora do pool`);
    });
    assert.ok(r32.every(s => !s.projetado), 'com os grupos completos, nada é projetado');
  }
});

test('mata-mata: empate no tempo normal é decidido nos pênaltis', () => {
  const { DB } = novoAmbiente();
  const base = { status: 'encerrado', mandanteId: 'a', visitanteId: 'b', golsMandante: 1, golsVisitante: 1 };
  assert.equal(DB.MataMata.vencedor({ ...base, penaltisMandante: 3, penaltisVisitante: 4 }), 'b');
  assert.equal(DB.MataMata.perdedor({ ...base, penaltisMandante: 3, penaltisVisitante: 4 }), 'a');
  assert.equal(DB.MataMata.vencedor({ ...base, penaltisMandante: null, penaltisVisitante: null }), null);
  assert.equal(DB.MataMata.vencedor({ ...base, golsMandante: 2 }), 'a');
});

test('pontos corridos: o Brasileirão desempata por vitórias antes do saldo', () => {
  const cenario = comp => {
    const { DB } = novoAmbiente({ comp });
    const [x, y, a, b, c, d, e] = Array.from(DB.Times.all(), t => t.id);
    // x: 1 vitória e 1 derrota (3 pts, saldo −2) · y: 3 empates (3 pts, saldo 0).
    jogoEncerrado(DB, { fase: 'liga', rodada: 1, m: x, v: a, gm: 1, gv: 0 });
    jogoEncerrado(DB, { fase: 'liga', rodada: 2, m: b, v: x, gm: 3, gv: 0 });
    jogoEncerrado(DB, { fase: 'liga', rodada: 1, m: y, v: c, gm: 0, gv: 0 });
    jogoEncerrado(DB, { fase: 'liga', rodada: 2, m: d, v: y, gm: 0, gv: 0 });
    jogoEncerrado(DB, { fase: 'liga', rodada: 3, m: y, v: e, gm: 0, gv: 0 });
    const tabela = DB.Classificacao.liga();
    const pos = id => tabela.find(l => l.timeId === id).posicao;
    return pos(x) < pos(y) ? 'x' : 'y';
  };
  assert.equal(cenario('bra2026'), 'x', 'Brasileirão: mais vitórias na frente');
  assert.equal(cenario('eng2627'), 'y', 'Premier League: saldo de gols na frente');
});

test('minutos: substituição e expulsão encurtam o tempo em campo', () => {
  const { DB } = novoAmbiente();
  const jogo = {
    status: 'encerrado', mandanteId: 't1', visitanteId: 't2',
    escalacoes: { t1: { titulares: ['a', 'b', 'c'], substituicoes: [{ saiId: 'a', entraId: 'd', minuto: '60' }] } },
    cartoes: [{ jogadorId: 'b', timeId: 't1', tipo: 'vermelho', minuto: '30' }],
  };
  const m = DB.Estatisticas.minutosNoJogo(jogo);
  assert.equal(m.a.minutos, 60);
  assert.equal(m.d.minutos, 30);
  assert.equal(m.b.minutos, 30);
  assert.equal(m.c.minutos, 90);
  assert.equal(m.a.titular, true);
  assert.equal(m.d.titular, false);
});
