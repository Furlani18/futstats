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

  // ---------- Banco de dados ----------
  const nuvem = typeof Nuvem !== 'undefined' && Nuvem.ativa;
  const statusNuvem = document.getElementById('nuvem-status');
  const btnEnviar = document.getElementById('btn-nuvem-enviar');
  const btnBaixar = document.getElementById('btn-nuvem-baixar');
  function pintarNuvem() {
    if (!document.body.contains(statusNuvem)) return;   // a seção foi trocada
    if (!nuvem) {
      statusNuvem.innerHTML = 'Desligado: os dados ficam só neste navegador. Para que o painel publique na hora para todos, siga o <code>SUPABASE.md</code> e preencha o <code>js/config-nuvem.js</code>.';
      return;
    }
    const e = Nuvem.estado();
    btnEnviar.hidden = btnBaixar.hidden = !e.conectada;
    btnEnviar.disabled = !e.admin;
    if (!e.conectada) { statusNuvem.textContent = 'Conectando ao banco de dados…'; return; }
    statusNuvem.innerHTML = e.admin
      ? `Ligado como <b>${DB.Util.escapar(e.usuario.email)}</b> (administrador). Cada jogo salvo aqui vai na hora para todos os visitantes.${e.pendentes ? ` <b>${e.pendentes}</b> alteraç${e.pendentes === 1 ? 'ão esperando' : 'ões esperando'} envio.` : ' Tudo enviado.'}
        Use <b>Enviar tudo</b> na primeira vez (ou depois de restaurar um backup).`
      : `Ligado, mas sem conta de administrador nesta sessão: as alterações ficam <b>só neste navegador</b>${e.pendentes ? ` (${e.pendentes} esperando)` : ''}. Saia e entre de novo com a conta de administrador.`;
  }
  pintarNuvem();
  if (nuvem) {
    Nuvem.aoMudar(pintarNuvem);
    Nuvem.pronta.then(pintarNuvem);
    btnEnviar.addEventListener('click', async () => {
      if (!confirm('Enviar para o banco todos os jogos deste navegador e os times/jogadores editados? O que já estiver no banco com o mesmo id será substituído.')) return;
      btnEnviar.disabled = true;
      try {
        const total = await Nuvem.enviarTudo(texto => avisar(texto));
        avisar(`${total} itens enviados para o banco de dados.`, 'ok');
      } catch (err) { avisar(`Falha ao enviar: ${err.message}`, 'erro'); } finally { pintarNuvem(); }
    });
    btnBaixar.addEventListener('click', async () => {
      btnBaixar.disabled = true;
      try {
        const { mudou } = await Nuvem.baixar();
        if (mudou) DB.MataMata.sincronizar();
        avisar(mudou ? `${mudou} itens atualizados a partir do banco.` : 'Este navegador já está igual ao banco.', 'ok');
      } catch (err) { avisar(`Falha ao baixar: ${err.message}`, 'erro'); } finally { btnBaixar.disabled = false; }
    });
  }

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
