document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();
  DB.MataMata.sincronizar();

  const esc = DB.Util.escapar;
  const { chuteira, luva, jovem } = DB.Estatisticas.premios();

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

  document.getElementById('lista-chuteira').innerHTML = lista(chuteira,
    l => `${l.gols}<small>gols</small>`,
    l => `${l.assistencias} assist.${l.minutos ? ` · ${l.minutos} min` : ''}`,
    'Nenhum gol cadastrado ainda');
  document.getElementById('lista-luva').innerHTML = lista(luva,
    l => `${l.semSofrer}<small>sem sofrer</small>`,
    l => `${l.jogos} jogo${l.jogos === 1 ? '' : 's'}`,
    'Sem escalações de goleiros ainda');
  document.getElementById('lista-jovem').innerHTML = lista(jovem,
    l => `${l.participacoes}<small>G+A</small>`,
    l => `${l.jogador.idade ?? ''} anos · ${l.gols}G ${l.assistencias}A`,
    'Nenhum jovem com participação ainda');

  // ---------- Seleção da rodada ----------
  const rodadas = DB.Estatisticas.rodadas;
  const comJogos = rodadas.filter(r => DB.Jogos.all().some(j => j.status === 'encerrado' && r.filtro(j)));
  let atual = (comJogos[comJogos.length - 1] || rodadas[0]).id;

  function render() {
    document.getElementById('chips-rodada').innerHTML = rodadas.map(r => {
      const tem = comJogos.includes(r);
      return `<button type="button" class="chip${r.id === atual ? ' active' : ''}" data-r="${r.id}" ${tem ? '' : 'disabled style="opacity:.4;cursor:default"'}>${r.label}</button>`;
    }).join('');
    document.querySelectorAll('#chips-rodada .chip:not([disabled])').forEach(b => b.addEventListener('click', () => { atual = b.dataset.r; render(); }));

    const sel = DB.Estatisticas.selecaoDaRodada(atual);
    document.getElementById('titulo-rodada').textContent = `Seleção da rodada · ${sel.rodada.label}`;
    const vazia = sel.linhas.every(l => l.every(x => !x));
    document.getElementById('campo-rodada').innerHTML = vazia
      ? UI.vazio('Nenhum jogo encerrado nesta rodada', '')
      : UI.campinho(sel.linhas.map(l => l.map(p => (p ? {
        jogador: p.jogador,
        pts: p.pontos,
        tags: `${UI.bandeira(DB.Times.get(p.jogador.timeId), 'sm').replace('class="flag flag-sm"', 'class="flag flag-sm" style="display:inline-block;vertical-align:middle;"')}${'⚽'.repeat(p.gols)}${p.assistencias ? '<span class="tag-a">A</span>'.repeat(p.assistencias) : ''}`,
      } : null))));
  }

  render();
  UI.montarFooter();
});
