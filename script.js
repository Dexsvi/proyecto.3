/* ==========================================================
   CONFIGURACIÓN DE FIREBASE
   ========================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyAU7IJJALP0bX-37BaaS9XiSLP6ntTgdCw",
  authDomain: "plumasrutas.firebaseapp.com",
  projectId: "plumasrutas",
  storageBucket: "plumasrutas.firebasestorage.app",
  messagingSenderId: "1002997976007",
  appId: "1:1002997976007:web:efb005a995e79a8a76e7e2",
  measurementId: "G-NE5WFTGF82"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== 'undefined') ? firebase.firestore() : null;

/* ==========================================================
   CONFIGURACIÓN DE DATOS INICIALES Y USUARIOS
   ========================================================== */
const USUARIOS_DEFAULT = [
  { id: 1, nombre: "Administrador", correo: "admin@sistema.cl", telefono: "+56911111111", usuario: "admin", clave: "1234", fechaReg: "2026-03-01" },
  { id: 2, nombre: "Luciano González", correo: "luciano@sistema.cl", telefono: "+56922222222", usuario: "luciano", clave: "12345678", fechaReg: "2026-03-05" }
];

async function obtenerUsuarios() {
  if (db) {
    try {
      const snapshot = await db.collection("usuarios").get();
      if (!snapshot.empty) {
        let lista = [];
        snapshot.forEach(doc => {
          lista.push({ firestoreId: doc.id, ...doc.data() });
        });
        return lista;
      }
    } catch (e) {
      console.warn("Usando localStorage para usuarios por fallo de Firebase");
    }
  }
  const guardados = localStorage.getItem("usuarios_sistema");
  if (!guardados) {
    localStorage.setItem("usuarios_sistema", JSON.stringify(USUARIOS_DEFAULT));
    return USUARIOS_DEFAULT;
  }
  return JSON.parse(guardados);
}

const SEED_CATEGORIAS = ["Cafeterías", "Librerías", "Aire Libre", "Entretenimiento"];

const LUGARES_DEFAULT = [
  { id: 1, nombre: "Cafetería Estado", categoria: "Cafeterías", ubicacion: "Calle Estado, Rancagua", foto: "lugaresimagenes/CafeteriaEstado.jpg" },
  { id: 2, nombre: "Coffee Street", categoria: "Cafeterías", ubicacion: "Paseo Independencia, Rancagua", foto: "lugaresimagenes/Coffee Street.jpg" },
  { id: 3, nombre: "Filippo", categoria: "Cafeterías", ubicacion: "Mall Plaza América, Rancagua", foto: "lugaresimagenes/Filippo.jpg" },
  { id: 7, nombre: "Caza del Libro", categoria: "Librerías", ubicacion: "Calle Bueras, Rancagua", foto: "lugaresimagenes/CazaDelLibro.jpg" },
  { id: 8, nombre: "Librería Cervantes", categoria: "Librerías", ubicacion: "Calle Campos, Rancagua", foto: "lugaresimagenes/Librería Cervantes.jpg" },
  { id: 10, nombre: "Parque Koke", categoria: "Aire Libre", ubicacion: "Sector Norte, Rancagua", foto: "lugaresimagenes/ParqueKoke.jpg" },
  { id: 11, nombre: "Polideportivo Parque Lourdes", categoria: "Aire Libre", ubicacion: "Av. Diagonal Doñihue, Rancagua", foto: "lugaresimagenes/Polideportivo.jpg" },
  { id: 12, nombre: "Kid Center", categoria: "Entretenimiento", ubicacion: "Miguel Ramírez 184, Rancagua", foto: "lugaresimagenes/KidCenter.jpg" },
  { id: 13, nombre: "Pool Rancagua", categoria: "Entretenimiento", ubicacion: "Sta. María 320, Rancagua", foto: "lugaresimagenes/PoolRancagua.jpg" },
  { id: 14, nombre: "Cinemark Open Plaza", categoria: "Entretenimiento", ubicacion: "Teniente Coronel José Bernardo Cuevas 405, Rancagua", foto: "lugaresimagenes/CineMarkOpenPlaza.jpg" }
];

async function obtenerLugares() {
  if (db) {
    try {
      const snapshot = await db.collection("lugares").get();
      if (!snapshot.empty) {
        let lista = [];
        snapshot.forEach(doc => {
          lista.push({ firestoreId: doc.id, ...doc.data() });
        });
        return lista;
      }
    } catch (e) {
      console.warn("Usando localStorage para lugares por fallo de Firebase");
    }
  }
  const guardados = localStorage.getItem("lugares_sistema");
  if (!guardados) {
    localStorage.setItem("lugares_sistema", JSON.stringify(LUGARES_DEFAULT));
    return LUGARES_DEFAULT;
  }
  return JSON.parse(guardados);
}

function guardarLugares(lista) {
  localStorage.setItem("lugares_sistema", JSON.stringify(lista));
}

/* ==========================================================
   SEGURIDAD, SESIÓN Y REGISTRO DE USUARIOS
   ========================================================== */
let intentosFallidos = 0;
const MAX_INTENTOS = 3;
const TIEMPO_BLOQUEO = 30 * 1000;

async function iniciarSesion() {
  const inputUsuario = document.getElementById("nombreUsuario")?.value?.trim();
  const inputClave = document.getElementById("claveUsuario")?.value?.trim();
  const btnEntrar = document.querySelector("form button[type='submit']");

  if (!inputUsuario || !inputClave) {
    alert("Por favor completa todos los campos.");
    return;
  }

  const usuarios = await obtenerUsuarios();
  const cuentaValida = usuarios.find(
    u => u.usuario.toLowerCase() === inputUsuario.toLowerCase() && u.clave === inputClave
  );

  if (cuentaValida) {
    intentosFallidos = 0;
    localStorage.setItem("usuarioActivo", cuentaValida.usuario);
    window.location.href = "categorias.html";
  } else {
    intentosFallidos++;
    const restantes = MAX_INTENTOS - intentosFallidos;

    if (intentosFallidos >= MAX_INTENTOS) {
      alert("Has superado los 3 intentos permitidos. Acceso bloqueado por 30 segundos.");
      if (btnEntrar) btnEntrar.disabled = true;

      setTimeout(() => {
        intentosFallidos = 0;
        if (btnEntrar) btnEntrar.disabled = false;
        alert("Ya puedes intentar iniciar sesión nuevamente.");
      }, TIEMPO_BLOQUEO);
    } else {
      alert(`Credenciales incorrectas. Te quedan ${restantes} intento(s).`);
    }
  }
}

async function registrarUsuario(event) {
  if (event) event.preventDefault();

  const nombre = document.getElementById("regNombre")?.value?.trim() || "";
  const correo = document.getElementById("regCorreo")?.value?.trim() || "";
  const telefono = document.getElementById("regTelefono")?.value?.trim() || "";
  const usuario = document.getElementById("regUsuario")?.value?.trim();
  const clave = document.getElementById("regClave")?.value?.trim();

  if (!usuario || !clave) {
    alert("El nombre de usuario y la contraseña son obligatorios.");
    return;
  }

  const usuarios = await obtenerUsuarios();
  const existe = usuarios.some(u => u.usuario.toLowerCase() === usuario.toLowerCase());
  if (existe) {
    alert("El nombre de usuario ya está en uso. Elige otro.");
    return;
  }

  const nuevoUsuario = {
    id: usuarios.length ? Math.max(...usuarios.map(u => parseInt(u.id) || 0)) + 1 : 1,
    nombre,
    correo,
    telefono,
    usuario,
    clave,
    fechaReg: new Date().toISOString().split('T')[0]
  };

  if (db) {
    try {
      await db.collection("usuarios").add(nuevoUsuario);
    } catch (e) {
      console.warn("Guardando usuario localmente por fallo en nube");
    }
  }

  usuarios.push(nuevoUsuario);
  localStorage.setItem("usuarios_sistema", JSON.stringify(usuarios));

  alert("¡Registro exitoso! Ya puedes iniciar sesión.");
  window.location.href = "index.html";
}

function cerrarSesion() {
  localStorage.removeItem("usuarioActivo");
  sessionStorage.removeItem("captcha_aprobado");
  window.location.href = "captcha.html";
}

function mostrarUsuarioEnPantalla() {
  const usuario = localStorage.getItem("usuarioActivo");
  const el = document.getElementById("usuarioActivo");
  if (el) {
    if (usuario) {
      el.innerText = "Usuario logeado: " + usuario;
      el.style.fontWeight = "bold";
      el.style.color = "#0056b3";
      el.style.marginBottom = "15px";
    } else {
      el.innerText = "Usuario: No identificado";
      el.style.color = "#6c757d";
      el.style.marginBottom = "15px";
    }
  }
}

function ensureAuthOrRedirect() {
  const u = localStorage.getItem("usuarioActivo");
  if (!u) {
    window.location.href = "index.html";
    return null;
  }
  mostrarUsuarioEnPantalla();
  return u;
}

function verificarPermisosAdmin() {
  const user = localStorage.getItem("usuarioActivo");
  const btnReportes = document.getElementById("btnReportes");
  if (btnReportes) {
    if (user && user.toLowerCase() === "admin") {
      btnReportes.style.display = "inline-block";
    } else {
      btnReportes.style.display = "none";
    }
  }
}

/* ==========================================================
   CARRUSEL, CATÁLOGO Y GOOGLE MAPS
   ========================================================== */
let carruselLugares = [];
let carruselIndex = 0;

async function cargarCategorias() {
  if (!ensureAuthOrRedirect()) return;

  const cont = document.getElementById("listaCategorias");
  if (!cont) return;
  cont.innerHTML = "";

  SEED_CATEGORIAS.forEach(c => {
    const b = document.createElement("button");
    b.innerText = c;
    b.onclick = () => prepararCarrusel(c);
    cont.appendChild(b);
  });

  if (SEED_CATEGORIAS.length > 0) {
    await prepararCarrusel(SEED_CATEGORIAS[0]);
  }

  await mostrarGaleriaCompleta();
}

async function mostrarGaleriaCompleta() {
  const galeria = document.getElementById("galeriaCompleta");
  if (!galeria) return;

  const lugares = await obtenerLugares();
  galeria.innerHTML = "";

  lugares.forEach(lugar => {
    const rutaImagen = lugar.foto || "https://via.placeholder.com/200x120?text=Sin+Foto";
    const item = document.createElement("div");
    item.className = "tarjeta-catalogo";
    item.innerHTML = `
      <img src="${rutaImagen}" alt="${lugar.nombre}" onerror="this.src='https://via.placeholder.com/200x120?text=Imagen+No+Disponible'">
      <h4>${lugar.nombre}</h4>
      <p><b>Categoría:</b> ${lugar.categoria}</p>
      <p>📍 ${lugar.ubicacion}</p>
      <button onclick="irAReseñas(${lugar.id}, '${lugar.nombre}')" style="background:#007bff; color:white; border:none; padding:6px 10px; width:100%; border-radius:4px; cursor:pointer; margin-top:6px; font-size:12px; font-weight:bold;">Ver Reseñas</button>
    `;
    galeria.appendChild(item);
  });
}

async function prepararCarrusel(categoria) {
  const lista = document.getElementById("listaLugares");
  const tit = document.getElementById("tituloLugares");
  if (tit) tit.innerText = "Lugares de " + categoria;
  if (!lista) return;

  const todos = await obtenerLugares();
  carruselLugares = todos.filter(l => l.categoria === categoria);
  carruselIndex = 0;

  if (carruselLugares.length === 0) {
    lista.innerHTML = "<p>No hay lugares disponibles en esta categoría.</p>";
    return;
  }

  renderizarCarrusel();
}

function renderizarCarrusel() {
  const lista = document.getElementById("listaLugares");
  const lugar = carruselLugares[carruselIndex];
  if (!lista || !lugar) return;

  const rutaImagen = lugar.foto || "https://via.placeholder.com/300?text=Sin+Foto";
  const nombresLugares = carruselLugares.map(l => l.nombre + " Rancagua").join(" | ");
  const queryGoogleMaps = encodeURIComponent(nombresLugares);

  lista.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:15px; background:#fff; padding:20px; border:1px solid #ddd; border-radius:10px; margin:auto; max-width:650px;">
      <div style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:15px;">
        <button onclick="cambiarLugar(-1)" style="background:#333; color:white; border:none; padding:12px 18px; border-radius:50%; cursor:pointer; font-size:18px;">&#10094;</button>
        <div style="text-align:center; flex:1;">
          <img src="${rutaImagen}" style="width:100%; max-width:280px; height:180px; object-fit:cover; border-radius:8px;" onerror="this.src='https://via.placeholder.com/300?text=Imagen+No+Encontrada'">
          <h3 style="margin:10px 0; color:#0056b3;">${lugar.nombre}</h3>
          <p style="margin:5px 0; color:#666; font-size:14px;">📍 ${lugar.ubicacion || 'Sin dirección'}</p>
          <p style="font-size:12px; color:#999;">${carruselIndex + 1} / ${carruselLugares.length}</p>
          <button onclick="irAReseñas(${lugar.id}, '${lugar.nombre}')" style="background:#007bff; color:white; border:none; padding:10px; width:100%; border-radius:5px; cursor:pointer; margin-top:5px; font-weight:bold;">Ver y Calificar</button>
        </div>
        <button onclick="cambiarLugar(1)" style="background:#333; color:white; border:none; padding:12px 18px; border-radius:50%; cursor:pointer; font-size:18px;">&#10095;</button>
      </div>

      <div style="width:100%; margin-top:15px; text-align:left;">
        <h4 style="margin: 0 0 10px 0; color:#333; font-size:15px;">🗺️ Google Maps — Locales de esta categoría:</h4>
        <iframe 
          width="100%" 
          height="280" 
          style="border:0; border-radius:8px;" 
          loading="lazy" 
          allowfullscreen 
          src="https://maps.google.com/maps?q=${queryGoogleMaps}&t=&z=13&ie=UTF8&iwloc=&output=embed">
        </iframe>
      </div>
    </div>
  `;
}

function cambiarLugar(direccion) {
  carruselIndex += direccion;
  if (carruselIndex < 0) carruselIndex = carruselLugares.length - 1;
  if (carruselIndex >= carruselLugares.length) carruselIndex = 0;
  renderizarCarrusel();
}

function irAReseñas(id, nombre) {
  localStorage.setItem("lugarSeleccionadoId", id);
  localStorage.setItem("lugarSeleccionadoNombre", nombre);
  window.location.href = "reseñas.html";
}

function irCategorias() {
  window.location.href = "categorias.html";
}

/* ==========================================================
   GESTIÓN DE RESEÑAS
   ========================================================== */
async function obtenerReseñasLocales() {
  if (db) {
    try {
      const snapshot = await db.collection("reseñas").get();
      let lista = [];
      snapshot.forEach(doc => {
        lista.push({ firestoreId: doc.id, ...doc.data() });
      });
      return lista;
    } catch (e) {
      console.warn("Usando localStorage para reseñas por fallo de Firebase");
    }
  }
  return JSON.parse(localStorage.getItem("reseñas_locales")) || [];
}

async function agregarReseña() {
  const txt = document.getElementById("comentario")?.value?.trim();
  const cal = parseInt(document.getElementById("calificacion")?.value);
  const user = localStorage.getItem("usuarioActivo") || "Anonimo";
  const idLugar = parseInt(localStorage.getItem("lugarSeleccionadoId"));

  if (!txt || isNaN(cal) || cal < 1 || cal > 5) {
    alert("Por favor ingresa un comentario y una calificación entre 1 y 5.");
    return;
  }

  const nuevaReseña = {
    id: Date.now(),
    idLugar: idLugar,
    usuario: user,
    comentario: txt,
    calificacion: cal,
    fecha: new Date().toISOString()
  };

  if (db) {
    try {
      await db.collection("reseñas").add(nuevaReseña);
    } catch (e) {
      console.warn("Guardando en localStorage por fallo de red");
    }
  }

  const reseñas = JSON.parse(localStorage.getItem("reseñas_locales")) || [];
  reseñas.push(nuevaReseña);
  localStorage.setItem("reseñas_locales", JSON.stringify(reseñas));

  alert("¡Reseña guardada exitosamente!");
  document.getElementById("comentario").value = "";
  document.getElementById("calificacion").value = "";
  cargarReseñasPorLugar();
}

async function cargarReseñasPorLugar() {
  if (!ensureAuthOrRedirect()) return;

  const lid = parseInt(localStorage.getItem("lugarSeleccionadoId"));
  const lnom = localStorage.getItem("lugarSeleccionadoNombre") || "Lugar";
  const titulo = document.getElementById("tituloLugar");
  if (titulo) titulo.innerText = "Reseñas — " + lnom;

  const ul = document.getElementById("listaReseñas");
  if (!ul) return;
  ul.innerHTML = "";

  const todasReseñas = await obtenerReseñasLocales();
  const reseñas = todasReseñas.filter(r => r.idLugar === lid);

  let suma = 0;
  reseñas.forEach(r => {
    suma += r.calificacion;
    ul.innerHTML += `<li><b>${r.usuario}</b>: "${r.comentario}" ⭐ ${r.calificacion}</li>`;
  });

  const promedioEl = document.getElementById("promedio");
  const conteoEl = document.getElementById("conteo");

  if (promedioEl) {
    promedioEl.innerText = "Promedio de calificaciones: " + (reseñas.length ? (suma / reseñas.length).toFixed(1) : "—");
  }
  if (conteoEl) {
    conteoEl.innerText = "Total de reseñas: " + reseñas.length;
  }
}

/* ==========================================================
   CRUD COMPLETO Y PANEL ADMIN
   ========================================================== */
let chartInstance = null;

async function cargarBDAdmin() {
  if (!ensureAuthOrRedirect()) return;

  const user = localStorage.getItem("usuarioActivo");
  if (!user || user.toLowerCase() !== "admin") {
    alert("Acceso denegado: Se requieren permisos de administrador.");
    window.location.href = "categorias.html";
    return;
  }

  await listarReseñasAdmin();
  await listarUsuariosAdmin();
  await listarLugaresAdmin();
  prepararFiltroPorLugar();
}

async function listarUsuariosAdmin() {
  const tbody = document.getElementById("listaUsuarios");
  const totalSpan = document.getElementById("totalUsuarios");
  const usuarios = await obtenerUsuarios();

  if (totalSpan) totalSpan.innerText = usuarios.length;
  if (!tbody) return;

  tbody.innerHTML = "";
  usuarios.forEach(u => {
    tbody.innerHTML += `
      <tr>
        <td>${u.id}</td>
        <td><b>${u.usuario}</b><br><small>${u.nombre || 'Sin nombre'}</small></td>
        <td>${u.fechaReg || '2026-03-01'}</td>
        <td>
          <button class="btn-edit" onclick="abrirEditarUsuario('${u.firestoreId || u.id}')">Modificar</button>
          <button class="btn-danger" onclick="eliminarUsuarioAdmin('${u.firestoreId || u.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

async function abrirEditarUsuario(id) {
  let u = null;
  const usuarios = await obtenerUsuarios();
  u = usuarios.find(user => (user.firestoreId == id || user.id == id));
  if (!u) return;

  document.getElementById("editUserId").value = u.firestoreId || u.id;
  document.getElementById("editNombre").value = u.nombre || "";
  document.getElementById("editCorreo").value = u.correo || "";
  document.getElementById("editTelefono").value = u.telefono || "";
  document.getElementById("editUsuario").value = u.usuario || "";
  document.getElementById("editClave").value = u.clave || "";

  const seccion = document.getElementById("seccionEditarUsuario");
  if (seccion) {
    seccion.style.display = "block";
    seccion.scrollIntoView({ behavior: 'smooth' });
  }
}

async function guardarCambiosUsuario() {
  const idRef = document.getElementById("editUserId").value;
  const nombre = document.getElementById("editNombre").value.trim();
  const correo = document.getElementById("editCorreo").value.trim();
  const telefono = document.getElementById("editTelefono").value.trim();
  const usuario = document.getElementById("editUsuario").value.trim();
  const clave = document.getElementById("editClave").value.trim();

  if (!usuario || !clave) {
    alert("El nombre de usuario y la contraseña son obligatorios.");
    return;
  }

  if (db && isNaN(idRef)) {
    try {
      await db.collection("usuarios").doc(idRef).update({ nombre, correo, telefono, usuario, clave });
    } catch (e) {
      console.warn("Fallo al actualizar en Firebase, actualizando localmente");
    }
  }

  let usuarios = await obtenerUsuarios();
  usuarios = usuarios.map(u => (u.firestoreId == idRef || u.id == idRef) ? { ...u, nombre, correo, telefono, usuario, clave } : u);
  localStorage.setItem("usuarios_sistema", JSON.stringify(usuarios));

  alert("¡Datos del usuario actualizados correctamente!");
  document.getElementById("seccionEditarUsuario").style.display = "none";
  await listarUsuariosAdmin();
}

function cancelarEdicionUsuario() {
  const seccion = document.getElementById("seccionEditarUsuario");
  if (seccion) seccion.style.display = "none";
}

async function eliminarUsuarioAdmin(id) {
  let usuarios = await obtenerUsuarios();
  const usuarioObj = usuarios.find(u => (u.firestoreId == id || u.id == id));

  if (usuarioObj && usuarioObj.usuario.toLowerCase() === "admin") {
    alert("No se puede eliminar al usuario administrador principal.");
    return;
  }

  if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
    if (db && isNaN(id)) {
      try {
        await db.collection("usuarios").doc(id).delete();
      } catch (e) {
        console.warn("Error borrando en Firebase");
      }
    }
    usuarios = usuarios.filter(u => u.firestoreId != id && u.id != id);
    localStorage.setItem("usuarios_sistema", JSON.stringify(usuarios));

    alert("¡Usuario eliminado correctamente!");
    await listarUsuariosAdmin();
  }
}

async function listarReseñasAdmin() {
  const tbody = document.getElementById("listadoGlobal");
  const totalSpan = document.getElementById("totalReseñas");
  if (!tbody) return;

  const reseñas = await obtenerReseñasLocales();
  const lugares = await obtenerLugares();
  if (totalSpan) totalSpan.innerText = reseñas.length;

  tbody.innerHTML = "";
  reseñas.forEach((r, index) => {
    const lugarObj = lugares.find(l => l.id == r.idLugar);
    const nombreLugar = lugarObj ? lugarObj.nombre : "Lugar #" + r.idLugar;

    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${r.usuario}</td>
        <td>${nombreLugar}</td>
        <td>${r.comentario}</td>
        <td>⭐ ${r.calificacion}</td>
        <td>${r.fecha ? new Date(r.fecha).toLocaleDateString() : 'Reciente'}</td>
        <td>
          <button class="btn-edit" onclick="editarReseñaAdmin('${r.firestoreId || index}')">Editar</button>
          <button class="btn-danger" onclick="eliminarReseñaAdmin('${r.firestoreId || index}')">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

async function editarReseñaAdmin(id) {
  let reseñas = await obtenerReseñasLocales();
  let actual = isNaN(id) ? reseñas.find(r => r.firestoreId == id) : reseñas[id];
  if (!actual) return;

  const nuevoComentario = prompt("Modificar comentario:", actual.comentario);
  if (nuevoComentario === null) return;

  const nuevaCalificacion = prompt("Modificar calificación (1-5):", actual.calificacion);
  if (nuevaCalificacion === null) return;

  const calNum = parseInt(nuevaCalificacion);
  if (isNaN(calNum) || calNum < 1 || calNum > 5) {
    alert("Calificación inválida.");
    return;
  }

  actual.comentario = nuevoComentario.trim();
  actual.calificacion = calNum;

  if (db && isNaN(id)) {
    try {
      await db.collection("reseñas").doc(id).update({ comentario: actual.comentario, calificacion: actual.calificacion });
    } catch (e) {
      console.warn("Error actualizando en nube");
    }
  }

  localStorage.setItem("reseñas_locales", JSON.stringify(reseñas));
  alert("Reseña actualizada correctamente.");
  await listarReseñasAdmin();
}

async function eliminarReseñaAdmin(id) {
  if (confirm("¿Estás seguro de eliminar esta reseña?")) {
    if (db && isNaN(id)) {
      try {
        await db.collection("reseñas").doc(id).delete();
      } catch (e) {
        console.warn("Error borrando en nube");
      }
    }
    let reseñas = await obtenerReseñasLocales();
    if (isNaN(id)) {
      reseñas = reseñas.filter(r => r.firestoreId != id);
    } else {
      reseñas.splice(id, 1);
    }
    localStorage.setItem("reseñas_locales", JSON.stringify(reseñas));
    await listarReseñasAdmin();
  }
}

async function listarLugaresAdmin() {
  const tbody = document.getElementById("listaLugaresAdmin");
  if (!tbody) return;

  const lugares = await obtenerLugares();
  tbody.innerHTML = "";
  lugares.forEach(lugar => {
    tbody.innerHTML += `
      <tr>
        <td>${lugar.id}</td>
        <td>${lugar.nombre}</td>
        <td>${lugar.categoria}</td>
        <td>${lugar.ubicacion}</td>
        <td>
          <button class="btn-edit" onclick="editarLugarAdmin('${lugar.firestoreId || lugar.id}')">Editar</button>
          <button class="btn-danger" onclick="eliminarLugarAdmin('${lugar.firestoreId || lugar.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

async function crearLugar() {
  const nombre = prompt("Nombre del nuevo lugar:");
  const categoria = prompt("Categoría (Cafeterías, Librerías, Aire Libre, Entretenimiento):");
  const ubicacion = prompt("Ubicación:");

  if (!nombre || !categoria || !ubicacion) {
    alert("Todos los campos son obligatorios.");
    return;
  }

  const lugares = await obtenerLugares();
  const nuevoId = lugares.length ? Math.max(...lugares.map(l => parseInt(l.id) || 0)) + 1 : 1;
  const nuevoLugar = {
    id: nuevoId,
    nombre: nombre,
    categoria: categoria,
    ubicacion: ubicacion,
    foto: "https://via.placeholder.com/300?text=" + encodeURIComponent(nombre)
  };

  if (db) {
    try {
      await db.collection("lugares").add(nuevoLugar);
    } catch (e) {
      console.warn("Error creando en nube");
    }
  }

  lugares.push(nuevoLugar);
  guardarLugares(lugares);
  alert("¡Lugar creado exitosamente!");
  await listarLugaresAdmin();
}

async function editarLugarAdmin(id) {
  try {
    let lugares = await obtenerLugares();
    let lugar = lugares.find(l => (l.firestoreId == id || l.id == id));
    if (!lugar) return;

    const nuevoNombre = prompt("Editar nombre:", lugar.nombre);
    if (nuevoNombre === null) return;
    const nuevaCat = prompt("Editar categoría:", lugar.categoria);
    if (nuevaCat === null) return;
    const nuevaUbi = prompt("Editar ubicación:", lugar.ubicacion);
    if (nuevaUbi === null) return;

    lugar.nombre = nuevoNombre.trim();
    lugar.categoria = nuevaCat.trim();
    lugar.ubicacion = nuevaUbi.trim();

    if (db && isNaN(id)) {
      await db.collection("lugares").doc(id).update({ nombre: lugar.nombre, categoria: lugar.categoria, ubicacion: lugar.ubicacion });
    }

    guardarLugares(lugares);
    alert("Lugar actualizado.");
    await listarLugaresAdmin();
  } catch (error) {
    console.error("Error actualizando lugar:", error);
  }
}

async function eliminarLugarAdmin(id) {
  if (confirm("¿Deseas eliminar este lugar del catálogo?")) {
    if (db && isNaN(id)) {
      try {
        await db.collection("lugares").doc(id).delete();
      } catch (e) {
        console.warn("Error borrando en nube");
      }
    }
    let lugares = await obtenerLugares();
    lugares = lugares.filter(l => l.firestoreId != id && l.id != id);
    guardarLugares(lugares);
    await listarLugaresAdmin();
  }
}

async function buscarPorUsuario() {
  const query = document.getElementById("buscarUsuario")?.value.trim().toLowerCase();
  const container = document.getElementById("resultadoBusqueda");
  if (!container) return;

  const reseñas = await obtenerReseñasLocales();
  const lugares = await obtenerLugares();

  const filtradas = reseñas.filter((r, idx) => 
    (idx + 1).toString() === query || (r.usuario && r.usuario.toLowerCase().includes(query))
  );

  container.innerHTML = "";
  if (filtradas.length === 0) {
    container.innerHTML = "<tr><td colspan='6'>No se encontraron coincidencias.</td></tr>";
    return;
  }

  filtradas.forEach((r, i) => {
    const lug = lugares.find(l => l.id == r.idLugar)?.nombre || "Lugar #" + r.idLugar;
    container.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${r.usuario}</td>
        <td>${lug}</td>
        <td>${r.comentario}</td>
        <td>⭐ ${r.calificacion}</td>
        <td>${r.fecha ? new Date(r.fecha).toLocaleDateString() : ''}</td>
      </tr>
    `;
  });
}

async function filtrarRango() {
  const min = parseInt(document.getElementById("min")?.value) || 1;
  const max = parseInt(document.getElementById("max")?.value) || 5;
  const tbody = document.getElementById("resultadoRango");
  if (!tbody) return;

  const reseñas = await obtenerReseñasLocales();
  const lugares = await obtenerLugares();
  const filtradas = reseñas.filter(r => r.calificacion >= min && r.calificacion <= max);

  tbody.innerHTML = "";
  if (filtradas.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6'>No hay reseñas en este rango.</td></tr>";
    return;
  }

  filtradas.forEach((r, i) => {
    const lug = lugares.find(l => l.id == r.idLugar)?.nombre || "Lugar #" + r.idLugar;
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${r.usuario}</td>
        <td>${lug}</td>
        <td>${r.comentario}</td>
        <td>⭐ ${r.calificacion}</td>
        <td>${r.fecha ? new Date(r.fecha).toLocaleDateString() : ''}</td>
      </tr>
    `;
  });
}

async function filtrarPorFecha() {
  const inicio = document.getElementById("fechaInicio")?.value;
  const fin = document.getElementById("fechaFin")?.value;
  const tbody = document.getElementById("resultadoFechas");
  if (!tbody) return;

  if (!inicio || !fin) {
    alert("Por favor selecciona ambas fechas.");
    return;
  }

  const dInicio = new Date(inicio);
  const dFin = new Date(fin);
  dFin.setHours(23, 59, 59);

  const reseñas = await obtenerReseñasLocales();
  const lugares = await obtenerLugares();
  const filtradas = reseñas.filter(r => {
    if (!r.fecha) return false;
    const fecha = new Date(r.fecha);
    return fecha >= dInicio && fecha <= dFin;
  });

  tbody.innerHTML = "";
  if (filtradas.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6'>No hay reseñas en el rango de fechas seleccionado.</td></tr>";
    return;
  }

  filtradas.forEach((r, i) => {
    const lug = lugares.find(l => l.id == r.idLugar)?.nombre || "Lugar #" + r.idLugar;
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${r.usuario}</td>
        <td>${lug}</td>
        <td>${r.comentario}</td>
        <td>⭐ ${r.calificacion}</td>
        <td>${r.fecha ? new Date(r.fecha).toLocaleDateString() : ''}</td>
      </tr>
    `;
  });
}

async function prepararFiltroPorLugar() {
  const cont = document.getElementById("navegacionPorLugar");
  if (!cont) return;

  const lugares = await obtenerLugares();
  cont.innerHTML = "<label>Selecciona Lugar: </label>";
  const select = document.createElement("select");
  select.style.padding = "8px";
  select.style.borderRadius = "5px";

  lugares.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l.id;
    opt.innerText = l.nombre;
    select.appendChild(opt);
  });

  select.onchange = async () => {
    const id = select.value;
    const tbody = document.getElementById("reseñasReportesContainer");
    if (!tbody) return;

    const reseñas = (await obtenerReseñasLocales()).filter(r => r.idLugar == id);
    tbody.innerHTML = "";
    if (reseñas.length === 0) {
      tbody.innerHTML = "<tr><td>Sin reseñas para este lugar.</td></tr>";
      return;
    }
    reseñas.forEach(r => {
      tbody.innerHTML += `<tr><td><b>${r.usuario}</b>: "${r.comentario}" (⭐ ${r.calificacion})</td></tr>`;
    });
  };

  cont.appendChild(select);
}

async function mostrarGraficoReseñasPorLugar() {
  const cont = document.getElementById("graficoContainer");
  if (!cont) return;
  cont.style.display = cont.style.display === "none" ? "block" : "none";

  if (cont.style.display === "block") {
    const lugares = await obtenerLugares();
    const reseñas = await obtenerReseñasLocales();

    const etiquetas = lugares.map(l => l.nombre);
    const conteos = lugares.map(l => reseñas.filter(r => r.idLugar == l.id).length);

    const ctx = document.getElementById("graficoReseñas")?.getContext("2d");
    if (!ctx) return;

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: etiquetas,
        datasets: [{
          label: 'Cantidad de Reseñas',
          data: conteos,
          backgroundColor: '#007bff'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }
}

/* ==========================================================
   FOOTER DINÁMICO
   ========================================================== */
function crearFooter() {
  if (document.querySelector("footer")) return;

  const footer = document.createElement("footer");
  footer.style.backgroundColor = "#333";
  footer.style.color = "#fff";
  footer.style.textAlign = "center";
  footer.style.padding = "20px";
  footer.style.marginTop = "40px";
  footer.style.fontSize = "14px";
  footer.style.width = "100%";

  footer.innerHTML = `
    <p>&copy; 2026 Reseñas Turísticas. Todos los derechos reservados.</p>
    <div style="margin: 15px 0;">
      <p style="margin-bottom: 8px; font-weight: bold;">Síguenos en Instagram:</p>
      <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
        <a href="https://www.instagram.com/wtf.crs__?stkn=M3QxcHUyb3gyMDQ2" target="_blank" rel="noopener noreferrer" style="color: #fff; text-decoration: none; font-weight: bold;">📷 @wtf.crs__</a>
        <a href="https://www.instagram.com/xsv_vi?stkn=MTM5OGU2emJtZnB2OQ==" target="_blank" rel="noopener noreferrer" style="color: #fff; text-decoration: none; font-weight: bold;">📷 @xsv_vi</a>
        <a href="https://www.instagram.com/cchinossj?stkn=MTk3cmF4N210NzQ0dg==" target="_blank" rel="noopener noreferrer" style="color: #fff; text-decoration: none; font-weight: bold;">📷 @cchinossj</a>
      </div>
    </div>
    <p style="margin-top: 15px;">Contacto Directo:<br>
      <a href="mailto:javier.polancop@correoaiep.cl" style="color: #fff; text-decoration: none;">javier.polancop@correoaiep.cl</a><br>
      <a href="mailto:luciano.gonzalezpe@correoaiep.cl" style="color: #fff; text-decoration: none;">luciano.gonzalezpe@correoaiep.cl</a><br>
      <a href="mailto:cristobal.vidalsa@correoaiep.cl" style="color: #fff; text-decoration: none;">cristobal.vidalsa@correoaiep.cl</a>
    </p>
  `;
  document.body.appendChild(footer);
}

// EXPOSICIÓN GLOBAL
window.iniciarSesion = iniciarSesion;
window.registrarUsuario = registrarUsuario;
window.cerrarSesion = cerrarSesion;
window.cargarCategorias = cargarCategorias;
window.irCategorias = irCategorias;
window.cargarReseñasPorLugar = cargarReseñasPorLugar;
window.agregarReseña = agregarReseña;
window.cambiarLugar = cambiarLugar;
window.irAReseñas = irAReseñas;
window.prepararCarrusel = prepararCarrusel;
window.cargarBDAdmin = cargarBDAdmin;
window.listarLugaresAdmin = listarLugaresAdmin;
window.crearLugar = crearLugar;
window.editarLugarAdmin = editarLugarAdmin;
window.eliminarLugarAdmin = eliminarLugarAdmin;
window.abrirEditarUsuario = abrirEditarUsuario;
window.guardarCambiosUsuario = guardarCambiosUsuario;
window.cancelarEdicionUsuario = cancelarEdicionUsuario;
window.eliminarUsuarioAdmin = eliminarUsuarioAdmin;
window.mostrarGraficoReseñasPorLugar = mostrarGraficoReseñasPorLugar;
window.buscarPorUsuario = buscarPorUsuario;
window.filtrarRango = filtrarRango;
window.filtrarPorFecha = filtrarPorFecha;
window.mostrarGaleriaCompleta = mostrarGaleriaCompleta;

window.onload = () => {
  crearFooter();
  mostrarUsuarioEnPantalla();
  verificarPermisosAdmin();

  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("categorias.html")) cargarCategorias();
  if (path.endsWith("reseñas.html")) cargarReseñasPorLugar();
  if (path.endsWith("bdadmin.html")) cargarBDAdmin();
};