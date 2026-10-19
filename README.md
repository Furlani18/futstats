# FUTSTATS — Copa do Mundo 2026 e campeonatos de clubes

Site de estatísticas da Copa do Mundo 2026 inspirado no SofaScore: grupos, jogos, chaveamento do mata-mata e classificação calculada automaticamente, com painel administrativo para editar times, jogadores e placares.

**🔗 Demo:** https://furlani18.github.io/futstats/

## Funcionalidades
- **10 campeonatos** com seletor no topo: Copa do Mundo 2026, Brasileirão 2026, Copa do Brasil 2026, Libertadores 2026, Premier League, La Liga, Serie A, Bundesliga, Ligue 1 e Champions League 2026/27
- **159 clubes com elencos reais** (4.519 jogadores, técnico, estádio e cores do uniforme), extraídos da Wikipedia em outubro de 2026 (`js/clubes.js`)
- Formatos próprios: pontos corridos com zonas (Libertadores, Champions, rebaixamento…), fase de liga da Champions, grupos da Libertadores e mata-mata em ida e volta com agregado e pênaltis
- Gerador de rodadas (turno e returno) para as ligas e para os grupos da Libertadores
- **Elencos oficiais** das 48 seleções (26 convocados cada, com número, posição, clube, idade, jogos/gols pela seleção, técnico e capitão)
- Cadastro de jogos com **gols, assistências e cartões** por jogador (minuto, pênalti, gol contra)
- **Estatísticas**: artilharia, assistências, gols + assistências, cartões e números por seleção
- Páginas de partida (lance a lance), seleção (elenco e campanha) e jogador
- Classificação calculada pelos placares, com os critérios de desempate da FIFA e o ranking dos terceiros
- Chaveamento do mata-mata (32avos à final), gerado quando a fase de grupos termina
- Importação opcional do calendário oficial da fase de grupos (datas, horários de Brasília e estádios, sem placares)
- **Escalações e substituições** por jogo: campinho com a formação, minutos jogados e gols por 90 minutos
- **Prêmios**: Chuteira de Ouro, Luva de Ouro, melhor jovem e seleção de cada rodada
- **Simulador** da fase de grupos: palpites para os jogos restantes, com classificação, terceiros e 32avos projetados
- **Busca global** de jogadores, seleções e clubes (Ctrl+K)
- **Imagem para compartilhar** o resultado de cada jogo
- Painel em página única, com **backup/restauração** e geração do `js/dados.js` para publicar os dados aos visitantes

## Acesso de demonstração
Área administrativa → usuário `admin`, senha `futstats2026`.

Os dados ficam salvos no próprio navegador (localStorage). Elencos e calendário: listas oficiais da FIFA, via Wikipedia (`js/elencos.js` e `js/calendario.js`).

## Tecnologias
HTML · CSS · JavaScript puro · localStorage

---
Feito por [Gabriel Furlani](https://furlani18.github.io/)
