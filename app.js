let experiencias = [];
let reservas = [];

let textoBusqueda = "";
let categoriaActual = "todas";
let precioMaximo = "";
let ordenActual = "normal";

/* ELEMENTOS DEL DOM */

const catalogo = document.querySelector("#catalogo");
const buscador = document.querySelector("#buscador");
const filtroCategoria = document.querySelector("#filtroCategoria");
const precioMaximoInput = document.querySelector("#precioMaximo");
const ordenPrecio = document.querySelector("#ordenPrecio");

const listaReservas = document.querySelector("#listaReservas");
const total = document.querySelector("#total");
const totalPersonas = document.querySelector("#totalPersonas");

const estado = document.querySelector("#estado");
const mensaje = document.querySelector("#mensaje");
const btnVaciar = document.querySelector("#btnVaciar");
let temporizadorMensaje;


/* CARGAR EXPERIENCIAS */

async function cargarExperiencias() {

    try {

        estado.textContent = "Cargando experiencias...";

        const respuesta = await fetch("./data/experiencias.json");

        if (!respuesta.ok) {
            throw new Error(
                `No fue posible cargar las experiencias (HTTP ${respuesta.status})`
            );
        }

        experiencias = await respuesta.json();

        estado.textContent =
            `${experiencias.length} experiencias disponibles`;

        actualizarCatalogo();

    } catch (error) {

        estado.textContent =
            "Error al cargar las experiencias.";

        const mensajeError = window.location.protocol === "file:"
            ? "Abre el proyecto con un servidor local (por ejemplo, Live Server en VS Code) para que el navegador pueda cargar data/experiencias.json."
            : "No se pudieron cargar las experiencias desde data/experiencias.json. Comprueba que la ruta y el archivo sean correctos.";

        mostrarMensaje(
            mensajeError,
            "error"
        );

        console.error(error);
    }
}


/* FILTRAR Y ORDENAR */

function obtenerResultados() {

    let resultados = [...experiencias];


    /* FILTRO DE CATEGORÍA */

    if (categoriaActual !== "todas") {

        resultados = resultados.filter(
            experiencia =>
                experiencia.categoria === categoriaActual
        );
    }


    /* FILTRO DE BÚSQUEDA */

    if (textoBusqueda !== "") {

        resultados = resultados.filter(
            experiencia =>
                experiencia.nombre
                    .toLowerCase()
                    .includes(textoBusqueda)
        );
    }


    /* FILTRO DE PRECIO MÁXIMO */

    if (precioMaximo !== "") {

        resultados = resultados.filter(
            experiencia =>
                experiencia.precio <= Number(precioMaximo)
        );
    }


    /* ORDENAR */

    if (ordenActual === "ascendente") {

        resultados.sort(
            (a, b) => a.precio - b.precio
        );
    }

    if (ordenActual === "descendente") {

        resultados.sort(
            (a, b) => b.precio - a.precio
        );
    }

    return resultados;
}


/* ACTUALIZAR CATÁLOGO */

function actualizarCatalogo() {

    const resultados = obtenerResultados();

    if (resultados.length === 0) {

        catalogo.innerHTML = `
            <p class="sin-resultados">
                No se encontraron experiencias con esos filtros.
            </p>
        `;

        estado.textContent = "0 resultados";

        return;
    }


    catalogo.innerHTML = resultados.map(
        experiencia => `

        <article class="tarjeta">

            <div class="imagen" aria-hidden="true">
                ${experiencia.icono}
            </div>

            <div class="informacion">

                <span class="categoria">
                    ${experiencia.categoria}
                </span>

                <h3>${experiencia.nombre}</h3>

                <p>
                    Cupo disponible:
                    ${experiencia.cupo}
                </p>

                <p class="precio">
                    $${experiencia.precio} MXN
                </p>

                <label for="cantidad-${experiencia.id}">
                    Personas:
                </label>

                <input
                    type="number"
                    id="cantidad-${experiencia.id}"
                    min="1"
                    max="${experiencia.cupo}"
                    value="1"
                >

                <button
                    class="btn-reservar"
                    data-id="${experiencia.id}"
                    type="button"
                >
                    Agregar
                </button>

            </div>

        </article>

    `
    ).join("");


    estado.textContent =
        `${resultados.length} resultados`;

    agregarEventosReservar();
}


/* EVENTOS DE BOTONES AGREGAR */

function agregarEventosReservar() {

    const botonesReservar =
        document.querySelectorAll(".btn-reservar");

    botonesReservar.forEach(boton => {

        boton.addEventListener("click", () => {

            const id =
                Number(boton.dataset.id);

            agregarReserva(id);
        });
    });
}


/* AGREGAR RESERVACIÓN */

function agregarReserva(id) {

    const experiencia =
        experiencias.find(
            elemento => elemento.id === id
        );

    if (!experiencia) {
        return;
    }


    const entradaCantidad =
        document.querySelector(
            `#cantidad-${id}`
        );

    const cantidad =
        Number(entradaCantidad.value);


    /* VALIDAR CANTIDAD */

    if (
        !Number.isInteger(cantidad) ||
        cantidad < 1
    ) {

        mostrarMensaje(
            "La cantidad debe ser de al menos 1 persona.",
            "error"
        );

        return;
    }


    if (cantidad > experiencia.cupo) {

        mostrarMensaje(
            `El cupo máximo para ${experiencia.nombre} es de ${experiencia.cupo} personas.`,
            "error"
        );

        return;
    }


    /* BUSCAR RESERVACIÓN EXISTENTE */

    const reservaExistente =
        reservas.find(
            reserva =>
                reserva.experienciaId === id
        );


    if (reservaExistente) {

        const nuevaCantidad =
            reservaExistente.cantidad + cantidad;


        if (nuevaCantidad > experiencia.cupo) {

            mostrarMensaje(
                `No puedes superar el cupo de ${experiencia.cupo} personas para ${experiencia.nombre}.`,
                "error"
            );

            return;
        }


        reservaExistente.cantidad =
            nuevaCantidad;

        reservaExistente.subtotal =
            nuevaCantidad * experiencia.precio;

    } else {

        reservas.push({

            experienciaId: experiencia.id,

            nombre: experiencia.nombre,

            precio: experiencia.precio,

            cantidad: cantidad,

            subtotal:
                experiencia.precio * cantidad
        });
    }


    mostrarMensaje(
        `${experiencia.nombre} fue agregada a tu reservación.`,
        "exito"
    );

    mostrarReservas();
}


/* MOSTRAR RESERVACIONES */

function mostrarReservas() {

    if (reservas.length === 0) {

        listaReservas.innerHTML =
            "<p>No hay experiencias seleccionadas.</p>";

        total.textContent = "$0 MXN";

        totalPersonas.textContent = "0";

        return;
    }


    listaReservas.innerHTML =
        reservas.map(
            reserva => `

            <article class="item-reserva">

                <div>

                    <strong>
                        ${reserva.nombre}
                    </strong>

                    <p>
                        $${reserva.precio} por persona
                    </p>


                    <div class="controles-cantidad">

                        <button
                            class="btn-cantidad btn-disminuir"
                            data-id="${reserva.experienciaId}"
                            type="button"
                            aria-label="Disminuir cantidad de ${reserva.nombre}"
                        >
                            −
                        </button>

                        <span class="cantidad">
                            ${reserva.cantidad}
                        </span>

                        <button
                            class="btn-cantidad btn-aumentar"
                            data-id="${reserva.experienciaId}"
                            type="button"
                            aria-label="Aumentar cantidad de ${reserva.nombre}"
                        >
                            +
                        </button>

                    </div>

                    <p>
                        ${reserva.cantidad} persona(s)
                    </p>

                </div>


                <div>

                    <strong>
                        $${reserva.subtotal} MXN
                    </strong>

                    <br>

                    <button
                        class="btn-eliminar"
                        data-id="${reserva.experienciaId}"
                        type="button"
                    >
                        Eliminar
                    </button>

                </div>

            </article>

        `
        ).join("");


    /* CALCULAR TOTAL */

    const totalReserva =
        reservas.reduce(
            (suma, reserva) =>
                suma + reserva.subtotal,
            0
        );


    /* CALCULAR PERSONAS */

    const cantidadPersonas =
        calcularTotalPersonas();


    total.textContent =
        `$${totalReserva} MXN`;

    totalPersonas.textContent =
        cantidadPersonas;


    agregarEventosReserva();
}


/* CALCULAR TOTAL DE PERSONAS */

function calcularTotalPersonas() {

    return reservas.reduce(
        (total, reserva) =>
            total + reserva.cantidad,
        0
    );
}


/* EVENTOS DE LA RESERVACIÓN */

function agregarEventosReserva() {

    const botonesAumentar =
        document.querySelectorAll(
            ".btn-aumentar"
        );

    const botonesDisminuir =
        document.querySelectorAll(
            ".btn-disminuir"
        );

    const botonesEliminar =
        document.querySelectorAll(
            ".btn-eliminar"
        );


    botonesAumentar.forEach(boton => {

        boton.addEventListener(
            "click",
            () => {

                const id =
                    Number(boton.dataset.id);

                aumentarCantidad(id);
            }
        );
    });


    botonesDisminuir.forEach(boton => {

        boton.addEventListener(
            "click",
            () => {

                const id =
                    Number(boton.dataset.id);

                disminuirCantidad(id);
            }
        );
    });


    botonesEliminar.forEach(boton => {

        boton.addEventListener(
            "click",
            () => {

                const id =
                    Number(boton.dataset.id);

                eliminarReserva(id);
            }
        );
    });
}


/* AUMENTAR CANTIDAD */

function aumentarCantidad(id) {

    const reserva =
        reservas.find(
            elemento =>
                elemento.experienciaId === id
        );

    const experiencia =
        experiencias.find(
            elemento =>
                elemento.id === id
        );


    if (!reserva || !experiencia) {
        return;
    }


    if (reserva.cantidad >= experiencia.cupo) {

        mostrarMensaje(
            `Ya alcanzaste el cupo máximo de ${experiencia.cupo} personas.`,
            "error"
        );

        return;
    }


    reserva.cantidad++;

    reserva.subtotal =
        reserva.cantidad * reserva.precio;


    mostrarReservas();
}


/* DISMINUIR CANTIDAD */

function disminuirCantidad(id) {

    const reserva =
        reservas.find(
            elemento =>
                elemento.experienciaId === id
        );


    if (!reserva) {
        return;
    }


    if (reserva.cantidad <= 1) {

        mostrarMensaje(
            "La cantidad mínima es de 1 persona.",
            "error"
        );

        return;
    }


    reserva.cantidad--;

    reserva.subtotal =
        reserva.cantidad * reserva.precio;


    mostrarReservas();
}


/* ELIMINAR RESERVACIÓN */

function eliminarReserva(id) {

    const reserva =
        reservas.find(
            elemento =>
                elemento.experienciaId === id
        );


    if (!reserva) {
        return;
    }


    reservas =
        reservas.filter(
            elemento =>
                elemento.experienciaId !== id
        );


    mostrarMensaje(
        `${reserva.nombre} fue eliminada de la reservación.`,
        "exito"
    );

    mostrarReservas();
}


/* VACIAR RESERVACIÓN */

function vaciarReservacion() {

    if (reservas.length === 0) {

        mostrarMensaje(
            "No hay reservaciones para vaciar.",
            "error"
        );

        return;
    }


    const confirmar =
        confirm(
            "¿Estás seguro de que deseas vaciar toda la reservación?"
        );


    if (!confirmar) {
        return;
    }


    reservas = [];

    mostrarReservas();

    mostrarMensaje(
        "La reservación fue vaciada correctamente.",
        "exito"
    );
}


/* MOSTRAR MENSAJES */

function mostrarMensaje(texto, tipo) {

    clearTimeout(temporizadorMensaje);

    mensaje.textContent = texto;

    mensaje.className =
        `mensaje ${tipo}`;


    temporizadorMensaje = setTimeout(() => {

        mensaje.textContent = "";

        mensaje.className = "mensaje";

        temporizadorMensaje = undefined;

    }, 4000);
}


/* EVENTOS DE FILTROS */


/* BUSCADOR */

buscador.addEventListener(
    "input",
    () => {

        textoBusqueda =
            buscador.value
                .trim()
                .toLowerCase();

        actualizarCatalogo();
    }
);


/* CATEGORÍA */

filtroCategoria.addEventListener(
    "change",
    () => {

        categoriaActual =
            filtroCategoria.value;

        actualizarCatalogo();
    }
);


/* PRECIO MÁXIMO */

precioMaximoInput.addEventListener(
    "input",
    () => {

        precioMaximo =
            precioMaximoInput.value;

        actualizarCatalogo();
    }
);


/* ORDEN */

ordenPrecio.addEventListener(
    "change",
    () => {

        ordenActual =
            ordenPrecio.value;

        actualizarCatalogo();
    }
);


/* BOTÓN VACIAR */

btnVaciar.addEventListener(
    "click",
    vaciarReservacion
);


/* INICIAR */

cargarExperiencias();