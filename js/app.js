alert("APP NOVO CARREGADO");

console.log("SOMA CINEMA iniciado com sucesso.");

async function carregarFilmes() {
    try {
        const resposta = await fetch("./data/movies.json");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar o arquivo movies.json.");
        }

        const filmes = await resposta.json();

        console.log("Filmes carregados:", filmes);

        mostrarFilmes(filmes);
    } catch (erro) {
        console.error("Erro ao carregar os filmes:", erro);
    }
}

function mostrarFilmes(filmes) {
    const mainContent = document.querySelector("#mainContent");

    const secaoBiblioteca = document.createElement("section");
    secaoBiblioteca.classList.add("biblioteca");

    const titulo = document.createElement("h2");
    titulo.textContent = "Sua Biblioteca";

    const listaFilmes = document.createElement("div");
    listaFilmes.classList.add("lista-filmes");

    filmes.forEach((filme) => {
        const cardFilme = document.createElement("article");
        cardFilme.classList.add("filme-card");

        cardFilme.innerHTML = `
            <h3>${filme.titulo}</h3>
            <p>Ano: ${filme.ano}</p>
            <p>Gêneros: ${filme.generos.join(", ")}</p>
            <p>Status: ${filme.assistido ? "Assistido" : "Não assistido"}</p>
        `;

        listaFilmes.appendChild(cardFilme);
    });

    secaoBiblioteca.appendChild(titulo);
    secaoBiblioteca.appendChild(listaFilmes);
    mainContent.appendChild(secaoBiblioteca);
}

function registrarServiceWorker() {
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", async () => {
            try {
                const registro = await navigator.serviceWorker.register(
                    "./service-worker.js"
                );

                console.log("Service Worker registrado:", registro.scope);
            } catch (erro) {
                console.error("Erro ao registrar o Service Worker:", erro);
            }
        });
    }
}

carregarFilmes();
registrarServiceWorker();