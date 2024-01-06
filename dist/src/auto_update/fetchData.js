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
const app_1 = require("../../app");
const { default: axios } = require("axios");
const getAxiosWithToken = (api) => {
    return axios.get(api, {
        headers: {
            Authorization: `token ${process.env.TOKEN}`,
        },
    });
};
const fetchData = (api, storage) => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date().getTime();
    // staleTime이 만료되지 않았을 경우 return
    if (storage.receivedDataTime !== null && now - storage.receivedDataTime <= app_1.STALE_TIME) {
        console.log("fresh");
        return;
    }
    const response = yield axios.get(`${api}`, {
        headers: {
            Authorization: `token ${process.env.TOKEN}`,
        },
    });
    if (response.status === 200) {
        storage.data = response.data;
        storage.receivedDataTime = new Date().getTime();
    }
    else if (response.status === 403) {
        console.log("API LIMIT", response.status);
    }
});
const EXCLUSTION_POSTS = ["README.md"];
const fetchPosts = () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield getAxiosWithToken("https://api.github.com/repos/dnrgus1127/TIL/git/trees/main?recursive=10");
    const tree = response.data.tree;
    return tree
        .filter((node) => node.type === "blob")
        .filter((node) => !EXCLUSTION_POSTS.includes(node.path));
});
const postTimeUpdate = (postList) => __awaiter(void 0, void 0, void 0, function* () {
    const postPathList = postList.map((post) => post.path);
    const getAxiosList = postPathList.map((path) => getAxiosWithToken(`https://api.github.com/repos/dnrgus1127/TIL/commits?path=${path}&per_page=1&page=1`));
    return axios.all(getAxiosList).then(axios.spread((...rest) => {
        const postTimes = rest.map((item) => item.data[0].commit.committer.date);
        return postList.map((post, idx) => {
            return Object.assign(Object.assign({}, post), { timeStamp: postTimes[idx] });
        });
    }));
});
const getProjectTree = (projectName) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield getAxiosWithToken(`https://api.github.com/repos/dnrgus1127/${projectName}/git/trees/main?recursive=1`);
    return response.data;
});
const getPost = (title) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield getAxiosWithToken(`https://raw.githubusercontent.com/dnrgus1127/TIL/main/${encodeURIComponent(title)}`);
    return response.data;
});
module.exports = { fetchData, fetchPosts, postTimeUpdate, getProjectTree, getPost };
