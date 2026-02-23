const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
  const { paciente_id, medico_id, diagnostico, tratamiento, observaciones } = req.body;

  db.run(
    `INSERT INTO historias_clinicas
     (paciente_id, medico_id, fecha, diagnostico, tratamiento, observaciones)
     VALUES (?,?,date('now'),?,?,?)`,
    [paciente_id, medico_id, diagnostico, tratamiento, observaciones],
    () => res.json({ mensaje: 'Historia creada' })
  );
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM historias_clinicas WHERE id=?', [req.params.id],
    () => res.json({ mensaje: 'Historia eliminada' })
  );
});

module.exports = router;
