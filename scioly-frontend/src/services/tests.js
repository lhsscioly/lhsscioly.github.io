import axios from "axios";

const baseUrl = "/api/tests";

let token = null;

const setToken = (newToken) => {
  token = `Bearer ${newToken}`;
};

const getAll = async () => {
  const response = await axios.get(baseUrl, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

const createTest = async (testObject) => {
  const response = await axios.post(baseUrl, testObject, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

export default { setToken, getAll, createTest };
