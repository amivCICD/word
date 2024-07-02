let allKeyboardLetters = document.querySelectorAll('.kbd');
let arrayOfKeys = Array.from(allKeyboardLetters);

export function illuminateKeys(letter: string, colorCode: string): void {

    arrayOfKeys.forEach((key) => {
        if (key.innerHTML === letter) {
            console.log('key.innerHTML, letter', key.innerHTML, letter);

            switch (colorCode) {
                case "hit":
                    key.classList.add('bg-yellow-300');
                    key.classList.remove('text-pink-200');
                    key.classList.add('text-black');
                    break;
                case "green":
                    key.classList.add('bg-green-300');
                    key.classList.remove('bg-yellow-300');
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
        arrayOfKeys = arrayOfKeys.filter((key) => key.innerHTML !== letter);
    });
    console.log("arrayOfKeysFilter\t", arrayOfKeys);

}