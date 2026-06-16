import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
});

export const getPatients = async () => {
  const response = await api.get('/patients');
  return response.data;
};

export const getAlerts = async (options = {}) => {
  const response = await api.get('/alerts', {
    params: {
      include_dismissed: options.includeDismissed ? true : undefined,
    },
  });
  return response.data;
};

export const getPatientHistory = async (patientId) => {
  const response = await api.get(`/patients/${patientId}/history`);
  return response.data;
};

export const dismissAlert = async (id) => {
  const response = await api.post(`/alerts/${id}/dismiss`);
  return response.data;
};

export const predict = async (vitals) => {
  const response = await api.post('/predict', vitals);
  return response.data;
};

