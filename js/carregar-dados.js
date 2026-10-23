// Os elencos (js/elencos.js, ~160 KB) e os clubes (js/clubes.js, ~340 KB) só servem para
// montar a base na primeira visita: depois disso tudo fica no localStorage. Por isso só são
// baixados quando a base ainda não existe neste navegador ou está numa versão antiga.
// A versão precisa ser a mesma de SEED_VERSION em js/db.js.
(function () {
  var VERSAO_BASE = 'multi-2';
  var precisa = true;
  try {
    precisa = localStorage.getItem('fs_seed_version') !== VERSAO_BASE
      || !localStorage.getItem('fs_times') || !localStorage.getItem('fs_jogadores');
  } catch (e) { /* sem armazenamento: carrega sempre */ }
  // document.write mantém a ordem síncrona dos scripts (o db.js logo abaixo depende deles).
  if (precisa) document.write('<script src="js/elencos.js"><\/script><script src="js/clubes.js"><\/script>');
})();
