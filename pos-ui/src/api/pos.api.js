import axios from './axios';

// Create a new invoice
export const createInvoice = async (data) => {
  try {
    const response = await axios.post('/billing/create', data);
    return response.data;
  } catch (err) {
    console.error('Error creating invoice:', err);
    throw err;
  }
};