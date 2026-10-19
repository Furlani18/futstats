AdminUI.registrar('dados', () => {
  const status = document.getElementById('dados-status');

  function avisar(texto, tipo) {
    status.textContent = texto;
    status.className = `dados-status ${tipo || ''}`;
  }

  function baixar(nome, conteudo, tipo) {
    const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    const link = Object.assign(document.createElement('a'), { href: url, download: nome });
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function resumo() {
    const jogos = DB.Jogos.todos();
    const gols = jogos.reduce((n, j) => n + (j.gols || []).length, 0);
    return `${jogos.length} jogos · ${gols} gols com autor · ${DB.Jogadores.todos().length} jogadores (todos os campeonatos)`;
  }

  avisar(`Neste navegador: ${resumo()}.`);

  document.getElementById('btn-exportar').addEventListener('click', () => {
    const data = new Date().toISOString().slice(0, 10);
    baixar(`futstats-backup-${data}.json`, JSON.stringify(DB.Dados.exportar(), null, 2), 'application/json');
    avisar(`Backup baixado (${resumo()}).`, 'ok');
  });

  document.getElementById('arquivo-backup').addEventListener('change', async (e) => {
    const arquivo = e.target.files[0];
    e.target.value = '';
    if (!arquivo) return;
    try {
      const dados = JSON.parse(await arquivo.text());
      const erro = DB.Dados.validar(dados);
      if (erro) { avisar(erro, 'erro'); return; }
      if (!confirm(`Substituir tudo o que está cadastrado neste navegador pelo backup "${arquivo.name}" (${dados.jogos.length} jogos)?`)) return;
      DB.Dados.importar(dados);
      DB.MataMata.sincronizar();
      avisar(`Backup restaurado: ${resumo()}.`, 'ok');
    } catch (err) {
      avisar('Não foi possível ler o arquivo — ele precisa ser um backup .json do FUTSTATS.', 'erro');
    }
  });

  document.getElementById('btn-publicar').addEventListener('click', () => {
    baixar('dados.js', DB.Dados.arquivoPublicacao(), 'text/javascript');
    avisar('dados.js gerado. Substitua o arquivo js/dados.js do projeto por ele e faça o commit/push.', 'ok');
  });
});
