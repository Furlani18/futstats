AdminUI.guardarAutenticacao();

const CONFEDERACOES_OPCOES = ['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];

document.addEventListener('DOMContentLoaded', () => {
  AdminUI.montarSidebar();
  AdminUI.montarTopbar();

  const busca = document.getElementById('busca');

  function renderTabela() {
    let lista = [...DB.Times.all()].sort((a, b) => a.grupo.localeCompare(b.grupo) || a.posicaoPote - b.posicaoPote);
    const termo = busca.value.trim().toLowerCase();
    if (termo) lista = lista.filter(t => t.nome.toLowerCase().includes(termo));

    document.getElementById('tbody-times').innerHTML = lista.length ? lista.map(linha).join('') : linhaVazia();
    document.querySelectorAll('[data-editar]').forEach(btn => btn.addEventListener('click', () => abrirFormulario(btn.dataset.editar)));
  }

  function linha(t) {
    const totalJogadores = DB.Jogadores.all().filter(j => j.timeId === t.id).length;
    return `<tr>
      <td>${t.nome}</td>
      <td>Grupo ${t.grupo}</td>
      <td>${t.confederacao}</td>
      <td>#${t.rankingFifa}</td>
      <td>${totalJogadores}</td>
      <td class="row-actions">
        <button class="btn btn-ghost btn-sm" data-editar="${t.id}">Editar</button>
      </td>
    </tr>`;
  }

  function linhaVazia() {
    return '<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:24px;">Nenhuma seleção encontrada.</td></tr>';
  }

  function abrirFormulario(id) {
    const t = DB.Times.get(id);
    if (!t) return;
    AdminUI.abrirModal({
      titulo: `Editar seleção — ${t.nome}`,
      corpoHtml: `
        <div class="field"><label>Seleção</label><input type="text" value="${t.nome}" disabled></div>
        <div class="field"><label>Grupo (fase de grupos)</label><input type="text" value="Grupo ${t.grupo}" disabled></div>
        <div class="field"><label>Confederação</label>
          <select name="confederacao" required>
            ${CONFEDERACOES_OPCOES.map(c => `<option value="${c}" ${t.confederacao === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Ranking FIFA</label><input type="number" name="rankingFifa" min="1" max="48" value="${t.rankingFifa}" required></div>
      `,
      aoSalvar(dados) {
        DB.Times.update(t.id, {
          confederacao: dados.get('confederacao'),
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
