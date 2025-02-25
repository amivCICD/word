const cancelUsernameDialog = document.getElementById("cancelUsernameDialog");

cancelUsernameDialog?.addEventListener('click', e => {
    e.preventDefault();
    if (e && localStorage.getItem("username") === null || localStorage.getItem("username") === undefined) {
        document.getElementById("arrowBar").click();
    }
    const input = document.getElementById("usernameInput");
    input.value = "";
    document.getElementById("usernamePrompt")?.close();
});

// possibly not using since username