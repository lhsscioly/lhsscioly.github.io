import apiClient from "./apiClient";

const baseUrl = "/api/statistics";

let token = null;

const setToken = (newToken) => {
  token = `Bearer ${newToken}`;
};

const getConfig = () => ({
  headers: { Authorization: token },
});

// Get overall statistics for coaches
const getOverallStatistics = async (schoolYear = null) => {
  const url = schoolYear ? `${baseUrl}?schoolYear=${schoolYear}` : baseUrl;
  const response = await apiClient.get(url, getConfig());
  return response.data;
};

// Get individual student statistics
const getStudentStatistics = async (studentId) => {
  const response = await apiClient.get(`${baseUrl}/${studentId}`, getConfig());
  return response.data;
};

// Get submissions for a specific user (for enhanced Review)
const getUserSubmissions = async (userId) => {
  const response = await apiClient.get(
    `/api/submissions/user/${userId}`,
    getConfig(),
  );
  return response.data;
};

export default {
  setToken,
  getOverallStatistics,
  getStudentStatistics,
  getUserSubmissions,
};
