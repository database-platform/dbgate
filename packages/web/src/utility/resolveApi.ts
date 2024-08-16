import getElectron from './getElectron';

let apiUrl = null;
try {
  // apiUrl = process.env.API_URL;
  apiUrl = '/dbgatex/api';
} catch { }

export default function resolveApi() {
  if (apiUrl) {
    return apiUrl;
  }
  return (window.location.origin + window.location.pathname).replace(/\/*$/, '');
}

export function resolveApiHeaders() {
  const electron = getElectron();

  const res = {};
  const accessToken = localStorage.getItem('accessToken');
  const apiToken = localStorage.getItem('apiToken');
  if (accessToken) {
    res['Authorization'] = `Bearer ${accessToken}`;
    res['x-authorization'] = `${apiToken}`;
  }
  return res;
}
