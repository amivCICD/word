import { illuminateKeys } from "../key_handlers/illuminateKeys";

export function checkForCorrectLetter(
    letter: any,
    yellowWorthy: any,
    correctPositionArr: any,
    count: number
) {
    const char = letter.innerHTML;

    let keysArray = Array.from(document.querySelectorAll('.kbd'));
    if (correctPositionArr[count] === char) {
        letter.classList.replace('bg-black', 'bg-green-200');
        illuminateKeys(char, "green");

        keysArray.filter((key) => key.innerHTML === char)[0].classList.remove("bg-black");
        keysArray.filter((key) => key.innerHTML === char)[0].classList.remove("bg-yellow-200");
        keysArray.filter((key) => key.innerHTML === char)[0].classList.add("bg-green-200");

    }
    else if (yellowWorthy.includes(char) && correctPositionArr.indexOf(char) === -1) {
        letter.classList.replace('bg-black', 'bg-yellow-200');
        if (!correctPositionArr.includes(char)) {
            illuminateKeys(char, "hit");
        }
        yellowWorthy = yellowWorthy.shift();
    }
    else if (correctPositionArr[count] !== char) {
        letter.classList.replace('bg-black', 'bg-slate-500');
        illuminateKeys(char, "miss");
    }
}