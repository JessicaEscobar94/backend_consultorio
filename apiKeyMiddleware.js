const apiKeyMiddleware = (req, res, next) => {

  const apiKey = req.header('x-api-key');

  if (!apiKey) {
    return res.status(401).json({ error: 'API_KEY requerida' });
  }

  if (apiKey != process.env.API_KEY) {
    return res.status(403).json({ error: 'API_KEY inválida' });
  }

  next();
};

module.exports = apiKeyMiddleware;