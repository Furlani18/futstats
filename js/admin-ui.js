const AdminUI = (() => {
  function paginaAtual() {
    return window.location.pathname.split('/').pop() || 'dashboard.html';
  }

  function guardarAutenticacao() {
    if (!DB.Auth.isLogged()) window.location.href = 'login.html';
  }

  const LINKS = [
    { href: 'dashboard.html', label: 'Dashboard' },
    { href: 'times.html', label: 'Seleções' },
    { href: 'jogadores.html', label: 'Jogadores' },
    { href: 'jogos.html', label: 'Jogos' },
  ];

  const TITULOS = {
    'dashboard.html': 'Dashboard',
    'times.html': 'Seleções',
    'jogadores.html': 'Jogadores',
    'jogos.html': 'Jogos',
  };

  function montarSidebar() {
    const mount = document.getElementById('sidebar-mount');
    if (!mount) return;
    const atual = paginaAtual();
    mount.innerHTML = `
      <div class="sidebar">
        <div class="sidebar-logo"><span class="dot"></span>FUT<span class="accent">STATS</span></div>
        <nav class="sidebar-nav">
          ${LINKS.map(l => `<a class="sidebar-link${l.href === atual ? ' active' : ''}" href="${l.href}">${l.label}</a>`).join('')}
        </nav>
        <div class="sidebar-footer">
          <a class="btn btn-ghost" style="width:100%;justify-content:center;" href="index.html" target="_blank" rel="noopener">Ver site</a>
          <a class="btn btn-ghost" style="width:100%;justify-content:center;" id="btn-sair">Sair</a>
        </div>
      </div>`;
    document.getElementById('btn-sair').addEventListener('click', () => {
      DB.Auth.logout();
      window.location.href = 'login.html';
    });
  }

  function montarTopbar() {
    const mount = document.getElementById('topbar-mount');
    if (!mount) return;
    const atual = paginaAtual();
    const usuario = DB.Auth.usuarioAtual() || 'admin';
    mount.innerHTML = `
      <div class="admin-topbar">
        <div class="admin-topbar-left">
          <button type="button" class="sidebar-toggle-btn" id="sidebar-toggle">☰</button>
          <span class="admin-topbar-title">${TITULOS[atual] || ''}</span>
        </div>
        <div class="admin-user"><span class="avatar"></span>${usuario}</div>
      </div>`;
    const botaoToggle = document.getElementById('sidebar-toggle');
    if (botaoToggle) {
      botaoToggle.addEventListener('click', () => {
        document.querySelector('.sidebar')?.classList.toggle('open');
      });
    }
  }

  function badge(status, labels) {
    const label = (labels && labels[status]) || status;
    return `<span class="badge badge-${status}">${label}</span>`;
  }

  function fecharModal() {
    const existente = document.getElementById('modal-overlay');
    if (existente) existente.remove();
  }

  function abrirModal({ titulo, corpoHtml, aoSalvar }) {
    fecharModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">${titulo}</span>
          <button type="button" class="btn-icon" id="modal-fechar">✕</button>
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
    overlay.addEventListener('click', (e) => { if (e.target === overlay) fecharModal(); });
    document.getElementById('modal-form').addEventListener('submit', (e) => {
      e.preventDefault();
      aoSalvar(new FormData(e.target));
    });
  }

  return { guardarAutenticacao, montarSidebar, montarTopbar, badge, abrirModal, fecharModal };
})();
