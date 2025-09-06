import { getGameState } from "../socket_related/initialize_web_socket";

export function wordDefinitionProvider() { // 09 04 2025
    const typeOutGuessGameState = getGameState();
    const definitions = typeOutGuessGameState.wordDefinition;
    const paragraphs = document.querySelectorAll('.wordDefinition');
    console.log("definitions in WordDefinitionProvider()", definitions);

    if (definitions.length >= 1) {
        paragraphs.forEach(p => {
            p.innerHTML = definitions.map((def) => {
                return `<span class="italic">${def.charAt(0).toUpperCase()}${def.slice(1)}. </span>`;
            }).join("");
        });
    }
}