AdminUI.guardarAutenticacao();

const LABELS_STATUS_JOGADOR = { ativo: 'Ativo', lesionado: 'Lesionado', suspenso: 'Suspenso' };

document.addEventListener('DOMContentLoaded', () => {
  AdminUI.montarSidebar();
  AdminUI.montarTopbar();

  const filtroTime = document.getElementById('filtro-time');
  const busca = document.getElementById('busca');

  filtroTime.innerHTML = '<option value="">Todas as seleções</option>' +
    DB.Times.all().map(t => `<option value="${t.id}">${t.nome}</option>`).join('');

  function renderTabela() {
    let lista = DB.Jogadores.all();
    if (filtroTime.value) lista = lista.filter(j => j.timeId === filtroTime.value);
    const termo = busca.value.trim().toLowerCase();
    if (termo) lista = lista.filter(j => j.nome.toLowerCase().includes(termo));

    document.getElementById('tbody-jogadores').innerHTML = lista.length ? lista.map(linha).join('') : linhaVazia();
    document.querySelectorAll('[data-editar]').forEach(btn => btn.addEventListener('click', () => abrirFormulario(btn.dataset.editar)));
    document.querySelectorAll('[data-excluir]').forEach(btn => btn.addEventListener('click', () => excluir(btn.dataset.excluir)));
  }

  function linha(j, i) {
    const time = DB.Times.get(j.timeId);
    return `<tr>
      <td>${i + 1}</td>
      <td>${j.nome}</td>
      <td>${time ? time.nome : '—'}</td>
      <td>${j.posicao}</td>
      <td>${j.idade}</td>
      <td>${AdminUI.badge(j.status, LABELS_STATUS_JOGADOR)}</td>
      <td class="row-actions">
        <button class="btn btn-ghost btn-sm" data-editar="${j.id}">Editar</button>
        <button class="btn btn-danger btn-sm" data-excluir="${j.id}">Excluir</button>
      </td>
    </tr>`;
  }

  function linhaVazia() {
    return '<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:24px;">Nenhum jogador encontrado.</td></tr>';
  }

  function opcoesTimes(selecionadoId) {
    return DB.Times.all().map(t => `<option value="${t.id}" ${t.id === selecionadoId ? 'selected' : ''}>${t.nome}</option>`).join('');
  }

  function abrirFormulario(id) {
    const j = id ? DB.Jogadores.get(id) : null;
    AdminUI.abrirModal({
      titulo: j ? 'Editar jogador' : 'Novo jogador',
      corpoHtml: `
        <div class="field"><label>Nome</label><input type="text" name="nome" value="${j?.nome ?? ''}" required></div>
        <div class="field"><label>Seleção</label><select name="timeId" required>${opcoesTimes(j?.timeId)}</select></div>
        <div class="field"><label>Posição</label>
          <select name="posicao" required>
            ${['Goleiro', 'Zagueiro', 'Lateral', 'Meio-campo', 'Atacante'].map(p => `<option value="${p}" ${j?.posicao === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Idade</label><input type="number" name="idade" min="14" max="45" value="${j?.idade ?? ''}" required></div>
        <div class="field"><label>Status</label>
          <select name="status" required>
            <option value="ativo" ${j?.status === 'ativo' ? 'selected' : ''}>Ativo</option>
            <option value="lesionado" ${j?.status === 'lesionado' ? 'selected' : ''}>Lesionado</option>
            <option value="suspenso" ${j?.status === 'suspenso' ? 'selected' : ''}>Suspenso</option>
          </select>
        </div>
      `,
      aoSalvar(dados) {
        const payload = {
          nome: dados.get('nome'),
          timeId: dados.get('timeId'),
          posicao: dados.get('posicao'),
          idade: Number(dados.get('idade')),
          status: dados.get('status'),
        };
        if (j) DB.Jogadores.update(j.id, payload);
        else DB.Jogadores.create(payload);
        AdminUI.fecharModal();
        renderTabela();
      },
    });
  }

  function excluir(id) {
    if (confirm('Excluir este jogador?')) {
      DB.Jogadores.remove(id);
      renderTabela();
    }
  }

  document.getElementById('btn-novo').addEventListener('click', () => abrirFormulario(null));
  filtroTime.addEventListener('change', renderTabela);
  busca.addEventListener('input', renderTabela);

  renderTabela();
});
