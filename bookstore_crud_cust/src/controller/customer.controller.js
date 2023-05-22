/**
 * Ruta Deshpande
 * Andrew id - rutasurd
 * A3
 * Customer endpoints
 */

const { Kafka } = require('kafkajs');
const kafka = new Kafka({
  clientId: 'customer-service',
  brokers: ['44.214.218.139:9092','44.214.213.141:9092']
});


var dbConn  = require('../../config/db.config');

exports.getStatus = (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.status(200).send('OK');
};

/**
 * Adds a new customer to the system with the specified information, if the user ID is not already in use.
 *
 * req - The HTTP request object containing the customer information to add.
 * res - The HTTP response object that will contain the response message and/or data.
 * endpoint - {baseurl}/customers
 * post request
 */
exports.addCustomer  =  (req, res) => {
    const customerData = req.body;
    console.log(req.body);
    if (!customerData.userId || !customerData.name || !customerData.phone || !customerData.address || !customerData.city || !customerData.state || !customerData.zipcode) {
      console.log('Inside missing fields validation for add customer');
      res.status(400).json({ message: 'Missing required fields in the request body.' });
      return;
    }
    const userIdRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!userIdRegex.test(customerData.userId)) {
      console.log('Inside user id validation for add customer');
      res.status(400).json({ message: 'Invalid user ID value. User ID must be a valid email address.' });
      return;
    }
    const stateRegex = /^[A-Z]{2}$/;
    if (!stateRegex.test(customerData.state)) {
      console.log('Inside state regex validation for add');
      res.status(400).json({ message: 'Invalid state value. State must be a valid 2-letter US state abbreviation.' });
      return;
    }
    dbConn.query('SELECT * FROM customer WHERE userId = ?', customerData.userId, (err, result) => {
      if (err) {
        console.log('Error while adding customer', err);
      } else if (result.length > 0) {
        console.log('User id already exists in system');
        res.status(422).json({ message: 'This user ID already exists in the system.' });
      } else {
        dbConn.query(
          'INSERT INTO customer (userId, name, phone, address, address2, city, state, zipcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [customerData.userId, customerData.name, customerData.phone, customerData.address, customerData.address2 || null, customerData.city, customerData.state, customerData.zipcode, ],
          (err, result) => {
            if (err) {
              console.log('Error while adding customer', err);
            } else {
              console.log('Customer added successfully');
              const newCustomerId = result.insertId;
              const newCustomerData = { id: newCustomerId, ...customerData };
              res.status(201).json(newCustomerData);

              try {
                sendToKafka(newCustomerData);
                console.log('Message sent to Kafka');
              } catch (error) {
                console.error('Error sending message to Kafka:', error);
              }

            }
          }
        );
      }
    });
  };


  const sendToKafka = async (customerData) => {
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({
      topic: 'rutasurd.customer.evt',
      messages: [{ value: JSON.stringify(customerData) }]
    });
    await producer.disconnect();
  };  
  
/**
*
* Retrieves a customer from the system by their ID.
* req - The request object.
* res - The response object.
* endpoint - {baseurl}/customers/id
* get request
*/
  exports.retrieveCustomerById = (req, res) => {
    const customerId = req.params.id;
    console.log('In retrieve customer')
    if (isNaN(customerId)) {
      console.log('Invalid customer ID value. ID must be a valid integer');
      res.status(400).json({ message: 'Invalid customer ID value. ID must be a valid integer.' });
      return;
    }
    dbConn.query('SELECT * FROM customer WHERE id = ?', customerId, (err, result) => {
      if (err) {
        console.log('Error while retrieving customer', err);
      } else if (result.length === 0) {
        console.log('Customer not found.');
        res.status(404).json({ message: 'Customer not found.' });
      } else {
        const customerData = result[0];
        res.status(200).json(customerData);
      }
    });
  };

/**
*
* Retrieves a customer from the system by their userId.
* req - The request object.
* res - The response object.
* endpoint - {baseurl}/customers/userId
* get request
*/
  exports.retrieveCustomerByUserId = (req, res) => {
    const customerId = req.query.userId;
    console.log("customer id is - "+customerId);
    const userIdRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!userIdRegex.test(customerId)) {
      console.log('Inside user id validation for add customer');
      res.status(400).json({ message: 'Invalid user ID value. User ID must be a valid email address.' });
      return;
    }
    dbConn.query('SELECT * FROM customer WHERE userId = ?', customerId, (err, result) => {
      if (err) {
        console.log('Error while retrieving customer', err);
      } else if (result.length === 0) {
        console.log('Customer not found userid retrieval');
        res.status(404).json({ message: 'Customer not found.' });
      } else {
        const customerData = result[0];
        res.status(200).json(customerData);
      }
    });
  };

  
  