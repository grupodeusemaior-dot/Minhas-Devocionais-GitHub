const TOTAL_ARQUIVOS = 28;
const PASTA_DADOS = "Dados_JSON/DevocionaisJSON/";
const inicioDaSequencia = new Date(2026, 10, 2);

let devocionais = [];
let indiceAtual = 0;
let indiceDeHoje = 0;
let tamanhoLetra = 1.35;

const numeroEl = document.getElementById("numero");
const tituloEl = document.getElementById("titulo-devocional");
const referenciaEl = document.getElementById("referencia");
const conteudoEl = document.getElementById("conteudo");
const aviso = document.getElementById("aviso");
const anteriorBtn = document.getElementById("anterior");
const proximaBtn = document.getElementById("proxima");
const hojeBtn = document.getElementById("hoje");

function extrairRegistros(dados) {
  if (Array.isArray(dados)) return dados;
  if (Array.isArray(dados?.textos)) return dados.textos;
  if (Array.isArray(dados?.registros)) return dados.registros;
  return [];
}

function indiceDoDia(total) {
  const hoje = new Date();
  const diaHoje = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const diaInicio = Date.UTC(inicioDaSequencia.getFullYear(), inicioDaSequencia.getMonth(), inicioDaSequencia.getDate());
  const dias = Math.max(0, Math.floor((diaHoje - diaInicio) / 86400000));
  return total ? dias % total : 0;
}

function atualizarNavegacao() {
  anteriorBtn.disabled = indiceAtual <= 0;
  proximaBtn.disabled = indiceAtual >= devocionais.length - 1;
  hojeBtn.hidden = indiceAtual === indiceDeHoje;
}

function mostrarDevocional(indice) {
  const item = devocionais[indice];
  if (!item) return;

  indiceAtual = indice;
  numeroEl.textContent = `DEVOCIONAL Nº ${item.numero ?? indice + 1}`;
  tituloEl.textContent = item.titulo || "Devocional";
  referenciaEl.textContent = item.referencia || item.versiculo || item.inspiracao_biblica || "";

  conteudoEl.replaceChildren();
  const texto = item.conteudo || item.mensagem || item.licao || item.texto || "";
  String(texto).split(/\n\s*\n/).filter(paragrafo => paragrafo.trim()).forEach(paragrafo => {
    const p = document.createElement("p");
    p.textContent = paragrafo.trim();
    conteudoEl.append(p);
  });
  conteudoEl.style.setProperty("--leitura", `${tamanhoLetra}rem`);

  document.getElementById("rotulo-dia").textContent =
    indice === indiceDeHoje ? "Sua leitura de hoje" : "Devocional selecionada";
  atualizarNavegacao();
  aviso.textContent = "";
  window.scrollTo({ top: 0, behavior: "auto" });
}

async function carregarDevocionais() {
  try {
    const pedidos = [];
    for (let i = 0; i < TOTAL_ARQUIVOS; i++) {
      const primeiro = String(i * 20 + 1).padStart(3, "0");
      const ultimo = String(Math.min((i + 1) * 20, 560)).padStart(3, "0");
      const nome = `devocionais_${primeiro}_a_${ultimo}.json`;
      pedidos.push(fetch(PASTA_DADOS + nome).then(resposta => {
        if (!resposta.ok) throw new Error(`Não foi possível abrir ${nome} (${resposta.status}).`);
        return resposta.json();
      }));
    }

    const arquivos = await Promise.all(pedidos);
    devocionais = arquivos.flatMap(extrairRegistros)
      .filter(item => item && item.numero !== undefined)
      .sort((a, b) => Number(a.numero) - Number(b.numero));

    if (!devocionais.length) throw new Error("Nenhuma devocional foi encontrada nos arquivos.");

    indiceDeHoje = indiceDoDia(devocionais.length);
    mostrarDevocional(indiceDeHoje);
    aviso.textContent = `${devocionais.length} devocionais disponíveis.`;
  } catch (erro) {
    tituloEl.textContent = "Não foi possível carregar a devocional.";
    aviso.textContent = `${erro.message} Confira a pasta Dados_JSON/DevocionaisJSON e a conexão com a internet.`;
  }
}

anteriorBtn.addEventListener("click", () => {
  if (indiceAtual > 0) mostrarDevocional(indiceAtual - 1);
});
proximaBtn.addEventListener("click", () => {
  if (indiceAtual < devocionais.length - 1) mostrarDevocional(indiceAtual + 1);
});
hojeBtn.addEventListener("click", () => mostrarDevocional(indiceDeHoje));

document.getElementById("aumentar").addEventListener("click", () => {
  tamanhoLetra = Math.min(2.2, tamanhoLetra + 0.1);
  conteudoEl.style.setProperty("--leitura", `${tamanhoLetra}rem`);
});
document.getElementById("diminuir").addEventListener("click", () => {
  tamanhoLetra = Math.max(1, tamanhoLetra - 0.1);
  conteudoEl.style.setProperty("--leitura", `${tamanhoLetra}rem`);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

carregarDevocionais();
