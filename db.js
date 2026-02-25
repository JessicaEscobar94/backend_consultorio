const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./consultorio.db', err => {
  if (err) console.error(err);
  else console.log('Base de datos conectada');
});

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE NOT NULL,
      dni TEXT UNIQUE,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      password TEXT NOT NULL,
      rol TEXT NOT NULL,
      obra_social TEXT,
      telefono TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS turnos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medico_id INTEGER NOT NULL,
      paciente_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      estado TEXT DEFAULT 'ACTIVO',
      FOREIGN KEY (medico_id) REFERENCES usuarios(id),
      FOREIGN KEY (paciente_id) REFERENCES usuarios(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS historias_clinicas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      turno_id INTEGER,
      medico_id INTEGER,
      paciente_nombre TEXT,
      paciente_apellido TEXT,
      obra_social TEXT,
      descripcion TEXT,
      fecha TEXT
    )
  `);

  const hash = bcrypt.hashSync('1234', 10);

  db.run(`
    INSERT OR IGNORE INTO usuarios (usuario, nombre, apellido, password, rol) VALUES
    ('20111111','Juan','García','${hash}','MEDICO'),
    ('20222222','Ana','López','${hash}','MEDICO'),
    ('secretaria','María','González','${hash}','SECRETARIA')
  `);
});

module.exports = db;