
document.querySelector('.collapse').addEventListener('click', e => {
    document.getElementById("sendTextBtn")?.classList.toggle('fadeIn')
});

document.getElementById("arrowBar")?.addEventListener('click', e => {
    const innerWidth = window.innerWidth;
    if (innerWidth < 1024) {
        const clist = Array.from(e.target.parentNode.classList);
        if (!clist.includes("w-24")) {
            e.target.parentNode.classList.replace("w-80", "w-24")
        } else {
            e.target.parentNode.classList.replace("w-24", "w-80")
        }
        const justifyList = Array.from(e.target.parentNode.children[1].children[0].classList);
        if (justifyList.includes("justify-start")) {
            e.target.parentNode.children[1].children[0].classList.replace("justify-start", "justify-between");
        } else {
            e.target.parentNode.children[1].children[0].classList.replace("justify-between", "justify-start");
        }
    }

    let arrowDown = document.getElementById('arrowDown');
    let arrowUp = document.getElementById('arrowUp');
    arrowUp?.classList.toggle('hidden');
    arrowDown?.classList.toggle('hidden');
});


