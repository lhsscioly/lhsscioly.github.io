import apiClient from "./apiClient";

// Handles all backend communication for the teams for each event

const baseUrl = "/api/teams";

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

const createTeam = async (teamObject) => {
  const response = await apiClient.post(baseUrl, teamObject, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

const changeTeam = async (id, teamObject) => {
  const url = `${baseUrl}/${id}`;
  const response = await apiClient.put(url, teamObject, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

const deleteTeam = async (id) => {
  const url = `${baseUrl}/${id}`;
  const response = await apiClient.delete(url, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

export default { setToken, getAll, createTeam, changeTeam, deleteTeam };
