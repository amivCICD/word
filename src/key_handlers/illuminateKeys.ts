let allKeyboardLetters = document.querySelectorAll('.kbd');
let arrayOfKeys = Array.from(allKeyboardLetters);

export function illuminateKeys(letter: string, colorCode: string, reset: any): void {
    arrayOfKeys.forEach((key) => {
        console.log('key.innerHTML | letter', key.innerHTML," | ", letter);
        if (key.textContent?.trim().toUpperCase() === letter.toUpperCase()) {
            console.log('INSIDE IF STATEMENT: key.innerHTML | letter', key.innerHTML," | ", letter);

            switch (colorCode) {
                case "hit":
                    key.classList.add('bg-yellow-200');
                    key.classList.remove('text-pink-200');
                    key.classList.add('text-black');
                    break;
                case "green":
                    key.classList.remove('bg-yellow-200');
                    key.classList.add('bg-green-200');
                    key.classList.remove('text-pink-200');
                    key.classList.add('text-black');
                    break;
                case "miss":
                    key.classList.add('bg-slate-500');
                    break;
                default:
                    break;
            }
        }
        // 08 27 2025
        arrayOfKeys = arrayOfKeys.filter((key) => key.textContent.trim().toUpperCase() !== letter.toUpperCase()); // this is filtering out the letters for later, and then the classes are
        if (reset) {
            arrayOfKeys = Array.from(document.querySelectorAll('.kbd'));
        }
    });
}
