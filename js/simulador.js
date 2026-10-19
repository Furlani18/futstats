document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();
  DB.MataMata.sincronizar();

  const esc = DB.Util.escapar;
  const comp = DB.Contexto.get();
  const ehCopa = comp.tipo === 'copa_mundo';
  if (comp.tipo === 'mata_mata') { window.location.replace('chaveamento.html'); return; }
  // Palpites separados por campeonato (a Copa mantém a chave original).
  const CHAVE = ehCopa ? 'fs_palpites' : `fs_palpites_${comp.id}`;
  if (comp.tipo === 'liga' || comp.tipo === 'champions') {
    simuladorLiga(comp, CHAVE);
    UI.montarFooter();
    return;
  }
  if (!ehCopa) {
    document.getElementById('sim-extras-copa').hidden = true;
    document.getElementById('sim-legenda').innerHTML = UI.legendaZonas();
  }
  const chaveConfronto = (a, b) => [a, b].sort().join('|');

  function lerPalpites() {
    try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { return {}; }
  }
  function gravarPalpites(p) {
    try { localStorage.setItem(CHAVE, JSON.stringify(p)); } catch (e) { /* sem armazenamento: só nesta visita */ }
  }
  let palpites = lerPalpites();

  // ---------- Confrontos: jogos cadastrados + calendário oficial para os que faltam ----------
  const porNome = Object.fromEntries(DB.Times.all().map(t => [t.nome, t]));
  const confrontos = [];
  DB.Grupos.letras.forEach(letra => {
    const reais = DB.Jogos.porGrupo(letra);
    const vistos = new Set();
    reais.forEach(j => {
      vistos.add(chaveConfronto(j.mandanteId, j.visitanteId));
      confrontos.push({ chave: chaveConfronto(j.mandanteId, j.visitanteId), grupo: letra, rodada: j.rodada, data: j.data, mandanteId: j.mandanteId, visitanteId: j.visitanteId, real: j });
    });
    const calendario = typeof CALENDARIO_GRUPOS_2026 !== 'undefined' ? CALENDARIO_GRUPOS_2026 : [];
    calendario.filter(c => c.grupo === letra).forEach(c => {
      const m = porNome[c.mandante], v = porNome[c.visitante];
      if (!m || !v || vistos.has(chaveConfronto(m.id, v.id))) return;
      vistos.add(chaveConfronto(m.id, v.id));
      confrontos.push({ chave: chaveConfronto(m.id, v.id), grupo: letra, rodada: c.rodada, data: c.data, mandanteId: m.id, visitanteId: v.id, real: null });
    });
  });
  confrontos.sort((a, b) => a.grupo.localeCompare(b.grupo) || a.data.localeCompare(b.data));

  const resultadoReal = c => c.real && c.real.status === 'encerrado' && c.real.golsMandante != null;

  // Lista de jogos "como se tivessem acontecido": reais encerrados + palpites completos.
  function fonte() {
    return confrontos.map(c => {
      if (resultadoReal(c)) return c.real;
      const p = palpites[c.chave];
      const completo = p && p[0] !== '' && p[1] !== '' && p[0] != null && p[1] != null;
      return {
        fase: 'grupos', grupo: c.grupo, rodada: c.rodada, mandanteId: c.mandanteId, visitanteId: c.visitanteId,
        golsMandante: completo ? Number(p[0]) : null, golsVisitante: completo ? Number(p[1]) : null,
        status: completo ? 'encerrado' : 'agendado', cartoes: [],
      };
    });
  }

  let grupoAtual = 'A';

  function renderJogos() {
    const lista = confrontos.filter(c => c.grupo === grupoAtual);
    document.getElementById('titulo-jogos').textContent = `Jogos · Grupo ${grupoAtual}`;
    document.getElementById('sim-jogos').innerHTML = lista.length ? lista.map(c => {
      const m = DB.Times.get(c.mandanteId), v = DB.Times.get(c.visitanteId);
      const real = resultadoReal(c);
      const p = palpites[c.chave] || ['', ''];
      const campo = (i, valor) => real
        ? `<input value="${valor}" disabled>`
        : `<input type="number" min="0" max="20" inputmode="numeric" data-chave="${c.chave}" data-i="${i}" value="${p[i] ?? ''}" class="${p[i] !== '' && p[i] != null ? 'palpite' : ''}" aria-label="Gols ${esc(i ? v.nome : m.nome)}">`;
      return `<div class="sim-match${real ? ' real' : ''}">
        <span class="team-inline home"><span class="nome">${esc(m.nome)}</span>${UI.bandeira(m, 'sm')}</span>
        ${campo(0, real ? c.real.golsMandante : '')}<span class="x">×</span>${campo(1, real ? c.real.golsVisitante : '')}
        <span class="team-inline">${UI.bandeira(v, 'sm')}<span class="nome">${esc(v.nome)}</span></span>
        ${real ? '<span class="tag-real">Resultado real</span>' : ''}
      </div>`;
    }).join('') : UI.vazio('Sem jogos neste grupo', '');

    document.querySelectorAll('#sim-jogos input[data-chave]').forEach(input => {
      input.addEventListener('input', () => {
        const atual = palpites[input.dataset.chave] || ['', ''];
        atual[Number(input.dataset.i)] = input.value === '' ? '' : String(Math.max(0, Math.min(20, parseInt(input.value, 10) || 0)));
        palpites[input.dataset.chave] = atual;
        if (atual[0] === '' && atual[1] === '') delete palpites[input.dataset.chave];
        input.classList.toggle('palpite', input.value !== '');
        gravarPalpites(palpites);
        renderResultados();
      });
    });
  }

  function renderResultados() {
    const jogos = fonte();
    const terceiros = ehCopa ? DB.Classificacao.terceiros(jogos) : [];
    const zonasGrupo = comp.zonasGrupo || [];
    const classificados3 = new Set(terceiros.filter(t => t.classificado).map(t => t.timeId));

    // Tabela do grupo atual
    const tabela = DB.Classificacao.grupo(grupoAtual, jogos);
    const algum = tabela.some(t => t.J > 0);
    document.getElementById('titulo-tabela').textContent = `Classificação · Grupo ${grupoAtual}`;
    document.getElementById('sim-tabela').innerHTML = `<div class="table-scroll"><table class="stats-table">
      <thead><tr><th>#</th><th class="left">Seleção</th><th>J</th><th>V</th><th>E</th><th>D</th><th>Gols</th><th>SG</th><th class="strong">Pts</th></tr></thead>
      <tbody>${tabela.map(t => {
        let zona = '';
        if (algum && ehCopa) zona = t.posicao <= 2 ? `zona-${t.posicao}` : (t.posicao === 3 && classificados3.has(t.timeId)) ? 'zona-3' : '';
        else if (algum) { const z = zonasGrupo.find(x => t.posicao >= x.de && t.posicao <= x.ate); zona = z ? `zona-cor zona-${z.cor}` : ''; }
        return `<tr class="${zona}"><td class="pos">${t.posicao}</td><td class="left">${UI.timeLink(DB.Times.get(t.timeId))}</td>
          <td>${t.J}</td><td>${t.V}</td><td>${t.E}</td><td>${t.D}</td><td class="dim">${t.GP}:${t.GC}</td>
          <td>${t.SG > 0 ? '+' : ''}${t.SG}</td><td class="strong">${t.P}</td></tr>`;
      }).join('')}</tbody></table></div>`;

    if (!ehCopa) { renderProgresso(jogos); return; }

    // Terceiros
    document.getElementById('sim-terceiros').innerHTML = `<table class="stats-table">
      <thead><tr><th>#</th><th class="left">Seleção</th><th>Grupo</th><th>J</th><th>Gols</th><th>SG</th><th class="strong">Pts</th></tr></thead>
      <tbody>${terceiros.map(t => `<tr class="${t.classificado ? 'zona-3' : 'eliminado'}">
        <td class="pos">${t.posicaoGeral}</td><td class="left">${UI.timeLink(DB.Times.get(t.timeId))}</td><td>${t.grupo}</td>
        <td>${t.J}</td><td class="dim">${t.GP}:${t.GC}</td><td>${t.SG > 0 ? '+' : ''}${t.SG}</td><td class="strong">${t.P}</td></tr>`).join('')}</tbody></table>`;

    // 32avos
    const r32 = DB.MataMata.projetarR32(jogos);
    const lado = (id, rotulo) => {
      const t = id ? DB.Times.get(id) : null;
      return `<div class="bracket-team">${t ? UI.bandeira(t, 'sm') : ''}<span class="nome">${esc(t ? t.nome : rotulo)}</span>
        <span class="gols" style="font-size:11px;color:var(--text-faint);font-family:Inter,sans-serif;">${esc(rotulo.replace(/^.*\((.*)\)$/, '$1'))}</span></div>`;
    };
    document.getElementById('sim-r32').innerHTML = `<div class="sim-r32">${r32.map(s => `
      <div class="bracket-match${s.projetado ? ' projetado' : ''}">
        <div class="bracket-meta" style="text-align:left;margin:0 0 2px;">Jogo ${s.matchNum}</div>
        ${lado(s.mandanteId, s.labelMandante)}${lado(s.visitanteId, s.labelVisitante)}
      </div>`).join('')}</div>`;

    renderProgresso(jogos);
  }

  function renderProgresso(jogos) {
    const total = confrontos.length;
    const definidos = jogos.filter(j => j.status === 'encerrado').length;
    document.getElementById('sim-progresso').textContent = total
      ? `${definidos} de ${total} jogos com resultado (real ou palpite)${definidos === total ? ' — grupos completos!' : ''}`
      : 'Nenhum jogo da fase de grupos cadastrado ainda.';
    renderChips();
  }

  function renderChips() {
    const jogos = fonte();
    document.getElementById('chips-grupo').innerHTML = DB.Grupos.letras.map(l => {
      const doGrupo = jogos.filter(j => j.grupo === l);
      const ok = doGrupo.length >= DB.Grupos.jogosPrevistos(l) && doGrupo.every(j => j.status === 'encerrado');
      return `<button type="button" class="chip${l === grupoAtual ? ' active' : ''}" data-g="${l}">Grupo ${l}${ok ? ' ✓' : ''}</button>`;
    }).join('');
    document.querySelectorAll('#chips-grupo .chip').forEach(b => b.addEventListener('click', () => {
      grupoAtual = b.dataset.g;
      renderJogos();
      renderResultados();
    }));
  }

  document.getElementById('btn-limpar').addEventListener('click', () => {
    if (!Object.keys(palpites).length || !confirm('Apagar todos os seus palpites?')) return;
    palpites = {};
    gravarPalpites(palpites);
    renderJogos();
    renderResultados();
  });

  // Palpites aleatórios ponderados pelo ranking FIFA (o mais bem ranqueado tende a marcar mais).
  document.getElementById('btn-aleatorio').addEventListener('click', () => {
    const gols = forca => {
      const media = 0.6 + forca * 1.4;
      let n = 0, p = Math.exp(-media), soma = p;
      const r = Math.random();
      while (r > soma && n < 7) { n++; p *= media / n; soma += p; }
      return n;
    };
    confrontos.forEach(c => {
      if (resultadoReal(c)) return;
      const atual = palpites[c.chave];
      if (atual && atual[0] !== '' && atual[1] !== '') return;
      const m = DB.Times.get(c.mandanteId), v = DB.Times.get(c.visitanteId);
      const fm = (49 - m.rankingFifa) / 48, fv = (49 - v.rankingFifa) / 48;
      palpites[c.chave] = [String(gols(fm / (fm + fv))), String(gols(fv / (fm + fv)))];
    });
    gravarPalpites(palpites);
    renderJogos();
    renderResultados();
  });

  renderJogos();
  renderResultados();
  UI.montarFooter();
});

// Simulador de pontos corridos (ligas e fase de liga da Champions): palpites
// para os jogos cadastrados que faltam, rodada a rodada, e a tabela final projetada.
function simuladorLiga(comp, CHAVE) {
  const esc = DB.Util.escapar;
  const ler = () => { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { return {}; } };
  const gravar = p => { try { localStorage.setItem(CHAVE, JSON.stringify(p)); } catch (e) { /* só nesta visita */ } };
  let palpites = ler();

  document.getElementById('sim-titulo').textContent = `Simulador · ${comp.curto}`;
  document.querySelector('.page-hero .lead').textContent = 'Dê palpites para os jogos que faltam e veja como terminaria a tabela. Resultados reais não mudam, e os palpites ficam salvos só neste navegador.';
  document.getElementById('sim-extras-copa').hidden = true;
  document.getElementById('sim-legenda').innerHTML = UI.legendaZonas(comp.zonas);

  const jogosLiga = DB.Jogos.all().filter(j => j.fase === 'liga').sort((a, b) => (a.rodada - b.rodada) || new Date(a.data) - new Date(b.data));
  const real = j => j.status === 'encerrado' && j.golsMandante != null;
  const rodadas = [...new Set(jogosLiga.map(j => j.rodada))].sort((a, b) => a - b);
  let rodadaAtual = (jogosLiga.find(j => !real(j)) || jogosLiga[jogosLiga.length - 1] || {}).rodada;

  function fonte() {
    return jogosLiga.map(j => {
      if (real(j)) return j;
      const p = palpites[j.id];
      const ok = p && p[0] !== '' && p[1] !== '' && p[0] != null && p[1] != null;
      return { ...j, golsMandante: ok ? Number(p[0]) : null, golsVisitante: ok ? Number(p[1]) : null, status: ok ? 'encerrado' : 'agendado' };
    });
  }

  function renderRodadas() {
    const mount = document.getElementById('chips-grupo');
    if (!rodadas.length) { mount.innerHTML = ''; return; }
    mount.innerHTML = `<label class="chip" style="display:inline-flex;align-items:center;gap:8px;cursor:default;">Rodada
      <select id="sim-rodada" class="chip-select">${rodadas.map(r => {
        const js = fonte().filter(j => j.rodada === r);
        const ok = js.every(j => j.status === 'encerrado');
        return `<option value="${r}" ${r === rodadaAtual ? 'selected' : ''}>${r}ª${ok ? ' ✓' : ''}</option>`;
      }).join('')}</select></label>`;
    document.getElementById('sim-rodada').addEventListener('change', e => { rodadaAtual = Number(e.target.value); renderJogos(); renderTabela(); });
  }

  function renderJogos() {
    document.getElementById('titulo-jogos').textContent = rodadaAtual ? `Jogos · ${rodadaAtual}ª rodada` : 'Jogos';
    const lista = jogosLiga.filter(j => j.rodada === rodadaAtual);
    document.getElementById('sim-jogos').innerHTML = lista.length ? lista.map(j => {
      const m = DB.Times.get(j.mandanteId), v = DB.Times.get(j.visitanteId);
      const ehReal = real(j);
      const p = palpites[j.id] || ['', ''];
      const campo = (i, valor) => ehReal
        ? `<input value="${valor}" disabled>`
        : `<input type="number" min="0" max="20" inputmode="numeric" data-id="${j.id}" data-i="${i}" value="${p[i] ?? ''}" class="${p[i] !== '' && p[i] != null ? 'palpite' : ''}">`;
      return `<div class="sim-match${ehReal ? ' real' : ''}">
        <span class="team-inline home"><span class="nome">${esc(m.nome)}</span>${UI.bandeira(m, 'sm')}</span>
        ${campo(0, ehReal ? j.golsMandante : '')}<span class="x">×</span>${campo(1, ehReal ? j.golsVisitante : '')}
        <span class="team-inline">${UI.bandeira(v, 'sm')}<span class="nome">${esc(v.nome)}</span></span>
        ${ehReal ? '<span class="tag-real">Resultado real</span>' : ''}
      </div>`;
    }).join('') : UI.vazio('Nenhum jogo cadastrado', 'Gere as rodadas no painel (Jogos → Gerar rodadas) para simular.');
    document.querySelectorAll('#sim-jogos input[data-id]').forEach(input => input.addEventListener('input', () => {
      const atual = palpites[input.dataset.id] || ['', ''];
      atual[Number(input.dataset.i)] = input.value === '' ? '' : String(Math.max(0, Math.min(20, parseInt(input.value, 10) || 0)));
      palpites[input.dataset.id] = atual;
      if (atual[0] === '' && atual[1] === '') delete palpites[input.dataset.id];
      input.classList.toggle('palpite', input.value !== '');
      gravar(palpites);
      renderTabela();
    }));
  }

  function renderTabela() {
    const jogos = fonte();
    document.getElementById('titulo-tabela').textContent = 'Classificação projetada';
    document.getElementById('sim-tabela').innerHTML = UI.tabelaLiga({ compacta: true, fonte: jogos });
    const definidos = jogos.filter(j => j.status === 'encerrado').length;
    document.getElementById('sim-progresso').textContent = jogos.length
      ? `${definidos} de ${jogos.length} jogos com resultado (real ou palpite)${definidos === jogos.length ? ' — temporada completa!' : ''}`
      : '';
    renderRodadas();
  }

  document.getElementById('btn-limpar').addEventListener('click', () => {
    if (!Object.keys(palpites).length || !confirm('Apagar todos os seus palpites deste campeonato?')) return;
    palpites = {};
    gravar(palpites);
    renderJogos();
    renderTabela();
  });
  document.getElementById('btn-aleatorio').addEventListener('click', () => {
    // Força relativa pela campanha real até aqui (aproveitamento); sem jogos, 50%.
    const tabela = Object.fromEntries(DB.Classificacao.liga().map(t => [t.timeId, t.J ? t.P / (t.J * 3) : 0.5]));
    const gols = media => { let n = 0, p = Math.exp(-media), soma = p; const r = Math.random(); while (r > soma && n < 7) { n++; p *= media / n; soma += p; } return n; };
    jogosLiga.forEach(j => {
      if (real(j)) return;
      const atual = palpites[j.id];
      if (atual && atual[0] !== '' && atual[1] !== '') return;
      const fm = 0.4 + (tabela[j.mandanteId] ?? 0.5), fv = 0.4 + (tabela[j.visitanteId] ?? 0.5);
      palpites[j.id] = [String(gols(1.55 * fm / (fm + fv) * 1.15)), String(gols(1.55 * fv / (fm + fv)))];
    });
    gravar(palpites);
    renderJogos();
    renderTabela();
  });

  renderJogos();
  renderTabela();
}
