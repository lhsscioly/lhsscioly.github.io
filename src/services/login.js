import apiClient from "./apiClient";

// Handles backend communication for logging in

const baseUrl = "/api/login";

const login = async (credentials) => {
  const response = await apiClient.post(baseUrl, credentials);
  return response.data;
};

export default { login };
