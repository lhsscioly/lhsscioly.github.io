import apiClient from "./apiClient";

const baseUrl = "/api/tests";

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

const createTest = async (testObject) => {
  const response = await apiClient.post(baseUrl, testObject, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};

const updateTest = async (id, testObject) => {
  const response = await apiClient.put(
    `${baseUrl}/${id}`,
    { assignees: testObject.assignees },
    {
      headers: {
        Authorization: token,
      },
    },
  );
  return response.data;
};

export default { setToken, getAll, createTest, updateTest };
