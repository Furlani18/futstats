// Monte Carlo do simulador: as probabilidades precisam fechar em 100% e respeitar o que já aconteceu.
const test = require('node:test');
const assert = require('node:assert/strict');
const { novoAmbiente, jogoEncerrado, aleatorioComSemente } = require('./ambiente');

const perto = (a, b, tolerancia = 1e-9) => Math.abs(a - b) <= tolerancia;

// Os 72 jogos da fase de grupos da Copa, como o simulador monta: cadastrados + calendário oficial.
function fonteCopa(DB, pegar) {
  const porNome = Object.fromEntries(Array.from(DB.Times.all(), t => [t.nome, t]));
  const reais = DB.Jogos.all().filter(j => j.fase === 'grupos');
  const chave = (a, b) => [a, b].sort().join('|');
  const vistos = new Set(reais.map(j => chave(j.mandanteId, j.visitanteId)));
  const doCalendario = pegar('CALENDARIO_GRUPOS_2026')
    .map(c => ({ fase: 'grupos', grupo: c.grupo, rodada: c.rodada, data: c.data, mandanteId: porNome[c.mandante].id, visitanteId: porNome[c.visitante].id, status: 'agendado', golsMandante: null, golsVisitante: null, cartoes: [] }))
    .filter(j => !vistos.has(chave(j.mandanteId, j.visitanteId)));
  return [...reais, ...doCalendario];
}

test('Copa sem jogos: chances fecham em 100% em cada posição e no título', () => {
  const { DB, pegar } = novoAmbiente({ extras: ['js/probabilidades.js'] });
  const P = pegar('Probabilidades');
  const motor = P.motorGrupos({ fonte: fonteCopa(DB, pegar), rand: aleatorioComSemente(42) });
  assert.equal(motor.pendentes, 72);
  const inicio = Date.now();
  motor.rodar(2000);
  const ms = Date.now() - inicio;
  const r = motor.resultado();
  assert.equal(r.simulacoes, 2000);
  assert.equal(r.times.length, 48);
  r.times.forEach(t => assert.ok(perto(t.posicoes.reduce((s, p) => s + p, 0), 1), `${t.timeId}: posições somam 1`));
  const somaEtapa = i => r.times.reduce((s, t) => s + t.etapas[i], 0);
  assert.ok(perto(somaEtapa(0), 32), '32 classificados por simulação');
  assert.ok(perto(somaEtapa(4), 2), '2 finalistas');
  assert.ok(perto(somaEtapa(5), 1), '1 campeão');
  // Argentina (1ª do ranking) tem de ser mais favorita que o Haiti (47º).
  const chance = nome => r.times.find(t => DB.Times.get(t.timeId).nome === nome).etapas[5];
  assert.ok(chance('Argentina') > chance('Haiti'));
  console.log(`  2000 simulações da Copa em ${ms} ms`);
});

test('resultados reais ficam fixos: grupo encerrado tem posições certas', () => {
  const { DB, pegar } = novoAmbiente({ extras: ['js/probabilidades.js'] });
  [['t1', 't2', 2, 0], ['t3', 't4', 2, 0], ['t1', 't3', 2, 0], ['t2', 't4', 2, 0], ['t1', 't4', 2, 0], ['t2', 't3', 2, 0]]
    .forEach(([m, v, gm, gv]) => jogoEncerrado(DB, { grupo: 'A', m, v, gm, gv }));
  const motor = pegar('Probabilidades').motorGrupos({ fonte: fonteCopa(DB, pegar), rand: aleatorioComSemente(5) });
  assert.equal(motor.pendentes, 66);
  motor.rodar(300);
  const r = motor.resultado();
  const pos = id => Array.from(r.times.find(t => t.timeId === id).posicoes);
  assert.deepEqual(pos('t1').slice(0, 4), [1, 0, 0, 0]);
  assert.deepEqual(pos('t2').slice(0, 4), [0, 1, 0, 0]);
  assert.deepEqual(pos('t4').slice(0, 4), [0, 0, 0, 1]);
  // 1º e 2º do grupo sempre jogam os 32avos.
  assert.equal(r.times.find(t => t.timeId === 't1').etapas[0], 1);
});

test('liga: chance de cada posição soma 1 e a zona soma as posições', () => {
  const { DB, pegar } = novoAmbiente({ comp: 'bra2026', extras: ['js/probabilidades.js'] });
  const P = pegar('Probabilidades');
  const ids = Array.from(DB.Contexto.idsTimes());
  DB.Jogos.gerarTurnoReturno({ ids, fase: 'liga', inicio: '2026-01-28' });
  const jogos = DB.Jogos.all().filter(j => j.fase === 'liga');
  assert.equal(jogos.length, 380);
  // Primeiras 5 rodadas com placares reais: o time 0 vence todas.
  const sorteio = aleatorioComSemente(9);
  jogos.filter(j => j.rodada <= 5).forEach(j => {
    const forte = j.mandanteId === ids[0] || j.visitanteId === ids[0];
    const gm = forte ? (j.mandanteId === ids[0] ? 3 : 0) : Math.floor(sorteio() * 3);
    const gv = forte ? (j.visitanteId === ids[0] ? 3 : 0) : Math.floor(sorteio() * 3);
    DB.Jogos.update(j.id, { status: 'encerrado', golsMandante: gm, golsVisitante: gv });
  });
  const motor = P.motorLiga({ fonte: DB.Jogos.all(), rand: aleatorioComSemente(3) });
  assert.equal(motor.pendentes, 330);
  const inicio = Date.now();
  motor.rodar(1000);
  const ms = Date.now() - inicio;
  const r = motor.resultado();
  r.times.forEach(t => assert.ok(perto(t.posicoes.reduce((s, p) => s + p, 0), 1)));
  for (let pos = 0; pos < 20; pos++) assert.ok(perto(r.times.reduce((s, t) => s + t.posicoes[pos], 0), 1), `posição ${pos + 1}`);
  const lider = r.times.find(t => t.timeId === ids[0]);
  const media = r.times.reduce((s, t) => s + t.posicoes[0], 0) / 20;
  assert.ok(lider.posicoes[0] > media, 'quem venceu tudo tem mais chance de título que a média');
  const g4 = DB.Contexto.get().zonas[0];
  assert.ok(perto(P.chanceZona(lider.posicoes, g4), lider.posicoes.slice(0, 4).reduce((s, p) => s + p, 0)));
  console.log(`  1000 simulações do Brasileirão em ${ms} ms`);
});
