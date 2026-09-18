import axios from 'axios';

const API_URL = 'https://tikora-backend.onrender.com/api/api/events';

export const getAllEvents = async () => {
  // We do not need the auth header here because this is a public route
  const response = await axios.get(API_URL);
  return response.data;
};


export const getOrganizerDashboardStats = async () => {
  const response = await axios.get(`${API_URL}/organizer/stats`, getAuthHeader());
  return response.data;
};
