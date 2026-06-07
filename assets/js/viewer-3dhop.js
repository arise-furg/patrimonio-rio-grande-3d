let presenter = null;
window.presenter = presenter;

let modoAtual = "rotate";
let monumentoAtual = null;
let orientacaoAtual = "front";

document.addEventListener("DOMContentLoaded", () => {
  const monumento = obterMonumentoAtual();

  if (!monumento) {
    mostrarErroMonumento();
    return;
  }

  monumentoAtual = monumento;

  preencherInformacoes(monumento);
  configurarBotoesExternos();
  iniciarVisualizador3DHOP(monumento, "front");
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

function iniciarVisualizador3DHOP(monumento, orientacao = "front") {
  const status = document.getElementById("viewerStatus");

  try {
    if (typeof Presenter === "undefined") {
      throw new Error("A biblioteca Presenter do 3DHOP não foi carregada.");
    }

    ajustarResolucaoCanvas();

    presenter = new Presenter("draw-canvas");
    window.presenter = presenter;

    carregarCena3DHOP(monumento, orientacao);

    definirModo3DHOP("rotate");
    marcarOrientacaoAtiva(orientacao);

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
        "Vista frontal carregada. Use os botões de orientação ou arraste o mouse para girar.";
    }
  } catch (erro) {
    console.error(erro);

    if (status) {
      status.textContent =
        "Não foi possível carregar o visualizador. Verifique os arquivos do 3DHOP e o caminho do modelo .nxs.";
    }
  }
}

function carregarCena3DHOP(monumento, orientacao = "front") {
  if (!window.presenter) {
    return;
  }

  const configuracao = obterConfiguracaoOrientacao(orientacao);

  const tipoTrackball =
    typeof SphereTrackball !== "undefined"
      ? SphereTrackball
      : TurntablePanTrackball;

  window.presenter.setScene({
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
        startDistance: configuracao.startDistance,
        minMaxDist: [0.2, 60.0],
        startPhi: configuracao.startPhi,
        startTheta: configuracao.startTheta,
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

  orientacaoAtual = orientacao;
  marcarOrientacaoAtiva(orientacao);
  atualizarStatusOrientacao(orientacao);
  repintar3DHOP();
}

function obterConfiguracaoOrientacao(orientacao) {
  const distanciaPadrao = 2.5;

  const orientacoes = {
    front: {
      startPhi: 0.0,
      startTheta: 0.0,
      startDistance: distanciaPadrao,
      nome: "frente"
    },

    back: {
      startPhi: 0.0,
      startTheta: Math.PI,
      startDistance: distanciaPadrao,
      nome: "trás"
    },

    left: {
      startPhi: 0.0,
      startTheta: -Math.PI / 2,
      startDistance: distanciaPadrao,
      nome: "esquerda"
    },

    right: {
      startPhi: 0.0,
      startTheta: Math.PI / 2,
      startDistance: distanciaPadrao,
      nome: "direita"
    },

    top: {
      startPhi: -Math.PI / 2,
      startTheta: 0.0,
      startDistance: distanciaPadrao,
      nome: "topo"
    },

    bottom: {
      startPhi: Math.PI / 2,
      startTheta: 0.0,
      startDistance: distanciaPadrao,
      nome: "base"
    }
  };

  return orientacoes[orientacao] || orientacoes.front;
}

function aplicarOrientacao3DHOP(orientacao) {
  if (!monumentoAtual || !window.presenter) {
    return;
  }

  carregarCena3DHOP(monumentoAtual, orientacao);
  definirModo3DHOP("rotate");
}

function marcarOrientacaoAtiva(orientacao) {
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
  const configuracao = obterConfiguracaoOrientacao(orientacao);

  if (status) {
    status.textContent = `Vista ${configuracao.nome} aplicada. Você ainda pode girar, aproximar ou deslocar o modelo.`;
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
        "Modo pan ativo. Use Shift + arrastar, botão direito do mouse ou gesto equivalente para deslocar a visualização.";
    }
  }

  if (modo === "zoom") {
    canvas.style.cursor = "zoom-in";

    if (status) {
      status.textContent =
        "Modo zoom ativo. Use a roda do mouse, o gesto de pinça no touchpad ou os botões + e −.";
    }
  }
}

function resetarModelo3DHOP() {
  if (!window.presenter || !monumentoAtual) {
    return;
  }

  carregarCena3DHOP(monumentoAtual, "front");
  definirModo3DHOP("rotate");
  repintar3DHOP();
}

function ativarRotacao3603DHOP() {
  definirModo3DHOP("rotate");
  repintar3DHOP();
}

function ativarPan3DHOP() {
  definirModo3DHOP("pan");
  repintar3DHOP();
}

function ativarZoom3DHOP() {
  definirModo3DHOP("zoom");
  repintar3DHOP();
}

function aproximarModelo3DHOP() {
  if (!window.presenter) {
    return;
  }

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