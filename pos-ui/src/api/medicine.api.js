import axios from "./axios";

export const searchMedicines = async (q = "") => {
  const res = await axios.get(`/medicines/search?q=${q}`);
  return res.data.data;
};