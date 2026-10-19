const CONFEDERACOES_OPCOES = ['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];

AdminUI.registrar('times', () => {
  const esc = DB.Util.escapar;
  const ehCopa = DB.Contexto.ehCopa();
  const busca = document.getElementById('busca');

  document.getElementById('titulo-times').textContent = ehCopa ? 'Seleções cadastradas' : `Clubes · ${DB.Contexto.get().curto}`;
  document.getElementById('cabecalho-times').innerHTML = ehCopa
    ? '<th>Seleção</th><th>Grupo</th><th>Confederação</th><th>Técnico</th><th>Ranking FIFA</th><th>Jogadores</th><th></th>'
    : `<th>Clube</th><th>${DB.Grupos.letras.length ? 'Grupo' : 'Sigla'}</th><th>Técnico</th><th>Estádio</th><th>Jogadores</th><th></th>`;

  function renderTabela() {
    let lista = ehCopa
      ? [...DB.Times.all()].sort((a, b) => a.grupo.localeCompare(b.grupo) || a.posicaoPote - b.posicaoPote)
      : [...DB.Times.all()].sort((a, b) => a.nome.localeCompare(b.nome));
    const termo = busca.value.trim().toLowerCase();
    if (termo) lista = lista.filter(t => t.nome.toLowerCase().includes(termo));

    document.getElementById('tbody-times').innerHTML = lista.length ? lista.map(linha).join('') : linhaVazia();
    document.querySelectorAll('[data-editar]').forEach(btn => btn.addEventListener('click', () => abrirFormulario(btn.dataset.editar)));
  }

  function linha(t) {
    const totalJogadores = DB.Jogadores.all().filter(j => j.timeId === t.id).length;
    const acoes = `<td class="row-actions"><button class="btn btn-ghost btn-sm" data-editar="${t.id}">Editar</button></td>`;
    if (!ehCopa) {
      const grupo = DB.Grupos.deTime(t.id);
      return `<tr>
        <td>${esc(t.nome)}</td>
        <td>${grupo ? `Grupo ${grupo}` : esc(t.codigo || '—')}</td>
        <td>${esc(t.tecnico || '—')}</td>
        <td>${esc(t.estadio || '—')}</td>
        <td>${totalJogadores}</td>
        ${acoes}
      </tr>`;
    }
    return `<tr>
      <td>${esc(t.nome)}</td>
      <td>Grupo ${t.grupo}</td>
      <td>${t.confederacao}</td>
      <td>${esc(t.tecnico || '—')}</td>
      <td>#${t.rankingFifa}</td>
      <td>${totalJogadores}</td>
      ${acoes}
    </tr>`;
  }

  function linhaVazia() {
    return `<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:24px;">Nenhum${ehCopa ? 'a seleção encontrada' : ' clube encontrado'}.</td></tr>`;
  }

  function abrirFormulario(id) {
    const t = DB.Times.get(id);
    if (!t) return;
    if (t.tipo === 'clube') {
      AdminUI.abrirModal({
        titulo: `Editar clube — ${t.nome}`,
        corpoHtml: `
          <div class="field"><label>Nome</label><input type="text" name="nome" value="${esc(t.nome)}" required></div>
          <div class="field"><label>Sigla (3 letras)</label><input type="text" name="codigo" maxlength="4" value="${esc(t.codigo || '')}" required></div>
          <div class="field"><label>Técnico</label><input type="text" name="tecnico" value="${esc(t.tecnico || '')}"></div>
          <div class="field"><label>Estádio</label><input type="text" name="estadio" value="${esc(t.estadio || '')}"></div>
          <div class="field"><label>Cores (camisa e detalhe)</label>
            <div style="display:flex;gap:8px;">
              <input type="color" name="cor1" value="${(t.cores || [])[0] || '#5d667b'}" style="height:40px;">
              <input type="color" name="cor2" value="${(t.cores || [])[1] || '#ffffff'}" style="height:40px;">
            </div>
          </div>
        `,
        aoSalvar(dados) {
          DB.Times.update(t.id, {
            nome: dados.get('nome').trim(),
            codigo: dados.get('codigo').trim().toUpperCase(),
            tecnico: dados.get('tecnico').trim(),
            estadio: dados.get('estadio').trim(),
            cores: [dados.get('cor1'), dados.get('cor2')],
          });
          AdminUI.fecharModal();
          renderTabela();
        },
      });
      return;
    }
    AdminUI.abrirModal({
      titulo: `Editar seleção — ${t.nome}`,
      corpoHtml: `
        <div class="field"><label>Seleção</label><input type="text" value="${esc(t.nome)}" disabled></div>
        <div class="field"><label>Grupo (fase de grupos)</label><input type="text" value="Grupo ${t.grupo}" disabled></div>
        <div class="field"><label>Confederação</label>
          <select name="confederacao" required>
            ${CONFEDERACOES_OPCOES.map(c => `<option value="${c}" ${t.confederacao === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Técnico</label><input type="text" name="tecnico" value="${esc(t.tecnico || '')}"></div>
        <div class="field"><label>Ranking FIFA</label><input type="number" name="rankingFifa" min="1" max="48" value="${t.rankingFifa}" required></div>
      `,
      aoSalvar(dados) {
        DB.Times.update(t.id, {
          confederacao: dados.get('confederacao'),
          tecnico: dados.get('tecnico').trim(),
          rankingFifa: Number(dados.get('rankingFifa')),
        });
        AdminUI.fecharModal();
        renderTabela();
      },
    });
  }

  busca.addEventListener('input', renderTabela);

  renderTabela();
});
