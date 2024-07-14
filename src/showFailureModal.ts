export function showFailureModal(wordOfTheDay) {
    document.getElementById('failureModal').showModal();
    document.getElementById('wordOfTheDay').innerHTML = wordOfTheDay;
}