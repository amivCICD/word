import { illuminateKeys } from "../key_handlers/illuminateKeys";

export function checkForCorrectLetter(letter: any, yellowWorthy: any, correctPositionArr: any, count: number) {

        let keysArray = Array.from(document.querySelectorAll('.kbd'));
        if (correctPositionArr[count] === letter.innerHTML) {
            letter.classList.remove('bg-black');
            letter.classList.add('bg-green-200');
            illuminateKeys(letter.innerHTML, "green");

            keysArray.filter((key) => key.innerHTML === letter.innerHTML)[0].classList.remove("bg-black")
            keysArray.filter((key) => key.innerHTML === letter.innerHTML)[0].classList.remove("bg-yellow-200")
            keysArray.filter((key) => key.innerHTML === letter.innerHTML)[0].classList.add("bg-green-200")

        }
        else if (yellowWorthy.includes(letter.innerHTML) && correctPositionArr.indexOf(letter.innerHTML) === -1) {
            letter.classList.remove('bg-black');
            letter.classList.add('bg-yellow-200');
            if (!correctPositionArr.includes(letter.innerHTML)) {
                illuminateKeys(letter.innerHTML, "hit");
            }
            yellowWorthy = yellowWorthy.shift();
        }
        else if (correctPositionArr[count] !== letter.innerHTML) {
            letter.classList.remove('bg-black');
            letter.classList.add('bg-slate-500');
            illuminateKeys(letter.innerHTML, "miss");
        }
}