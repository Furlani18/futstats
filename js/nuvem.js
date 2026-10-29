// Nuvem (Supabase): dados do painel para todos os visitantes, contas de usuário,
// bolão online e ranking do quiz. Sem js/config-nuvem.js preenchido, nada aqui roda
// e o site segue guardando tudo só neste navegador.
//
// Como os dados chegam: o site continua lendo do localStorage (rápido e offline);
// esta camada baixa da nuvem só o que mudou desde a última visita, recebe placares
// em tempo real e sobe para a nuvem as gravações feitas pelo painel.
const Nuvem = (() => {
  const cfg = window.FUTSTATS_NUVEM || {};
  const ativa = !!(cfg.url && cfg.chave);
  const BIBLIOTECA = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
  const COLECAO = { fs_times: 'times', fs_jogadores: 'jogadores', fs_jogos: 'jogos' };
  const CHAVE_DA_COLECAO = { times: 'fs_times', jogadores: 'fs_jogadores', jogos: 'fs_jogos' };
  // Dados pessoais que acompanham a conta em qualquer aparelho.
  const PESSOAIS = ['fs_favoritos', 'fs_favoritos_jogadores', 'fs_quiz', 'fs_meu_time', 'fs_bolao', 'fs_bolao_nome'];
  const TEXTO_PURO = new Set(['fs_bolao_nome']);   // gravados sem JSON no localStorage

  let cliente = null;
  let usuario = null;
  let nomePerfil = '';
  let admin = false;
  let carregando = Promise.resolve();   // carga do perfil do usuário atual
  const ouvintes = [];
  const avisarMudanca = () => ouvintes.forEach(fn => { try { fn(estado()); } catch (e) { /* segue */ } });
  const estado = () => ({ ativa, conectada: !!cliente, usuario, admin, pendentes: fila.size });

  const lerJson = (k, padrao) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? padrao; } catch (e) { return padrao; } };
  const gravarJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } };

  // ---------- Fila de envio do painel (sobrevive a fechar a página) ----------
  const fila = new Map(Object.entries(lerJson('fs_nuvem_fila', {})));
  const guardarFila = () => gravarJson('fs_nuvem_fila', Object.fromEntries(fila));
  let timerEnvio = null;

  if (ativa && typeof DB !== 'undefined') {
    DB.Sincronia.aoGravar((chave, item, removido) => {
      // Só o painel (sessão de administrador) sobe dados; visitantes também recalculam o
      // mata-mata localmente, e isso não deve virar envio.
      if (!COLECAO[chave] || !DB.Auth.isLogged()) return;
      fila.set(`${COLECAO[chave]}|${item.id}`, { colecao: COLECAO[chave], id: item.id, dados: removido ? null : item });
      guardarFila();
      clearTimeout(timerEnvio);
      timerEnvio = setTimeout(enviarFila, 800);
      avisarMudanca();
    });
  }

  async function enviarFila() {
    if (!cliente || !admin || !fila.size) return { enviados: 0 };
    const linhas = [...fila.values()];
    const { error } = await cliente.from('registros').upsert(linhas);
    if (error) { avisarMudanca(); return { erro: error.message }; }
    linhas.forEach(l => { if (fila.get(`${l.colecao}|${l.id}`) === l) fila.delete(`${l.colecao}|${l.id}`); });
    guardarFila();
    avisarMudanca();
    return { enviados: linhas.length };
  }

  // Sobe tudo o que este navegador tem (primeira carga, ou depois de restaurar um backup).
  async function enviarTudo(progresso = () => {}) {
    if (!cliente || !admin) throw new Error('Entre com uma conta de administrador.');
    let total = 0;
    for (const chave of DB.Sincronia.CHAVES) {
      const itens = DB.Sincronia.paraEnviar(chave);
      for (let i = 0; i < itens.length; i += 500) {
        const lote = itens.slice(i, i + 500).map(dados => ({ colecao: COLECAO[chave], id: dados.id, dados }));
        const { error } = await cliente.from('registros').upsert(lote);
        if (error) throw new Error(error.message);
        total += lote.length;
        progresso(`${total} itens enviados…`);
      }
    }
    fila.clear();
    guardarFila();
    avisarMudanca();
    return total;
  }

  // ---------- Baixar o que mudou desde a última visita ----------
  function aplicarLinhas(linhas) {
    const porChave = {};
    let ultima = null;
    linhas.forEach(l => {
      const chave = CHAVE_DA_COLECAO[l.colecao];
      if (!chave) return;
      (porChave[chave] = porChave[chave] || []).push({ id: l.id, dados: l.dados });
      if (!ultima || l.atualizado_em > ultima) ultima = l.atualizado_em;
    });
    const mudou = Object.entries(porChave).reduce((t, [chave, ls]) => t + DB.Sincronia.aplicar(chave, ls), 0);
    if (ultima && ultima > (localStorage.getItem('fs_nuvem_sync') || '')) {
      try { localStorage.setItem('fs_nuvem_sync', ultima); } catch (e) { /* idem */ }
    }
    return mudou;
  }

  async function baixar() {
    const desde = localStorage.getItem('fs_nuvem_sync');
    // Um minuto de folga: uma gravação que terminou um pouco depois do carimbo não se perde.
    const corte = desde ? new Date(new Date(desde).getTime() - 60000).toISOString() : null;
    const linhas = [];
    for (let de = 0; ; de += 1000) {
      let consulta = cliente.from('registros').select('colecao,id,dados,atualizado_em').order('atualizado_em').range(de, de + 999);
      if (corte) consulta = consulta.gt('atualizado_em', corte);
      const { data, error } = await consulta;
      if (error) throw new Error(error.message);
      linhas.push(...data);
      if (data.length < 1000) break;
    }
    return { mudou: aplicarLinhas(linhas), primeira: !desde };
  }

  // ---------- Avisos na tela ----------
  function avisoNaTela(texto, acao) {
    if (typeof document === 'undefined' || !document.body) return;
    document.getElementById('nuvem-aviso')?.remove();
    const caixa = document.createElement('div');
    caixa.id = 'nuvem-aviso';
    caixa.className = 'nuvem-aviso';
    caixa.setAttribute('role', 'status');
    caixa.innerHTML = `<span>${texto}</span>${acao ? `<button type="button" class="btn btn-primary btn-sm">${acao.rotulo}</button>` : ''}<button type="button" class="nuvem-fechar" aria-label="Fechar">×</button>`;
    document.body.appendChild(caixa);
    caixa.querySelector('.nuvem-fechar').addEventListener('click', () => caixa.remove());
    if (acao) caixa.querySelector('.btn').addEventListener('click', acao.fazer);
    else setTimeout(() => caixa.remove(), 5000);
  }
  const ofereceRecarregar = texto => avisoNaTela(texto, { rotulo: 'Atualizar', fazer: () => window.location.reload() });

  // ---------- Dados pessoais (favoritos, quiz, meu time, bolão) ----------
  let gravandoDaNuvem = false;
  const lerPessoal = chave => {
    const bruto = localStorage.getItem(chave);
    if (bruto == null) return null;
    if (TEXTO_PURO.has(chave)) return bruto;
    try { return JSON.parse(bruto); } catch (e) { return null; }
  };
  const gravarPessoal = (chave, valor) => {
    gravandoDaNuvem = true;
    try { localStorage.setItem(chave, TEXTO_PURO.has(chave) ? String(valor) : JSON.stringify(valor)); } catch (e) { /* idem */ }
    gravandoDaNuvem = false;
  };
  // Junta o deste aparelho com o da conta: listas de ids viram a união; objetos juntam as
  // chaves; no resto (placares, escalações), vale o deste aparelho.
  function mesclar(local, remoto) {
    const soTexto = v => Array.isArray(v) && v.every(x => typeof x === 'string');
    if (soTexto(local) && soTexto(remoto)) return [...new Set([...local, ...remoto])];
    if (local && remoto && typeof local === 'object' && typeof remoto === 'object' && !Array.isArray(local) && !Array.isArray(remoto)) {
      const r = { ...remoto };
      Object.entries(local).forEach(([k, v]) => { r[k] = k in remoto ? mesclar(v, remoto[k]) : v; });
      return r;
    }
    return local ?? remoto;
  }

  async function sincronizarPessoais() {
    const { data, error } = await cliente.from('dados_usuario').select('chave,valor');
    if (error) return;
    const remotos = Object.fromEntries(data.map(d => [d.chave, d.valor]));
    const envios = [];
    let mudouAqui = false;
    PESSOAIS.forEach(chave => {
      const local = lerPessoal(chave);
      const remoto = remotos[chave];
      const juntos = remoto === undefined ? local : local == null ? remoto : mesclar(local, remoto);
      if (juntos == null) return;
      if (JSON.stringify(juntos) !== JSON.stringify(local)) { gravarPessoal(chave, juntos); mudouAqui = true; }
      if (JSON.stringify(juntos) !== JSON.stringify(remoto)) envios.push({ user_id: usuario.id, chave, valor: juntos });
    });
    if (envios.length) await cliente.from('dados_usuario').upsert(envios);
    if (mudouAqui) ofereceRecarregar('Trouxemos da sua conta os favoritos, o quiz, o seu time e o bolão.');
  }

  // Cada mudança local nos dados pessoais sobe (agrupada) para a conta.
  const pendentesPessoais = new Set();
  let timerPessoal = null;
  async function enviarPessoais() {
    if (!cliente || !usuario || !pendentesPessoais.size) return;
    const linhas = [...pendentesPessoais].map(chave => ({ user_id: usuario.id, chave, valor: lerPessoal(chave) })).filter(l => l.valor != null);
    pendentesPessoais.clear();
    if (linhas.length) await cliente.from('dados_usuario').upsert(linhas);
  }
  if (ativa && typeof Storage !== 'undefined') {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(chave, valor) {
      original.call(this, chave, valor);
      if (this === window.localStorage && !gravandoDaNuvem && PESSOAIS.includes(chave)) {
        pendentesPessoais.add(chave);
        clearTimeout(timerPessoal);
        timerPessoal = setTimeout(enviarPessoais, 1500);
      }
    };
    window.addEventListener('pagehide', () => { enviarPessoais(); });
  }

  // ---------- Conta ----------
  // Os avisos de login chegam em dobro (evento + getSession): o segundo espera a carga do primeiro.
  async function definirUsuario(novo) {
    const mesmo = (novo && novo.id) === (usuario && usuario.id);
    usuario = novo;
    if (mesmo) { await carregando; avisarMudanca(); return; }
    carregando = carregarUsuario();
    await carregando;
  }
  async function carregarUsuario() {
    admin = false;
    nomePerfil = '';
    if (usuario) {
      const { data } = await cliente.rpc('eh_admin');
      admin = data === true;
      // Perfil com o nome escolhido no cadastro (ou o começo do e-mail).
      const { data: perfil } = await cliente.from('perfis').select('nome').eq('user_id', usuario.id).maybeSingle();
      if (!perfil) {
        const meta = usuario.user_metadata || {};
        const nome = meta.nome || meta.full_name || meta.name || (usuario.email || 'Torcedor').split('@')[0];
        nomePerfil = String(nome).slice(0, 24);
        await cliente.from('perfis').upsert({ user_id: usuario.id, nome: nomePerfil });
      } else nomePerfil = perfil.nome;
      sincronizarPessoais();
      if (admin) enviarFila();
    }
    avisarMudanca();
  }

  const nomeDoUsuario = () => (usuario ? nomePerfil || (usuario.email || '').split('@')[0] : '');

  async function entrar(email, senha) {
    const { data, error } = await cliente.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error(traduzir(error.message));
    await definirUsuario(data.user);
    return data.user;
  }
  async function criarConta(email, senha, nome) {
    const { data, error } = await cliente.auth.signUp({ email, password: senha, options: { data: { nome }, emailRedirectTo: location.href.split('#')[0] } });
    if (error) throw new Error(traduzir(error.message));
    if (data.session) await definirUsuario(data.user);
    return { confirmar: !data.session };
  }
  // Entrar com o Google: o Supabase leva para a tela do Google e volta para esta página.
  async function entrarComGoogle() {
    const { error } = await cliente.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href.split('#')[0] } });
    if (error) throw new Error(traduzir(error.message));
  }
  async function esqueciSenha(email) {
    const { error } = await cliente.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0] });
    if (error) throw new Error(traduzir(error.message));
  }
  async function sair() {
    if (cliente) await cliente.auth.signOut();
    await definirUsuario(null);
  }
  async function mudarNome(nome) {
    const limpo = String(nome || '').trim().slice(0, 24);
    if (!limpo || !usuario) return;
    const { error } = await cliente.from('perfis').upsert({ user_id: usuario.id, nome: limpo });
    if (error) throw new Error(traduzir(error.message));
    nomePerfil = limpo;
    avisarMudanca();
  }
  async function ehAdmin() {
    if (!cliente) return false;
    const { data } = await cliente.rpc('eh_admin');
    return data === true;
  }

  const MENSAGENS = [
    [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
    [/email not confirmed/i, 'Confirme o e-mail pelo link que enviamos antes de entrar.'],
    [/user already registered/i, 'Já existe uma conta com este e-mail. Use "Entrar".'],
    [/password should be at least/i, 'A senha precisa ter pelo menos 6 caracteres.'],
    [/unable to validate email|invalid email/i, 'E-mail inválido.'],
    [/rate limit|too many/i, 'Muitas tentativas. Espere um pouco e tente de novo.'],
    [/row-level security|violates row-level/i, 'Sem permissão para isso (o jogo pode já ter começado).'],
    [/failed to fetch|network/i, 'Sem conexão com o banco de dados.'],
    [/provider is not enabled|unsupported provider/i, 'O login com Google ainda não foi ligado no Supabase (veja o SUPABASE.md).'],
  ];
  const traduzir = msg => (MENSAGENS.find(([re]) => re.test(msg)) || [null, msg])[1];

  // ---------- Bolão online ----------
  async function salvarPalpite(compId, jogoId, gm, gv) {
    if (!cliente || !usuario) return;
    const { error } = gm === '' || gv === '' || gm == null || gv == null
      ? await cliente.from('bolao_palpites').delete().eq('user_id', usuario.id).eq('jogo_id', jogoId)
      : await cliente.from('bolao_palpites').upsert({ user_id: usuario.id, competicao_id: compId, jogo_id: jogoId, gm: Number(gm), gv: Number(gv) });
    if (error) throw new Error(traduzir(error.message));
  }
  // Sobe os palpites deste aparelho para jogos ainda abertos (ao entrar na conta).
  async function enviarPalpites(compId, palpites, abertos) {
    if (!cliente || !usuario) return 0;
    const linhas = Object.entries(palpites).filter(([id, [a, b]]) => abertos.has(id) && a !== '' && b !== '')
      .map(([jogo_id, [gm, gv]]) => ({ user_id: usuario.id, competicao_id: compId, jogo_id, gm: Number(gm), gv: Number(gv) }));
    if (!linhas.length) return 0;
    const { error } = await cliente.from('bolao_palpites').upsert(linhas);
    if (error) throw new Error(traduzir(error.message));
    return linhas.length;
  }
  async function rankingBolao(compId) {
    const { data, error } = await cliente.rpc('ranking_bolao', { p_comp: compId });
    if (error) throw new Error(traduzir(error.message));
    return data;
  }

  // ---------- Quiz (a resposta fica só no banco) ----------
  async function quizEstado(compId, dia) {
    const { data, error } = await cliente.rpc('quiz_estado', { p_comp: compId, p_dia: dia });
    if (error) throw new Error(traduzir(error.message));
    return data;   // null: o dia não tem desafio preparado
  }
  async function quizTentar(compId, dia, jogadorId, atributos) {
    const { data, error } = await cliente.rpc('quiz_tentar', { p_comp: compId, p_dia: dia, p_jogador: jogadorId, p_atributos: atributos });
    if (error) throw new Error(traduzir(error.message));
    return data;
  }
  // Painel: grava os desafios que faltam de hoje até `dias` à frente, em todos os campeonatos.
  // O sorteio é aleatório e fica só no banco: o modo valendo ranking tem um jogador diferente do
  // modo sem conta, que é calculado no próprio navegador.
  async function prepararQuiz(dias = 45) {
    if (!cliente || !admin || typeof Quiz === 'undefined') return 0;
    const inicio = Quiz.somarDias(Quiz.hoje(), -1);
    const { data, error } = await cliente.from('quiz_desafios').select('competicao_id,dia').gte('dia', inicio);
    if (error) throw new Error(traduzir(error.message));
    const prontos = new Set(data.map(d => `${d.competicao_id}|${d.dia}`));
    const original = DB.Contexto.id();
    const linhas = [];
    try {
      DB.Contexto.lista.forEach(c => {
        DB.Contexto.definir(c.id);
        const jogadores = DB.Jogadores.all();
        for (let i = 0; i <= dias + 1; i++) {
          const dia = Quiz.somarDias(inicio, i);
          if (prontos.has(`${c.id}|${dia}`)) continue;
          const linha = Quiz.desafio(jogadores, c.id, dia);
          if (linha) linhas.push(linha);
        }
      });
    } finally { DB.Contexto.definir(original); }
    for (let i = 0; i < linhas.length; i += 500) {
      const { error: e } = await cliente.from('quiz_desafios').upsert(linhas.slice(i, i + 500));
      if (e) throw new Error(traduzir(e.message));
    }
    return linhas.length;
  }
  async function quizPreparadoAte() {
    if (!cliente || !admin) return null;
    const { data } = await cliente.from('quiz_desafios').select('dia').order('dia', { ascending: false }).limit(1);
    return data && data[0] ? data[0].dia : null;
  }
  async function rankingQuiz(compId, dia) {
    const { data, error } = await cliente.rpc('ranking_quiz', { p_comp: compId, p_dia: dia });
    if (error) throw new Error(traduzir(error.message));
    return data;
  }

  // ---------- Início ----------
  function carregarBiblioteca() {
    return new Promise((ok, falha) => {
      if (window.supabase) { ok(); return; }
      const s = document.createElement('script');
      s.src = BIBLIOTECA;
      s.onload = ok;
      s.onerror = falha;
      document.head.appendChild(s);
    });
  }

  const pronta = !ativa ? Promise.resolve(false) : carregarBiblioteca().then(async () => {
    cliente = window.supabase.createClient(cfg.url, cfg.chave, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    cliente.auth.onAuthStateChange((evento, sessao) => {
      if (evento === 'PASSWORD_RECOVERY') setTimeout(pedirNovaSenha, 0);
      definirUsuario(sessao ? sessao.user : null);
    });
    const { data } = await cliente.auth.getSession();
    await definirUsuario(data.session ? data.session.user : null);

    // Dados do painel: o que mudou desde a última visita…
    try {
      const { mudou, primeira } = await baixar();
      if (mudou && primeira && !sessionStorage.getItem('fs_nuvem_recarregou')) {
        sessionStorage.setItem('fs_nuvem_recarregou', '1');
        window.location.reload();
      } else if (mudou) ofereceRecarregar(`${mudou} atualizaç${mudou === 1 ? 'ão chegou' : 'ões chegaram'} (placares, jogos ou elencos).`);
    } catch (e) { /* sem conexão: segue com o que está guardado */ }

    // …e, enquanto a página estiver aberta, os placares em tempo real.
    cliente.channel('registros').on('postgres_changes', { event: '*', schema: 'public', table: 'registros' }, ({ new: linha }) => {
      if (!linha || !linha.id) return;
      if (aplicarLinhas([linha])) {
        const jogo = linha.colecao === 'jogos' && linha.dados;
        const nome = id => ((DB.Times.get(id) || {}).nome || '');
        ofereceRecarregar(jogo ? `Atualização: ${nome(jogo.mandanteId)} ${jogo.golsMandante ?? ''} x ${jogo.golsVisitante ?? ''} ${nome(jogo.visitanteId)}` : 'Chegou uma atualização.');
      }
    }).subscribe();
    if (admin) enviarFila();
    return true;
  }).catch(() => false);

  async function pedirNovaSenha() {
    const nova = window.prompt('Digite a nova senha (mínimo de 6 caracteres):');
    if (!nova) return;
    const { error } = await cliente.auth.updateUser({ password: nova });
    window.alert(error ? traduzir(error.message) : 'Senha alterada.');
  }

  // ---------- Botão e janela da conta (no topo do site) ----------
  // Marca do Google (as quatro cores oficiais, como pedem as regras de uso do botão).
  const LOGO_GOOGLE = '<svg class="ico-google" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6.1C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.2-13.5-10l-7.8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';
  const icone = nome => (window.UI ? UI.icone(nome) : '');
  const esc = t => (typeof DB !== 'undefined' ? DB.Util.escapar(t) : String(t));

  function montarConta() {
    if (!ativa) return;
    const ref = document.getElementById('btn-tema');
    if (!ref || document.getElementById('btn-conta')) return;
    ref.insertAdjacentHTML('beforebegin', '<button type="button" class="conta-btn" id="btn-conta" aria-haspopup="dialog"></button>');
    const botao = document.getElementById('btn-conta');
    const pintar = () => {
      botao.innerHTML = usuario
        ? `<span class="conta-ini">${esc((nomeDoUsuario()[0] || '?').toUpperCase())}</span><span class="conta-txt">${esc(nomeDoUsuario())}</span>`
        : `${icone('usuario')}<span class="conta-txt">Entrar</span>`;
      botao.setAttribute('aria-label', usuario ? `Sua conta: ${nomeDoUsuario()}` : 'Entrar ou criar conta');
    };
    pintar();
    aoMudar(pintar);
    botao.addEventListener('click', () => abrirConta());
  }

  function abrirConta(modo = 'entrar') {
    document.getElementById('conta-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'conta-overlay';
    overlay.className = 'busca-overlay conta-overlay';
    document.body.appendChild(overlay);
    const fechar = () => { overlay.remove(); document.removeEventListener('keydown', esc_); };
    const esc_ = e => { if (e.key === 'Escape') fechar(); };
    document.addEventListener('keydown', esc_);
    overlay.addEventListener('click', e => { if (e.target === overlay) fechar(); });

    const desenhar = () => {
      if (!cliente) {
        overlay.innerHTML = `<div class="busca-box conta-box" role="dialog" aria-modal="true" aria-label="Conta"><p class="conta-msg">Conectando ao banco de dados… Se demorar, verifique a internet.</p></div>`;
        pronta.then(ok => { if (document.body.contains(overlay)) { if (ok) desenhar(); else overlay.querySelector('.conta-msg').textContent = 'Não foi possível conectar ao banco de dados agora.'; } });
        return;
      }
      if (usuario) {
        overlay.innerHTML = `<div class="busca-box conta-box" role="dialog" aria-modal="true" aria-label="Sua conta">
          <div class="conta-topo"><span class="conta-ini grande">${esc((nomeDoUsuario()[0] || '?').toUpperCase())}</span><div><b>${esc(nomeDoUsuario())}</b><small>${esc(usuario.email || '')}</small></div></div>
          <label class="conta-campo">Nome nos rankings<input type="text" id="conta-nome" maxlength="24" value="${esc(nomeDoUsuario())}"></label>
          <button type="button" class="btn btn-ghost" id="conta-salvar-nome">Salvar nome</button>
          <p class="conta-msg">${icone('check')} Favoritos, quiz, seu time e bolão ficam salvos na sua conta e aparecem em qualquer aparelho.</p>
          ${admin ? `<a class="btn btn-ghost" href="painel.html">${icone('prancheta')} Abrir o painel (administrador)</a>` : ''}
          <button type="button" class="btn btn-ghost" id="conta-sair">Sair da conta</button>
          <p class="conta-erro" id="conta-erro" role="alert"></p>
        </div>`;
        overlay.querySelector('#conta-salvar-nome').addEventListener('click', async e => {
          try { await mudarNome(overlay.querySelector('#conta-nome').value); e.target.textContent = 'Salvo!'; } catch (err) { overlay.querySelector('#conta-erro').textContent = err.message; }
        });
        overlay.querySelector('#conta-sair').addEventListener('click', async () => { await sair(); fechar(); });
        return;
      }
      const criando = modo === 'criar';
      overlay.innerHTML = `<form class="busca-box conta-box" role="dialog" aria-modal="true" aria-label="${criando ? 'Criar conta' : 'Entrar'}" id="conta-form">
        <div class="conta-abas" role="tablist">
          <button type="button" role="tab" data-modo="entrar" aria-selected="${!criando}" class="${criando ? '' : 'ativa'}">Entrar</button>
          <button type="button" role="tab" data-modo="criar" aria-selected="${criando}" class="${criando ? 'ativa' : ''}">Criar conta</button>
        </div>
        <p class="conta-msg">Com uma conta, seus favoritos, quiz, time e palpites ficam salvos em qualquer aparelho, e você entra nos rankings do bolão e do quiz.</p>
        ${cfg.google ? `<button type="button" class="btn btn-ghost conta-google" id="conta-google">${LOGO_GOOGLE} Continuar com o Google</button><div class="conta-ou"><span>ou com e-mail</span></div>` : ''}
        ${criando ? '<label class="conta-campo">Nome nos rankings<input type="text" id="conta-nome" maxlength="24" required autocomplete="nickname"></label>' : ''}
        <label class="conta-campo">E-mail<input type="email" id="conta-email" required autocomplete="email"></label>
        <label class="conta-campo">Senha<input type="password" id="conta-senha" required minlength="6" autocomplete="${criando ? 'new-password' : 'current-password'}"></label>
        <button type="submit" class="btn btn-primary">${criando ? 'Criar conta' : 'Entrar'}</button>
        ${criando ? '' : '<button type="button" class="conta-link" id="conta-esqueci">Esqueci a senha</button>'}
        <p class="conta-erro" id="conta-erro" role="alert"></p>
      </form>`;
      overlay.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => { modo = b.dataset.modo; desenhar(); }));
      const erro = t => { overlay.querySelector('#conta-erro').textContent = t; };
      overlay.querySelector('#conta-google')?.addEventListener('click', async () => {
        try { await entrarComGoogle(); } catch (e) { erro(e.message); }
      });
      overlay.querySelector('#conta-esqueci')?.addEventListener('click', async () => {
        const email = overlay.querySelector('#conta-email').value.trim();
        if (!email) { erro('Escreva seu e-mail acima.'); return; }
        try { await esqueciSenha(email); erro('Enviamos um link para criar uma nova senha.'); } catch (e) { erro(e.message); }
      });
      overlay.querySelector('#conta-form').addEventListener('submit', async e => {
        e.preventDefault();
        const enviar = overlay.querySelector('[type="submit"]');
        enviar.disabled = true;
        const email = overlay.querySelector('#conta-email').value.trim(), senha = overlay.querySelector('#conta-senha').value;
        try {
          if (criando) {
            const r = await criarConta(email, senha, overlay.querySelector('#conta-nome').value.trim());
            if (r.confirmar) { erro('Conta criada! Abra o link que enviamos para o seu e-mail para ativar.'); return; }
          } else await entrar(email, senha);
          desenhar();
        } catch (err) { erro(err.message); } finally { enviar.disabled = false; }
      });
      overlay.querySelector(criando ? '#conta-nome' : '#conta-email').focus();
    };
    desenhar();
  }

  function aoMudar(fn) { ouvintes.push(fn); }

  return {
    ativa, pronta, estado, aoMudar, montarConta, abrirConta,
    entrar, sair, ehAdmin, enviarFila, enviarTudo, baixar,
    salvarPalpite, enviarPalpites, rankingBolao, quizEstado, quizTentar, prepararQuiz, quizPreparadoAte, rankingQuiz,
    entrarComGoogle, google: !!cfg.google,
    get usuario() { return usuario; }, get admin() { return admin; }, nomeDoUsuario,
    mesclar,
  };
})();
