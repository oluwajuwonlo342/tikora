import axios from 'axios';

// Adjust this base URL if you have a centralized config
const API_URL = 'https://tikora-backend.onrender.com/api/api/tickets'; 

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const initializePurchase = async (purchaseData) => {
  const response = await axios.post(`${API_URL}/purchase/initialize`, purchaseData, getAuthHeader());
  return response.data;
};

export const verifyPurchase = async (reference) => {
  const response = await axios.post(`${API_URL}/purchase/verify`, { reference }, getAuthHeader());
  return response.data;
};

// ... existing imports and getAuthHeader ...

export const getMyTickets = async () => {
  const response = await axios.get(`${API_URL}/my-tickets`, getAuthHeader());
  return response.data;
};

export const getTicketById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthHeader());
  return response.data;
};
export const scanAndVerifyTicket = async (ticketCode) => {
  const response = await axios.post(`${API_URL}/scan`, { ticketCode }, getAuthHeader());
  return response.data;
};
