const TokenKey = "share-screen";

export function getScreenInfo() {
  return JSON.parse(sessionStorage.getItem(TokenKey));
}

export function setScreenInfo(data) {
  sessionStorage.setItem(TokenKey, JSON.stringify(data));
}

export function removeScreenInfo() {
  return sessionStorage.removeItem(TokenKey);
}
