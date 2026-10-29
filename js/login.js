document.addEventListener('DOMContentLoaded', () => {
  if (DB.Auth.isLogged()) {
    window.location.href = 'painel.html';
    return;
  }
  const erro = document.getElementById('erro-login');
  const mostrarErro = texto => { erro.textContent = texto; erro.style.display = 'block'; };
  const nuvem = typeof Nuvem !== 'undefined' && Nuvem.ativa;

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
