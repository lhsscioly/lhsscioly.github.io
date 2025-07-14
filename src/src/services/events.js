import axios from "axios";

const baseUrl = "/api/events";

let token = null;

const setToken = (newToken) => {
  token = `Bearer ${newToken}`;
};

const getAll = async () => {
  const response = await axios.get(baseUrl);
  return response.data;
};

const createEvent = async (eventObject) => {
  const response = await axios.post(baseUrl, eventObject, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

const changeEvent = async (id, eventObject) => {
  const url = `${baseUrl}/${id}`;
  const response = await axios.put(url, eventObject, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

const deleteEvent = async (id) => {
  const url = `${baseUrl}/${id}`;
  const response = await axios.delete(url, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

export default { setToken, getAll, createEvent, changeEvent, deleteEvent };
