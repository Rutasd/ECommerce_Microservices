/**
 * Ruta Deshpande
 * Andrew id - rutasurd
 * A3
 * CRM service
 */

// Import required libraries
const { Kafka } = require('kafkajs');
const nodemailer = require('nodemailer');
const express = require('express');
const app = express();
const port = 3000;

// Set up the liveness probe endpoint
app.get('/status', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.status(200).send('OK');
});

// Start the Express server for the liveness probe
app.listen(port, () => {
  console.log(`Liveness probe listening at http://localhost:${port}`);
});

// Configure the Kafka instance
const kafka = new Kafka({
  clientId: 'crm-service',
  brokers: ['44.214.218.139:9092','44.214.213.141:9092']
});

// Set up the email transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rutad111@gmail.com',
    pass: 'othhrxgwjhslwqac'
  }
});

// Function to send an email with the provided customer data
const sendEmail = async (customerData) => {
  const mailOptions = {
    from: 'rutad111@gmail.com',
    to: customerData.userId,
    subject: 'Activate your book store account',
    text: `Dear ${customerData.name},
Welcome to the Book store created by rutasurd.
Exceptionally this time we won’t ask you to click a link to activate your account.`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent to', customerData.userId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Function to run the Kafka consumer and process messages
const run = async () => {
  const consumer = kafka.consumer({ groupId: 'crm_group1' });

  await consumer.connect();
  await consumer.subscribe({ topic: 'rutasurd.customer.evt', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const customerData = JSON.parse(message.value.toString());
      await sendEmail(customerData);
    }
  });
};

// Start the Kafka consumer and catch any errors
run().catch(console.error);