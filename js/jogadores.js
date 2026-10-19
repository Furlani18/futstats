AdminUI.guardarAutenticacao();

const LABELS_STATUS_JOGADOR = { ativo: 'Ativo', lesionado: 'Lesionado', suspenso: 'Suspenso' };
const POSICOES_JOGADOR = ['Goleiro', 'Defensor', 'Meio-campo', 'Atacante'];

document.addEventListener('DOMContentLoaded', () => {
  AdminUI.montarSidebar();
  AdminUI.montarTopbar();

  const esc = DB.Util.escapar;
  const filtroTime = document.getElementById('filtro-time');
  const busca = document.getElementById('busca');

  filtroTime.innerHTML = '<option value="">Todas as seleções</option>' +
    DB.Times.all().map(t => `<option value="${t.id}">${esc(t.nome)}</option>`).join('');

  // Com 1.248 jogadores, a lista completa só aparece filtrada.
  const LIMITE_SEM_FILTRO = 100;

  function renderTabela() {
    let lista = DB.Jogadores.all();
    if (filtroTime.value) lista = lista.filter(j => j.timeId === filtroTime.value);
    const termo = busca.value.trim().toLowerCase();
    if (termo) lista = lista.filter(j => j.nome.toLowerCase().includes(termo) || (j.clube || '').toLowerCase().includes(termo));
    lista.sort((a, b) => a.timeId.localeCompare(b.timeId, undefined, { numeric: true }) || (a.numero ?? 99) - (b.numero ?? 99));
    const total = lista.length;
    const cortada = !filtroTime.value && !termo && total > LIMITE_SEM_FILTRO;
    if (cortada) lista = lista.slice(0, LIMITE_SEM_FILTRO);

    document.getElementById('tbody-jogadores').innerHTML = (lista.length ? lista.map(linha).join('') : linhaVazia())
      + (cortada ? `<tr><td colspan="8" style="text-align:center;color:var(--text-dim);padding:16px;">Mostrando ${LIMITE_SEM_FILTRO} de ${total}. Filtre por seleção ou busque um nome.</td></tr>` : '');
    document.querySelectorAll('[data-editar]').forEach(btn => btn.addEventListener('click', () => abrirFormulario(btn.dataset.editar)));
    document.querySelectorAll('[data-excluir]').forEach(btn => btn.addEventListener('click', () => excluir(btn.dataset.excluir)));
  }

  function linha(j) {
    const time = DB.Times.get(j.timeId);
    return `<tr>
      <td>${j.numero ?? '—'}</td>
      <td>${esc(j.nome)}${j.capitao ? ' <strong title="Capitão">(C)</strong>' : ''}</td>
      <td>${time ? esc(time.nome) : '—'}</td>
      <td>${esc(j.posicao)}</td>
      <td>${esc(j.clube || '—')}</td>
      <td>${j.idade ?? '—'}</td>
      <td>${AdminUI.badge(j.status, LABELS_STATUS_JOGADOR)}</td>
      <td class="row-actions">
        <button class="btn btn-ghost btn-sm" data-editar="${j.id}">Editar</button>
        <button class="btn btn-danger btn-sm" data-excluir="${j.id}">Excluir</button>
      </td>
    </tr>`;
  }

  function linhaVazia() {
    return '<tr><td colspan="8" style="text-align:center;color:var(--text-dim);padding:24px;">Nenhum jogador encontrado.</td></tr>';
  }

  function opcoesTimes(selecionadoId) {
    return DB.Times.all().map(t => `<option value="${t.id}" ${t.id === selecionadoId ? 'selected' : ''}>${esc(t.nome)}</option>`).join('');
  }

  function idadeNaCopa(nascimento) {
    if (!nascimento) return null;
    const [ay, am, ad] = nascimento.split('-').map(Number);
    return 2026 - ay - ((6 < am || (6 === am && 11 < ad)) ? 1 : 0);
  }

  function abrirFormulario(id) {
    const j = id ? DB.Jogadores.get(id) : null;
    AdminUI.abrirModal({
      titulo: j ? 'Editar jogador' : 'Novo jogador',
      corpoHtml: `
        <div class="field"><label>Nome</label><input type="text" name="nome" value="${esc(j?.nome ?? '')}" required></div>
        <div class="field"><label>Seleção</label><select name="timeId" required>${opcoesTimes(j?.timeId ?? filtroTime.value)}</select></div>
        <div class="field"><label>Número</label><input type="number" name="numero" min="1" max="99" value="${j?.numero ?? ''}"></div>
        <div class="field"><label>Posição</label>
          <select name="posicao" required>
            ${POSICOES_JOGADOR.map(p => `<option value="${p}" ${j?.posicao === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Data de nascimento</label><input type="date" name="nascimento" value="${j?.nascimento ?? ''}"></div>
        <div class="field"><label>Clube</label><input type="text" name="clube" value="${esc(j?.clube ?? '')}"></div>
        <div class="field"><label>Capitão</label>
          <select name="capitao"><option value="">Não</option><option value="1" ${j?.capitao ? 'selected' : ''}>Sim</option></select>
        </div>
        <div class="field"><label>Status</label>
          <select name="status" required>
            ${Object.entries(LABELS_STATUS_JOGADOR).map(([v, l]) => `<option value="${v}" ${(j?.status ?? 'ativo') === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
      `,
      aoSalvar(dados) {
        const numero = dados.get('numero');
        const nascimento = dados.get('nascimento') || null;
        const payload = {
          nome: dados.get('nome').trim(),
          timeId: dados.get('timeId'),
          numero: numero === '' ? null : Number(numero),
          posicao: dados.get('posicao'),
          nascimento,
          idade: idadeNaCopa(nascimento),
          clube: dados.get('clube').trim(),
          capitao: dados.get('capitao') === '1',
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
    if (confirm('Excluir este jogador? Gols, assistências e cartões dele deixam de contar nas estatísticas.')) {
      DB.Jogadores.remove(id);
      renderTabela();
    }
  }

  document.getElementById('btn-novo').addEventListener('click', () => abrirFormulario(null));
  filtroTime.addEventListener('change', renderTabela);
  busca.addEventListener('input', renderTabela);

  renderTabela();
});
