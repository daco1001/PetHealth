document.addEventListener("DOMContentLoaded", () => {
  function getStoredUser() {
    // claves posibles
    const keys = ["usuario", "user", "USER", "app_user"];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const obj = JSON.parse(raw);
        if (
          obj &&
          (obj.id ||
            obj.ID ||
            obj.id_usuario ||
            obj.usuario_id ||
            obj.email ||
            obj.correo)
        ) {
          return obj;
        }
      } catch (e) {
        continue;
      }
    }
    // fallback: aceptar solo id/nombre separados
    const id = localStorage.getItem("usuario_id");
    const nombre = localStorage.getItem("usuario_nombre");
    if (id || nombre) {
      return { id: id ? parseInt(id, 10) : null, nombre: nombre || null };
    }
    return null;
  }

  const link = document.getElementById("link-inventario");
  const btn = document.getElementById("go-inventario");

  function handleNavigate(e) {
    const user = getStoredUser();
    if (!user) {
      if (e) e.preventDefault();
      alert("Inicia sesión para acceder al inventario.");
      window.location.href = "/";
      return false;
    }
    return true;
  }

  if (link) {
    link.setAttribute("href", "/inventario");
    link.addEventListener("click", (e) => handleNavigate(e));
  }

  if (btn) {
    btn.addEventListener("click", (e) => {
      if (!handleNavigate(e)) return;
      window.location.href = "/inventario";
    });
  }
});
