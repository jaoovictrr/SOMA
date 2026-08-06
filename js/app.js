const CAMINHO_DADOS = "./data/movies.json";
const CHAVE_STORAGE = "soma-filmes-v1";

let filmes = [];

async function iniciarAplicativo() {
    try {
        const filmesDoJson = await carregarFilmesDoJson();

        filmes = carregarEstadoLocal(filmesDoJson);

        renderizarBiblioteca();
        ativarInteracoes();
    } catch (erro) {
        console.error("Erro ao iniciar o SOMA Cinema:", erro);
        mostrarErroNaTela();
    }

    // Service Worker temporariamente desativado durante o desenvolvimento.
}

async function carregarFilmesDoJson() {
    const resposta = await fetch(CAMINHO_DADOS);

    if (!resposta.ok) {
        throw new Error(
            `Não foi possível carregar os filmes. Código: ${resposta.status}`
        );
    }

    return resposta.json();
}

function carregarEstadoLocal(filmesDoJson) {
    try {
        const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);

        if (!dadosSalvos) {
            return filmesDoJson;
        }

        const filmesSalvos = JSON.parse(dadosSalvos);

        return filmesDoJson.map((filmeOriginal) => {
            const filmeSalvo = filmesSalvos.find(
                (filme) => filme.id === filmeOriginal.id
            );

            return filmeSalvo
                ? { ...filmeOriginal, ...filmeSalvo }
                : filmeOriginal;
        });
    } catch (erro) {
        console.warn(
            "Não foi possível recuperar os dados locais:",
            erro
        );

        return filmesDoJson;
    }
}

function salvarEstadoLocal() {
    try {
        localStorage.setItem(
            CHAVE_STORAGE,
            JSON.stringify(filmes)
        );
    } catch (erro) {
        console.error(
            "Não foi possível salvar os dados locais:",
            erro
        );
    }
}

function renderizarBiblioteca() {
    const mainContent = document.querySelector("#mainContent");

    if (!mainContent) {
        console.error("O elemento #mainContent não foi encontrado.");
        return;
    }

    mainContent.innerHTML = `
        <section class="biblioteca">
            <div class="biblioteca-cabecalho">
                <div>
                    <span class="biblioteca-legenda">
                        SUA COLEÇÃO
                    </span>

                    <h2>Minha Biblioteca</h2>
                </div>

                <span class="biblioteca-total">
                    ${filmes.length} filmes
                </span>
            </div>

            <div class="lista-filmes">
                ${filmes.map(criarMovieCard).join("")}
            </div>
        </section>
    `;
}

function criarMovieCard(filme) {
    const generos = filme.generos
        .slice(0, 3)
        .join(" • ");

    const classeAssistido = filme.assistido
        ? "ativo"
        : "";

    const classeFavorito = filme.favorito
        ? "ativo"
        : "";

    const textoAssistido = filme.assistido
        ? "Assistido"
        : "Não assistido";

    const ariaAssistido = filme.assistido
        ? `Marcar ${filme.titulo} como não assistido`
        : `Marcar ${filme.titulo} como assistido`;

    const ariaFavorito = filme.favorito
        ? `Remover ${filme.titulo} dos favoritos`
        : `Adicionar ${filme.titulo} aos favoritos`;

    const simboloFavorito = filme.favorito
        ? "♥"
        : "♡";

    return `
        <article
            class="movie-card"
            data-id="${filme.id}"
        >
            <div class="movie-card-poster">
                <img
                    src="${filme.poster}"
                    alt="Pôster do filme ${filme.titulo}"
                    loading="lazy"
                >

                <div class="movie-card-topo">
                    <button
                        class="contador-visualizacoes"
                        type="button"
                        data-action="adicionar-visualizacao"
                        aria-label="Adicionar uma visualização a ${filme.titulo}"
                        title="Clique quando assistir novamente"
                    >
                        <span
                            class="icone-olho"
                            aria-hidden="true"
                        >
                            ◉
                        </span>

                        <span>${filme.vezesAssistido}</span>
                    </button>

                    <button
                        class="botao-assistido ${classeAssistido}"
                        type="button"
                        data-action="alternar-assistido"
                        aria-pressed="${filme.assistido}"
                        aria-label="${ariaAssistido}"
                        title="${textoAssistido}"
                    ></button>
                </div>

                <div class="movie-card-degrade"></div>

                <div class="movie-card-informacoes">
                    <span class="movie-card-ano">
                        ${filme.ano}
                    </span>

                    <h3>${filme.titulo}</h3>

                    <p>${generos}</p>

                    <div class="movie-card-rodape">
                        <div
                            class="movie-card-nota"
                            aria-label="Nota ${filme.nota} de 5"
                        >
                            ${criarEstrelas(filme.nota)}
                        </div>

                        <button
                            class="botao-favorito ${classeFavorito}"
                            type="button"
                            data-action="alternar-favorito"
                            aria-pressed="${filme.favorito}"
                            aria-label="${ariaFavorito}"
                            title="Favorito"
                        >
                            ${simboloFavorito}
                        </button>
                    </div>
                </div>
            </div>
        </article>
    `;
}

function criarEstrelas(nota) {
    let estrelas = "";

    for (let numero = 1; numero <= 5; numero += 1) {
        estrelas += numero <= nota
            ? "★"
            : "☆";
    }

    return estrelas;
}

function ativarInteracoes() {
    const mainContent = document.querySelector("#mainContent");

    if (!mainContent) {
        return;
    }

    mainContent.addEventListener(
        "click",
        tratarCliqueNoCard
    );
}

function tratarCliqueNoCard(evento) {
    const botao = evento.target.closest("[data-action]");

    if (!botao) {
        return;
    }

    const card = botao.closest(".movie-card");

    if (!card) {
        return;
    }

    const filmeId = Number(card.dataset.id);

    const filme = filmes.find(
        (item) => item.id === filmeId
    );

    if (!filme) {
        return;
    }

    const acao = botao.dataset.action;

    if (acao === "alternar-favorito") {
        filme.favorito = !filme.favorito;
    }

    if (acao === "alternar-assistido") {
        filme.assistido = !filme.assistido;

        if (
            filme.assistido &&
            filme.vezesAssistido === 0
        ) {
            filme.vezesAssistido = 1;
        }
    }

    if (acao === "adicionar-visualizacao") {
        filme.vezesAssistido += 1;
        filme.assistido = true;
    }

    salvarEstadoLocal();
    renderizarBiblioteca();
}

function mostrarErroNaTela() {
    const mainContent = document.querySelector("#mainContent");

    if (!mainContent) {
        return;
    }

    mainContent.innerHTML = `
        <p class="mensagem-erro">
            Não foi possível carregar sua biblioteca agora.
        </p>
    `;
}

iniciarAplicativo();

function configurarModalAdicionarFilme() {
    const modal = document.querySelector("#movieModal");
    const botaoAbrir = document.querySelector("#openAddMovieButton");
    const campoTitulo = document.querySelector("#movieTitle");
    const botoesFechar = document.querySelectorAll(
        "[data-close-modal]"
    );

    if (!modal || !botaoAbrir) {
        console.error(
            "Não foi possível encontrar o modal ou o botão de adicionar filme."
        );

        return;
    }

    function abrirModal() {
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");

        document.body.classList.add("modal-open");

        window.setTimeout(() => {
            campoTitulo?.focus();
        }, 220);
    }

    function fecharModal() {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");

        document.body.classList.remove("modal-open");

        botaoAbrir.focus();
    }

    botaoAbrir.addEventListener("click", abrirModal);

    botoesFechar.forEach((botao) => {
        botao.addEventListener("click", fecharModal);
    });

    document.addEventListener("keydown", (evento) => {
        if (
            evento.key === "Escape" &&
            modal.classList.contains("is-open")
        ) {
            fecharModal();
        }
    });
}

configurarModalAdicionarFilme();