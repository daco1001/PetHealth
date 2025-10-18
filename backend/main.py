from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import mysql.connector

# Inicializar aplicación FastAPI
app = FastAPI()

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # puedes restringir a ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conexión con MySQL (usa variables de entorno si las configuras)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Barriosdice3105")
DB_NAME = os.getenv("DB_NAME", "usuarios_login")

db = mysql.connector.connect(
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME
)

cursor = db.cursor(dictionary=True)

# ------------------ MODELOS ------------------
class RegisterRequest(BaseModel):
    nombre: str
    email: str
    usuario: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class MascotaRequest(BaseModel):
    id_usuario: int
    nombre: str
    tipo: str
    raza: str | None = None
    edad: int | None = None
    motivo_consulta: str | None = None
    telefono: str
    fecha_registro: str

# ------------------ ARCHIVOS ESTÁTICOS ------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "../frontend")
FRONTEND_DIR = os.path.abspath(FRONTEND_DIR)

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

# ------------------ ENDPOINTS ------------------

@app.get("/")
def serve_index():
    return FileResponse(os.path.join(FRONTEND_DIR, "login.html"))

@app.get("/agendar")
def serve_agendar():
    return FileResponse(os.path.join(FRONTEND_DIR, "agendar.html"))

# Registro de usuario
@app.post("/register")
def register(data: RegisterRequest):
    sql = "INSERT INTO usuarios (nombre, correo, usuario, password) VALUES (%s, %s, %s, %s)"
    values = (data.nombre, data.email, data.usuario, data.password)
    try:
        cursor.execute(sql, values)
        db.commit()
        return {"message": "Usuario registrado correctamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al registrar usuario") from e

# Login de usuario
@app.post("/login")
def login(data: LoginRequest):
    sql = "SELECT id, nombre, correo FROM usuarios WHERE correo = %s AND password = %s"
    values = (data.email, data.password)
    try:
        cursor.execute(sql, values)
        result = cursor.fetchone()
        if result:
            return {"success": True, "message": "Login exitoso", "usuario": result}
        else:
            return {"success": False, "message": "Usuario o contraseña incorrectos"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al hacer login") from e

# Registrar mascota / cita
@app.post("/registrar_mascota")
def registrar_mascota(data: MascotaRequest):
    sql = """
        INSERT INTO mascotas (id_usuario, nombre, tipo, raza, edad, motivo_consulta, telefono, fecha_registro)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    values = (
        data.id_usuario,
        data.nombre,
        data.tipo,
        data.raza,
        data.edad,
        data.motivo_consulta,
        data.telefono,
        data.fecha_registro
    )

    try:
        cursor.execute(sql, values)
        db.commit()
        return {"success": True, "message": "Cita registrada correctamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al registrar mascota") from e

# Obtener mascotas de un usuario
@app.get("/mascotas/{id_usuario}")
def obtener_mascotas(id_usuario: int):
    try:
        sql = "SELECT id, id_usuario, nombre, tipo, raza, edad, motivo_consulta, telefono, fecha_registro FROM mascotas WHERE id_usuario = %s"
        cursor.execute(sql, (id_usuario,))
        resultados = cursor.fetchall()
        return {"success": True, "mascotas": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener mascotas") from e

# ------------------ INICIO DEL SERVIDOR ------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=3000, reload=True)
