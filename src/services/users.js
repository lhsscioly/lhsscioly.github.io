import axios from "axios";
const baseUrl = "/api/users";

let token = null;

const setToken = (newToken) => {
  token = `Bearer ${newToken}`;
};

const getAll = async () => {
  const response = await axios.get(baseUrl);
  return response.data;
};

const createUser = async (credentials) => {
  const response = await axios.post(baseUrl, credentials);
  return response.data;
};

const resetPass = async (userData) => {
  const url = `${baseUrl}/reset/${userData.id}`;
  const response = await axios.put(
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
  const response = await axios.post(url, { email });
  return response.data;
};

const resetEmailPass = async (token, password) => {
  const url = `${baseUrl}/reset`;
  const response = await axios.post(url, { token, password });
  return response.data;
};

const verify = async (token) => {
  const url = `${baseUrl}/verify?token=${token}`;
  const response = await axios.get(url);
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
