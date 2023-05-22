/**
 * Ruta Deshpande
 * Andrew id - rutasurd
 * A3
 * Book BFF
 */
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bodyParser = require('body-parser');

app.use(express.json());

// Middleware for JWT validation
function validateJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  const userAgent = req.headers['user-agent'];
  
  if (req.path === '/status') {
    return next(); // Skip validation for /health endpoint
  }

    console.log("Inside validate jwt");
  if (!authHeader) {
    return res.status(401).json({ message: 'No JWT token provided' });
  }

  if (!userAgent) {
    return res.status(400).json({ message: 'User-Agent header is missing' });
  }

  const token = authHeader.split(' ')[1];
  //console.log("token"+token);

    const decoded = jwt.decode(token);
    console.log("date"+new Date(decoded.exp));
    if(decoded.sub == null || !['starlord', 'gamora', 'drax', 'rocket', 'groot'].includes(decoded.sub)) {
        console.log("sub")
        return res.status(401).json({ message: 'Invalid JWT token 1' });
    }
    if(decoded.exp == null || new Date(decoded.exp*1000) <= new Date()) {
        console.log("exp")
        return res.status(401).json({ message: 'Invalid JWT token 2' });
    }
    if(decoded.iss == null || decoded.iss != 'cmu.edu') {
        console.log("iss")
        return res.status(401).json({ message: 'Invalid JWT token 3' });
    }
    req.user = decoded;
    next();
}

app.use(validateJwt);

const PORT = process.env.PORT || 80;
//const bookServiceUrl = 'http://main-service-books:3000'; 
// const bookServiceUrl = 'http://localhost:3000';
const bookServiceUrl = 'http://book.book-store-ns.svc.cluster.local:3000';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function isMobile(userAgent) {
  return userAgent.includes('Mobile');
}

// Middleware to identify client type
// app.use((req, res, next) => {
//   req.isMobile = isMobile(req.headers['user-agent']);
//   next();
// });

// app.get('/book/health',(req, res) => {
//     res.status(200).json({});
// });

app.get('/status', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.status(200).send('OK');
});

// Proxy endpoints
app.get(['/books/:ISBN','/books/isbn/:ISBN'], async (req, res) => {
    try {
      const { status, data } = await axios.get(`${bookServiceUrl}/books/${req.params.ISBN}`);
      console.log('In BFF books get');
      let modifiedData;
      if (isMobile(req.headers['user-agent'])) {
        modifiedData = data.genre === 'non-fiction' ? { ...data, genre: 3 } : { ...data };
      } else {
        modifiedData = { ...data };
      } 
      res.status(status).json(modifiedData);
    } catch (err) {
      res.status(err.response.status).json(err.response.data);
    }
  });
  
  app.post('/books', async (req, res) => {
    try {
      const { status, data } = await axios.post(`${bookServiceUrl}/books`, req.body);
      console.log('In BFF books post');
      res.status(status).json(data);
    } catch (err) {
      res.status(err.response.status).json(err.response.data);
    }
  });
  
  app.put('/books/:ISBN', async (req, res) => {
    try {
      const { status, data } = await axios.put(`${bookServiceUrl}/books/${req.params.ISBN}`, req.body);
      console.log('In BFF books put');
      res.status(status).json(data);
    } catch (err) {
      res.status(err.response.status).json(err.response.data);
    }
  });

  app.get('/books/:ISBN/related-books', async (req, res) => {
  try {
    const { status, data } = await axios.get(`${bookServiceUrl}/books/${req.params.ISBN}/related-books`);
    console.log('In BFF related-books get');
    res.status(status).json(data);
  } catch (err) {
    res.status(err.response.status).json(err.response.data);
  }
});

app.listen(PORT, () => {
  console.log(`BFF service is running on port ${PORT}`);
});
