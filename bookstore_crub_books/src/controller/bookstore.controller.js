/**
 * Ruta Deshpande
 * Andrew id - rutasurd
 * A3
 * Book endpoints
 */

const CircuitBreaker = require('./CircuitBreaker');
const circuitBreaker = new CircuitBreaker(3000, 60000);
var dbConn  = require('../../config/db.config');
const axios = require('axios');

exports.getStatus = (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.status(200).send('OK');
};

/**
 * Retrieves a book from the system by ISBN and returns its data as a JSON response.
 *
 * req - The HTTP request object containing the ISBN of the book to retrieve.
 * res - The HTTP response object that will contain the JSON response.
 * endpoint - {baseurl}/books/isbn
 * get request
 */
exports.retrieveBook = (req, res) => {
    const isbn = req.params.ISBN;
    dbConn.query('SELECT * FROM books WHERE ISBN = ?', isbn, (err, result) => {
      if (err) {
        console.log('Error while retrieving book', err);
         console.log(result)
        res.status(500).send('Internal Server Error');
      } else if (result.length == 0) {
        console.log(result)
        console.log('Book not found');
        res.status(404).json({ message: 'Book not found.' });
      } else {
        console.log(result)
        res.status(200).json(result[0]);
      }
    });
  };


  
  
/**
 * Adds a book to the system with the specified information, if the ISBN is not already in use.
 *
 * req - The HTTP request object containing the book information to add.
 * res - The HTTP response object that will contain the response message and/or data.
 * endpoint - {baseurl}/books
 * post request
 */
  exports.addBook = (req, res) => {
    const data = req.body;
  
    if (!data.ISBN || !data.title || !data.Author || !data.description || !data.genre || !data.price || !data.quantity) {
      res.status(400).json({ message: 'Missing required fields' });
      console.log('Inside required fields check for add');
      return;
    }
    dbConn.query('SELECT * FROM books WHERE ISBN = ?', data.ISBN, (err, result) => {
      if (err) {
        console.log('Error while adding book', err);
      } else if (result.length > 0) {
        res.status(422).json({ message: 'This ISBN already exists in the system.' });
        console.log('ISBN exists');
      } else {
        const priceRegex = /^\d+(\.\d{1,2})?$/;
        if (!priceRegex.test(data.price)) {
          res.status(400).json({ message: 'Invalid price format' });
          console.log('Inside price format check for add');
          return;
        }
        dbConn.query(
          'INSERT INTO books (ISBN, title, Author, description, genre, price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [data.ISBN, data.title, data.Author, data.description, data.genre, data.price, data.quantity,],
          (err, result) => {
            if (err) {
              console.log('Error while adding book', err);
            } else {
              console.log('Book added successfully');
              const newBookURL = req.protocol + '://' + req.get('host') + '/books/' + data.ISBN;
              res.set('Location', newBookURL).status(201).json(data);
            }
          }
        );
      }
    });
  };
  
/**
 * Updates the book to the system with the specified information.
 *
 * req - The HTTP request object containing the book information to update.
 * res - The HTTP response object that will contain the response message and/or data.
 * endpoint - {baseurl}/books/isbn
 * put request
 */
  exports.updateBook = (req, res) => {
    const isbn = req.params.ISBN;
    const data = req.body;
    if (!data.title || !data.Author || !data.description || !data.genre || !data.price || !data.quantity) {
      res.status(400).json({ message: 'Missing required fields' });
      console.log('Inside required fields check for update');
      return;
    }
    dbConn.query('SELECT * FROM books WHERE ISBN = ?', isbn, (err, result) => {
      if (err) {
        console.log('Error while updating book', err);
      } else if (result.length === 0) {
        console.log('ISBN not found in update');
        res.status(404).json({ message: 'ISBN not found' });
      } else {
        const priceRegex = /^\d+(\.\d{1,2})?$/;
        if (!priceRegex.test(data.price)) {
          res.status(400).json({ message: 'Invalid price format' });
          console.log('Inside price format check for update');
          return;
        }
        dbConn.query(
          'UPDATE books SET title = ?, Author = ?, description = ?, genre = ?, price = ?, quantity = ? WHERE ISBN = ?',
          [data.title, data.Author, data.description, data.genre, data.price, data.quantity, isbn, ],
          (err, result) => {
            if (err) {
              console.log('Error while updating book', err);
            } else {
              console.log('Book updated successfully');
              res.status(200).json({ ...data, ISBN: isbn });
            }
          }
        );
      }
    });
  };
  

  // Function to retrieve related books using an external service
exports.retrieveRelatedBooks = (req, res) => {
  // Check if the circuit breaker is open
  if (circuitBreaker.isOpen()) {
    res.status(503).json({ message: 'Circuit is open in the circuit breaker' });
    return;
  }

  // Get the ISBN from the request parameters
  const isbn = req.params.ISBN;

  // Define the external service URL
  const externalServiceURL = `http://44.214.218.139:80/recommended-titles/isbn/${isbn}`;

  // Make an HTTP GET request to the external service
  axios
    .get(externalServiceURL, { timeout: circuitBreaker.timeout })
    .then((response) => {
      // If the response status is 200, process the related books data
      if (response.status === 200) {
        const relatedBooks = response.data.map((book) => ({
          ISBN: book.isbn,
          title: book.title,
          Author: book.authors,
        }));
        res.status(200).json(relatedBooks);
        circuitBreaker.onSuccess();
        circuitBreaker.updateFirstCall(true);
        console.log(circuitBreaker.state)
      } else if (response.status === 204) {
        // If the response status is 204, send an empty response
        res.status(204).send();
        circuitBreaker.onSuccess();
        circuitBreaker.updateFirstCall(true);
        console.log(circuitBreaker.state)
      } else {
        // For other response statuses, send the status and status text
        res.status(response.status).send(response.statusText);
      }
    })
    .catch((error) => {
      // Handle errors based on the circuit breaker's firstCall state
      if (circuitBreaker.firstCall) {
        res.status(504).json({ message: 'External service timed out' });
        circuitBreaker.onTimeout();
        circuitBreaker.updateFirstCall(false);
        console.log(circuitBreaker.state)
      } else {
        res.status(503).json({ message: 'circuit is open in the circuit breaker' });
        circuitBreaker.onTimeout();
        circuitBreaker.updateFirstCall(false);
        console.log(circuitBreaker.state)
      }
    });
};