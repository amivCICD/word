let confirmUsernameBtn = document.getElementById("confirmUsernameBtn");
let usernameInput = document.getElementById("usernameInput");

confirmUsernameBtn.addEventListener('click', () => {
    if (usernameInput.value !== "") {
        localStorage.setItem("username", JSON.stringify({ username: usernameInput.value, id: Date.now() }));
        console.log("usernameInput.value:\t", usernameInput.value);
        const usernameModal = document.getElementById("usernamePrompt");
        usernameModal?.close();
        usernameInput.value = "";
    }
});

usernameInput.addEventListener('keyup', e => {

});