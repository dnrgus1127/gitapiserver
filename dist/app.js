"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STALE_TIME = void 0;
const axios_1 = require("axios");
const { default: axios } = require("axios");
const express = require("express");
const app = express();
const { fetchData, fetchPosts, postTimeUpdate, getProjectTree, getPost } = require("./src/auto_update/fetchData");
exports.STALE_TIME = 1000 * 60 * 5;
const cors = require("cors");
const PROJECT_NAME_LIST = ["myport", "colorproject", "ringblog"];
require("dotenv").config();
let cachedata = null;
const storage = {
    repositoryList: {
        data: [],
        receivedDataTime: null,
    },
    readmeList: [],
};
// fetchData();
// setInterval(fetchData, AUTO_FETCH_TIME);
const corsOption = {
    origin: ["https://dnrgus1127.github.io", "http://localhost:3000"],
};
app.use(cors(corsOption));
app.use("/", (req, res, next) => {
    const today = new Date();
    console.log({
        ip: req.ip,
        time: today,
        uri: req.url.split("?")[0],
        method: req.method,
    });
    next();
});
app.get("/", (req, res) => {
    res.json(cachedata);
});
app.get("/repository", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield fetchData("https://api.github.com/users/dnrgus1127/repos", storage.repositoryList);
        res.json(storage.repositoryList.data);
    }
    catch (error) {
        next(error);
    }
}));
app.get("/readme/:projectName", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectName = req.params.projectName.toLowerCase();
        const readmeStorage = storage.readmeList.find((readme) => readme.name === projectName);
        if (!readmeStorage) {
            // reademe 초기화
            storage.readmeList.push({
                name: projectName,
                data: [],
                receivedDataTime: 0,
            });
            yield fetchData(`https://raw.githubusercontent.com/dnrgus1127/${projectName}/main/README.md`, storage.readmeList.at(-1));
        }
        else {
            // 이미 요청된적 있는 경우
            const index = storage.readmeList.findIndex((readme) => readme.name === projectName);
            yield fetchData(`https://raw.githubusercontent.com/dnrgus1127/${projectName}/main/README.md`, storage.readmeList[index]);
        }
        const index = storage.readmeList.findIndex((readme) => readme.name === projectName);
        res.send(storage.readmeList[index].data);
    }
    catch (error) {
        next(error);
    }
}));
app.get("/tree/:projectName", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const projectName = req.params.projectName;
    try {
        const data = yield getProjectTree(projectName);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}));
// 포스트 데이터 자동 쿼리
let postList = [];
const updatePost = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tmpPostList = yield fetchPosts();
        postList = yield postTimeUpdate(tmpPostList);
    }
    catch (err) {
        console.log("자동 쿼리 에러");
        console.log(err);
    }
});
updatePost();
setInterval(updatePost, 1000 * 60 * 30);
const checkLate = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios.get("https://api.github.com/rate_limit", {
            headers: {
                Authorization: `token ${process.env.TOKEN}`,
            },
        });
        console.log(response.resources.core);
    }
    catch (err) { }
});
setInterval(checkLate, 1000 * 60 * 58);
//-------------------------------------------------
// Blog
app.get("/postList", (req, res) => {
    res.json(postList);
});
app.get("/post/:title", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const title = req.params.title;
        const post = yield getPost(title);
        res.send(post);
    }
    catch (error) {
        next(error);
    }
}));
app.use((err, req, res, next) => {
    var _a;
    if ((0, axios_1.isAxiosError)(err)) {
        res.status(((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) || 404).send();
    }
    else {
        res.status(404).send("Not Found");
    }
});
app.listen(process.env.PORT, () => {
    console.log(`PORT : ${process.env.PORT}`);
});
