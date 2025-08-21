
document.querySelector('.collapse').addEventListener('click', e => {
    document.getElementById("sendTextBtn")?.classList.toggle('fadeIn')
});

document.getElementById("arrowBar")?.addEventListener('click', e => {
    let arrowDown = document.getElementById('arrowDown');
    let arrowUp = document.getElementById('arrowUp');
    arrowUp?.classList.toggle('hidden');
    arrowDown?.classList.toggle('hidden');
});


