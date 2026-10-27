document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();

  if (!DB.Contexto.ehCopa()) { mataMataClubes(); UI.montarFooter(); return; }
  const chave = DB.MataMata.sincronizar();

  // Árvore clássica: metade esquerda → final ← metade direita (espelhada).
  // Cada fase leva os vencedores de dois jogos consecutivos da anterior, então a
  // metade esquerda é a primeira metade de cada lista e a direita, a segunda.
  const metade = (lista, lado) => (lado === 'esq' ? lista.slice(0, lista.length / 2) : lista.slice(lista.length / 2));
  const fases = [
    ['r32', '32avos', chave.r32],
    ['r16', 'Oitavas', chave.r16],
    ['qf', 'Quartas', chave.qf],
    ['sf', 'Semifinal', chave.sf],
  ];
  const colunasEsq = fases.map(([id, titulo, lista]) => coluna(id, titulo, metade(lista, 'esq'), 'esq'));
  const colunasDir = fases.map(([id, titulo, lista]) => coluna(id, titulo, metade(lista, 'dir'), 'dir')).reverse();

  const finalJogo = chave.final.jogoId ? DB.Jogos.get(chave.final.jogoId) : null;
  const campeaoId = finalJogo && finalJogo.status === 'encerrado' ? DB.MataMata.vencedor(finalJogo) : null;
  const campeao = campeaoId ? DB.Times.get(campeaoId) : null;
  const colunaFinal = `
    <div class="tree-col final-col">
      <div class="tree-title">Final</div>
      <div class="tree-body">
        <div class="tree-pair unico"><div class="tree-slot">
          <div class="tree-trofeu" aria-hidden="true">${UI.icone('trofeu')}</div>
          ${cartaoHtml(chave.final, 'tree-final-card')}
          <div class="tree-campeao">${campeao ? `${UI.bandeira(campeao, 'sm')} Campeão: ${DB.Util.escapar(campeao.nome)}` : 'Campeão do mundo'}</div>
        </div></div>
      </div>
    </div>`;

  document.getElementById('arvore').innerHTML = [...colunasEsq, colunaFinal, ...colunasDir].join('');
  document.getElementById('bloco-terceiro').innerHTML = cartaoHtml(chave.terceiro, '', false);
  UI.destacarCaminhos(document.getElementById('arvore'), campeaoId);

  UI.montarFooter();
});

function coluna(id, titulo, itens, lado) {
  const pares = [];
  for (let i = 0; i < itens.length; i += 2) pares.push(itens.slice(i, i + 2));
  return `
    <div class="tree-col ${lado} ${id}">
      <div class="tree-title">${titulo}</div>
      <div class="tree-body">
        ${pares.map(par => `<div class="tree-pair${par.length === 1 ? ' unico' : ''}">
          ${par.map(item => `<div class="tree-slot">${cartaoHtml(item)}</div>`).join('')}
        </div>`).join('')}
      </div>
    </div>`;
}

function ladoHtml(timeId, rotulo, gols, classe, compacto) {
  const time = timeId ? DB.Times.get(timeId) : null;
  const nome = time ? time.nome : rotulo;
  // Na árvore usa o código (BRA, GER…) para caber; o nome completo fica na dica.
  const texto = time && compacto ? time.codigo : nome;
  return `<div class="bracket-team ${classe}"${time ? ` data-time="${time.id}"` : ''}>${time ? UI.bandeira(time, 'sm') : ''}<span class="nome" title="${DB.Util.escapar(nome)}">${DB.Util.escapar(texto)}</span><span class="gols">${gols ?? ''}</span></div>`;
}

function cartaoHtml(item, classeExtra = '', compacto = true) {
  const jogo = item.jogoId ? DB.Jogos.get(item.jogoId) : null;
  const comPlacar = jogo && UI.temPlacar(jogo);
  const vencedor = jogo && jogo.status === 'encerrado' ? DB.MataMata.vencedor(jogo) : null;
  const classe = id => (!vencedor ? '' : vencedor === id ? 'vencedor' : 'perdedor');
  const pen = jogo && jogo.penaltisMandante != null && jogo.penaltisVisitante != null
    ? `<div class="bracket-meta">Pênaltis: ${jogo.penaltisMandante}–${jogo.penaltisVisitante}</div>` : '';
  const data = jogo ? `<div class="bracket-meta">${DB.Util.formatarDataHora(jogo.data)}</div>` : '';
  const corpo = `
    ${ladoHtml(jogo && jogo.mandanteId, item.labelMandante, comPlacar ? jogo.golsMandante : null, jogo ? classe(jogo.mandanteId) : '', compacto)}
    ${ladoHtml(jogo && jogo.visitanteId, item.labelVisitante, comPlacar ? jogo.golsVisitante : null, jogo ? classe(jogo.visitanteId) : '', compacto)}
    ${pen || (comPlacar ? '' : data)}`;
  const classes = `bracket-match${item.projetado ? ' projetado' : ''} ${classeExtra}`.trim();
  return jogo
    ? `<a class="${classes}" href="jogo.html?id=${jogo.id}">${corpo}</a>`
    : `<div class="${classes}${item.projetado ? '' : ' projetado'}">${corpo}</div>`;
}

// Mata-mata dos clubes: uma coluna por fase, com os confrontos (ida e volta + agregado).
function mataMataClubes() {
  const comp = DB.Contexto.get();
  if (comp.tipo === 'liga') { window.location.replace('grupos.html'); return; }
  document.getElementById('painel-arvore').hidden = true;
  document.getElementById('painel-terceiro').hidden = true;
  document.getElementById('eyebrow').textContent = `${comp.curto} · mata-mata`;
  const unico = comp.jogoUnico || [];
  document.getElementById('lead').textContent = `Confrontos em ida e volta${unico.length ? ` (${unico.map(f => DB.Util.faseLabel(f).toLowerCase()).join(', ')} em jogo único)` : ''}. O placar ao lado de cada clube é o agregado.`;
  const caixa = document.getElementById('fases-clubes');
  caixa.hidden = false;
  caixa.innerHTML = (comp.fases || []).map(fase => {
    const confrontos = DB.MataMata.confrontos(fase);
    return `<section class="panel fase-col">
      <div class="panel-header"><span class="panel-title">${DB.Util.faseLabel(fase)}</span><span class="group-status">${confrontos.length ? `${confrontos.filter(c => c.encerrado).length}/${confrontos.length} definidos` : ''}</span></div>
      <div class="panel-body"><div class="stack">${confrontos.length
        ? confrontos.map(UI.cartaoConfronto).join('')
        : '<div class="bracket-match projetado"><div class="bracket-team"><span class="nome">A definir</span></div><div class="bracket-team"><span class="nome">A definir</span></div></div>'}
      </div></div>
    </section>`;
  }).join('');
  // Campeão = vencedor do confronto da última fase (a final), se já decidido.
  const ultima = (comp.fases || []).slice(-1)[0];
  const final = ultima ? DB.MataMata.confrontos(ultima).find(c => c.vencedor) : null;
  UI.destacarCaminhos(caixa, final ? final.vencedor : null);
}
