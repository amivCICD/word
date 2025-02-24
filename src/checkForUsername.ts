// check for existing username

export const usernameExists = (function checkForExistingUsername() {
    let username = false;

        if (localStorage.getItem("username") !== null) {
                username = localStorage.getItem("username");
                console.log(`username\t ${username}`);
            }
        else {
            console.warn('Username not yet set!')
        }

    return username;
})();
