const TokenKey = "xsy_user_info";
const isLogin = window.sessionStorage.getItem(TokenKey);
const getToken = () => {
  return JSON.parse(<string>window.sessionStorage.getItem(TokenKey));
};
const setToken = (info: object) => {
  window.sessionStorage.setItem(TokenKey, JSON.stringify(info));
};
const clearToken = () => {
  window.sessionStorage.removeItem(TokenKey);
};
export {isLogin, getToken, setToken, clearToken};
