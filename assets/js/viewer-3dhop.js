let presenter = null;
window.presenter = presenter;

let monumentoAtual = null;
let metadadosVisiveis = false;
let anotacoesVisiveis = false;

/*
  Ajustes centrais da câmera inicial.

  Para alterar a posição inicial depois:
  - Aumente CAMERA_START_DISTANCE para afastar o modelo.
  - Diminua CAMERA_START_DISTANCE para aproximar o modelo.
  - Altere CAMERA_START_PHI para inclinar a visão.
  - Altere CAMERA_START_THETA para girar horizontalmente.

  A configuração abaixo força uma visão mais frontal e com mais zoom
  do que a versão anterior.
*/
const CAMERA_START_DISTANCE = 1.35;
const CAMERA_START_PHI = -0.22;
const CAMERA_START_THETA = -1.57;

document.addEventListener("DOMContentLoaded", () => {
  const monumento = obterMonumentoAtual();

  if (!monumento) {
    mostrarErroMonumento();
    return;
  }

  monumentoAtual = monumento;

  preencherInformacoes(monumento);
  configurarBotoesDaInterface();
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
  definirTexto("metadata-title", monumento.titulo);
}

function definirTexto(id, texto) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = texto || "";
  }
}

function iniciar3DHOP(monumento) {
  try {
    if (typeof init3dhop === "function") {
      init3dhop();
    }

    configurarCena3DHOP(monumento);
    configurarFerramentasDeSecao();

    atualizarStatus(
      "Modelo carregado. Arraste com o botão esquerdo para rotacionar livremente em 360°."
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

function configurarCena3DHOP(monumento) {
  presenter = new Presenter("draw-canvas");
  window.presenter = presenter;

  /*
    SphereTrackball é usado para permitir rotação livre em 360 graus
    com o botão esquerdo do mouse.
  */
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
      type: SphereTrackball,

      trackOptions: {
        startPhi: CAMERA_START_PHI,
        startTheta: CAMERA_START_THETA,
        startDistance: CAMERA_START_DISTANCE,

        startPanX: 0.0,
        startPanY: 0.0,
        startPanZ: 0.0,

        minMaxDist: [0.1, 80.0]
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

  if (typeof presenter.enableMeasurementTool === "function") {
    presenter.enableMeasurementTool(false);
  }

  if (typeof presenter.enableLightTrackball === "function") {
    presenter.enableLightTrackball(false);
  }

  if (typeof measureSwitch === "function") {
    measureSwitch(false);
  }

  if (typeof lightSwitch === "function") {
    lightSwitch(false);
  }

  if (typeof sectiontoolSwitch === "function") {
    sectiontoolSwitch(false);
  }
}

function configurarBotoesDaInterface() {
  vincularCliquePersistente("home", () => actionsToolbar("home"));
  vincularCliquePersistente("info", () => actionsToolbar("info"));
  vincularCliquePersistente("zoomin", () => actionsToolbar("zoomin"));
  vincularCliquePersistente("zoomout", () => actionsToolbar("zoomout"));
  vincularCliquePersistente("light", () => actionsToolbar("light"));
  vincularCliquePersistente("light_on", () => actionsToolbar("light_on"));
  vincularCliquePersistente("measure", () => actionsToolbar("measure"));
  vincularCliquePersistente("measure_on", () => actionsToolbar("measure_on"));
  vincularCliquePersistente("hotspot", () => actionsToolbar("hotspot"));
  vincularCliquePersistente("hotspot_on", () => actionsToolbar("hotspot_on"));
  vincularCliquePersistente("sections", () => actionsToolbar("sections"));
  vincularCliquePersistente("sections_on", () => actionsToolbar("sections_on"));
  vincularCliquePersistente("full", () => actionsToolbar("full"));
  vincularCliquePersistente("full_on", () => actionsToolbar("full_on"));

  vincularCliquePersistente("metadata-close", () => fecharPainelMetadados());
  vincularCliquePersistente("annotations-close", () => fecharPainelAnotacoes());

  const metadataPanel = document.getElementById("metadata-panel");
  const annotationsPanel = document.getElementById("annotations-panel");

  impedirCaptura3DHOP(metadataPanel);
  impedirCaptura3DHOP(annotationsPanel);

  document.querySelectorAll("#toolbar img").forEach((icone) => {
    impedirCaptura3DHOP(icone);
  });
}

function vincularCliquePersistente(id, funcao) {
  const elemento = document.getElementById(id);

  if (!elemento) {
    return;
  }

  elemento.addEventListener(
    "mousedown",
    (evento) => {
      evento.preventDefault();
      evento.stopPropagation();
    },
    true
  );

  elemento.addEventListener(
    "mouseup",
    (evento) => {
      evento.preventDefault();
      evento.stopPropagation();
    },
    true
  );

  elemento.addEventListener(
    "click",
    (evento) => {
      evento.preventDefault();
      evento.stopPropagation();
      funcao();
    },
    true
  );
}

function impedirCaptura3DHOP(elemento) {
  if (!elemento) {
    return;
  }

  ["mousedown", "mouseup", "mousemove", "click", "dblclick", "wheel", "touchstart", "touchmove", "touchend"].forEach(
    (tipoEvento) => {
      elemento.addEventListener(
        tipoEvento,
        (evento) => {
          evento.stopPropagation();
        },
        true
      );
    }
  );
}

function actionsToolbar(action) {
  if (!window.presenter) {
    return;
  }

  if (action === "home") {
    resetarCameraInicial();
    desativarMedicao();
    desativarSecoes();
    atualizarStatus("Modelo recentralizado na visão frontal.");
    repintar3DHOP();
    return;
  }

  if (action === "info") {
    abrirPainelMetadados();
    return;
  }

  if (action === "zoomin") {
    presenter.zoomIn();
    atualizarStatus("Zoom aplicado: aproximar.");
    repintar3DHOP();
    return;
  }

  if (action === "zoomout") {
    presenter.zoomOut();
    atualizarStatus("Zoom aplicado: afastar.");
    repintar3DHOP();
    return;
  }

  if (action === "light" || action === "light_on") {
    alternarControleDeLuz();
    return;
  }

  if (action === "measure" || action === "measure_on") {
    alternarMedicao();
    return;
  }

  if (action === "hotspot" || action === "hotspot_on") {
    alternarAnotacoes();
    return;
  }

  if (action === "sections" || action === "sections_on") {
    alternarSecoes();
    return;
  }

  if (action === "full" || action === "full_on") {
    alternarTelaCheia();
    return;
  }
}

function resetarCameraInicial() {
  if (!window.presenter) {
    return;
  }

  /*
    Para a visão inicial personalizada, recriamos a cena mantendo
    o mesmo modelo. Isso evita voltar para a orientação padrão top-view.
  */
  configurarCena3DHOP(monumentoAtual);
  configurarFerramentasDeSecao();

  setTimeout(() => {
    ajustarResolucaoCanvas();
    repintar3DHOP();
  }, 100);
}

function abrirPainelMetadados() {
  metadadosVisiveis = true;

  const painel = document.getElementById("metadata-panel");

  if (painel) {
    painel.classList.add("is-visible");
  }

  atualizarStatus("Painel de metadados aberto.");
}

function fecharPainelMetadados() {
  metadadosVisiveis = false;

  const painel = document.getElementById("metadata-panel");

  if (painel) {
    painel.classList.remove("is-visible");
  }

  atualizarStatus("Painel de metadados fechado.");
}

function alternarAnotacoes() {
  anotacoesVisiveis = !anotacoesVisiveis;

  const painel = document.getElementById("annotations-panel");

  if (painel) {
    painel.classList.toggle("is-visible", anotacoesVisiveis);
  }

  alternarIcone("hotspot", "hotspot_on", anotacoesVisiveis);

  atualizarStatus(
    anotacoesVisiveis
      ? "Anotações ativadas."
      : "Anotações ocultadas."
  );

  repintar3DHOP();
}

function fecharPainelAnotacoes() {
  anotacoesVisiveis = false;

  const painel = document.getElementById("annotations-panel");

  if (painel) {
    painel.classList.remove("is-visible");
  }

  alternarIcone("hotspot", "hotspot_on", false);
  atualizarStatus("Anotações ocultadas.");
  repintar3DHOP();
}

function alternarControleDeLuz() {
  if (!window.presenter) {
    return;
  }

  if (
    typeof presenter.isLightTrackballEnabled === "function" &&
    typeof presenter.enableLightTrackball === "function"
  ) {
    const novoEstado = !presenter.isLightTrackballEnabled();
    presenter.enableLightTrackball(novoEstado);
    alternarIcone("light", "light_on", novoEstado);

    atualizarStatus(
      novoEstado
        ? "Controle de luz ativo. Arraste o mouse para orientar a luz. Clique novamente no ícone para voltar à rotação."
        : "Controle de luz desativado. Arraste o mouse para rotacionar o modelo."
    );

    repintar3DHOP();
  }
}

function alternarMedicao() {
  if (!window.presenter || typeof presenter.enableMeasurementTool !== "function") {
    return;
  }

  let novoEstado = true;

  if (typeof presenter.isMeasurementToolEnabled === "function") {
    novoEstado = !presenter.isMeasurementToolEnabled();
  } else {
    novoEstado = document.getElementById("measure").style.visibility !== "hidden";
  }

  presenter.enableMeasurementTool(novoEstado);

  if (typeof measureSwitch === "function") {
    measureSwitch(novoEstado);
  } else {
    alternarIcone("measure", "measure_on", novoEstado);

    const caixa = document.getElementById("measure-box");

    if (caixa) {
      caixa.style.display = novoEstado ? "table" : "none";
    }
  }

  atualizarStatus(
    novoEstado
      ? "Medição ativa. Clique em dois pontos do modelo."
      : "Medição desativada."
  );

  repintar3DHOP();
}

function desativarMedicao() {
  if (!window.presenter || typeof presenter.enableMeasurementTool !== "function") {
    return;
  }

  presenter.enableMeasurementTool(false);

  if (typeof measureSwitch === "function") {
    measureSwitch(false);
  } else {
    alternarIcone("measure", "measure_on", false);

    const caixa = document.getElementById("measure-box");

    if (caixa) {
      caixa.style.display = "none";
    }
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

function configurarFerramentasDeSecao() {
  if (!window.presenter) {
    return;
  }

  if (typeof presenter.setClippingPointXYZ === "function") {
    presenter.setClippingPointXYZ(0.5, 0.5, 0.5);
  }

  configurarSliderSecao("xplaneSlider", "x", (valor) => {
    sectionxSwitch(true);
    if (typeof presenter.setClippingPointX === "function") {
      presenter.setClippingPointX(valor);
    }
  });

  configurarSliderSecao("yplaneSlider", "y", (valor) => {
    sectionySwitch(true);
    if (typeof presenter.setClippingPointY === "function") {
      presenter.setClippingPointY(valor);
    }
  });

  configurarSliderSecao("zplaneSlider", "z", (valor) => {
    sectionzSwitch(true);
    if (typeof presenter.setClippingPointZ === "function") {
      presenter.setClippingPointZ(valor);
    }
  });

  configurarFlipSecao("xplaneFlip", "x");
  configurarFlipSecao("yplaneFlip", "y");
  configurarFlipSecao("zplaneFlip", "z");

  const showPlane = document.getElementById("showPlane");
  const showBorder = document.getElementById("showBorder");

  if (showPlane) {
    showPlane.addEventListener("change", () => {
      if (typeof presenter.setClippingPlanesVisibility === "function") {
        presenter.setClippingPlanesVisibility(showPlane.checked);
      }
      repintar3DHOP();
    });
  }

  if (showBorder) {
    showBorder.addEventListener("change", () => {
      if (typeof presenter.setClippingBorderVisibility === "function") {
        presenter.setClippingBorderVisibility(showBorder.checked);
      }
      repintar3DHOP();
    });
  }

  desativarSecoes();
}

function configurarSliderSecao(id, eixo, callback) {
  const slider = document.getElementById(id);

  if (!slider) {
    return;
  }

  slider.min = 0.0;
  slider.max = 1.0;
  slider.step = 0.01;
  slider.value = 0.5;

  slider.addEventListener("input", () => {
    callback(slider.valueAsNumber);
    repintar3DHOP();
  });

  slider.addEventListener("change", () => {
    callback(slider.valueAsNumber);
    repintar3DHOP();
  });
}

function configurarFlipSecao(id, eixo) {
  const checkbox = document.getElementById(id);

  if (!checkbox) {
    return;
  }

  checkbox.addEventListener("change", () => {
    const valor = checkbox.checked ? -1 : 1;

    if (eixo === "x" && typeof presenter.setClippingNormalX === "function") {
      presenter.setClippingNormalX(valor);
    }

    if (eixo === "y" && typeof presenter.setClippingNormalY === "function") {
      presenter.setClippingNormalY(valor);
    }

    if (eixo === "z" && typeof presenter.setClippingNormalZ === "function") {
      presenter.setClippingNormalZ(valor);
    }

    repintar3DHOP();
  });
}

function alternarSecoes() {
  const sections = document.getElementById("sections");
  const ativo = sections && sections.style.visibility !== "hidden";

  if (ativo) {
    ativarSecoes();
  } else {
    desativarSecoes();
  }
}

function ativarSecoes() {
  alternarIcone("sections", "sections_on", true);

  const caixa = document.getElementById("sections-box");

  if (caixa) {
    caixa.style.display = "table";
  }

  atualizarStatus("Edição de seções ativada.");
  repintar3DHOP();
}

function desativarSecoes() {
  alternarIcone("sections", "sections_on", false);

  const caixa = document.getElementById("sections-box");

  if (caixa) {
    caixa.style.display = "none";
  }

  if (window.presenter && typeof presenter.setClippingXYZ === "function") {
    presenter.setClippingXYZ(0, 0, 0);
  }

  atualizarEstadoPlano("x", false);
  atualizarEstadoPlano("y", false);
  atualizarEstadoPlano("z", false);

  repintar3DHOP();
}

function sectionxSwitch(forcarAtivo) {
  alternarPlano("x", forcarAtivo);
}

function sectionySwitch(forcarAtivo) {
  alternarPlano("y", forcarAtivo);
}

function sectionzSwitch(forcarAtivo) {
  alternarPlano("z", forcarAtivo);
}

function alternarPlano(eixo, forcarAtivo) {
  let ativo = true;

  const imgOff = document.getElementById(`${eixo}plane`);

  if (typeof forcarAtivo === "boolean") {
    ativo = forcarAtivo;
  } else if (imgOff) {
    ativo = imgOff.style.visibility !== "hidden";
  }

  atualizarEstadoPlano(eixo, ativo);

  if (window.presenter && typeof presenter.setClippingXYZ === "function") {
    const x = document.getElementById("xplane_on").style.visibility === "visible" ? 1 : 0;
    const y = document.getElementById("yplane_on").style.visibility === "visible" ? 1 : 0;
    const z = document.getElementById("zplane_on").style.visibility === "visible" ? 1 : 0;
    presenter.setClippingXYZ(x, y, z);
  }

  repintar3DHOP();
}

function atualizarEstadoPlano(eixo, ativo) {
  const imgOff = document.getElementById(`${eixo}plane`);
  const imgOn = document.getElementById(`${eixo}plane_on`);

  if (imgOff) {
    imgOff.style.visibility = ativo ? "hidden" : "visible";
  }

  if (imgOn) {
    imgOn.style.visibility = ativo ? "visible" : "hidden";
  }
}

function alternarIcone(idOff, idOn, ativo) {
  const off = document.getElementById(idOff);
  const on = document.getElementById(idOn);

  if (off) {
    off.style.visibility = ativo ? "hidden" : "visible";
  }

  if (on) {
    on.style.visibility = ativo ? "visible" : "hidden";
  }
}

function alternarTelaCheia() {
  const viewer = document.getElementById("3dhop");

  if (!viewer) {
    return;
  }

  if (!document.fullscreenElement) {
    if (viewer.requestFullscreen) {
      viewer.requestFullscreen();
    } else if (viewer.webkitRequestFullscreen) {
      viewer.webkitRequestFullscreen();
    } else if (viewer.msRequestFullscreen) {
      viewer.msRequestFullscreen();
    }

    alternarIcone("full", "full_on", true);
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }

    alternarIcone("full", "full_on", false);
  }

  setTimeout(() => {
    ajustarResolucaoCanvas();
    repintar3DHOP();
  }, 300);
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