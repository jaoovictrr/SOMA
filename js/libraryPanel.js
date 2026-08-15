export function configurarLibraryPanel() {
    const painel =
        document.querySelector(
            ".library-panel"
        );

    const handle =
        document.querySelector(
            ".library-panel-handle"
        );

    if (!painel || !handle) {
        return;
    }

    painel.classList.remove(
        "is-expanded"
    );

    painel.classList.add(
        "is-medium"
    );

    let arrastando = false;
    let inicioY = 0;
    let alturaInicial = 0;
    let movimentoTotal = 0;


    /* ========================================
       COMEÇAR ARRASTE
    ======================================== */

    handle.addEventListener(
        "pointerdown",
        
        (evento) => {
            arrastando = true;

            inicioY =
                evento.clientY;

            alturaInicial =
                painel.offsetHeight;

            movimentoTotal = 0;

            painel.style.transition =
                "none";

            handle.setPointerCapture(
                evento.pointerId
            );
            console.log("pointerdown", evento.clientY);
        }
    );


    /* ========================================
       ARRASTAR
    ======================================== */

    handle.addEventListener(
        "pointermove",
        (evento) => {
            if (!arrastando) {
                return;
            }

            const deslocamento =
                inicioY -
                evento.clientY;

            movimentoTotal =
                Math.abs(
                    deslocamento
                );

            const novaAltura =
                alturaInicial +
                deslocamento;

            const alturaMinima =
                window.innerHeight *
                0.44;

            const alturaMaxima =
                window.innerHeight *
                0.88;

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

                console.log("pointermove", evento.clientY);
        }
    );


    /* ========================================
       SOLTAR
    ======================================== */

    handle.addEventListener(
        "pointerup",
        () => {
            if (!arrastando) {
                return;
            }

            arrastando = false;

            painel.style.transition =
                "height .35s cubic-bezier(.22,1,.36,1)";


            /* Clique simples na barrinha */

            if (movimentoTotal < 8) {

                painel.style.height = "";

                if (
                    painel.classList.contains(
                        "is-expanded"
                    )
                ) {
                    painel.classList.remove(
                        "is-expanded"
                    );

                    painel.classList.add(
                        "is-medium"
                    );
                } else {
                    painel.classList.remove(
                        "is-medium"
                    );

                    painel.classList.add(
                        "is-expanded"
                    );
                }

                return;

                console.log("pointerup");
            }


            /* Arraste real */

            const alturaAtual =
                painel.offsetHeight;

            const limiteRecolher =
                window.innerHeight *
                0.52;


            /*
                Puxou bastante para baixo:
                recolhe automaticamente.
            */

            if (
                alturaAtual <=
                limiteRecolher
            ) {
                painel.classList.remove(
                    "is-medium",
                    "is-expanded"
                );

                painel.style.height =
                    "44vh";

                return;
            }


            /*
                Para cima:
                permanece exatamente
                onde o SOMER soltou.
            */

            painel.classList.remove(
                "is-medium",
                "is-expanded"
            );

            painel.style.height =
                `${alturaAtual}px`;
        }
    );


    handle.addEventListener(
        "pointercancel",
        () => {
            arrastando = false;
            painel.style.transition = "";
        }
    );
}