document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();
  DB.MataMata.sincronizar();

  const esc = DB.Util.escapar;
  if (!DB.Contexto.ehCopa()) document.getElementById('titulo-premios').textContent = `Prêmios · ${DB.Contexto.get().curto}`;
  const { chuteira, luva, jovem } = DB.Estatisticas.premios();
  const bola = DB.Estatisticas.bolaDeOuro();

  function lista(itens, valor, sub, vazio) {
    if (!itens.length) return UI.vazio(vazio, '');
    return `<ol class="leader-list">${itens.map((l, i) => {
      const time = DB.Times.get(l.jogador.timeId);
      return `<li><a class="leader${i === 0 ? ' destaque' : ''}" href="jogador.html?id=${l.jogador.id}">
        <span class="rank">${i + 1}</span>${UI.avatar(l.jogador)}
        <span class="info"><span class="nome">${esc(l.jogador.nome)}</span>
          <span class="sub">${UI.bandeira(time, 'sm')} ${time ? esc(time.nome) : ''} · ${sub(l)}</span></span>
        <span class="valor">${valor(l)}</span>
      </a></li>`;
    }).join('')}</ol>`;
  }

  document.getElementById('lista-bola').innerHTML = lista(bola.lista,
    l => `${l.media.toFixed(2).replace('.', ',')}<small>nota média</small>`,
    l => `${l.jogosComNota} jogo${l.jogosComNota === 1 ? '' : 's'} · ${l.gols}G ${l.assistencias}A`,
    'Nenhuma nota ainda');
  if (bola.minimo > 1) document.getElementById('crit-bola').textContent = `Maior nota média entre quem jogou ao menos ${bola.minimo} jogos (metade dos jogos do mais assíduo). Desempate: gols + assistências.`;
  document.getElementById('lista-chuteira').innerHTML = lista(chuteira,
    l => `${l.gols}<small>gols</small>`,
    l => `${l.assistencias} assist.${l.minutos ? ` · ${l.minutos} min` : ''}`,
    'Nenhum gol cadastrado ainda');
  document.getElementById('lista-luva').innerHTML = lista(luva,
    l => `${l.semSofrer}<small>sem sofrer</small>`,
    l => `${l.jogos} jogo${l.jogos === 1 ? '' : 's'}`,
    'Sem escalações de goleiros ainda');
  // Sem datas de nascimento (elencos de clubes) não dá para saber quem é jovem.
  if (!DB.Jogadores.all().some(j => j.nascimento)) document.getElementById('lista-jovem').closest('.panel').hidden = true;
  document.getElementById('lista-jovem').innerHTML = lista(jovem,
    l => `${l.participacoes}<small>G+A</small>`,
    l => `${l.jogador.idade ?? ''} anos · ${l.gols}G ${l.assistencias}A`,
    'Nenhum jovem com participação ainda');

  // ---------- Seleção da rodada ----------
  const rodadas = DB.Estatisticas.rodadas;
  const comJogos = rodadas.filter(r => DB.Jogos.all().some(j => j.status === 'encerrado' && r.filtro(j)));
  let atual = (comJogos[comJogos.length - 1] || rodadas[0]).id;

  function render() {
    // Com muitas rodadas (ligas de 38), um seletor no lugar dos botões.
    if (rodadas.length > 10) {
      document.getElementById('chips-rodada').innerHTML = `<label class="chip" style="display:inline-flex;align-items:center;gap:8px;cursor:default;">Rodada
        <select id="sel-rodada" class="chip-select">${rodadas.map(r => `<option value="${r.id}" ${r.id === atual ? 'selected' : ''} ${comJogos.includes(r) ? '' : 'disabled'}>${r.label}</option>`).join('')}</select></label>`;
      document.getElementById('sel-rodada').addEventListener('change', e => { atual = e.target.value; render(); });
    } else {
      document.getElementById('chips-rodada').innerHTML = rodadas.map(r => {
        const tem = comJogos.includes(r);
        return `<button type="button" class="chip${r.id === atual ? ' active' : ''}" data-r="${r.id}" ${tem ? '' : 'disabled style="opacity:.4;cursor:default"'}>${r.label}</button>`;
      }).join('');
      document.querySelectorAll('#chips-rodada .chip:not([disabled])').forEach(b => b.addEventListener('click', () => { atual = b.dataset.r; render(); }));
    }

    const sel = DB.Estatisticas.selecaoDaRodada(atual);
    document.getElementById('titulo-rodada').textContent = `Seleção da rodada · ${sel.rodada.label}`;
    const vazia = sel.linhas.every(l => l.every(x => !x));
    // Campinho no estilo Google: goleiro em cima, nota embaixo da "foto" e o escudo do time abaixo do nome.
    const conta = n => (n > 1 ? `<b>${n}</b>` : '');
    const item = p => (p
      ? UI.jogadorNoCampo(p.jogador, {
        nota: p.nota,
        numero: false,
        cantos: `${p.gols ? `<span class="lu-ic lu-gol" title="${p.gols} gol(s)">${UI.icone('bola')}${conta(p.gols)}</span>` : ''}${p.assistencias ? `<span class="lu-ic lu-assist" title="${p.assistencias} assistência(s)">${UI.icone('chuteira')}${conta(p.assistencias)}</span>` : ''}`,
        extra: `<span class="lu-clube">${UI.bandeira(DB.Times.get(p.jogador.timeId), 'sm')}</span>`,
      })
      : '<span class="lu-jogador vazio"><span class="lu-foto"></span><span class="lu-nome">—</span></span>');
    const linhas = [...sel.linhas].reverse().map(l => l.map(item));
    document.getElementById('campo-rodada').innerHTML = vazia
      ? UI.vazio('Nenhum jogo encerrado nesta rodada', '')
      : `<div class="lu-rodada">${UI.campoGoogle(linhas, `<div class="lu-topo"><span class="lu-time">Os melhores de ${esc(sel.rodada.label.toLowerCase())}</span><span class="lu-formacao">${sel.formacao}</span></div>`)}</div>`;
    document.getElementById('btn-imagem-rodada').hidden = vazia;
    selecaoAtual = sel;
  }

  // Imagem da seleção da rodada (ataque em cima, goleiro embaixo).
  let selecaoAtual = null;
  document.getElementById('btn-imagem-rodada').addEventListener('click', async e => {
    if (!selecaoAtual) return;
    const botao = e.currentTarget;
    botao.disabled = true;
    const comp = DB.Contexto.get();
    const fileiras = selecaoAtual.linhas.map(l => l.map(p => (p ? { nome: p.jogador.nome, numero: p.jogador.numero, timeId: p.jogador.timeId, nota: p.nota, gols: p.gols } : null)));
    try {
      await Compartilhar.campo({ eyebrow: `${comp.curto} ${comp.temporada}`, titulo: `Seleção da rodada · ${selecaoAtual.rodada.label}`, subtitulo: 'Os melhores pelas notas', formacao: selecaoAtual.formacao, linhas: fileiras },
        `futstats-selecao-${selecaoAtual.rodada.id}.png`, `Seleção da rodada (${selecaoAtual.rodada.label}) — ${comp.curto} ${comp.temporada}`);
    } finally { botao.disabled = false; }
  });

  render();
  UI.montarFooter();
});
