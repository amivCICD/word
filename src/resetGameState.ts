import { WordOfTheDay } from "./getWordOfTheDay";
// import { sWords } from "./sWords";

export class ResetGameState {
    reset: boolean;
    wordOfTheDay: string;
    wordOfTheDayLetters: string[];

    constructor(reset: boolean, sWords: string[]) {
        this.reset = reset;
        let currentWordOfTheDay = new WordOfTheDay(sWords);
        let w = currentWordOfTheDay.getWordOfTheDayAndLetters();
        this.wordOfTheDay = w.wordOfTheDay;
        this.wordOfTheDayLetters = w.wordOfTheDayLetters;

        document.querySelectorAll('.kbd').forEach((key) => {
        key.classList.remove('bg-yellow-200');
        key.classList.remove('bg-green-200');
        key.classList.remove('bg-slate-500');
        key.classList.add('bg-black');
        key.classList.remove('text-black');
        key.classList.add('text-pink-200');
        });
        document.querySelectorAll('.word-row').forEach((wordRow) => {
            wordRow.innerHTML = "";
            wordRow.classList.remove("bg-green-200");
            wordRow.classList.remove("bg-yellow-200");
            wordRow.classList.remove("bg-slate-500");
            wordRow.classList.add("bg-black");
        });
        console.log("reset");
    }
    setResetFalse(): void  {
        this.reset = false;
    }
  }

// export function ResetGameState(reset: boolean): object {
//     let currentWordOfTheDay = new WordOfTheDay(sWords);
//     let w = currentWordOfTheDay.getWordOfTheDayAndLetters();
//     let wordOfTheDay = w.wordOfTheDay;
//     let wordOfTheDayLetters = w.wordOfTheDayLetters;

//     document.querySelectorAll('.kbd').forEach((key) => {
//       key.classList.remove('bg-yellow-200');
//       key.classList.remove('bg-green-200');
//       key.classList.remove('bg-slate-500');
//       key.classList.add('bg-black');
//       key.classList.remove('text-black');
//       key.classList.add('text-pink-200');
//     });
//     document.querySelectorAll('.word-row').forEach((wordRow) => {
//         wordRow.innerHTML = "";
//         wordRow.classList.remove("bg-green-200");
//         wordRow.classList.remove("bg-yellow-200");
//         wordRow.classList.remove("bg-slate-500");
//         wordRow.classList.add("bg-black");
//     });
//     console.log("reset");

//     this.reset = reset;
//     this.setResetFalse = function() {
//         this.reset = false;
//     }
//     return { reset, wordOfTheDay, wordOfTheDayLetters };
//   }