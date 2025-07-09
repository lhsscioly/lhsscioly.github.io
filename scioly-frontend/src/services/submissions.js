import axios from "axios";

const baseUrl = "/api/submissions";

let token = null;

const setToken = (newToken) => {
  token = `Bearer ${newToken}`;
};

const getConfig = () => ({
  headers: { Authorization: token },
});

const create = async (newSubmission) => {
  const response = await axios.post(baseUrl, newSubmission, getConfig());
  return response.data;
};

const getAll = async () => {
  const response = await axios.get(baseUrl, getConfig());
  return response.data;
};

const getById = async (id) => {
  const response = await axios.get(`${baseUrl}/${id}`, getConfig());
  return response.data;
};

const checkSubmission = async (testId, teamId) => {
  const response = await axios.get(`${baseUrl}/check/${testId}/${teamId}`, getConfig());
  return response.data;
};

const getByTeam = async (teamId) => {
  const response = await axios.get(`${baseUrl}/team/${teamId}`, getConfig());
  return response.data;
};

const update = async (id, updatedSubmission) => {
  const response = await axios.put(`${baseUrl}/${id}`, updatedSubmission, getConfig());
  return response.data;
};

export default { 
  setToken, 
  create, 
  getAll, 
  getById,
  checkSubmission,
  getByTeam,
  update
};
