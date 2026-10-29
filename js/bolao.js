// Bolão sem servidor: os palpites ficam neste navegador e viajam por link
// (bolao.html?c=<campeonato>#p=<palpites em base64url>). Quem abre o link de um amigo
// pode adicioná-lo ao ranking local; reabrir um link mais novo atualiza os palpites dele.
const Bolao = (() => {
  const CHAVE = 'fs_bolao';
  const CHAVE_NOME = 'fs_bolao_nome';

  // Placar exato 10 · vencedor (ou empate) e saldo 7 · só o vencedor/empate 5 · resto 0.
  function pontos(palpite, jogo) {
    if (!palpite || jogo.golsMandante == null || jogo.golsVisitante == null) return null;
    const [a, b] = palpite.map(Number), x = jogo.golsMandante, y = jogo.golsVisitante;
    if (a === x && b === y) return 10;
    if (Math.sign(a - b) !== Math.sign(x - y)) return 0;
    return a - b === x - y ? 7 : 5;
  }

  // Texto ↔ base64url (UTF-8, para nomes com acento).
  function paraBase64(texto) {
    const bytes = new TextEncoder().encode(texto);
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function deBase64(codigo) {
    const bin = atob(codigo.replace(/-/g, '+').replace(/_/g, '/'));
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  }

  function codificar({ nome, compId, palpites }) {
    const p = Object.entries(palpites).map(([id, [a, b]]) => [id, Number(a), Number(b)]);
    return paraBase64(JSON.stringify({ v: 1, c: compId, n: nome, p, t: Date.now() }));
  }

  // Devolve { nome, compId, palpites, em } ou null se o link estiver estragado.
  function decodificar(codigo) {
    try {
      const d = JSON.parse(deBase64(codigo));
      if (d.v !== 1 || typeof d.n !== 'string' || !Array.isArray(d.p)) return null;
      const palpites = {};
      d.p.forEach(([id, a, b]) => {
        if (typeof id === 'string' && Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= 0 && a <= 20 && b <= 20) palpites[id] = [a, b];
      });
      return { nome: d.n.slice(0, 24).trim() || 'Amigo', compId: d.c, palpites, em: Number(d.t) || 0 };
    } catch (e) { return null; }
  }

  // Totais de um participante nos jogos encerrados.
  function resumo(palpites, jogos) {
    const r = { pontos: 0, exatos: 0, acertos: 0, palpitados: 0, avaliados: 0 };
    jogos.forEach(j => {
      const p = palpites[j.id];
      if (!p) return;
      r.palpitados++;
      if (j.status !== 'encerrado') return;
      const pts = pontos(p, j);
      if (pts == null) return;
      r.avaliados++;
      r.pontos += pts;
      if (pts === 10) r.exatos++;
      if (pts > 0) r.acertos++;
    });
    return r;
  }

  // Conquistas do participante: [{ id, titulo, descricao, icone, ok, progresso }].
  // `lider`: está em 1º no ranking com ao menos um amigo.
  function conquistas(palpites, jogos, { lider = false } = {}) {
    const r = resumo(palpites, jogos);
    // Maior sequência de jogos seguidos (por data) pontuando.
    let seguidos = 0, melhor = 0;
    [...jogos].filter(j => j.status === 'encerrado' && palpites[j.id] && pontos(palpites[j.id], j) != null)
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .forEach(j => { seguidos = pontos(palpites[j.id], j) > 0 ? seguidos + 1 : 0; melhor = Math.max(melhor, seguidos); });
    const meta = (id, titulo, descricao, icone, valor, alvo) => ({ id, titulo, descricao, icone, ok: valor >= alvo, progresso: `${Math.min(valor, alvo)}/${alvo}` });
    return [
      meta('estreia', 'Estreia', 'Fazer o primeiro palpite', 'dado', r.palpitados, 1),
      meta('palpiteiro', 'Palpiteiro', 'Palpitar 20 jogos', 'prancheta', r.palpitados, 20),
      meta('mosca', 'Na mosca', 'Cravar um placar exato', 'assistencia', r.exatos, 1),
      meta('vidente', 'Vidente', 'Cravar 5 placares exatos', 'estrela-cheia', r.exatos, 5),
      meta('embalado', 'Embalado', 'Pontuar em 5 jogos seguidos', 'raio', melhor, 5),
      meta('centenario', 'Centenário', 'Somar 100 pontos', 'trofeu', r.pontos, 100),
      { id: 'lider', titulo: 'Líder', descricao: 'Ficar em 1º com amigos no ranking', icone: 'medalha', ok: lider, progresso: lider ? '1º' : '—' },
    ];
  }

  function lerTudo() {
    try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { return {}; }
  }
  function gravarTudo(dados) {
    try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch (e) { /* sem armazenamento: só nesta visita */ }
  }
  const doCampeonato = compId => ({ palpites: {}, amigos: [], ...(lerTudo()[compId] || {}) });
  function salvarCampeonato(compId, dados) {
    const tudo = lerTudo();
    tudo[compId] = dados;
    gravarTudo(tudo);
  }
  const nome = () => { try { return localStorage.getItem(CHAVE_NOME) || ''; } catch (e) { return ''; } };
  const definirNome = n => { try { localStorage.setItem(CHAVE_NOME, n); } catch (e) { /* idem */ } };

  return { pontos, codificar, decodificar, resumo, conquistas, doCampeonato, salvarCampeonato, nome, definirNome };
})();

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
  const esc = DB.Util.escapar;
  UI.montarTopbar();
  UI.montarTicker();
  DB.MataMata.sincronizar();
  const comp = DB.Contexto.get();
  document.getElementById('eyebrow-bolao').textContent = `${comp.curto} ${comp.temporada}`;
  document.getElementById('page-title').textContent = `Bolão · ${comp.curto} ${comp.temporada} — FUTSTATS`;

  let dados = Bolao.doCampeonato(comp.id);
  const salvar = () => Bolao.salvarCampeonato(comp.id, dados);
  const jogos = DB.Jogos.all().filter(j => j.mandanteId && j.visitanteId).sort((a, b) => new Date(a.data) - new Date(b.data));
  const aberto = j => j.status === 'agendado';
  let filtro = 'abertos';

  const campoNome = document.getElementById('bolao-nome');
  campoNome.value = Bolao.nome();
  campoNome.addEventListener('input', () => { Bolao.definirNome(campoNome.value.trim()); renderRanking(); });
  const aviso = texto => { document.getElementById('bolao-aviso').textContent = texto; };

  // ---------- Convite: link com os palpites de um amigo ----------
  const codigo = (location.hash.match(/^#p=([\w-]+)/) || [])[1];
  if (codigo) {
    const amigo = Bolao.decodificar(codigo);
    const caixa = document.getElementById('bolao-convite');
    caixa.hidden = false;
    if (!amigo || amigo.compId !== comp.id) {
      caixa.innerHTML = `<p>${UI.icone('aviso')} ${amigo ? 'Este link é de outro campeonato.' : 'Não consegui ler este link de bolão.'}</p>`;
    } else {
      const qtd = Object.keys(amigo.palpites).length;
      const jaTem = dados.amigos.find(a => a.nome.toLowerCase() === amigo.nome.toLowerCase());
      caixa.innerHTML = `<p><b>${esc(amigo.nome)}</b> compartilhou ${qtd} palpite${qtd === 1 ? '' : 's'} do ${esc(comp.curto)}.${jaTem ? ' Já está no seu ranking: adicionar de novo atualiza os palpites.' : ''}</p>
        <div class="bolao-acoes"><button type="button" class="btn btn-primary" id="btn-aceitar">${jaTem ? 'Atualizar' : 'Adicionar ao ranking'}</button>
        <button type="button" class="btn btn-ghost" id="btn-recusar">Agora não</button></div>`;
      document.getElementById('btn-aceitar').addEventListener('click', () => {
        dados.amigos = dados.amigos.filter(a => a.nome.toLowerCase() !== amigo.nome.toLowerCase());
        dados.amigos.push({ nome: amigo.nome, palpites: amigo.palpites, em: amigo.em });
        salvar();
        caixa.innerHTML = `<p>${UI.icone('check')} ${esc(amigo.nome)} entrou no ranking.</p>`;
        renderRanking();
      });
      document.getElementById('btn-recusar').addEventListener('click', () => { caixa.hidden = true; });
    }
    history.replaceState(null, '', location.pathname + location.search);
  }

  // ---------- Jogos e palpites ----------
  function renderJogos() {
    const lista = jogos.filter(j => filtro === 'todos' || (filtro === 'abertos' ? aberto(j) : !aberto(j)));
    const mount = document.getElementById('bolao-jogos');
    if (!lista.length) {
      mount.innerHTML = UI.vazio(filtro === 'abertos' ? 'Nenhum jogo aberto para palpite' : 'Nenhum jogo aqui ainda',
        filtro === 'abertos' ? 'Os jogos agendados no painel aparecem aqui.' : '');
      return;
    }
    let dia = '';
    mount.innerHTML = lista.map(j => {
      const m = DB.Times.get(j.mandanteId), v = DB.Times.get(j.visitanteId);
      const p = dados.palpites[j.id] || ['', ''];
      const cabecalho = j.data.slice(0, 10) !== dia ? `<div class="day-head">${DB.Util.formatarDiaLongo(j.data)}</div>` : '';
      dia = j.data.slice(0, 10);
      const campo = i => aberto(j)
        ? `<input type="number" min="0" max="20" inputmode="numeric" data-id="${j.id}" data-i="${i}" value="${p[i] ?? ''}" class="${p[i] !== '' ? 'palpite' : ''}" aria-label="Gols ${esc(i ? v.nome : m.nome)}">`
        : `<input value="${p[i] ?? ''}" disabled aria-label="Seu palpite">`;
      let extra = `<span class="bolao-hora">${DB.Util.formatarHora(j.data)}</span>`;
      if (!aberto(j)) {
        const real = UI.temPlacar(j) ? `${j.golsMandante}–${j.golsVisitante}` : '—';
        const pts = j.status === 'encerrado' ? Bolao.pontos(dados.palpites[j.id], j) : null;
        extra = `<a class="bolao-real" href="jogo.html?id=${j.id}" title="Placar real">${j.status === 'ao_vivo' ? '<span class="live-dot"></span>' : ''}${real}</a>
          ${pts != null ? `<span class="bolao-pts bolao-pts-${pts}">+${pts}</span>` : dados.palpites[j.id] ? '' : '<span class="bolao-pts">sem palpite</span>'}`;
      }
      return `${cabecalho}<div class="sim-match bolao-jogo${aberto(j) ? '' : ' real'}">
        <span class="team-inline home"><span class="nome">${esc(m.nome)}</span>${UI.bandeira(m, 'sm')}</span>
        ${campo(0)}<span class="x">×</span>${campo(1)}
        <span class="team-inline">${UI.bandeira(v, 'sm')}<span class="nome">${esc(v.nome)}</span></span>
        <span class="bolao-extra">${extra}</span>
      </div>`;
    }).join('');
    mount.querySelectorAll('input[data-id]').forEach(input => input.addEventListener('input', () => {
      const id = input.dataset.id;
      const atual = dados.palpites[id] ? [...dados.palpites[id]] : ['', ''];
      atual[Number(input.dataset.i)] = input.value === '' ? '' : Math.max(0, Math.min(20, parseInt(input.value, 10) || 0));
      if (atual[0] === '' && atual[1] === '') delete dados.palpites[id];
      else dados.palpites[id] = atual;
      input.classList.toggle('palpite', input.value !== '');
      salvar();
      renderRanking();
    }));
  }

  document.querySelectorAll('#bolao-filtros .chip').forEach(b => b.addEventListener('click', () => {
    filtro = b.dataset.f;
    document.querySelectorAll('#bolao-filtros .chip').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b); });
    renderJogos();
  }));

  // ---------- Ranking ----------
  const completos = p => Object.fromEntries(Object.entries(p).filter(([, [a, b]]) => a !== '' && b !== ''));
  function renderRanking() {
    const participantes = [
      { nome: campoNome.value.trim() || 'Você', voce: true, palpites: completos(dados.palpites) },
      ...dados.amigos.map(a => ({ ...a, voce: false })),
    ].map(p => ({ ...p, ...Bolao.resumo(p.palpites, jogos) }))
      .sort((a, b) => b.pontos - a.pontos || b.exatos - a.exatos || b.acertos - a.acertos || a.nome.localeCompare(b.nome));
    const encerrados = jogos.filter(j => j.status === 'encerrado').length;
    document.getElementById('bolao-resumo').textContent = `${encerrados} jogo${encerrados === 1 ? '' : 's'} valendo`;
    document.getElementById('bolao-ranking').innerHTML = `<div class="table-scroll"><table class="stats-table">
      <caption class="sr-only">Ranking do bolão</caption>
      <thead><tr><th scope="col">#</th><th scope="col" class="left">Participante</th><th scope="col" class="strong">Pts</th><th scope="col" title="Placares exatos">Exatos</th><th scope="col" title="Palpites que pontuaram">Acertos</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead>
      <tbody>${participantes.map((p, i) => `<tr${p.voce ? ' class="destaque-time"' : ''}>
        <td class="pos">${i + 1}</td>
        <td class="left"><b>${esc(p.nome)}</b>${p.voce ? ' <small class="dim">(você)</small>' : ''}<br><small class="dim">${p.palpitados} palpite${p.palpitados === 1 ? '' : 's'}</small></td>
        <td class="strong">${p.pontos}</td><td>${p.exatos}</td><td>${p.acertos}</td>
        <td>${p.voce ? '' : `<button type="button" class="bolao-remover" data-nome="${esc(p.nome)}" aria-label="Remover ${esc(p.nome)} do ranking" title="Remover">${UI.icone('fechar')}</button>`}</td>
      </tr>`).join('')}</tbody></table></div>
      ${dados.amigos.length ? '' : '<p class="grafico-nota" style="padding-top:12px;">Ninguém mais por aqui ainda: compartilhe o seu link e peça o dos amigos.</p>'}`;
    renderConquistas(participantes[0].voce && participantes.length > 1 && participantes[0].pontos > 0);
    document.querySelectorAll('.bolao-remover').forEach(b => b.addEventListener('click', () => {
      if (!confirm(`Remover ${b.dataset.nome} do ranking?`)) return;
      dados.amigos = dados.amigos.filter(a => a.nome !== b.dataset.nome);
      salvar();
      renderRanking();
    }));
  }

  // ---------- Conquistas ----------
  let jaTinha = null;   // para comemorar só a conquista nova (não as que já existiam ao abrir)
  function renderConquistas(lider) {
    const lista = Bolao.conquistas(completos(dados.palpites), jogos, { lider });
    const feitas = lista.filter(c => c.ok).map(c => c.id);
    if (jaTinha && feitas.some(id => !jaTinha.includes(id))) UI.confete({ quantidade: 100 });
    jaTinha = feitas;
    document.getElementById('bolao-conquistas-n').textContent = `${feitas.length}/${lista.length}`;
    document.getElementById('bolao-conquistas').innerHTML = lista.map(c => `<li class="conquista${c.ok ? ' ok' : ''}" title="${esc(c.descricao)}">
      <span class="conquista-ic">${UI.icone(c.icone)}</span><span class="conquista-txt"><b>${esc(c.titulo)}</b><small>${esc(c.descricao)}</small></span>
      <span class="conquista-prog">${c.ok ? UI.icone('check') : c.progresso}</span></li>`).join('');
  }

  // ---------- Compartilhar ----------
  document.getElementById('btn-compartilhar-bolao').addEventListener('click', async () => {
    const nome = campoNome.value.trim();
    if (!nome) { aviso('Escreva seu nome antes de compartilhar.'); campoNome.focus(); return; }
    const palpites = completos(dados.palpites);
    if (!Object.keys(palpites).length) { aviso('Faça ao menos um palpite antes.'); return; }
    const url = `${location.origin}${location.pathname}?c=${comp.id}#p=${Bolao.codificar({ nome, compId: comp.id, palpites })}`;
    const texto = `Meus palpites no bolão do ${comp.curto} no FUTSTATS`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Bolão FUTSTATS', text: texto, url }); aviso('Link compartilhado!'); return; }
    } catch (e) { if (e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); aviso('Link copiado! Mande para os amigos.'); } catch (e) { prompt('Copie o link:', url); }
  });

  renderJogos();
  renderRanking();
  UI.montarFooter();
});
