document.addEventListener('DOMContentLoaded', () => {
  UI.montarTopbar();
  UI.montarTicker();
  DB.MataMata.sincronizar();

  const esc = DB.Util.escapar;
  const comp = DB.Contexto.get();
  document.getElementById('eyebrow-recordes').textContent = `${comp.curto} ${comp.temporada}`;
  document.getElementById('page-title').textContent = `Recordes · ${comp.curto} ${comp.temporada} — FUTSTATS`;
  const r = DB.Estatisticas.recordes();

  const kpi = (label, valor, nota = '') => `<div class="kpi"><div class="kpi-label">${label}</div>
    <div class="kpi-value"><span data-contar="${valor}">${valor}</span></div>${nota ? `<div class="kpi-note">${nota}</div>` : ''}</div>`;
  document.getElementById('kpis').innerHTML = [
    kpi('Jogos', r.jogos),
    kpi('Gols', r.gols, r.jogos ? `${(r.gols / r.jogos).toFixed(2).replace('.', ',')} por jogo` : ''),
    kpi('Viradas', r.viradas.length),
    kpi('Hat-tricks', r.hatTricks.length),
  ].join('');
  UI.animarNumeros(document.getElementById('kpis'));

  if (!r.jogos) {
    document.getElementById('recordes').innerHTML = UI.vazio('Nenhum jogo encerrado ainda', 'Os recordes aparecem assim que o primeiro placar for lançado no painel.');
    UI.montarFooter();
    return;
  }

  const nomeTime = id => { const t = DB.Times.get(id); return t ? t.nome : '—'; };
  const placar = j => `${esc(nomeTime(j.mandanteId))} <b>${j.golsMandante}–${j.golsVisitante}</b> ${esc(nomeTime(j.visitanteId))}`;
  const quando = j => `${UI.rotuloJogo(j)} · ${DB.Util.formatarData(j.data)}`;
  const idade = i => `${i.anos} anos e ${i.dias} dia${i.dias === 1 ? '' : 's'}`;

  // Linha de ranking: `figura` (bandeira/avatar), título, detalhe e o valor à direita.
  const item = ({ href, figura, titulo, sub, valor, rotulo }, i) => `<li><a class="leader${i === 0 ? ' destaque' : ''}" href="${href}">
    <span class="rank">${i + 1}</span>${figura}
    <span class="info"><span class="nome">${titulo}</span><span class="sub">${sub}</span></span>
    <span class="valor">${valor}${rotulo ? `<small>${rotulo}</small>` : ''}</span></a></li>`;
  const lista = itens => `<ol class="leader-list">${itens.map(item).join('')}</ol>`;

  const doJogo = (j, valor, rotulo, extra = '') => ({
    href: `jogo.html?id=${j.id}`,
    figura: `<span class="rec-bandeiras">${UI.bandeira(DB.Times.get(j.mandanteId), 'sm')}${UI.bandeira(DB.Times.get(j.visitanteId), 'sm')}</span>`,
    titulo: placar(j), sub: `${esc(quando(j))}${extra}`, valor, rotulo,
  });
  const doJogador = (jogador, jogo, valor, rotulo, sub) => {
    const time = DB.Times.get(jogador.timeId);
    const adv = jogo ? (jogo.mandanteId === jogador.timeId ? jogo.visitanteId : jogo.mandanteId) : null;
    return {
      href: `jogador.html?id=${jogador.id}`, figura: UI.avatar(jogador), titulo: esc(jogador.nome),
      sub: sub || `${UI.bandeira(time, 'sm')} ${time ? esc(time.codigo) : ''}${adv ? ` contra ${esc(nomeTime(adv))}` : ''}`, valor, rotulo,
    };
  };
  const doTime = (time, valor, rotulo, sub) => ({
    href: `time.html?id=${time.id}`, figura: UI.bandeira(time), titulo: esc(time.nome), sub, valor, rotulo,
  });

  const cartao = (icone, titulo, corpo, nota = '') => corpo ? `<section class="panel rec-card">
      <div class="panel-header"><span class="panel-title">${UI.icone(icone)} ${titulo}</span></div>
      ${corpo}${nota ? `<div class="award-crit">${nota}</div>` : ''}
    </section>` : '';
  const seVazio = (itens, html) => (itens.length ? html : '');

  const golDe = g => {
    const jogador = DB.Jogadores.get(g.jogadorId);
    const contra = g.tipo === 'contra' ? ' (contra)' : g.tipo === 'penalti' ? ' (pênalti)' : '';
    return jogador
      ? doJogador(jogador, g.jogo, `${esc(g.minuto)}'`, '', `${esc(nomeTime(g.jogo.mandanteId))} ${g.jogo.golsMandante}–${g.jogo.golsVisitante} ${esc(nomeTime(g.jogo.visitanteId))}${contra}`)
      : doJogo(g.jogo, `${esc(g.minuto)}'`, '');
  };
  const sequencia = itens => seVazio(itens, lista(itens.map(s =>
    doTime(s.time, s.valor, 'jogos', s.atual === s.valor ? '<span class="rec-ativa">Sequência em andamento</span>' : `Agora: ${s.atual}`))));

  const blocos = [
    cartao('trofeu', 'Maiores goleadas', seVazio(r.maioresGoleadas, lista(r.maioresGoleadas.map(j =>
      doJogo(j, Math.abs(j.golsMandante - j.golsVisitante), 'de saldo'))))),
    cartao('bola', 'Jogos com mais gols', seVazio(r.maisGols, lista(r.maisGols.map(j =>
      doJogo(j, j.golsMandante + j.golsVisitante, 'gols'))))),
    cartao('estatisticas', 'Mais gols de um time num jogo', seVazio(r.timeMaisGols, lista(r.timeMaisGols.map(a =>
      doTime(DB.Times.get(a.timeId), a.gols, 'gols', `contra ${esc(nomeTime(a.jogo.mandanteId === a.timeId ? a.jogo.visitanteId : a.jogo.mandanteId))} · ${DB.Util.formatarData(a.jogo.data)}`))
      .map((x, i) => ({ ...x, href: `jogo.html?id=${r.timeMaisGols[i].jogo.id}` }))))),
    cartao('raio', 'Gols mais rápidos', seVazio(r.golsMaisRapidos, lista(r.golsMaisRapidos.map(golDe)))),
    cartao('relogio', 'Gols mais tardios', seVazio(r.golsMaisTardios, lista(r.golsMaisTardios.map(golDe)))),
    cartao('estrela-cheia', 'Hat-tricks', seVazio(r.hatTricks, lista(r.hatTricks.map(h =>
      doJogador(h.jogador, h.jogo, h.gols, 'gols')))), 'Três ou mais gols do mesmo jogador numa partida.'),
    cartao('repetir', 'Viradas', seVazio(r.viradas, lista(r.viradas.slice(0, 5).map(v =>
      doJogo(v.jogo, v.atras, v.atras === 1 ? 'gol atrás' : 'gols atrás', ` · virou ${esc(nomeTime(v.vencedorId))}`)))),
      'Jogos vencidos por quem sofreu o primeiro gol, ordenados pela maior desvantagem.'),
    cartao('escudo', 'Maior invencibilidade', sequencia(r.invictos)),
    cartao('check', 'Mais vitórias seguidas', sequencia(r.vitorias)),
    cartao('luva', 'Mais jogos seguidos sem sofrer gol', sequencia(r.semSofrer)),
    cartao('chuteira', 'Mais jogos seguidos marcando', sequencia(r.marcando)),
    cartao('estrela', 'Mais jovens a marcar', seVazio(r.maisJovens, lista(r.maisJovens.map(x =>
      doJogador(x.jogador, x.jogo, x.idade.anos, 'anos', `${idade(x.idade)} · ${esc(nomeTime(x.jogador.timeId))}`))))),
    cartao('relogio', 'Mais velhos a marcar', seVazio(r.maisVelhos, lista(r.maisVelhos.map(x =>
      doJogador(x.jogador, x.jogo, x.idade.anos, 'anos', `${idade(x.idade)} · ${esc(nomeTime(x.jogador.timeId))}`))))),
    cartao('aviso', 'Jogos com mais cartões', seVazio(r.maisCartoes, lista(r.maisCartoes.map(j => {
      const vermelhos = (j.cartoes || []).filter(c => c.tipo !== 'amarelo').length;
      return doJogo(j, (j.cartoes || []).length, 'cartões', vermelhos ? ` · ${vermelhos} vermelho${vermelhos > 1 ? 's' : ''}` : '');
    })))),
  ].filter(Boolean);

  // Curiosidades em números e a divisão dos gols por tempo.
  const c = r.curiosidades;
  const comMinuto = c.primeiroTempo + c.segundoTempo + c.prorrogacao;
  const pct = n => (comMinuto ? Math.round((n * 100) / comMinuto) : 0);
  const fato = (valor, texto) => `<li><b>${valor}</b><span>${texto}</span></li>`;
  const curiosidades = `<section class="panel rec-curiosidades">
    <div class="panel-header"><span class="panel-title">${UI.icone('pergunta')} Curiosidades</span></div>
    ${comMinuto ? `<div class="rec-tempos" role="img" aria-label="Gols por tempo: ${pct(c.primeiroTempo)}% no primeiro, ${pct(c.segundoTempo)}% no segundo${c.prorrogacao ? `, ${pct(c.prorrogacao)}% na prorrogação` : ''}">
      <span style="flex:${c.primeiroTempo}">1º tempo · ${pct(c.primeiroTempo)}%</span>
      <span style="flex:${c.segundoTempo}">2º tempo · ${pct(c.segundoTempo)}%</span>
      ${c.prorrogacao ? `<span style="flex:${c.prorrogacao}">Prorr. · ${pct(c.prorrogacao)}%</span>` : ''}
    </div>` : ''}
    <ul class="rec-fatos">
      ${fato(c.empates, `empate${c.empates === 1 ? '' : 's'}${c.zeroAZero ? `, ${c.zeroAZero} sem gols` : ''}`)}
      ${fato(c.penaltis, `gol${c.penaltis === 1 ? '' : 's'} de pênalti`)}
      ${fato(c.golsContra, `gol${c.golsContra === 1 ? '' : 's'} contra`)}
      ${fato(c.acrescimos, `gol${c.acrescimos === 1 ? '' : 's'} nos acréscimos`)}
      ${fato(c.vermelhos, `expuls${c.vermelhos === 1 ? 'ão' : 'ões'}`)}
      ${c.disputasPenaltis ? fato(c.disputasPenaltis, `decis${c.disputasPenaltis === 1 ? 'ão' : 'ões'} por pênaltis`) : ''}
    </ul>
  </section>`;

  document.getElementById('recordes').innerHTML = `${curiosidades}<div class="rec-grade">${blocos.join('')}</div>`;
  UI.montarFooter();
});
