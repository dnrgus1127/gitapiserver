import { NextFunction, Request, Response } from "express";
import { APIStorage, Tree } from "./src/auto_update/types/data";
import { isAxiosError } from "axios";

const { default: axios } = require("axios");
const express = require("express");
const app = express();
const { fetchData, fetchPosts, postTimeUpdate, getProjectTree, getPost } = require("./src/auto_update/fetchData");

export const STALE_TIME = 1000 * 60 * 5;
const cors = require("cors");

const PROJECT_NAME_LIST = ["myport", "colorproject", "ringblog"];

require("dotenv").config();

let cachedata: any = null;

const storage: APIStorage = {
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

app.use("/", (req: Request, res: Response, next: NextFunction) => {
  const today = new Date();
  console.log({
    ip: req.ip,
    time: today,
    uri: req.url.split("?")[0],
    method: req.method,
  });
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.json(cachedata);
});

app.get("/repository", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await fetchData("https://api.github.com/users/dnrgus1127/repos", storage.repositoryList);
    res.json(storage.repositoryList.data);
  } catch (error) {
    next(error);
  }
});

app.get("/readme/:projectName", async (req: Request, res: Response, next: NextFunction) => {
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
      await fetchData(
        `https://raw.githubusercontent.com/dnrgus1127/${projectName}/main/README.md`,
        storage.readmeList.at(-1)
      );
    } else {
      // 이미 요청된적 있는 경우
      const index = storage.readmeList.findIndex((readme) => readme.name === projectName);

      await fetchData(
        `https://raw.githubusercontent.com/dnrgus1127/${projectName}/main/README.md`,
        storage.readmeList[index]
      );
    }

    const index = storage.readmeList.findIndex((readme) => readme.name === projectName);

    res.send(storage.readmeList[index].data);
  } catch (error) {
    next(error);
  }
});

app.get("/tree/:projectName", async (req: Request, res: Response, next: NextFunction) => {
  const projectName = req.params.projectName;
  try {
    const data = await getProjectTree(projectName);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// 포스트 데이터 자동 쿼리
let postList: Array<Tree> = [];

const updatePost = async () => {
  try {
    const tmpPostList = await fetchPosts();
    postList = await postTimeUpdate(tmpPostList);
    console.log("포스트 자동 쿼리 성공");
  } catch (err) {
    console.log("포스트 자동 쿼리 에러");
  }
};

updatePost();
setInterval(updatePost, 1000 * 60 * 30);

const checkLate = async () => {
  try {
    const response: any = await axios.get("https://api.github.com/rate_limit", {
      headers: {
        Authorization: `token ${process.env.TOKEN}`,
      },
    });
    console.log(response.data.resources.core);
  } catch (err) {
    console.log(err);
  }
};

setInterval(checkLate, 1000 * 60 * 58);

//-------------------------------------------------

// Blog
app.get("/postList", (req: Request, res: Response) => {
  res.json(postList);
});

app.get("/post/:title", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const title = req.params.title;
    const post = await getPost(title);
    res.send(post);
  } catch (error) {
    next(error);
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (isAxiosError(err)) {
    res.status(err.response?.status || 404).send();
  } else {
    res.status(404).send("Not Found");
  }
});

app.listen(process.env.PORT, () => {
  console.log(`PORT : ${process.env.PORT}`);
});
