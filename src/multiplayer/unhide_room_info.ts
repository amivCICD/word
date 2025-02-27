export function unHideRoomId_clipoard_divs(windowLocationHref: string): void {
    // unhide textarea manual copy paste
    document.getElementById("dynamicRoomIdDiv")?.classList.remove("hidden");
    const textAreaRoomID = document.getElementById("roomIdReadOnly");
    textAreaRoomID.textContent = windowLocationHref;

    const copyGameToClipboard = document.getElementById("copyGameToClipboard");
    copyGameToClipboard.classList.remove("hidden");
    copyGameToClipboard?.addEventListener("click", () => {
        if (document.hasFocus()) {
            // writeToClipboard(windowLocationHref);
            wtc(windowLocationHref);
        }
    });
}
export function hideRoomId_clipoard_divs() {
    document.getElementById("dynamicRoomIdDiv")?.classList.add("hidden");
    document.getElementById("copyGameToClipboard")?.classList.add("hidden");
}

function wtc(windowLocationHref) {
    navigator.clipboard.writeText(windowLocationHref)
        .then(() => console.log("Copy Successful."))
        .catch((err) => console.error(err));
}

//async version was throwing errors, even though the text was being copied 02 27 2025

// async function writeToClipboard(windowLocationHref) {
//     const copyGameToClipboard = document.getElementById("copyGameToClipboard");
//     try {
//         const clipSuccessful = await navigator.clipboard.writeText(windowLocationHref);
//         if (clipSuccessful.ok) {
//             return true;
//         } else {
//             copyGameToClipboard.classList.add("btn-disabled");
//             copyGameToClipboard.innerText = "Copying Failed";
//             alert("Your browser does not support copying to the clipboard from this button. Please copy the link above manually.");
//             return false;
//         }
//     } catch (error) {
//         console.error("Error writing to clipboard. Browser must not support!");
//     }
// }
