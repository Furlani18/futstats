// Gera uma imagem 1080×1080 do jogo (placar, autores dos gols) para compartilhar.
// No celular abre o menu de compartilhar (WhatsApp, Instagram…); no computador baixa o PNG.
const Compartilhar = (() => {
  // Bola de futebol com o mesmo desenho do ícone do site (grade 24×24): o emoji ⚽
  // sairia diferente em cada sistema e às vezes nem aparece no canvas.
  function desenharBola(ctx, cx, cy, tamanho, cor) {
    ctx.save();
    ctx.translate(cx - tamanho / 2, cy - tamanho / 2);
    ctx.scale(tamanho / 24, tamanho / 24);
    ctx.strokeStyle = cor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.arc(12, 12, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.stroke(new Path2D('M12 7.5l4.3 3.1-1.6 5H9.3l-1.6-5zM12 7.5V3M16.3 10.6l4.2-1.4M14.7 15.6l2.6 3.6M9.3 15.6l-2.6 3.6M7.7 10.6L3.5 9.2'));
    ctx.restore();
  }

  const L = 1080;
  const DISPLAY = '"Barlow Condensed", "Inter", sans-serif';
  const TEXTO = '"Inter", system-ui, sans-serif';

  function carregarImagem(url) {
    return new Promise(resolve => {
      if (!url) { resolve(null); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  function retanguloArredondado(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function textoAjustado(ctx, texto, x, y, larguraMax, tamanho, fonte, peso = 800) {
    let t = tamanho;
    do {
      ctx.font = `${peso} ${t}px ${fonte}`;
      t -= 2;
    } while (ctx.measureText(texto).width > larguraMax && t > 14);
    ctx.fillText(texto, x, y);
  }

  function autores(jogo, timeId) {
    const porAutor = {};
    [...(jogo.gols || [])]
      .filter(g => g.timeId === timeId)
      .sort((a, b) => DB.Util.minutoNumero(a.minuto) - DB.Util.minutoNumero(b.minuto))
      .forEach(g => {
        const j = DB.Jogadores.get(g.jogadorId);
        const nome = j ? UI.nomeCurto(j.nome) : 'Gol';
        const sufixo = g.tipo === 'penalti' ? ' (p)' : g.tipo === 'contra' ? ' (c)' : '';
        (porAutor[nome] = porAutor[nome] || []).push(`${g.minuto ? `${g.minuto}'` : ''}${sufixo}`.trim());
      });
    return Object.entries(porAutor).map(([nome, mins]) => `${nome} ${mins.filter(Boolean).join(', ')}`.trim());
  }

  async function desenharJogo(jogo) {
    const m = DB.Times.get(jogo.mandanteId), v = DB.Times.get(jogo.visitanteId);
    try { await document.fonts.load(`800 120px "Barlow Condensed"`); } catch (e) { /* segue com a fonte padrão */ }
    // Seleção: bandeira; clube: escudo (versão de 250 px da mesma miniatura).
    const imagemDe = t => (t.tipo === 'clube'
      ? (t.escudo ? t.escudo.replace('/120px-', '/250px-') : null)
      : DB.Util.bandeiraUrl(t.iso, 320));
    const [bandM, bandV] = await Promise.all([carregarImagem(imagemDe(m)), carregarImagem(imagemDe(v))]);

    const canvas = document.createElement('canvas');
    canvas.width = L; canvas.height = L;
    const ctx = canvas.getContext('2d');

    // Fundo
    const fundo = ctx.createLinearGradient(0, 0, 0, L);
    fundo.addColorStop(0, '#0d1220'); fundo.addColorStop(1, '#05070d');
    ctx.fillStyle = fundo; ctx.fillRect(0, 0, L, L);
    const brilho = ctx.createRadialGradient(L * 0.5, -80, 40, L * 0.5, -80, 700);
    brilho.addColorStop(0, 'rgba(244,198,78,.28)'); brilho.addColorStop(1, 'rgba(244,198,78,0)');
    ctx.fillStyle = brilho; ctx.fillRect(0, 0, L, L);
    ctx.fillStyle = 'rgba(255,255,255,.03)';
    ctx.font = `800 620px ${DISPLAY}`; ctx.textAlign = 'right';
    ctx.fillText('26', L + 30, L - 20);

    // Faixa das sedes
    [['#1fa463', 0], ['#2f6bff', 1], ['#e8344a', 2]].forEach(([cor, i]) => { ctx.fillStyle = cor; ctx.fillRect((L / 3) * i, 0, L / 3 + 1, 12); });

    // Cabeçalho
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4c64e';
    ctx.font = `800 30px ${TEXTO}`;
    const comp = DB.Contexto.get();
    ctx.fillText(`${comp.curto} ${comp.temporada}`.toUpperCase(), L / 2, 92);
    ctx.fillStyle = '#8f98ad';
    ctx.font = `700 28px ${TEXTO}`;
    ctx.fillText(`${UI.rotuloJogo(jogo).toUpperCase()} · ${DB.Util.formatarData(jogo.data)}`, L / 2, 140);

    // Bandeiras e nomes
    const desenharLado = (time, img, cx) => {
      if (time.tipo === 'clube') {
        const lado = 190, x = cx - lado / 2, y = 215;
        if (img) {
          const escala = Math.min(lado / img.width, lado / img.height);
          const w = img.width * escala, h = img.height * escala;
          ctx.drawImage(img, cx - w / 2, y + (lado - h) / 2, w, h);
        } else {
          const c = DB.Util.coresTime(time);
          ctx.beginPath(); ctx.arc(cx, y + lado / 2, lado / 2, 0, Math.PI * 2);
          ctx.fillStyle = c.primaria; ctx.fill();
          ctx.lineWidth = 8; ctx.strokeStyle = c.secundaria; ctx.stroke();
          ctx.fillStyle = c.texto; ctx.font = `800 64px ${DISPLAY}`;
          ctx.fillText(time.codigo, cx, y + lado / 2 + 22);
        }
        ctx.fillStyle = '#f1f4fa';
        textoAjustado(ctx, time.nome.toUpperCase(), cx, 460, 330, 54, DISPLAY);
        return;
      }
      const w = 240, h = 160, x = cx - w / 2, y = 230;
      ctx.save();
      retanguloArredondado(ctx, x, y, w, h, 16);
      ctx.clip();
      if (img) ctx.drawImage(img, x, y, w, h);
      else {
        ctx.fillStyle = '#1d2638'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#f1f4fa'; ctx.font = `800 72px ${DISPLAY}`;
        ctx.fillText(time.codigo, cx, y + 106);
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 2;
      retanguloArredondado(ctx, x, y, w, h, 16); ctx.stroke();
      ctx.fillStyle = '#f1f4fa';
      textoAjustado(ctx, time.nome.toUpperCase(), cx, 460, 330, 54, DISPLAY);
    };
    desenharLado(m, bandM, 230);
    desenharLado(v, bandV, L - 230);

    // Placar
    const temPlacar = UI.temPlacar(jogo);
    ctx.fillStyle = temPlacar ? '#f1f4fa' : '#8f98ad';
    ctx.font = `800 ${temPlacar ? 190 : 90}px ${DISPLAY}`;
    ctx.fillText(temPlacar ? `${jogo.golsMandante}-${jogo.golsVisitante}` : 'VS', L / 2, temPlacar ? 380 : 345);
    if (jogo.penaltisMandante != null && jogo.penaltisVisitante != null) {
      ctx.fillStyle = '#8f98ad'; ctx.font = `700 30px ${TEXTO}`;
      ctx.fillText(`pênaltis ${jogo.penaltisMandante}-${jogo.penaltisVisitante}`, L / 2, 430);
    }
    const status = jogo.status === 'ao_vivo' ? 'AO VIVO' : jogo.status === 'encerrado' ? 'FIM DE JOGO' : DB.Util.formatarHora(jogo.data);
    ctx.fillStyle = jogo.status === 'ao_vivo' ? '#ff4d5e' : '#2fd98a';
    ctx.font = `800 26px ${TEXTO}`;
    ctx.fillText(status, L / 2, 480);

    // Autores dos gols
    const listaM = autores(jogo, m.id), listaV = autores(jogo, v.id);
    if (listaM.length || listaV.length) {
      ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.moveTo(120, 540); ctx.lineTo(L - 120, 540); ctx.stroke();
      ctx.font = `600 30px ${TEXTO}`; ctx.fillStyle = '#c9cfdc';
      const max = 7;
      listaM.slice(0, max).forEach((t, i) => { ctx.textAlign = 'right'; textoAjustado(ctx, t, L / 2 - 50, 600 + i * 46, 400, 30, TEXTO, 600); });
      listaV.slice(0, max).forEach((t, i) => { ctx.textAlign = 'left'; textoAjustado(ctx, t, L / 2 + 50, 600 + i * 46, 400, 30, TEXTO, 600); });
      desenharBola(ctx, L / 2, 590, 34, '#c9cfdc');
    } else if (jogo.local) {
      ctx.fillStyle = '#8f98ad'; ctx.font = `600 30px ${TEXTO}`;
      ctx.fillText(jogo.local, L / 2, 600);
    }

    rodape(ctx, L);
    return canvas;
  }

  // Marca do FUTSTATS no pé da imagem (altura total `A`).
  function rodape(ctx, A) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f4c64e';
    retanguloArredondado(ctx, 60, A - 120, 56, 56, 12); ctx.fill();
    desenharBola(ctx, 88, A - 92, 36, '#1a1203');
    ctx.textAlign = 'left'; ctx.font = `800 46px ${DISPLAY}`;
    ctx.fillStyle = '#f1f4fa'; ctx.fillText('FUT', 132, A - 75);
    const larguraFut = ctx.measureText('FUT').width;
    ctx.fillStyle = '#f4c64e'; ctx.fillText('STATS', 132 + larguraFut + 4, A - 75);
    ctx.textAlign = 'right'; ctx.fillStyle = '#5d667b'; ctx.font = `600 24px ${TEXTO}`;
    ctx.fillText('Estatísticas de futebol', L - 60, A - 80);
  }

  // Campinho 1080×1350 (bom para o Instagram): `linhas` do ataque (topo) ao goleiro;
  // cada jogador { nome, numero, timeId, nota, gols } ou null (vaga vazia).
  async function desenharCampo({ eyebrow, titulo, subtitulo, formacao, linhas }) {
    try { await document.fonts.load(`800 120px "Barlow Condensed"`); } catch (e) { /* segue com a fonte padrão */ }
    const A = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = L; canvas.height = A;
    const ctx = canvas.getContext('2d');
    const fundo = ctx.createLinearGradient(0, 0, 0, A);
    fundo.addColorStop(0, '#0d1220'); fundo.addColorStop(1, '#05070d');
    ctx.fillStyle = fundo; ctx.fillRect(0, 0, L, A);
    [['#1fa463', 0], ['#2f6bff', 1], ['#e8344a', 2]].forEach(([cor, i]) => { ctx.fillStyle = cor; ctx.fillRect((L / 3) * i, 0, L / 3 + 1, 12); });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4c64e'; ctx.font = `800 28px ${TEXTO}`;
    ctx.fillText(String(eyebrow || '').toUpperCase(), L / 2, 72);
    ctx.fillStyle = '#f1f4fa';
    textoAjustado(ctx, String(titulo || '').toUpperCase(), L / 2, 140, L - 160, 68, DISPLAY);
    ctx.fillStyle = '#8f98ad'; ctx.font = `700 28px ${TEXTO}`;
    ctx.fillText([subtitulo, formacao].filter(Boolean).join(' · '), L / 2, 186);

    // Gramado com listras, área, meio-campo
    const x0 = 50, y0 = 220, w = L - 100, h = 980;
    ctx.save();
    retanguloArredondado(ctx, x0, y0, w, h, 24); ctx.clip();
    for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#3f7652' : '#48825b'; ctx.fillRect(x0, y0 + (h / 10) * i, w, h / 10 + 1); }
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3;
    ctx.strokeRect(x0 + 20, y0 + 20, w - 40, h - 40);
    ctx.beginPath(); ctx.moveTo(x0 + 20, y0 + h / 2); ctx.lineTo(x0 + w - 20, y0 + h / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(L / 2, y0 + h / 2, 90, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeRect(L / 2 - 200, y0 + h - 20 - 160, 400, 160);
    ctx.strokeRect(L / 2 - 200, y0 + 20, 400, 160);
    ctx.restore();

    const n = linhas.length;
    linhas.forEach((linha, li) => {
      const cy = y0 + 110 + ((h - 220) / Math.max(1, n - 1)) * li;
      linha.forEach((p, i) => {
        const cx = x0 + (w / (linha.length + 1)) * (i + 1);
        const r = 46;
        if (!p) {
          ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
          return;
        }
        const c = DB.Util.coresTime(DB.Times.get(p.timeId));
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = c.primaria; ctx.fill();
        ctx.restore();
        ctx.lineWidth = 6; ctx.strokeStyle = c.secundaria; ctx.beginPath(); ctx.arc(cx, cy, r - 3, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = c.texto; ctx.font = `800 40px ${DISPLAY}`; ctx.textAlign = 'center';
        ctx.fillText(p.numero != null ? String(p.numero) : DB.Util.iniciais(p.nome), cx, cy + 14);
        // Nome com fundo escuro para ler sobre a grama
        ctx.font = `800 25px ${TEXTO}`;
        const nome = UI.nomeCurto(p.nome);
        const larg = Math.min(w / (linha.length + 1) - 8, ctx.measureText(nome).width + 22);
        ctx.fillStyle = 'rgba(5,7,13,.72)';
        retanguloArredondado(ctx, cx - larg / 2, cy + r + 10, larg, 38, 10); ctx.fill();
        ctx.fillStyle = '#f1f4fa';
        textoAjustado(ctx, nome, cx, cy + r + 38, larg - 14, 25, TEXTO);
        if (p.nota != null) {
          const cor = p.nota >= 9 ? '#5b8cff' : p.nota >= 6.5 ? '#2fd98a' : p.nota >= 6 ? '#f4c64e' : '#ff8a3d';
          ctx.fillStyle = cor; retanguloArredondado(ctx, cx + 22, cy - r - 6, 64, 34, 10); ctx.fill();
          ctx.fillStyle = '#0b0f1a'; ctx.font = `800 24px ${TEXTO}`;
          ctx.fillText(p.nota.toFixed(1).replace('.', ','), cx + 54, cy - r + 19);
        }
        if (p.gols) {
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx - r + 4, cy + r - 10, 19, 0, Math.PI * 2); ctx.fill();
          desenharBola(ctx, cx - r + 4, cy + r - 10, 30, '#111111');
          if (p.gols > 1) { ctx.fillStyle = '#ffffff'; ctx.font = `800 22px ${TEXTO}`; ctx.fillText(`${p.gols}`, cx - r - 24, cy + r - 2); }
        }
      });
    });

    rodape(ctx, A);
    return canvas;
  }

  // Compartilha (celular) ou baixa (computador) o PNG.
  async function entregar(canvas, nome, texto) {
    let blob;
    try {
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    } catch (e) {
      blob = null; // imagem "contaminada" (bandeira sem CORS): não deveria acontecer com o flagcdn
    }
    if (!blob) { alert('Não foi possível gerar a imagem neste navegador.'); return; }
    const arquivo = new File([blob], nome, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo], title: texto, text: `${texto}\n${location.href}` });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // usuário cancelou
      }
    }
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement('a'), { href: url, download: nome });
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function jogo(jogoObj) {
    const canvas = await desenharJogo(jogoObj);
    const m = DB.Times.get(jogoObj.mandanteId), v = DB.Times.get(jogoObj.visitanteId);
    const comp = DB.Contexto.get();
    const texto = UI.temPlacar(jogoObj)
      ? `${m.nome} ${jogoObj.golsMandante} x ${jogoObj.golsVisitante} ${v.nome} — ${comp.curto} ${comp.temporada}`
      : `${m.nome} x ${v.nome} — ${comp.curto} ${comp.temporada}`;
    await entregar(canvas, `futstats-${m.codigo}-${v.codigo}.png`.toLowerCase(), texto);
  }

  async function campo(opcoes, nomeArquivo, texto) {
    await entregar(await desenharCampo(opcoes), nomeArquivo, texto);
  }

  return { jogo, desenharJogo, campo, desenharCampo };
})();
