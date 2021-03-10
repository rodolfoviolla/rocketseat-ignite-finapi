const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3333;
const currentDate = new Date(Date.now());
const customers = [];

const verifyIfExistsAccountCPF = (request, response, next) => {
  const { cpf } = request.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) return response.status(400).send({ message: 'Customer not found' });

  request.customer = customer;
  
  return next();
}

const verifyIfAmountIsPositive = (request, response, next) => {
  const { amount } = request.body;

  if (amount <= 0) return response.status(400).json({ message: 'Amount must be a positive value' });

  request.amount = amount;

  return next();
}

const getBalance = (request, response, next) => {
  const { statement } = request.customer;

  request.customer.balance = statement.reduce(
    (acc, operation) => acc += operation.type === 'credit' ? operation.amount : -operation.amount
  , 0);

  return next();
}

app.use(express.json());

app.get('/', (request, response) => response.json({ message: currentDate }));

app.post('/account', (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(customer => customer.cpf === cpf);

  if (customerAlreadyExists) return response.status(400).json({ message: 'Customer already exists' });

  const customer = { id: uuidv4(), cpf, name, statement: [] };

  customers.push(customer);

  return response.status(201).json({ message: 'Customer created', customer });
});

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { statement } = request.customer;

  return response.status(200).json({ message: 'Statement found', statement });
});

app.post('/deposit', verifyIfExistsAccountCPF, verifyIfAmountIsPositive, (request, response) => {
  const { description } = request.body;
  const { customer, amount } = request;

  const statementOperation = { description, amount, created_at: new Date(), type: 'credit' };

  customer.statement.push(statementOperation);

  return response.status(201).json({ message: 'Deposit created', statementOperation });
});

app.post('/withdraw', verifyIfExistsAccountCPF, verifyIfAmountIsPositive, getBalance, (request, response) => {
  const { description } = request.body;
  const { customer, amount } = request;
  const { balance } = customer;

  if (balance < amount) return response.status(400).json({ message: 'Insufficient funds' });

  const statementOperation = { description, amount, created_at: new Date(), type: 'debit' };

  customer.statement.push(statementOperation);

  return response.status(201).json({ message: 'Withdraw created', statementOperation });
});

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  let { statement } = request.customer;
  let { date } = request.query;

  date = new Date(`${date} 00:00`);

  statement = statement.filter(operation => operation.created_at.toDateString() === new Date(date).toDateString());

  return response.status(200).json({ message: 'Statement found', statement });
});

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(200).json({ message: 'Customer updated', customer });
});

app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.status(200).json({ message: 'Customer found', customer });
});

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json({ message: 'Customer deleted' });
});

app.get('/balance', verifyIfExistsAccountCPF, getBalance, (request, response) => {
  const { balance } = request.customer;

  return response.status(200).json({ message: 'Balance found', balance });
});

app.listen(port, () => console.log(`-> Server running on port ${port}`));