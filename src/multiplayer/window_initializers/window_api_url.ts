const isLocalDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

window.API_URL = isLocalDev ? "http://localhost:1985" : "";
export const windowAPIURL = window.API_URL;

export const windowLocationOrigin = isLocalDev ? window.location.origin : "";
