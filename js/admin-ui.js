const AdminUI = (() => {
  // O painel é uma página só (painel.html): cada seção é um <template> trocado
  // pelo #hash da URL, sem recarregar. As seções se registram com registrar().
  const SECOES = {
    dashboard: 'Dashboard',
    times: 'Seleções',
    jogadores: 'Jogadores',
    jogos: 'Jogos',
    dados: 'Dados',
  };
  const inicializadores = {};

  function registrar(id, init) {
    inicializadores[id] = init;
  }

  function secaoAtual() {
    const id = window.location.hash.slice(1);
    return SECOES[id] ? id : 'dashboard';
  }

  function guardarAutenticacao() {
    if (DB.Auth.isLogged()) return true;
    window.location.replace('login.html');
    return false;
  }

  function montarSidebar() {
    const mount = document.getElementById('sidebar-mount');
    if (!mount) return;
    mount.innerHTML = `
      <div class="sidebar">
        <div class="sidebar-logo"><span class="dot"></span>FUT<span class="accent">STATS</span></div>
        <nav class="sidebar-nav">
          ${Object.entries(SECOES).map(([id, label]) => `<a class="sidebar-link" data-secao="${id}" href="#${id}">${label}</a>`).join('')}
        </nav>
        <div class="sidebar-footer">
          <a class="btn btn-ghost" style="width:100%;justify-content:center;" href="index.html" target="_blank" rel="noopener">Ver site</a>
          <a class="btn btn-ghost" style="width:100%;justify-content:center;" id="btn-sair">Sair</a>
        </div>
      </div>`;
    document.getElementById('btn-sair').addEventListener('click', async () => {
      DB.Auth.logout();
      if (typeof Nuvem !== 'undefined' && Nuvem.ativa) await Nuvem.sair().catch(() => null);
      window.location.href = 'login.html';
    });
  }

  function montarTopbar() {
    const mount = document.getElementById('topbar-mount');
    if (!mount) return;
    const usuario = DB.Auth.usuarioAtual() || 'admin';
    mount.innerHTML = `
      <div class="admin-topbar">
        <div class="admin-topbar-left">
          <button type="button" class="sidebar-toggle-btn" id="sidebar-toggle" aria-label="Abrir ou fechar o menu">${UI.icone('menu')}</button>
          <span class="admin-topbar-title" id="admin-titulo"></span>
        </div>
        <div class="admin-topbar-left">
          <label class="admin-comp">Campeonato
            <select class="search-input" id="admin-comp">
              ${[...new Set(DB.Contexto.lista.map(c => c.regiao))].map(r => `<optgroup label="${DB.Util.escapar(r)}">
                ${DB.Contexto.lista.filter(c => c.regiao === r).map(c => `<option value="${c.id}" ${c.id === DB.Contexto.id() ? 'selected' : ''}>${DB.Util.escapar(c.curto)} ${DB.Util.escapar(c.temporada)}</option>`).join('')}
              </optgroup>`).join('')}
            </select>
          </label>
          <div class="admin-user"><span class="avatar"></span>${DB.Util.escapar(usuario)}</div>
        </div>
      </div>`;
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.querySelector('.sidebar')?.classList.toggle('open');
    });
    // Troca o campeonato e redesenha a seção aberta (sem recarregar a página).
    document.getElementById('admin-comp').addEventListener('change', e => {
      DB.Contexto.definir(e.target.value);
      abrirSecao();
    });
  }

  function abrirSecao() {
    const id = secaoAtual();
    fecharModal();
    const conteudo = document.getElementById('admin-content');
    conteudo.replaceChildren(document.getElementById(`tpl-${id}`).content.cloneNode(true));
    UI.hidratarIcones(conteudo);
    document.getElementById('admin-titulo').textContent = `${SECOES[id]} · ${DB.Contexto.get().curto}`;
    document.title = `${SECOES[id]} — Painel Admin FUTSTATS`;
    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.toggle('active', link.dataset.secao === id));
    document.querySelector('.sidebar')?.classList.remove('open');
    window.scrollTo(0, 0);
    if (inicializadores[id]) inicializadores[id]();
  }

  function iniciarPainel() {
    if (!guardarAutenticacao()) return;
    montarSidebar();
    montarTopbar();
    UI.hidratarIcones();
    window.addEventListener('hashchange', abrirSecao);
    abrirSecao();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-content')) iniciarPainel();
  });

  function badge(status, labels) {
    const label = (labels && labels[status]) || status;
    return `<span class="badge badge-${status}">${label}</span>`;
  }

  function fecharModal() {
    const existente = document.getElementById('modal-overlay');
    if (existente) existente.remove();
  }

  function abrirModal({ titulo, corpoHtml, aoSalvar, largo }) {
    fecharModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal${largo ? ' modal-largo' : ''}">
        <div class="modal-header">
          <span class="modal-title">${titulo}</span>
          <button type="button" class="btn-icon" id="modal-fechar" aria-label="Fechar">${UI.icone('fechar')}</button>
        </div>
        <form id="modal-form">
          <div class="modal-body">${corpoHtml}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" id="modal-cancelar">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('modal-fechar').addEventListener('click', fecharModal);
    document.getElementById('modal-cancelar').addEventListener('click', fecharModal);
    // No formulário largo (jogo com lances) um clique fora não descarta o que foi digitado.
    if (!largo) overlay.addEventListener('click', (e) => { if (e.target === overlay) fecharModal(); });
    document.getElementById('modal-form').addEventListener('submit', (e) => {
      e.preventDefault();
      aoSalvar(new FormData(e.target));
    });
  }

  return { registrar, guardarAutenticacao, badge, abrirModal, fecharModal };
})();
