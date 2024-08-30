// import getElectron from './getElectron';

let apiUrl = null;
try {
  apiUrl = process.env.API_URL;
  // apiUrl = '/dbgatex/api';
} catch {}

export default function resolveApi() {
  if (apiUrl) {
    return apiUrl;
  }
  return (window.location.origin + window.location.pathname).replace(/\/*$/, '');
}
function getCookieValue(cookieName) {
  let cookieArray = document.cookie.split('; ');
  let cookieValue = null;

  for (let i = 0; i < cookieArray.length; i++) {
    let cookiePair = cookieArray[i].split('=');
    if (cookiePair[0] === cookieName) {
      cookieValue = decodeURIComponent(cookiePair[1]);
      break;
    }
  }

  return cookieValue;
}
export function resolveApiHeaders() {
  // const electron = getElectron();

  const res = {};
  // const accessToken = localStorage.getItem('accessToken');
  // const apiToken = localStorage.getItem('apiToken');
  const userInfoStr = getCookieValue('authorized-token');
  if (userInfoStr) {
    const userInfo = JSON.parse(userInfoStr);
    res['Authorization'] = `Bearer ${userInfo.accessToken}`;
    // res['x-authorization'] = `${apiToken}`;
  }
  return res;
}
