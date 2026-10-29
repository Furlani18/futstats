// Quiz do dia: sorteio estável e sequências; conquistas do bolão.
// Rodar: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const { novoAmbiente, jogoEncerrado } = require('./ambiente');

test('quiz: o jogador do dia é o mesmo para a mesma data e muda com o dia', () => {
  const { DB, pegar } = novoAmbiente({ extras: ['js/quiz.js'] });
  const Quiz = pegar('Quiz');
  const jogadores = DB.Jogadores.all();
  const a = Quiz.jogadorDoDia(jogadores, 'copa2026', '2026-06-11');
  const b = Quiz.jogadorDoDia([...jogadores].reverse(), 'copa2026', '2026-06-11');
  assert.equal(a.id, b.id, 'não depende da ordem da lista');
  const dias = new Set(['2026-06-11', '2026-06-12', '2026-06-13', '2026-06-14'].map(d => Quiz.jogadorDoDia(jogadores, 'copa2026', d).id));
  assert.ok(dias.size > 1, 'dias diferentes sorteiam jogadores diferentes');
});

test('quiz: sequência atual e melhor sequência', () => {
  const { pegar } = novoAmbiente({ extras: ['js/quiz.js'] });
  const Quiz = pegar('Quiz');
  const ok = { acertou: true, tentativas: ['x'] }, erro = { acertou: false, tentativas: [1, 2, 3, 4, 5, 6] };
  const dias = { '2026-06-01': ok, '2026-06-02': ok, '2026-06-03': ok, '2026-06-04': erro, '2026-06-05': ok, '2026-06-06': ok };
  assert.deepEqual({ ...Quiz.sequencias(dias, '2026-06-06') }, { atual: 2, melhor: 3 });
  // Hoje ainda não jogou: a sequência de ontem continua valendo.
  assert.equal(Quiz.sequencias(dias, '2026-06-07').atual, 2);
  assert.equal(Quiz.sequencias(dias, '2026-06-08').atual, 0);
});

test('bolão: conquistas de placar exato e sequência', () => {
  const { DB, pegar } = novoAmbiente({ extras: ['js/bolao.js'] });
  const Bolao = pegar('Bolao');
  const jogos = [
    jogoEncerrado(DB, { grupo: 'C', rodada: 1, m: 't9', v: 't10', gm: 2, gv: 0, data: '2026-06-13T16:00' }),
    jogoEncerrado(DB, { grupo: 'C', rodada: 1, m: 't11', v: 't12', gm: 1, gv: 1, data: '2026-06-13T19:00' }),
  ];
  const palpites = { [jogos[0].id]: [2, 0], [jogos[1].id]: [0, 0] };
  const c = Object.fromEntries(Array.from(Bolao.conquistas(palpites, jogos), x => [x.id, x]));
  assert.equal(c.estreia.ok, true);
  assert.equal(c.mosca.ok, true);
  assert.equal(c.vidente.ok, false);
  assert.equal(c.vidente.progresso, '1/5');
  assert.equal(c.lider.ok, false);
});
