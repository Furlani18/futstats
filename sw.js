// Service worker do FUTSTATS: o site abre sem internet e pode ser instalado como app.
// Páginas e dados publicados: rede primeiro (sempre a versão mais nova quando há conexão).
// CSS, scripts e imagens: cache primeiro, atualizado em segundo plano.
// Ao mudar arquivos do site, aumente VERSAO para descartar o cache antigo.
const VERSAO = 'futstats-v4';

const PAGINAS = [
  './', 'index.html', 'partidas.html', 'jogo.html', 'grupos.html', 'chaveamento.html', 'estatisticas.html',
  'recordes.html', 'premios.html', 'simulador.html', 'bolao.html', 'quiz.html', 'meu-time.html',
  'selecoes.html', 'time.html', 'jogador.html', 'comparar.html', 'favoritos.html', 'sedes.html', 'sobre.html',
];
const ARQUIVOS = [
  'css/styles.css', 'favicon.svg', 'manifest.webmanifest', 'icons/icone-192.png',
  'js/carregar-dados.js', 'js/config-nuvem.js', 'js/nuvem.js', 'js/competicoes-clubes.js', 'js/competicoes.js', 'js/dados.js', 'js/db.js', 'js/ui.js',
  'js/elencos.js', 'js/clubes.js', 'js/calendario.js', 'js/main.js', 'js/partidas.js', 'js/jogo.js', 'js/grupos.js',
  'js/chaveamento.js', 'js/estatisticas.js', 'js/recordes.js', 'js/premios.js', 'js/simulador.js', 'js/probabilidades.js',
  'js/bolao.js', 'js/quiz.js', 'js/meu-time.js', 'js/selecoes.js', 'js/time.js', 'js/jogador.js', 'js/comparar.js',
  'js/favoritos.js', 'js/sedes.js', 'js/sobre.js', 'js/compartilhar.js',
];

self.addEventListener('install', evento => {
  // Um arquivo que falhe não impede a instalação (cada um entra no cache por conta própria).
  evento.waitUntil(caches.open(VERSAO).then(cache => Promise.all(
    [...PAGINAS, ...ARQUIVOS].map(url => cache.add(url).catch(() => null)),
  )).then(() => self.skipWaiting()));
});

self.addEventListener('activate', evento => {
  evento.waitUntil(caches.keys()
    .then(chaves => Promise.all(chaves.filter(c => c !== VERSAO).map(c => caches.delete(c))))
    .then(() => self.clients.claim()));
});

const redePrimeiro = async pedido => {
  const cache = await caches.open(VERSAO);
  try {
    const resposta = await fetch(pedido);
    if (resposta.ok) cache.put(pedido, resposta.clone());
    return resposta;
  } catch (e) {
    // Sem internet: a página em cache (ignorando ?id=… e ?c=…, que o script lê sozinho).
    return (await cache.match(pedido)) || (await cache.match(pedido, { ignoreSearch: true }))
      || (pedido.mode === 'navigate' ? cache.match('index.html') : Response.error());
  }
};

const cachePrimeiro = async (evento, pedido) => {
  const cache = await caches.open(VERSAO);
  const guardada = await cache.match(pedido);
  const atualizar = fetch(pedido).then(resposta => {
    if (resposta.ok) cache.put(pedido, resposta.clone());
    return resposta;
  }).catch(() => null);
  if (guardada) { evento.waitUntil(atualizar); return guardada; }
  return (await atualizar) || Response.error();
};

self.addEventListener('fetch', evento => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) {
    // Bandeiras e escudos (flagcdn, Wikimedia): guardados depois da primeira vez.
    if (pedido.destination === 'image') evento.respondWith(cachePrimeiro(evento, pedido));
    return;
  }
  const dinamico = pedido.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/js/dados.js') || url.pathname.endsWith('/js/config-nuvem.js');
  evento.respondWith(dinamico ? redePrimeiro(pedido) : cachePrimeiro(evento, pedido));
});

// Toque no aviso de jogo: abre (ou foca) a página da partida.
self.addEventListener('notificationclick', evento => {
  evento.notification.close();
  const destino = new URL((evento.notification.data && evento.notification.data.url) || 'index.html', self.registration.scope).href;
  evento.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(janelas => {
    const aberta = janelas.find(j => j.url === destino);
    if (aberta) return aberta.focus();
    return self.clients.openWindow(destino);
  }));
});
