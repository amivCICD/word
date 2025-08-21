export function handleWiggleAnimation(row) {
    row.forEach((r) => {
        r.classList.add('animate-wiggle');
    });
    setTimeout(() => {
        row.forEach((r) => {
            r.classList.remove('animate-wiggle');
        });
    }, 750);
}