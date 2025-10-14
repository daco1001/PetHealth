// Horarios disponibles
const availableHours = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
];

let selectedDate = null;
let selectedTime = null;

// Mostrar nombre del usuario logueado
document.addEventListener("DOMContentLoaded", () => {
  const nombreUsuario = localStorage.getItem("usuario_nombre");
  if (nombreUsuario) {
    const titulo = document.createElement("h3");
    titulo.textContent = `👋 Bienvenido, ${nombreUsuario}`;
    document
      .querySelector(".section-title")
      .insertAdjacentElement("afterend", titulo);
  }

  initCalendar();
  initTimeSlots();
  document
    .getElementById("submit-appointment")
    .addEventListener("click", submitAppointment);
});

function initCalendar() {
  const weekDaysContainer = document.getElementById("week-days");
  const today = new Date();
  while (today.getDay() !== 1) {
    today.setDate(today.getDate() + 1);
  }

  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayElement = document.createElement("div");
    dayElement.classList.add("day");
    dayElement.dataset.date = formatDate(date);
    dayElement.innerHTML = `<div>${date.toLocaleDateString("es-ES", {
      weekday: "long",
    })}</div>
                            <div>${date.getDate()}/${
      date.getMonth() + 1
    }</div>`;
    dayElement.addEventListener("click", () =>
      selectDate(dayElement.dataset.date)
    );
    weekDaysContainer.appendChild(dayElement);
  }

  const firstDay = weekDaysContainer.querySelector(".day");
  if (firstDay) selectDate(firstDay.dataset.date);
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function initTimeSlots() {
  const timeSlotsContainer = document.getElementById("time-slots");
  availableHours.forEach((time) => {
    const timeSlot = document.createElement("div");
    timeSlot.classList.add("time-slot");
    timeSlot.textContent = time;
    timeSlot.dataset.time = time;
    timeSlot.addEventListener("click", () => selectTime(time));
    timeSlotsContainer.appendChild(timeSlot);
  });
}

function selectDate(date) {
  selectedDate = date;
  document
    .querySelectorAll(".day")
    .forEach((d) => d.classList.remove("selected"));
  document.querySelector(`.day[data-date='${date}']`).classList.add("selected");
}

function selectTime(time) {
  selectedTime = time;
  document
    .querySelectorAll(".time-slot")
    .forEach((t) => t.classList.remove("selected"));
  document
    .querySelector(`.time-slot[data-time='${time}']`)
    .classList.add("selected");
}

async function submitAppointment() {
  const idUsuario = localStorage.getItem("usuario_id");
  if (!idUsuario) {
    alert("No hay sesión activa. Inicia sesión nuevamente.");
    window.location.href = "/";
    return;
  }

  const petName = document.getElementById("pet-name").value;
  const petType = document.getElementById("pet-type").value;
  const petBreed = document.getElementById("pet-breed").value;
  const petAge = document.getElementById("pet-age").value;
  const ownerName = localStorage.getItem("usuario_nombre");
  const ownerPhone = document.getElementById("owner-phone").value;
  const reason = document.getElementById("reason").value;

  if (!petName || !petType || !ownerName || !ownerPhone) {
    alert("Por favor completa todos los campos obligatorios.");
    return;
  }

  if (!selectedDate || !selectedTime) {
    alert("Selecciona una fecha y hora para tu cita.");
    return;
  }

  const response = await fetch("http://localhost:3000/registrar_mascota", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_usuario: parseInt(idUsuario),
      nombre: petName,
      tipo: petType,
      raza: petBreed,
      edad: petAge ? parseInt(petAge) : null,
      motivo_consulta: reason,
      telefono: ownerPhone,
      fecha_registro: selectedDate,
    }),
  });

  const data = await response.json();

  if (data.success) {
    document.getElementById("confirmation-details").innerHTML = `
      <strong>Mascota:</strong> ${petName}<br>
      <strong>Tipo:</strong> ${petType}<br>
      <strong>Fecha:</strong> ${selectedDate}<br>
      <strong>Hora:</strong> ${selectedTime}<br>
      <strong>Dueño:</strong> ${ownerName}<br>
      <strong>Teléfono:</strong> ${ownerPhone}
    `;
    document.getElementById("confirmation-modal").style.display = "flex";
  } else {
    alert("Error al registrar la cita: " + data.message);
  }
}

function closeModal() {
  document.getElementById("confirmation-modal").style.display = "none";
}
