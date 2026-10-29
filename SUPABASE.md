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
select id from auth.users where email = 'seu@email.com';
```

3. Abra `login.html`, que agora pede e-mail e senha, e entre com essa conta.

## 6. Primeira carga dos dados

No painel, em **Dados → Banco de dados**, clique em **Enviar tudo para o banco**. Isso envia:

- todos os jogos deste navegador;
- os times e jogadores que você editou. Os elencos originais já vêm nos arquivos do site, então não ocupam o banco.

A partir daí, cada jogo salvo, excluído ou desfeito no painel vai direto para o banco. Se faltar internet, a alteração fica numa fila e é enviada na próxima vez.

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
| `quiz_resultados` | todos | o dono, uma vez por dia (sem refazer) |

**Limite conhecido:** o quiz roda no navegador, então quem souber mexer no código pode registrar um resultado falso no ranking. Para um ranking à prova disso, o quiz teria de ser conferido no servidor (uma Edge Function).
