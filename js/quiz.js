// Quiz "Quem é o jogador?": um jogador por dia (o mesmo para todo mundo, sorteado pela data
// e pelo campeonato), seis chances e uma dica nova a cada erro. Cada palpite errado mostra
// o que ele tem em comum com o jogador do dia (time, posição, idade, número).
//
// Três modos:
//   · valendo ranking (banco ligado + conta): o jogador do dia fica só no banco; cada palpite
//     é conferido lá (quiz_tentar) e o navegador nunca sabe a resposta antes do fim;
//   · local (sem conta ou sem banco): tudo no navegador, não entra no ranking;
//   · treino: jogador aleatório, não conta em nada.
const Quiz = (() => {
  const CHAVE = 'fs_quiz';
  const CHANCES = 6;

  const hoje = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const somarDias = (dia, n) => { const d = new Date(`${dia}T12:00`); d.setDate(d.getDate() + n); return hoje(d); };
  const diaAnterior = dia => somarDias(dia, -1);

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

  // Dicas em texto simples: **negrito** e § onde entra a bandeira (time ou país).
  // `linhas` (opcional): números do jogador no campeonato, para a dica de estatística.
  function dicasDe(j, linhas = {}) {
    const time = DB.Times.get(j.timeId);
    const ehClube = time && time.tipo === 'clube';
    const l = linhas[j.id];
    const nomePais = iso => (typeof UI !== 'undefined' ? UI.nomePais(iso) : iso.toUpperCase());
    const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
    const lista = [{ t: `Joga como **${j.posicao}**${j.idade ? ` e tem **${j.idade} anos**` : ''}.` }];
    if (!ehClube && j.clube) lista.push({ t: `Atua no clube **${j.clube}**.` });
    if (ehClube && j.nacionalidade) lista.push({ t: `É de § **${nomePais(j.nacionalidade)}**.`, pais: j.nacionalidade });
    if (!ehClube && time) lista.push({ t: `A seleção dele é da **${time.confederacao || ''}**${time.grupo ? ` e está no **Grupo ${time.grupo}**` : ''}.` });
    if (l && (l.gols || l.assistencias || l.jogos)) lista.push({ t: `No campeonato: **${plural(l.jogos, 'jogo', 'jogos')}**, **${plural(l.gols, 'gol', 'gols')}** e **${plural(l.assistencias, 'assistência', 'assistências')}**.` });
    else if (j.jogosSelecao) lista.push({ t: `Tem **${j.jogosSelecao}** jogos e **${j.golsSelecao || 0}** gols pela seleção.` });
    if (j.numero != null) lista.push({ t: `Usa a camisa **${j.numero}**${j.capitao ? ' e é o **capitão**' : ''}.` });
    if (time) lista.push({ t: `Joga ${ehClube ? 'no' : 'pela'} § **${time.nome}**.`, time: time.id });
    const palavras = j.nome.trim().split(/\s+/).length;
    lista.push({ t: `O nome começa com **${j.nome.trim()[0]}** e tem **${plural(palavras, 'palavra', 'palavras')}**.` });
    // Seis dicas: se sobrou, saem as do meio (a do time e a do nome ficam por último).
    while (lista.length > CHANCES) lista.splice(lista.length - 3, 1);
    return lista;
  }

  const atributos = j => ({ timeId: j.timeId, posicao: j.posicao, idade: j.idade ?? null, numero: j.numero ?? null });

  // Comparação de um palpite com o jogador certo, no mesmo formato que o banco devolve.
  // idade/numero: 1 = o certo tem mais, -1 = menos, 0 = igual, null = sem dado.
  function comparar(palpite, alvo) {
    const sinal = (a, b) => (a == null || b == null ? null : Math.sign(a - b));
    return {
      id: palpite.id, certo: palpite.id === alvo.id, time: palpite.timeId === alvo.timeId, posicao: palpite.posicao === alvo.posicao,
      idade: sinal(alvo.idade, palpite.idade), numero: sinal(alvo.numero, palpite.numero),
    };
  }

  // Linha da tabela quiz_desafios (sem estatísticas do campeonato: o desafio é montado antes do dia).
  // O jogador é sorteado AO ACASO (não pelo hash do dia): assim a resposta do modo valendo
  // ranking não pode ser calculada a partir do código do site — ela só existe no banco.
  function desafio(jogadores, compId, dia) {
    const lista = candidatos(jogadores);
    if (!lista.length) return null;
    const sorteio = new Uint32Array(1);
    crypto.getRandomValues(sorteio);
    const j = lista[sorteio[0] % lista.length];
    if (!j) return null;
    return {
      competicao_id: compId, dia, jogador_id: j.id, atributos: atributos(j), dicas: dicasDe(j),
      resposta: { id: j.id, nome: j.nome, timeId: j.timeId, posicao: j.posicao },
    };
  }

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

  return { CHANCES, hoje, somarDias, hash, jogadorDoDia, dicasDe, atributos, comparar, desafio, doCampeonato, salvar, sequencias };
})();

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('quiz')) return;   // o painel carrega este arquivo só pelo módulo Quiz
  UI.montarTopbar();
  const esc = DB.Util.escapar;
  const comp = DB.Contexto.get();
  document.getElementById('eyebrow-quiz').textContent = `Desafio diário · ${comp.curto} ${comp.temporada}`;
  const normalizar = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  const jogadores = DB.Jogadores.all();
  const dia = Quiz.hoje();
  let dados = Quiz.doCampeonato(comp.id);
  let treino = null;       // { alvo, tentativas, acertou } quando está treinando
  let servidor = null;     // estado vindo do banco quando o jogo vale ranking
  let aviso = '';          // por que este jogo não vale ranking
  let esperando = false;   // palpite a caminho do banco
  const linhas = Object.fromEntries(DB.Estatisticas.porJogador().map(l => [l.jogador.id, l]));

  const doDia = Quiz.jogadorDoDia(jogadores, comp.id, dia);
  if (!doDia) {
    document.getElementById('quiz').innerHTML = UI.vazio('Sem jogadores neste campeonato', '');
    UI.montarFooter();
    return;
  }
  const partidaDoDia = () => (dados.dias[dia] || (dados.dias[dia] = { tentativas: [], acertou: false }));

  // Dica em HTML: texto escapado, **negrito** e a bandeira no lugar do §.
  function dicaHtml(d) {
    const bandeira = d.time ? UI.bandeira(DB.Times.get(d.time), 'sm') : d.pais ? UI.bandeiraPais(d.pais) : '';
    return esc(d.t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace('§', bandeira);
  }

  // O que está na tela, igual para os três modos.
  function partida() {
    if (treino) {
      return { dicas: Quiz.dicasDe(treino.alvo, linhas), total: Quiz.CHANCES, jogadas: treino.tentativas.map(id => (id ? Quiz.comparar(DB.Jogadores.get(id), treino.alvo) : { id: null })),
        acertou: treino.acertou, fim: treino.acertou || treino.tentativas.length >= Quiz.CHANCES, resposta: treino.alvo };
    }
    if (servidor) {
      return { dicas: servidor.dicas, total: servidor.totalDicas, jogadas: servidor.jogadas, acertou: servidor.acertou, fim: servidor.fim,
        resposta: servidor.resposta ? (DB.Jogadores.get(servidor.resposta.id) || { ...servidor.resposta, numero: null }) : null };
    }
    const p = partidaDoDia();
    const fim = p.acertou || p.tentativas.length >= Quiz.CHANCES;
    return { dicas: Quiz.dicasDe(doDia, linhas), total: Quiz.CHANCES, jogadas: p.tentativas.map(id => (id ? Quiz.comparar(DB.Jogadores.get(id), doDia) : { id: null })),
      acertou: p.acertou, fim, resposta: fim ? doDia : null };
  }

  // Chips do palpite errado: o que ele tem em comum com o jogador certo.
  function chips(j, c) {
    const ok = cond => (cond ? ' ok' : '');
    const seta = s => (s === 1 ? ' ↑' : s === -1 ? ' ↓' : '');
    const tp = DB.Times.get(j.timeId);
    return `<span class="quiz-chip${ok(c.time)}">${UI.bandeira(tp, 'sm')} ${tp ? esc(tp.codigo) : '—'}</span>
      <span class="quiz-chip${ok(c.posicao)}">${esc(j.posicao)}</span>
      ${j.idade != null && c.idade != null ? `<span class="quiz-chip${ok(c.idade === 0)}">${j.idade} anos${seta(c.idade)}</span>` : ''}
      ${j.numero != null && c.numero != null ? `<span class="quiz-chip${ok(c.numero === 0)}">nº ${j.numero}${seta(c.numero)}</span>` : ''}`;
  }

  function render() {
    const p = partida();
    const abertas = p.fim ? p.total : Math.min(p.total, p.jogadas.length + 1);
    const usadas = p.jogadas.length;
    document.getElementById('quiz-titulo').textContent = treino ? 'Treino (não conta na sequência)' : `Jogador do dia · ${DB.Util.formatarData(`${dia}T12:00`)}`;
    document.getElementById('quiz-tentativas').textContent = `${usadas}/${Quiz.CHANCES} chances usadas`;
    const alvo = p.resposta;
    const time = alvo ? DB.Times.get(alvo.timeId) : null;

    const final = p.fim && alvo ? `<div class="quiz-final${p.acertou ? ' acertou' : ''}">
        <div class="quiz-revelado">${UI.avatar(alvo)}<div><small>${p.acertou ? `Acertou em ${usadas}!` : 'Não foi desta vez. Era:'}</small>
          <a href="jogador.html?id=${alvo.id}"><b>${esc(alvo.nome)}</b></a><span>${UI.bandeira(time, 'sm')} ${esc(time ? time.nome : '')} · ${esc(alvo.posicao)}</span></div></div>
        <div class="quiz-acoes">
          ${treino ? '' : `<button type="button" class="btn btn-primary" id="quiz-compartilhar">${UI.icone('link')} Compartilhar resultado</button>`}
          <button type="button" class="btn btn-ghost" id="quiz-treinar">${UI.icone('dado')} ${treino ? 'Outro jogador' : 'Treinar com outro'}</button>
          ${treino ? `<button type="button" class="btn btn-ghost" id="quiz-voltar">${UI.icone('voltar')} Voltar ao do dia</button>` : ''}
        </div>
        ${treino ? '' : '<p class="grafico-nota">Um jogador novo aparece amanhã.</p>'}
      </div>` : `<form class="quiz-palpite" id="quiz-form" autocomplete="off">
        <div class="quiz-campo">
          <input type="text" id="quiz-input" placeholder="Digite o nome de um jogador…" aria-label="Seu palpite" aria-autocomplete="list" aria-controls="quiz-sugestoes" role="combobox" aria-expanded="false" ${esperando ? 'disabled' : ''}>
          <div class="quiz-sugestoes" id="quiz-sugestoes" role="listbox" hidden></div>
        </div>
        <button type="button" class="btn btn-ghost" id="quiz-pular" ${esperando ? 'disabled' : ''}>Pular (mais uma dica)</button>
      </form>`;

    const modo = treino ? '' : servidor ? `<p class="quiz-modo ok">${UI.icone('check')} Valendo ranking: a resposta é conferida no servidor.</p>`
      : aviso ? `<p class="quiz-modo">${UI.icone('aviso')} ${aviso}</p>` : '';
    document.getElementById('quiz').innerHTML = `${modo}
      <ol class="quiz-dicas">${Array.from({ length: p.total }, (_, i) => `<li class="${i < abertas ? 'aberta' : ''}"><span class="quiz-n">${i + 1}</span><span>${i < abertas && p.dicas[i] ? dicaHtml(p.dicas[i]) : 'Dica bloqueada'}</span></li>`).join('')}</ol>
      ${final}
      ${usadas ? `<ul class="quiz-historico">${p.jogadas.map(c => {
        const j = c.id ? DB.Jogadores.get(c.id) : null;
        if (!j) return '<li class="pulou"><span class="quiz-x">—</span><span>Pulou</span></li>';
        return `<li class="${c.certo ? 'certo' : ''}"><span class="quiz-x">${UI.icone(c.certo ? 'check' : 'fechar')}</span><b>${esc(j.nome)}</b><span class="quiz-chips">${c.certo ? '' : chips(j, c)}</span></li>`;
      }).join('')}</ul>` : ''}`;
    renderStats();
    ligar();
  }

  const festejar = timeId => UI.confete({ cores: [DB.Util.coresTime(DB.Times.get(timeId)).primaria, '#f4c64e', '#ffffff'] });

  // O resultado do banco também fica guardado aqui (estatísticas e o atalho da página inicial).
  function espelhar() {
    dados.dias[dia] = { tentativas: servidor.jogadas.map(c => c.id), acertou: servidor.acertou };
    Quiz.salvar(comp.id, dados);
  }

  async function palpitar(id) {
    if (esperando) return;
    if (servidor && !treino) {
      if (servidor.fim) return;
      esperando = true;
      render();
      try {
        const j = id ? DB.Jogadores.get(id) : null;
        servidor = await Nuvem.quizTentar(comp.id, dia, id, j ? Quiz.atributos(j) : null);
        espelhar();
        if (servidor.acertou && servidor.resposta) festejar(servidor.resposta.timeId);
        if (servidor.fim) renderRanking();
      } catch (e) { aviso = e.message; }
      esperando = false;
      render();
      document.getElementById('quiz-input')?.focus();
      return;
    }
    const p = treino || partidaDoDia();
    if (p.acertou || p.tentativas.length >= Quiz.CHANCES) return;
    p.tentativas.push(id);
    const alvo = treino ? treino.alvo : doDia;
    if (id === alvo.id) { p.acertou = true; festejar(alvo.timeId); }
    if (!treino) Quiz.salvar(comp.id, dados);
    render();
    document.getElementById('quiz-input')?.focus();
  }

  function ligar() {
    const input = document.getElementById('quiz-input');
    if (input) {
      const caixa = document.getElementById('quiz-sugestoes');
      let ativo = 0, achados = [];
      const usados = new Set(partida().jogadas.map(c => c.id));
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
      const p = partida();
      const quadros = p.jogadas.map(c => (c.certo ? '🟩' : c.id ? '🟥' : '⬜')).join('');
      const texto = `FUTSTATS · Quiz do dia ${DB.Util.formatarData(`${dia}T12:00`).slice(0, 5)} (${comp.curto})\n${p.acertou ? `${p.jogadas.length}/${Quiz.CHANCES}` : `X/${Quiz.CHANCES}`} ${quadros}\n${location.origin}${location.pathname}?c=${comp.id}`;
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

  // ---------- Ranking online (com o banco de dados ligado) ----------
  const online = typeof Nuvem !== 'undefined' && Nuvem.ativa;
  async function renderRanking() {
    const caixa = document.getElementById('quiz-ranking');
    document.getElementById('painel-quiz-ranking').hidden = false;
    const entrar = Nuvem.usuario ? '' : `<div class="quiz-entrar"><p class="grafico-nota">Entre com uma conta para jogar valendo ranking e guardar sua sequência em qualquer aparelho.</p>
      <button type="button" class="btn btn-primary btn-sm" id="quiz-btn-entrar">${UI.icone('usuario')} Entrar ou criar conta</button></div>`;
    try {
      const lista = await Nuvem.rankingQuiz(comp.id, dia);
      const meu = Nuvem.usuario && Nuvem.usuario.id;
      document.getElementById('quiz-ranking-resumo').textContent = `${lista.filter(l => l.tentativas_hoje).length} jogaram hoje`;
      const hoje = l => (!l.tentativas_hoje ? '<span class="dim">—</span>' : l.acertou_hoje ? `<span class="quiz-hoje ok">${l.tentativas_hoje}/6</span>` : '<span class="quiz-hoje">X/6</span>');
      caixa.innerHTML = entrar + (lista.length ? `<div class="table-scroll"><table class="stats-table">
        <caption class="sr-only">Ranking do quiz</caption>
        <thead><tr><th scope="col">#</th><th scope="col" class="left">Jogador</th><th scope="col" class="strong" title="Dias seguidos acertando">Seq.</th><th scope="col" title="Acertos / dias jogados">Acertos</th><th scope="col">Hoje</th></tr></thead>
        <tbody>${lista.slice(0, 30).map((l, i) => `<tr${l.user_id === meu ? ' class="destaque-time"' : ''}><td class="pos">${i + 1}</td>
          <td class="left"><b>${esc(l.nome)}</b>${l.melhor > l.sequencia ? `<br><small class="dim">melhor: ${l.melhor}</small>` : ''}</td>
          <td class="strong">${l.sequencia}</td><td>${l.acertos}/${l.jogados}</td><td>${hoje(l)}</td></tr>`).join('')}</tbody></table></div>`
        : '<p class="grafico-nota" style="padding:12px 18px;">Ninguém no ranking ainda.</p>');
    } catch (e) {
      caixa.innerHTML = `${entrar}<p class="grafico-nota" style="padding:12px 18px;">${esc(e.message)}</p>`;
    }
    document.getElementById('quiz-btn-entrar')?.addEventListener('click', () => Nuvem.abrirConta());
  }
  if (online) {
    let quem;
    const aoMudarConta = async () => {
      const agora = Nuvem.usuario ? Nuvem.usuario.id : null;
      if (agora === quem) return;
      quem = agora;
      dados = Quiz.doCampeonato(comp.id);
      servidor = null;
      aviso = '';
      if (agora) {
        try {
          servidor = await Nuvem.quizEstado(comp.id, dia);
          if (servidor) espelhar();
          else aviso = 'O desafio de hoje ainda não foi preparado no banco: dá para jogar, mas sem valer ranking.';
        } catch (e) { aviso = `Sem conexão com o ranking agora (${e.message}). Jogando só neste aparelho.`; }
      }
      render();
      renderRanking();
    };
    Nuvem.pronta.then(ok => { if (ok) { aoMudarConta(); Nuvem.aoMudar(aoMudarConta); } });
  }

  render();
  UI.montarFooter();
});
