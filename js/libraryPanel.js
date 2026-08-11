export function configurarLibraryPanel() {
    const painel = document.querySelector(".library-panel");
    const handle = document.querySelector(".library-panel-handle");

    console.log("painel:", painel);
    console.log("handle:", handle);

    if (!painel || !handle) {
        console.error("Library Panel não encontrado.");
        return;
    }

    painel.classList.add("is-medium");

    handle.addEventListener("click", () => {
        console.log("CLIQUE NA BARRINHA");

        if (painel.classList.contains("is-expanded")) {
            painel.classList.remove("is-expanded");
            painel.classList.add("is-medium");
        } else {
            painel.classList.remove("is-medium");
            painel.classList.add("is-expanded");
        }

        console.log("classe atual:", painel.className);

        let arrastando = false;
let inicioY = 0;
let alturaInicial = 0;

handle.addEventListener("pointerdown", (evento) => {
    arrastando = true;

    inicioY = evento.clientY;
    alturaInicial = painel.offsetHeight;

    painel.style.transition = "none";

    handle.setPointerCapture(
        evento.pointerId
    );
});

handle.addEventListener("pointermove", (evento) => {
    if (!arrastando) {
        return;
    }

    const deslocamento =
        inicioY - evento.clientY;

    const novaAltura =
        alturaInicial + deslocamento;

    const alturaMinima =
        window.innerHeight * 0.58;

    const alturaMaxima =
        window.innerHeight * 0.88;

    const alturaLimitada =
        Math.min(
            alturaMaxima,
            Math.max(
                alturaMinima,
                novaAltura
            )
        );

    painel.style.height =
        `${alturaLimitada}px`;
});

handle.addEventListener("pointerup", () => {
    if (!arrastando) {
        return;
    }

    arrastando = false;

    painel.style.transition = "";

    const limite =
        window.innerHeight * 0.73;

    if (
        painel.offsetHeight >
        limite
    ) {
        painel.classList.remove(
            "is-medium"
        );

        painel.classList.add(
            "is-expanded"
        );
    } else {
        painel.classList.remove(
            "is-expanded"
        );

        painel.classList.add(
            "is-medium"
        );
    }

    painel.style.height = "";
});
    });
}