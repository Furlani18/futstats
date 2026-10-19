const LABELS_STATUS_JOGO = { agendado: 'Agendado', ao_vivo: 'Ao vivo', encerrado: 'Encerrado', adiado: 'Adiado' };
const FASES_FILTRO = ['grupos', 'r32', 'r16', 'qf', 'sf', 'terceiro', 'final'];
const TIPOS_GOL = { normal: 'Gol', penalti: 'Pênalti', contra: 'Gol contra' };
const TIPOS_CARTAO = { amarelo: 'Amarelo', segundo_amarelo: '2º amarelo', vermelho: 'Vermelho direto' };

AdminUI.registrar('jogos', () => {
  DB.MataMata.sincronizar();

  const esc = DB.Util.escapar;
  const filtroFase = document.getElementById('filtro-fase');
  const filtroGrupo = document.getElementById('filtro-grupo');
  const filtroStatus = document.getElementById('filtro-status');

  filtroFase.innerHTML = '<option value="">Todas as fases</option>' +
    FASES_FILTRO.map(f => `<option value="${f}">${DB.Util.faseLabel(f)}</option>`).join('');
  filtroGrupo.innerHTML = '<option value="">Todos os grupos</option>' +
    DB.Grupos.letras.map(l => `<option value="${l}">Grupo ${l}</option>`).join('');

  function nomeTime(id) {
    const t = DB.Times.get(id);
    return t ? t.nome : '—';
  }

  function renderTabela() {
    let jogos = DB.Jogos.all();
    if (filtroFase.value) jogos = jogos.filter(j => j.fase === filtroFase.value);
    if (filtroGrupo.value) jogos = jogos.filter(j => j.grupo === filtroGrupo.value);
    if (filtroStatus.value) jogos = jogos.filter(j => j.status === filtroStatus.value);
    jogos = jogos.sort((a, b) => new Date(a.data) - new Date(b.data));

    document.getElementById('tbody-jogos').innerHTML = jogos.length ? jogos.map(linha).join('') : linhaVazia();
    document.querySelectorAll('[data-editar]').forEach(btn => btn.addEventListener('click', () => abrirFormulario(btn.dataset.editar)));
    document.querySelectorAll('[data-excluir]').forEach(btn => btn.addEventListener('click', () => excluir(btn.dataset.excluir)));
  }

  function linha(jogo) {
    const placar = UI.temPlacar(jogo) ? `${jogo.golsMandante} : ${jogo.golsVisitante}` : '—';
    const lances = (jogo.gols || []).length + (jogo.cartoes || []).length;
    return `<tr>
      <td>${DB.Util.formatarDataHora(jogo.data)}</td>
      <td>${UI.rotuloJogo(jogo)}</td>
      <td>${esc(nomeTime(jogo.mandanteId))} x ${esc(nomeTime(jogo.visitanteId))}</td>
      <td>${placar}</td>
      <td>${lances ? `${(jogo.gols || []).length} ⚽ · ${(jogo.cartoes || []).length} 🟨` : '—'}</td>
      <td>${AdminUI.badge(jogo.status, LABELS_STATUS_JOGO)}</td>
      <td class="row-actions">
        <button class="btn btn-ghost btn-sm" data-editar="${jogo.id}">Editar</button>
        ${jogo.fase === 'grupos' ? `<button class="btn btn-danger btn-sm" data-excluir="${jogo.id}">Excluir</button>` : ''}
      </td>
    </tr>`;
  }

  function linhaVazia() {
    const vazio = !DB.Jogos.all().length;
    return `<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:24px;">
      ${vazio ? 'Nenhum jogo cadastrado ainda. Use <strong>+ Novo jogo</strong> ou <strong>Importar calendário oficial</strong>.' : 'Nenhum jogo encontrado com esses filtros.'}
    </td></tr>`;
  }

  // ---------- Formulário (novo jogo / edição) ----------

  function opcoesJogadores(timeId, selecionado, vazioLabel) {
    const elenco = DB.Jogadores.all().filter(j => j.timeId === timeId)
      .sort((a, b) => (a.numero ?? 99) - (b.numero ?? 99) || a.nome.localeCompare(b.nome));
    return `<option value="">${vazioLabel}</option>` + elenco.map(j =>
      `<option value="${j.id}" ${j.id === selecionado ? 'selected' : ''}>${j.numero != null ? `${j.numero} · ` : ''}${esc(j.nome)}</option>`).join('');
  }

  function abrirFormulario(id) {
    const existente = id ? DB.Jogos.get(id) : null;
    const novo = !existente;
    const eliminatoria = existente && existente.fase !== 'grupos';
    const estado = {
      mandanteId: existente ? existente.mandanteId : '',
      visitanteId: existente ? existente.visitanteId : '',
      gols: existente ? (existente.gols || []).map(g => ({ ...g })) : [],
      cartoes: existente ? (existente.cartoes || []).map(c => ({ ...c })) : [],
    };

    const opcoesStatus = Object.entries(LABELS_STATUS_JOGO).map(([v, l]) =>
      `<option value="${v}" ${(existente ? existente.status : 'agendado') === v ? 'selected' : ''}>${l}</option>`).join('');

    const camposNovo = novo ? `
      <div class="field-row">
        <div class="field"><label>Grupo</label>
          <select name="grupo" id="f-grupo" required>${DB.Grupos.letras.map(l => `<option value="${l}">Grupo ${l}</option>`).join('')}</select></div>
        <div class="field"><label>Rodada</label>
          <select name="rodada">${[1, 2, 3].map(r => `<option value="${r}">${r}ª rodada</option>`).join('')}</select></div>
        <div class="field"><label>Mandante</label><select name="mandanteId" id="f-mandante" required></select></div>
        <div class="field"><label>Visitante</label><select name="visitanteId" id="f-visitante" required></select></div>
      </div>` : '';

    const titulo = novo
      ? 'Novo jogo — fase de grupos'
      : `${nomeTime(existente.mandanteId)} x ${nomeTime(existente.visitanteId)} — ${UI.rotuloJogo(existente)}`;

    AdminUI.abrirModal({
      titulo,
      largo: true,
      corpoHtml: `
        ${camposNovo}
        <div class="field-row">
          <div class="field"><label>Data e hora (Brasília)</label><input type="datetime-local" name="data" value="${existente ? existente.data.slice(0, 16) : '2026-06-11T16:00'}" required></div>
          <div class="field"><label>Estádio / cidade</label><input type="text" name="local" value="${esc(existente ? existente.local : '')}" placeholder="Ex.: MetLife Stadium, Nova York/Nova Jersey" required></div>
          <div class="field"><label>Status</label><select name="status" id="f-status" required>${opcoesStatus}</select></div>
        </div>
        <div class="field-row">
          <div class="field"><label id="rot-gm">Gols mandante</label><input type="number" name="golsMandante" id="f-gm" min="0" value="${existente?.golsMandante ?? ''}"></div>
          <div class="field"><label id="rot-gv">Gols visitante</label><input type="number" name="golsVisitante" id="f-gv" min="0" value="${existente?.golsVisitante ?? ''}"></div>
          ${eliminatoria ? `
          <div class="field"><label>Pênaltis mandante</label><input type="number" name="penaltisMandante" min="0" value="${existente.penaltisMandante ?? ''}"></div>
          <div class="field"><label>Pênaltis visitante</label><input type="number" name="penaltisVisitante" min="0" value="${existente.penaltisVisitante ?? ''}"></div>` : ''}
        </div>

        <div class="lances-box">
          <div class="lances-head">
            <span>⚽ Gols e assistências <span class="lances-hint" id="hint-gols"></span></span>
            <span class="acoes">
              <button type="button" class="btn btn-ghost btn-sm" data-add-gol="m">+ Gol mandante</button>
              <button type="button" class="btn btn-ghost btn-sm" data-add-gol="v">+ Gol visitante</button>
            </span>
          </div>
          <div class="lances-lista" id="lista-gols"></div>
        </div>

        <div class="lances-box">
          <div class="lances-head">
            <span>🟨 Cartões</span>
            <span class="acoes">
              <button type="button" class="btn btn-ghost btn-sm" data-add-cartao="m">+ Cartão mandante</button>
              <button type="button" class="btn btn-ghost btn-sm" data-add-cartao="v">+ Cartão visitante</button>
            </span>
          </div>
          <div class="lances-lista" id="lista-cartoes"></div>
        </div>
        <div class="field-error" id="erro-jogo" style="display:none;"></div>
      `,
      aoSalvar(dados) {
        const erro = validar(dados);
        const caixa = document.getElementById('erro-jogo');
        if (erro) {
          caixa.textContent = erro;
          caixa.style.display = 'block';
          caixa.scrollIntoView({ block: 'nearest' });
          return;
        }
        salvar(dados);
        AdminUI.fecharModal();
        renderTabela();
      },
    });

    const fGm = document.getElementById('f-gm');
    const fGv = document.getElementById('f-gv');

    // ----- Seleção de times (só para jogo novo) -----
    if (novo) {
      const fGrupo = document.getElementById('f-grupo');
      const fM = document.getElementById('f-mandante');
      const fV = document.getElementById('f-visitante');
      const preencherTimes = () => {
        const times = DB.Grupos.times(fGrupo.value);
        const opts = times.map(t => `<option value="${t.id}">${esc(t.nome)}</option>`).join('');
        fM.innerHTML = opts;
        fV.innerHTML = opts;
        fV.selectedIndex = Math.min(1, times.length - 1);
        trocarTimes();
      };
      const trocarTimes = () => {
        const mudou = estado.mandanteId !== fM.value || estado.visitanteId !== fV.value;
        estado.mandanteId = fM.value;
        estado.visitanteId = fV.value;
        // Lances de outro confronto não fazem sentido: começa do zero.
        if (mudou) { estado.gols = []; estado.cartoes = []; }
        atualizarRotulos();
        renderLances();
      };
      fGrupo.addEventListener('change', preencherTimes);
      fM.addEventListener('change', trocarTimes);
      fV.addEventListener('change', trocarTimes);
      preencherTimes();
    }

    function atualizarRotulos() {
      document.getElementById('rot-gm').textContent = `Gols ${nomeTime(estado.mandanteId)}`;
      document.getElementById('rot-gv').textContent = `Gols ${nomeTime(estado.visitanteId)}`;
      document.querySelectorAll('[data-add-gol="m"]').forEach(b => { b.textContent = `+ Gol ${nomeTime(estado.mandanteId)}`; });
      document.querySelectorAll('[data-add-gol="v"]').forEach(b => { b.textContent = `+ Gol ${nomeTime(estado.visitanteId)}`; });
      document.querySelectorAll('[data-add-cartao="m"]').forEach(b => { b.textContent = `+ Cartão ${nomeTime(estado.mandanteId)}`; });
      document.querySelectorAll('[data-add-cartao="v"]').forEach(b => { b.textContent = `+ Cartão ${nomeTime(estado.visitanteId)}`; });
    }

    const adversario = timeId => (timeId === estado.mandanteId ? estado.visitanteId : estado.mandanteId);
    const opcaoTime = (sel) => [estado.mandanteId, estado.visitanteId].map(tid =>
      `<option value="${tid}" ${tid === sel ? 'selected' : ''}>${esc(nomeTime(tid))}</option>`).join('');

    function linhaGol(g, i) {
      // Gol contra: autor é do time adversário ao que recebe o gol.
      const timeAutor = g.tipo === 'contra' ? adversario(g.timeId) : g.timeId;
      return `<div class="lance" data-i="${i}">
        <select data-campo="timeId" title="Gol a favor de">${opcaoTime(g.timeId)}</select>
        <select data-campo="tipo">${Object.entries(TIPOS_GOL).map(([v, l]) => `<option value="${v}" ${g.tipo === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select data-campo="jogadorId" title="Autor">${opcoesJogadores(timeAutor, g.jogadorId, 'Autor do gol…')}</select>
        <select data-campo="assistenciaId" title="Assistência" ${g.tipo === 'contra' ? 'disabled' : ''}>${opcoesJogadores(g.timeId, g.assistenciaId, 'Sem assistência')}</select>
        <input data-campo="minuto" value="${esc(g.minuto || '')}" placeholder="Min." title="Minuto (ex.: 45+2)">
        <button type="button" class="btn btn-icon btn-sm" data-remover title="Remover">✕</button>
      </div>`;
    }

    function linhaCartao(c, i) {
      return `<div class="lance cartao" data-i="${i}">
        <select data-campo="timeId">${opcaoTime(c.timeId)}</select>
        <select data-campo="tipo">${Object.entries(TIPOS_CARTAO).map(([v, l]) => `<option value="${v}" ${c.tipo === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select data-campo="jogadorId">${opcoesJogadores(c.timeId, c.jogadorId, 'Jogador…')}</select>
        <input data-campo="minuto" value="${esc(c.minuto || '')}" placeholder="Min.">
        <button type="button" class="btn btn-icon btn-sm" data-remover title="Remover">✕</button>
      </div>`;
    }

    function contarGols() {
      return {
        m: estado.gols.filter(g => g.timeId === estado.mandanteId).length,
        v: estado.gols.filter(g => g.timeId === estado.visitanteId).length,
      };
    }

    // O placar nunca fica menor que o número de gols lançados.
    function ajustarPlacar() {
      const { m, v } = contarGols();
      if (m > Number(fGm.value || 0)) fGm.value = m;
      if (v > Number(fGv.value || 0)) fGv.value = v;
      const hint = document.getElementById('hint-gols');
      const total = Number(fGm.value || 0) + Number(fGv.value || 0);
      hint.textContent = total ? `· ${m + v} de ${total} gols com autor` : '';
    }

    function ligarLista(containerId, lista, render, aoMudarCampo) {
      const box = document.getElementById(containerId);
      box.innerHTML = lista.length ? lista.map(render).join('') : '<div class="lances-vazio">Nenhum lance.</div>';
      box.querySelectorAll('.lance').forEach(el => {
        const item = lista[Number(el.dataset.i)];
        el.querySelectorAll('[data-campo]').forEach(campo => {
          campo.addEventListener('change', () => {
            item[campo.dataset.campo] = campo.value || null;
            if (aoMudarCampo(campo.dataset.campo, item)) renderLances();
            else ajustarPlacar();
          });
        });
        el.querySelector('[data-remover]').addEventListener('click', () => {
          lista.splice(Number(el.dataset.i), 1);
          renderLances();
        });
      });
    }

    function renderLances() {
      ligarLista('lista-gols', estado.gols, linhaGol, (campo, g) => {
        if (campo === 'timeId' || campo === 'tipo') {
          // Mudou o time ou virou gol contra: o autor/assistente anterior pode não valer mais.
          g.jogadorId = null;
          g.assistenciaId = null;
          return true;
        }
        if (campo === 'jogadorId' && g.assistenciaId === g.jogadorId) g.assistenciaId = null;
        return false;
      });
      ligarLista('lista-cartoes', estado.cartoes, linhaCartao, (campo, c) => {
        if (campo === 'timeId') { c.jogadorId = null; return true; }
        return false;
      });
      ajustarPlacar();
    }

    const uid = () => `l_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    document.querySelectorAll('[data-add-gol]').forEach(btn => btn.addEventListener('click', () => {
      if (!estado.mandanteId || !estado.visitanteId) return;
      const timeId = btn.dataset.addGol === 'm' ? estado.mandanteId : estado.visitanteId;
      estado.gols.push({ id: uid(), timeId, jogadorId: null, assistenciaId: null, minuto: '', tipo: 'normal' });
      if (document.getElementById('f-status').value === 'agendado') document.getElementById('f-status').value = 'ao_vivo';
      renderLances();
    }));
    document.querySelectorAll('[data-add-cartao]').forEach(btn => btn.addEventListener('click', () => {
      if (!estado.mandanteId || !estado.visitanteId) return;
      const timeId = btn.dataset.addCartao === 'm' ? estado.mandanteId : estado.visitanteId;
      estado.cartoes.push({ id: uid(), timeId, jogadorId: null, minuto: '', tipo: 'amarelo' });
      renderLances();
    }));
    fGm.addEventListener('input', ajustarPlacar);
    fGv.addEventListener('input', ajustarPlacar);

    atualizarRotulos();
    renderLances();

    // ----- Validação e gravação -----
    function validar(dados) {
      if (!estado.mandanteId || !estado.visitanteId) return 'Escolha as duas seleções.';
      if (estado.mandanteId === estado.visitanteId) return 'Mandante e visitante precisam ser seleções diferentes.';
      if (novo) {
        const chave = [estado.mandanteId, estado.visitanteId].sort().join('|');
        const repetido = DB.Jogos.porGrupo(dados.get('grupo')).some(j => [j.mandanteId, j.visitanteId].sort().join('|') === chave);
        if (repetido) return 'Esse confronto já está cadastrado neste grupo.';
      }
      const status = dados.get('status');
      const gm = dados.get('golsMandante'), gv = dados.get('golsVisitante');
      if ((status === 'encerrado' || status === 'ao_vivo') && (gm === '' || gv === '')) return 'Informe o placar dos dois times para jogos ao vivo ou encerrados.';
      const { m, v } = contarGols();
      if (m > Number(gm || 0) || v > Number(gv || 0)) return 'Há mais gols lançados do que o placar informa.';
      if (estado.gols.some(g => !g.jogadorId)) return 'Escolha o autor de cada gol (ou remova a linha).';
      if (estado.cartoes.some(c => !c.jogadorId)) return 'Escolha o jogador de cada cartão (ou remova a linha).';
      if (eliminatoria && status === 'encerrado' && Number(gm) === Number(gv)) {
        const pm = dados.get('penaltisMandante'), pv = dados.get('penaltisVisitante');
        if (pm === '' || pv === '' || Number(pm) === Number(pv)) return 'Jogo de mata-mata empatado precisa de um vencedor nos pênaltis.';
      }
      return null;
    }

    function salvar(dados) {
      const numero = v => (v === '' || v == null ? null : Number(v));
      const payload = {
        data: dados.get('data'),
        local: dados.get('local').trim(),
        status: dados.get('status'),
        golsMandante: numero(dados.get('golsMandante')),
        golsVisitante: numero(dados.get('golsVisitante')),
        gols: estado.gols.map(g => ({ ...g, assistenciaId: g.tipo === 'contra' ? null : g.assistenciaId })),
        cartoes: estado.cartoes,
      };
      if (eliminatoria) {
        payload.penaltisMandante = numero(dados.get('penaltisMandante'));
        payload.penaltisVisitante = numero(dados.get('penaltisVisitante'));
      }
      if (novo) {
        const criado = DB.Jogos.criarJogoDeGrupo({
          grupo: dados.get('grupo'), rodada: Number(dados.get('rodada')),
          mandanteId: estado.mandanteId, visitanteId: estado.visitanteId,
          data: payload.data, local: payload.local,
        });
        DB.Jogos.update(criado.id, payload);
      } else {
        DB.Jogos.update(existente.id, payload);
      }
      DB.MataMata.sincronizar();
    }
  }

  function excluir(id) {
    const jogo = DB.Jogos.get(id);
    if (!jogo) return;
    if (!confirm(`Excluir ${nomeTime(jogo.mandanteId)} x ${nomeTime(jogo.visitanteId)}? Gols e cartões deste jogo também serão apagados.`)) return;
    DB.Jogos.remove(id);
    DB.MataMata.sincronizar();
    renderTabela();
  }

  document.getElementById('btn-novo').addEventListener('click', () => abrirFormulario(null));
  document.getElementById('btn-importar').addEventListener('click', () => {
    if (typeof CALENDARIO_GRUPOS_2026 === 'undefined') return;
    if (!confirm('Importar os 72 jogos da fase de grupos com datas, horários e estádios oficiais? Nenhum placar é importado, e confrontos já cadastrados são mantidos.')) return;
    const criados = DB.Jogos.importarCalendario(CALENDARIO_GRUPOS_2026);
    alert(criados ? `${criados} jogos importados.` : 'Todos os confrontos da fase de grupos já estavam cadastrados.');
    renderTabela();
  });
  document.getElementById('btn-sincronizar').addEventListener('click', () => {
    DB.MataMata.sincronizar();
    renderTabela();
  });
  filtroFase.addEventListener('change', renderTabela);
  filtroGrupo.addEventListener('change', renderTabela);
  filtroStatus.addEventListener('change', renderTabela);

  renderTabela();
});
