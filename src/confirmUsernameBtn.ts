let confirmUsernameBtn = document.getElementById("confirmUsernameBtn");
let usernameInput = document.getElementById("usernameInput");


confirmUsernameBtn.addEventListener('click', e => {
    if (usernameInput.value !== "") {
        localStorage.setItem("username", usernameInput.value);
        console.log(usernameInput.value);
    }
});