const express = require('express');
var bodyParser = require('body-parser')

const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser());

app.get('/status',(request,response)=>{
    response.set('Content-Type', 'text/plain');
    response.status(200).send('OK');
});

//endoint for book operations
const routeControllerBook = require('./src/route/bookstore.route');
app.use('/books',routeControllerBook);


app.listen(port, ()=>{
    console.log(`Express is running at port ${port}`);
});