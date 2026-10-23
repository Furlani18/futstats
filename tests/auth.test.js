// Login do painel (modo demonstração): hash SHA-256, espera após erros e sessão de 12 h.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { novoAmbiente } = require('./ambiente');

test('sha256 confere com o do Node', () => {
  const { DB } = novoAmbiente();
  for (const texto of ['', 'abc', 'futstats:v1:admin:futstats2026', 'ação ⚽ '.repeat(40)]) {
    assert.equal(DB.Auth.sha256(texto), crypto.createHash('sha256').update(texto).digest('hex'));
  }
});

test('login certo entra, errado não; 5 erros seguidos travam por um tempo', () => {
  const { DB } = novoAmbiente();
  assert.equal(DB.Auth.login('admin', 'errada'), false);
  assert.equal(DB.Auth.isLogged(), false);
  assert.equal(DB.Auth.login('admin', 'futstats2026'), true);
  assert.equal(DB.Auth.isLogged(), true);
  DB.Auth.logout();
  for (let i = 0; i < 5; i++) DB.Auth.login('admin', `x${i}`);
  assert.ok(DB.Auth.esperaRestante() > 0);
  assert.equal(DB.Auth.login('admin', 'futstats2026'), false, 'durante a espera nem a senha certa entra');
});

test('sessão expira depois de 12 horas', () => {
  const { DB, contexto } = novoAmbiente();
  contexto.localStorage.setItem('fs_auth', JSON.stringify({ usuario: 'admin', ts: Date.now() - 13 * 36e5 }));
  assert.equal(DB.Auth.isLogged(), false);
});
