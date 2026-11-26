/* =========================================================
   AstroWar: Lunar Chaos · Portal oficial
   Lógica del portal: fondo de estrellas, carga del juego
   Unity WebGL, tráiler, GDD, carrusel y navegación.
   ========================================================= */

// ---------- CONFIGURACIÓN (lo único que normalmente se edita) ----------
const CONFIG = {
  // Carpeta donde Unity genera la compilación Web y nombre de sus archivos.
  // Si compilas en PortalWeb/juego, Unity nombra los archivos "juego.*".
  carpetaJuego: "juego",
  nombreBuild: "juego",

  // Datos que Unity muestra en consola y usa para PlayerPrefs (IndexedDB).
  companyName: "Warlings",
  productName: "AstroWar Lunar Chaos",
  productVersion: "1.0",

  // Resolución interna máxima respecto a la pantalla (1 = nativa; baja si va lento).
  maxPixelRatio: 1,

  // Tráiler: pega aquí el ID de YouTube (lo que va después de "v=").
  // Si queda vacío, se usa el archivo media/trailer.mp4 si existe.
  trailerYoutubeId: "",
  trailerMp4: "media/trailer.mp4",

  // Ruta del GDD final en PDF.
  gddPdf: "docs/GDD_AstroWar_Lunar_Chaos.pdf",
};

// ---------- Utilidades ----------
const $ = (sel) => document.querySelector(sel);

// Comprueba si un archivo existe en el servidor (HEAD, sin descargarlo).
async function existe(url) {
  try {
    const r = await fetch(url, { method: "HEAD", cache: "no-store" });
    return r.ok;
  } catch {
    return false;
  }
}

// ---------- Fondo de estrellas animado ----------
(function estrellas() {
  const canvas = $("#estrellas");
  const ctx = canvas.getContext("2d");
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w, h, lista = [], fugaz = null;

  function crear() {
    w = canvas.width = innerWidth * devicePixelRatio;
    h = canvas.height = innerHeight * devicePixelRatio;
    const total = Math.round((innerWidth * innerHeight) / 5000);
    lista = Array.from({ length: total }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (Math.random() * 1.3 + 0.3) * devicePixelRatio,
      fase: Math.random() * Math.PI * 2,
      vel: Math.random() * 0.02 + 0.005,
      capa: Math.random() * 0.4 + 0.1,
    }));
  }

  function dibujar(t) {
    ctx.clearRect(0, 0, w, h);
    const desp = scrollY * devicePixelRatio;
    for (const s of lista) {
      const a = 0.45 + Math.sin(s.fase + t * s.vel * 0.1) * 0.4;
      const y = (((s.y - desp * s.capa) % h) + h) % h; // paralaje suave
      ctx.globalAlpha = a;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Estrella fugaz ocasional
    if (!fugaz && Math.random() < 0.004) {
      fugaz = { x: Math.random() * w * 0.7, y: Math.random() * h * 0.3, v: 14 * devicePixelRatio, vida: 1 };
    }
    if (fugaz) {
      ctx.globalAlpha = fugaz.vida;
      const g = ctx.createLinearGradient(fugaz.x, fugaz.y, fugaz.x - 120, fugaz.y - 50);
      g.addColorStop(0, "#fff");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 2 * devicePixelRatio;
      ctx.beginPath();
      ctx.moveTo(fugaz.x, fugaz.y);
      ctx.lineTo(fugaz.x - 120, fugaz.y - 50);
      ctx.stroke();
      fugaz.x += fugaz.v;
      fugaz.y += fugaz.v * 0.42;
      fugaz.vida -= 0.02;
      if (fugaz.vida <= 0) fugaz = null;
    }
    ctx.globalAlpha = 1;
    if (!reducir && !juegoActivo) requestAnimationFrame(dibujar);
  }

  let juegoActivo = false;
  // Pausa el fondo mientras se juega para no restar rendimiento al juego.
  window.pausarEstrellas = (v) => {
    juegoActivo = v;
    if (!v && !reducir) requestAnimationFrame(dibujar);
  };

  addEventListener("resize", crear);
  crear();
  requestAnimationFrame(dibujar);
})();

// ---------- Navegación ----------
(function navegacion() {
  const nav = $("#nav");
  const btn = $("#btnMenu");
  const links = $("#navLinks");

  addEventListener("scroll", () => nav.classList.toggle("nav--solida", scrollY > 40), { passive: true });

  btn.addEventListener("click", () => {
    const abierto = links.classList.toggle("abierto");
    nav.classList.toggle("nav--abierta", abierto);
    btn.setAttribute("aria-expanded", abierto);
  });
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      links.classList.remove("abierto");
      nav.classList.remove("nav--abierta");
      btn.setAttribute("aria-expanded", "false");
    })
  );

  // Resalta el enlace de la sección visible
  const secciones = [...document.querySelectorAll("main section[id]")];
  const obs = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          links.querySelectorAll("a").forEach((a) =>
            a.classList.toggle("activo", a.getAttribute("href") === "#" + e.target.id)
          );
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  secciones.forEach((s) => obs.observe(s));
})();

// ---------- Aparición al hacer scroll ----------
(function revelar() {
  const elementos = document.querySelectorAll(
    ".seccion__cabecera, .rasgo, .modo, .reglas, .arma, .control, .carrusel, .tripulante, .gdd, .trailer"
  );
  const obs = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  elementos.forEach((el, i) => {
    el.classList.add("revelar");
    el.style.transitionDelay = (i % 5) * 70 + "ms";
    obs.observe(el);
  });
})();

// ---------- Juego Unity WebGL ----------
(function juego() {
  const canvas = $("#unity-canvas");
  const portada = $("#juegoPortada");
  const carga = $("#juegoCarga");
  const errorBox = $("#juegoError");
  const relleno = $("#barraRelleno");
  const barra = $("#barraCarga");
  const porcentaje = $("#cargaPorcentaje");
  const texto = $("#cargaTexto");
  const btnIniciar = $("#btnIniciar");
  const btnFull = $("#btnPantallaCompleta");
  let instancia = null;

  const base = `${CONFIG.carpetaJuego}/Build/${CONFIG.nombreBuild}`;
  const frases = ["Preparando el despegue…", "Calibrando la gravedad lunar…", "Cargando el arsenal…", "Fracturando mesetas…", "Despertando a la CPU…"];

  function mostrarError(msg) {
    carga.hidden = true;
    portada.hidden = true;
    errorBox.hidden = false;
    $("#errorTexto").textContent = msg;
  }

  // Detecta la extensión con la que Unity comprimió los archivos.
  // .unityweb = Decompression Fallback activado (recomendado para GitHub Pages).
  async function detectarExtension() {
    for (const ext of [".unityweb", ".gz", ".br", ""]) {
      if (await existe(`${base}.data${ext}`)) return ext;
    }
    return null;
  }

  function cargarScript(src) {
    return new Promise((ok, falla) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = ok;
      s.onerror = () => falla(new Error("No se encontró " + src));
      document.body.appendChild(s);
    });
  }

  async function iniciar() {
    btnIniciar.disabled = true;
    portada.hidden = true;
    carga.hidden = false;

    if (location.protocol === "file:") {
      mostrarError("Abre el portal desde un servidor (GitHub Pages o el archivo probar_local.bat), no con doble clic en index.html.");
      return;
    }

    const ext = await detectarExtension();
    if (ext === null) {
      mostrarError(`No se encontró la compilación en "${CONFIG.carpetaJuego}/Build/". Exporta el juego desde Unity a la carpeta PortalWeb/${CONFIG.carpetaJuego}.`);
      return;
    }

    try {
      await cargarScript(`${base}.loader.js`);
    } catch (e) {
      mostrarError(e.message);
      return;
    }

    let fraseIdx = 0;
    const rotador = setInterval(() => {
      fraseIdx = (fraseIdx + 1) % frases.length;
      texto.textContent = frases[fraseIdx];
    }, 1800);

    const config = {
      dataUrl: `${base}.data${ext}`,
      frameworkUrl: `${base}.framework.js${ext}`,
      codeUrl: `${base}.wasm${ext}`,
      streamingAssetsUrl: `${CONFIG.carpetaJuego}/StreamingAssets`,
      companyName: CONFIG.companyName,
      productName: CONFIG.productName,
      productVersion: CONFIG.productVersion,
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, CONFIG.maxPixelRatio),
      showBanner: (msg, tipo) => {
        if (tipo === "error") mostrarError(msg);
        else console.warn(msg);
      },
    };

    try {
      instancia = await createUnityInstance(canvas, config, (p) => {
        const v = Math.round(p * 100);
        relleno.style.width = v + "%";
        porcentaje.textContent = v + " %";
        barra.setAttribute("aria-valuenow", v);
      });
      clearInterval(rotador);
      carga.hidden = true;
      btnFull.disabled = false;
      window.pausarEstrellas(true);
      canvas.focus();
    } catch (e) {
      clearInterval(rotador);
      mostrarError(String(e));
    }
  }

  btnIniciar.addEventListener("click", iniciar);
  btnFull.addEventListener("click", () => instancia && instancia.SetFullscreen(1));

  // Evita que la rueda, el espacio y el clic derecho muevan la página mientras se juega.
  canvas.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("pointerdown", () => canvas.focus());
  addEventListener("keydown", (e) => {
    if (document.activeElement === canvas && ["Space", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.code)) {
      e.preventDefault();
    }
  });
})();

// ---------- Tráiler ----------
(async function trailer() {
  const cont = $("#trailerContenedor");
  const pronto = $("#trailerPronto");

  if (CONFIG.trailerYoutubeId) {
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${CONFIG.trailerYoutubeId}?rel=0&modestbranding=1`;
    f.title = "Tráiler de AstroWar: Lunar Chaos";
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.allowFullscreen = true;
    f.loading = "lazy";
    pronto.remove();
    cont.appendChild(f);
    return;
  }

  if (CONFIG.trailerMp4 && (await existe(CONFIG.trailerMp4))) {
    const v = document.createElement("video");
    v.src = CONFIG.trailerMp4;
    v.controls = true;
    v.preload = "metadata";
    v.playsInline = true;
    pronto.remove();
    cont.appendChild(v);
  }
})();

// ---------- GDD ----------
(async function gdd() {
  const btns = [$("#btnGdd"), $("#btnGddVer")];
  btns.forEach((b) => (b.href = CONFIG.gddPdf));
  if (!(await existe(CONFIG.gddPdf))) {
    btns.forEach((b) => b.classList.add("desactivado"));
    $("#gddEstado").hidden = false;
  }
})();

// ---------- Carrusel del tutorial ----------
(function carrusel() {
  const pista = $("#carruselPista");
  const imgs = pista.querySelectorAll("img");
  const puntos = $("#carruselPuntos");
  let i = 0;
  let auto;

  imgs.forEach((_, n) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", `Ir a la diapositiva ${n + 1}`);
    b.addEventListener("click", () => ir(n, true));
    puntos.appendChild(b);
  });

  function ir(n, manual) {
    i = (n + imgs.length) % imgs.length;
    pista.style.transform = `translateX(-${i * 100}%)`;
    puntos.querySelectorAll("button").forEach((b, k) => b.classList.toggle("activo", k === i));
    if (manual) reiniciar();
  }
  function reiniciar() {
    clearInterval(auto);
    auto = setInterval(() => ir(i + 1), 5000);
  }

  $("#carruselAnt").addEventListener("click", () => ir(i - 1, true));
  $("#carruselSig").addEventListener("click", () => ir(i + 1, true));
  ir(0);
  reiniciar();
})();
