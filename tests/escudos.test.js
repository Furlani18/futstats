const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { novoAmbiente } = require('./ambiente');

const RAIZ = path.join(__dirname, '..');

test('todo escudo e logo local aponta para um arquivo que existe', () => {
  const { pegar } = novoAmbiente();
  const clubes = Object.entries(pegar('CLUBES_2026'));
  const comps = pegar('COMPETICOES');
  const caminhos = [
    ...clubes.map(([, c]) => c.escudo),
    ...comps.map(c => c.logo),
  ].filter(Boolean);
  assert.ok(caminhos.length > 150);
  caminhos.forEach(url => {
    assert.ok(!/^https?:/.test(url), `ainda é remoto: ${url}`);
    assert.ok(fs.existsSync(path.join(RAIZ, url)), `arquivo não existe: ${url}`);
  });
});

test('escudoUrl troca a URL antiga da Wikipedia pela cópia local', () => {
  const { DB } = novoAmbiente();
  const antigo = { id: 'c_bahia', escudo: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Esporte_Clube_Bahia_logo.svg/120px-Esporte_Clube_Bahia_logo.svg.png' };
  assert.strictEqual(DB.Util.escudoUrl(antigo), 'img/escudos/bahia.png');
});

test('escudoUrl mantém escudo personalizado e trata ausência', () => {
  const { DB } = novoAmbiente();
  const proprio = 'https://exemplo.com/meu-escudo.png';
  assert.strictEqual(DB.Util.escudoUrl({ id: 'c_bahia', escudo: proprio }), proprio);
  assert.strictEqual(DB.Util.escudoUrl({ id: 'c_bahia', escudo: 'img/escudos/bahia.png' }), 'img/escudos/bahia.png');
  // Time criado pelo admin (sem cópia local): a URL da Wikipedia continua.
  const wiki = 'https://upload.wikimedia.org/x.png';
  assert.strictEqual(DB.Util.escudoUrl({ id: 'c_novo', escudo: wiki }), wiki);
  assert.strictEqual(DB.Util.escudoUrl({ id: 'c_bahia', escudo: null }), null);
  assert.strictEqual(DB.Util.escudoUrl(null), null);
});
