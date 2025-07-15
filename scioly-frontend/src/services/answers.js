import apiClient from "./apiClient";

const baseUrl = "/api/answers";

let token = null;

const setToken = (newToken) => {
  token = `Bearer ${newToken}`;
};

const getConfig = () => ({
  headers: { Authorization: token },
});

const create = async (newAnswer) => {
  const response = await apiClient.post(baseUrl, newAnswer, getConfig());
  return response.data;
};

const getByTestAndTeam = async (testId, teamId) => {
  const response = await apiClient.get(
    `${baseUrl}/${testId}/${teamId}`,
    getConfig(),
  );
  return response.data;
};

const update = async (testId, teamId, updatedAnswer) => {
  const response = await apiClient.put(
    `${baseUrl}/${testId}/${teamId}`,
    updatedAnswer,
    getConfig(),
  );
  return response.data;
};

const updateSpecific = async (
  testId,
  teamId,
  { questionId, answer, drawing },
) => {
  const response = await apiClient.patch(
    `${baseUrl}/${testId}/${teamId}`,
    { questionId, answer, drawing },
    getConfig(),
  );
  return response.data;
};

const getAll = async () => {
  const response = await apiClient.get(baseUrl, getConfig());
  return response.data;
};

export default {
  setToken,
  create,
  getByTestAndTeam,
  update,
  updateSpecific,
  getAll,
};
