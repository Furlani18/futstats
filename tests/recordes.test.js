// Recordes, Bola de Ouro, evolução no grupo, seleção da rodada e histórico de edições.
// Rodar: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const { novoAmbiente, jogoEncerrado } = require('./ambiente');

// Grupo C: t9 Brasil, t10 Marrocos, t11 Haiti, t12 Escócia.
const jogador = (DB, timeId, posicao) => DB.Jogadores.all().find(j => j.timeId === timeId && j.posicao === posicao);

test('recordes: goleada, virada, hat-trick e sequência invicta', () => {
  const { DB } = novoAmbiente();
  const ata = jogador(DB, 't9', 'Atacante');
  const adv = jogador(DB, 't10', 'Atacante');
  const goleada = jogoEncerrado(DB, { grupo: 'C', rodada: 1, m: 't9', v: 't11', gm: 5, gv: 0, data: '2026-06-13T16:00' });
  DB.Jogos.update(goleada.id, { gols: [1, 2, 3].map(min => ({ id: `g${min}`, timeId: 't9', jogadorId: ata.id, minuto: String(min * 10) })) });
  // Brasil sai atrás contra Marrocos e vira.
  const virada = jogoEncerrado(DB, { grupo: 'C', rodada: 2, m: 't9', v: 't10', gm: 2, gv: 1, data: '2026-06-19T16:00' });
  DB.Jogos.update(virada.id, { gols: [
    { id: 'a', timeId: 't10', jogadorId: adv.id, minuto: '3' },
    { id: 'b', timeId: 't9', jogadorId: ata.id, minuto: '50' },
    { id: 'c', timeId: 't9', jogadorId: ata.id, minuto: '90+4' },
  ] });
  jogoEncerrado(DB, { grupo: 'C', rodada: 1, m: 't10', v: 't12', gm: 0, gv: 0, data: '2026-06-13T19:00' });

  const r = DB.Estatisticas.recordes();
  assert.equal(r.jogos, 3);
  assert.equal(r.maioresGoleadas[0].id, goleada.id);
  assert.equal(r.hatTricks.length, 1);
  assert.equal(r.hatTricks[0].jogador.id, ata.id);
  assert.equal(r.viradas.length, 1);
  assert.equal(r.viradas[0].jogo.id, virada.id);
  assert.equal(r.golsMaisRapidos[0].minuto, '3');
  assert.equal(r.golsMaisTardios[0].minuto, '90+4');
  assert.equal(r.invictos[0].time.id, 't9');
  assert.equal(r.invictos[0].valor, 2);
  assert.equal(r.curiosidades.zeroAZero, 1);
  assert.equal(r.curiosidades.acrescimos, 1);
  assert.ok(r.maisJovens.length >= 1, 'jogadores da Copa têm data de nascimento');
});

test('evolução da posição na fase de grupos', () => {
  const { DB } = novoAmbiente();
  jogoEncerrado(DB, { grupo: 'C', rodada: 1, m: 't9', v: 't10', gm: 0, gv: 1 });
  jogoEncerrado(DB, { grupo: 'C', rodada: 1, m: 't11', v: 't12', gm: 0, gv: 0 });
  jogoEncerrado(DB, { grupo: 'C', rodada: 2, m: 't9', v: 't11', gm: 4, gv: 0 });
  jogoEncerrado(DB, { grupo: 'C', rodada: 2, m: 't10', v: 't12', gm: 0, gv: 2 });
  const ev = DB.Estatisticas.evolucaoPosicao('t9');
  assert.deepEqual(Array.from(ev, e => e.rodada), [1, 2]);
  assert.equal(ev[0].posicao, 4);
  assert.equal(ev[0].total, 4);
  assert.ok(ev[1].posicao < ev[0].posicao, 'subiu depois da goleada');
});

test('seleção da rodada escolhe a formação de maior soma de notas', () => {
  const { DB } = novoAmbiente();
  jogoEncerrado(DB, { grupo: 'C', rodada: 1, m: 't9', v: 't10', gm: 3, gv: 0 });
  const sel = DB.Estatisticas.selecaoDaRodada('g1');
  assert.ok(sel.formacao, 'devolve a formação');
  const [ata, mei, def, gol] = sel.formacao.split('-').length === 3
    ? [sel.linhas[0].length, sel.linhas[1].length, sel.linhas[2].length, sel.linhas[3].length] : [];
  assert.equal(`${def}-${mei}-${ata}`, sel.formacao);
  assert.equal(gol, 1);
});

test('histórico: desfazer edição, criação e exclusão', () => {
  const { DB } = novoAmbiente();
  const jogo = DB.Jogos.criar({ fase: 'grupos', grupo: 'C', rodada: 1, mandanteId: 't9', visitanteId: 't10', data: '2026-06-13T16:00' });
  DB.Historico.registrar('criar', jogo.id, null);
  const antes = DB.Jogos.get(jogo.id);
  DB.Jogos.update(jogo.id, { status: 'encerrado', golsMandante: 2, golsVisitante: 0 });
  DB.Historico.registrar('editar', jogo.id, antes);
  assert.equal(DB.Historico.recentes().length, 2);

  DB.Historico.desfazer(DB.Historico.recentes()[0].id);
  assert.equal(DB.Jogos.get(jogo.id).status, 'agendado');
  assert.equal(DB.Jogos.get(jogo.id).golsMandante, null);
  assert.equal(DB.Historico.recentes().length, 1);

  const copia = DB.Jogos.get(jogo.id);
  DB.Jogos.remove(jogo.id);
  DB.Historico.registrar('excluir', jogo.id, copia);
  DB.Historico.desfazer(DB.Historico.recentes()[0].id);
  assert.ok(DB.Jogos.get(jogo.id), 'exclusão desfeita');

  DB.Historico.desfazer(DB.Historico.recentes()[0].id);
  assert.equal(DB.Jogos.get(jogo.id), null, 'criação desfeita apaga o jogo');
  assert.equal(DB.Historico.recentes().length, 0);
});

test('Bola de Ouro exige metade dos jogos do mais assíduo', () => {
  const { DB } = novoAmbiente();
  jogoEncerrado(DB, { grupo: 'C', rodada: 1, m: 't9', v: 't10', gm: 1, gv: 0 });
  const { minimo, lista } = DB.Estatisticas.bolaDeOuro();
  assert.equal(minimo, 1);
  for (let i = 1; i < lista.length; i++) assert.ok(lista[i - 1].media >= lista[i].media);
});
