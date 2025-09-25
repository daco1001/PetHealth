// Datos de ejemplo para horarios ocupados (en una aplicación real vendrían de una base de datos)
const occupiedSlots = {
  "2023-11-06": ["09:00", "10:30", "14:00"],
  "2023-11-07": ["11:00", "15:30"],
  "2023-11-08": ["09:30", "13:00", "16:00"],
  "2023-11-09": ["10:00", "14:30"],
  "2023-11-10": ["11:30", "15:00"],
};

// Horarios disponibles de la clínica
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

// Variables globales
let selectedDate = null;
let selectedTime = null;

// Inicializar aplicación
document.addEventListener("DOMContentLoaded", function () {
  initCalendar();
  initTimeSlots();
  document
    .getElementById("submit-appointment")
    .addEventListener("click", submitAppointment);
});

// Inicializar calendario
function initCalendar() {
  const weekDaysContainer = document.getElementById("week-days");
  const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const today = new Date();
  const currentDay = today.getDay();

  let daysToAdd = 0;
  if (currentDay === 0) daysToAdd = 1; // Domingo
  if (currentDay === 6) daysToAdd = 2; // Sábado

  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + daysToAdd + i);

    if (date.getDay() === 0) date.setDate(date.getDate() + 1);
    if (date.getDay() === 6) date.setDate(date.getDate() + 2);

    const dayElement = document.createElement("div");
    dayElement.classList.add("day");
    dayElement.dataset.date = formatDate(date);

    const dayName = daysOfWeek[date.getDay() - 1];
    const dayNumber = date.getDate();
    const month = date.getMonth() + 1;

    dayElement.innerHTML = `<div>${dayName}</div><div>${dayNumber}/${month}</div>`;

    dayElement.addEventListener("click", function () {
      selectDate(this.dataset.date);
    });

    weekDaysContainer.appendChild(dayElement);
  }

  const firstDay = weekDaysContainer.querySelector(".day");
  if (firstDay) selectDate(firstDay.dataset.date);
}

// Inicializar horarios
function initTimeSlots() {
  const timeSlotsContainer = document.getElementById("time-slots");
  timeSlotsContainer.innerHTML = "";

  availableHours.forEach((time) => {
    const timeSlot = document.createElement("div");
    timeSlot.classList.add("time-slot");
    timeSlot.textContent = time;
    timeSlot.dataset.time = time;

    timeSlot.addEventListener("click", function () {
      if (!this.classList.contains("unavailable")) {
        selectTime(this.dataset.time);
      }
    });

    timeSlotsContainer.appendChild(timeSlot);
  });
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function selectDate(date) {
  selectedDate = date;

  document.querySelectorAll(".day").forEach((day) => {
    day.classList.remove("selected");
    if (day.dataset.date === date) {
      day.classList.add("selected");
    }
  });

  updateTimeSlotsAvailability(date);
}

function selectTime(time) {
  selectedTime = time;

  document.querySelectorAll(".time-slot").forEach((slot) => {
    slot.classList.remove("selected");
    if (slot.dataset.time === time) {
      slot.classList.add("selected");
    }
  });
}

function updateTimeSlotsAvailability(date) {
  const occupiedToday = occupiedSlots[date] || [];

  document.querySelectorAll(".time-slot").forEach((slot) => {
    const time = slot.dataset.time;
    slot.classList.remove("unavailable");
    if (occupiedToday.includes(time)) {
      slot.classList.add("unavailable");
    }
  });

  selectedTime = null;
  document.querySelectorAll(".time-slot").forEach((slot) => {
    slot.classList.remove("selected");
  });
}

function submitAppointment() {
  const form = document.getElementById("appointment-form");
  const petName = document.getElementById("pet-name").value;
  const petType = document.getElementById("pet-type").value;
  const ownerName = document.getElementById("owner-name").value;
  const ownerPhone = document.getElementById("owner-phone").value;

  if (!petName || !petType || !ownerName || !ownerPhone) {
    alert("Por favor completa todos los campos obligatorios.");
    return;
  }

  if (!selectedDate || !selectedTime) {
    alert("Por favor selecciona una fecha y hora para tu cita.");
    return;
  }

  const dateParts = selectedDate.split("-");
  const displayDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

  const confirmationDetails = `
        <strong>Mascota:</strong> ${petName}<br>
        <strong>Tipo:</strong> ${
          document.getElementById("pet-type").options[
            document.getElementById("pet-type").selectedIndex
          ].text
        }<br>
        <strong>Fecha:</strong> ${displayDate}<br>
        <strong>Hora:</strong> ${selectedTime}<br>
        <strong>Dueño:</strong> ${ownerName}<br>
        <strong>Teléfono:</strong> ${ownerPhone}
    `;

  document.getElementById("confirmation-details").innerHTML =
    confirmationDetails;
  document.getElementById("confirmation-modal").style.display = "flex";

  console.log("Cita agendada:", {
    petName,
    petType,
    petBreed: document.getElementById("pet-breed").value,
    petAge: document.getElementById("pet-age").value,
    ownerName,
    ownerPhone,
    reason: document.getElementById("reason").value,
    date: selectedDate,
    time: selectedTime,
  });

  if (!occupiedSlots[selectedDate]) {
    occupiedSlots[selectedDate] = [];
  }
  occupiedSlots[selectedDate].push(selectedTime);

  updateTimeSlotsAvailability(selectedDate);
  form.reset();
  selectedDate = null;
  selectedTime = null;
}

function closeModal() {
  document.getElementById("confirmation-modal").style.display = "none";
}
