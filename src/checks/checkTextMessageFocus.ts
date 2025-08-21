(function checkTextMessageFocus() {
    let focused = false;
    document.getElementById('textMessageInput')?.addEventListener('focus', e => {
        if (e) {
            focused = true;
            window.textMessageOnly = focused
            console.log(focused);
        }
    });
    document.getElementById('textMessageInput')?.addEventListener('blur', e => {
        if (e) {
            focused = false;
            window.textMessageOnly = focused
            console.log(focused);
        }
    });
})();