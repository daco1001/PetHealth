# Importaciones de FastAPI
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

# Importaciones de Pydantic para validación
from pydantic import BaseModel

# Importaciones del sistema
import os
import mysql.connector

# Importaciones de Google (solo si las vas a usar)
from google_auth_oauthlib.flow import InstalledAppFlow
# Removemos 'build' ya que no se está usando

# Inicializar aplicación FastAPI
app = FastAPI(
    title="PetHealth API",
    description="API para gestión de citas veterinarias",
    version="1.0.0"
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000","http://localhost:3000"],  # Especifica los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conexión con MySQL (usar variables de entorno; no dejar contraseñas en el código)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Barriosdice3105")  # <--- contraseña previa puesta por defecto
DB_NAME = os.getenv("DB_NAME", "usuarios_login")

try:
    db = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    cursor = db.cursor(dictionary=True)
except Exception as e:
    # Si la conexión falla, lo registramos y levantamos error al arrancar
    raise RuntimeError("No se pudo conectar a la base de datos: " + str(e)) from e

# Modelos pydantic
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

class ProductoRequest(BaseModel):
    nombre: str
    precio: float
    cantidad: int

# ------------------ ARCHIVOS ESTÁTICOS ------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "../frontend"))

# montar /static si aún no está montado
try:
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")
except Exception:
    # si ya estaba montado, ignorar
    pass

@app.get("/")
def serve_index():
    return FileResponse(os.path.join(FRONTEND_DIR, "login.html"))

@app.get("/agendar")
def serve_agendar():
    return FileResponse(os.path.join(FRONTEND_DIR, "agendar.html"))

@app.post("/register")
async def register(data: RegisterRequest):
    try:
        sql = "INSERT INTO usuarios (nombre, correo, usuario, password) VALUES (%s, %s, %s, %s)"
        # usar data.email (campo recibido en JSON) y guardarlo en la columna 'correo'
        values = (data.nombre, data.email, data.usuario, data.password)
        cursor.execute(sql, values)
        db.commit()
        return {"success": True, "message": "Usuario registrado correctamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al registrar usuario") from e

@app.post("/login")
async def login(data: LoginRequest):
    try:
        sql = "SELECT id, nombre, correo FROM usuarios WHERE correo = %s AND password = %s"
        cursor.execute(sql, (data.email, data.password))
        user = cursor.fetchone()
        if user:
            # devolver con clave 'usuario' para ser compatible con el frontend
            return {"success": True, "usuario": user}
        else:
            # devolver objeto manejable por frontend (sin lanzar excepción 401)
            return {"success": False, "message": "Usuario o contraseña incorrectos"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al realizar login") from e

@app.post("/registrar_mascota")
async def registrar_mascota(data: MascotaRequest):
    try:
        sql = """
        INSERT INTO mascotas 
        (id_usuario, nombre, tipo, raza, edad, motivo_consulta, telefono, fecha_registro) 
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
        cursor.execute(sql, values)
        db.commit()
        return {"success": True, "message": "Mascota registrada correctamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.get("/mascotas_usuario/{id_usuario}")
async def obtener_mascotas(id_usuario: int):
    try:
        sql = "SELECT * FROM mascotas WHERE id_usuario = %s"
        cursor.execute(sql, (id_usuario,))
        mascotas = cursor.fetchall()
        return {"mascotas": mascotas}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.get("/mascotas/{id_usuario}")
async def obtener_mascotas_compat(id_usuario: int):
    try:
        sql = "SELECT id, id_usuario, nombre, tipo, raza, edad, motivo_consulta, telefono, fecha_registro FROM mascotas WHERE id_usuario = %s"
        cursor.execute(sql, (id_usuario,))
        resultados = cursor.fetchall()
        return {"success": True, "mascotas": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener mascotas") from e

@app.get("/inventario")
def serve_inventario():
    """
    Sirve la página de inventario estática.
    Asegúrate de que frontend/inventario.html exista.
    """
    return FileResponse (os.path.join(FRONTEND_DIR, "inventario.html"))

@app.post("/inventario/agregar")
async def agregar_producto(data: ProductoRequest):
    try:
        sql = "INSERT INTO inventario (nombre, precio, cantidad) VALUES (%s, %s, %s)"
        values = (data.nombre, data.precio, data.cantidad)
        cursor.execute(sql, values)
        db.commit()
        return {"success": True, "message": "Producto agregado correctamente", "id": cursor.lastrowid}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al agregar producto") from e

@app.get("/inventario/productos")
async def obtener_productos():
    try:
        sql = "SELECT id, nombre, precio, cantidad FROM inventario ORDER BY fecha_creacion DESC"
        cursor.execute(sql)
        productos = cursor.fetchall()
        return {"success": True, "productos": productos}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener productos") from e

@app.put("/inventario/actualizar/{producto_id}")
async def actualizar_producto(producto_id: int, data: ProductoRequest):
    try:
        sql = "UPDATE inventario SET nombre = %s, precio = %s, cantidad = %s WHERE id = %s"
        values = (data.nombre, data.precio, data.cantidad, producto_id)
        cursor.execute(sql, values)
        db.commit()
        return {"success": True, "message": "Producto actualizado"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar producto") from e

@app.delete("/inventario/eliminar/{producto_id}")
async def eliminar_producto(producto_id: int):
    try:
        sql = "DELETE FROM inventario WHERE id = %s"
        cursor.execute(sql, (producto_id,))
        db.commit()
        return {"success": True, "message": "Producto eliminado"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar producto") from e

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
