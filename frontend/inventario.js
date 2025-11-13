document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("item-form");
  const tableBody = document.querySelector("#inventory-table tbody");
  const itemsCountEl = document.getElementById("items-count");
  const stockTotalEl = document.getElementById("stock-total");
  const exportBtn = document.getElementById("export-excel");

  let productosGlobal = []; // guardar productos para exportar

  async function cargarProductos() {
    try {
      const res = await fetch("/inventario/productos");
      const data = await res.json();
      if (data.success) {
        productosGlobal = data.productos; // guardar para exportar
        renderTabla(data.productos);
      }
    } catch (err) {
      console.error("Error cargando productos:", err);
      alert("Error al cargar productos");
    }
  }

  function renderTabla(productos) {
    tableBody.innerHTML = "";
    if (!productos.length) {
      tableBody.innerHTML =
        '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">Sin productos</td></tr>';
    } else {
      productos.forEach((prod) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(prod.nombre)}</td>
          <td>$${parseFloat(prod.precio).toFixed(2)}</td>
          <td>${prod.cantidad}</td>
          <td>
            <button class="btn btn-secondary edit" data-id="${
              prod.id
            }">Editar</button>
            <button class="btn btn-danger delete" data-id="${
              prod.id
            }">Eliminar</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    }
    actualizarResumen(productos);
  }

  function actualizarResumen(productos) {
    itemsCountEl.textContent = productos.length;
    const total = productos.reduce((s, p) => s + (Number(p.cantidad) || 0), 0);
    stockTotalEl.textContent = total;
  }

  function escapeHtml(s) {
    if (!s) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Exportar a Excel
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      if (!productosGlobal.length) {
        alert("No hay productos para exportar");
        return;
      }

      // crear tabla HTML para Excel
      const html = `
        <table>
          <tr>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Cantidad</th>
          </tr>
          ${productosGlobal
            .map(
              (p) => `
            <tr>
              <td>${escapeHtml(p.nombre)}</td>
              <td>${parseFloat(p.precio).toFixed(2)}</td>
              <td>${p.cantidad}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      `;

      // crear blob y descargar
      const blob = new Blob([html], {
        type: "application/vnd.ms-excel;charset=utf-8",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `inventario_${
        new Date().toISOString().split("T")[0]
      }.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    });
  }

  // Agregar producto
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("item-name").value.trim();
    const precio = parseFloat(document.getElementById("item-price").value);
    const cantidad = parseInt(document.getElementById("item-quantity").value);

    if (!nombre || isNaN(precio) || isNaN(cantidad)) {
      alert("Completa todos los campos correctamente");
      return;
    }

    try {
      const res = await fetch("/inventario/agregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio, cantidad }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Producto agregado");
        form.reset();
        cargarProductos();
      } else {
        alert(data.message || "Error al agregar");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error al agregar producto");
    }
  });

  // Editar/Eliminar en tabla
  tableBody.addEventListener("click", async (e) => {
    const btn = e.target;
    const id = btn.dataset.id;

    if (btn.classList.contains("edit")) {
      const tr = btn.closest("tr");
      const nombre = prompt("Nombre:", tr.children[0].textContent);
      if (nombre === null) return;
      const precio = prompt(
        "Precio:",
        tr.children[1].textContent.replace("$", "")
      );
      if (precio === null) return;
      const cantidad = prompt("Cantidad:", tr.children[2].textContent);
      if (cantidad === null) return;

      try {
        const res = await fetch(`/inventario/actualizar/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre,
            precio: parseFloat(precio),
            cantidad: parseInt(cantidad),
          }),
        });
        const data = await res.json();
        if (data.success) {
          cargarProductos();
        } else {
          alert(data.message || "Error al actualizar");
        }
      } catch (err) {
        console.error("Error:", err);
        alert("Error al actualizar producto");
      }
    }

    if (btn.classList.contains("delete")) {
      if (!confirm("¿Eliminar este producto?")) return;
      try {
        const res = await fetch(`/inventario/eliminar/${id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          cargarProductos();
        } else {
          alert(data.message || "Error al eliminar");
        }
      } catch (err) {
        console.error("Error:", err);
        alert("Error al eliminar producto");
      }
    }
  });

  // cargar productos al abrir página
  cargarProductos();
});
