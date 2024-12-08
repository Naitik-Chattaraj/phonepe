const express = require('express');
const axios = require('axios');
const sha256 = require('sha256');
const http = require("http");
const port = 3002;


const app= express();
const uniqid = require('uniqid');


const PHONE_PE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const MERCHANT_ID = "PGTESTPAYUAT86";
const SALT_INDEX = 1;
const SALT_KEY = "96434309-7796-489d-8924-ab56988a6076";

app.get("/", (req, res) => {
    res.send("PhonePe app is working");
});

app.get("/pay", (req, res) => {
    const payEndpoint = "/pg/v1/pay";
    const merchantTransactionId = uniqid();
    const userId = 123;
    const payload = {
        merchantId: MERCHANT_ID,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: userId,
        amount: 50000,
        redirectUrl: `https://phonepe-96d9.onrender.com/redirect-url/${merchantTransactionId}`,
        redirectMode: "REDIRECT",
        callbackUrl: "https://widense.com/payment-success",
        mobileNumber: "9999999999",
        paymentInstrument: {
            type: "PAY_PAGE"
        }

    };
    let bufferObj = Buffer.from(JSON.stringify(payload), "utf8");
    let base64EncodedPayload = bufferObj.toString("base64");
    const xVerify =
        sha256(base64EncodedPayload + payEndpoint + SALT_KEY) + "###" + SALT_INDEX;

    const options = {
        method: "post",
        url: `${PHONE_PE_HOST_URL}${payEndpoint}`,
        headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "X-VERIFY": xVerify,
        },
        data: {
            request: base64EncodedPayload,
        },
    };
    axios
        .request(options)
        .then(function (response) {
            console.log(response.data);
            const url = response.data.data.instrumentResponse.redirectInfo.url;
            res.redirect(url)
            //res.send(url)
        })
        .catch(function (error) {
            console.error(error);
        });
});

app.get("/redirect-url/:merchantTransactionId", (req, res) => {
    const { merchantTransactionId } = req.params;
    console.log('merchantTransactionId', merchantTransactionId)
    if (merchantTransactionId) {
        const xVerify = sha256(`/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` + SALT_KEY) + "###" + SALT_INDEX;
        const options = {
            method: 'get',
            url: `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                "X-MERCHANT-ID": merchantTransactionId,
                "X-VERIFY": xVerify
            },

        };
        axios
            .request(options)
            .then(function (response) {
                console.log(response.data);
                if (response.data.code === 'PAYMENT_SUCCESS') {
                    res.redirect("https://widense.com")
                }
                else if (response.data.code === 'PAYMENT_ERROR'){
                    res.redirect("https://widense.com/contact")
                }
                else if (response.data.code === 'PAYMENT_PENDING'){
                    window.redirect("https://widense.com/pay-here")
                }
                else{
                    window.redirect("windense.com/project")
                }
                res.send(response.data)
            })
            .catch(function (error) {
                console.error(error);
            });



    }
    else {
        res.send({ error: "Error" })
    }
})

app.listen(port, () => {
    console.log(`PhonePe application listening on port ${port}`);
});
