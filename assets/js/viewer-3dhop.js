let presenter = null;
window.presenter = presenter;

document.addEventListener("DOMContentLoaded", () => {
  const monumento = obterMonumentoAtual();

  if (!monumento) {
    mostrarErroMonumento();
    return;
  }

  preencherInformacoes(monumento);
  configurarBotoes();
  iniciarVisualizador3DHOP(monumento);
});

function obterMonumentoAtual() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id || typeof MONUMENTOS === "undefined") {
    return null;
  }

  return MONUMENTOS[id] || null;
}

function mostrarErroMonumento() {
  const titulo = document.getElementById("viewerTitulo");
  const resumo = document.getElementById("viewerResumo");
  const status = document.getElementById("viewerStatus");

  if (titulo) {
    titulo.textContent = "Monumento não encontrado";
  }

  if (resumo) {
    resumo.textContent =
      "Verifique se o endereço da página contém um identificador válido, por exemplo: monumento.html?id=alfandega";
  }

  if (status) {
    status.textContent = "Erro: monumento não encontrado.";
  }
}

function preencherInformacoes(monumento) {
  document.title = `${monumento.titulo} · Patrimônio Rio Grande`;

  definirTexto("viewerCategoria", monumento.categoria);
  definirTexto("viewerTitulo", monumento.titulo);
  definirTexto("viewerResumo", monumento.resumo);
  definirTexto("viewerPeriodo", monumento.periodo);
  definirTexto("viewerTipologia", monumento.tipologia);
  definirTexto("viewerCaracteristica", monumento.caracteristica);
  definirTexto("viewerDescricao", monumento.descricao);
  definirTexto("viewerUsoPublico", monumento.usoPublico);
}

function definirTexto(id, texto) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = texto;
  }
}

function configurarBotoes() {
  const btnResetCamera = document.getElementById("btnResetCamera");
  const btnFullscreen = document.getElementById("btnFullscreen");

  if (btnResetCamera) {
    btnResetCamera.addEventListener("click", () => {
      if (window.presenter && typeof window.presenter.resetTrackball === "function") {
        window.presenter.resetTrackball();
      }
    });
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener("click", () => {
      const viewer = document.getElementById("3dhop");

      if (!viewer) {
        return;
      }

      if (viewer.requestFullscreen) {
        viewer.requestFullscreen();
      } else if (viewer.webkitRequestFullscreen) {
        viewer.webkitRequestFullscreen();
      } else if (viewer.msRequestFullscreen) {
        viewer.msRequestFullscreen();
      }
    });
  }
}

function iniciarVisualizador3DHOP(monumento) {
  const status = document.getElementById("viewerStatus");

  try {
    if (typeof Presenter === "undefined") {
      throw new Error("A biblioteca Presenter do 3DHOP não foi carregada.");
    }

    presenter = new Presenter("draw-canvas");
    window.presenter = presenter;

    const tipoTrackball =
      typeof TurntablePanTrackball !== "undefined"
        ? TurntablePanTrackball
        : SphereTrackball;

    presenter.setScene({
      meshes: {
        "modelo_principal": {
          url: monumento.modelo
        }
      },

      modelInstances: {
        "instancia_modelo": {
          mesh: "modelo_principal"
        }
      },

      trackball: {
        type: tipoTrackball,

        trackOptions: {
          startDistance: 2.5,
          minMaxDist: [0.2, 20.0],
          startPhi: 0.0,
          startTheta: 0.0,
          startPanX: 0.0,
          startPanY: 0.0,
          startPanZ: 0.0
        }
      },

      space: {
        centerMode: "scene",
        radiusMode: "scene"
      }
    });

    if (status) {
      status.textContent = "Modelo carregado. Use o mouse ou toque para navegar.";
    }
  } catch (erro) {
    console.error(erro);

    if (status) {
      status.textContent =
        "Não foi possível carregar o visualizador. Verifique os arquivos do 3DHOP e o caminho do modelo .nxs.";
    }
  }
}