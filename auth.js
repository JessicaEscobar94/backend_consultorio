const jwt = require('jsonwebtoken');
const db = require('./db');
const bcrypt = require('bcryptjs');

const SECRET_KEY = process.env.JWT_SECRET;
exports.SECRET_KEY = SECRET_KEY;

exports.login = (req, res) => {
  const { usuario, password } = req.body;

  db.get(
    'SELECT * FROM usuarios WHERE usuario = ?',
    [usuario],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Error interno' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Usuario inexistente' });
      }

      const ok = bcrypt.compareSync(password, user.password);
      if (!ok) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      const token = jwt.sign(
        { 
          id: user.id,
          rol: user.rol,
          nombre: user.nombre,
          apellido: user.apellido
        },
        SECRET_KEY,
        { expiresIn: '8h' }
      );

      res.json({
        token,
        rol: user.rol,
        nombre: user.nombre,
        apellido: user.apellido,
        id: user.id
      });
    }
  );
};