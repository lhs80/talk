const {origin, host,href} = window.location;
const SERVER_URL = {
  prefix: import.meta.env.MODE === 'development' ? 'https://192.168.10.254:8443/uicp/' : `${origin + apiURL}`,
  ws: import.meta.env.MODE === 'development' ? "wss://192.168.10.254:8443/uicp/ws/" : `wss://${host + apiURL}/ws/`,
  cx:import.meta.env.MODE === "development" ? 'https://192.168.10.254:8443/yst/italk' : href.substring(0, href.indexOf("main.html"))
};
export default SERVER_URL