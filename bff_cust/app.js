/**
 * Ruta Deshpande
 * Andrew id - rutasurd
 * A3
 * Customer bff
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
    return next(); // Skip validation for /status endpoint
  }

  if (!authHeader) {
    return res.status(401).json({ message: 'No JWT token provided' });
  }

  if (!userAgent) {
    return res.status(400).json({ message: 'User-Agent header is missing' });
  }

  const token = authHeader.split(' ')[1];

    const decoded = jwt.decode(token);
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

function filterCustomerData(data, isMobile) {
  if (isMobile) {
    const filteredData = { ...data };
    delete filteredData.address;
    delete filteredData.address2;
    delete filteredData.city;
    delete filteredData.state;
    delete filteredData.zipcode;
    return filteredData;
  }
  return data;
}

const PORT = process.env.PORT || 80;
// const customerServiceUrl = 'http://main-service-customers:3000'; 
// const customerServiceUrl = 'http://localhost:3000'; 
const customerServiceUrl = 'http://customer.book-store-ns.svc.cluster.local:3000';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function isMobile(userAgent) {
  return userAgent.includes('Mobile');
}

// // Middleware to identify client type
// app.use((req, res, next) => {
//   req.isMobile = isMobile(req.headers['user-agent']);
//   next();
// });

// app.get('/cust/health', (req, res) => {
//   res.status(200).json({});
// });

app.get('/status', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.status(200).send('OK');
});

// Proxy endpoints
app.get('/customers/:id', async (req, res) => {
  try {
    console.log("in get cust by id")
    console.log(req);
    const { status, data } = await axios.get(`${customerServiceUrl}/customers/${req.params.id}`);
    var device = isMobile(req.headers['user-agent']);
    const filteredData = filterCustomerData(data, device);
    res.status(status).json(filteredData);
  } catch (err) {
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      console.error('Error:', err.message);
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }
});

app.get('/customers', async (req, res) => {
  try {
    console.log("in get cust by userid")
    console.log("request is",req);
    const response= await axios.get(`${customerServiceUrl}/customers?userId=${req.query.userId}`);
    console.log("response is",response);
    var device = isMobile(req.headers['user-agent']);
    const filteredData = filterCustomerData(response.data, device);
    res.status(response.status).json(filteredData);
  } catch (err) {
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      console.error('Error:', err.message);
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }
});

app.post('/customers', async (req, res) => {
  try {
    console.log("in post cust")
    console.log(req.data);
    const { status, data } = await axios.post(`${customerServiceUrl}/customers`, req.body);
    res.status(status).json(data);
  } catch (err) {
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      console.error('Error:', err.message);
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`BFF service is running on port ${PORT}`);
});