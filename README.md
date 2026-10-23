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
- **Probabilidades por Monte Carlo** no simulador: 10 mil simulações (Elo + Poisson) com a chance de cada time passar de fase, chegar à final e ser campeão, ou de terminar em cada zona da tabela nas ligas
- **Gráficos em SVG próprio**: radar do perfil do jogador, notas jogo a jogo, gols por rodada e por minuto, jogo a jogo do time e posição rodada a rodada
- **Comparador de times**: campanha, ataque, defesa, disciplina, confronto direto e evolução na tabela lado a lado (além do comparador de jogadores)
- **Reviver ao vivo**: a partida encerrada é reproduzida minuto a minuto, com relógio, placar animado e os lances aparecendo
- **Bolão sem servidor**: palpites com pontuação (exato 10, saldo 7, resultado 5) e ranking entre amigos montado pelos links compartilhados
- **Mapa das 16 sedes** da Copa 2026, com os jogos de cada estádio
- **Escudos gerados** em SVG com as cores do clube quando não há imagem
- **Favoritos** (times e jogadores) com os próximos jogos de todos os campeonatos e **exportação para a agenda (.ics)**
- Página **Sobre o projeto** com a arquitetura, as decisões técnicas e os desafios
- Painel em página única, com **backup/restauração** e geração do `js/dados.js` para publicar os dados aos visitantes

## Acesso de demonstração
Área administrativa → usuário `admin`, senha `futstats2026`.

O site é estático (sem back-end): o painel edita só os dados do próprio navegador, então a senha é pública e serve apenas para evitar edições por engano. O código guarda o hash SHA-256 da senha (não o texto), pede espera após 5 tentativas erradas e encerra a sessão em 12 horas.

Os dados ficam salvos no próprio navegador (localStorage). Elencos e calendário: listas oficiais da FIFA, via Wikipedia (`js/elencos.js` e `js/calendario.js`).

## Testes
Os critérios de desempate da FIFA, os melhores terceiros e os 32avos, os pontos corridos, o Monte Carlo, o bolão e o login têm testes automatizados, sem dependências (Node 18+):

```
npm test
```

## Desempenho
Os elencos (`js/elencos.js` e `js/clubes.js`, ~500 KB) só são baixados na primeira visita, para montar a base no `localStorage`. Depois, as páginas carregam apenas os arquivos pequenos (`js/carregar-dados.js` decide).

## Tecnologias
HTML · CSS · JavaScript puro · localStorage · SVG · node:test

---
Feito por [Gabriel Furlani](https://furlani18.github.io/)
