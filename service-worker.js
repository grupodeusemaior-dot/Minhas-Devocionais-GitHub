const CACHE = "minhas-devocionais-v4";
const ARQUIVOS = [
  "./", "./index.html", "./style.css", "./script.js", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png",
  "./imagens/capa-devocionais.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ARQUIVOS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.pathname.includes("/Dados_JSON/DevocionaisJSON/")) {
    event.respondWith(
      caches.open(CACHE).then(async cache => {
        const salvo = await cache.match(event.request);
        if (salvo) return salvo;

        try {
          const resposta = await fetch(event.request);
          if (resposta.ok) await cache.put(event.request, resposta.clone());
          return resposta;
        } catch (erro) {
          return new Response(
            "Este texto ainda não foi armazenado neste aparelho. Conecte-se à internet para abri-lo pela primeira vez.",
            { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
          );
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(salvo => salvo || fetch(event.request))
  );
});
