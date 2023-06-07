const express = require("express")
const app = express()
const axios = require("axios");
require("dotenv").config();
const port = process.env.PORT || 5050

let contain;

app.post('/api/deposit', async (req, res) => {
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

    try {
        const deposit = await axios.post("https://api.thepaymentconsultant.com/api/deposit/initiate", {
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
            userip,
            callbackurl: "https://payment-consult.onrender.com/api/callback",
            returnurl: "https://amconcept.org"
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        contain = deposit.data;
        res.status(200).json(deposit.data)

    } catch (err) {
        res.status(500).json({ message: err })
    }

})

app.post('/api/callback', async (req, res) => {
    try {
        const callback = await axios.post("https://payment-consult.onrender.com/api/callback", {
            txn_id: contain.txn_id,
            merchantref: contain.merchantref,
            amount: contain.amount,
            txn_status: contain.txn_status,
            hash_key: process.env.TPC_CODE + contain.merchantref + contain.txn_id + contain.amount + process.env.Secret
        },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
        res.status(200).json(callback.data)
    } catch (err) {
        res.status(500).json(err)
    }
})

app.post('/api/status', async (req, res) => {
    try {
        const status = await axios.post("https://api.thepaymentconsultant.com/api/deposit/status", {
            txn_id: contain.txn_id
        }, {
            headers: {
                'Content-Type': 'application/json',
                TPC_CODE: process.env.TPC_CODE,
                TPC_HASH: contain.txn_id + process.env.Secret + process.env.TPC_CODE
            }
        })
        res.status(200).json(status.data)
    } catch (err) {
        res.status(500).json(err)
    }
})

app.post("/api/refund", async (req, res) => {
    try {
        const refund = await axios.post("https://api.thepaymentconsultant.com/api/deposit/refund", {
            txn_id: contain.txn_id,
            amount: contain.amount
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        })
        res.status(200).json(refund.data)
    } catch (err) {
        res.status(500).json(err)
    }
})

app.listen(() => {
    console.log(`Server listening on port ${port}`)
})