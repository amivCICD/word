import { wordOfTheDay } from "./getWordOfTheDay";
import { wordOfTheDayLetters } from "./getWordOfTheDay";
import { illuminateKeys } from "./illuminateKeys";


let incRow: number = 0;
let guess: string = "";

function checkForCorrectPosition(wordOfTheDayLetters: string[], guessArr: string[]) {
    let aux = Array.from({ length: 5 });
    let correctLetters = [];
    for (let i = 0; i < wordOfTheDayLetters.length; i++) {
        const element = wordOfTheDayLetters[i];
        if (element === guessArr[i]) {
            console.log('Match!')
            aux[i] = element;
            correctLetters.push(element);
        }
    }
    return { aux, correctLetters };
}
let keysArray = Array.from(document.querySelectorAll('.kbd'));
function checkForCorrectLetter(letter, yellowWorthy, correctPositionArr, count) {
    console.log('correctPositionArr\t', correctPositionArr);

    // if (yellowWorthy.length) {
        if (correctPositionArr[count] === letter.innerHTML) {
            letter.classList.remove('bg-black');
            letter.classList.add('bg-green-200');
            illuminateKeys(letter.innerHTML, "green");

            keysArray.filter((key) => key.innerHTML === letter.innerHTML)[0].classList.remove("bg-black")
            keysArray.filter((key) => key.innerHTML === letter.innerHTML)[0].classList.remove("bg-yellow-300")
            keysArray.filter((key) => key.innerHTML === letter.innerHTML)[0].classList.add("bg-green-200")

            // keysArray = keysArray.filter((key) => key.innerHTML !== letter.innerHTML);
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


let c: number = 0;
export async function appendGuess(divEl: HTMLDivElement[], guessFromPrev: string): Promise<number> {
    let restart = false;
    const guessAsArray = guessFromPrev.split("");
    let filt = guessAsArray.filter(letter => wordOfTheDayLetters.includes(letter));
    let yellowWorthy = [...new Set(filt)];
    let correctPositionArr = checkForCorrectPosition(wordOfTheDayLetters, guessAsArray).aux;


    // const match = checkForCorrectPosition(wordOfTheDayLetters, guessAsArray).aux;
    // console.log('match\t', match);
    // console.log('correctLetters\t', correctLetters);
    // checkForCorrectLetter(correctLetters, guessAsArray, wordOfTheDayLetters);
    // let correctLetters = checkForCorrectPosition(wordOfTheDayLetters, guessAsArray).correctLetters;

    for (const letter of divEl) {
        // letter.classList.toggle('animate-spin');
        letter.classList.toggle('box');
        await new Promise(res => setTimeout(res, 500));
        console.log(letter.innerHTML);
        // letter.classList.toggle('animate-spin');

        guess += letter.innerHTML;

        // if (wordOfTheDayLetters[c] === letter.innerHTML) {
        //     letter.classList.remove('bg-black');
        //     letter.classList.add('bg-green-200');
        // } else if (wordOfTheDayLetters.includes(letter.innerHTML) && wordOfTheDayLetters[c] !== letter.innerHTML) {
        //     letter.classList.remove('bg-black');
        //     letter.classList.add('bg-yellow-200');
        // }
        checkForCorrectLetter(letter, yellowWorthy, correctPositionArr, c);
        letter.classList.toggle('box');
        illuminateKeys(letter.innerHTML, "miss");


        c++;
    }
    if (guess === wordOfTheDay) {
        console.log('You got it!');
        restart = true;
    } else {
        guess = "";
    }
    c = 0;
    incRow++;
    return { incRow, restart };
}