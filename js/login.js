document.addEventListener('DOMContentLoaded', () => {
  if (DB.Auth.isLogged()) {
    window.location.href = 'painel.html';
    return;
  }

  document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value;
    const erro = document.getElementById('erro-login');
    if (DB.Auth.login(usuario, senha)) {
      window.location.href = 'painel.html';
      return;
    }
    const espera = DB.Auth.esperaRestante();
    erro.textContent = espera ? `Muitas tentativas erradas. Tente de novo em ${espera} s.` : 'Usuário ou senha inválidos.';
    erro.style.display = 'block';
  });
});
