document.getElementById("btn_registrarse").addEventListener("click", register);
document.getElementById("btn_sesion").addEventListener("click", iniciarSesion);
window.addEventListener("resize", anchoPagina);

var contenerdor_login_register = document.querySelector(".contenedor_login-register");
var formulario__login = document.querySelector(".formulario_login");
var formulario__register = document.querySelector(".formulario_register");
var caja_t_login = document.querySelector(".caja_t_login");
var caja_t_registro = document.querySelector(".caja_t_registro");

function anchoPagina() {
    if (window.innerWidth > 850) {
        caja_t_login.style.display = "block";
        caja_t_registro.style.display = "block";
    } else {
        caja_t_registro.style.display = "block";
        caja_t_registro.style.opacity = "1";
        caja_t_login.style.display = "none";
        formulario__login.style.display = "block";
        formulario__register.style.display = "none";
        contenerdor_login_register.style.left = "0px";
    }
}
anchoPagina();

function register() {
    if (window.innerWidth > 850) {
        formulario__register.style.display = "block";
        contenerdor_login_register.style.left = "410px";
        formulario__login.style.display = "none";
        caja_t_registro.style.opacity = "0";
        caja_t_login.style.opacity = "1";
    } else {
        formulario__register.style.display = "block";
        contenerdor_login_register.style.left = "0px";
        formulario__login.style.display = "none";
        caja_t_registro.style.display = "none";
        caja_t_login.style.display = "block";
        caja_t_login.style.opacity = "1";
    }
}

function iniciarSesion() {
    if (window.innerWidth > 850) {
        formulario__register.style.display = "none";
        contenerdor_login_register.style.left = "10px";
        formulario__login.style.display = "block";
        caja_t_registro.style.opacity = "1";
        caja_t_login.style.opacity = "0";
    } else {
        formulario__register.style.display = "none";
        contenerdor_login_register.style.left = "0px";
        formulario__login.style.display = "block";
        caja_t_registro.style.display = "block";
        caja_t_login.style.display = "none";
    }
}


document.getElementById("registerBtn").addEventListener("click", async () => {
    const nombre = document.getElementById("regNombre").value;
    const email = document.getElementById("regCorreo").value;
    const usuario = document.getElementById("regUsuario").value;
    const password = document.getElementById("regPassword").value;

    const res = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, usuario, password })
    });

    const data = await res.json();
    alert(data.message);
});


document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.success) {
    window.location.href = "/agendar";  
} else {
    alert("Credenciales incorrectas");
}
});

