import { revealOrHideStartBtn } from "./revealOrHideStartBtn";

(function reHideStartGameBtn(): void {
    let currentTime: any = new Date();
    let midnight: any = new Date(currentTime);
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight: any = midnight - currentTime;
    setTimeout(() => {
        revealOrHideStartBtn(false); // hide at midnight
    }, timeUntilMidnight)
  })();