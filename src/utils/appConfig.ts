const tokenKey = "xsy_config_info";

export function getAppInfo() {
  return JSON.parse(<string>window.sessionStorage.getItem(tokenKey));
}

export function setAppInfo(data:object) {
  window.sessionStorage.setItem(tokenKey, JSON.stringify(data));
}

export function removeAppInfo() {
  return window.sessionStorage.removeItem(tokenKey);
}

