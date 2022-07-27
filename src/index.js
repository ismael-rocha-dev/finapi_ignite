const uuid = require('uuid');
const express = require('express');

const app = express();
app.use(express.json());

const customers = [];

//middleware
const verifyAccountExistsCPF = (req, res, next) => {
    const { cpf } = req.headers;
    const customer = customers.find((customer) => customer.cpf === cpf);

    if (!customer) {
        return res.status(400).send({message: 'conta inexistente'});
    }

    req.customer = customer;
    next();
};

const getBalance = (statement) => {
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit') {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
};

//create account
app.post('/account', (req, res) => {
    const { cpf, name } = req.body;

    if(customers.some((customer) => customer.cpf === cpf)) {
        return res.status(400).send({message: "já existe uma conta com esse CPF"});
    };

    customers.push({
        cpf,
        name,
        id: uuid.v4(),
        statement: []
    });

    return res.status(201).send();
});

//get statement by cpf
app.get('/statement', verifyAccountExistsCPF, (req, res)  => {
    const customer = req.customer;
    return res.status(200).send(customer.statement);

});

//make a deposit
app.post('/deposit', verifyAccountExistsCPF, (req, res) => {
    const { amount, description} = req.body;
    
    const statementOperation = {
        amount,
        description,
        createdAt: new Date(),
        type: 'credit'
    };

    req.customer.statement.push(statementOperation);
    return res.status(200).send(statementOperation);
});

//withdraw money
app.post('/withdraw', verifyAccountExistsCPF, (req, res) => {
    const { amount } = req.body;
    const { customer } = req;
    const balance = getBalance(customer.statement);

    if( amount > balance){
        return res.status(400).send({message: 'Saldo insuficiente!'});
    }

    const statementOperation = {
        amount,
        createdAt: new Date(),
        type: 'debit'
    };

    customer.statement.push(statementOperation);
    return res.status(201).send(statementOperation);
    
});
app.listen(3333);