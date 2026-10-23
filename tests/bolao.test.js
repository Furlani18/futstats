// Bolão: pontuação de cada palpite e o link que leva os palpites de um amigo.
const test = require('node:test');
const assert = require('node:assert/strict');
const { novoAmbiente } = require('./ambiente');

const { pegar } = novoAmbiente({ extras: ['js/bolao.js'] });
const Bolao = pegar('Bolao');
const jogo = (gm, gv, status = 'encerrado') => ({ id: 'j1', status, golsMandante: gm, golsVisitante: gv });

test('pontuação: exato 10, saldo 7, resultado 5, erro 0', () => {
  assert.equal(Bolao.pontos([2, 1], jogo(2, 1)), 10);
  assert.equal(Bolao.pontos([3, 2], jogo(2, 1)), 7);
  assert.equal(Bolao.pontos([1, 1], jogo(2, 2)), 7, 'empate com outro placar acerta o saldo (zero)');
  assert.equal(Bolao.pontos([3, 0], jogo(2, 1)), 5);
  assert.equal(Bolao.pontos([0, 1], jogo(2, 1)), 0);
  assert.equal(Bolao.pontos([1, 1], jogo(2, 1)), 0);
  assert.equal(Bolao.pontos(null, jogo(2, 1)), null);
  assert.equal(Bolao.pontos([1, 0], jogo(null, null, 'agendado')), null);
});

test('link: os palpites vão e voltam iguais, com nome acentuado', () => {
  const palpites = { j_a: [2, 1], j_b: [0, 0], j_c: [10, 3] };
  const codigo = Bolao.codificar({ nome: 'João Côrtes', compId: 'copa2026', palpites });
  assert.match(codigo, /^[\w-]+$/, 'só caracteres seguros para URL');
  const lido = Bolao.decodificar(codigo);
  assert.equal(lido.nome, 'João Côrtes');
  assert.equal(lido.compId, 'copa2026');
  assert.deepEqual(JSON.parse(JSON.stringify(lido.palpites)), palpites);
});

test('link estragado ou com placar inválido não quebra', () => {
  assert.equal(Bolao.decodificar('isso-nao-e-um-link'), null);
  const malicioso = Buffer.from(JSON.stringify({ v: 1, c: 'copa2026', n: '<b>x</b>', p: [['j1', -1, 2], ['j2', 1.5, 0], ['j3', 1, 0]] })).toString('base64url');
  const lido = Bolao.decodificar(malicioso);
  assert.deepEqual(Object.keys(lido.palpites), ['j3'], 'só o placar válido fica');
});

test('resumo: soma só os jogos encerrados', () => {
  const jogos = [
    { id: 'a', status: 'encerrado', golsMandante: 1, golsVisitante: 0 },
    { id: 'b', status: 'encerrado', golsMandante: 2, golsVisitante: 2 },
    { id: 'c', status: 'agendado', golsMandante: null, golsVisitante: null },
  ];
  const r = Bolao.resumo({ a: [1, 0], b: [0, 1], c: [3, 3] }, jogos);
  assert.equal(r.pontos, 10);
  assert.equal(r.exatos, 1);
  assert.equal(r.acertos, 1);
  assert.equal(r.palpitados, 3);
});
