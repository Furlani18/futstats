AdminUI.guardarAutenticacao();

const LABELS_STATUS_JOGO = { agendado: 'Agendado', ao_vivo: 'Ao vivo', encerrado: 'Encerrado', adiado: 'Adiado' };
const FASES_FILTRO = ['grupos', 'r32', 'r16', 'qf', 'sf', 'terceiro', 'final'];

document.addEventListener('DOMContentLoaded', () => {
  AdminUI.montarSidebar();
  AdminUI.montarTopbar();
  DB.MataMata.sincronizar();

  const filtroFase = document.getElementById('filtro-fase');
  const filtroGrupo = document.getElementById('filtro-grupo');
  const filtroStatus = document.getElementById('filtro-status');

  filtroFase.innerHTML = '<option value="">Todas as fases</option>' +
    FASES_FILTRO.map(f => `<option value="${f}">${DB.Util.faseLabel(f)}</option>`).join('');
  filtroGrupo.innerHTML = '<option value="">Todos os grupos</option>' +
    DB.Grupos.letras.map(l => `<option value="${l}">Grupo ${l}</option>`).join('');

  function renderTabela() {
    let jogos = DB.Jogos.all();
    if (filtroFase.value) jogos = jogos.filter(j => j.fase === filtroFase.value);
    if (filtroGrupo.value) jogos = jogos.filter(j => j.grupo === filtroGrupo.value);
    if (filtroStatus.value) jogos = jogos.filter(j => j.status === filtroStatus.value);
    jogos = jogos.sort((a, b) => new Date(a.data) - new Date(b.data));

    document.getElementById('tbody-jogos').innerHTML = jogos.length ? jogos.map(linha).join('') : linhaVazia();
    document.querySelectorAll('[data-editar]').forEach(btn => btn.addEventListener('click', () => abrirFormulario(btn.dataset.editar)));
  }

  function linha(jogo) {
    const mandante = DB.Times.get(jogo.mandanteId);
    const visitante = DB.Times.get(jogo.visitanteId);
    const placar = (jogo.status === 'agendado' || jogo.status === 'adiado') ? '—' : `${jogo.golsMandante} : ${jogo.golsVisitante}`;
    return `<tr>
      <td>${DB.Util.formatarDataHora(jogo.data)}</td>
      <td>${UI.rotuloJogo(jogo)}</td>
      <td>${mandante ? mandante.nome : '—'} x ${visitante ? visitante.nome : '—'}</td>
      <td>${placar}</td>
      <td>${AdminUI.badge(jogo.status, LABELS_STATUS_JOGO)}</td>
      <td class="row-actions">
        <button class="btn btn-ghost btn-sm" data-editar="${jogo.id}">Editar</button>
      </td>
    </tr>`;
  }

  function linhaVazia() {
    return '<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:24px;">Nenhum jogo encontrado.</td></tr>';
  }

  function abrirFormulario(id) {
    const jogo = DB.Jogos.get(id);
    if (!jogo) return;
    const mandante = DB.Times.get(jogo.mandanteId);
    const visitante = DB.Times.get(jogo.visitanteId);
    const eliminatoria = jogo.fase !== 'grupos';
    AdminUI.abrirModal({
      titulo: `${mandante.nome} x ${visitante.nome} — ${UI.rotuloJogo(jogo)}`,
      corpoHtml: `
        <div class="field"><label>Data e hora</label><input type="datetime-local" name="data" value="${jogo.data.slice(0, 16)}" required></div>
        <div class="field"><label>Local</label><input type="text" name="local" value="${jogo.local}" required></div>
        <div class="field"><label>Status</label>
          <select name="status" required>
            <option value="agendado" ${jogo.status === 'agendado' ? 'selected' : ''}>Agendado</option>
            <option value="ao_vivo" ${jogo.status === 'ao_vivo' ? 'selected' : ''}>Ao vivo</option>
            <option value="encerrado" ${jogo.status === 'encerrado' ? 'selected' : ''}>Encerrado</option>
            <option value="adiado" ${jogo.status === 'adiado' ? 'selected' : ''}>Adiado</option>
          </select>
        </div>
        <div class="field"><label>Gols ${mandante.nome}</label><input type="number" name="golsMandante" min="0" value="${jogo.golsMandante ?? ''}"></div>
        <div class="field"><label>Gols ${visitante.nome}</label><input type="number" name="golsVisitante" min="0" value="${jogo.golsVisitante ?? ''}"></div>
        ${eliminatoria ? `
        <div class="field"><label>Pênaltis ${mandante.nome} (se empate)</label><input type="number" name="penaltisMandante" min="0" value="${jogo.penaltisMandante ?? ''}"></div>
        <div class="field"><label>Pênaltis ${visitante.nome} (se empate)</label><input type="number" name="penaltisVisitante" min="0" value="${jogo.penaltisVisitante ?? ''}"></div>` : ''}
        <div class="field"><label>Cartões amarelos/vermelhos ${mandante.nome}</label>
          <div style="display:flex;gap:8px;">
            <input type="number" name="cartoesAmarelosMandante" min="0" value="${jogo.cartoesAmarelosMandante ?? 0}" placeholder="Amarelos">
            <input type="number" name="cartoesVermelhosMandante" min="0" value="${jogo.cartoesVermelhosMandante ?? 0}" placeholder="Vermelhos">
          </div>
        </div>
        <div class="field"><label>Cartões amarelos/vermelhos ${visitante.nome}</label>
          <div style="display:flex;gap:8px;">
            <input type="number" name="cartoesAmarelosVisitante" min="0" value="${jogo.cartoesAmarelosVisitante ?? 0}" placeholder="Amarelos">
            <input type="number" name="cartoesVermelhosVisitante" min="0" value="${jogo.cartoesVermelhosVisitante ?? 0}" placeholder="Vermelhos">
          </div>
        </div>
      `,
      aoSalvar(dados) {
        const golsM = dados.get('golsMandante');
        const golsV = dados.get('golsVisitante');
        const payload = {
          data: dados.get('data'),
          local: dados.get('local'),
          status: dados.get('status'),
          golsMandante: golsM === '' ? null : Number(golsM),
          golsVisitante: golsV === '' ? null : Number(golsV),
          cartoesAmarelosMandante: Number(dados.get('cartoesAmarelosMandante') || 0),
          cartoesVermelhosMandante: Number(dados.get('cartoesVermelhosMandante') || 0),
          cartoesAmarelosVisitante: Number(dados.get('cartoesAmarelosVisitante') || 0),
          cartoesVermelhosVisitante: Number(dados.get('cartoesVermelhosVisitante') || 0),
        };
        if (eliminatoria) {
          const penM = dados.get('penaltisMandante');
          const penV = dados.get('penaltisVisitante');
          payload.penaltisMandante = penM === '' ? null : Number(penM);
          payload.penaltisVisitante = penV === '' ? null : Number(penV);
        }
        DB.Jogos.update(jogo.id, payload);
        DB.MataMata.sincronizar();
        AdminUI.fecharModal();
        renderTabela();
      },
    });
  }

  document.getElementById('btn-sincronizar').addEventListener('click', () => {
    DB.MataMata.sincronizar();
    renderTabela();
  });
  filtroFase.addEventListener('change', renderTabela);
  filtroGrupo.addEventListener('change', renderTabela);
  filtroStatus.addEventListener('change', renderTabela);

  renderTabela();
});
