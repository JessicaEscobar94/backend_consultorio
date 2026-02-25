# Backend – API Consultorio Médico ## 
📌 Descripción general

Este proyecto corresponde al **backend de un sistema de gestión para un consultorio médico**, desarrollado como parte de la **Práctica Profesional Supervisada (PPS)**.

La API provee los servicios necesarios para la administración de: 
* Usuarios (pacientes, médicos y secretaria) 
* Turnos médicos 
* Historias clínicas 
* Autenticación y control de acceso 

El backend está diseñado para ser consumido por un frontend web, incluyendo seguridad mediante **API_KEY**, autenticación con **JWT** y control de roles. 

--- 
## 🛠️ Tecnologías utilizadas 

* **Node.js** 
* **Express.js** 
* **SQLite3** (base de datos local persistente) 
* **JWT (JSON Web Tokens)** para autenticación 
* **bcryptjs** para hash de contraseñas 
* **dotenv** para manejo de variables de entorno 
--- 
## Arquitectura general 

El sistema sigue una arquitectura cliente-servidor: 

* **Frontend**: aplicación web que consume la API (desplegada en Vercel) 
* **Backend**: API REST desarrollada con Node.js y Express (desplegada en Render) 
* **Base de datos**: SQLite3 integrada en el backend 

Todas las operaciones de acceso, modificación y eliminación de datos se realizan exclusivamente a través de la API. 

--- 
## 🔐 Seguridad 

La API implementa múltiples capas de seguridad: 

### 1️⃣ Protección mediante API_KEY 

Todas las rutas de la API se encuentran protegidas mediante una **API_KEY**, enviada en cada request a través del header HTTP. Un middleware global valida esta clave antes de permitir el acceso a cualquier endpoint, protegiendo **todas las rutas** de la API. 

--- 
### 2️⃣ Autenticación con JWT 
La autenticación de usuarios se realiza mediante **JSON Web Tokens (JWT)**. 
* El usuario se autentica mediante el endpoint /login. 
* El backend devuelve un token JWT. 
* El token debe enviarse en los requests protegidos mediante el header: 
```bash
Authorization: Bearer <token>
```

--- 
### 3️⃣ Autorización por roles 
El sistema implementa control de acceso basado en roles: 
* **PACIENTE** 
* **MEDICO** 
* **SECRETARIA** 

Determinadas rutas solo pueden ser accedidas por usuarios con roles específicos, garantizando la correcta autorización de las operaciones. 

---
## 📌 Endpoints principales

- POST /login
- GET /usuarios
- POST /usuarios
- GET /turnos
- POST /turnos
- GET /historias

--- 
## 🗄️ Base de datos 
La base de datos utilizada es **SQLite3**, integrada dentro del backend.

 Incluye tablas para: 
* usuarios 
* turnos 
* historias clínicas 

Las operaciones CRUD (Create, Read, Update, Delete) se realizan de forma controlada a través de la API. 

--- 
## ⚙️ Variables de entorno 
El proyecto utiliza variables de entorno para manejar información sensible. Archivo .env 

---
## 🌐 Base URL

### Entorno local
http://localhost:3001

### Producción
https://pps-backend-escobar.onrender.com

--- 
## ▶️ Instalación y ejecución local 
1. Clonar el repositorio 
2. Instalar dependencias:
```bash
npm install
```
3. Crear el archivo .env con las variables necesarias. 
4. Iniciar el servidor:
```bash
node index.js
```
