const LABELS_STATUS_JOGO = { agendado: 'Agendado', ao_vivo: 'Ao vivo', encerrado: 'Encerrado', adiado: 'Adiado' };
const FASES_FILTRO = ['grupos', 'r32', 'r16', 'qf', 'sf', 'terceiro', 'final'];
const TIPOS_GOL = { normal: 'Gol', penalti: 'Pênalti', contra: 'Gol contra' };
const POSICOES_JOGO = [['Goleiro', 'GOL'], ['Defensor', 'DEF'], ['Meio-campo', 'MEI'], ['Meia ofensivo', 'MOF'], ['Atacante', 'ATA']];
const ESTATISTICAS_JOGO = [
  ['posse', 'Posse de bola (%)', 100], ['finalizacoes', 'Finalizações'], ['noAlvo', 'No alvo'],
  ['escanteios', 'Escanteios'], ['faltas', 'Faltas'], ['impedimentos', 'Impedimentos'], ['defesas', 'Defesas do goleiro'],
];
// Formações (sem o goleiro): linhas da defesa ao ataque. "Meia ofensivo" é a linha de trás dos atacantes.
const FORMACOES = {
  '4-3-3': [['Defensor', 4], ['Meio-campo', 3], ['Atacante', 3]],
  '4-4-2': [['Defensor', 4], ['Meio-campo', 4], ['Atacante', 2]],
  '4-2-3-1': [['Defensor', 4], ['Meio-campo', 2], ['Meia ofensivo', 3], ['Atacante', 1]],
  '4-1-4-1': [['Defensor', 4], ['Meio-campo', 1], ['Meia ofensivo', 4], ['Atacante', 1]],
  '4-3-1-2': [['Defensor', 4], ['Meio-campo', 3], ['Meia ofensivo', 1], ['Atacante', 2]],
  '3-5-2': [['Defensor', 3], ['Meio-campo', 5], ['Atacante', 2]],
  '3-4-3': [['Defensor', 3], ['Meio-campo', 4], ['Atacante', 3]],
  '5-3-2': [['Defensor', 5], ['Meio-campo', 3], ['Atacante', 2]],
  '5-4-1': [['Defensor', 5], ['Meio-campo', 4], ['Atacante', 1]],
};
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

  document.getElementById('titulo-jogos').textContent = `Jogos · ${comp.curto} ${comp.temporada}`;

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
      <td>${lances ? `${(jogo.gols || []).length} ${UI.icone('bola')} · ${(jogo.cartoes || []).length} <span class="card-icon" title="Cartões"></span>` : '—'}</td>
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
      notas: existente ? { ...(existente.notas || {}) } : {},
    };
    // Editor de escalação: vagas de cada time e o que está selecionado no painel.
    const editor = {};
    const ui = { aba: null, vaga: null, sel: null, sub: null, msg: '', colar: false, filtro: '' };
    const SIGLA = Object.fromEntries(POSICOES_JOGO);

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
            <span>${UI.icone('bola')} Gols e assistências <span class="lances-hint" id="hint-gols"></span></span>
            <span class="acoes">
              <button type="button" class="btn btn-ghost btn-sm" data-add-gol="m">+ Gol mandante</button>
              <button type="button" class="btn btn-ghost btn-sm" data-add-gol="v">+ Gol visitante</button>
            </span>
          </div>
          <div class="lances-lista" id="lista-gols"></div>
        </div>

        <div class="lances-box">
          <div class="lances-head">
            <span><span class="card-icon"></span> Cartões</span>
            <span class="acoes">
              <button type="button" class="btn btn-ghost btn-sm" data-add-cartao="m">+ Cartão mandante</button>
              <button type="button" class="btn btn-ghost btn-sm" data-add-cartao="v">+ Cartão visitante</button>
            </span>
          </div>
          <div class="lances-lista" id="lista-cartoes"></div>
        </div>
        <details class="lances-box" id="box-escalacoes" ${Object.keys(existente?.escalacoes || {}).length ? 'open' : ''}>
          <summary class="lances-head" style="cursor:pointer;">
            <span>${UI.icone('camisa')} Escalações e substituições <span class="lances-hint">(opcional — gera minutos jogados, prêmios e o campinho)</span></span>
          </summary>
          <div class="esc-editor" id="escalacoes"></div>
        </details>
        <details class="lances-box" id="box-estatisticas" ${Object.keys(existente?.estatisticas || {}).length ? 'open' : ''}>
          <summary class="lances-head" style="cursor:pointer;">
            <span>${UI.icone('estatisticas')} Estatísticas da partida <span class="lances-hint">(opcional — aparecem em barras na página do jogo)</span></span>
          </summary>
          <div class="est-form">
            <div class="est-form-linha cab"><span></span><span id="est-rot-m">Mandante</span><span id="est-rot-v">Visitante</span></div>
            ${ESTATISTICAS_JOGO.map(([chave, rotulo, max]) => {
              const par = (existente?.estatisticas || {})[chave] || ['', ''];
              return `<div class="est-form-linha"><span>${rotulo}</span>
                <input type="number" min="0" ${max ? `max="${max}"` : ''} name="est_${chave}_m" data-est="${chave}" data-lado="0" value="${par[0] ?? ''}">
                <input type="number" min="0" ${max ? `max="${max}"` : ''} name="est_${chave}_v" data-est="${chave}" data-lado="1" value="${par[1] ?? ''}"></div>`;
            }).join('')}
          </div>
        </details>
        <details class="lances-box" id="box-notas">
          <summary class="lances-head" style="cursor:pointer;">
            <span>${UI.icone('estrela')} Notas dos jogadores <span class="lances-hint">(opcional — em branco usa a nota automática, mostrada em cinza)</span></span>
          </summary>
          <div class="notas-grid" id="notas-jogadores"></div>
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
        if (mudou) { estado.gols = []; estado.cartoes = []; estado.escalacoes = {}; estado.notas = {}; Object.keys(editor).forEach(k => delete editor[k]); }
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
      document.getElementById('est-rot-m').textContent = nomeTime(estado.mandanteId);
      document.getElementById('est-rot-v').textContent = nomeTime(estado.visitanteId);
      document.querySelectorAll('[data-add-gol="m"]').forEach(b => { b.textContent = `+ Gol ${nomeTime(estado.mandanteId)}`; });
      document.querySelectorAll('[data-add-gol="v"]').forEach(b => { b.textContent = `+ Gol ${nomeTime(estado.visitanteId)}`; });
      document.querySelectorAll('[data-add-cartao="m"]').forEach(b => { b.textContent = `+ Cartão ${nomeTime(estado.mandanteId)}`; });
      document.querySelectorAll('[data-add-cartao="v"]').forEach(b => { b.textContent = `+ Cartão ${nomeTime(estado.visitanteId)}`; });
    }

    const adversario = timeId => (timeId === estado.mandanteId ? estado.visitanteId : estado.mandanteId);
    const opcaoTime = (sel) => [estado.mandanteId, estado.visitanteId].map(tid =>
      `<option value="${tid}" ${tid === sel ? 'selected' : ''}>${esc(nomeTime(tid))}</option>`).join('');

    // Jogadores do lance: com escalação, "Em campo" (titulares e quem entrou) vem antes do resto do elenco.
    function opcoesJogo(timeId, selecionado, vazioLabel) {
      const esc = estado.escalacoes[timeId];
      const emCampo = esc ? [...esc.titulares, ...esc.substituicoes.map(s => s.entraId).filter(Boolean)] : [];
      if (!emCampo.length) return opcoesJogadores(timeId, selecionado, vazioLabel);
      const elenco = DB.Jogadores.all().filter(j => j.timeId === timeId)
        .sort((a, b) => (a.numero ?? 99) - (b.numero ?? 99) || a.nome.localeCompare(b.nome));
      const op = j => `<option value="${j.id}" ${j.id === selecionado ? 'selected' : ''}>${j.numero != null ? `${j.numero} · ` : ''}${esc_(j.nome)}</option>`;
      return `<option value="">${vazioLabel}</option><optgroup label="Em campo">${elenco.filter(j => emCampo.includes(j.id)).map(op).join('')}</optgroup>
        <optgroup label="Resto do elenco">${elenco.filter(j => !emCampo.includes(j.id)).map(op).join('')}</optgroup>`;
    }

    function linhaGol(g, i) {
      // Gol contra: autor é do time adversário ao que recebe o gol.
      const timeAutor = g.tipo === 'contra' ? adversario(g.timeId) : g.timeId;
      return `<div class="lance" data-i="${i}">
        <select data-campo="timeId" title="Gol a favor de">${opcaoTime(g.timeId)}</select>
        <select data-campo="tipo">${Object.entries(TIPOS_GOL).map(([v, l]) => `<option value="${v}" ${g.tipo === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select data-campo="jogadorId" title="Autor">${opcoesJogo(timeAutor, g.jogadorId, 'Autor do gol…')}</select>
        <select data-campo="assistenciaId" title="Assistência" ${g.tipo === 'contra' ? 'disabled' : ''}>${opcoesJogo(g.timeId, g.assistenciaId, 'Sem assistência')}</select>
        <input data-campo="minuto" value="${esc(g.minuto || '')}" placeholder="Minuto" title="Minuto do lance (ex.: 67 ou 90+2)" title="Minuto (ex.: 45+2)">
        <button type="button" class="btn btn-icon btn-sm" data-remover title="Remover" aria-label="Remover">${UI.icone('fechar')}</button>
      </div>`;
    }

    function linhaCartao(c, i) {
      return `<div class="lance cartao" data-i="${i}">
        <select data-campo="timeId">${opcaoTime(c.timeId)}</select>
        <select data-campo="tipo">${Object.entries(TIPOS_CARTAO).map(([v, l]) => `<option value="${v}" ${c.tipo === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select data-campo="jogadorId">${opcoesJogo(c.timeId, c.jogadorId, 'Jogador…')}</select>
        <input data-campo="minuto" value="${esc(c.minuto || '')}" placeholder="Minuto" title="Minuto do lance (ex.: 67 ou 90+2)">
        <button type="button" class="btn btn-icon btn-sm" data-remover title="Remover" aria-label="Remover">${UI.icone('fechar')}</button>
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
            else { ajustarPlacar(); renderEscalacoes(); }   // avisos da escalação dependem dos lances
          });
        });
        el.querySelector('[data-remover]').addEventListener('click', () => {
          lista.splice(Number(el.dataset.i), 1);
          renderLances();
        });
      });
    }

    function renderLances() {
      renderListas();
      renderEscalacoes();
    }

    function renderListas() {
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

    // ----- Escalações: formação, campinho clicável, trocas e avisos -----
    // Formato salvo (compatível com o antigo): { titulares, substituicoes, posicoes?, formacao?, ordem?, capitaoId? }.
    // `ordem` guarda quem está em cada vaga da formação; `posicoes`, só quem jogou fora da posição do cadastro.
    function escalacaoDe(timeId) {
      return estado.escalacoes[timeId] || (estado.escalacoes[timeId] = { titulares: [], substituicoes: [] });
    }

    function elencoOrdenado(timeId) {
      const ordem = { Goleiro: 0, Defensor: 1, 'Meio-campo': 2, 'Meia ofensivo': 2, Atacante: 3 };
      return DB.Jogadores.all().filter(j => j.timeId === timeId)
        .sort((a, b) => (ordem[a.posicao] ?? 9) - (ordem[b.posicao] ?? 9) || (a.numero ?? 99) - (b.numero ?? 99));
    }

    function minutoInt(m) { const n = parseInt(String(m || '').split('+')[0], 10); return Number.isFinite(n) ? n : null; }
    function normalizar(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }

    // Vaga aceita o jogador? Exata primeiro; meio-campo e meia ofensivo se cobrem; goleiro só no gol.
    function cabe(jogador, pos, exata = false) {
      const p = jogador.posicao;
      if (pos === 'Goleiro' || p === 'Goleiro') return p === pos;
      if (p === pos) return true;
      if (exata) return false;
      return (pos === 'Meia ofensivo' && p === 'Meio-campo') || (pos === 'Meio-campo' && p === 'Meia ofensivo');
    }

    function linhasDe(formacao) {
      if (FORMACOES[formacao]) return [['Goleiro', 1], ...FORMACOES[formacao]];
      // Formação montada a partir das posições (escalações antigas): "4-2-3-1" etc.
      const partes = String(formacao).split('|');
      return partes.length > 1 ? JSON.parse(partes[1]) : [['Goleiro', 1], ...FORMACOES['4-3-3']];
    }
    function vagasDe(linhas) { return linhas.flatMap(([pos, n]) => Array.from({ length: n }, () => pos)); }
    function nomeFormacao(f) { return FORMACOES[f] ? f : String(f).split('|')[0]; }

    function iniciarEditor(timeId) {
      const esc = escalacaoDe(timeId);
      const posNoJogo = id => (esc.posicoes || {})[id] || (DB.Jogadores.get(id) || {}).posicao;
      let formacao = esc.formacao;
      if (!formacao || !(FORMACOES[formacao] || String(formacao).includes('|'))) {
        if (esc.titulares.length) {
          // Deduz a formação das posições de quem começou jogando.
          const conta = pos => esc.titulares.filter(id => posNoJogo(id) === pos).length;
          const linhas = [['Goleiro', Math.max(1, conta('Goleiro'))], ['Defensor', conta('Defensor')], ['Meio-campo', conta('Meio-campo')], ['Meia ofensivo', conta('Meia ofensivo')], ['Atacante', conta('Atacante')]].filter(([, n]) => n);
          const nome = linhas.slice(1).map(([, n]) => n).join('-');
          const igual = Object.entries(FORMACOES).find(([, l]) => JSON.stringify(l) === JSON.stringify(linhas.slice(1)));
          formacao = igual ? igual[0] : `${nome}|${JSON.stringify(linhas)}`;
        } else formacao = '4-3-3';
      }
      const vagas = vagasDe(linhasDe(formacao));
      let ordem = Array.isArray(esc.ordem) && esc.ordem.length === vagas.length && esc.ordem.filter(Boolean).every(id => esc.titulares.includes(id))
        ? [...esc.ordem] : vagas.map(() => null);
      editor[timeId] = { formacao, vagas, ordem };
      if (!esc.ordem || ordem.filter(Boolean).length !== esc.titulares.length) {
        editor[timeId].ordem = vagas.map(() => null);
        colocar(timeId, esc.titulares, posNoJogo);
      }
      sincronizar(timeId);
    }

    // Põe jogadores nas vagas livres: primeiro a da posição exata, depois uma compatível, depois qualquer de linha.
    function colocar(timeId, ids, posPreferida) {
      const ed = editor[timeId];
      const sobra = [];
      ids.forEach(id => {
        if (ed.ordem.includes(id)) return;
        const j = DB.Jogadores.get(id);
        if (!j) return;
        const alvo = posPreferida ? { ...j, posicao: posPreferida(id) || j.posicao } : j;
        const livre = teste => ed.vagas.findIndex((pos, i) => !ed.ordem[i] && teste(pos));
        let i = livre(pos => cabe(alvo, pos, true));
        if (i < 0) i = livre(pos => cabe(alvo, pos));
        if (i < 0 && alvo.posicao !== 'Goleiro') i = livre(pos => pos !== 'Goleiro');
        if (i < 0) i = livre(() => true);
        if (i < 0) sobra.push(id); else ed.ordem[i] = id;
      });
      return sobra;
    }

    // Leva o que está nas vagas para o formato salvo.
    function sincronizar(timeId) {
      const esc = escalacaoDe(timeId), ed = editor[timeId];
      esc.titulares = ed.ordem.filter(Boolean);
      esc.formacao = ed.formacao;
      esc.ordem = [...ed.ordem];
      const posicoes = {};
      ed.ordem.forEach((id, i) => { const j = id && DB.Jogadores.get(id); if (j && j.posicao !== ed.vagas[i]) posicoes[id] = ed.vagas[i]; });
      if (Object.keys(posicoes).length) esc.posicoes = posicoes; else delete esc.posicoes;
      const emCampo = new Set([...esc.titulares, ...esc.substituicoes.map(s => s.entraId).filter(Boolean)]);
      if (esc.capitaoId && !emCampo.has(esc.capitaoId)) delete esc.capitaoId;
      if (!esc.titulares.length) { delete esc.ordem; delete esc.formacao; }
    }

    function trocarFormacao(timeId, formacao) {
      const ed = editor[timeId];
      const antes = ed.ordem.map((id, i) => [id, ed.vagas[i]]).filter(([id]) => id);
      ed.formacao = formacao;
      ed.vagas = vagasDe(linhasDe(formacao));
      ed.ordem = ed.vagas.map(() => null);
      const posAntes = Object.fromEntries(antes);
      const sobra = colocar(timeId, antes.map(([id]) => id), id => posAntes[id]);
      sincronizar(timeId);
      return sobra;
    }

    // ----- Atalhos para preencher -----
    function ultimaEscalacao(timeId) {
      const dataAtual = (document.querySelector('input[name="data"]') || {}).value || '9999';
      return DB.Jogos.todos()
        .filter(j => j.id !== (existente && existente.id) && j.data < dataAtual && ((j.escalacoes || {})[timeId]?.titulares || []).length)
        .sort((a, b) => b.data.localeCompare(a.data))[0] || null;
    }

    function repetirUltimo(timeId) {
      const jogo = ultimaEscalacao(timeId);
      if (!jogo) return 'Este time ainda não tem escalação em jogo anterior.';
      const anterior = jogo.escalacoes[timeId];
      const esc = escalacaoDe(timeId);
      Object.assign(esc, { titulares: [...anterior.titulares], posicoes: anterior.posicoes ? { ...anterior.posicoes } : undefined, formacao: anterior.formacao, ordem: anterior.ordem ? [...anterior.ordem] : undefined, capitaoId: anterior.capitaoId });
      if (!esc.posicoes) delete esc.posicoes;
      iniciarEditor(timeId);
      const adv = DB.Times.get(jogo.mandanteId === timeId ? jogo.visitanteId : jogo.mandanteId);
      return `Escalação copiada do jogo contra ${adv ? adv.nome : '?'} (${DB.Util.formatarData(jogo.data)}).`;
    }

    // Quem mais começou jogando (e mais minutos) no campeonato; sem histórico, convocação/numeração.
    function escalacaoProvavel(timeId) {
      const peso = {};
      DB.Jogos.todos().filter(j => j.status === 'encerrado' && (j.escalacoes || {})[timeId]).forEach(j => {
        Object.entries(DB.Estatisticas.minutosNoJogo(j)).forEach(([id, p]) => {
          if (p.timeId !== timeId) return;
          peso[id] = (peso[id] || 0) + (p.titular ? 1000 : 0) + p.minutos;
        });
      });
      const elenco = elencoOrdenado(timeId).filter(j => j.status !== 'lesionado' && j.status !== 'suspenso');
      const reserva = j => (j.jogosSelecao != null ? j.jogosSelecao : 99 - Math.min(99, j.numero ?? 99));
      const ranking = [...elenco].sort((a, b) => (peso[b.id] || 0) - (peso[a.id] || 0) || reserva(b) - reserva(a));
      const ed = editor[timeId];
      ed.ordem = ed.vagas.map(() => null);
      const usados = new Set();
      ed.vagas.forEach((pos, i) => {
        const escolha = ranking.find(j => !usados.has(j.id) && cabe(j, pos, true)) || ranking.find(j => !usados.has(j.id) && cabe(j, pos))
          || ranking.find(j => !usados.has(j.id) && j.posicao !== 'Goleiro' && pos !== 'Goleiro');
        if (escolha) { ed.ordem[i] = escolha.id; usados.add(escolha.id); }
      });
      escalacaoDe(timeId).substituicoes = escalacaoDe(timeId).substituicoes.filter(s => !s.saiId || ed.ordem.includes(s.saiId));
      sincronizar(timeId);
      return Object.keys(peso).length ? 'Sugestão pelos jogos anteriores (mais vezes titular e mais minutos).' : 'Sem jogos anteriores: sugestão pela convocação e numeração. Ajuste o que precisar.';
    }

    function marcarPorNumeros(timeId, texto) {
      const elenco = elencoOrdenado(timeId);
      const numeros = (texto.match(/\d+/g) || []).map(Number);
      const ids = [], faltam = [];
      numeros.forEach(n => { const j = elenco.find(x => x.numero === n); if (j) ids.push(j.id); else faltam.push(n); });
      if (!ids.length) return 'Nenhum número do elenco encontrado.';
      editor[timeId].ordem = editor[timeId].vagas.map(() => null);
      const sobra = colocar(timeId, ids);
      sincronizar(timeId);
      return [`${ids.length - sobra.length} titulares marcados.`, faltam.length ? `Sem jogador com o número ${faltam.join(', ')}.` : '', sobra.length ? `${sobra.length} não couberam na formação.` : ''].filter(Boolean).join(' ');
    }

    // Reconhece nomes colados (de uma notícia, por exemplo): "Rangel; Sánchez, Montes - Vásquez…".
    function reconhecerTexto(timeId, texto) {
      const elenco = elencoOrdenado(timeId).map(j => ({ j, n: normalizar(j.nome), partes: normalizar(j.nome).split(' ') }));
      const pedacos = texto.split(/[\n,;()]|\s[-–—]\s|\s\/\s/).map(t => normalizar(t.replace(/^\s*\d+[.)\s-]*/, '').replace(/\b(c|cap|capitao|gk)\b/gi, ''))).filter(t => t.length >= 3);
      const ids = [], naoAchei = [];
      pedacos.forEach(t => {
        const unico = lista => (lista.length === 1 ? lista[0].j : null);
        const j = unico(elenco.filter(x => x.n === t)) || unico(elenco.filter(x => x.n.includes(t)))
          || unico(elenco.filter(x => x.partes.includes(t.split(' ').pop()) && x.partes[x.partes.length - 1] === t.split(' ').pop()))
          || unico(elenco.filter(x => x.partes.includes(t.split(' ').pop())));
        if (j && !ids.includes(j.id)) ids.push(j.id); else if (!j) naoAchei.push(t);
      });
      if (!ids.length) return 'Não reconheci nenhum nome do elenco.';
      editor[timeId].ordem = editor[timeId].vagas.map(() => null);
      const sobra = colocar(timeId, ids.slice(0, 11));
      sincronizar(timeId);
      return [`${ids.slice(0, 11).length - sobra.length} jogadores reconhecidos.`, naoAchei.length ? `Não achei: ${naoAchei.slice(0, 5).join(', ')}${naoAchei.length > 5 ? '…' : ''}.` : ''].filter(Boolean).join(' ');
    }

    // ----- Regras: erros impedem salvar, avisos só alertam -----
    function problemasEscalacao(timeId) {
      const esc = estado.escalacoes[timeId];
      const erros = [], avisos = [], foraDoTime = [];
      if (!esc || (!esc.titulares.length && !esc.substituicoes.length)) return { erros, avisos, foraDoTime };
      const nome = id => (DB.Jogadores.get(id) || {}).nome || '?';
      if (esc.titulares.length > 11) erros.push(`${esc.titulares.length} titulares: o máximo é 11.`);
      else if (esc.titulares.length && esc.titulares.length < 11) avisos.push(`Só ${esc.titulares.length} de 11 titulares.`);
      if (esc.titulares.length && !esc.titulares.some(id => (esc.posicoes || {})[id] === 'Goleiro' || (DB.Jogadores.get(id) || {}).posicao === 'Goleiro' && !(esc.posicoes || {})[id])) avisos.push('Nenhum goleiro entre os titulares.');
      const limite = document.querySelector('select[name="prorrogacao"]')?.value === '1' ? 6 : 5;
      if (esc.substituicoes.length > limite) avisos.push(`${esc.substituicoes.length} trocas: o regulamento permite ${limite}${limite === 6 ? ' (com prorrogação)' : ''}.`);
      const expulsoEm = {};
      estado.cartoes.filter(c => c.timeId === timeId && c.tipo !== 'amarelo' && c.jogadorId).forEach(c => { expulsoEm[c.jogadorId] = minutoInt(c.minuto) ?? 0; });
      // Repassa as trocas em ordem de minuto: quem sai precisa estar em campo; quem entra, nunca ter jogado.
      const emCampo = new Set(esc.titulares), jogou = new Set(esc.titulares);
      [...esc.substituicoes].sort((a, b) => (minutoInt(a.minuto) ?? 999) - (minutoInt(b.minuto) ?? 999)).forEach(s => {
        if (!s.saiId || !s.entraId) { erros.push('Complete quem sai e quem entra em cada troca.'); return; }
        if (!emCampo.has(s.saiId)) erros.push(`${nome(s.saiId)} não estava em campo para sair${s.minuto ? ` aos ${s.minuto}'` : ''}.`);
        if (jogou.has(s.entraId)) erros.push(`${nome(s.entraId)} já tinha jogado e não pode entrar de novo.`);
        if (expulsoEm[s.saiId] != null && (minutoInt(s.minuto) ?? 999) >= expulsoEm[s.saiId]) erros.push(`${nome(s.saiId)} foi expulso aos ${expulsoEm[s.saiId]}' e não pode ser substituído depois.`);
        emCampo.delete(s.saiId); emCampo.add(s.entraId); jogou.add(s.entraId);
      });
      // Quem tem lance (gol, assistência, cartão) precisa ter jogado.
      if (esc.titulares.length) {
        const comLance = new Set([
          ...estado.gols.filter(g => (g.tipo === 'contra' ? adversario(g.timeId) : g.timeId) === timeId).map(g => g.jogadorId),
          ...estado.gols.filter(g => g.timeId === timeId && g.tipo !== 'contra').map(g => g.assistenciaId),
          ...estado.cartoes.filter(c => c.timeId === timeId).map(c => c.jogadorId),
        ].filter(Boolean));
        comLance.forEach(id => { if (!jogou.has(id)) foraDoTime.push(id); });
      }
      return { erros: [...new Set(erros)], avisos, foraDoTime };
    }

    // ----- Desenho -----
    function quemEntrou(esc) { return Object.fromEntries(esc.substituicoes.filter(s => s.entraId).map(s => [s.entraId, s])); }
    function quemSaiu(esc) { return Object.fromEntries(esc.substituicoes.filter(s => s.saiId).map(s => [s.saiId, s])); }

    function marcasJogador(timeId, id) {
      const esc = escalacaoDe(timeId);
      const saiu = quemSaiu(esc)[id], entrou = quemEntrou(esc)[id];
      const vermelho = estado.cartoes.some(c => c.jogadorId === id && c.tipo !== 'amarelo');
      const amarelo = !vermelho && estado.cartoes.some(c => c.jogadorId === id);
      const gols = estado.gols.filter(g => g.jogadorId === id && g.tipo !== 'contra').length;
      return [
        esc.capitaoId === id ? '<span class="mk mk-cap" title="Capitão">C</span>' : '',
        entrou ? `<span class="mk mk-entrou" title="Entrou">↑${esc_(entrou.minuto || '')}'</span>` : '',
        saiu ? `<span class="mk mk-saiu" title="Saiu">↓${esc_(saiu.minuto || '')}'</span>` : '',
        vermelho ? '<span class="mk mk-cartao vermelho" title="Expulso"></span>' : amarelo ? '<span class="mk mk-cartao" title="Amarelo"></span>' : '',
        gols ? `<span class="mk mk-gol" title="${gols} gol(s)">${UI.icone('bola')}${gols > 1 ? gols : ''}</span>` : '',
      ].join('');
    }

    function painelTime(timeId) {
      const esc = escalacaoDe(timeId), ed = editor[timeId];
      const elenco = elencoOrdenado(timeId);
      const titulares = new Set(esc.titulares);
      const entrou = quemEntrou(esc);
      const ultimo = ultimaEscalacao(timeId);
      const advUltimo = ultimo && DB.Times.get(ultimo.mandanteId === timeId ? ultimo.visitanteId : ultimo.mandanteId);
      const opcoesFormacao = [...Object.keys(FORMACOES), ...(FORMACOES[ed.formacao] ? [] : [ed.formacao])]
        .map(f => `<option value="${esc_(f)}" ${f === ed.formacao ? 'selected' : ''}>${esc_(nomeFormacao(f))}</option>`).join('');

      // Campinho: ataque em cima, goleiro embaixo; linhas na ordem da formação.
      let i0 = 0;
      const linhas = linhasDe(ed.formacao).map(([pos, n]) => {
        const vagas = Array.from({ length: n }, (_, k) => i0 + k);
        i0 += n;
        return vagas;
      }).reverse();
      const vagaHtml = i => {
        const id = ed.ordem[i], j = id && DB.Jogadores.get(id);
        const sel = ui.vaga === i ? ' selecionada' : '';
        if (!j) return `<button type="button" class="vaga vazia${sel}" data-vaga="${i}" aria-label="Vaga livre de ${SIGLA[ed.vagas[i]]}"><span class="vaga-foto">+</span><span class="vaga-pos">${SIGLA[ed.vagas[i]]}</span></button>`;
        const c = DB.Util.coresTime(DB.Times.get(timeId));
        return `<button type="button" class="vaga${sel}${ui.sel === id ? ' ativa' : ''}" data-vaga="${i}" draggable="true" aria-label="${esc_(`${j.nome}, ${SIGLA[ed.vagas[i]]}`)}">
          <span class="vaga-foto" style="background:${ed.vagas[i] === 'Goleiro' ? '#1f2937' : c.primaria};color:${ed.vagas[i] === 'Goleiro' ? '#fff' : c.texto};box-shadow:0 0 0 2px ${c.secundaria}">${j.numero ?? ''}${marcasJogador(timeId, id)}</span>
          <span class="vaga-nome">${esc_(UI.nomeCurto(j.nome))}</span><span class="vaga-pos">${SIGLA[ed.vagas[i]]}${j.posicao !== ed.vagas[i] ? ' *' : ''}</span></button>`;
      };

      // Ações do jogador selecionado (titular ou quem entrou).
      let acoes = '';
      if (ui.sel && !ui.sub) {
        const j = DB.Jogadores.get(ui.sel);
        acoes = `<div class="esc-acoes"><b>${esc_(j ? j.nome : '')}</b>
          <button type="button" class="btn btn-ghost btn-sm" data-acao="substituir">${UI.icone('trocar')} Substituir</button>
          <button type="button" class="btn btn-ghost btn-sm" data-acao="capitao">${esc.capitaoId === ui.sel ? 'Tirar a braçadeira' : 'Capitão'}</button>
          ${titulares.has(ui.sel) ? '<button type="button" class="btn btn-ghost btn-sm" data-acao="tirar">Tirar do time</button>' : ''}
          <button type="button" class="btn-icon btn-sm" data-acao="fechar-sel" aria-label="Fechar">${UI.icone('fechar')}</button></div>`;
      }
      // Substituição em um clique: quem entra (mesma posição primeiro) e o minuto.
      if (ui.sub) {
        const sai = DB.Jogadores.get(ui.sub.saiId);
        const jogou = new Set([...esc.titulares, ...Object.keys(entrou)]);
        const posSai = (esc.posicoes || {})[ui.sub.saiId] || (sai || {}).posicao;
        const candidatos = elenco.filter(j => !jogou.has(j.id)).sort((a, b) => Number(!cabe(a, posSai)) - Number(!cabe(b, posSai)));
        acoes = `<div class="esc-sub">
          <div class="esc-sub-topo">${UI.icone('trocar')} Sai <b>${esc_(sai ? sai.nome : '')}</b> · entra:</div>
          <div class="esc-sub-lista">${candidatos.map(j => `<button type="button" class="esc-chip${ui.sub.entraId === j.id ? ' ativa' : ''}${cabe(j, posSai) ? '' : ' outra-pos'}" data-entra="${j.id}">${j.numero ?? ''} ${esc_(UI.nomeCurto(j.nome))} <small>${SIGLA[j.posicao] || ''}</small></button>`).join('')}</div>
          <div class="esc-sub-min">Minuto: ${['45', '60', '70', '80', '90'].map(m => `<button type="button" class="esc-chip${ui.sub.minuto === m ? ' ativa' : ''}" data-minuto="${m}">${m}'</button>`).join('')}
            <input type="text" inputmode="numeric" data-minuto-livre value="${esc_(ui.sub.minuto || '')}" placeholder="ex.: 67 ou 90+2" aria-label="Minuto da troca"></div>
          <div class="esc-sub-fim"><button type="button" class="btn btn-primary btn-sm" data-acao="confirmar-sub" ${ui.sub.entraId ? '' : 'disabled'}>Confirmar troca</button>
            <button type="button" class="btn btn-ghost btn-sm" data-acao="cancelar-sub">Cancelar</button></div>
        </div>`;
      }

      const filtro = normalizar(ui.filtro);
      const naoTitulares = elenco.filter(j => !titulares.has(j.id) && (!filtro || normalizar(`${j.nome} ${j.numero ?? ''}`).includes(filtro)));
      const grupos = POSICOES_JOGO.filter(([p]) => p !== 'Meia ofensivo').map(([p, s]) => [s, naoTitulares.filter(j => (j.posicao === 'Meia ofensivo' ? 'Meio-campo' : j.posicao) === p)]).filter(([, l]) => l.length);
      const posVaga = ui.vaga != null ? ed.vagas[ui.vaga] : null;
      const { erros, avisos, foraDoTime } = problemasEscalacao(timeId);
      const limite = document.querySelector('select[name="prorrogacao"]')?.value === '1' ? 6 : 5;

      return `
        <div class="esc-barra">
          <label class="esc-form">Formação <select data-formacao>${opcoesFormacao}</select></label>
          <button type="button" class="btn btn-ghost btn-sm" data-acao="repetir" ${ultimo ? '' : 'disabled'} title="${ultimo ? esc_(`Copia os titulares do jogo contra ${advUltimo ? advUltimo.nome : '?'} (${DB.Util.formatarData(ultimo.data)})`) : 'Nenhum jogo anterior com escalação'}">${UI.icone('repetir')} Repetir último jogo</button>
          <button type="button" class="btn btn-ghost btn-sm" data-acao="provavel" title="Os mais vezes titulares; sem histórico, pela convocação/numeração">${UI.icone('estrela')} Escalação provável</button>
          <button type="button" class="btn btn-ghost btn-sm" data-acao="limpar">Limpar</button>
        </div>
        <div class="esc-rapido">
          <input type="text" data-numeros placeholder="Números da camisa: 1 2 4 5 6 8 10 11 7 9 20" aria-label="Números da camisa dos titulares">
          <button type="button" class="btn btn-ghost btn-sm" data-acao="numeros">Marcar</button>
          <button type="button" class="btn btn-ghost btn-sm" data-acao="colar-abrir" aria-expanded="${ui.colar}">Colar escalação…</button>
        </div>
        ${ui.colar ? `<div class="esc-colar"><textarea data-colar rows="3" placeholder="Cole os nomes, separados por vírgula, ponto e vírgula ou linha. Ex.: Rangel; Sánchez, Montes, Vásquez, Gallardo; Álvarez…"></textarea>
          <button type="button" class="btn btn-primary btn-sm" data-acao="colar">Reconhecer nomes</button></div>` : ''}
        ${ui.msg ? `<div class="esc-msg" role="status">${esc_(ui.msg)}</div>` : ''}
        <div class="esc-corpo">
          <div class="esc-campo-caixa">
            <div class="esc-campo" data-campo>
              <span class="ec-area" aria-hidden="true"></span><span class="ec-meio" aria-hidden="true"></span>
              ${linhas.map(vs => `<div class="esc-linha">${vs.map(vagaHtml).join('')}</div>`).join('')}
            </div>
            <div class="esc-contagem ${esc.titulares.length === 11 ? 'ok' : ''}">${esc.titulares.length}/11 titulares · ${nomeFormacao(ed.formacao)}${posVaga ? ` · escolha alguém para a vaga de ${SIGLA[posVaga]}` : ''}</div>
          </div>
          <div class="esc-lado">
            ${acoes}
            <input type="search" class="esc-busca" data-filtro value="${esc_(ui.filtro)}" placeholder="Buscar no elenco (nome ou número)…" aria-label="Buscar no elenco">
            <div class="esc-elenco" data-elenco aria-label="Elenco disponível: clique para escalar ou arraste até uma vaga">
              ${grupos.map(([s, lista]) => `<div class="esc-grupo${posVaga && SIGLA[posVaga] === s ? ' destaque' : ''}"><span>${s}</span>
                ${lista.map(j => `<button type="button" class="esc-jog${ui.sel === j.id ? ' ativa' : ''}" data-jog="${j.id}" draggable="true">
                  <span class="num">${j.numero ?? ''}</span><span class="nm">${esc_(j.nome)}</span>${entrou[j.id] ? `<span class="mk mk-entrou">↑${esc_(entrou[j.id].minuto || '')}'</span>` : ''}${esc.capitaoId === j.id ? '<span class="mk mk-cap">C</span>' : ''}</button>`).join('')}</div>`).join('') || '<div class="lances-vazio">Ninguém encontrado.</div>'}
            </div>
          </div>
        </div>
        <div class="esc-trocas">
          <div class="escalacao-titulo">Substituições <span class="lances-hint ${esc.substituicoes.length > limite ? 'erro' : ''}">${esc.substituicoes.length}/${limite}</span>
            <button type="button" class="btn btn-ghost btn-sm" data-add-sub>+ Troca manual</button></div>
          ${esc.substituicoes.map((s, i) => {
            const opcoes = (lista, sel, vazio) => `<option value="">${vazio}</option>` + lista.map(j => `<option value="${j.id}" ${j.id === sel ? 'selected' : ''}>${j.numero ?? ''} · ${esc_(j.nome)}</option>`).join('');
            return `<div class="lance sub" data-sub="${i}">
              <select data-campo="saiId" title="Sai" aria-label="Sai">${opcoes(elenco.filter(j => titulares.has(j.id) || entrou[j.id]), s.saiId, 'Sai…')}</select>
              <select data-campo="entraId" title="Entra" aria-label="Entra">${opcoes(elenco.filter(j => !titulares.has(j.id)), s.entraId, 'Entra…')}</select>
              <input data-campo="minuto" value="${esc_(s.minuto || '')}" placeholder="Minuto" aria-label="Minuto">
              <button type="button" class="btn btn-icon btn-sm" data-remover-sub aria-label="Remover troca">${UI.icone('fechar')}</button>
            </div>`;
          }).join('') || '<div class="lances-vazio">Nenhuma troca. Toque num titular e em <b>Substituir</b>.</div>'}
        </div>
        ${erros.length || avisos.length || foraDoTime.length ? `<ul class="esc-avisos">
          ${erros.map(e => `<li class="erro">${UI.icone('aviso')} ${esc_(e)}</li>`).join('')}
          ${avisos.map(a => `<li>${UI.icone('aviso')} ${esc_(a)}</li>`).join('')}
          ${foraDoTime.map(id => `<li>${UI.icone('aviso')} ${esc_((DB.Jogadores.get(id) || {}).nome || '?')} tem lance no jogo, mas não está na escalação.
            ${esc.titulares.length < 11 ? `<button type="button" class="btn btn-ghost btn-sm" data-incluir="${id}" data-como="titular">Pôr como titular</button>` : ''}
            <button type="button" class="btn btn-ghost btn-sm" data-incluir="${id}" data-como="entrou">Pôr como quem entrou</button></li>`).join('')}
        </ul>` : ''}`;
    }

    function renderEscalacoes() {
      const box = document.getElementById('escalacoes');
      if (!estado.mandanteId || !estado.visitanteId) { box.innerHTML = ''; return; }
      [estado.mandanteId, estado.visitanteId].forEach(t => { if (!editor[t]) iniciarEditor(t); });
      if (![estado.mandanteId, estado.visitanteId].includes(ui.aba)) ui.aba = estado.mandanteId;
      const aba = (t, lado) => {
        const n = escalacaoDe(t).titulares.length;
        const { erros } = problemasEscalacao(t);
        return `<button type="button" role="tab" class="esc-aba${ui.aba === t ? ' ativa' : ''}" aria-selected="${ui.aba === t}" data-aba="${t}">
          ${UI.bandeira ? UI.bandeira(DB.Times.get(t), 'sm') : ''}<span>${esc_(nomeTime(t))}</span><small class="${erros.length ? 'erro' : n === 11 ? 'ok' : ''}"><span class="esc-lado-txt">${lado} · </span>${n}/11</small></button>`;
      };
      const foco = document.activeElement && box.contains(document.activeElement) ? document.activeElement.dataset : null;
      box.innerHTML = `<div class="esc-abas" role="tablist">${aba(estado.mandanteId, 'Mandante')}${aba(estado.visitanteId, 'Visitante')}</div>
        <div class="esc-painel" role="tabpanel">${painelTime(ui.aba)}</div>`;
      // Devolve o foco ao campo de busca (o painel é redesenhado a cada letra).
      if (foco && foco.filtro !== undefined) { const f = box.querySelector('[data-filtro]'); f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
      if (foco && foco.minutoLivre !== undefined) { const f = box.querySelector('[data-minuto-livre]'); if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); } }
    }

    // Mudou a escalação: atualiza o painel e reordena os menus de gol/cartão ("Em campo" primeiro).
    function aposMudar(msg) {
      if (msg !== undefined) ui.msg = msg;
      sincronizar(ui.aba);
      renderListas();
      renderEscalacoes();
    }

    // ----- Eventos (ligados uma vez; o painel é redesenhado a cada mudança) -----
    const boxEsc = document.getElementById('escalacoes');
    boxEsc.addEventListener('click', e => {
      const el = e.target.closest('button, [data-aba]');
      if (!el || !boxEsc.contains(el)) return;
      const timeId = ui.aba, ed = editor[timeId], esc = escalacaoDe(timeId);
      if (el.dataset.aba) { ui.aba = el.dataset.aba; ui.vaga = ui.sel = ui.sub = null; ui.msg = ''; renderEscalacoes(); return; }
      if (el.dataset.vaga != null) {
        const i = Number(el.dataset.vaga), id = ed.ordem[i];
        if (ui.vaga != null && ui.vaga !== i && ed.ordem[ui.vaga] && !ui.sub) {
          // Segunda vaga clicada: troca os dois de lugar.
          [ed.ordem[i], ed.ordem[ui.vaga]] = [ed.ordem[ui.vaga], ed.ordem[i]];
          ui.vaga = ui.sel = null;
          aposMudar('');
          return;
        }
        ui.sub = null;
        ui.vaga = ui.vaga === i ? null : i;
        ui.sel = ui.vaga != null && id ? id : null;
        renderEscalacoes();
        return;
      }
      if (el.dataset.jog) {
        const id = el.dataset.jog;
        if (ui.sub) return;
        if (ui.vaga != null) {
          const antigo = ed.ordem[ui.vaga];
          ed.ordem[ui.vaga] = id;
          if (antigo) esc.substituicoes = esc.substituicoes.filter(s => s.saiId !== antigo);
          ui.vaga = ui.sel = null;
          aposMudar('');
        } else if (quemEntrou(esc)[id]) {
          ui.sel = ui.sel === id ? null : id;
          renderEscalacoes();
        } else {
          const sobra = colocar(timeId, [id]);
          aposMudar(sobra.length ? 'Time completo: tire alguém (ou escolha uma vaga) antes de escalar.' : '');
        }
        return;
      }
      if (el.dataset.entra) { ui.sub.entraId = el.dataset.entra; renderEscalacoes(); return; }
      if (el.dataset.minuto) { ui.sub.minuto = el.dataset.minuto; renderEscalacoes(); return; }
      if (el.dataset.incluir) {
        const id = el.dataset.incluir;
        if (el.dataset.como === 'titular') colocar(timeId, [id]);
        else esc.substituicoes.push({ saiId: null, entraId: id, minuto: '' });
        aposMudar(el.dataset.como === 'titular' ? '' : 'Escolha quem saiu para ele entrar (na lista de substituições).');
        return;
      }
      if (el.hasAttribute('data-add-sub')) { esc.substituicoes.push({ saiId: null, entraId: null, minuto: '' }); aposMudar(); return; }
      if (el.hasAttribute('data-remover-sub')) {
        esc.substituicoes.splice(Number(el.closest('[data-sub]').dataset.sub), 1);
        aposMudar();
        return;
      }
      switch (el.dataset.acao) {
        case 'repetir': aposMudar(repetirUltimo(timeId)); break;
        case 'provavel': aposMudar(escalacaoProvavel(timeId)); break;
        case 'limpar':
          ed.ordem = ed.vagas.map(() => null); esc.substituicoes = []; delete esc.capitaoId;
          ui.vaga = ui.sel = ui.sub = null; aposMudar(''); break;
        case 'numeros': aposMudar(marcarPorNumeros(timeId, boxEsc.querySelector('[data-numeros]').value)); break;
        case 'colar-abrir': ui.colar = !ui.colar; renderEscalacoes(); boxEsc.querySelector('[data-colar]')?.focus(); break;
        case 'colar': ui.colar = false; aposMudar(reconhecerTexto(timeId, boxEsc.querySelector('[data-colar]').value)); break;
        case 'substituir': ui.sub = { saiId: ui.sel, entraId: null, minuto: '' }; renderEscalacoes(); break;
        case 'cancelar-sub': ui.sub = null; renderEscalacoes(); break;
        case 'confirmar-sub':
          esc.substituicoes.push({ saiId: ui.sub.saiId, entraId: ui.sub.entraId, minuto: ui.sub.minuto || '' });
          ui.sub = ui.sel = ui.vaga = null;
          aposMudar('Troca registrada.');
          break;
        case 'capitao': esc.capitaoId = esc.capitaoId === ui.sel ? undefined : ui.sel; if (!esc.capitaoId) delete esc.capitaoId; aposMudar(); break;
        case 'tirar': {
          const i = ed.ordem.indexOf(ui.sel);
          if (i >= 0) ed.ordem[i] = null;
          esc.substituicoes = esc.substituicoes.filter(s => s.saiId !== ui.sel);
          ui.sel = ui.vaga = null;
          aposMudar('');
          break;
        }
        case 'fechar-sel': ui.sel = ui.vaga = null; renderEscalacoes(); break;
        default:
      }
    });
    boxEsc.addEventListener('change', e => {
      const esc = escalacaoDe(ui.aba);
      if (e.target.matches('[data-formacao]')) {
        const sobra = trocarFormacao(ui.aba, e.target.value);
        ui.vaga = ui.sel = null;
        aposMudar(sobra.length ? `${sobra.length} jogador(es) ficaram fora: não havia vaga na nova formação.` : '');
        return;
      }
      const linhaSub = e.target.closest('[data-sub]');
      if (linhaSub && e.target.dataset.campo) {
        esc.substituicoes[Number(linhaSub.dataset.sub)][e.target.dataset.campo] = e.target.value || null;
        aposMudar();
      }
    });
    boxEsc.addEventListener('input', e => {
      if (e.target.matches('[data-filtro]')) { ui.filtro = e.target.value; renderEscalacoes(); }
      if (e.target.matches('[data-minuto-livre]') && ui.sub) { ui.sub.minuto = e.target.value.trim(); renderEscalacoes(); }
    });
    boxEsc.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.matches('[data-numeros]')) { e.preventDefault(); aposMudar(marcarPorNumeros(ui.aba, e.target.value)); }
      if (e.key === 'Enter' && e.target.matches('[data-filtro], [data-minuto-livre]')) e.preventDefault();
    });
    // Arrastar e soltar: do elenco para uma vaga, de uma vaga para outra (troca) ou de volta ao elenco (tira).
    boxEsc.addEventListener('dragstart', e => {
      const vaga = e.target.closest('[data-vaga]'), jog = e.target.closest('[data-jog]');
      if (vaga) e.dataTransfer.setData('text/plain', `vaga:${vaga.dataset.vaga}`);
      else if (jog) e.dataTransfer.setData('text/plain', `jog:${jog.dataset.jog}`);
      e.dataTransfer.effectAllowed = 'move';
    });
    boxEsc.addEventListener('dragover', e => {
      const alvo = e.target.closest('[data-vaga], [data-elenco]');
      if (!alvo) return;
      e.preventDefault();
      boxEsc.querySelectorAll('.sobre').forEach(x => x.classList.remove('sobre'));
      alvo.classList.add('sobre');
    });
    boxEsc.addEventListener('dragleave', e => { e.target.closest?.('.sobre')?.classList.remove('sobre'); });
    boxEsc.addEventListener('drop', e => {
      const alvo = e.target.closest('[data-vaga], [data-elenco]');
      if (!alvo) return;
      e.preventDefault();
      const [tipo, valor] = e.dataTransfer.getData('text/plain').split(':');
      const ed = editor[ui.aba], esc = escalacaoDe(ui.aba);
      if (alvo.dataset.vaga != null) {
        const j = Number(alvo.dataset.vaga);
        if (tipo === 'vaga') { const i = Number(valor); [ed.ordem[i], ed.ordem[j]] = [ed.ordem[j], ed.ordem[i]]; }
        else if (tipo === 'jog' && !ed.ordem.includes(valor)) {
          const antigo = ed.ordem[j];
          ed.ordem[j] = valor;
          if (antigo) esc.substituicoes = esc.substituicoes.filter(s => s.saiId !== antigo);
        }
      } else if (tipo === 'vaga') {
        const i = Number(valor), saiu = ed.ordem[i];
        ed.ordem[i] = null;
        esc.substituicoes = esc.substituicoes.filter(s => s.saiId !== saiu);
      }
      ui.vaga = ui.sel = null;
      aposMudar('');
    });

    document.querySelectorAll('[data-est="posse"]').forEach(campo => campo.addEventListener('input', () => {
      const outro = document.querySelector(`[data-est="posse"][data-lado="${campo.dataset.lado === '0' ? 1 : 0}"]`);
      const v = Number(campo.value);
      if (campo.value !== '' && v >= 0 && v <= 100) outro.value = 100 - v;
    }));

    // ----- Notas: lista quem jogou, com a nota automática como dica -----
    function renderNotas() {
      const box = document.getElementById('notas-jogadores');
      if (!estado.mandanteId || !estado.visitanteId) { box.innerHTML = ''; return; }
      const form = box.closest('form');
      const valor = nome => (form && form.elements[nome] ? form.elements[nome].value : '');
      const numero = v => (v === '' || v == null ? null : Number(v));
      // Jogo "provisório" com o que está no formulário, para calcular a nota automática.
      const provisorio = {
        ...(existente || {}), mandanteId: estado.mandanteId, visitanteId: estado.visitanteId,
        status: valor('status') || 'encerrado', golsMandante: numero(valor('golsMandante')), golsVisitante: numero(valor('golsVisitante')),
        gols: estado.gols, cartoes: estado.cartoes, escalacoes: estado.escalacoes, notas: {},
      };
      if (provisorio.status === 'agendado' || provisorio.status === 'adiado') provisorio.status = 'encerrado';
      const auto = DB.Estatisticas.notasDoJogo(provisorio);
      const colunas = [estado.mandanteId, estado.visitanteId].map(timeId => {
        const esc = estado.escalacoes[timeId] || { titulares: [], substituicoes: [] };
        const ids = [...esc.titulares, ...esc.substituicoes.map(s => s.entraId).filter(Boolean)];
        Object.keys(auto).forEach(id => { const j = DB.Jogadores.get(id); if (j && j.timeId === timeId && !ids.includes(id)) ids.push(id); });
        const linhas = ids.map(id => DB.Jogadores.get(id)).filter(Boolean).map(j => `<label class="nota-linha"><span class="num">${j.numero ?? ''}</span><span class="nm">${esc_(j.nome)}</span>
          <input type="number" min="1" max="10" step="0.1" data-nota="${j.id}" value="${estado.notas[j.id] ?? ''}" placeholder="${auto[j.id] != null ? auto[j.id].toFixed(1) : '—'}"></label>`).join('');
        return `<div><div class="escalacao-titulo">${esc_(nomeTime(timeId))}</div>${linhas || '<div class="lances-vazio">Marque a escalação ou lance gols/cartões para listar os jogadores.</div>'}</div>`;
      });
      box.innerHTML = colunas.join('');
      box.querySelectorAll('[data-nota]').forEach(campo => campo.addEventListener('change', () => {
        const v = Number(campo.value);
        if (campo.value === '' || !Number.isFinite(v)) delete estado.notas[campo.dataset.nota];
        else estado.notas[campo.dataset.nota] = Math.max(1, Math.min(10, Math.round(v * 10) / 10));
      }));
    }
    document.getElementById('box-notas').addEventListener('toggle', e => { if (e.target.open) renderNotas(); });

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
        const { erros } = problemasEscalacao(timeId);
        if (erros.length) {
          document.getElementById('box-escalacoes').open = true;
          ui.aba = timeId;
          renderEscalacoes();
          return `Escalação de ${nomeTime(timeId)}: ${erros[0]}`;
        }
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
        // Estatísticas: guarda só os pares com algum valor.
        estatisticas: Object.fromEntries(ESTATISTICAS_JOGO.map(([chave]) => [chave, [numero(dados.get(`est_${chave}_m`)), numero(dados.get(`est_${chave}_v`))]])
          .filter(([, par]) => par.some(v => v != null))),
        notas: Object.fromEntries(Object.entries(estado.notas).filter(([id]) => {
          const j = DB.Jogadores.get(id);
          return j && [estado.mandanteId, estado.visitanteId].includes(j.timeId);
        })),
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
        DB.Historico.registrar('criar', criado.id, null, descreverJogo(DB.Jogos.get(criado.id)));
      } else {
        const antes = DB.Jogos.get(existente.id);
        DB.Jogos.update(existente.id, payload);
        DB.Historico.registrar('editar', existente.id, antes, descreverMudanca(antes, DB.Jogos.get(existente.id)));
      }
      DB.MataMata.sincronizar();
      renderDesfazer();
    }
  }

  function excluir(id) {
    const jogo = DB.Jogos.get(id);
    if (!jogo) return;
    if (!confirm(`Excluir ${nomeTime(jogo.mandanteId)} x ${nomeTime(jogo.visitanteId)}? Gols e cartões deste jogo também serão apagados.`)) return;
    DB.Jogos.remove(id);
    DB.Historico.registrar('excluir', id, jogo, descreverJogo(jogo));
    DB.MataMata.sincronizar();
    renderTabela();
    renderDesfazer();
  }

  // ---------- Histórico e desfazer ----------
  const placarTexto = j => (UI.temPlacar(j) ? `${j.golsMandante}–${j.golsVisitante}` : 'sem placar');
  function descreverJogo(j) {
    return `${nomeTime(j.mandanteId)} x ${nomeTime(j.visitanteId)} (${placarTexto(j)})`;
  }
  // O que mudou entre duas versões do jogo, em poucas palavras.
  function descreverMudanca(a, b) {
    const partes = [];
    if (placarTexto(a) !== placarTexto(b)) partes.push(`placar ${placarTexto(a)} → ${placarTexto(b)}`);
    if (a.status !== b.status) partes.push(`${LABELS_STATUS_JOGO[a.status] || a.status} → ${LABELS_STATUS_JOGO[b.status] || b.status}`);
    const conta = (j, campo) => (j[campo] || []).length;
    if (conta(a, 'gols') !== conta(b, 'gols')) partes.push(`gols lançados ${conta(a, 'gols')} → ${conta(b, 'gols')}`);
    if (conta(a, 'cartoes') !== conta(b, 'cartoes')) partes.push(`cartões ${conta(a, 'cartoes')} → ${conta(b, 'cartoes')}`);
    if (JSON.stringify(a.escalacoes || {}) !== JSON.stringify(b.escalacoes || {})) partes.push('escalações');
    if (a.data !== b.data || a.local !== b.local) partes.push('data/local');
    if (JSON.stringify(a.estatisticas || {}) !== JSON.stringify(b.estatisticas || {})) partes.push('estatísticas');
    if (JSON.stringify(a.notas || {}) !== JSON.stringify(b.notas || {})) partes.push('notas');
    return `${nomeTime(b.mandanteId)} x ${nomeTime(b.visitanteId)}: ${partes.join(' · ') || 'sem mudança visível'}`;
  }
  const ACOES = { criar: 'Criou', editar: 'Editou', excluir: 'Excluiu' };
  const quando = iso => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  function desfazer(h) {
    const posteriores = DB.Historico.doJogo(h.jogoId).filter(x => x.em > h.em).length;
    const aviso = posteriores ? `

As ${posteriores} mudança(s) feitas depois neste mesmo jogo também serão desfeitas.` : '';
    if (!confirm(`Desfazer: ${ACOES[h.acao].toLowerCase()} — ${h.descricao}?${aviso}`)) return false;
    DB.Historico.desfazer(h.id);
    DB.MataMata.sincronizar();
    renderTabela();
    renderDesfazer();
    return true;
  }

  function renderDesfazer() {
    const ultimo = DB.Historico.recentes()[0];
    const botao = document.getElementById('btn-desfazer');
    botao.disabled = !ultimo;
    botao.title = ultimo ? `Desfazer: ${ACOES[ultimo.acao].toLowerCase()} — ${ultimo.descricao}` : 'Nada para desfazer';
    document.getElementById('btn-historico').disabled = !ultimo;
  }

  function abrirHistorico() {
    const itens = DB.Historico.recentes();
    AdminUI.abrirModal({
      titulo: `Histórico de edições · ${comp.curto}`,
      corpoHtml: itens.length ? `<p class="admin-toolbar-hint" style="margin:0 0 12px;">As últimas mudanças feitas neste navegador. Desfazer volta o jogo a como estava antes daquela mudança.</p>
        <ul class="historico">${itens.map(h => `<li>
          <span class="historico-acao historico-${h.acao}">${ACOES[h.acao]}</span>
          <span class="historico-txt"><b>${esc(h.descricao)}</b><small>${quando(h.em)}${h.usuario ? ` · ${esc(h.usuario)}` : ''}</small></span>
          <button type="button" class="btn btn-ghost btn-sm" data-desfazer="${h.id}">${UI.icone('voltar')} Desfazer</button>
        </li>`).join('')}</ul>` : '<p>Nenhuma edição registrada.</p>',
      aoSalvar: () => AdminUI.fecharModal(),
    });
    document.querySelector('#modal-form .btn-primary').textContent = 'Fechar';
    document.getElementById('modal-cancelar').hidden = true;
    document.querySelectorAll('[data-desfazer]').forEach(b => b.addEventListener('click', () => {
      const h = DB.Historico.recentes().find(x => x.id === b.dataset.desfazer);
      if (h && desfazer(h)) abrirHistorico();
    }));
  }

  document.getElementById('btn-novo').addEventListener('click', () => abrirFormulario(null));
  document.getElementById('btn-desfazer').addEventListener('click', () => {
    const ultimo = DB.Historico.recentes()[0];
    if (ultimo) desfazer(ultimo);
  });
  document.getElementById('btn-historico').addEventListener('click', abrirHistorico);
  document.getElementById('btn-importar').addEventListener('click', () => {
    if (typeof CALENDARIO_GRUPOS_2026 === 'undefined') return;
    if (!confirm('Importar os 72 jogos da fase de grupos com datas, horários e estádios oficiais? Nenhum placar é importado, e confrontos já cadastrados são mantidos.')) return;
    const criados = DB.Jogos.importarCalendario(CALENDARIO_GRUPOS_2026);
    alert(criados ? `${criados} jogos importados.` : 'Todos os confrontos da fase de grupos já estavam cadastrados.');
    renderTabela();
  });
  // Data da 1ª rodada: a do campeonato ou, se ela já passou, o próximo sábado
  // (assim os jogos nascem abertos para o bolão).
  function proximoSabado() {
    const d = new Date();
    d.setDate(d.getDate() + (((6 - d.getDay()) + 7) % 7 || 7));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  document.getElementById('btn-gerar').addEventListener('click', () => {
    const padrao = comp.inicio || (comp.tipo === 'liga' ? '2026-08-15' : '2026-04-07');
    const sugestao = new Date(`${padrao}T16:00`) > new Date() ? padrao : proximoSabado();
    const resposta = prompt(`Data da 1ª rodada (AAAA-MM-DD). As seguintes vêm de 7 em 7 dias, às 16:00, e podem ser editadas depois.${sugestao !== padrao ? `

A data oficial (${DB.Util.formatarData(`${padrao}T12:00`)}) já passou: sugerimos o próximo sábado, para os jogos ficarem abertos no bolão.` : ''}`, sugestao);
    if (resposta == null) return;
    const inicio = resposta.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || Number.isNaN(new Date(`${inicio}T12:00`).getTime())) { alert('Data inválida. Use o formato AAAA-MM-DD, por exemplo 2026-11-07.'); return; }
    const msg = comp.tipo === 'liga'
      ? `Criar o turno e o returno completos (${(DB.Times.all().length - 1) * 2} rodadas) a partir de ${DB.Util.formatarData(`${inicio}T12:00`)}? Jogos já cadastrados são mantidos.`
      : `Criar os 6 jogos de cada grupo (turno e returno) a partir de ${DB.Util.formatarData(`${inicio}T12:00`)}? Jogos já cadastrados são mantidos.`;
    if (!confirm(msg)) return;
    let criados = 0;
    if (comp.tipo === 'liga') {
      criados = DB.Jogos.gerarTurnoReturno({ ids: DB.Times.all().map(t => t.id), fase: 'liga', inicio });
    } else {
      DB.Grupos.letras.forEach(letra => {
        criados += DB.Jogos.gerarTurnoReturno({ ids: DB.Grupos.times(letra).map(t => t.id), fase: 'grupos', grupo: letra, inicio });
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
  renderDesfazer();
});
