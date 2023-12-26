export interface APIStorage {
  repositoryList: RepositoryList;
  readmeList: Array<ReadmeType>;
}

export interface GithubDataType {
  data: any;
  receivedDataTime: any;
}

interface RepositoryList extends GithubDataType {
  data: Array<Object>;
}

interface ReadmeType extends GithubDataType {
  name: string;
}

export interface Tree {
  path: string;
  type: "tree" | "blob";
}
