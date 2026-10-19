// Campeonatos disponíveis no site. Cada um define o formato, que muda as páginas:
//   copa_mundo  — 12 grupos + chaveamento da Copa 2026 (lógica própria em db.js)
//   liga        — pontos corridos, turno e returno, tabela única com zonas
//   champions   — fase de liga (tabela única, 8 rodadas) + mata-mata ida e volta
//   grupos_mata — fase de grupos + mata-mata ida e volta (Libertadores)
//   mata_mata   — só mata-mata ida e volta (Copa do Brasil a partir das oitavas)
// tema: cor de destaque do campeonato e as 3 cores da faixa do topo.
// Zonas: faixas de posição pintadas na tabela (cor = accent | blue | teal | danger).
const COMPETICOES = [
  {
    id: 'copa2026', tema: { cor: '#f4c64e', faixa: ['#1fa463', '#2f6bff', '#e8344a'] }, tipo: 'copa_mundo', nome: 'Copa do Mundo FIFA 2026', curto: 'Copa do Mundo', temporada: '2026',
    regiao: 'Seleções', icone: '🏆', sede: 'Estados Unidos, México e Canadá', periodo: '11 de junho a 19 de julho de 2026',
    totalJogos: 104,
  },
  {
    id: 'bra2026', tema: { cor: '#22c55e', faixa: ['#009c3b', '#ffdf00', '#1d4ed8'] }, tipo: 'liga', nome: 'Campeonato Brasileiro Série A 2026', curto: 'Brasileirão', temporada: '2026',
    regiao: 'Brasil', iso: 'br', sede: 'Brasil', periodo: 'janeiro a dezembro de 2026', inicio: '2026-01-28',
    desempate: ['P', 'V', 'SG', 'GP'],
    zonas: [
      { de: 1, ate: 4, cor: 'accent', rotulo: 'Libertadores (fase de grupos)' },
      { de: 5, ate: 6, cor: 'blue', rotulo: 'Libertadores (pré)' },
      { de: 7, ate: 12, cor: 'teal', rotulo: 'Sul-Americana' },
      { de: 17, ate: 20, cor: 'danger', rotulo: 'Rebaixamento' },
    ],
  },
  {
    id: 'eng2627', tema: { cor: '#ff2882', faixa: ['#3d195b', '#ff2882', '#04f5ff'] }, tipo: 'liga', nome: 'Premier League 2026/27', curto: 'Premier League', temporada: '2026/27',
    regiao: 'Europa', iso: 'gb-eng', sede: 'Inglaterra', periodo: 'agosto de 2026 a maio de 2027', inicio: '2026-08-22',
    desempate: ['P', 'SG', 'GP'],
    zonas: [
      { de: 1, ate: 4, cor: 'accent', rotulo: 'Champions League' },
      { de: 5, ate: 5, cor: 'blue', rotulo: 'Europa League' },
      { de: 6, ate: 6, cor: 'teal', rotulo: 'Conference League' },
      { de: 18, ate: 20, cor: 'danger', rotulo: 'Rebaixamento' },
    ],
  },
  {
    id: 'esp2627', tema: { cor: '#ff5a36', faixa: ['#e3001b', '#ff7b00', '#ffc400'] }, tipo: 'liga', nome: 'La Liga 2026/27', curto: 'La Liga', temporada: '2026/27',
    regiao: 'Europa', iso: 'es', sede: 'Espanha', periodo: 'agosto de 2026 a maio de 2027', inicio: '2026-08-15',
    desempate: ['P', 'SG', 'GP'],
    zonas: [
      { de: 1, ate: 4, cor: 'accent', rotulo: 'Champions League' },
      { de: 5, ate: 5, cor: 'blue', rotulo: 'Europa League' },
      { de: 6, ate: 6, cor: 'teal', rotulo: 'Conference League' },
      { de: 18, ate: 20, cor: 'danger', rotulo: 'Rebaixamento' },
    ],
  },
  {
    id: 'ita2627', tema: { cor: '#3b9cff', faixa: ['#009246', '#f1f2f1', '#ce2b37'] }, tipo: 'liga', nome: 'Serie A 2026/27', curto: 'Serie A', temporada: '2026/27',
    regiao: 'Europa', iso: 'it', sede: 'Itália', periodo: 'agosto de 2026 a maio de 2027', inicio: '2026-08-22',
    desempate: ['P', 'SG', 'GP'],
    zonas: [
      { de: 1, ate: 4, cor: 'accent', rotulo: 'Champions League' },
      { de: 5, ate: 5, cor: 'blue', rotulo: 'Europa League' },
      { de: 6, ate: 6, cor: 'teal', rotulo: 'Conference League' },
      { de: 18, ate: 20, cor: 'danger', rotulo: 'Rebaixamento' },
    ],
  },
  {
    id: 'ger2627', tema: { cor: '#ff3b3b', faixa: ['#111111', '#dd0000', '#ffce00'] }, tipo: 'liga', nome: 'Bundesliga 2026/27', curto: 'Bundesliga', temporada: '2026/27',
    regiao: 'Europa', iso: 'de', sede: 'Alemanha', periodo: 'agosto de 2026 a maio de 2027', inicio: '2026-08-28',
    desempate: ['P', 'SG', 'GP'],
    zonas: [
      { de: 1, ate: 4, cor: 'accent', rotulo: 'Champions League' },
      { de: 5, ate: 5, cor: 'blue', rotulo: 'Europa League' },
      { de: 6, ate: 6, cor: 'teal', rotulo: 'Conference League' },
      { de: 16, ate: 16, cor: 'blue', rotulo: 'Playoff de rebaixamento' },
      { de: 17, ate: 18, cor: 'danger', rotulo: 'Rebaixamento' },
    ],
  },
  {
    id: 'fra2627', tema: { cor: '#d9ff3c', faixa: ['#0055a4', '#f5f5f5', '#ef4135'] }, tipo: 'liga', nome: 'Ligue 1 2026/27', curto: 'Ligue 1', temporada: '2026/27',
    regiao: 'Europa', iso: 'fr', sede: 'França', periodo: 'agosto de 2026 a maio de 2027', inicio: '2026-08-22',
    desempate: ['P', 'SG', 'GP'],
    zonas: [
      { de: 1, ate: 3, cor: 'accent', rotulo: 'Champions League' },
      { de: 4, ate: 4, cor: 'blue', rotulo: 'Champions (qualificatória)' },
      { de: 5, ate: 5, cor: 'teal', rotulo: 'Europa League' },
      { de: 16, ate: 16, cor: 'blue', rotulo: 'Playoff de rebaixamento' },
      { de: 17, ate: 18, cor: 'danger', rotulo: 'Rebaixamento' },
    ],
  },
  {
    id: 'ucl2627', tema: { cor: '#5b8cff', faixa: ['#0b1c6b', '#5b8cff', '#c7cfdf'] }, tipo: 'champions', nome: 'UEFA Champions League 2026/27', curto: 'Champions League', temporada: '2026/27',
    regiao: 'Europa', icone: '⭐', sede: 'Europa', periodo: 'setembro de 2026 a maio de 2027 · final em Madri', rodadasLiga: 8,
    desempate: ['P', 'SG', 'GP'],
    zonas: [
      { de: 1, ate: 8, cor: 'accent', rotulo: 'Oitavas de final' },
      { de: 9, ate: 24, cor: 'blue', rotulo: 'Playoff' },
      { de: 25, ate: 36, cor: 'danger', rotulo: 'Eliminado' },
    ],
    fases: ['playoff', 'oitavas', 'quartas', 'semi', 'final'],
    jogoUnico: ['final'],
    totalJogos: 189,
  },
  {
    id: 'lib2026', tema: { cor: '#e5b53b', faixa: ['#151515', '#e5b53b', '#8a6a1f'] }, tipo: 'grupos_mata', nome: 'Copa Libertadores 2026', curto: 'Libertadores', temporada: '2026',
    regiao: 'América do Sul', icone: '🏆', sede: 'América do Sul', periodo: 'abril a novembro de 2026',
    zonasGrupo: [
      { de: 1, ate: 2, cor: 'accent', rotulo: 'Oitavas de final' },
      { de: 3, ate: 3, cor: 'blue', rotulo: 'Playoff da Sul-Americana' },
    ],
    fases: ['oitavas', 'quartas', 'semi', 'final'],
    jogoUnico: ['final'],
    totalJogos: 125,
  },
  {
    id: 'cdb2026', tema: { cor: '#38bdf8', faixa: ['#0b2a63', '#38bdf8', '#f5c518'] }, tipo: 'mata_mata', nome: 'Copa do Brasil 2026', curto: 'Copa do Brasil', temporada: '2026',
    regiao: 'Brasil', iso: 'br', sede: 'Brasil', periodo: 'oitavas a final (jul–dez 2026)',
    fases: ['oitavas', 'quartas', 'semi', 'final'],
    jogoUnico: [],
    totalJogos: 30,
  },
];

const FASES_CLUBES = {
  liga: 'Fase de liga', grupos: 'Fase de grupos', playoff: 'Playoff', oitavas: 'Oitavas de final',
  quartas: 'Quartas de final', semi: 'Semifinal', final: 'Final',
};
