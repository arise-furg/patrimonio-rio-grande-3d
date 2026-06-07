let presenter = null;
window.presenter = presenter;

let monumentoAtual = null;

document.addEventListener("DOMContentLoaded", () => {
  const monumento = obterMonumentoAtual();

  if (!monumento) {
    mostrarErroMonumento();
    return;
  }

  monumentoAtual = monumento;

  preencherInformacoes(monumento);
  configurarBotoesExternos();
  bloquearMenuContextoDoVisualizador();
  iniciar3DHOP(monumento);
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
      if (window.presenter && typeof window.presenter.resetTrackball === "function") {
        window.presenter.resetTrackball();
      }

      atualizarStatus("Modelo recentralizado.");
      repintar3DHOP();
    });
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener("click", () => {
      actionsToolbar("full");
    });
  }
}

function iniciar3DHOP(monumento) {
  try {
    if (typeof init3dhop === "function") {
      init3dhop();
    }

    setup3dhop(monumento);

    atualizarStatus(
      "Modelo carregado. Use a barra lateral para navegar, medir e controlar a luz."
    );

    setTimeout(() => {
      ajustarResolucaoCanvas();
      repintar3DHOP();
    }, 500);

    setTimeout(() => {
      ajustarResolucaoCanvas();
      repintar3DHOP();
    }, 1500);

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
  } catch (erro) {
    console.error(erro);

    atualizarStatus(
      "Não foi possível carregar o visualizador. Verifique os arquivos do 3DHOP e o caminho do modelo .nxs."
    );
  }
}

function setup3dhop(monumento) {
  presenter = new Presenter("draw-canvas");
  window.presenter = presenter;

  presenter.setScene({
    meshes: {
      modelo_principal: {
        url: monumento.modelo
      }
    },

    modelInstances: {
      instancia_modelo: {
        mesh: "modelo_principal"
      }
    },

    trackball: {
      type: TurntablePanTrackball,

      trackOptions: {
        startPhi: 0.0,
        startTheta: 0.0,
        startDistance: 2.5,

        startPanX: 0.0,
        startPanY: 0.0,
        startPanZ: 0.0,

        minMaxPhi: [-180.0, 180.0],
        minMaxTheta: [-180.0, 180.0],
        minMaxDist: [0.2, 80.0],

        minMaxPanX: [-10.0, 10.0],
        minMaxPanY: [-10.0, 10.0],
        minMaxPanZ: [-10.0, 10.0]
      }
    },

    config: {
      showClippingPlanes: false,
      showClippingBorder: false
    },

    space: {
      centerMode: "scene",
      radiusMode: "scene"
    }
  });

  presenter._onEndMeasurement = onEndMeasure;

  if (typeof presenter.enableSceneLighting === "function") {
    presenter.enableSceneLighting(true);
  }

  if (typeof lightSwitch === "function") {
    lightSwitch(false);
  }

  if (typeof lightingSwitch === "function") {
    lightingSwitch(true);
  }

  if (typeof measureSwitch === "function") {
    measureSwitch(false);
  }
}

function actionsToolbar(action) {
  if (!window.presenter) {
    return;
  }

  if (action === "home") {
    window.presenter.resetTrackball();

    if (typeof measureSwitch === "function") {
      measureSwitch(false);
    }

    if (typeof window.presenter.enableMeasurementTool === "function") {
      window.presenter.enableMeasurementTool(false);
    }

    atualizarStatus("Modelo recentralizado.");
    repintar3DHOP();
    return;
  }

  if (action === "zoomin") {
    window.presenter.zoomIn();
    repintar3DHOP();
    return;
  }

  if (action === "zoomout") {
    window.presenter.zoomOut();
    repintar3DHOP();
    return;
  }

  if (action === "lighting" || action === "lighting_off") {
    if (typeof window.presenter.isSceneLightingEnabled === "function" &&
        typeof window.presenter.enableSceneLighting === "function") {
      window.presenter.enableSceneLighting(!window.presenter.isSceneLightingEnabled());

      if (typeof lightingSwitch === "function") {
        lightingSwitch();
      }

      atualizarStatus(
        window.presenter.isSceneLightingEnabled()
          ? "Iluminação ligada."
          : "Iluminação desligada."
      );
    }

    repintar3DHOP();
    return;
  }

  if (action === "light" || action === "light_on") {
    if (typeof window.presenter.isLightTrackballEnabled === "function" &&
        typeof window.presenter.enableLightTrackball === "function") {
      window.presenter.enableLightTrackball(!window.presenter.isLightTrackballEnabled());

      if (typeof lightSwitch === "function") {
        lightSwitch();
      }

      atualizarStatus(
        window.presenter.isLightTrackballEnabled()
          ? "Controle de luz ativo. Arraste o mouse para orientar a luz. Clique novamente no ícone para voltar à rotação."
          : "Controle de luz desativado. Arraste o mouse para rotacionar o modelo."
      );
    }

    repintar3DHOP();
    return;
  }

  if (action === "measure" || action === "measure_on") {
    if (typeof window.presenter.isMeasurementToolEnabled === "function" &&
        typeof window.presenter.enableMeasurementTool === "function") {
      window.presenter.enableMeasurementTool(!window.presenter.isMeasurementToolEnabled());

      if (typeof measureSwitch === "function") {
        measureSwitch();
      }

      atualizarStatus(
        window.presenter.isMeasurementToolEnabled()
          ? "Medição ativa. Clique em dois pontos do modelo."
          : "Medição desativada."
      );
    }

    repintar3DHOP();
    return;
  }

  if (action === "full" || action === "full_on") {
    if (typeof fullscreenSwitch === "function") {
      fullscreenSwitch();
    } else {
      abrirTelaCheiaManual();
    }

    setTimeout(() => {
      ajustarResolucaoCanvas();
      repintar3DHOP();
    }, 300);

    return;
  }
}

function onEndMeasure(measure) {
  const valor = Number(measure);

  if (Number.isNaN(valor)) {
    $("#measure-output").html("0.00 m");
    return;
  }

  $("#measure-output").html(`${valor.toFixed(2)} m`);
}

function bloquearMenuContextoDoVisualizador() {
  const viewer = document.getElementById("3dhop");
  const canvas = document.getElementById("draw-canvas");

  const bloquear = (evento) => {
    evento.preventDefault();
    evento.stopPropagation();
    return false;
  };

  if (viewer) {
    viewer.addEventListener("contextmenu", bloquear, true);
  }

  if (canvas) {
    canvas.addEventListener("contextmenu", bloquear, true);
  }

  document.addEventListener(
    "contextmenu",
    (evento) => {
      if (viewer && viewer.contains(evento.target)) {
        evento.preventDefault();
        evento.stopPropagation();
        return false;
      }
    },
    true
  );
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

  if (
    window.presenter &&
    window.presenter.ui &&
    typeof window.presenter.ui.postDrawEvent === "function"
  ) {
    window.presenter.ui.postDrawEvent();
  }
}

function atualizarStatus(texto) {
  const status = document.getElementById("viewerStatus");

  if (status) {
    status.textContent = texto;
  }
}

function abrirTelaCheiaManual() {
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
}