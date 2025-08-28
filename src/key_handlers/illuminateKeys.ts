let allKeyboardLetters = document.querySelectorAll('.kbd');
let arrayOfKeys = Array.from(allKeyboardLetters);


export function illuminateKeys(letter: string, colorCode: string, reset: any): void {

    arrayOfKeys.forEach((key) => {
        if (key.textContent?.trim().toUpperCase() === letter.toUpperCase()) {
            console.log('key.innerHTML, letter', key.innerHTML, letter);

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

        // not being applied to USED letters
        // if (reset) {
            //     arrayOfKeys = Array.from(allKeyboardLetters);
            // }
        if (reset) {
            // arrayOfKeys = Array.from(allKeyboardLetters);
            arrayOfKeys = Array.from(allKeyboardLetters).filter(
                (key) => /^[A-Z]$/i.test(key.textContent?.trim() ?? "")
            );
            // arrayOfKeys.forEach(key => {
            //     key.classList.remove("bg-yellow-200", "bg-green-200", "text-black", "bg-slate-500");
            //     key.classList.add("text-pink-200", "bg-black");
            // });

        }
        // else {
        //     arrayOfKeys = arrayOfKeys.filter((key) => key.innerHTML !== letter);
        // }

    });
}