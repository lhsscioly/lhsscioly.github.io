import axios from "axios";

// Configures API Client for reusability across services

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export default apiClient;
