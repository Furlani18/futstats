const UI = (() => {
  function paginaAtual() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  function secaoAtual() {
    const atual = paginaAtual();
    if (atual === 'index.html') return 'inicio';
    if (atual === 'grupos.html') return 'grupos';
    if (atual === 'chaveamento.html' || atual === 'jogo.html') return 'chaveamento';
    if (atual === 'time.html') return 'selecoes';
    return '';
  }

  function montarTopbar() {
    const mount = document.getElementById('topbar-mount');
    if (!mount) return;
    const secao = secaoAtual();
    mount.innerHTML = `
      <div class="topbar">
        <div class="topbar-inner">
          <a class="topbar-logo" href="index.html"><span class="dot"></span>FUT<span class="accent">STATS</span></a>
          <input type="checkbox" id="nav-toggle" class="nav-toggle-checkbox">
          <label for="nav-toggle" class="nav-toggle-btn">☰</label>
          <nav class="topbar-nav">
            <a href="index.html" class="${secao === 'inicio' ? 'active' : ''}">Início</a>
            <a href="grupos.html" class="${secao === 'grupos' ? 'active' : ''}">Grupos</a>
            <a href="chaveamento.html" class="${secao === 'chaveamento' ? 'active' : ''}">Chaveamento</a>
            <a href="index.html#secao-times" class="${secao === 'selecoes' ? 'active' : ''}">Seleções</a>
            <a href="login.html">Área administrativa</a>
          </nav>
        </div>
      </div>`;
  }

  function montarTicker() {
    const mount = document.getElementById('ticker-mount');
    if (!mount) return;
    const jogos = [...DB.Jogos.aoVivo(), ...DB.Jogos.all().filter(j => j.status === 'encerrado').slice(-8)];
    if (!jogos.length) { mount.innerHTML = ''; return; }
    const itens = jogos.map(j => {
      const mandante = DB.Times.get(j.mandanteId);
      const visitante = DB.Times.get(j.visitanteId);
      const placar = (j.status === 'agendado' || j.status === 'adiado') ? 'x' : `${j.golsMandante} - ${j.golsVisitante}`;
      const prefixo = j.status === 'ao_vivo' ? '<strong>AO VIVO</strong> ' : '';
      return `<span class="ticker-item">${prefixo}${mandante ? mandante.nome : '—'} <strong>${placar}</strong> ${visitante ? visitante.nome : '—'}</span>`;
    });
    const conteudo = itens.join('');
    mount.innerHTML = `<div class="ticker"><div class="ticker-track">${conteudo}${conteudo}</div></div>`;
  }

  function montarFooter() {
    const mount = document.getElementById('footer-mount');
    if (!mount) return;
    mount.innerHTML = `
      <div class="footer">
        <div class="footer-inner">
          <span>© 2026 FUTSTATS — Copa do Mundo FIFA 2026, grupos e chaveamento.</span>
          <div class="footer-links">
            <a href="index.html">Início</a>
            <a href="login.html">Painel administrativo</a>
          </div>
        </div>
      </div>`;
  }

  function crestHtml(time, tamanho) {
    const estilo = tamanho ? `width:${tamanho}px;height:${tamanho}px;` : '';
    if (!time) return `<span class="match-crest" style="${estilo}"></span>`;
    const cor = DB.Util.corPara(time.id);
    const fonte = tamanho ? Math.round(tamanho * 0.38) : 11;
    const fallback = `this.replaceWith(Object.assign(document.createElement('span'),{className:'match-crest',style:'${estilo}background:${cor}22;border-color:${cor}55;color:${cor};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${fonte}px;',textContent:'${DB.Util.iniciais(time.nome)}'}))`;
    const url = DB.Util.bandeiraUrl(time.iso, tamanho ? Math.max(tamanho, 40) : 40);
    if (!url) {
      return `<span class="match-crest" style="${estilo}background:${cor}22;border-color:${cor}55;color:${cor};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${fonte}px;">${DB.Util.iniciais(time.nome)}</span>`;
    }
    return `<span class="match-crest" style="${estilo}"><img src="${url}" alt="Bandeira de ${time.nome}" title="${time.nome}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="${fallback}"></span>`;
  }

  function badge(status) {
    return `<span class="badge badge-${status}">${DB.Util.statusLabel(status)}</span>`;
  }

  function rotuloJogo(jogo) {
    if (jogo.fase === 'grupos') return `Grupo ${jogo.grupo} · R${jogo.rodada}`;
    return DB.Util.faseLabel(jogo.fase);
  }

  function linhaJogo(jogo) {
    const mandante = DB.Times.get(jogo.mandanteId);
    const visitante = DB.Times.get(jogo.visitanteId);
    const placar = (jogo.status === 'agendado' || jogo.status === 'adiado')
      ? 'vs'
      : `${jogo.golsMandante} - ${jogo.golsVisitante}`;
    return `
      <a class="match-row" href="jogo.html?id=${jogo.id}">
        <span class="match-round">${rotuloJogo(jogo)}</span>
        <span class="match-teams">
          <span class="match-team">${crestHtml(mandante)}<span>${mandante ? mandante.nome : '—'}</span></span>
        </span>
        <span class="match-score">${placar}</span>
        <span class="match-teams justify-end">
          <span class="match-team">${crestHtml(visitante)}<span>${visitante ? visitante.nome : '—'}</span></span>
        </span>
        <span class="match-meta">${badge(jogo.status)}<br>${DB.Util.formatarData(jogo.data)}</span>
      </a>`;
  }

  function linhasClassificacao(tabelaOrigem, opts = {}) {
    const { limite, colunas = 'completa' } = opts;
    let tabela = tabelaOrigem;
    if (limite) tabela = tabela.slice(0, limite);
    return tabela.map(t => {
      const posicao = t.posicao;
      if (colunas === 'mini') return `<tr><td>${posicao}</td><td>${t.nome}</td><td>${t.P}</td><td>${t.J}</td><td>${t.SG}</td></tr>`;
      if (colunas === 'jogo') return `<tr><td>${posicao}</td><td>${t.nome}</td><td>${t.P}</td><td>${t.SG}</td></tr>`;
      return `<tr><td>${posicao}</td><td>${t.nome}</td><td>${t.P}</td><td>${t.J}</td><td>${t.V}</td><td>${t.E}</td><td>${t.D}</td><td>${t.SG}</td></tr>`;
    }).join('');
  }

  return { montarTopbar, montarTicker, montarFooter, crestHtml, badge, linhaJogo, rotuloJogo, linhasClassificacao };
})();
