const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('./auth');

function verificarToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token faltante' });

  const token = header.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

function soloRoles(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol))
      return res.status(403).json({ error: 'Acceso denegado' });
    next();
  };
}

module.exports = { verificarToken, soloRoles };