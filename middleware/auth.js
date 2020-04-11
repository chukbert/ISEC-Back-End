const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  if (req.headers.authorization) {
    jwt.verify(req.headers.authorization, process.env.JWTSECRET, (error, decoded) => {
      if (error) {
        res.status(500).json({ success: false, error });
      } else {
        req.id = decoded.id;
        next();
      }
    });
  } else {
    res.json({ success: false, error: 'Auth header required!' });
  }
};
