# Banco de dados (Supabase)

Com o banco ligado, o FUTSTATS ganha:

- **Painel publicando na hora:** cada jogo salvo no painel aparece para todos os visitantes, inclusive em tempo real para quem está com a página aberta. Não precisa mais gerar o `js/dados.js`.
- **Contas de usuário:** o botão **Entrar**, no topo do site, cria uma conta com e-mail e senha. Favoritos, quiz, Monte seu time e palpites passam a valer em qualquer aparelho.
- **Bolão online:** ranking com todos os participantes, sem trocar links. O palpite fecha sozinho quando o jogo começa, e o palpite dos outros só aparece depois disso.
- **Ranking do quiz:** sequência de acertos, acertos e o resultado de hoje de cada pessoa.

Sem configurar nada, o site continua funcionando como antes, com tudo guardado só no navegador.

## 1. Criar o projeto (grátis)

1. Entre em <https://supabase.com>, crie uma conta e clique em **New project**.
2. Escolha um nome (ex.: `futstats`) e uma senha para o banco (guarde-a). Em região, escolha **South America (São Paulo)**.
3. Espere o projeto ficar pronto, cerca de 2 minutos.
4. Furlani2005@ - Senha para guardar

## 2. Criar as tabelas

1. No menu da esquerda, abra **SQL Editor** e clique em **New query**.
2. Copie todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql), cole e clique em **Run**.
3. Deve aparecer **Success. No rows returned**. Pode rodar de novo sem problema, por exemplo depois de uma atualização do arquivo.

## 3. Ligar o site ao banco

1. Vá em **Project Settings → API**.
2. Copie a **Project URL** e a chave **anon public**.
3. Cole as duas em [`js/config-nuvem.js`](js/config-nuvem.js):

```js
window.FUTSTATS_NUVEM = {
  url: 'https://SEU-PROJETO.supabase.co',
  chave: 'eyJhbGciOi...',   // a chave "anon public"
};
```

4. Faça o commit e o push.

> **Não use a chave `service_role`.** Ela ignora todas as regras de segurança e não pode ir para o site. A chave `anon` é pública por natureza: quem decide o que cada pessoa pode ler e gravar são as regras (RLS) do `schema.sql`.

## 4. Endereço do site e e-mails

Em **Authentication → URL Configuration**:

- **Site URL:** `https://furlani18.github.io/futstats/`
- **Redirect URLs:** acrescente `https://furlani18.github.io/futstats/**` e, para testar no computador, `http://localhost:8765/**`.

É para esses endereços que voltam os links de confirmação de conta e de "Esqueci a senha".

Por padrão, o Supabase pede que a pessoa confirme o e-mail antes de entrar. Para desligar isso, use **Authentication → Providers → Email → Confirm email**.

## 5. Tornar-se administrador

1. Abra o site, clique em **Entrar → Criar conta** e crie a sua conta.
2. No **SQL Editor**, rode a consulta abaixo com o seu e-mail:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'furlanigabriel49@gmail.com';
```

3. Abra `login.html`, que agora pede e-mail e senha, e entre com essa conta.

## 6. Primeira carga dos dados

No painel, em **Dados → Banco de dados**, clique em **Enviar tudo para o banco**. Isso envia:

- todos os jogos deste navegador;
- os times e jogadores que você editou. Os elencos originais já vêm nos arquivos do site, então não ocupam o banco.

A partir daí, cada jogo salvo, excluído ou desfeito no painel vai direto para o banco. Se faltar internet, a alteração fica numa fila e é enviada na próxima vez.

## 7. Entrar com o Google (opcional)

Com isso, o botão **Continuar com o Google** aparece na janela da conta e no login do painel.

1. **Google Cloud:** em <https://console.cloud.google.com>, crie um projeto (ou use um existente).
   - Abra **APIs e serviços → Tela de consentimento OAuth**, escolha **Externo** e preencha o nome do app (FUTSTATS) e o seu e-mail.
   - Em **Credenciais → Criar credenciais → ID do cliente OAuth**, escolha **Aplicativo da Web**.
   - Em **URIs de redirecionamento autorizados**, coloque `https://jlvvkomuwpjsenfmrrat.supabase.co/auth/v1/callback`.
   - Copie o **ID do cliente** e a **Chave secreta do cliente**.
2. **Supabase:** em **Authentication → Providers → Google**, ligue o provedor, cole o ID e a chave secreta e salve. A chave secreta fica só no Supabase, nunca no site.
3. **Site:** em [`js/config-nuvem.js`](js/config-nuvem.js), troque `google: false` por `google: true`. Depois, commit e push.

Quem entra com o Google aparece nos rankings com o nome da conta Google, e dá para trocar na janela da conta. Se a sua conta de administrador usar o mesmo e-mail, o Google também abre o painel.

## Quiz valendo ranking

O jogador de cada dia é sorteado ao acaso pelo painel e fica guardado **só no banco**, na tabela `quiz_desafios`, que visitantes não conseguem ler. Para quem joga logado, funciona assim:

1. O site recebe as dicas uma a uma.
2. Cada palpite é conferido pela função `quiz_tentar`, que grava o resultado no ranking.
3. O navegador só fica sabendo quem era o jogador no fim.

Os desafios das próximas semanas são preparados **sozinhos, uma vez por dia, quando um administrador abre o painel**. Também dá para preparar à mão em **Dados → Preparar quiz**. Se um dia ficar sem desafio, o quiz funciona normalmente, mas sem valer ranking.

Sem conta, o quiz continua funcionando no navegador, só que não entra no ranking.

## Bolão nos campeonatos de clubes

O bolão online só aceita palpites em jogos com data futura. Em **Jogos → Gerar rodadas**, o painel pergunta a data da 1ª rodada. Se a data oficial do campeonato já passou, ele sugere o próximo sábado, para os jogos já nascerem abertos ao bolão. As datas podem ser ajustadas depois, jogo a jogo, em **Editar**.

## Atualizações do `schema.sql`

Quando o arquivo mudar (como na versão com o quiz no servidor), rode-o inteiro de novo no **SQL Editor**. Ele só cria o que falta e recria as regras e funções; os dados não são apagados. O aviso de "operações destrutivas" vem dos `drop policy if exists` e pode ser confirmado.

## Como funciona por dentro

- **Leitura no navegador:** o site continua lendo do `localStorage`, então abre rápido e funciona offline. O `js/nuvem.js` baixa só o que mudou desde a última visita e recebe as mudanças em tempo real.
- **Primeira visita:** depois de baixar os dados, a página recarrega uma vez. Nas visitas seguintes, aparece o aviso **Atualizar** quando chegam dados novos.
- **Dados pessoais ao entrar:** o deste aparelho é juntado com o da conta. Listas de favoritos viram a união das duas; no resto, vale o do aparelho.
- **Quem pode gravar o quê:** fica nas regras do banco.

| Tabela | Quem lê | Quem grava |
| --- | --- | --- |
| `registros` (times, jogadores, jogos) | todos | administradores |
| `perfis` (nome nos rankings) | todos | o dono |
| `dados_usuario` (favoritos, quiz, meu time, bolão) | o dono | o dono |
| `bolao_palpites` | o dono; os outros depois que o jogo começa | o dono, só com o jogo agendado e antes do horário |
| `quiz_resultados` | todos | só a função `quiz_tentar`, depois de conferir a resposta |
| `quiz_desafios` (jogador do dia) | ninguém, além das funções e dos administradores | administradores (o painel) |
| `quiz_tentativas` | o dono | só a função `quiz_tentar` |

**Sobre o quiz:** o jogador do modo valendo ranking é sorteado ao acaso pelo painel e existe só no banco. Ele não pode ser calculado pelo código do site, e o ranking só aceita o que a função `quiz_tentar` conferiu. Por isso, quem joga sem conta tem um jogador diferente, sorteado no próprio navegador. Só os administradores, que leem a tabela, conseguem ver as respostas.
