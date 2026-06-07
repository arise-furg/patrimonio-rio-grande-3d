let presenter = null;
window.presenter = presenter;

document.addEventListener("DOMContentLoaded", () => {
  const monumento = obterMonumentoAtual();

  if (!monumento) {
    mostrarErroMonumento();
    return;
  }

  preencherInformacoes(monumento);
  configurarBotoesExternos();
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
  definirTexto("viewerTitulo", "Monumento não encontrado");
  definirTexto(
    "viewerResumo",
    "Verifique se o endereço da página contém um identificador válido, por exemplo: monumento.html?id=alfandega"
  );
  definirTexto("viewerStatus", "Erro: monumento não encontrado.");
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

function configurarBotoesExternos() {
  const btnResetCamera = document.getElementById("btnResetCamera");
  const btnFullscreen = document.getElementById("btnFullscreen");

  if (btnResetCamera) {
    btnResetCamera.addEventListener("click", () => {
      resetarModelo3DHOP();
    });
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener("click", () => {
      abrirTelaCheia3DHOP();
    });
  }
}

function iniciarVisualizador3DHOP(monumento) {
  const status = document.getElementById("viewerStatus");

  try {
    if (typeof Presenter === "undefined") {
      throw new Error("A biblioteca Presenter do 3DHOP não foi carregada.");
    }

    ajustarResolucaoCanvas();

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
          minMaxDist: [0.2, 30.0],
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

    window.addEventListener("resize", () => {
      ajustarResolucaoCanvas();
      repintar3DHOP();
    });

    document.addEventListener("fullscreenchange", () => {
      setTimeout(() => {
        ajustarResolucaoCanvas();
        repintar3DHOP();
      }, 300);
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

function ajustarResolucaoCanvas() {
  const canvas = document.getElementById("draw-canvas");

  if (!canvas) {
    return;
  }

  const larguraVisual = canvas.clientWidth;
  const alturaVisual = canvas.clientHeight;
  const proporcaoTela = window.devicePixelRatio || 1;

  if (larguraVisual <= 0 || alturaVisual <= 0) {
    return;
  }

  canvas.width = Math.floor(larguraVisual * proporcaoTela);
  canvas.height = Math.floor(alturaVisual * proporcaoTela);

  canvas.style.width = `${larguraVisual}px`;
  canvas.style.height = `${alturaVisual}px`;
}

function repintar3DHOP() {
  if (window.presenter && typeof window.presenter.repaint === "function") {
    window.presenter.repaint();
  }
}

/* Funções da barra personalizada */

function resetarModelo3DHOP() {
  if (!window.presenter) {
    return;
  }

  if (typeof window.presenter.resetTrackball === "function") {
    window.presenter.resetTrackball();
  } else if (typeof window.presenter.reset === "function") {
    window.presenter.reset();
  }

  repintar3DHOP();
}

function aproximarModelo3DHOP() {
  if (!window.presenter) {
    return;
  }

  if (typeof window.presenter.zoomIn === "function") {
    window.presenter.zoomIn();
  } else if (
    window.presenter._scene &&
    window.presenter._scene.trackball &&
    typeof window.presenter._scene.trackball.scale === "function"
  ) {
    window.presenter._scene.trackball.scale(0.85);
  }

  repintar3DHOP();
}

function afastarModelo3DHOP() {
  if (!window.presenter) {
    return;
  }

  if (typeof window.presenter.zoomOut === "function") {
    window.presenter.zoomOut();
  } else if (
    window.presenter._scene &&
    window.presenter._scene.trackball &&
    typeof window.presenter._scene.trackball.scale === "function"
  ) {
    window.presenter._scene.trackball.scale(1.15);
  }

  repintar3DHOP();
}

function alternarLuz3DHOP() {
  if (!window.presenter) {
    return;
  }

  if (typeof window.presenter.toggleLightTrackball === "function") {
    window.presenter.toggleLightTrackball();
  } else if (typeof window.presenter.enableLightTrackball === "function") {
    window.presenter.enableLightTrackball(true);
  }

  repintar3DHOP();
}

function ativarMedicao3DHOP() {
  if (!window.presenter) {
    return;
  }

  if (typeof window.presenter.enableMeasurementTool === "function") {
    window.presenter.enableMeasurementTool(true);
  } else {
    alert("A ferramenta de medição não está disponível nesta configuração do 3DHOP.");
  }

  repintar3DHOP();
}

function abrirTelaCheia3DHOP() {
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

  setTimeout(() => {
    ajustarResolucaoCanvas();
    repintar3DHOP();
  }, 300);
}