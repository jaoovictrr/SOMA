const CAMINHO_DADOS = "./data/movies.json";
const CHAVE_STORAGE = "soma-filmes-v2";

let filmes = [];
let abrirEditorDeFilme = null;
let filmeAguardandoPublicacao = null;

/*
    Esta variável receberá a função responsável por abrir
    o modal preenchido com os dados de um filme.
*/


/* ========================================
   INICIALIZAÇÃO
======================================== */

async function iniciarAplicativo() {
    try {
        const filmesDoJson = await carregarFilmesDoJson();

        filmes = carregarEstadoLocal(filmesDoJson);

        renderizarBiblioteca();
        atualizarContadoresGeneros();
        ativarInteracoes();
        configurarModalAdicionarFilme();
        configurarModalPrivacidade();
    } catch (erro) {
        console.error(
            "Erro ao iniciar o SOMA Cinema:",
            erro
        );

        mostrarErroNaTela();
    }

    /*
        Service Worker temporariamente desativado
        durante o desenvolvimento.
    */
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

/* ========================================
   ARMAZENAMENTO LOCAL
======================================== */

function carregarEstadoLocal(filmesDoJson) {
    try {
        const dadosSalvos = localStorage.getItem(
            CHAVE_STORAGE
        );

        if (!dadosSalvos) {
            return normalizarFilmes(filmesDoJson);
        }

        const filmesSalvos = JSON.parse(dadosSalvos);

        if (!Array.isArray(filmesSalvos)) {
            return normalizarFilmes(filmesDoJson);
        }

        const filmesOriginaisAtualizados =
            filmesDoJson.map((filmeOriginal) => {
                const filmeSalvo = filmesSalvos.find(
                    (filme) =>
                        String(filme.id) ===
                        String(filmeOriginal.id)
                );

                return filmeSalvo
                    ? {
                          ...filmeOriginal,
                          ...filmeSalvo
                      }
                    : filmeOriginal;
            });

        const filmesCriadosPeloUsuario =
            filmesSalvos.filter(
                (filme) =>
                    filme.criadoPeloUsuario === true &&
                    !filmesDoJson.some(
                        (filmeOriginal) =>
                            String(filmeOriginal.id) ===
                            String(filme.id)
                    )
            );

        return normalizarFilmes([
            ...filmesCriadosPeloUsuario,
            ...filmesOriginaisAtualizados
        ]);
    } catch (erro) {
        console.warn(
            "Não foi possível recuperar os dados locais:",
            erro
        );

        return normalizarFilmes(filmesDoJson);
    }
}

function normalizarFilmes(listaDeFilmes) {
    return listaDeFilmes.map((filme) => ({
        id: filme.id ?? criarIdUnico(),

        titulo: String(
            filme.titulo || "Filme sem título"
        ),

        ano: filme.ano ?? "—",

        generos: Array.isArray(filme.generos)
            ? filme.generos
            : ["Coleção pessoal"],

        poster:
            filme.poster ||
            criarPosterPadrao(
                String(
                    filme.titulo ||
                    "Filme sem título"
                )
            ),

        assistido: Boolean(filme.assistido),

        favorito: Boolean(filme.favorito),

        vezesAssistido: Math.max(
            0,
            Number(filme.vezesAssistido) || 0
        ),

        nota: converterNotaParaTresEstrelas(
            filme.nota
        ),

        filmeConforto: Boolean(
            filme.filmeConforto
        ),

        privacidade:
            filme.privacidade || "privado",

        criadoPeloUsuario:
            filme.criadoPeloUsuario === true
    }));
}

function converterNotaParaTresEstrelas(
    notaOriginal
) {
    const nota = Number(notaOriginal) || 0;

    if (nota <= 0) {
        return 0;
    }

    if (nota <= 3) {
        return Math.round(nota);
    }

    /*
        Conversão do sistema antigo de cinco estrelas:

        4 estrelas antigas = 2 estrelas novas
        5 estrelas antigas = 3 estrelas novas
    */

    if (nota === 5) {
        return 3;
    }

    return 2;
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

        throw new Error(
            "O armazenamento do navegador está cheio."
        );
    }
}

function criarMovieCard(filme) {
    const generos =
        Array.isArray(filme.generos) &&
        filme.generos.length > 0
            ? filme.generos
                .slice(0, 3)
                .join(" • ")
            : "Coleção pessoal";

    const nota =
        Math.max(
            0,
            Math.min(
                Number(filme.nota) || 0,
                3
            )
        );

    const estrelas =
        "★".repeat(nota) +
        "☆".repeat(3 - nota);

    const assistido =
        filme.assistido === true;

    const favorito =
        filme.favorito === true;

    const privacidade =
        filme.privacidade === "publico"
            ? "🔓"
            : "🔒";

    return `
        <article
            class="movie-card"
            data-id="${filme.id}"
        >
            <div class="movie-card-poster">

                <img
                    src="${filme.poster}"
                    alt="Pôster de ${filme.titulo}"
                    loading="lazy"
                >

                <button
                    type="button"
                    class="contador-visualizacoes"
                    data-action="incrementar-visualizacoes"
                    aria-label="Adicionar visualização"
                >
                    ◉ ${filme.vezesAssistido || 0}
                </button>

                <button
                    type="button"
                    class="botao-assistido ${
                        assistido
                            ? "ativo"
                            : ""
                    }"
                    data-action="alternar-assistido"
                    aria-label="Alternar assistido"
                >
                </button>

                <button
                    type="button"
                    class="botao-privacidade"
                    data-action="alternar-privacidade"
                    aria-label="Alternar privacidade"
                >
                    ${privacidade}
                </button>

                <button
                    type="button"
                    class="movie-card-edit"
                    data-action="editar-filme"
                    aria-label="Editar filme"
                >
                    ⋯
                </button>

                <div class="movie-card-info">
                    <span class="movie-card-year">
                        ${filme.ano || "—"}
                    </span>

                    <h3>
                        ${filme.titulo}
                    </h3>

                    <p class="movie-card-genres">
                        ${generos}
                    </p>

                    <div class="movie-card-footer">
                        <span class="movie-card-rating">
                            ${estrelas}
                        </span>

                        <button
                            type="button"
                            class="botao-favorito ${
                                favorito
                                    ? "ativo"
                                    : ""
                            }"
                            data-action="alternar-favorito"
                            aria-label="Alternar favorito"
                        >
                            ${
                                favorito
                                    ? "♥"
                                    : "♡"
                            }
                        </button>
                    </div>
                </div>

            </div>
        </article>
    `;
}
/* ========================================
   BIBLIOTECA
======================================== */

function renderizarBiblioteca() {
    const mainContent =
        document.querySelector(
            "#mainContent"
        );

    if (!mainContent) {
        console.error(
            "O elemento #mainContent não foi encontrado."
        );

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
                    ${filmes.length}
                    ${
                        filmes.length === 1
                            ? "filme"
                            : "filmes"
                    }
                </span>
            </div>

            <div class="lista-filmes">
                ${filmes
                    .map(criarMovieCard)
                    .join("")}
            </div>
        </section>
    `;
}


/* ========================================
   BIBLIOTECA FILTRADA
======================================== */

function renderizarBibliotecaFiltrada(
    lista,
    titulo
) {
    const mainContent =
        document.querySelector(
            "#mainContent"
        );

    if (!mainContent) {
        return;
    }

    mainContent.innerHTML = `
        <section class="biblioteca">
            <div class="biblioteca-cabecalho">
                <div>
                    <span class="biblioteca-legenda">
                        EXPLORAR
                    </span>

                    <h2>${titulo}</h2>
                </div>

                <span class="biblioteca-total">
                    ${lista.length}
                    ${
                        lista.length === 1
                            ? "filme"
                            : "filmes"
                    }
                </span>
            </div>

            <div class="lista-filmes">
                ${lista
                    .map(criarMovieCard)
                    .join("")}
            </div>
        </section>
    `;
}


/* ========================================
   CONTADORES DOS GÊNEROS
======================================== */

function atualizarContadoresGeneros() {
    const botoesGenero =
        document.querySelectorAll(
            ".genre-filter[data-genre]"
        );

    botoesGenero.forEach((botao) => {
        const genero =
            botao.dataset.genre;

        const contador =
            botao.querySelector(
                ".genre-count"
            );

        if (!contador) {
            return;
        }

        let quantidade = 0;

        if (genero === "Todos") {
            quantidade =
                filmes.length;
        } else {
            quantidade =
                filmes.filter(
                    (filme) =>
                        Array.isArray(
                            filme.generos
                        ) &&
                        filme.generos.includes(
                            genero
                        )
                ).length;
        }

        contador.textContent =
            quantidade;
    });
}


/* ========================================
   INTERAÇÕES
======================================== */

function ativarInteracoes() {
    const mainContent =
        document.querySelector(
            "#mainContent"
        );

    if (!mainContent) {
        return;
    }

    /*
        Clique dos cards.
        Como usamos delegação de eventos,
        os cards continuam funcionando
        mesmo após nova renderização.
    */
    mainContent.addEventListener(
        "click",
        tratarCliqueNoCard
    );


    /* ========================================
       FILTROS DE GÊNEROS
    ======================================== */

    const botoesFiltro =
        document.querySelectorAll(
            ".genre-filter"
        );

    botoesFiltro.forEach((botao) => {
        botao.addEventListener(
            "click",
            () => {
                const filtroConforto =
                    botao.dataset
                        .filterComfort ===
                    "true";

                const genero =
                    botao.dataset.genre;

                if (filtroConforto) {
                    const filmesConforto =
                        filmes.filter(
                            (filme) =>
                                filme
                                    .filmeConforto ===
                                true
                        );

                    renderizarBibliotecaFiltrada(
                        filmesConforto,
                        "Filmes de conforto"
                    );

                    return;
                }

                if (genero === "Todos") {
                    renderizarBiblioteca();

                    return;
                }

                if (genero) {
                    const filmesDoGenero =
                        filmes.filter(
                            (filme) =>
                                Array.isArray(
                                    filme.generos
                                ) &&
                                filme.generos.includes(
                                    genero
                                )
                        );

                    renderizarBibliotecaFiltrada(
                        filmesDoGenero,
                        genero
                    );
                }
            }
        );
    });


    /* ========================================
       ABRIR / FECHAR PAINEL GÊNEROS
    ======================================== */

    const botaoExplorar =
        document.querySelector(
            "#openGenresButton"
        );

    const painelExplorar =
        document.querySelector(
            "#genresDrawer"
        );

    const botaoFecharExplorar =
        document.querySelector(
            "#closeGenresButton"
        );

    if (
        botaoExplorar &&
        painelExplorar &&
        botaoFecharExplorar
    ) {
        botaoExplorar.addEventListener(
            "click",
            () => {
                const estaAberto =
                    painelExplorar
                        .classList
                        .toggle(
                            "is-open"
                        );

                painelExplorar.setAttribute(
                    "aria-hidden",
                    String(!estaAberto)
                );

                botaoExplorar.setAttribute(
                    "aria-expanded",
                    String(estaAberto)
                );
            }
        );

        botaoFecharExplorar.addEventListener(
            "click",
            () => {
                painelExplorar
                    .classList
                    .remove(
                        "is-open"
                    );

                painelExplorar.setAttribute(
                    "aria-hidden",
                    "true"
                );

                botaoExplorar.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        );
    }
}


/* ========================================
   CLIQUES NOS CARDS
======================================== */

function tratarCliqueNoCard(evento) {
    const botao =
        evento.target.closest(
            "[data-action]"
        );

    if (!botao) {
        return;
    }

    const card =
        botao.closest(
            ".movie-card"
        );

    if (!card) {
        return;
    }

    const filmeId =
        String(
            card.dataset.id
        );

    const filme =
        filmes.find(
            (item) =>
                String(item.id) ===
                filmeId
        );

    if (!filme) {
        return;
    }

    const acao =
        botao.dataset.action;


    /* EDITAR FILME */

    if (
        acao ===
        "editar-filme"
    ) {
        if (
            typeof abrirEditorDeFilme ===
            "function"
        ) {
            abrirEditorDeFilme(
                filme
            );
        }

        return;
    }


    /* PRIVACIDADE */

    if (
        acao ===
        "alternar-privacidade"
    ) {
        if (
            filme.filmeConforto
        ) {
            filme.privacidade =
                "privado";

            salvarEstadoLocal();
            renderizarBiblioteca();

            return;
        }

        filme.privacidade =
            filme.privacidade ===
            "privado"
                ? "publico"
                : "privado";

        salvarEstadoLocal();
        renderizarBiblioteca();

        return;
    }


    /* FAVORITO */

    if (
        acao ===
        "alternar-favorito"
    ) {
        filme.favorito =
            !filme.favorito;

        salvarEstadoLocal();
        renderizarBiblioteca();

        return;
    }


    /* ASSISTIDO */

    if (
        acao ===
        "alternar-assistido"
    ) {
        filme.assistido =
            !filme.assistido;

        if (
            filme.assistido &&
            filme.vezesAssistido === 0
        ) {
            filme.vezesAssistido =
                1;
        }

        salvarEstadoLocal();
        renderizarBiblioteca();

        return;
    }


    /* CONTADOR DE VISUALIZAÇÕES */

    if (
        acao ===
        "incrementar-visualizacoes"
    ) {
        filme.vezesAssistido =
            Math.max(
                0,
                Number(
                    filme.vezesAssistido
                ) || 0
            ) + 1;

        filme.assistido =
            true;

        salvarEstadoLocal();
        renderizarBiblioteca();

        return;
    }
}
/* ========================================
   MODAL — ADICIONAR E EDITAR FILME
======================================== */

function configurarModalAdicionarFilme() {
    const modal = document.querySelector(
        "#movieModal"
    );

    const botaoAbrir = document.querySelector(
        "#openAddMovieButton"
    );

    const formulario = document.querySelector(
        "#addMovieForm"
    );

    const campoId = document.querySelector(
        "#movieId"
    );

    const campoTitulo = document.querySelector(
        "#movieTitle"
    );

    const campoAno = document.querySelector(
        "#movieYear"
    );

    const campoPoster = document.querySelector(
        "#moviePoster"
    );

    const campoVisualizacoes =
        document.querySelector(
            "#movieWatchCount"
        );

    const tituloModal = document.querySelector(
        "#movieModalTitle"
    );

    const legendaModal = document.querySelector(
        ".movie-modal-eyebrow"
    );

    const botaoSalvar = document.querySelector(
        "#saveMovieButton"
    );

    const botoesFechar =
        document.querySelectorAll(
            "[data-close-modal]"
        );

    if (
        !modal ||
        !botaoAbrir ||
        !formulario ||
        !campoId ||
        !campoTitulo ||
        !campoAno ||
        !campoPoster ||
        !campoVisualizacoes ||
        !tituloModal ||
        !legendaModal ||
        !botaoSalvar
    ) {
        console.error(
            "Não foi possível configurar o formulário de filmes."
        );

        return;
    }

    const conteudoOriginalBotao =
        botaoAbrir.innerHTML;

    function mostrarModal() {
        modal.classList.add("is-open");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        window.setTimeout(() => {
            campoTitulo.focus();
        }, 220);
    }

    /*
        Prepara o formulário vazio para adicionar
        um filme completamente novo.
    */
    function prepararNovoFilme() {
        formulario.reset();

        campoId.value = "";
        campoVisualizacoes.value = "0";

        tituloModal.textContent =
            "Adicionar à biblioteca";

        legendaModal.textContent =
            "NOVO FILME";

        botaoSalvar.textContent =
            "Salvar filme";

        restaurarOpcoesPadrao(
            formulario
        );

        mostrarModal();
    }

    /*
        ALTERAÇÃO — preenche o formulário com os
        dados do filme escolhido.
    */
    function prepararEdicao(filme) {
        formulario.reset();

        campoId.value = String(filme.id);

        campoTitulo.value =
            filme.titulo;

        campoAno.value =
            filme.ano === "—"
                ? ""
                : String(filme.ano);

        campoVisualizacoes.value =
            String(
                filme.vezesAssistido || 0
            );

        const opcaoAssistido =
            formulario.querySelector(
                `input[name="assistido"][value="${filme.assistido}"]`
            );

        if (opcaoAssistido) {
            opcaoAssistido.checked = true;
        }

        const nota = Math.max(
            1,
            Math.min(
                Number(filme.nota) || 1,
                3
            )
        );

        const campoConforto =
    formulario.querySelector(
        'input[name="filmeConforto"]'
    );

if (campoConforto) {
    campoConforto.checked =
        filme.filmeConforto === true;
}

const camposGenero =
    formulario.querySelectorAll(
        'input[name="generos"]'
    );

camposGenero.forEach((campo) => {
    campo.checked =
        Array.isArray(filme.generos) &&
        filme.generos.includes(campo.value);
});

        const opcaoNota =
            formulario.querySelector(
                `input[name="nota"][value="${nota}"]`
            );

        if (opcaoNota) {
            opcaoNota.checked = true;
        }

        tituloModal.textContent =
            "Editar filme";

        legendaModal.textContent =
            "SUA COLEÇÃO";

        botaoSalvar.textContent =
            "Salvar alterações";

        mostrarModal();
    }

    function fecharModal() {
        modal.classList.remove("is-open");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );

        botaoAbrir.focus();
    }

    /*
        Essa função identifica se estamos criando
        ou editando por meio do campo movieId.
    */
    async function salvarFilme(evento) {
        evento.preventDefault();

        const dadosFormulario =
            new FormData(formulario);

        const idEmEdicao = String(
            campoId.value || ""
        );

        const titulo = String(
            dadosFormulario.get("titulo") ||
                ""
        ).trim();

        const anoDigitado = String(
            dadosFormulario.get("ano") ||
                ""
        ).trim();

        const assistidoMarcado =
            dadosFormulario.get(
                "assistido"
            ) === "true";

        let vezesAssistido = Math.max(
            0,
            Number(
                dadosFormulario.get(
                    "vezesAssistido"
                )
            ) || 0
        );

        if (
            assistidoMarcado &&
            vezesAssistido === 0
        ) {
            vezesAssistido = 1;
        }

        const assistido =
            assistidoMarcado ||
            vezesAssistido > 0;

        const nota = Math.max(
            1,
            Math.min(
                Number(
                    dadosFormulario.get(
                        "nota"
                    )
                ) || 1,
                3
            )
        );

        const filmeConforto =
    dadosFormulario.get("filmeConforto") !== null;

const generosSelecionados =
    dadosFormulario
        .getAll("generos")
        .filter(Boolean);

        const arquivoPoster =
            campoPoster.files?.[0];

        if (!titulo) {
            campoTitulo.focus();
            return;
        }

        botaoSalvar.disabled = true;
        botaoSalvar.textContent =
            "Salvando...";

        let filmeExistente = null;

        try {
            filmeExistente = idEmEdicao
                ? filmes.find(
                      (filme) =>
                          String(filme.id) ===
                          idEmEdicao
                  )
                : null;

            let poster;

            /*
                Ao editar, se nenhuma imagem nova for
                escolhida, conservamos o pôster atual.
            */
         
                if (arquivoPoster) {
    poster =
        await processarPoster(
            arquivoPoster
        );

} else if (filmeExistente) {
    poster =
        filmeExistente.poster;

} else {
    poster =
        criarPosterPadrao(
            titulo
        );
}

 if (filmeExistente) {
    /*
        Atualiza o filme existente.
    */

    filmeExistente.titulo = titulo;

    filmeExistente.ano =
        anoDigitado || "—";

    filmeExistente.poster =
        poster;

    filmeExistente.assistido =
        assistido;

 filmeExistente.vezesAssistido =
    vezesAssistido;

filmeExistente.nota =
    nota;

filmeExistente.generos =
    generosSelecionados.length > 0
        ? generosSelecionados
        : ["Coleção pessoal"];

filmeExistente.filmeConforto =
    filmeConforto;

if (filmeConforto) {
    filmeExistente.privacidade =
        "privado";
}

} else {
    const novoFilme = {
        id: criarIdUnico(),

        titulo,

        ano:
            anoDigitado || "—",

        generos:
            generosSelecionados.length > 0
                ? generosSelecionados
                : ["Coleção pessoal"],

        poster,

        assistido,

        favorito: false,

        vezesAssistido,

        nota,

        filmeConforto,

        privacidade:
            "privado",

        criadoPeloUsuario:
            true
    };

    filmes.unshift(novoFilme);
}

salvarEstadoLocal();
renderizarBiblioteca();

formulario.reset();
campoId.value = "";

fecharModal();

mostrarConfirmacaoNoBotao
(
    botaoAbrir,
    conteudoOriginalBotao,
    Boolean(filmeExistente)
);
            }


         catch (erro) {
            console.error(
                "Não foi possível salvar o filme:",
                erro
            );

            window.alert(
                "Não foi possível salvar as alterações. Tente novamente."
            );
        } finally {
            botaoSalvar.disabled = false;

            botaoSalvar.textContent =
                idEmEdicao
                    ? "Salvar alterações"
                    : "Salvar filme";
        }
    }

    /*
        Torna a função de edição disponível para
        os botões existentes nos cards.
    */
    abrirEditorDeFilme =
        prepararEdicao;

    botaoAbrir.addEventListener(
        "click",
        prepararNovoFilme
    );

    botoesFechar.forEach((botao) => {
        botao.addEventListener(
            "click",
            fecharModal
        );
    });

    formulario.addEventListener(
        "submit",
        salvarFilme
    );

    document.addEventListener(
        "keydown",
        (evento) => {
            if (
                evento.key === "Escape" &&
                modal.classList.contains(
                    "is-open"
                )
            ) {
                fecharModal();
            }
        }
    );
}

function restaurarOpcoesPadrao(
    formulario
) {
    const opcaoNaoAssistido =
        formulario.querySelector(
            'input[name="assistido"][value="false"]'
        );

    const opcaoTresEstrelas =
        formulario.querySelector(
            'input[name="nota"][value="3"]'
        );

    if (opcaoNaoAssistido) {
        opcaoNaoAssistido.checked = true;
    }

    if (opcaoTresEstrelas) {
        opcaoTresEstrelas.checked = true;
    }
}

function mostrarConfirmacaoNoBotao(
    botao,
    conteudoOriginal,
    foiEdicao = false
) {
    botao.classList.add(
        "filme-adicionado"
    );

    botao.innerHTML = `
        <span aria-hidden="true">
            ✓
        </span>

        ${
            foiEdicao
                ? "Alterações salvas"
                : "Filme adicionado"
        }
    `;

    window.setTimeout(() => {
        botao.classList.remove(
            "filme-adicionado"
        );

        botao.innerHTML =
            conteudoOriginal;
    }, 1600);
}

/* ========================================
   PROCESSAMENTO DO PÔSTER
======================================== */

async function processarPoster(arquivo) {
    if (
        !arquivo.type.startsWith(
            "image/"
        )
    ) {
        throw new Error(
            "O arquivo escolhido não é uma imagem."
        );
    }

    const imagem =
        await carregarImagemLocal(
            arquivo
        );

    const canvas =
        document.createElement("canvas");

    const contexto =
        canvas.getContext("2d");

    if (!contexto) {
        throw new Error(
            "O navegador não conseguiu preparar a imagem."
        );
    }

    const larguraFinal = 600;
    const alturaFinal = 900;

    canvas.width = larguraFinal;
    canvas.height = alturaFinal;

    const proporcaoImagem =
        imagem.naturalWidth /
        imagem.naturalHeight;

    const proporcaoPoster =
        larguraFinal / alturaFinal;

    let larguraCorte;
    let alturaCorte;
    let origemX;
    let origemY;

    if (
        proporcaoImagem >
        proporcaoPoster
    ) {
        alturaCorte =
            imagem.naturalHeight;

        larguraCorte =
            alturaCorte *
            proporcaoPoster;

        origemX =
            (imagem.naturalWidth -
                larguraCorte) /
            2;

        origemY = 0;
    } else {
        larguraCorte =
            imagem.naturalWidth;

        alturaCorte =
            larguraCorte /
            proporcaoPoster;

        origemX = 0;

        origemY =
            (imagem.naturalHeight -
                alturaCorte) /
            2;
    }

    contexto.drawImage(
        imagem,
        origemX,
        origemY,
        larguraCorte,
        alturaCorte,
        0,
        0,
        larguraFinal,
        alturaFinal
    );

    return canvas.toDataURL(
        "image/webp",
        0.72
    );
}

function carregarImagemLocal(arquivo) {
    return new Promise(
        (resolver, rejeitar) => {
            const enderecoTemporario =
                URL.createObjectURL(
                    arquivo
                );

            const imagem =
                new Image();

            imagem.onload = () => {
                URL.revokeObjectURL(
                    enderecoTemporario
                );

                resolver(imagem);
            };

            imagem.onerror = () => {
                URL.revokeObjectURL(
                    enderecoTemporario
                );

                rejeitar(
                    new Error(
                        "Não foi possível abrir a imagem escolhida."
                    )
                );
            };

            imagem.src =
                enderecoTemporario;
        }
    );
}

function criarPosterPadrao(titulo) {
    const tituloSeguro =
        escaparTextoSvg(titulo).slice(
            0,
            32
        );

    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="600"
            height="900"
            viewBox="0 0 600 900"
        >
            <defs>
                <linearGradient
                    id="fundo"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                >
                    <stop
                        offset="0%"
                        stop-color="#161e2a"
                    />

                    <stop
                        offset="100%"
                        stop-color="#070b11"
                    />
                </linearGradient>
            </defs>

            <rect
                width="600"
                height="900"
                fill="url(#fundo)"
            />

            <circle
                cx="300"
                cy="335"
                r="82"
                fill="none"
                stroke="#f5bd43"
                stroke-width="8"
                opacity="0.82"
            />

            <circle
                cx="300"
                cy="335"
                r="18"
                fill="#f5bd43"
            />

            <text
                x="300"
                y="545"
                text-anchor="middle"
                fill="#ffffff"
                font-family="Arial, sans-serif"
                font-size="38"
                font-weight="700"
            >
                ${tituloSeguro}
            </text>

            <text
                x="300"
                y="605"
                text-anchor="middle"
                fill="#8995a5"
                font-family="Arial, sans-serif"
                font-size="22"
            >
                SOMA CINEMA
            </text>
        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        svg
    )}`;
}

function escaparTextoSvg(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

function criarIdUnico() {
    if (
        "crypto" in window &&
        typeof crypto.randomUUID ===
            "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;
}

/* ========================================
   ERRO
======================================== */

function mostrarErroNaTela() {
    const mainContent =
        document.querySelector(
            "#mainContent"
        );

    if (!mainContent) {
        return;
    }

    mainContent.innerHTML = `
        <p class="mensagem-erro">
            Não foi possível carregar sua biblioteca agora.
        </p>
    `;
}
/* ========================================
   PRIVACIDADE DOS FILMES
======================================== */

function configurarModalPrivacidade() {
    const modal = document.querySelector(
        "#privacyModal"
    );

    const nomeFilme = document.querySelector(
        "#privacyMovieName"
    );

    const botaoConfirmar = document.querySelector(
        "#confirmPrivacyButton"
    );

    const botoesFechar =
        document.querySelectorAll(
            "[data-close-privacy]"
        );

    if (
        !modal ||
        !nomeFilme ||
        !botaoConfirmar
    ) {
        console.error(
            "Não foi possível configurar o modal de privacidade."
        );

        return;
    }

    function abrirModal(filme) {
        filmeAguardandoPublicacao = filme;

        nomeFilme.textContent =
            filme.titulo;

        modal.classList.add("is-open");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        window.setTimeout(() => {
            botaoConfirmar.focus();
        }, 220);
    }

    function fecharModal() {
        modal.classList.remove("is-open");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );

        filmeAguardandoPublicacao = null;
    }

    function confirmarPublicacao() {
        if (!filmeAguardandoPublicacao) {
            fecharModal();
            return;
        }

        filmeAguardandoPublicacao.privacidade =
            "publico";

        salvarEstadoLocal();
        renderizarBiblioteca();

        fecharModal();
    }

    document.addEventListener(
        "soma:confirmar-publicacao",
        (evento) => {
            const filme = evento.detail?.filme;

            if (filme) {
                abrirModal(filme);
            }
        }
    );

    botaoConfirmar.addEventListener(
        "click",
        confirmarPublicacao
    );

    botoesFechar.forEach((botao) => {
        botao.addEventListener(
            "click",
            fecharModal
        );
    });

    document.addEventListener(
        "keydown",
        (evento) => {
            if (
                evento.key === "Escape" &&
                modal.classList.contains(
                    "is-open"
                )
            ) {
                fecharModal();
            }
        }
    );
}
iniciarAplicativo();
