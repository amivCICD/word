export function getLocalCurrentUser() {
    const localUser = localStorage.getItem("username");
    const localUserInfo  = JSON.parse(localUser);
    return localUserInfo;
}