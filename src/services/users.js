import apiClient from "./apiClient";

const baseUrl = "/api/users";

let token = null;

const setToken = (newToken) => {
  token = `Bearer ${newToken}`;
};

const getAll = async () => {
  const response = await apiClient.get(baseUrl);
  return response.data;
};

const createUser = async (credentials) => {
  const response = await apiClient.post(baseUrl, credentials);
  return response.data;
};

const resetPass = async (userData) => {
  const url = `${baseUrl}/reset/${userData.id}`;
  const response = await apiClient.put(
    url,
    { password: userData.password },
    {
      headers: {
        Authorization: token,
      },
    },
  );
  return response.data;
};

const forgot = async (email) => {
  const url = `${baseUrl}/forgot`;
  const response = await apiClient.post(url, { email });
  return response.data;
};

const resetEmailPass = async (token, password) => {
  const url = `${baseUrl}/reset`;
  const response = await apiClient.post(url, { token, password });
  return response.data;
};

const verify = async (token) => {
  const url = `${baseUrl}/verify?token=${token}`;
  const response = await apiClient.get(url);
  return response.data;
};

export default {
  setToken,
  getAll,
  createUser,
  resetPass,
  forgot,
  resetEmailPass,
  verify,
};
