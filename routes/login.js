const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db');

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get(
    'SELECT * FROM usuarios WHERE email=? AND password=?',
    [email, password],
    (err, user) => {
      if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

      const token = jwt.sign(
        { id: user.id, rol: user.rol },
        'SECRETO',
        { expiresIn: '2h' }
      );

      res.json({ token, rol: user.rol });
    }
  );
});

module.exports = router;
