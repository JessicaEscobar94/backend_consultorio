const express = require('express');
const router = express.Router();
const db = require('../db');

// Turnos disponibles
router.get('/disponibles/:medicoId/:fecha', (req, res) => {
  const { medicoId, fecha } = req.params;

  db.all(
    'SELECT hora FROM turnos WHERE medico_id=? AND fecha=? AND estado="RESERVADO"',
    [medicoId, fecha],
    (err, ocupados) => {
      const horasOcupadas = ocupados.map(t => t.hora);

      const horarios = [];
      let hora = 8 * 60;
      const fin = 14 * 60;

      while (hora < fin) {
        const h = `${String(Math.floor(hora/60)).padStart(2,'0')}:${String(hora%60).padStart(2,'0')}`;
        if (!horasOcupadas.includes(h)) horarios.push(h);
        hora += 20;
      }

      res.json(horarios);
    }
  );
});

// Reservar turno
router.post('/', (req, res) => {
  const { medico_id, paciente_id, fecha, hora } = req.body;

  db.run(
    'INSERT INTO turnos (medico_id, paciente_id, fecha, hora) VALUES (?,?,?,?)',
    [medico_id, paciente_id, fecha, hora],
    err => {
      if (err) return res.status(400).json({ error: 'Turno no disponible' });
      res.json({ mensaje: 'Turno reservado' });
    }
  );
});

// Cancelar turno
router.put('/cancelar/:id', (req, res) => {
  db.run(
    'UPDATE turnos SET estado="CANCELADO" WHERE id=?',
    [req.params.id],
    () => res.json({ mensaje: 'Turno cancelado' })
  );
});

module.exports = router;
