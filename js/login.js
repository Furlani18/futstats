document.addEventListener('DOMContentLoaded', () => {
  const nuvem = typeof Nuvem !== 'undefined' && Nuvem.ativa;
  if (nuvem && DB.Auth.isLogged() && !DB.Auth.pelaNuvem()) DB.Auth.logout();   // sessão da senha local
  if (DB.Auth.isLogged()) {
    window.location.href = 'painel.html';
    return;
  }
  const erro = document.getElementById('erro-login');
  const mostrarErro = texto => { erro.textContent = texto; erro.style.display = 'block'; };

  // Com o banco de dados ligado, o painel exige uma conta marcada como administradora
  // no Supabase (tabela admins): é ela que dá permissão para gravar para todos.
  if (nuvem) {
    document.querySelector('label[for="usuario"]').textContent = 'E-mail';
    const campo = document.getElementById('usuario');
    campo.type = 'email';
    campo.autocomplete = 'email';
    document.querySelector('.login-hint').innerHTML = 'Entre com a sua conta de <strong>administrador</strong> do banco de dados.';
    document.querySelector('.login-aviso').innerHTML = `<summary>Como funciona este acesso?</summary>
      <p>Os dados do painel ficam no banco de dados (Supabase) e aparecem para todos os visitantes assim que você salva. Só contas cadastradas na tabela <code>admins</code> do banco conseguem gravar; a regra vale no servidor, não só nesta tela.</p>`;
    if (Nuvem.google) {
      document.getElementById('form-login').insertAdjacentHTML('afterbegin', `<button type="button" class="btn btn-ghost login-google" id="btn-google">
        <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6.1C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.2-13.5-10l-7.8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>
        Continuar com o Google</button><div class="login-ou"><span>ou com e-mail</span></div>`);
      document.getElementById('btn-google').addEventListener('click', async () => {
        try { await Nuvem.entrarComGoogle(); } catch (err) { mostrarErro(err.message); }
      });
    }
    // Voltou do Google (ou já tinha entrado no site) com uma conta de administrador: segue para o painel.
    Nuvem.pronta.then(async ok => {
      if (!ok || !Nuvem.usuario) return;
      if (await Nuvem.ehAdmin()) {
        DB.Auth.entrarPelaNuvem(Nuvem.usuario.email || 'admin');
        window.location.href = 'painel.html';
      } else mostrarErro(`Você entrou como ${Nuvem.usuario.email}, que não é administrador.`);
    });
  }

  document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value;
    const botao = e.target.querySelector('[type="submit"]');
    if (nuvem) {
      botao.disabled = true;
      try {
        if (!await Nuvem.pronta) throw new Error('Não foi possível conectar ao banco de dados.');
        await Nuvem.entrar(usuario, senha);
        if (!await Nuvem.ehAdmin()) throw new Error('Esta conta não é de administrador. Peça para ser incluída na tabela admins.');
        DB.Auth.entrarPelaNuvem(usuario);
        window.location.href = 'painel.html';
      } catch (err) {
        mostrarErro(err.message);
      } finally { botao.disabled = false; }
      return;
    }
    if (DB.Auth.login(usuario, senha)) {
      window.location.href = 'painel.html';
      return;
    }
    const espera = DB.Auth.esperaRestante();
    mostrarErro(espera ? `Muitas tentativas erradas. Tente de novo em ${espera} s.` : 'Usuário ou senha inválidos.');
  });
});
