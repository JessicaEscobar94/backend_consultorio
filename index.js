require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const db = require('./db');
const { login } = require('./auth');
const { verificarToken, soloRoles } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());  // AGREGAR DOMINIO
app.use(express.json());

const apiKeyMiddleware = require('./apiKeyMiddleware');

app.use(apiKeyMiddleware);

//TEST

app.get('/', (req, res) => {
  res.send('Backend del consultorio funcionando');
});

//LOGIN

app.post('/login', login);

// REGISTRO PACIENTE

app.post('/register', (req, res) => {
  const { usuario, nombre, apellido, password, obra_social, telefono } = req.body;

  if (!usuario || !nombre || !apellido || !password) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const hash = bcrypt.hashSync(password, 10);

  db.run(
    `
    INSERT INTO usuarios
    (usuario, dni, nombre, apellido, password, rol, obra_social, telefono)
    VALUES (?, ?, ?, ?, ?, 'PACIENTE', ?, ?)
    `,
    [usuario, usuario, nombre, apellido, hash, obra_social || null, telefono || null],
    err => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'No se pudo registrar el paciente' });
      }
      res.json({ mensaje: 'Paciente registrado correctamente' });
    }
  );
});

//MEDICOS

app.get('/medicos', verificarToken, (req, res) => {
  db.all(
    `SELECT id, nombre, apellido FROM usuarios WHERE rol = 'MEDICO'`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error al obtener médicos' });
      res.json(rows);
    }
  );
});

// BUSCAR PACIENTE POR DNI

app.get(
  '/pacientes/por-dni/:dni',
  verificarToken,
  soloRoles(['SECRETARIA']),
  (req, res) => {
    db.get(
      `
      SELECT id, nombre, apellido, telefono, obra_social
      FROM usuarios
      WHERE dni = ? AND rol = 'PACIENTE'
      `,
      [req.params.dni],
      (err, row) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error BD' });
        }
        res.json(row || null);
      }
    );
  }
);

app.post(
  '/turnos',
  verificarToken,
  soloRoles(['PACIENTE', 'SECRETARIA']),
  (req, res) => {

    let {
      medico_id,
      fecha,
      hora,
      paciente_id,
      dni,
      nombre,
      apellido,
      telefono,
      obra_social
    } = req.body;

    // VALIDACION BASICA DEL TURNO

    if (!medico_id || !fecha || !hora) {
      return res.status(400).json({ error: 'Datos incompletos del turno' });
    }

    // SI ES PACIENTE LOGUEADO

    if (req.user.rol === 'PACIENTE') {
      paciente_id = req.user.id;
    }

    // FUNCION QUE CREA EL TURNO

    const crearTurno = (pacienteFinalId) => {

      db.get(
        `
        SELECT id FROM turnos
        WHERE medico_id = ? AND fecha = ? AND hora = ? AND estado = 'ACTIVO'
        `,
        [medico_id, fecha, hora],
        (err, existe) => {

          if (err) {
            console.error('Error verificando horario:', err);
            return res.status(500).json({ error: 'Error verificando horario' });
          }

          if (existe) {
            return res.status(400).json({ error: 'Horario ocupado' });
          }

          db.run(
            `
            INSERT INTO turnos (medico_id, paciente_id, fecha, hora)
            VALUES (?, ?, ?, ?)
            `,
            [medico_id, pacienteFinalId, fecha, hora],
            function (err) {

              if (err) {
                console.error('Error insertando turno:', err);
                return res.status(500).json({ error: 'Error al crear turno' });
              }

              res.json({ mensaje: 'Turno creado correctamente' });
            }
          );
        }
      );
    };

    // SECRETARIA

    if (req.user.rol === 'SECRETARIA') {

      // Paciente ya registrado, se autocompleta
      if (paciente_id) {
        return crearTurno(paciente_id);
      }

      if (!dni || !nombre || !apellido) {
        return res.status(400).json({ error: 'Faltan datos del paciente' });
      }

      // Buscar paciente por dni

      db.get(
        `SELECT id FROM usuarios WHERE dni = ? AND rol = 'PACIENTE'`,
        [dni],
        (err, user) => {

          if (err) {
            console.error('Error buscando paciente:', err);
            return res.status(500).json({ error: 'Error buscando paciente' });
          }

          // Si existe, se usa ese paciente
          if (user) {
            console.log('Paciente existente encontrado:', user.id);
            return crearTurno(user.id);
          }

          // Si no existe, se crea el turno manualmente
          db.run(
            `
            INSERT INTO usuarios
            (usuario, dni, nombre, apellido, password, rol, telefono, obra_social)
            VALUES (?, ?, ?, ?, ?, 'PACIENTE', ?, ?)
            `,
            [
              dni,      //usuario
              dni,      // dni del paciente
              nombre,
              apellido,
              '',       //password
              telefono || null,
              obra_social || null
            ],
            function (err) {

              if (err) {
                console.error('Error creando paciente:', err);
                return res.status(500).json({ error: 'Error creando paciente' });
              }

              crearTurno(this.lastID);
            }
          );
        }
      );

      return;
    }

    if (!paciente_id) {
      return res.status(400).json({ error: 'Paciente inválido' });
    }

    crearTurno(paciente_id);
  }
);



// MIS TURNOS (PACIENTE)

app.get(
  '/mis-turnos',
  verificarToken,
  soloRoles(['PACIENTE']),
  (req, res) => {
    db.all(
      `
      SELECT 
        t.id,
        t.fecha,
        t.hora,
        t.estado,
        u.nombre AS medico_nombre,
        u.apellido AS medico_apellido
      FROM turnos t
      JOIN usuarios u ON t.medico_id = u.id
      WHERE t.paciente_id = ?
        AND t.estado = 'ACTIVO'
      ORDER BY t.fecha, t.hora
      `,
      [req.user.id],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Error al obtener turnos' });
        }
        res.json(rows);
      }
    );
  }
);


// TURNOS OCUPADOS

app.get('/turnos-ocupados', verificarToken, (req, res) => {
  const { medico_id, fecha } = req.query;

  db.all(
    `
    SELECT hora FROM turnos
    WHERE medico_id = ? AND fecha = ? AND estado = 'ACTIVO'
    `,
    [medico_id, fecha],
    (err, rows) => {
      if (err) return res.json([]);
      res.json(rows.map(r => r.hora));
    }
  );
});

// CANCELAR TURNO

app.put(
  '/turnos/:id/cancelar',
  verificarToken,
  soloRoles(['PACIENTE', 'SECRETARIA']),
  (req, res) => {
    db.run(
      `
      UPDATE turnos
      SET estado = 'CANCELADO'
      WHERE id = ? AND estado = 'ACTIVO'
      `,
      [req.params.id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Error al cancelar turno' });
        }

        if (this.changes === 0) {
          return res.status(400).json({ error: 'Turno ya cancelado' });
        }

        res.json({ mensaje: 'Turno cancelado' });
      }
    );
  }
);

// TURNOS (MEDICO Y SECRETARIA)

app.get(
  '/turnos',
  verificarToken,
  soloRoles(['MEDICO', 'SECRETARIA']),
  (req, res) => {

    let query = `
      SELECT
        t.id,
        t.fecha,
        t.hora,
        t.estado,
        p.nombre AS paciente_nombre,
        p.apellido AS paciente_apellido,
        p.telefono,
        p.obra_social,
        m.nombre || ' ' || m.apellido AS medico
      FROM turnos t
      JOIN usuarios m ON t.medico_id = m.id
      JOIN usuarios p ON t.paciente_id = p.id
      WHERE t.estado = 'ACTIVO'
    `;

    const params = [];

    if (req.user.rol === 'MEDICO') {
      query += ' AND t.medico_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY t.fecha, t.hora';

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener turnos' });
      }
      res.json(rows);
    });
  }
);
app.post(
  '/historias',
  verificarToken,
  soloRoles(['MEDICO']),
  (req, res) => {
    const { turno_id, descripcion } = req.body;

    if (!turno_id || !descripcion) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    db.run(
      `
      INSERT INTO historias_clinicas
      (turno_id, medico_id, descripcion, fecha)
      VALUES (?, ?, ?, date('now'))
      `,
      [turno_id, req.user.id, descripcion],
      err => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error al guardar historia clínica' });
        }
        res.json({ mensaje: 'Historia clínica creada' });
      }
    );
  }
);

app.get(
  '/historias/turno/:turnoId',
  verificarToken,
  soloRoles(['MEDICO']),
  (req, res) => {
    db.all(
      `
      SELECT *
      FROM historias_clinicas
      WHERE turno_id = ?
      ORDER BY fecha DESC
      `,
      [req.params.turnoId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al obtener historias' });
        res.json(rows);
      }
    );
  }
);

app.delete(
  '/historias/:id',
  verificarToken,
  soloRoles(['MEDICO']),
  (req, res) => {
    db.run(
      `DELETE FROM historias_clinicas WHERE id = ?`,
      [req.params.id],
      () => res.json({ mensaje: 'Historia clínica eliminada' })
    );
  }
);

//HORARIOS DISPONIBLES

app.get('/horarios', verificarToken, (req, res) => {
  const horarios = [
    '08:00', '08:20', '08:40',
    '09:00', '09:20', '09:40',
    '10:00', '10:20', '10:40',
    '11:00', '11:20', '11:40',
    '12:00'
  ];

  res.json(horarios);
});

console.log('API_KEY BACK:', process.env.API_KEY);

// SERVER

app.listen(PORT, () => {
  console.log(`Backend corriendo en puerto:${PORT}`);
});