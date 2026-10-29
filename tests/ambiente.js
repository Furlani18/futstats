// Carrega os scripts do site num contexto isolado do Node, com um localStorage em memória,
// para testar a lógica (DB, probabilidades…) sem navegador.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const RAIZ = path.join(__dirname, '..');

class ArmazenamentoMemoria {
  constructor() { this.dados = new Map(); }
  getItem(k) { return this.dados.has(k) ? this.dados.get(k) : null; }
  setItem(k, v) { this.dados.set(k, String(v)); }
  removeItem(k) { this.dados.delete(k); }
  clear() { this.dados.clear(); }
}

// `comp`: campeonato aberto (como o ?c= da URL). `extras`: scripts carregados depois do db.js.
function novoAmbiente({ comp = 'copa2026', extras = [] } = {}) {
  const contexto = {
    console, Math, Date, JSON, Map, Set, URLSearchParams, btoa, atob, TextEncoder, TextDecoder, crypto: globalThis.crypto,
    localStorage: new ArmazenamentoMemoria(),
    location: { search: `?c=${comp}`, pathname: '/index.html' },
    addEventListener() {},
  };
  contexto.window = contexto;
  vm.createContext(contexto);
  const arquivos = ['js/elencos.js', 'js/clubes.js', 'js/competicoes-clubes.js', 'js/competicoes.js', 'js/calendario.js', 'js/db.js', ...extras];
  arquivos.forEach(arquivo => {
    vm.runInContext(fs.readFileSync(path.join(RAIZ, arquivo), 'utf8'), contexto, { filename: arquivo });
  });
  const pegar = nome => vm.runInContext(`typeof ${nome} === 'undefined' ? undefined : ${nome}`, contexto);
  return { DB: pegar('DB'), pegar, contexto };
}

// Cria um jogo já encerrado com o placar dado (e cartões opcionais: [{ timeId, tipo }]).
function jogoEncerrado(DB, { fase = 'grupos', grupo = null, rodada = 1, m, v, gm, gv, cartoes = [], data = '2026-06-11T16:00', perna = null }) {
  const jogo = DB.Jogos.criar({ fase, grupo, rodada, perna, mandanteId: m, visitanteId: v, data });
  return DB.Jogos.update(jogo.id, {
    status: 'encerrado', golsMandante: gm, golsVisitante: gv,
    cartoes: cartoes.map((c, i) => ({ id: `c${i}`, jogadorId: null, minuto: '10', ...c })),
  });
}

// Gerador pseudoaleatório com semente (mulberry32): testes repetíveis.
function aleatorioComSemente(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

module.exports = { novoAmbiente, jogoEncerrado, aleatorioComSemente };
