from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import mysql.connector
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

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

# Conexión con MySQL
db = mysql.connector.connect(
    host="localhost",
    user="root",  # cambia si usas otro usuario
    password="Barriosdice3105",  # tu contraseña
    database="usuarios_login"
)

cursor = db.cursor(dictionary=True)

# Modelos de datos
class RegisterRequest(BaseModel):
    nombre: str
    email: str
    usuario: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# Montar carpeta de estáticos (CSS, JS, imágenes)
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

# Endpoint inicial que devuelve index.html
@app.get("/")
def serve_index():
    return FileResponse(os.path.join(FRONTEND_DIR, "login.html"))

# Ruta de registro
@app.post("/register")
def register(data: RegisterRequest):
    sql = "INSERT INTO usuarios (nombre, correo, usuario, password) VALUES (%s, %s, %s, %s)"
    values = (data.nombre, data.email, data.usuario, data.password)
    try:
        cursor.execute(sql, values)
        db.commit()
        return {"message": "Usuario registrado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Ruta de login
@app.post("/login")
def login(data: LoginRequest):
    sql = "SELECT * FROM usuarios WHERE correo = %s AND password = %s"
    values = (data.email, data.password)
    cursor.execute(sql, values)
    result = cursor.fetchall()
    if len(result) > 0:
        return {"success": True, "message": "Login exitoso"}
    else:
        return {"success": False, "message": "Usuario o contraseña incorrectos"}


# Endpoint para página de agendar
@app.get("/agendar")
def serve_agendar():
    return FileResponse(os.path.join(FRONTEND_DIR, "agendar.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=3000, reload=True)