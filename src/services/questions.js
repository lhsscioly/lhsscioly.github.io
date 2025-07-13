import axios from "axios";

const baseUrl = "/api/questions";

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

const createQuestion = async (questionObject) => {
  const response = await axios.post(baseUrl, questionObject, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

export default { setToken, getAll, createQuestion };
