const LABELS_STATUS_JOGO = { agendado: 'Agendado', ao_vivo: 'Ao vivo', encerrado: 'Encerrado', adiado: 'Adiado' };
const FASES_FILTRO = ['grupos', 'r32', 'r16', 'qf', 'sf', 'terceiro', 'final'];
const TIPOS_GOL = { normal: 'Gol', penalti: 'Pênalti', contra: 'Gol contra' };
const TIPOS_CARTAO = { amarelo: 'Amarelo', segundo_amarelo: '2º amarelo', vermelho: 'Vermelho direto' };

AdminUI.registrar('jogos', () => {
  DB.MataMata.sincronizar();
  const comp = DB.Contexto.get();
  const ehCopa = comp.tipo === 'copa_mundo';
  // Fases em que se cadastra jogo à mão (na Copa o mata-mata nasce sozinho).
  const FASES_NOVO = {
    copa_mundo: ['grupos'], liga: ['liga'], champions: ['liga', ...(comp.fases || [])],
    grupos_mata: ['grupos', ...(comp.fases || [])], mata_mata: [...(comp.fases || [])],
  }[comp.tipo];
  const rodadasDaFase = fase => {
    if (fase === 'grupos') return ehCopa ? 3 : 6;
    if (fase === 'liga') return comp.tipo === 'champions' ? (comp.rodadasLiga || 8) : (DB.Times.all().length - 1) * 2;
    return 0;
  };
  const idaEVolta = fase => !['liga', 'grupos'].includes(fase) && !(comp.jogoUnico || []).includes(fase);

  const esc = DB.Util.escapar;
  const esc_ = esc; // nome alternativo onde `esc` é a escalação
  const filtroFase = document.getElementById('filtro-fase');
  const filtroGrupo = document.getElementById('filtro-grupo');
  const filtroStatus = document.getElementById('filtro-status');

  filtroFase.innerHTML = '<option value="">Todas as fases</option>' +
    (ehCopa ? FASES_FILTRO : FASES_NOVO).map(f => `<option value="${f}">${DB.Util.faseLabel(f)}</option>`).join('');
  filtroFase.hidden = !ehCopa && FASES_NOVO.length < 2;
  filtroGrupo.innerHTML = '<option value="">Todos os grupos</option>' +
    DB.Grupos.letras.map(l => `<option value="${l}">Grupo ${l}</option>`).join('');
  filtroGrupo.hidden = !DB.Grupos.letras.length;

  // Botões e dica conforme o formato do campeonato.
  document.getElementById('btn-importar').hidden = !ehCopa;
  document.getElementById('btn-sincronizar').hidden = !ehCopa;
  const podeGerar = comp.tipo === 'liga' || comp.tipo === 'grupos_mata';
  document.getElementById('btn-gerar').hidden = !podeGerar;
  if (!ehCopa) {
    document.getElementById('dica-jogos').innerHTML = {
      liga: 'Use <strong>Gerar rodadas</strong> para criar o turno e o returno completos (datas semanais aproximadas, editáveis) ou cadastre jogo a jogo em <strong>+ Novo jogo</strong>. Depois, lance placar, gols, assistências, cartões e escalações em <strong>Editar</strong>.',
      champions: 'Cadastre os 8 jogos de cada clube na fase de liga (sorteio da UEFA) e, depois, os confrontos do mata-mata com <strong>ida</strong> e <strong>volta</strong> — o agregado é calculado sozinho.',
      grupos_mata: 'Use <strong>Gerar rodadas</strong> para criar os 6 jogos de cada grupo; o mata-mata (ida e volta) você cadastra em <strong>+ Novo jogo</strong> conforme o sorteio.',
      mata_mata: 'Cadastre cada confronto com o jogo de <strong>ida</strong> e o de <strong>volta</strong>; o agregado e o classificado são calculados sozinhos.',
    }[comp.tipo];
  }

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
        ${!ehCopa || jogo.fase === 'grupos' ? `<button class="btn btn-danger btn-sm" data-excluir="${jogo.id}">Excluir</button>` : ''}
      </td>
    </tr>`;
  }

  function linhaVazia() {
    const vazio = !DB.Jogos.all().length;
    return `<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:24px;">
      ${vazio ? `Nenhum jogo cadastrado ainda. Use <strong>+ Novo jogo</strong>${ehCopa ? ' ou <strong>Importar calendário oficial</strong>' : document.getElementById('btn-gerar').hidden ? '' : ' ou <strong>Gerar rodadas</strong>'}.` : 'Nenhum jogo encontrado com esses filtros.'}
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
    const eliminatoria = existente && !['grupos', 'liga'].includes(existente.fase);
    const estado = {
      mandanteId: existente ? existente.mandanteId : '',
      visitanteId: existente ? existente.visitanteId : '',
      gols: existente ? (existente.gols || []).map(g => ({ ...g })) : [],
      cartoes: existente ? (existente.cartoes || []).map(c => ({ ...c })) : [],
      escalacoes: existente ? JSON.parse(JSON.stringify(existente.escalacoes || {})) : {},
    };

    const opcoesStatus = Object.entries(LABELS_STATUS_JOGO).map(([v, l]) =>
      `<option value="${v}" ${(existente ? existente.status : 'agendado') === v ? 'selected' : ''}>${l}</option>`).join('');

    const camposNovo = novo ? `
      <div class="field-row">
        <div class="field" id="campo-fase" ${FASES_NOVO.length < 2 ? 'hidden' : ''}><label>Fase</label>
          <select name="fase" id="f-fase">${FASES_NOVO.map(f => `<option value="${f}">${DB.Util.faseLabel(f)}</option>`).join('')}</select></div>
        <div class="field" id="campo-grupo"><label>Grupo</label>
          <select name="grupo" id="f-grupo">${DB.Grupos.letras.map(l => `<option value="${l}">Grupo ${l}</option>`).join('')}</select></div>
        <div class="field" id="campo-rodada"><label>Rodada</label><select name="rodada" id="f-rodada"></select></div>
        <div class="field" id="campo-perna"><label>Jogo</label>
          <select name="perna" id="f-perna"><option value="1">Ida</option><option value="2">Volta</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Mandante</label><select name="mandanteId" id="f-mandante" required></select></div>
        <div class="field"><label>Visitante</label><select name="visitanteId" id="f-visitante" required></select></div>
      </div>` : '';

    const titulo = novo
      ? `Novo jogo — ${comp.curto}`
      : `${nomeTime(existente.mandanteId)} x ${nomeTime(existente.visitanteId)} — ${UI.rotuloJogo(existente)}`;

    AdminUI.abrirModal({
      titulo,
      largo: true,
      corpoHtml: `
        ${camposNovo}
        <div class="field-row">
          <div class="field"><label>Data e hora (Brasília)</label><input type="datetime-local" name="data" value="${existente ? existente.data.slice(0, 16) : `${comp.inicio || '2026-06-11'}T16:00`}" required></div>
          <div class="field"><label>Estádio / cidade</label><input type="text" name="local" value="${esc(existente ? existente.local : '')}" placeholder="Ex.: MetLife Stadium, Nova York/Nova Jersey" required></div>
          <div class="field"><label>Status</label><select name="status" id="f-status" required>${opcoesStatus}</select></div>
        </div>
        <div class="field-row">
          <div class="field"><label id="rot-gm">Gols mandante</label><input type="number" name="golsMandante" id="f-gm" min="0" value="${existente?.golsMandante ?? ''}"></div>
          <div class="field"><label id="rot-gv">Gols visitante</label><input type="number" name="golsVisitante" id="f-gv" min="0" value="${existente?.golsVisitante ?? ''}"></div>
          ${eliminatoria ? `
          <div class="field"><label>Pênaltis mandante</label><input type="number" name="penaltisMandante" min="0" value="${existente.penaltisMandante ?? ''}"></div>
          <div class="field"><label>Pênaltis visitante</label><input type="number" name="penaltisVisitante" min="0" value="${existente.penaltisVisitante ?? ''}"></div>
          <div class="field"><label>Prorrogação</label>
            <select name="prorrogacao"><option value="">Não (90 min)</option><option value="1" ${existente.prorrogacao ? 'selected' : ''}>Sim (120 min)</option></select></div>` : ''}
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
        <details class="lances-box" id="box-escalacoes">
          <summary class="lances-head" style="cursor:pointer;">
            <span>👕 Escalações e substituições <span class="lances-hint">(opcional — gera minutos jogados, prêmios e o campinho)</span></span>
          </summary>
          <div class="escalacoes-grid" id="escalacoes"></div>
        </details>
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
      const fFase = document.getElementById('f-fase');
      const fRodada = document.getElementById('f-rodada');
      const fM = document.getElementById('f-mandante');
      const fV = document.getElementById('f-visitante');
      const ajustarFase = () => {
        const fase = fFase.value;
        document.getElementById('campo-grupo').hidden = fase !== 'grupos';
        const n = rodadasDaFase(fase);
        document.getElementById('campo-rodada').hidden = !n;
        fRodada.innerHTML = Array.from({ length: n }, (_, i) => `<option value="${i + 1}">${i + 1}ª rodada</option>`).join('');
        document.getElementById('campo-perna').hidden = !idaEVolta(fase);
        preencherTimes();
      };
      const preencherTimes = () => {
        const times = (fFase.value === 'grupos' ? DB.Grupos.times(fGrupo.value) : DB.Times.all())
          .slice().sort((a, b) => (fFase.value === 'grupos' ? 0 : a.nome.localeCompare(b.nome)));
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
        if (mudou) { estado.gols = []; estado.cartoes = []; estado.escalacoes = {}; }
        // Clube: sugere o estádio do mandante (se o campo ainda não foi digitado à mão).
        const campoLocal = document.querySelector('input[name="local"]');
        const mandante = DB.Times.get(fM.value);
        if (campoLocal && mandante && mandante.estadio && (!campoLocal.value || campoLocal.dataset.auto)) {
          campoLocal.value = mandante.estadio;
          campoLocal.dataset.auto = '1';
        }
        atualizarRotulos();
        renderLances();
      };
      fGrupo.addEventListener('change', preencherTimes);
      fFase.addEventListener('change', ajustarFase);
      fM.addEventListener('change', trocarTimes);
      fV.addEventListener('change', trocarTimes);
      document.querySelector('input[name="local"]').addEventListener('input', e => delete e.target.dataset.auto);
      ajustarFase();
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
      renderEscalacoes();
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

    // ----- Escalações -----
    function escalacaoDe(timeId) {
      return estado.escalacoes[timeId] || (estado.escalacoes[timeId] = { titulares: [], substituicoes: [] });
    }

    function elencoOrdenado(timeId) {
      const ordem = { Goleiro: 0, Defensor: 1, 'Meio-campo': 2, Atacante: 3 };
      return DB.Jogadores.all().filter(j => j.timeId === timeId)
        .sort((a, b) => (ordem[a.posicao] ?? 9) - (ordem[b.posicao] ?? 9) || (a.numero ?? 99) - (b.numero ?? 99));
    }

    function colunaEscalacao(timeId, lado) {
      const esc = escalacaoDe(timeId);
      const elenco = elencoOrdenado(timeId);
      const sigla = { Goleiro: 'GOL', Defensor: 'DEF', 'Meio-campo': 'MEI', Atacante: 'ATA' };
      const titulares = new Set(esc.titulares);
      const reservas = elenco.filter(j => !titulares.has(j.id));
      const opcoes = (lista, sel, vazio) => `<option value="">${vazio}</option>` + lista.map(j =>
        `<option value="${j.id}" ${j.id === sel ? 'selected' : ''}>${j.numero ?? ''} · ${esc_(j.nome)}</option>`).join('');
      return `<div class="escalacao-col" data-lado="${lado}">
        <div class="escalacao-titulo">${esc_(nomeTime(timeId))} <span class="lances-hint ${esc.titulares.length > 11 ? 'erro' : ''}">${esc.titulares.length}/11 titulares</span></div>
        <div class="escalacao-lista">
          ${elenco.map(j => `<label class="escalado"><input type="checkbox" data-titular="${j.id}" ${titulares.has(j.id) ? 'checked' : ''}>
            <span class="pos">${sigla[j.posicao] || ''}</span><span class="num">${j.numero ?? ''}</span><span class="nm">${esc_(j.nome)}</span></label>`).join('')}
        </div>
        <div class="escalacao-subs">
          <div class="escalacao-titulo">Substituições <button type="button" class="btn btn-ghost btn-sm" data-add-sub>+ Troca</button></div>
          ${esc.substituicoes.map((sub, i) => `<div class="lance sub" data-sub="${i}">
            <select data-campo="saiId" title="Sai">${opcoes(elenco.filter(j => titulares.has(j.id) || esc.substituicoes.some(x => x.entraId === j.id)), sub.saiId, 'Sai…')}</select>
            <select data-campo="entraId" title="Entra">${opcoes(reservas, sub.entraId, 'Entra…')}</select>
            <input data-campo="minuto" value="${esc_(sub.minuto || '')}" placeholder="Min.">
            <button type="button" class="btn btn-icon btn-sm" data-remover-sub title="Remover">✕</button>
          </div>`).join('') || '<div class="lances-vazio">Nenhuma troca.</div>'}
        </div>
      </div>`;
    }

    function renderEscalacoes() {
      const box = document.getElementById('escalacoes');
      if (!estado.mandanteId || !estado.visitanteId) { box.innerHTML = ''; return; }
      box.innerHTML = colunaEscalacao(estado.mandanteId, 'm') + colunaEscalacao(estado.visitanteId, 'v');
      box.querySelectorAll('.escalacao-col').forEach(col => {
        const timeId = col.dataset.lado === 'm' ? estado.mandanteId : estado.visitanteId;
        const esc = escalacaoDe(timeId);
        col.querySelectorAll('[data-titular]').forEach(cb => cb.addEventListener('change', () => {
          const id = cb.dataset.titular;
          esc.titulares = cb.checked ? [...esc.titulares, id] : esc.titulares.filter(x => x !== id);
          renderEscalacoes();
        }));
        col.querySelector('[data-add-sub]').addEventListener('click', () => {
          esc.substituicoes.push({ saiId: null, entraId: null, minuto: '' });
          renderEscalacoes();
        });
        col.querySelectorAll('[data-sub]').forEach(linhaSub => {
          const sub = esc.substituicoes[Number(linhaSub.dataset.sub)];
          linhaSub.querySelectorAll('[data-campo]').forEach(campo => campo.addEventListener('change', () => {
            sub[campo.dataset.campo] = campo.value || null;
            if (campo.dataset.campo !== 'minuto') renderEscalacoes();
          }));
          linhaSub.querySelector('[data-remover-sub]').addEventListener('click', () => {
            esc.substituicoes.splice(Number(linhaSub.dataset.sub), 1);
            renderEscalacoes();
          });
        });
      });
    }

    atualizarRotulos();
    renderLances();

    // ----- Validação e gravação -----
    function validar(dados) {
      if (!estado.mandanteId || !estado.visitanteId) return 'Escolha os dois times.';
      if (estado.mandanteId === estado.visitanteId) return 'Mandante e visitante precisam ser times diferentes.';
      if (novo) {
        const fase = dados.get('fase');
        const mesmoPar = j => [j.mandanteId, j.visitanteId].sort().join('|') === [estado.mandanteId, estado.visitanteId].sort().join('|');
        const mesmoMando = j => j.mandanteId === estado.mandanteId && j.visitanteId === estado.visitanteId;
        const daFase = DB.Jogos.all().filter(j => j.fase === fase && (fase !== 'grupos' || j.grupo === dados.get('grupo')));
        // Copa: um jogo por par no grupo. Ligas/grupos de clubes: turno e returno (um jogo por mando).
        // Mata-mata: um jogo por perna.
        if (ehCopa && daFase.some(mesmoPar)) return 'Esse confronto já está cadastrado neste grupo.';
        if (!ehCopa && ['liga', 'grupos'].includes(fase) && daFase.some(mesmoMando)) return 'Esse jogo (com esse mando) já está cadastrado.';
        if (idaEVolta(fase) && daFase.some(j => mesmoPar(j) && String(j.perna) === dados.get('perna'))) return 'Esse jogo do confronto já está cadastrado.';
        if (!idaEVolta(fase) && !['liga', 'grupos'].includes(fase) && daFase.some(mesmoPar)) return 'Esse confronto já está cadastrado.';
      }
      const status = dados.get('status');
      const gm = dados.get('golsMandante'), gv = dados.get('golsVisitante');
      if ((status === 'encerrado' || status === 'ao_vivo') && (gm === '' || gv === '')) return 'Informe o placar dos dois times para jogos ao vivo ou encerrados.';
      const { m, v } = contarGols();
      if (m > Number(gm || 0) || v > Number(gv || 0)) return 'Há mais gols lançados do que o placar informa.';
      if (estado.gols.some(g => !g.jogadorId)) return 'Escolha o autor de cada gol (ou remova a linha).';
      if (estado.cartoes.some(c => !c.jogadorId)) return 'Escolha o jogador de cada cartão (ou remova a linha).';
      for (const timeId of [estado.mandanteId, estado.visitanteId]) {
        const esc = estado.escalacoes[timeId];
        if (!esc) continue;
        if (esc.titulares.length > 11) return `${nomeTime(timeId)} tem mais de 11 titulares marcados.`;
        if (esc.substituicoes.some(sub => !sub.saiId || !sub.entraId)) return `Complete quem sai e quem entra em cada troca de ${nomeTime(timeId)}.`;
      }
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
        // Guarda só as escalações preenchidas.
        escalacoes: Object.fromEntries(Object.entries(estado.escalacoes)
          .filter(([timeId, esc]) => [estado.mandanteId, estado.visitanteId].includes(timeId) && (esc.titulares.length || esc.substituicoes.length))),
      };
      if (eliminatoria) {
        payload.penaltisMandante = numero(dados.get('penaltisMandante'));
        payload.penaltisVisitante = numero(dados.get('penaltisVisitante'));
        payload.prorrogacao = dados.get('prorrogacao') === '1';
      }
      if (novo) {
        const fase = dados.get('fase');
        const criado = DB.Jogos.criar({
          fase,
          grupo: fase === 'grupos' ? dados.get('grupo') : null,
          rodada: rodadasDaFase(fase) ? Number(dados.get('rodada')) : null,
          perna: idaEVolta(fase) ? Number(dados.get('perna')) : null,
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
  document.getElementById('btn-gerar').addEventListener('click', () => {
    const msg = comp.tipo === 'liga'
      ? `Criar o turno e o returno completos (${(DB.Times.all().length - 1) * 2} rodadas) com datas semanais a partir de ${DB.Util.formatarData(`${comp.inicio}T12:00`)}? As datas são aproximadas e podem ser editadas; jogos já cadastrados são mantidos.`
      : 'Criar os 6 jogos de cada grupo (turno e returno) com datas semanais aproximadas? Jogos já cadastrados são mantidos.';
    if (!confirm(msg)) return;
    let criados = 0;
    if (comp.tipo === 'liga') {
      criados = DB.Jogos.gerarTurnoReturno({ ids: DB.Times.all().map(t => t.id), fase: 'liga', inicio: comp.inicio || '2026-08-15' });
    } else {
      DB.Grupos.letras.forEach(letra => {
        criados += DB.Jogos.gerarTurnoReturno({ ids: DB.Grupos.times(letra).map(t => t.id), fase: 'grupos', grupo: letra, inicio: comp.inicio || '2026-04-07' });
      });
    }
    alert(criados ? `${criados} jogos criados.` : 'Todos os jogos já estavam cadastrados.');
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
