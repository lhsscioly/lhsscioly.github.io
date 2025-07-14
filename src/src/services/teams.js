import axios from "axios";

const baseUrl = "/api/teams";

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

const createTeam = async (teamObject) => {
  const response = await axios.post(baseUrl, teamObject, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

const changeTeam = async (id, teamObject) => {
  const url = `${baseUrl}/${id}`;
  const response = await axios.put(url, teamObject, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

const deleteTeam = async (id) => {
  const url = `${baseUrl}/${id}`;
  const response = await axios.delete(url, {
    headers: {
      Authorization: token,
    },
  });
  if (response.status === 204) {
    return { id };
  }
};

export default { setToken, getAll, createTeam, changeTeam, deleteTeam };
