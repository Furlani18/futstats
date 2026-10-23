// Página "Sobre o projeto": conteúdo fixo no HTML, só os números vêm da base.
document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  document.getElementById('sobre-jogadores').textContent = DB.Jogadores.todos().length.toLocaleString('pt-BR');
  UI.montarFooter();
});
