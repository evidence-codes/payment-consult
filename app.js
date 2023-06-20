const express = require("express")
const app = express()
const axios = require("axios");
const http = require("http");
const https = require("https")
const crypto = require("crypto")
require("dotenv").config();
const port = process.env.PORT || 5050

app.use(express.json())
// Endpoint to receive incoming data
app.post('/deposit', (req, res) => {
    // Handle the incoming data
    const {
        fname,
        lname,
        email,
        phone,
        address,
        city,
        state,
        country,
        zipcode,
        amount,
        currency,
        cctype,
        ccnumber,
        ccname,
        ccexpmonth,
        ccexpyear,
        cvv,
        merchantref,
        userip } = req.body;

    const depositData = {
        fname,
        lname,
        email,
        phone,
        address,
        city,
        state,
        country,
        zipcode,
        amount,
        currency,
        cctype,
        ccnumber,
        ccname,
        ccexpmonth,
        ccexpyear,
        cvv,
        merchantref,
        userip
    };

    // Perform any necessary processing or validation

    // Initiate the deposit
    initiateDeposit(depositData);
    // Function to generate TPC-HASH
    function generateTPCHash(fname, lname, phone, email, merchantref, secret, tpcCode) {
        const step1 = fname + lname + phone + email + merchantref;
        const step2 = crypto.createHash('sha256').update(step1 + secret).digest('hex');
        const step3 = crypto.createHmac('sha512', tpcCode).update(step2).digest('hex');
        return step3;
    }

    // Function to initiate a deposit
    function initiateDeposit(data) {
        const url = 'https://api.thepaymentconsultant.com/api/deposit/initiate';
        const secret = process.env.Secret;
        const tpcCode = process.env.TPC_CODE;

        // Generate TPC-HASH
        const tpcHash = generateTPCHash(
            data.fname,
            data.lname,
            data.phone,
            data.email,
            data.merchantref,
            secret,
            tpcCode
        );

        // Create the request payload
        const payload = JSON.stringify({
            ...data,
            'TPC-CODE': tpcCode,
            'TPC-HASH': tpcHash
        });

        const options = {
            hostname: 'api.thepaymentconsultant.com',
            path: '/api/deposit/initiate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                const response = JSON.parse(responseData);
                console.log('Deposit initiation response:', response);
            });
        });

        req.on('error', (error) => {
            console.error('Error initiating deposit:', error);
        });

        req.write(payload);
        req.end();
    }

    // Send a response if needed
    res.status(200).json({ status: 'success' });
});

app.post('/api/callback', async (req, res) => {

    const { txn_id, merchantref, amount, txn_status, hash_key } = req.body;

    const tpcCode = process.env.TPC_CODE;
    const secret = process.env.Secret;

    const hash = crypto.createHash('sha256').update(tpcCode + merchantref + amount + txn_status, secret).digest('hex');
    const data = {
        txn_id,
        merchantref,
        amount,
        txn_status,
        hash_key: hash
    }

    initiateCallback(data)

    function initiateCallback(data) {
        const url = 'https://api.thepaymentconsultant.com/api/deposit/initiate';
        const secret = 'your_secret';
        const tpcCode = 'your_tpc_code';


        // Create the request payload
        const payload = JSON.stringify({
            ...data,

        });

        const options = {
            hostname: 'api.thepaymentconsultant.com',
            path: '/api/deposit/initiate',
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                const response = JSON.parse(responseData);
                console.log('Deposit initiation response:', response);
            });
        });

        req.on('error', (error) => {
            console.error('Error initiating deposit:', error);
        });

        req.write(payload);
        req.end();
    }

    // Send a response if needed
    res.status(200).json({ status: 'success' });
})

// Endpoint to check deposit payment status
app.get('/deposit/status', (req, res) => {
    // Extract the transaction ID from the query parameters
    const txnId = req.query.txn_id;

    // Perform any necessary processing or validation
    // Function to generate PW-SIGNATURE
    function generatePWSignature(txnId, companySecret, tpcCode) {
        const step1 = txnId;
        const step2 = crypto.createHash('sha256').update(step1 + companySecret).digest('hex');
        const step3 = crypto.createHmac('sha512', tpcCode).update(step2).digest('hex');
        return step3;
    }

    // Function to check deposit payment status
    function checkPaymentStatus(txnId) {
        const url = `https://api.thepaymentconsultant.com/api/deposit/status?txn_id=${txnId}`;
        const companySecret = 'ca2c4bd1-a640-4df2-baec-72cfe4bc33fa';
        const tpcCode = 'rF4MlFK6Qy7aqCP';

        // Generate PW-SIGNATURE
        const pwSignature = generatePWSignature(txnId, companySecret, tpcCode);

        const options = {
            hostname: 'api.thepaymentconsultant.com',
            path: `/api/deposit/status?txn_id=${txnId}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'PW-SIGNATURE': pwSignature,
                'TPC-CODE': tpcCode
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                const response = JSON.parse(responseData);
                console.log('Deposit payment status response:', response);
            });
        });

        req.on('error', (error) => {
            console.error('Error checking deposit payment status:', error);
        });

        req.end();
    }

    // Check the deposit payment status
    checkPaymentStatus(txnId);

    // Send a response if needed
    res.status(200).json({ status: 'success' });
});


app.post("/api/refund", async (req, res) => {

    const { fname, lname, phone, email, merchantref, txn_id, amount } = req.body;

    const data = {
        txn_id,
        amount
    }

    initiateRefund(data)


    // Function to generate TPC-HASH
    function generateTPCHash(fname, lname, phone, email, merchantref, secret, tpcCode) {
        const step1 = fname + lname + phone + email + merchantref;
        const step2 = crypto.createHash('sha256').update(step1 + secret).digest('hex');
        const step3 = crypto.createHmac('sha512', tpcCode).update(step2).digest('hex');
        return step3;
    }

    // Function to initiate a deposit
    function initiateRefund(data) {
        const url = 'https://api.thepaymentconsultant.com/api/deposit/refund';
        const secret = process.env.Secret;
        const tpcCode = process.env.TPC_CODE;

        // Generate TPC-HASH
        const tpcHash = generateTPCHash(
            fname,
            lname,
            phone,
            email,
            merchantref,
            secret,
            tpcCode
        );

        // Create the request payload
        const payload = JSON.stringify({
            ...data,
            'TPC-CODE': tpcCode,
            'TPC-HASH': tpcHash
        });

        const options = {
            hostname: 'api.thepaymentconsultant.com',
            path: '/api/deposit/refund',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                const response = JSON.parse(responseData);
                console.log('Refund initiation response:', response);
            });
        });

        req.on('error', (error) => {
            console.error('Error initiating refund:', error);
        });

        req.write(payload);
        req.end();
    }

    // Send a response if needed
    res.status(200).json({ status: 'success' });
})
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})