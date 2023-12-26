import { AxiosResponse, isAxiosError } from "axios";
import { STALE_TIME } from "../../app";
import { GithubDataType, Tree } from "./types/data";

const { default: axios } = require("axios");

const getAxiosWithToken = (api: string) => {
  return axios.get(api, {
    headers: {
      Authorization: `token ${process.env.TOKEN}`,
    },
  });
};

const fetchData = async (api: string, storage: GithubDataType) => {
  const now = new Date().getTime();

  // staleTime이 만료되지 않았을 경우 return
  if (storage.receivedDataTime !== null && now - storage.receivedDataTime <= STALE_TIME) {
    console.log("fresh");
    return;
  }

  const response: AxiosResponse = await axios.get(`${api}`, {
    headers: {
      Authorization: `token ${process.env.TOKEN}`,
    },
  });

  if (response.status === 200) {
    storage.data = response.data;
    storage.receivedDataTime = new Date().getTime();
  } else if (response.status === 403) {
    console.log("API LIMIT", response.status);
  }
};

const fetchPosts = async () => {
  const response: AxiosResponse = await getAxiosWithToken(
    "https://api.github.com/repos/dnrgus1127/TIL/git/trees/main?recursive=10"
  );

  const tree = response.data.tree;
  return tree.filter((node: Tree) => node.type === "blob");
};

const postTimeUpdate = async (postList: Array<Tree>) => {
  const postPathList = postList.map((post) => post.path);

  const getAxiosList = postPathList.map((path) =>
    getAxiosWithToken(`https://api.github.com/repos/dnrgus1127/TIL/commits?path=${path}&per_page=1&page=1`)
  );

  return axios.all(getAxiosList).then(
    axios.spread((...rest: any) => {
      const postTimes = rest.map((item: any) => item.data[0].commit.committer.date);

      return postList.map((post, idx) => {
        return { ...post, timeStamp: postTimes[idx] };
      });
    })
  );
};

const getProjectTree = async (projectName: string) => {
  const response: AxiosResponse = await getAxiosWithToken(
    `https://api.github.com/repos/dnrgus1127/${projectName}/git/trees/main?recursive=1`
  );

  return response.data;
};

const getPost = async (title: string) => {
  const response: AxiosResponse = await getAxiosWithToken(
    `https://raw.githubusercontent.com/dnrgus1127/TIL/main/${encodeURIComponent(title)}`
  );
  return response.data;
};

module.exports = { fetchData, fetchPosts, postTimeUpdate, getProjectTree, getPost };
