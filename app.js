const { default: axios } = require("axios");
const express = require("express");

const app = express();

const port = 48012;

const api = "https://api.github.com/repos/dnrgus1127/TIL/git/trees/main?recursive=10";

require('dotenv').config();

let cachedata = null;
const fetchData = async () => {
    const response = await axios.get(api, {
        headers: {
            Authorization: process.env.TOKEN,
        }
    })
    cachedata = response.data;
}

setInterval(fetchData, 5 * 60 * 1000);

app.use("/", (req, res, next) => {
    const today = new Date();
    console.log({
        time: today.getMilliseconds(),
        uri: req.url.split("?")[0],
        method: req.method,
        query: req.query,
        body: req.body,
    });
    next();
});

app.get("/", (req, res) => {
    res.json(cachedata);
})

app.listen(port, () => {
    console.log(`PORT : ${port}`);
})

