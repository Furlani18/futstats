document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();
  DB.MataMata.sincronizar();

  const esc = DB.Util.escapar;
  const params = new URLSearchParams(window.location.search);
  const time = DB.Times.get(params.get('id'));

  if (!time) {
    document.getElementById('nome-time').textContent = 'Seleção não encontrada';
    UI.montarFooter();
    return;
  }

  document.getElementById('page-title').textContent = `${time.nome} na Copa 2026 — FUTSTATS`;
  document.getElementById('breadcrumb-nome').textContent = time.nome;
  document.getElementById('nome-time').textContent = time.nome;
  document.getElementById('eyebrow-time').textContent = `${time.codigo} · ${time.confederacao}`;
  document.getElementById('flag-mount').innerHTML = UI.bandeira(time, 'xl');

  const elenco = DB.Jogadores.all().filter(j => j.timeId === time.id);
  const capitao = elenco.find(j => j.capitao);
  const comIdade = elenco.filter(j => j.idade != null);
  const mediaIdade = comIdade.length ? comIdade.reduce((s, j) => s + j.idade, 0) / comIdade.length : null;
  const fato = (rotulo, valor) => (valor ? `<span class="fact">${rotulo} <strong>${esc(valor)}</strong></span>` : '');
  document.getElementById('fatos-time').innerHTML = [
    fato('Grupo', time.grupo),
    fato('Técnico', time.tecnico),
    fato('Capitão', capitao && capitao.nome),
    fato('Ranking FIFA', `#${time.rankingFifa}`),
    fato('Idade média', mediaIdade && mediaIdade.toFixed(1).replace('.', ',')),
  ].join('');

  // ---------- Números na Copa ----------
  const st = DB.Estatisticas.porTime().find(t => t.time.id === time.id);
  const tile = (l, v, classe = '') => `<div class="stat-tile ${classe}"><div class="v">${v}</div><div class="l">${l}</div></div>`;
  document.getElementById('tiles-time').innerHTML = [
    tile('Jogos', st.J), tile('Vitórias', st.V), tile('Empates', st.E), tile('Derrotas', st.D),
    tile('Gols marcados', st.GP, 'gold'), tile('Gols sofridos', st.GC), tile('Sem sofrer gol', st.semSofrer),
    tile('Cartões', `${st.CA}<span style="font-size:16px;color:var(--text-dim)"> 🟨 ${st.CV} 🟥</span>`),
  ].join('');

  // ---------- Elenco por posição ----------
  const stats = Object.fromEntries(DB.Estatisticas.porJogador().map(l => [l.jogador.id, l]));
  const POSICOES = ['Goleiro', 'Defensor', 'Meio-campo', 'Atacante'];
  const ROTULOS = { Goleiro: 'Goleiros', Defensor: 'Defensores', 'Meio-campo': 'Meio-campistas', Atacante: 'Atacantes' };
  const outras = [...new Set(elenco.map(j => j.posicao))].filter(p => !POSICOES.includes(p));
  const celula = (v, destaque) => `<span class="c${v ? (destaque ? ' hl' : '') : ' zero'}">${v || 0}</span>`;
  document.getElementById('qtd-elenco').textContent = elenco.length;
  document.getElementById('elenco').innerHTML = elenco.length ? [...POSICOES, ...outras].map(pos => {
    const doSetor = elenco.filter(j => j.posicao === pos).sort((a, b) => (a.numero ?? 99) - (b.numero ?? 99));
    if (!doSetor.length) return '';
    return `
      <div class="squad-pos">${ROTULOS[pos] || pos}</div>
      <div class="squad-row head"><span>Nº</span><span>Jogador</span><span class="club">Clube</span>
        <span class="c col-extra" title="Jogos pela seleção antes da Copa">Jogos</span><span class="c col-extra" title="Gols pela seleção antes da Copa">Gols sel.</span>
        <span class="c" title="Jogos na Copa">J</span>
        <span class="c" title="Gols na Copa">G</span><span class="c" title="Assistências na Copa">A</span></div>
      ${doSetor.map(j => {
        const s = stats[j.id] || {};
        return `<a class="squad-row" href="jogador.html?id=${j.id}">
          <span class="n">${j.numero ?? '–'}</span>
          <span class="player"><span class="nome">${esc(j.nome)}${j.capitao ? '<span class="captain" title="Capitão">C</span>' : ''}</span>
            <span class="sub">${j.idade != null ? `${j.idade} anos` : ''}${j.status && j.status !== 'ativo' ? ` · ${j.status}` : ''}</span></span>
          <span class="club">${UI.bandeiraClube(j.clubePais)}<span>${esc(j.clube || '—')}</span></span>
          <span class="c col-extra">${j.jogosSelecao ?? '–'}</span>
          <span class="c col-extra">${j.golsSelecao ?? '–'}</span>
          ${celula(s.jogos)}${celula(s.gols, true)}${celula(s.assistencias, true)}
        </a>`;
      }).join('')}`;
  }).join('') : UI.vazio('Elenco não cadastrado', '');

  // ---------- Lateral ----------
  document.getElementById('titulo-grupo').textContent = `Grupo ${time.grupo}`;
  document.getElementById('link-grupo').href = `grupos.html#grupo-${time.grupo}`;
  document.getElementById('tabela-grupo').innerHTML = UI.tabelaGrupo(time.grupo, { compacta: true });

  const jogos = DB.Jogos.doTime(time.id);
  document.getElementById('jogos-time').innerHTML = jogos.length
    ? jogos.map(UI.linhaJogoCompacta).join('')
    : UI.vazio('Nenhum jogo cadastrado', '');

  const artilheiros = DB.Estatisticas.porJogador()
    .filter(l => l.jogador.timeId === time.id && (l.gols || l.assistencias))
    .sort((a, b) => b.gols - a.gols || b.assistencias - a.assistencias)
    .slice(0, 6);
  document.getElementById('artilheiros-time').innerHTML = artilheiros.length
    ? `<ol class="leader-list">${artilheiros.map((l, i) => `
      <li><a class="leader" href="jogador.html?id=${l.jogador.id}">
        <span class="rank">${i + 1}</span>${UI.avatar(l.jogador)}
        <span class="info"><span class="nome">${esc(l.jogador.nome)}</span><span class="sub">${l.assistencias} assistência${l.assistencias === 1 ? '' : 's'}</span></span>
        <span class="valor">${l.gols}<small>gols</small></span>
      </a></li>`).join('')}</ol>`
    : UI.vazio('Sem gols cadastrados', '');

  UI.montarFooter();
});
