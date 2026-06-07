let presenter = null;
window.presenter = presenter;

let monumentoAtual = null;
let metadadosVisiveis = false;
let anotacoesVisiveis = false;
let hotspotsVisiveis = false;

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
      "Modelo carregado. Use a barra lateral para navegar, medir, anotar e editar seções."
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

        minMaxPanX: [-20.0, 20.0],
        minMaxPanY: [-20.0, 20.0],
        minMaxPanZ: [-20.0, 20.0]
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

  if (typeof measureSwitch === "function") {
    measureSwitch(false);
  }

  if (typeof sectiontoolSwitch === "function") {
    sectiontoolSwitch(false);
  }

  if (typeof presenter.enableMeasurementTool === "function") {
    presenter.enableMeasurementTool(false);
  }

  if (typeof presenter.enableLightTrackball === "function") {
    presenter.enableLightTrackball(false);
  }
}

function configurarBotoesDaInterface() {
  vincularClique("home", () => actionsToolbar("home"));
  vincularClique("info", () => actionsToolbar("info"));
  vincularClique("zoomin", () => actionsToolbar("zoomin"));
  vincularClique("zoomout", () => actionsToolbar("zoomout"));
  vincularClique("light", () => actionsToolbar("light"));
  vincularClique("light_on", () => actionsToolbar("light_on"));
  vincularClique("measure", () => actionsToolbar("measure"));
  vincularClique("measure_on", () => actionsToolbar("measure_on"));
  vincularClique("hotspot", () => actionsToolbar("hotspot"));
  vincularClique("hotspot_on", () => actionsToolbar("hotspot_on"));
  vincularClique("sections", () => actionsToolbar("sections"));
  vincularClique("sections_on", () => actionsToolbar("sections_on"));
  vincularClique("full", () => actionsToolbar("full"));
  vincularClique("full_on", () => actionsToolbar("full_on"));
}

function vincularClique(id, funcao) {
  const elemento = document.getElementById(id);

  if (!elemento) {
    return;
  }

  elemento.addEventListener("click", (evento) => {
    evento.preventDefault();
    evento.stopPropagation();
    funcao();
  });
}

function actionsToolbar(action) {
  if (!window.presenter) {
    return;
  }

  if (action === "home") {
    presenter.resetTrackball();
    desativarMedicao();
    desativarSecoes();
    atualizarStatus("Modelo recentralizado.");
    repintar3DHOP();
    return;
  }

  if (action === "info") {
    alternarPainelMetadados();
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

function alternarPainelMetadados() {
  metadadosVisiveis = !metadadosVisiveis;

  const painel = document.getElementById("metadata-panel");

  if (painel) {
    painel.classList.toggle("is-visible", metadadosVisiveis);
  }

  atualizarStatus(
    metadadosVisiveis
      ? "Painel de metadados aberto."
      : "Painel de metadados fechado."
  );
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
  hotspotsVisiveis = anotacoesVisiveis;

  const painel = document.getElementById("annotations-panel");

  if (painel) {
    painel.classList.toggle("is-visible", anotacoesVisiveis);
  }

  alternarIcone("hotspot", "hotspot_on", anotacoesVisiveis);

  if (typeof presenter.toggleSpotVisibility === "function") {
    try {
      presenter.toggleSpotVisibility(HOP_ALL, true);
    } catch (erro) {
      console.warn("Hotspots 3D não configurados para este modelo.", erro);
    }
  }

  if (typeof presenter.enableOnHover === "function") {
    try {
      presenter.enableOnHover(anotacoesVisiveis);
    } catch (erro) {
      console.warn("Hover de hotspots não configurado para este modelo.", erro);
    }
  }

  atualizarStatus(
    anotacoesVisiveis
      ? "Anotações ativadas."
      : "Anotações ocultadas."
  );

  repintar3DHOP();
}

function fecharPainelAnotacoes() {
  anotacoesVisiveis = false;
  hotspotsVisiveis = false;

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
    if (caixa) caixa.style.display = novoEstado ? "table" : "none";
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
    if (caixa) caixa.style.display = "none";
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

  const xplane = document.getElementById("xplane");
  const yplane = document.getElementById("yplane");
  const zplane = document.getElementById("zplane");

  if (xplane) xplane.style.visibility = "visible";
  if (yplane) yplane.style.visibility = "visible";
  if (zplane) zplane.style.visibility = "visible";

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
  const imgOff = document.getElementById(`${eixo}plane`);
  const imgOn = document.getElementById(`${eixo}plane_on`);

  let ativo = true;

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