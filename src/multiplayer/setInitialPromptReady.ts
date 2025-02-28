window.initialPromptReady = false;
export function setInitialPromptReady() {
    // so players can begin typing and ENTER is not sent through on return key
    // goes to multi_player: index.html
    window.initialPromptReady = true;
}