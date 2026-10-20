document.addEventListener('DOMContentLoaded', () => {
  const esc = DB.Util.escapar;
  const params = new URLSearchParams(window.location.search);
  const time = DB.Times.get(params.get('id'));
  // Abre no campeonato do time (um clube pode estar em mais de um).
  if (time && !params.get('c')) DB.Contexto.ajustarPara({ timeId: time.id });
  UI.montarTopbar();
  UI.montarTicker();
  DB.MataMata.sincronizar();
  const comp = DB.Contexto.get();
  const ehClube = time && time.tipo === 'clube';

  if (!time) {
    document.getElementById('nome-time').textContent = 'Seleção não encontrada';
    UI.montarFooter();
    return;
  }

  document.getElementById('page-title').textContent = `${time.nome} · ${comp.curto} ${comp.temporada} — FUTSTATS`;
  document.querySelector('.breadcrumb a[href="selecoes.html"]').textContent = UI.rotuloTimes();
  document.getElementById('breadcrumb-nome').textContent = time.nome;
  document.getElementById('nome-time').textContent = time.nome;
  document.getElementById('eyebrow-time').textContent = ehClube ? `${time.codigo} · ${comp.curto} ${comp.temporada}` : `${time.codigo} · ${time.confederacao}`;
  document.getElementById('flag-mount').innerHTML = UI.bandeira(time, 'xl');
  const pintarTopo = time => {
    const c = DB.Util.coresTime(time);
    const topo = document.querySelector('.page-hero');
    topo.classList.add('hero-time');
    topo.style.setProperty('--time-1', c.primaria);
    topo.style.setProperty('--time-2', c.secundaria);
    // Escudo (ou bandeira) gigante e apagado ao fundo.
    const marca = ehClube ? time.escudo : DB.Util.bandeiraUrl(time.iso, 640);
    if (marca) {
      topo.insertAdjacentHTML('afterbegin', `<img class="hero-marca time-marca${ehClube ? '' : ' bandeira'}" src="${esc(marca)}" alt="" aria-hidden="true" onerror="this.remove()">`);
    }
  };
  pintarTopo(time);

  const elenco = DB.Jogadores.all().filter(j => j.timeId === time.id);
  const capitao = elenco.find(j => j.capitao);
  const comIdade = elenco.filter(j => j.idade != null);
  const mediaIdade = comIdade.length ? comIdade.reduce((s, j) => s + j.idade, 0) / comIdade.length : null;
  const fato = (icone, rotulo, valor) => (valor ? `<span class="fact"><span class="fact-ico" aria-hidden="true">${icone}</span>${rotulo} <strong>${esc(valor)}</strong></span>` : '');
  const outrasComps = ehClube ? DB.Contexto.competicoesDoTime(time.id).filter(c => c.id !== comp.id) : [];
  document.getElementById('fatos-time').innerHTML = [
    fato('🔠', 'Grupo', DB.Grupos.deTime(time.id)),
    fato('📋', 'Técnico', time.tecnico),
    fato('©️', 'Capitão', capitao && capitao.nome),
    ehClube ? fato('🏟️', 'Estádio', time.estadio) : fato('🌍', 'Ranking FIFA', time.rankingFifa && `#${time.rankingFifa}`),
    fato('🎂', 'Idade média', mediaIdade && mediaIdade.toFixed(1).replace('.', ',')),
    ...outrasComps.map(c => `<a class="fact" href="time.html?id=${time.id}&c=${c.id}">${UI.iconeCampeonato(c)} <strong>${esc(c.curto)}</strong></a>`),
  ].join('');

  // ---------- Forma recente e próximo jogo (no topo) ----------
  const jogosDoTime = DB.Jogos.doTime(time.id);
  const encerrados = jogosDoTime.filter(j => j.status === 'encerrado' && j.golsMandante != null && j.golsVisitante != null);
  const proximo = jogosDoTime.find(j => j.status !== 'encerrado');
  if (encerrados.length || proximo) {
    const resultado = j => {
      const casa = j.mandanteId === time.id;
      const pro = casa ? j.golsMandante : j.golsVisitante, contra = casa ? j.golsVisitante : j.golsMandante;
      const r = pro > contra ? 'V' : pro < contra ? 'D' : 'E';
      const adv = DB.Times.get(casa ? j.visitanteId : j.mandanteId);
      return `<a class="forma-pill forma-${r}" href="jogo.html?id=${j.id}" title="${pro}–${contra} ${casa ? 'x' : '@'} ${esc(adv ? adv.nome : 'A definir')}">${r}</a>`;
    };
    let proxHtml = '';
    if (proximo) {
      const adv = DB.Times.get(proximo.mandanteId === time.id ? proximo.visitanteId : proximo.mandanteId);
      const aoVivo = proximo.status === 'ao_vivo';
      proxHtml = `<a class="forma-prox" href="jogo.html?id=${proximo.id}">
        <span class="forma-rotulo">${aoVivo ? '<span class="live-dot"></span> Ao vivo' : 'Próximo jogo'}</span>
        <span class="forma-adv">${UI.bandeira(adv, 'sm')}<strong>${esc(adv ? adv.nome : 'A definir')}</strong></span>
        <span class="forma-data">${aoVivo ? `${proximo.golsMandante ?? 0} – ${proximo.golsVisitante ?? 0}` : DB.Util.formatarData(proximo.data)}</span>
      </a>`;
    }
    const forma = document.getElementById('forma-time');
    forma.innerHTML = `
      ${encerrados.length ? `<div class="forma-rotulo">Últimos jogos</div>
      <div class="forma-pills">${encerrados.slice(-5).map(resultado).join('')}</div>` : ''}
      ${proxHtml}`;
    forma.hidden = false;
  }

  // ---------- Favorito ----------
  const btnFav = document.getElementById('btn-favorito');
  const pintarFav = ativo => {
    btnFav.textContent = ativo ? '★' : '☆';
    btnFav.classList.toggle('ativo', ativo);
    btnFav.setAttribute('aria-pressed', ativo);
    btnFav.title = ativo ? 'Deixar de seguir' : 'Seguir este time (aparece em destaque no início)';
  };
  pintarFav(UI.Favoritos.tem(time.id));
  btnFav.hidden = false;
  btnFav.addEventListener('click', () => pintarFav(UI.Favoritos.alternar(time.id)));

  // ---------- Campanha: posição na tabela rodada a rodada ----------
  if (comp.tipo === 'liga' || comp.tipo === 'champions') {
    const evolucao = DB.Estatisticas.evolucaoPosicao(time.id);
    if (evolucao.length >= 2) {
      document.getElementById('painel-campanha').hidden = false;
      const nTimes = DB.Times.all().length;
      const passo = nTimes > 20 ? 6 : 4;
      const marcas = [1, ...Array.from({ length: Math.floor((nTimes - 1) / passo) }, (_, i) => 1 + (i + 1) * passo).filter(v => v < nTimes), nTimes];
      const cor = DB.Util.coresTime(time);
      // Cor do time; se for branca (some no tema claro), a secundária; se as duas forem, a do tema.
      const branca = c => /^#?f{3}(f{3})?$/i.test(c);
      const corLinha = !branca(cor.primaria) ? cor.primaria : !branca(cor.secundaria) ? cor.secundaria : 'var(--gold)';
      document.getElementById('grafico-campanha').innerHTML = UI.graficoLinha(
        evolucao.map(e => ({ x: e.rodada, y: e.posicao, rotulo: `${e.rodada}ª rodada: ${e.posicao}º · ${e.pontos} pts` })),
        { yMin: 1, yMax: nTimes, inverter: true, marcasY: marcas, rotuloY: v => `${v}º`, cor: corLinha, altura: 220,
          largura: document.getElementById('grafico-campanha').clientWidth - 28 });
      const ult = evolucao[evolucao.length - 1];
      const melhor = Math.min(...evolucao.map(e => e.posicao)), pior = Math.max(...evolucao.map(e => e.posicao));
      document.getElementById('campanha-resumo').innerHTML = `Agora <b>${ult.posicao}º</b> · melhor ${melhor}º · pior ${pior}º`;
      document.getElementById('painel-campanha').hidden = false;
    }
  }

  // ---------- Números no campeonato ----------
  const st = DB.Estatisticas.porTime().find(t => t.time.id === time.id);
  const tile = (l, v, classe = '') => `<div class="stat-tile ${classe}"><div class="v">${v}</div><div class="l">${l}</div></div>`;
  document.getElementById('tiles-time').innerHTML = [
    tile('Jogos', st.J), tile('Vitórias', st.V), tile('Empates', st.E), tile('Derrotas', st.D),
    tile('Gols marcados', st.GP, 'gold'), tile('Gols sofridos', st.GC), tile('Sem sofrer gol', st.semSofrer),
    tile('Cartões', `${st.CA}<span style="font-size:16px;color:var(--text-dim)"> 🟨 ${st.CV} 🟥</span>`),
  ].join('');

  // ---------- Elenco por posição ----------
  const stats = Object.fromEntries(DB.Estatisticas.porJogador().map(l => [l.jogador.id, l]));
  const POSICOES = ['Goleiro', 'Defensor', 'Meio-campo', 'Atacante'];
  const ROTULOS = { Goleiro: 'Goleiros', Defensor: 'Defensores', 'Meio-campo': 'Meio-campistas', Atacante: 'Atacantes' };
  const outras = [...new Set(elenco.map(j => j.posicao))].filter(p => !POSICOES.includes(p));
  const celula = (v, destaque) => `<span class="c${v ? (destaque ? ' hl' : '') : ' zero'}">${v || 0}</span>`;
  document.getElementById('qtd-elenco').textContent = elenco.length;
  document.getElementById('elenco').innerHTML = elenco.length ? [...POSICOES, ...outras].map(pos => {
    const doSetor = elenco.filter(j => j.posicao === pos).sort((a, b) => (a.numero ?? 99) - (b.numero ?? 99));
    if (!doSetor.length) return '';
    return `
      <div class="squad-pos">${ROTULOS[pos] || pos}</div>
      <div class="squad-row head${ehClube ? ' clube' : ''}"><span>Nº</span><span>Jogador</span><span class="club">${ehClube ? 'Nacionalidade' : 'Clube'}</span>
        ${ehClube ? '' : '<span class="c col-extra" title="Jogos pela seleção antes da Copa">Jogos</span><span class="c col-extra" title="Gols pela seleção antes da Copa">Gols sel.</span>'}
        <span class="c" title="Jogos no campeonato">J</span>
        <span class="c" title="Gols no campeonato">G</span><span class="c" title="Assistências no campeonato">A</span></div>
      ${doSetor.map(j => {
        const s = stats[j.id] || {};
        return `<a class="squad-row${ehClube ? ' clube' : ''}" href="jogador.html?id=${j.id}">
          <span class="n">${j.numero ?? '–'}</span>
          <span class="player"><span class="nome">${esc(j.nome)}${j.capitao ? '<span class="captain" title="Capitão">C</span>' : ''}</span>
            <span class="sub">${j.idade != null ? `${j.idade} anos` : ''}${j.status && j.status !== 'ativo' ? ` · ${j.status}` : ''}</span></span>
          ${ehClube
            ? `<span class="club">${UI.bandeiraPais(j.nacionalidade)}<span>${esc(UI.nomePais(j.nacionalidade))}</span></span>`
            : `<span class="club">${UI.bandeiraClube(j.clubePais)}<span>${esc(j.clube || '—')}</span></span>
          <span class="c col-extra">${j.jogosSelecao ?? '–'}</span>
          <span class="c col-extra">${j.golsSelecao ?? '–'}</span>`}
          ${celula(s.jogos)}${celula(s.gols, true)}${celula(s.assistencias, true)}
        </a>`;
      }).join('')}`;
  }).join('') : UI.vazio('Elenco não cadastrado', '');

  // ---------- Lateral ----------
  const grupo = DB.Grupos.deTime(time.id);
  if (comp.tipo === 'liga' || comp.tipo === 'champions') {
    document.getElementById('titulo-grupo').textContent = 'Classificação';
    document.getElementById('link-grupo').href = 'grupos.html';
    document.getElementById('link-grupo').textContent = 'Ver tabela →';
    document.getElementById('tabela-grupo').innerHTML = UI.tabelaLiga({ compacta: true, destaque: time.id });
  } else if (grupo) {
    document.getElementById('titulo-grupo').textContent = `Grupo ${grupo}`;
    document.getElementById('link-grupo').href = `grupos.html#grupo-${grupo}`;
    document.getElementById('tabela-grupo').innerHTML = UI.tabelaGrupo(grupo, { compacta: true, destaque: time.id });
  } else {
    document.getElementById('titulo-grupo').textContent = 'Mata-mata';
    document.getElementById('link-grupo').href = 'chaveamento.html';
    document.getElementById('link-grupo').textContent = 'Chaveamento →';
    const confrontos = (comp.fases || []).flatMap(f => DB.MataMata.confrontos(f)).filter(c => c.timeA === time.id || c.timeB === time.id);
    document.getElementById('tabela-grupo').innerHTML = confrontos.length
      ? `<div class="stack" style="padding:14px 18px;gap:10px;">${confrontos.map(c => `<div class="bracket-round-title" style="text-align:left;margin:0;">${DB.Util.faseLabel(c.fase)}</div>${UI.cartaoConfronto(c)}`).join('')}</div>`
      : UI.vazio('Sem confrontos cadastrados', '');
  }

  const jogos = DB.Jogos.doTime(time.id);
  document.getElementById('jogos-time').innerHTML = jogos.length
    ? jogos.map(UI.linhaJogoCompacta).join('')
    : UI.vazio('Nenhum jogo cadastrado', '');

  const artilheiros = DB.Estatisticas.porJogador()
    .filter(l => l.jogador.timeId === time.id && (l.gols || l.assistencias))
    .sort((a, b) => b.gols - a.gols || b.assistencias - a.assistencias)
    .slice(0, 6);
  document.getElementById('artilheiros-time').innerHTML = artilheiros.length
    ? `<ol class="leader-list">${artilheiros.map((l, i) => `
      <li><a class="leader" href="jogador.html?id=${l.jogador.id}">
        <span class="rank">${i + 1}</span>${UI.avatar(l.jogador)}
        <span class="info"><span class="nome">${esc(l.jogador.nome)}</span><span class="sub">${l.assistencias} assistência${l.assistencias === 1 ? '' : 's'}</span></span>
        <span class="valor">${l.gols}<small>gols</small></span>
      </a></li>`).join('')}</ol>`
    : UI.vazio('Sem gols cadastrados', '');

  UI.montarFooter();
});
