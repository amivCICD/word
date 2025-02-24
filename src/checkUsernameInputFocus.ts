(function checkUsernameInputFocus() {
    let focused = false;
    document.getElementById('usernameInput')?.addEventListener('focus', e => {
        if (e) {
            focused = true;
            window.usernameInputOnly = focused
            console.log(focused);
        }
    });
    document.getElementById('usernameInput')?.addEventListener('blur', e => {
        if (e) {
            focused = false;
            window.usernameInputOnly = focused
            console.log(focused);
        }
    });
})();