import { getGameState } from "../socket_related/initialize_web_socket";

export function wordDefinitionProvider() { // 09 04 2025
    const failureModal = document.getElementById("failureModal");
    failureModal?.close(); // get rid of all modals, so it doesnt show the new word definition and confuse people...
    const typeOutGuessGameState = getGameState();
    const definitions = typeOutGuessGameState.wordDefinition;
    const paragraphs = document.querySelectorAll('.wordDefinition');

    if (definitions.length >= 1) {
        paragraphs.forEach(p => {
            p.innerHTML = definitions.map((def) => {
                return `<span class="italic">${def.charAt(0).toUpperCase()}${def.slice(1)}. </span>`;
            }).join("");
        });
    }
}