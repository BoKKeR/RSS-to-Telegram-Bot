import axios, { AxiosResponse } from "axios";

export const axiosInstance = axios.create();

export const getFeedData = async (
  url: string
): Promise<AxiosResponse<string>> => {
  const { data } = await axios.get(url);
  return data;
};
