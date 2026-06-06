document.addEventListener("DOMContentLoaded", () => {
  configurarMenuMobile();
  carregarCardsMonumentos();
});

function configurarMenuMobile() {
  const menuButton = document.getElementById("menuButton");
  const mainNav = document.getElementById("mainNav");

  if (!menuButton || !mainNav) {
    return;
  }

  menuButton.addEventListener("click", () => {
    mainNav.classList.toggle("is-open");
  });
}

function carregarCardsMonumentos() {
  const grid = document.getElementById("monumentGrid");

  if (!grid || typeof MONUMENTOS === "undefined") {
    return;
  }

  const monumentos = Object.values(MONUMENTOS);

  grid.innerHTML = monumentos
    .map((monumento) => {
      return `
        <article class="monument-card">
          <img
            src="${monumento.imagem}"
            alt="${monumento.titulo}"
            onerror="this.src='assets/img/placeholder-modelo.jpg';"
          />

          <div class="monument-card-body">
            <h3>${monumento.titulo}</h3>

            <p>
              <strong>${monumento.periodo}</strong><br />
              ${monumento.caracteristica}
            </p>

            <a class="button primary" href="monumento.html?id=${monumento.id}">
              Abrir modelo 3D
            </a>
          </div>
        </article>
      `;
    })
    .join("");
}