// Monte seu time: formação + 11 jogadores do campeonato aberto. Fica salvo neste navegador
// (fs_meu_time, por campeonato) e viaja por link (#t=<base64url>) ou como imagem.
document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  const esc = DB.Util.escapar;
  const comp = DB.Contexto.get();
  document.getElementById('eyebrow-time').textContent = `Seu time dos sonhos · ${comp.curto} ${comp.temporada}`;

  // Linhas da defesa ao ataque (o goleiro é a vaga 0). "Meio" aceita meio-campo e meia ofensivo.
  const FORMACOES = {
    '4-3-3': [4, 3, 3], '4-4-2': [4, 4, 2], '4-2-3-1': [4, 2, 3, 1], '4-1-4-1': [4, 1, 4, 1], '3-5-2': [3, 5, 2],
    '3-4-3': [3, 4, 3], '5-3-2': [5, 3, 2], '5-4-1': [5, 4, 1], '4-5-1': [4, 5, 1],
  };
  // Posição de cada linha: a primeira é a defesa, a última o ataque, as do meio são meio-campo.
  const posicoesDe = f => {
    const linhas = FORMACOES[f];
    return ['Goleiro', ...linhas.flatMap((n, i) => Array(n).fill(i === 0 ? 'Defensor' : i === linhas.length - 1 ? 'Atacante' : 'Meio-campo'))];
  };
  const SIGLA = { Goleiro: 'GOL', Defensor: 'DEF', 'Meio-campo': 'MEI', Atacante: 'ATA' };
  const cabe = (jogador, pos) => jogador.posicao === pos || (pos === 'Meio-campo' && jogador.posicao === 'Meia ofensivo');

  const notas = DB.Estatisticas.notasTemporada();
  const linhas = Object.fromEntries(DB.Estatisticas.porJogador().map(l => [l.jogador.id, l]));
  const jogadores = DB.Jogadores.all();
  const normalizar = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  // Força para ordenar e completar: nota média (quem não jogou fica com 6) e participações em gol.
  const forca = j => (notas[j.id] ? notas[j.id].media : 6) + ((linhas[j.id] || {}).participacoes || 0) * 0.05 + (j.jogosSelecao || 0) * 0.001;

  // ---------- Armazenamento e link ----------
  const CHAVE = 'fs_meu_time';
  const lerTudo = () => { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { return {}; } };
  const vazio = () => ({ formacao: '4-3-3', nome: '', vagas: Array(11).fill(null) });
  const valido = t => t && FORMACOES[t.formacao] && Array.isArray(t.vagas)
    ? { formacao: t.formacao, nome: String(t.nome || '').slice(0, 28), vagas: Array.from({ length: 11 }, (_, i) => (DB.Jogadores.get(t.vagas[i]) ? t.vagas[i] : null)) }
    : null;
  let meu = valido(lerTudo()[comp.id]) || vazio();
  let time = meu;          // o que está na tela (o meu ou o de um amigo)
  let deAmigo = false;
  let vaga = null;         // vaga selecionada
  let todasPosicoes = false;
  const salvar = () => { if (deAmigo) return; const tudo = lerTudo(); tudo[comp.id] = meu; try { localStorage.setItem(CHAVE, JSON.stringify(tudo)); } catch (e) { /* só nesta visita */ } };

  const paraBase64 = texto => btoa(String.fromCharCode(...new TextEncoder().encode(texto))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const deBase64 = c => new TextDecoder().decode(Uint8Array.from(atob(c.replace(/-/g, '+').replace(/_/g, '/')), x => x.charCodeAt(0)));
  const codigo = (location.hash.match(/^#t=([\w-]+)/) || [])[1];
  if (codigo) {
    let amigo = null;
    try { amigo = valido(JSON.parse(deBase64(codigo))); } catch (e) { amigo = null; }
    const caixa = document.getElementById('mt-convite');
    caixa.hidden = false;
    if (!amigo) caixa.innerHTML = `<p>${UI.icone('aviso')} Não consegui ler este link de time.</p>`;
    else {
      time = amigo; deAmigo = true;
      caixa.innerHTML = `<p>Você está vendo ${amigo.nome ? `o <b>${esc(amigo.nome)}</b>` : 'o time de um amigo'}.</p>
        <div class="bolao-acoes"><button type="button" class="btn btn-primary" id="mt-usar">Usar como o meu</button>
        <button type="button" class="btn btn-ghost" id="mt-meu">Ver o meu time</button></div>`;
      document.getElementById('mt-usar').addEventListener('click', () => {
        if (meu.vagas.some(Boolean) && !confirm('Trocar o seu time por este?')) return;
        meu = { ...amigo, vagas: [...amigo.vagas] }; voltarAoMeu(); salvar(); aviso('Agora este é o seu time.');
      });
      document.getElementById('mt-meu').addEventListener('click', voltarAoMeu);
    }
    history.replaceState(null, '', location.pathname + location.search);
  }
  function voltarAoMeu() { time = meu; deAmigo = false; document.getElementById('mt-convite').hidden = true; render(); }
  const aviso = t => { document.getElementById('mt-aviso').textContent = t; };

  // ---------- Desenho ----------
  const selForm = document.getElementById('mt-formacao');
  selForm.innerHTML = Object.keys(FORMACOES).map(f => `<option>${f}</option>`).join('');
  const campoNome = document.getElementById('mt-nome');

  function vagaHtml(i, pos) {
    const j = time.vagas[i] ? DB.Jogadores.get(time.vagas[i]) : null;
    const sel = vaga === i ? ' selecionada' : '';
    if (!j) return `<button type="button" class="lu-jogador vazio mt-vaga${sel}" data-vaga="${i}" aria-label="Escolher ${pos}"><span class="lu-foto">+</span><span class="lu-nome">${SIGLA[pos]}</span></button>`;
    const fora = !cabe(j, pos) ? ' title="Fora da posição de origem"' : '';
    return `<button type="button" class="lu-jogador mt-vaga${sel}" data-vaga="${i}"${fora} aria-label="${esc(j.nome)}, ${pos}. Trocar">
      ${UI.fotoJogador(j, { nota: notas[j.id] ? notas[j.id].media : null })}
      <span class="lu-nome">${!cabe(j, pos) ? '* ' : ''}${esc(UI.nomeCurto(j.nome))}</span>
      <span class="lu-clube">${UI.bandeira(DB.Times.get(j.timeId), 'sm')}</span></button>`;
  }

  // Linhas do campinho: goleiro em cima, como os outros campinhos do site.
  function linhasCampo() {
    const pos = posicoesDe(time.formacao);
    const res = [[vagaHtml(0, 'Goleiro')]];
    let i = 1;
    FORMACOES[time.formacao].forEach(n => { res.push(Array.from({ length: n }, () => { const k = i++; return vagaHtml(k, pos[k]); })); });
    return res;
  }

  function render() {
    selForm.value = time.formacao;
    selForm.disabled = deAmigo;
    campoNome.value = time.nome;
    campoNome.disabled = deAmigo;
    document.getElementById('mt-campo').innerHTML = `<div class="lu-rodada mt-campo">${UI.campoGoogle(linhasCampo(),
      `<div class="lu-topo"><span class="lu-time">${esc(time.nome || 'Meu time')}</span><span class="lu-formacao">${time.formacao}</span></div>`)}</div>`;
    ['mt-auto', 'mt-limpar'].forEach(id => { document.getElementById(id).hidden = deAmigo; });
    renderResumo();
    renderEscolha();
  }

  function renderResumo() {
    const js = time.vagas.map(id => (id ? DB.Jogadores.get(id) : null)).filter(Boolean);
    const comNota = js.filter(j => notas[j.id]);
    const media = comNota.length ? comNota.reduce((t, j) => t + notas[j.id].media, 0) / comNota.length : null;
    const soma = campo => js.reduce((t, j) => t + ((linhas[j.id] || {})[campo] || 0), 0);
    const idades = js.filter(j => j.idade);
    const times = new Set(js.map(j => j.timeId));
    const item = (rotulo, valor) => `<li><span>${rotulo}</span><span><b>${valor}</b></span></li>`;
    document.getElementById('mt-resumo').innerHTML = `<ul class="info-list">
      ${item('Escalados', `${js.length}/11`)}
      ${item('Nota média no campeonato', media != null ? media.toFixed(2).replace('.', ',') : '—')}
      ${item('Gols · assistências', `${soma('gols')} · ${soma('assistencias')}`)}
      ${idades.length ? item('Idade média', `${(idades.reduce((t, j) => t + j.idade, 0) / idades.length).toFixed(1).replace('.', ',')} anos`) : ''}
      ${item(`${UI.rotuloTimes()} diferentes`, times.size)}
    </ul>`;
  }

  function renderEscolha() {
    const titulo = document.getElementById('mt-escolha-titulo');
    const caixa = document.getElementById('mt-escolha');
    if (vaga == null || deAmigo) {
      titulo.textContent = 'Escolha uma posição';
      caixa.innerHTML = `<p class="grafico-nota" style="padding:14px 18px;">${deAmigo ? 'Este é o time de um amigo: use “Usar como o meu” para editar.' : 'Toque numa posição do campo para ver os jogadores.'}</p>`;
      return;
    }
    const pos = posicoesDe(time.formacao)[vaga];
    const atual = time.vagas[vaga] ? DB.Jogadores.get(time.vagas[vaga]) : null;
    titulo.textContent = `${pos}${atual ? ` · ${UI.nomeCurto(atual.nome)}` : ''}`;
    const filtroAntes = caixa.querySelector('#mt-busca')?.value || '';
    caixa.innerHTML = `<div class="mt-filtros">
        <input type="search" id="mt-busca" placeholder="Buscar jogador ou ${UI.rotuloTimes(true).toLowerCase()}…" value="${esc(filtroAntes)}" aria-label="Buscar jogador">
        <label class="mt-todas"><input type="checkbox" id="mt-todas" ${todasPosicoes ? 'checked' : ''}> Todas as posições</label>
        ${atual ? `<button type="button" class="btn btn-ghost btn-sm" id="mt-tirar">${UI.icone('fechar')} Tirar</button>` : ''}
      </div>
      <div class="mt-lista" id="mt-lista"></div>`;
    renderLista();
    const busca = document.getElementById('mt-busca');
    busca.addEventListener('input', renderLista);
    document.getElementById('mt-todas').addEventListener('change', e => { todasPosicoes = e.target.checked; renderLista(); });
    document.getElementById('mt-tirar')?.addEventListener('click', () => { meu.vagas[vaga] = null; salvar(); render(); });
  }

  function renderLista() {
    const pos = posicoesDe(time.formacao)[vaga];
    const t = normalizar(document.getElementById('mt-busca').value.trim());
    const lista = jogadores
      .filter(j => (todasPosicoes || t.length >= 2 || cabe(j, pos)))
      .filter(j => !t || normalizar(`${j.nome} ${(DB.Times.get(j.timeId) || {}).nome || ''}`).includes(t))
      .sort((a, b) => forca(b) - forca(a) || a.nome.localeCompare(b.nome))
      .slice(0, 60);
    document.getElementById('mt-lista').innerHTML = lista.length ? lista.map(j => {
      const tm = DB.Times.get(j.timeId);
      const l = linhas[j.id];
      const naVaga = time.vagas.indexOf(j.id);
      return `<button type="button" class="mt-jog${naVaga === vaga ? ' ativo' : ''}" data-jog="${j.id}">
        ${UI.avatar(j)}<span class="mt-jog-txt"><b>${esc(j.nome)}</b><small>${UI.bandeira(tm, 'sm')} ${tm ? esc(tm.codigo) : ''} · ${esc(j.posicao)}${l && (l.gols || l.assistencias) ? ` · ${l.gols}G ${l.assistencias}A` : ''}${naVaga !== -1 && naVaga !== vaga ? ' · já no time' : ''}</small></span>
        ${notas[j.id] ? UI.notaHtml(notas[j.id].media) : ''}</button>`;
    }).join('') : '<p class="grafico-nota" style="padding:14px 18px;">Ninguém encontrado.</p>';
  }

  // ---------- Ações ----------
  document.getElementById('mt-campo').addEventListener('click', e => {
    const b = e.target.closest('[data-vaga]');
    if (!b || deAmigo) return;
    vaga = Number(b.dataset.vaga) === vaga ? null : Number(b.dataset.vaga);
    render();
    if (vaga != null && window.matchMedia('(max-width: 900px)').matches) document.getElementById('mt-escolha-painel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.getElementById('mt-escolha').addEventListener('click', e => {
    const b = e.target.closest('[data-jog]');
    if (!b || vaga == null) return;
    const id = b.dataset.jog;
    // Já estava em outra vaga: troca de lugar com quem está nesta.
    const outra = meu.vagas.indexOf(id);
    if (outra !== -1) meu.vagas[outra] = meu.vagas[vaga];
    meu.vagas[vaga] = id;
    // Segue para a próxima vaga vazia (agiliza montar o time inteiro).
    const proxima = meu.vagas.findIndex(v => !v);
    vaga = proxima === -1 ? null : proxima;
    salvar();
    render();
  });
  selForm.addEventListener('change', () => { meu.formacao = selForm.value; salvar(); render(); });
  campoNome.addEventListener('input', () => {
    meu.nome = campoNome.value.slice(0, 28);
    salvar();
    document.querySelector('.mt-campo .lu-time').textContent = meu.nome || 'Meu time';
  });
  document.getElementById('mt-limpar').addEventListener('click', () => {
    if (!meu.vagas.some(Boolean) || !confirm('Tirar todos os jogadores do time?')) return;
    meu.vagas = Array(11).fill(null); vaga = null; salvar(); render();
  });
  document.getElementById('mt-auto').addEventListener('click', () => {
    const pos = posicoesDe(meu.formacao);
    const usados = new Set(meu.vagas.filter(Boolean));
    let n = 0;
    pos.forEach((p, i) => {
      if (meu.vagas[i]) return;
      const melhor = jogadores.filter(j => !usados.has(j.id) && cabe(j, p)).sort((a, b) => forca(b) - forca(a))[0];
      if (melhor) { meu.vagas[i] = melhor.id; usados.add(melhor.id); n++; }
    });
    vaga = null; salvar(); render();
    aviso(n ? `${n} vaga${n === 1 ? '' : 's'} preenchida${n === 1 ? '' : 's'} com os de melhor nota no campeonato.` : 'O time já está completo.');
  });
  document.getElementById('mt-link').addEventListener('click', async () => {
    if (!time.vagas.some(Boolean)) { aviso('Escale alguém antes de compartilhar.'); return; }
    const url = `${location.origin}${location.pathname}?c=${comp.id}#t=${paraBase64(JSON.stringify({ formacao: time.formacao, nome: time.nome, vagas: time.vagas }))}`;
    try { await navigator.clipboard.writeText(url); aviso('Link copiado! Quem abrir vê o seu time.'); } catch (e) { prompt('Copie o link:', url); }
  });
  document.getElementById('mt-imagem').addEventListener('click', async e => {
    if (!time.vagas.some(Boolean)) { aviso('Escale alguém antes de compartilhar.'); return; }
    const botao = e.currentTarget;
    botao.disabled = true;
    const jogador = i => {
      const j = time.vagas[i] ? DB.Jogadores.get(time.vagas[i]) : null;
      return j ? { nome: j.nome, numero: j.numero, timeId: j.timeId, nota: notas[j.id] ? notas[j.id].media : null, gols: (linhas[j.id] || {}).gols || 0 } : null;
    };
    // Imagem: ataque em cima, goleiro embaixo.
    const fileiras = [];
    let i = 1;
    FORMACOES[time.formacao].forEach(n => { fileiras.push(Array.from({ length: n }, () => jogador(i++))); });
    fileiras.reverse().push([jogador(0)]);
    try {
      await Compartilhar.campo({ eyebrow: `${comp.curto} ${comp.temporada}`, titulo: time.nome || 'Meu time dos sonhos', subtitulo: 'Monte seu time no FUTSTATS', formacao: time.formacao, linhas: fileiras },
        'futstats-meu-time.png', `${time.nome || 'Meu time'} (${time.formacao}) — ${comp.curto} ${comp.temporada}`);
    } finally { botao.disabled = false; }
  });

  render();
  UI.montarFooter();
});
