export function checkInputValues(e) {
    let inputValue;
    switch (e.key) {
        case "Space":
        case "Control":
        case "ControlLeft":
        case "Alt":
        case "AltLeft":
        case "AltRight":
        case "Tab":
        case "ShiftLeft":
        case "Shift":
        case "ShiftRight":
        case "Escape":
        case "Delete":
        case "CapsLock":
        case " ":
            inputValue = null;
            break;
        default:
            inputValue = e.key.toUpperCase();
          break;
      }
    return inputValue;
}

