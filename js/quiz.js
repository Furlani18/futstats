// Quiz "Quem é o jogador?": um jogador por dia (o mesmo para todo mundo, sorteado pela data
// e pelo campeonato), seis chances e uma dica nova a cada erro. Cada palpite errado mostra
// o que ele tem em comum com o jogador do dia (time, posição, idade, número).
const Quiz = (() => {
  const CHAVE = 'fs_quiz';
  const CHANCES = 6;

  const hoje = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const diaAnterior = dia => { const d = new Date(`${dia}T12:00`); d.setDate(d.getDate() - 1); return hoje(d); };

  // Hash FNV-1a: o mesmo texto dá sempre o mesmo número (sorteio igual em todo navegador).
  function hash(texto) {
    let h = 0x811c9dc5;
    for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h;
  }

  // Jogadores sorteáveis: na Copa, os mais rodados na seleção (para não cair um reserva desconhecido).
  function candidatos(jogadores) {
    const ordenados = [...jogadores].sort((a, b) => a.id.localeCompare(b.id));
    const conhecidos = ordenados.filter(j => (j.jogosSelecao || 0) >= 20 || j.capitao || (j.golsSelecao || 0) >= 5);
    return conhecidos.length >= 30 ? conhecidos : ordenados;
  }
  const jogadorDoDia = (jogadores, compId, dia) => {
    const lista = candidatos(jogadores);
    return lista.length ? lista[hash(`${compId}|${dia}`) % lista.length] : null;
  };

  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { return {}; } }
  function gravar(dados) { try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch (e) { /* só nesta visita */ } }
  const doCampeonato = compId => ({ dias: {}, ...(ler()[compId] || {}) });
  function salvar(compId, dados) { const tudo = ler(); tudo[compId] = dados; gravar(tudo); }

  // Sequência atual (dias seguidos com acerto até hoje ou ontem) e a melhor de todas.
  function sequencias(dias, dia = hoje()) {
    let atual = 0;
    let d = dias[dia] && dias[dia].acertou ? dia : diaAnterior(dia);
    while (dias[d] && dias[d].acertou) { atual++; d = diaAnterior(d); }
    let melhor = 0, corrida = 0, anterior = null;
    Object.keys(dias).sort().forEach(k => {
      corrida = dias[k].acertou ? (anterior && diaAnterior(k) === anterior && dias[anterior].acertou ? corrida + 1 : 1) : 0;
      melhor = Math.max(melhor, corrida);
      anterior = k;
    });
    return { atual, melhor };
  }

  return { CHANCES, hoje, hash, jogadorDoDia, doCampeonato, salvar, sequencias };
})();

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  const esc = DB.Util.escapar;
  const comp = DB.Contexto.get();
  document.getElementById('eyebrow-quiz').textContent = `Desafio diário · ${comp.curto} ${comp.temporada}`;
  const normalizar = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  const jogadores = DB.Jogadores.all();
  const dia = Quiz.hoje();
  let dados = Quiz.doCampeonato(comp.id);
  let treino = null;   // { alvo, tentativas } quando está treinando
  const linhas = Object.fromEntries(DB.Estatisticas.porJogador().map(l => [l.jogador.id, l]));

  const doDia = Quiz.jogadorDoDia(jogadores, comp.id, dia);
  if (!doDia) {
    document.getElementById('quiz').innerHTML = UI.vazio('Sem jogadores neste campeonato', '');
    UI.montarFooter();
    return;
  }
  const partidaDoDia = () => (dados.dias[dia] || (dados.dias[dia] = { tentativas: [], acertou: false }));
  const atual = () => (treino ? { alvo: treino.alvo, ...treino } : { alvo: doDia, ...partidaDoDia() });

  // Dicas na ordem em que aparecem: do mais vago ao quase entregue.
  function dicas(j) {
    const time = DB.Times.get(j.timeId);
    const ehClube = time && time.tipo === 'clube';
    const l = linhas[j.id];
    const lista = [`Joga como <b>${esc(j.posicao)}</b>${j.idade ? ` e tem <b>${j.idade} anos</b>` : ''}.`];
    if (!ehClube && j.clube) lista.push(`Atua no clube <b>${esc(j.clube)}</b>.`);
    if (ehClube && j.nacionalidade) lista.push(`É de ${UI.bandeiraPais(j.nacionalidade)} <b>${esc(UI.nomePais(j.nacionalidade))}</b>.`);
    if (!ehClube && time) lista.push(`A seleção dele é da <b>${esc(time.confederacao || '')}</b>${time.grupo ? ` e está no <b>Grupo ${time.grupo}</b>` : ''}.`);
    if (l && (l.gols || l.assistencias || l.jogos)) lista.push(`No campeonato: <b>${l.jogos}</b> jogo${l.jogos === 1 ? '' : 's'}, <b>${l.gols}</b> gol${l.gols === 1 ? '' : 's'} e <b>${l.assistencias}</b> assistência${l.assistencias === 1 ? '' : 's'}.`);
    else if (j.jogosSelecao) lista.push(`Tem <b>${j.jogosSelecao}</b> jogos e <b>${j.golsSelecao || 0}</b> gols pela seleção.`);
    if (j.numero != null) lista.push(`Usa a camisa <b>${j.numero}</b>${j.capitao ? ' e é o <b>capitão</b>' : ''}.`);
    if (time) lista.push(`Joga ${ehClube ? 'no' : 'pela'} ${UI.bandeira(time, 'sm')} <b>${esc(time.nome)}</b>.`);
    lista.push(`O nome começa com <b>${esc(j.nome.trim()[0])}</b> e tem <b>${j.nome.trim().split(/\s+/).length}</b> palavra${j.nome.trim().split(/\s+/).length === 1 ? '' : 's'}.`);
    // Seis dicas: se faltou alguma, a última (iniciais) cobre; se sobrou, as do meio saem.
    while (lista.length > Quiz.CHANCES) lista.splice(lista.length - 3, 1);
    return lista;
  }

  // Comparação de um palpite com o jogador certo.
  function comparar(palpite, alvo) {
    const seta = (a, b) => (a == null || b == null ? '' : a === b ? '' : a < b ? ' ↑' : ' ↓');
    const ok = cond => (cond ? ' ok' : '');
    const tp = DB.Times.get(palpite.timeId);
    return `<span class="quiz-chip${ok(palpite.timeId === alvo.timeId)}">${UI.bandeira(tp, 'sm')} ${tp ? esc(tp.codigo) : '—'}</span>
      <span class="quiz-chip${ok(palpite.posicao === alvo.posicao)}">${esc(palpite.posicao)}</span>
      ${palpite.idade != null && alvo.idade != null ? `<span class="quiz-chip${ok(palpite.idade === alvo.idade)}">${palpite.idade} anos${seta(palpite.idade, alvo.idade)}</span>` : ''}
      ${palpite.numero != null && alvo.numero != null ? `<span class="quiz-chip${ok(palpite.numero === alvo.numero)}">nº ${palpite.numero}${seta(palpite.numero, alvo.numero)}</span>` : ''}`;
  }

  function render() {
    const p = atual();
    const alvo = p.alvo;
    const acabou = p.acertou || p.tentativas.length >= Quiz.CHANCES;
    const listaDicas = dicas(alvo);
    const abertas = acabou ? listaDicas.length : Math.min(listaDicas.length, p.tentativas.length + 1);
    document.getElementById('quiz-titulo').textContent = treino ? 'Treino (não conta na sequência)' : `Jogador do dia · ${DB.Util.formatarData(`${dia}T12:00`)}`;
    document.getElementById('quiz-tentativas').textContent = `${p.tentativas.length}/${Quiz.CHANCES} chances usadas`;

    const final = acabou ? `<div class="quiz-final${p.acertou ? ' acertou' : ''}">
        <div class="quiz-revelado">${UI.avatar(alvo)}<div><small>${p.acertou ? `Acertou em ${p.tentativas.length}!` : 'Não foi desta vez. Era:'}</small>
          <a href="jogador.html?id=${alvo.id}"><b>${esc(alvo.nome)}</b></a><span>${UI.bandeira(DB.Times.get(alvo.timeId), 'sm')} ${esc((DB.Times.get(alvo.timeId) || {}).nome || '')} · ${esc(alvo.posicao)}</span></div></div>
        <div class="quiz-acoes">
          ${treino ? '' : `<button type="button" class="btn btn-primary" id="quiz-compartilhar">${UI.icone('link')} Compartilhar resultado</button>`}
          <button type="button" class="btn btn-ghost" id="quiz-treinar">${UI.icone('dado')} ${treino ? 'Outro jogador' : 'Treinar com outro'}</button>
          ${treino ? `<button type="button" class="btn btn-ghost" id="quiz-voltar">${UI.icone('voltar')} Voltar ao do dia</button>` : ''}
        </div>
        ${treino ? '' : '<p class="grafico-nota">Um jogador novo aparece amanhã.</p>'}
      </div>` : `<form class="quiz-palpite" id="quiz-form" autocomplete="off">
        <div class="quiz-campo">
          <input type="text" id="quiz-input" placeholder="Digite o nome de um jogador…" aria-label="Seu palpite" aria-autocomplete="list" aria-controls="quiz-sugestoes" role="combobox" aria-expanded="false">
          <div class="quiz-sugestoes" id="quiz-sugestoes" role="listbox" hidden></div>
        </div>
        <button type="button" class="btn btn-ghost" id="quiz-pular">Pular (mais uma dica)</button>
      </form>`;

    document.getElementById('quiz').innerHTML = `
      <ol class="quiz-dicas">${listaDicas.map((d, i) => `<li class="${i < abertas ? 'aberta' : ''}"><span class="quiz-n">${i + 1}</span><span>${i < abertas ? d : 'Dica bloqueada'}</span></li>`).join('')}</ol>
      ${final}
      ${p.tentativas.length ? `<ul class="quiz-historico">${p.tentativas.map(id => {
        const j = id ? DB.Jogadores.get(id) : null;
        if (!j) return '<li class="pulou"><span class="quiz-x">—</span><span>Pulou</span></li>';
        const certo = j.id === alvo.id;
        return `<li class="${certo ? 'certo' : ''}"><span class="quiz-x">${UI.icone(certo ? 'check' : 'fechar')}</span><b>${esc(j.nome)}</b><span class="quiz-chips">${certo ? '' : comparar(j, alvo)}</span></li>`;
      }).join('')}</ul>` : ''}`;
    renderStats();
    ligar();
  }

  function palpitar(id) {
    const p = treino || partidaDoDia();
    if (p.acertou || p.tentativas.length >= Quiz.CHANCES) return;
    p.tentativas.push(id);
    const alvo = treino ? treino.alvo : doDia;
    if (id === alvo.id) {
      p.acertou = true;
      UI.confete({ cores: [DB.Util.coresTime(DB.Times.get(alvo.timeId)).primaria, '#f4c64e', '#ffffff'] });
    }
    if (!treino) Quiz.salvar(comp.id, dados);
    render();
    document.getElementById('quiz-input')?.focus();
  }

  function ligar() {
    const input = document.getElementById('quiz-input');
    if (input) {
      const caixa = document.getElementById('quiz-sugestoes');
      let ativo = 0, achados = [];
      const usados = new Set(atual().tentativas);
      const mostrar = () => {
        caixa.hidden = !achados.length;
        input.setAttribute('aria-expanded', achados.length ? 'true' : 'false');
        caixa.innerHTML = achados.map((j, i) => {
          const t = DB.Times.get(j.timeId);
          return `<button type="button" role="option" class="quiz-sug${i === ativo ? ' ativo' : ''}" data-id="${j.id}" aria-selected="${i === ativo}">${UI.bandeira(t, 'sm')}<b>${esc(j.nome)}</b><small>${t ? esc(t.codigo) : ''} · ${esc(j.posicao)}</small></button>`;
        }).join('');
      };
      input.addEventListener('input', () => {
        const t = normalizar(input.value);
        ativo = 0;
        achados = t.length < 2 ? [] : jogadores.filter(j => !usados.has(j.id) && normalizar(j.nome).split(/\s+/).some(p => p.startsWith(t) || normalizar(j.nome).startsWith(t)))
          .sort((a, b) => (normalizar(a.nome).startsWith(t) ? 0 : 1) - (normalizar(b.nome).startsWith(t) ? 0 : 1) || a.nome.localeCompare(b.nome)).slice(0, 8);
        mostrar();
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown' && achados.length) { ativo = (ativo + 1) % achados.length; mostrar(); e.preventDefault(); }
        if (e.key === 'ArrowUp' && achados.length) { ativo = (ativo - 1 + achados.length) % achados.length; mostrar(); e.preventDefault(); }
        if (e.key === 'Escape') { achados = []; mostrar(); }
      });
      caixa.addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) palpitar(b.dataset.id); });
      document.getElementById('quiz-form').addEventListener('submit', e => { e.preventDefault(); if (achados[ativo]) palpitar(achados[ativo].id); });
      document.getElementById('quiz-pular').addEventListener('click', () => palpitar(null));
    }
    document.getElementById('quiz-treinar')?.addEventListener('click', () => {
      const lista = jogadores.filter(j => j.id !== doDia.id);
      treino = { alvo: lista[Math.floor(Math.random() * lista.length)], tentativas: [], acertou: false };
      render();
      document.getElementById('quiz-input')?.focus();
    });
    document.getElementById('quiz-voltar')?.addEventListener('click', () => { treino = null; render(); });
    document.getElementById('quiz-compartilhar')?.addEventListener('click', async () => {
      const p = partidaDoDia();
      const quadros = p.tentativas.map(id => (id === doDia.id ? '🟩' : id ? '🟥' : '⬜')).join('');
      const texto = `FUTSTATS · Quiz do dia ${DB.Util.formatarData(`${dia}T12:00`).slice(0, 5)} (${comp.curto})\n${p.acertou ? `${p.tentativas.length}/${Quiz.CHANCES}` : `X/${Quiz.CHANCES}`} ${quadros}\n${location.origin}${location.pathname}?c=${comp.id}`;
      try { if (navigator.share) { await navigator.share({ text: texto }); return; } } catch (e) { if (e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(texto); document.getElementById('quiz-compartilhar').innerHTML = `${UI.icone('check')} Copiado!`; } catch (e) { prompt('Copie o resultado:', texto); }
    });
  }

  function renderStats() {
    const dias = Object.values(dados.dias).filter(d => d.acertou || d.tentativas.length >= Quiz.CHANCES);
    const acertos = dias.filter(d => d.acertou);
    const { atual: seq, melhor } = Quiz.sequencias(dados.dias, dia);
    const dist = Array.from({ length: Quiz.CHANCES }, (_, i) => acertos.filter(d => d.tentativas.length === i + 1).length);
    const max = Math.max(1, ...dist, dias.length - acertos.length);
    const barra = (rotulo, n, destaque) => `<div class="quiz-dist-linha"><span>${rotulo}</span><span class="quiz-dist-barra${destaque ? ' destaque' : ''}" style="width:${Math.max(8, (n / max) * 100)}%">${n}</span></div>`;
    const hojeP = dados.dias[dia];
    document.getElementById('quiz-stats').innerHTML = `
      <div class="quiz-numeros">
        <div><b>${dias.length}</b><span>jogados</span></div>
        <div><b>${dias.length ? Math.round((acertos.length * 100) / dias.length) : 0}%</b><span>acertos</span></div>
        <div><b>${seq}</b><span>sequência</span></div>
        <div><b>${melhor}</b><span>melhor</span></div>
      </div>
      <div class="quiz-dist" aria-label="Em quantas chances você acertou">
        ${dist.map((n, i) => barra(i + 1, n, hojeP && hojeP.acertou && hojeP.tentativas.length === i + 1)).join('')}
        ${barra('X', dias.length - acertos.length, hojeP && !hojeP.acertou && hojeP.tentativas.length >= Quiz.CHANCES)}
      </div>`;
  }

  render();
  UI.montarFooter();
});
