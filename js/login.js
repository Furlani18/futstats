document.addEventListener('DOMContentLoaded', () => {
  if (DB.Auth.isLogged()) {
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value;
    const erro = document.getElementById('erro-login');
    if (DB.Auth.login(usuario, senha)) {
      window.location.href = 'dashboard.html';
    } else {
      erro.style.display = 'block';
    }
  });
});
