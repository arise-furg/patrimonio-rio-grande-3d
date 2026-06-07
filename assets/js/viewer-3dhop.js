let presenter = null;
window.presenter = presenter;

let modoAtual = "rotate";
let monumentoAtual = null;
let orientacaoAtual = "front";
let medicaoAtiva = false;
let iluminacaoAtiva = true;

let mouseControlado = false;
let ultimoMouseX = 0;
let ultimoMouseY = 0;

document.addEventListener("DOMContentLoaded", () => {
  const monumento = obterMonumentoAtual();

  if (!monumento) {
    mostrarErroMonumento();
    return;
  }

  monumentoAtual = monumento;

  preencherInformacoes(monumento);
  configurarBotoesExternos();
  iniciarVisualizador3DHOP(monumento);
  bloquearMenuContextoDoVisualizador();
  configurarControlesPersonalizadosDeMouse();
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
      typeof SphereTrackball !== "undefined"
        ? SphereTrackball
        : TurntablePanTrackball;

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
        type: tipoTrackball,

        trackOptions: {
          startDistance: 2.5,
          minMaxDist: [0.2, 60.0],
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

    definirModo3DHOP("rotate");
    marcarOrientacaoAtiva("front");

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

    if (status) {
      status.textContent =
        "Modelo carregado. Selecione rotação, pan ou zoom na barra de ferramentas.";
    }
  } catch (erro) {
    console.error(erro);

    if (status) {
      status.textContent =
        "Não foi possível carregar o visualizador. Verifique os arquivos do 3DHOP e o caminho do modelo .nxs.";
    }
  }
}

function bloquearMenuContextoDoVisualizador() {
  const viewer = document.getElementById("3dhop");
  const canvas = document.getElementById("draw-canvas");

  if (viewer) {
    viewer.addEventListener("contextmenu", (evento) => {
      evento.preventDefault();
      evento.stopPropagation();
      return false;
    });
  }

  if (canvas) {
    canvas.addEventListener("contextmenu", (evento) => {
      evento.preventDefault();
      evento.stopPropagation();
      return false;
    });
  }
}

function configurarControlesPersonalizadosDeMouse() {
  const canvas = document.getElementById("draw-canvas");

  if (!canvas) {
    return;
  }

  canvas.addEventListener(
    "mousedown",
    (evento) => {
      if (evento.button !== 0) {
        return;
      }

      if (modoAtual === "rotate" || modoAtual === "measure") {
        return;
      }

      evento.preventDefault();
      evento.stopImmediatePropagation();

      mouseControlado = true;
      ultimoMouseX = evento.clientX;
      ultimoMouseY = evento.clientY;

      if (modoAtual === "pan") {
        canvas.style.cursor = "grabbing";
      }

      if (modoAtual === "zoom") {
        canvas.style.cursor = "zoom-in";
      }
    },
    true
  );

  window.addEventListener(
    "mousemove",
    (evento) => {
      if (!mouseControlado) {
        return;
      }

      evento.preventDefault();

      const deltaX = evento.clientX - ultimoMouseX;
      const deltaY = evento.clientY - ultimoMouseY;

      ultimoMouseX = evento.clientX;
      ultimoMouseY = evento.clientY;

      if (modoAtual === "pan") {
        aplicarPanPorDelta(deltaX, deltaY);
      }

      if (modoAtual === "zoom") {
        aplicarZoomPorDelta(deltaY);
      }
    },
    true
  );

  window.addEventListener(
    "mouseup",
    () => {
      if (!mouseControlado) {
        return;
      }

      mouseControlado = false;

      if (modoAtual === "pan") {
        canvas.style.cursor = "move";
      }

      if (modoAtual === "zoom") {
        canvas.style.cursor = "zoom-in";
      }
    },
    true
  );
}

function aplicarPanPorDelta(deltaX, deltaY) {
  const canvas = document.getElementById("draw-canvas");

  if (!canvas || !window.presenter) {
    return;
  }

  const eventoDown = new MouseEvent("mousedown", {
    bubbles: true,
    cancelable: true,
    clientX: ultimoMouseX - deltaX,
    clientY: ultimoMouseY - deltaY,
    button: 2,
    buttons: 2
  });

  const eventoMove = new MouseEvent("mousemove", {
    bubbles: true,
    cancelable: true,
    clientX: ultimoMouseX,
    clientY: ultimoMouseY,
    button: 2,
    buttons: 2
  });

  const eventoUp = new MouseEvent("mouseup", {
    bubbles: true,
    cancelable: true,
    clientX: ultimoMouseX,
    clientY: ultimoMouseY,
    button: 2,
    buttons: 0
  });

  marcarEventoSintetico(eventoDown);
  marcarEventoSintetico(eventoMove);
  marcarEventoSintetico(eventoUp);

  canvas.dispatchEvent(eventoDown);
  canvas.dispatchEvent(eventoMove);
  canvas.dispatchEvent(eventoUp);

  repintar3DHOP();
}

function aplicarZoomPorDelta(deltaY) {
  const intensidade = Math.max(-8, Math.min(8, deltaY));

  if (intensidade === 0) {
    return;
  }

  simularZoomPorRoda(intensidade > 0 ? 1 : -1);
  repintar3DHOP();
}

function marcarEventoSintetico(evento) {
  try {
    Object.defineProperty(evento, "__synthetic3dhop", {
      value: true
    });
  } catch (erro) {
    // Sem ação necessária.
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

  if (
    window.presenter &&
    window.presenter.ui &&
    typeof window.presenter.ui.postDrawEvent === "function"
  ) {
    window.presenter.ui.postDrawEvent();
  }
}

function definirModo3DHOP(modo) {
  modoAtual = modo;

  const canvas = document.getElementById("draw-canvas");
  const status = document.getElementById("viewerStatus");

  document
    .querySelectorAll(".tool-button")
    .forEach((botao) => botao.classList.remove("active-tool"));

  const botaoAtivo = document.querySelector(`[data-tool="${modo}"]`);

  if (botaoAtivo) {
    botaoAtivo.classList.add("active-tool");
  }

  if (!canvas) {
    return;
  }

  if (modo === "rotate") {
    canvas.style.cursor = "grab";

    if (status) {
      status.textContent =
        "Modo rotação 360 ativo. Arraste com o botão esquerdo do mouse para girar o modelo.";
    }
  }

  if (modo === "pan") {
    canvas.style.cursor = "move";

    if (status) {
      status.textContent =
        "Modo pan ativo. Arraste com o botão esquerdo do mouse para deslocar a visualização.";
    }
  }

  if (modo === "zoom") {
    canvas.style.cursor = "zoom-in";

    if (status) {
      status.textContent =
        "Modo zoom ativo. Arraste com o botão esquerdo do mouse para cima ou para baixo.";
    }
  }

  if (modo === "measure") {
    canvas.style.cursor = "crosshair";

    if (status) {
      status.textContent =
        "Modo medição ativo. Clique em dois pontos do modelo para medir. A unidade será metro se o modelo estiver em escala métrica.";
    }
  }

  if (modo === "lighting") {
    canvas.style.cursor = "grab";

    if (status) {
      status.textContent =
        iluminacaoAtiva
          ? "Iluminação ativada."
          : "Iluminação desativada.";
    }
  }
}

function marcarOrientacaoAtiva(orientacao) {
  orientacaoAtual = orientacao;

  document
    .querySelectorAll(".orientation-button")
    .forEach((botao) => botao.classList.remove("active-orientation"));

  const botaoAtivo = document.querySelector(`[data-view="${orientacao}"]`);

  if (botaoAtivo) {
    botaoAtivo.classList.add("active-orientation");
  }
}

function atualizarStatusOrientacao(orientacao) {
  const status = document.getElementById("viewerStatus");

  const nomes = {
    front: "frente",
    back: "trás",
    left: "esquerda",
    right: "direita",
    top: "topo",
    bottom: "base"
  };

  if (status) {
    status.textContent = `Vista ${nomes[orientacao] || orientacao} selecionada. Você ainda pode girar, aproximar ou deslocar o modelo.`;
  }
}

function aplicarOrientacao3DHOP(orientacao) {
  if (!window.presenter) {
    return;
  }

  marcarOrientacaoAtiva(orientacao);
  definirModo3DHOP("rotate");

  try {
    aplicarMatrizDeOrientacao(orientacao);
    atualizarStatusOrientacao(orientacao);
    repintar3DHOP();
  } catch (erro) {
    console.warn("Não foi possível aplicar a orientação diretamente.", erro);
    atualizarStatusOrientacao(orientacao);
    repintar3DHOP();
  }
}

function aplicarMatrizDeOrientacao(orientacao) {
  if (!window.presenter || !window.presenter.trackball) {
    return;
  }

  if (typeof SglMat4 === "undefined") {
    return;
  }

  let matriz = SglMat4.identity();

  if (orientacao === "front") {
    matriz = SglMat4.identity();
  }

  if (orientacao === "back") {
    matriz = SglMat4.rotationAngleAxis(Math.PI, [0.0, 1.0, 0.0]);
  }

  if (orientacao === "left") {
    matriz = SglMat4.rotationAngleAxis(Math.PI / 2, [0.0, 1.0, 0.0]);
  }

  if (orientacao === "right") {
    matriz = SglMat4.rotationAngleAxis(-Math.PI / 2, [0.0, 1.0, 0.0]);
  }

  if (orientacao === "top") {
    matriz = SglMat4.rotationAngleAxis(Math.PI / 2, [1.0, 0.0, 0.0]);
  }

  if (orientacao === "bottom") {
    matriz = SglMat4.rotationAngleAxis(-Math.PI / 2, [1.0, 0.0, 0.0]);
  }

  if (window.presenter.trackball._matrix) {
    window.presenter.trackball._matrix = matriz;
  }

  if (window.presenter._scene && window.presenter._scene.trackball) {
    window.presenter._scene.trackball.locked = false;
  }
}

function resetarModelo3DHOP() {
  if (!window.presenter) {
    return;
  }

  try {
    if (window.presenter.trackball && typeof SglMat4 !== "undefined") {
      window.presenter.trackball._matrix = SglMat4.identity();
    }

    if (window.presenter._scene && window.presenter._scene.trackball) {
      window.presenter._scene.trackball.locked = false;
    }

    marcarOrientacaoAtiva("front");
    definirModo3DHOP("rotate");
    atualizarStatusOrientacao("front");
    repintar3DHOP();
  } catch (erro) {
    console.warn("Não foi possível recentralizar pela matriz.", erro);
    definirModo3DHOP("rotate");
    repintar3DHOP();
  }
}

function ativarRotacao3603DHOP() {
  desativarMedicao3DHOP();
  definirModo3DHOP("rotate");

  if (window.presenter && window.presenter._scene && window.presenter._scene.trackball) {
    window.presenter._scene.trackball.locked = false;
  }

  repintar3DHOP();
}

function ativarPan3DHOP() {
  desativarMedicao3DHOP();
  definirModo3DHOP("pan");

  if (window.presenter && window.presenter._scene && window.presenter._scene.trackball) {
    window.presenter._scene.trackball.locked = false;
  }

  repintar3DHOP();
}

function ativarZoom3DHOP() {
  desativarMedicao3DHOP();
  definirModo3DHOP("zoom");

  if (window.presenter && window.presenter._scene && window.presenter._scene.trackball) {
    window.presenter._scene.trackball.locked = false;
  }

  repintar3DHOP();
}

function aproximarModelo3DHOP() {
  if (!window.presenter) {
    return;
  }

  desativarMedicao3DHOP();
  definirModo3DHOP("zoom");

  if (typeof window.presenter.zoomIn === "function") {
    window.presenter.zoomIn();
  } else {
    simularZoomPorRoda(-1);
  }

  repintar3DHOP();
}

function afastarModelo3DHOP() {
  if (!window.presenter) {
    return;
  }

  desativarMedicao3DHOP();
  definirModo3DHOP("zoom");

  if (typeof window.presenter.zoomOut === "function") {
    window.presenter.zoomOut();
  } else {
    simularZoomPorRoda(1);
  }

  repintar3DHOP();
}

function simularZoomPorRoda(direcao) {
  const canvas = document.getElementById("draw-canvas");

  if (!canvas) {
    return;
  }

  const evento = new WheelEvent("wheel", {
    deltaY: direcao * 120,
    bubbles: true,
    cancelable: true
  });

  canvas.dispatchEvent(evento);
}

function alternarIluminacao3DHOP() {
  if (!window.presenter) {
    return;
  }

  iluminacaoAtiva = !iluminacaoAtiva;

  try {
    if (typeof window.presenter.enableSceneLighting === "function") {
      window.presenter.enableSceneLighting(iluminacaoAtiva);
    } else if (typeof window.presenter.setSceneLighting === "function") {
      window.presenter.setSceneLighting(iluminacaoAtiva);
    } else if (typeof window.presenter.toggleSceneLighting === "function") {
      window.presenter.toggleSceneLighting();
    } else if (typeof window.presenter.enableLighting === "function") {
      window.presenter.enableLighting(iluminacaoAtiva);
    } else if (typeof window.presenter.toggleLighting === "function") {
      window.presenter.toggleLighting();
    }

    const botao = document.querySelector('[data-tool="lighting"]');

    if (botao) {
      if (iluminacaoAtiva) {
        botao.classList.add("active-tool");
      } else {
        botao.classList.remove("active-tool");
      }
    }

    const status = document.getElementById("viewerStatus");

    if (status) {
      status.textContent =
        iluminacaoAtiva
          ? "Iluminação ativada."
          : "Iluminação desativada.";
    }

    repintar3DHOP();
  } catch (erro) {
    console.warn("Não foi possível alternar a iluminação nesta versão do 3DHOP.", erro);

    const status = document.getElementById("viewerStatus");

    if (status) {
      status.textContent =
        "A iluminação não pôde ser alternada nesta configuração do 3DHOP.";
    }
  }
}

function alternarMedicao3DHOP() {
  if (!window.presenter) {
    return;
  }

  medicaoAtiva = !medicaoAtiva;

  try {
    if (typeof window.presenter.enableMeasurementTool === "function") {
      window.presenter.enableMeasurementTool(medicaoAtiva);
    }

    const botao = document.querySelector('[data-tool="measure"]');

    if (botao) {
      if (medicaoAtiva) {
        botao.classList.add("active-tool");
      } else {
        botao.classList.remove("active-tool");
      }
    }

    if (medicaoAtiva) {
      definirModo3DHOP("measure");
    } else {
      definirModo3DHOP("rotate");
    }

    repintar3DHOP();
  } catch (erro) {
    console.warn("Não foi possível ativar a medição nesta versão do 3DHOP.", erro);

    const status = document.getElementById("viewerStatus");

    if (status) {
      status.textContent =
        "A ferramenta de medição não pôde ser ativada nesta configuração do 3DHOP.";
    }
  }
}

function desativarMedicao3DHOP() {
  if (!medicaoAtiva || !window.presenter) {
    return;
  }

  medicaoAtiva = false;

  try {
    if (typeof window.presenter.enableMeasurementTool === "function") {
      window.presenter.enableMeasurementTool(false);
    }
  } catch (erro) {
    // Sem ação necessária.
  }

  const botao = document.querySelector('[data-tool="measure"]');

  if (botao) {
    botao.classList.remove("active-tool");
  }
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