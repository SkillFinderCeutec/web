// 🔍 Barra de búsqueda global
document.addEventListener("DOMContentLoaded", function () {
    const inputBuscar = document.querySelector(".custom-search");

    if (inputBuscar) {
        inputBuscar.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                const query = inputBuscar.value.trim();
                if (query !== "") {
                    window.location.href = `resultado.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }
});

// 🔍 Mostrar resultados solo si estás en resultado.html
document.addEventListener("DOMContentLoaded", function () {
    const contenedorCursos = document.getElementById("cursosContainer");
    if (!contenedorCursos) return;

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q");

    if (query) {
        contenedorCursos.innerHTML = `<p class="text-muted">Resultados de búsqueda para: <strong>${query}</strong></p>`;
        buscarCursos(query);
    }

    // Filtros (solo si existen en el DOM)
    const filtros = ['filtro-precio', 'filtro-idioma', 'filtro-dificultad', 'filtro-duracion'];
    const filtrosPresentes = filtros.every(id => document.getElementById(id));

    if (filtrosPresentes) {
        filtros.forEach(id => {
            document.getElementById(id).addEventListener("change", aplicarFiltros);
        });
    }
});

// 🔎 Buscar cursos desde el servidor
async function buscarCursos(query) {
    const url = `http://localhost:3000/buscar-cursos?q=${encodeURIComponent(query)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.organic_results && data.organic_results.length > 0) {
            mostrarCursos(data.organic_results);
        } else {
            document.getElementById("cursosContainer").innerHTML =
                `<p class="text-muted">No se encontraron cursos para esta búsqueda.</p>`;
        }
    } catch (error) {
        console.error("❌ Error al buscar cursos:", error);
    }
}

// 🧠 Mostrar tarjetas de cursos
function mostrarCursos(cursos, esGPT = false) {
    const contenedor = document.getElementById("cursosContainer");
    contenedor.innerHTML = "";

    cursos.forEach(curso => {
        // 🧠 Si vienen de GPT, usa su estructura personalizada
        const titulo = esGPT ? curso.titulo : curso.title;
        const descripcion = esGPT ? curso.descripcion : (curso.snippet || "No hay descripción disponible.");
        const url = esGPT ? curso.url : curso.link;
        const imagen = esGPT ? curso.imagen : (curso.pagemap?.cse_thumbnail?.[0]?.src || "imagen_placeholder.png");
        const calificacion = esGPT
            ? `⭐`.repeat(curso.calificacion || 0)
            : (curso.rating ? `⭐`.repeat(Math.round(curso.rating)) : "Calificación no disponible");

        const card = document.createElement("div");
        card.className = "curso-card";
        card.innerHTML = `
            <img src="${imagen}" alt="Curso" class="curso-img">
            <h3>${titulo}</h3>
            <p>${descripcion}</p>
            <div class="rating">${calificacion}</div>
            <button class="btn btn-warning" onclick="guardarCurso('${titulo}', '${url}', 'guardado')">Guardar</button>
            <button class="btn btn-success" onclick="guardarCurso('${titulo}', '${url}', 'finalizado')">Finalizado</button>
            <a href="${url}" target="_blank" class="btn btn-primary">Ver Curso</a>
        `;
        contenedor.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const filtros = ['filtro-precio', 'filtro-idioma'];
    filtros.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.addEventListener("change", aplicarFiltros);
        }
    });
});

// 📝 Aplicar filtros a la búsqueda
async function aplicarFiltros() {
    const query = new URLSearchParams(window.location.search).get("q") || "curso";

    const filtros = {
        q: query,
        precio: document.getElementById("filtro-precio").value,
        idioma: document.getElementById("filtro-idioma").value
    };

    console.log("🧪 Aplicando filtros:", filtros); // <--- Esta línea te mostrará en consola los filtros

    try {
        const res = await fetch("http://localhost:3000/filtrar-cursos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(filtros)
        });

        const data = await res.json();
        console.log("📥 Respuesta del backend:", data); // <-- También verás si llega algo del backend

        if (data.organic_results && data.organic_results.length > 0) {
            mostrarCursos(data.organic_results);
        } else {
            document.getElementById("cursosContainer").innerHTML =
                `<p class="text-muted">No se encontraron cursos con estos filtros.</p>`;
        }
    } catch (error) {
        console.error("❌ Error al aplicar filtros:", error);
    }
}

// 💾 Guardar curso en localStorage (modo legacy/test)
function guardarCurso(nombre, enlace, estado) {
    let biblioteca = JSON.parse(localStorage.getItem("biblioteca")) || [];

    let existente = biblioteca.find(c => c.nombre === nombre);
    if (existente) {
        existente.estado = estado;
        alert(`Curso actualizado a estado: ${estado}`);
    } else {
        biblioteca.push({ nombre, enlace, estado });
        alert("Curso guardado en la biblioteca.");
    }

    localStorage.setItem("biblioteca", JSON.stringify(biblioteca));
}

// 🗂 Modo local para biblioteca.html (si se usa sin backend)
document.addEventListener("DOMContentLoaded", function () {
    const bibliotecaContainer = document.getElementById("bibliotecaContainer");
    if (!bibliotecaContainer) return;

    const biblioteca = JSON.parse(localStorage.getItem("biblioteca")) || [];

    if (biblioteca.length === 0) {
        bibliotecaContainer.innerHTML = `<p class="text-muted">Aún no has guardado ningún curso.</p>`;
        return;
    }

    biblioteca.forEach(curso => {
        const div = document.createElement("div");
        div.classList.add("biblioteca-item");
        div.innerHTML = `
            <h4>${curso.nombre}</h4>
            <p>Estado: <strong>${curso.estado}</strong></p>
            <a href="${curso.enlace}" target="_blank" class="btn btn-primary">Ver Curso</a>
        `;
        bibliotecaContainer.appendChild(div);
    });
});