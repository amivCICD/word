const cancelUsernameDialog = document.getElementById("cancelUsernameDialog");

cancelUsernameDialog?.addEventListener('click', e => {
    e.preventDefault();
    console.log("document.getElementById('arrowBar').value\t", document.getElementById("arrowBar").value)
    if (e && localStorage.getItem("username") === null || localStorage.getItem("username") === undefined) {
        document.getElementById("arrowBar").click();
    }
    const input = document.getElementById("usernameInput");
    input.value = "";
    document.getElementById("usernamePrompt")?.close();
});