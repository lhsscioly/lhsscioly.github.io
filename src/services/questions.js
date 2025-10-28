import apiClient from "./apiClient";

const baseUrl = "/api/questions";

// Handles all backend communication for test questions

let token = null;

const setToken = (newToken) => {
  token = `Bearer ${newToken}`;
};

const getAll = async () => {
  const response = await apiClient.get(baseUrl, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

const createQuestion = async (questionObject) => {
  const response = await apiClient.post(baseUrl, questionObject, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

export default { setToken, getAll, createQuestion };
