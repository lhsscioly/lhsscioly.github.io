import apiClient from "./apiClient";

// Handles backend communication for events, one of the few services that does not require authentication for basic access

const baseUrl = "/api/events";

let token = null;

const setToken = (newToken) => {
  token = `Bearer ${newToken}`;
};

const getAll = async () => {
  const response = await apiClient.get(baseUrl);
  return response.data;
};

const createEvent = async (eventObject) => {
  const response = await apiClient.post(baseUrl, eventObject, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

const changeEvent = async (id, eventObject) => {
  const url = `${baseUrl}/${id}`;
  const response = await apiClient.put(url, eventObject, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

const deleteEvent = async (id) => {
  const url = `${baseUrl}/${id}`;
  const response = await apiClient.delete(url, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

export default { setToken, getAll, createEvent, changeEvent, deleteEvent };
