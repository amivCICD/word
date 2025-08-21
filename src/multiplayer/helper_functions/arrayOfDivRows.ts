
export function arrayOfDivRows(): [][] {
    const rows = document.querySelectorAll('.word-row');
    const arrayOfRows = Array.from(rows);

    let arrayOfRowArrays: Array<T> = [];
    for (let i = 0; i < arrayOfRows.length; i+=5) {
        const element = arrayOfRows.slice(i, i+5);
        arrayOfRowArrays.push(element);
    }
    return arrayOfRowArrays;
}