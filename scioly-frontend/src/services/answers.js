import axios from "axios";

const baseUrl = "/api/answers";

let token = null;

const setToken = (newToken) => {
  token = `Bearer ${newToken}`;
};

const getConfig = () => ({
  headers: { Authorization: token },
});

const create = async (newAnswer) => {
  const response = await axios.post(baseUrl, newAnswer, getConfig());
  return response.data;
};

const getByTestAndTeam = async (testId, teamId) => {
  const response = await axios.get(`${baseUrl}/${testId}/${teamId}`, getConfig());
  return response.data;
};

const update = async (testId, teamId, updatedAnswer) => {
  const response = await axios.put(`${baseUrl}/${testId}/${teamId}`, updatedAnswer, getConfig());
  return response.data;
};

const updateSpecific = async (testId, teamId, { questionId, answer, drawing }) => {
  const response = await axios.patch(`${baseUrl}/${testId}/${teamId}`, { questionId, answer, drawing }, getConfig());
  return response.data;
};

const getAll = async () => {
  const response = await axios.get(baseUrl, getConfig());
  return response.data;
};

export default { 
  setToken, 
  create, 
  getByTestAndTeam, 
  update, 
  updateSpecific,
  getAll 
};
