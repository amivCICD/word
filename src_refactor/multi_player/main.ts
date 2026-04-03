type PlayerState = {
  playerId: string;
  username: string;
  connected: boolean;
  turnOrder: number;
  gameScore: number;
  totalScore: number;
};

type BoardCell = {
  letter: string;
  status: string;
};

type BoardRow = {
  cells: BoardCell[];
};

type RoomSnapshot = {
  roomId: string;
  status: string;
  wordLength: number;
  maxRows: number;
  players: PlayerState[];
  currentTurn: PlayerState | null;
  board: {
    activeRowIndex: number;
    rows: BoardRow[];
    keyboard: Record<string, string>;
  };
  revealedWord: string | null;
  debugWord: string;
  wordDefinition: string[];
  resetConfirmedPlayerIds: string[];
};

type ChatEnvelope = {
  type: "chat" | "join" | "leave";
  username: string;
  userId: string;
  message: string;
};

type GameEventResponse = {
  type: "roomState" | "invalidGuess" | "noop";
  message: string | null;
  snapshot: RoomSnapshot;
  scoringUsername: string | null;
  pointsAwarded: number;
};

type GameEventPayload = {
  type: "append" | "backspace" | "submit" | "resetVote" | "sync" | "renameUser";
  userId: string;
  letter: string;
  confirmed?: boolean;
  username?: string;
};

declare const confetti: ((options: Record<string, unknown>) => void) | undefined;

const isLocalDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const REFRACTOR_API_URL = isLocalDev ? "http://localhost:1985" : "";
const REFRACTOR_WS_HOST = isLocalDev ? "localhost:1985" : window.location.host;
const app = document.getElementById("app");
const DEFAULT_KEYBOARD_CLASS = "kbd text-pink-200 bg-black h-20";
const DEFAULT_ENTER_CLASS = "kbd text-pink-200 bg-black h-20";
const DEFAULT_BACKSPACE_CLASS = "kbd text-pink-200 bg-black font-bold w-16 sm:w-[73px] h-20";
const USERNAME_MAX_LENGTH = 15;

let chatSocket: WebSocket | null = null;
let gameSocket: WebSocket | null = null;
let keyboardEffectsBound = false;
let chatSendBound = false;
let gameplayInputBound = false;
let latestSnapshot: RoomSnapshot | null = null;
let currentRenderedRoomId: string | null = null;
let revealAnimationChain = Promise.resolve();
let roomActionsBound = false;
let lastTerminalSignature: string | null = null;
let lastHighlightedPlayerId: string | null = null;
let lastPlayerOrder: string[] = [];
let chatReconnectTimer: number | null = null;
let chatReconnectAttempts = 0;
let activeChatRoomId: string | null = null;
let suppressChatReconnect = false;

const MAX_CHAT_RECONNECT_ATTEMPTS = 5;

function normalizeSnapshot(snapshot: RoomSnapshot): RoomSnapshot {
  return {
    ...snapshot,
    players: snapshot.players.map((player) => ({
      ...player,
      gameScore: typeof player.gameScore === "number" ? player.gameScore : 0,
      totalScore: typeof player.totalScore === "number" ? player.totalScore : 0,
    })),
    currentTurn: snapshot.currentTurn
      ? {
          ...snapshot.currentTurn,
          gameScore: typeof snapshot.currentTurn.gameScore === "number" ? snapshot.currentTurn.gameScore : 0,
          totalScore: typeof snapshot.currentTurn.totalScore === "number" ? snapshot.currentTurn.totalScore : 0,
        }
      : null,
  };
}

function generateRoomId() {
  return `room_${Math.random().toString(36).slice(2, 11)}`;
}

function getRecentRoomId() {
  return localStorage.getItem("refactor-recent-room");
}

function setRecentRoomId(roomId: string) {
  localStorage.setItem("refactor-recent-room", roomId);
}

function getRoomId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("room");
}

function ensureLocalPlayer() {
  const stored = localStorage.getItem("refactor-chat-user");
  if (stored) {
    return JSON.parse(stored) as { username: string; userId: string };
  }

  const user = {
    username: `Player${Math.floor(Math.random() * 900 + 100)}`,
    userId: crypto.randomUUID(),
  };
  localStorage.setItem("refactor-chat-user", JSON.stringify(user));
  return user;
}

function setLocalPlayerUsername(username: string) {
  const trimmedUsername = username.trim().slice(0, USERNAME_MAX_LENGTH);
  if (!trimmedUsername) {
    throw new Error("Username is required");
  }

  const currentUser = ensureLocalPlayer();
  const updatedUser = {
    username: trimmedUsername,
    userId: currentUser.userId,
  };
  localStorage.setItem("refactor-chat-user", JSON.stringify(updatedUser));
  return updatedUser;
}

function setRoomMembership(roomId: string, playerId: string) {
  const existing = localStorage.getItem("refactor-room-memberships");
  const memberships = existing ? JSON.parse(existing) as Record<string, string> : {};
  memberships[roomId] = playerId;
  localStorage.setItem("refactor-room-memberships", JSON.stringify(memberships));
}

function getRoomMembership(roomId: string) {
  const existing = localStorage.getItem("refactor-room-memberships");
  if (!existing) {
    return null;
  }
  const memberships = JSON.parse(existing) as Record<string, string>;
  return memberships[roomId] ?? null;
}

function roomChooserMarkup(defaultRoomId: string, invited = false) {
  const currentUser = ensureLocalPlayer();
  const recentRoomLabel = !invited && defaultRoomId
    ? `<p class="mt-2 text-sm italic text-black/70">Recent room: <span class="font-bold lowercase">${defaultRoomId}</span></p>`
    : "";
  return `
    <div id="toastContainer" class="toast toast-top toast-center z-50"></div>
    <div class="flex flex-col gap-6">
      <div class="bg-transparent p-1 sm:p-4 flex flex-row items-center justify-start">
        <h1 class="text-2xl sm:text-4xl font-bold text-center text-black italic mx-auto">WORDLE</h1>
      </div>

      <div class="bg-white/70 border border-black rounded-md p-6 text-center text-black w-full">
        <p class="text-lg font-bold">Multiplayer Refactor</p>
        <p class="mt-2 italic">${invited ? "Choose your username and join the room you were invited to." : "Create a room or join an existing one with your chosen username."}</p>
        ${recentRoomLabel}
        <div class="mt-6 flex flex-col gap-3 justify-center items-center">
          <input id="username-input" class="input input-bordered bg-white text-black" value="${currentUser.username}" placeholder="username" maxlength="${USERNAME_MAX_LENGTH}" />
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <input id="room-id-input" class="input input-bordered bg-white text-center font-bold lowercase text-black ${invited ? "hidden" : ""}" value="${defaultRoomId}" placeholder="room id" />
            ${invited ? `<div class="flex items-center justify-center rounded-md border border-black bg-white px-4 py-3 text-center font-bold lowercase">${defaultRoomId}</div>` : `<button id="create-room-btn" class="btn bg-black text-pink-300">Create New Room</button>`}
            <button id="open-room-btn" class="btn bg-black text-pink-300">${invited ? "Join Room" : "Join Existing Room"}</button>
          </div>
        </div>
        <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a href="../multi_player_refactor/" class="btn bg-black text-pink-300">Reset</a>
        </div>
      </div>
    </div>
  `;
}

function boardMarkup() {
  let markup = "";
  for (let rowIndex = 0; rowIndex < 6; rowIndex++) {
    for (let colIndex = 0; colIndex < 5; colIndex++) {
      markup += `
        <div
          id="cell-${rowIndex}-${colIndex}"
          class="word-row bg-black row-start-${rowIndex + 1} w-[56px] h-[56px] sm:w-16 sm:h-16 flex items-center border-2 sm:border-3 border-white justify-center text-3xl sm:text-4xl font-bold text-pink-300"
        ></div>
      `;
    }
  }
  return markup;
}

function gameMarkup() {
  return `
    <div id="toastContainer" class="toast toast-top toast-center z-50"></div>

    <div class="bg-transparent p-1 sm:p-4 flex flex-row items-center justify-start">
      <h1 class="text-2xl font-bold text-center text-black italic sm:hidden ml-1">WORDLE</h1>
      <h1 class="text-2xl sm:text-4xl font-bold text-center text-black italic mx-auto hidden sm:flex">WORDLE</h1>
    </div>

    <div id="chatBar" class="collapse bg-white absolute right-2 top-2 w-24 lg:w-80 text-pink-300">
      <input id="arrowBar" type="checkbox" />
      <div class="collapse-title text-xl font-medium">
        <div class="flex flex-row justify-start lg:justify-between">
          <div>Chat</div>
          <div id="arrowDown" class="text-xl font-bold">&#9660;</div>
          <div id="arrowUp" class="text-xl font-bold hidden">&#9650;</div>
        </div>
      </div>
      <div class="collapse-content">
        <div id="textMessages" class="flex w-full pb-2 h-80 flex-col overflow-y-scroll flex-grow-0"></div>
        <div class="flex flex-row justify-end mt-auto gap-2">
          <input id="textMessageInput" type="text" placeholder="message..." class="input input-bordered w-[220px] bg-transparent" />
          <div id="sendTextBtn" class="btn w-16 bg-white text-pink-300 border-none hover:btn-pink hover:text-white">Send</div>
        </div>
      </div>
    </div>

    <div class="flex flex-col items-center justify-center py-4 gap-2">
      <span class="text-black italic font-bold">Players:</span>
  <!--    <div id="userTurn" class="mt-3 min-h-8 rounded-md bg-white/80 px-4 py-2 text-xl text-black font-bold"></div> -->
      <div id="playerQueue" class="mt-3 flex flex-col gap-2 w-full max-w-xs"></div>
    </div>

    <div id="mainTainer" class="grid grid-rows-6 grid-cols-5 place-items-center mx-auto gap-none sm:gap-1 w-fit">
      ${boardMarkup()}
    </div>

    <div class="w-full pt-2 sm:mt-10">
      <div class="my-1 flex justify-center gap-[1px] sm:gap-1 sm:text-xl font-bold select-none">
        <kbd data-key="Q" class="${DEFAULT_KEYBOARD_CLASS}">Q</kbd>
        <kbd data-key="W" class="${DEFAULT_KEYBOARD_CLASS}">W</kbd>
        <kbd data-key="E" class="${DEFAULT_KEYBOARD_CLASS}">E</kbd>
        <kbd data-key="R" class="${DEFAULT_KEYBOARD_CLASS}">R</kbd>
        <kbd data-key="T" class="${DEFAULT_KEYBOARD_CLASS}">T</kbd>
        <kbd data-key="Y" class="${DEFAULT_KEYBOARD_CLASS}">Y</kbd>
        <kbd data-key="U" class="${DEFAULT_KEYBOARD_CLASS}">U</kbd>
        <kbd data-key="I" class="${DEFAULT_KEYBOARD_CLASS}">I</kbd>
        <kbd data-key="O" class="${DEFAULT_KEYBOARD_CLASS}">O</kbd>
        <kbd data-key="P" class="${DEFAULT_KEYBOARD_CLASS}">P</kbd>
      </div>
      <div class="my-1 flex w-full justify-center gap-[1px] sm:gap-1 sm:text-xl font-bold select-none">
        <kbd data-key="A" class="${DEFAULT_KEYBOARD_CLASS}">A</kbd>
        <kbd data-key="S" class="${DEFAULT_KEYBOARD_CLASS}">S</kbd>
        <kbd data-key="D" class="${DEFAULT_KEYBOARD_CLASS}">D</kbd>
        <kbd data-key="F" class="${DEFAULT_KEYBOARD_CLASS}">F</kbd>
        <kbd data-key="G" class="${DEFAULT_KEYBOARD_CLASS}">G</kbd>
        <kbd data-key="H" class="${DEFAULT_KEYBOARD_CLASS}">H</kbd>
        <kbd data-key="J" class="${DEFAULT_KEYBOARD_CLASS}">J</kbd>
        <kbd data-key="K" class="${DEFAULT_KEYBOARD_CLASS}">K</kbd>
        <kbd data-key="L" class="${DEFAULT_KEYBOARD_CLASS}">L</kbd>
      </div>
      <div class="my-1 flex w-full justify-center gap-[1px] sm:gap-1 sm:text-xl font-bold select-none">
        <kbd id="enter" class="${DEFAULT_ENTER_CLASS}">Enter</kbd>
        <kbd data-key="Z" class="${DEFAULT_KEYBOARD_CLASS}">Z</kbd>
        <kbd data-key="X" class="${DEFAULT_KEYBOARD_CLASS}">X</kbd>
        <kbd data-key="C" class="${DEFAULT_KEYBOARD_CLASS}">C</kbd>
        <kbd data-key="V" class="${DEFAULT_KEYBOARD_CLASS}">V</kbd>
        <kbd data-key="B" class="${DEFAULT_KEYBOARD_CLASS}">B</kbd>
        <kbd data-key="N" class="${DEFAULT_KEYBOARD_CLASS}">N</kbd>
        <kbd data-key="M" class="${DEFAULT_KEYBOARD_CLASS}">M</kbd>
        <kbd id="backspace" class="${DEFAULT_BACKSPACE_CLASS}">&lBarr;</kbd>
      </div>
    </div>

    <div id="gameStatusPanel" class="mt-4 bg-white/80 border border-black rounded-md p-4 text-black"></div>

    <dialog id="gameOverModal" class="modal text-black">
      <div class="modal-box bg-white border-4 border-pink-200">
        <h3 id="gameOverModalTitle" class="text-xl font-bold text-green-400">Game Over</h3>
        <p class="py-4">The word was: <span class="text-2xl sm:text-4xl text-pink-200 font-bold" id="gameOverWord"></span>!</p>
        <p class="text-lg font-bold text-green-400">Definition:</p>
        <p id="gameOverDefinition" class="py-1"></p>
        <div class="mt-4">
          <div class="font-bold text-black mb-2">Final Scores</div>
          <div id="modalScoreList" class="flex flex-col gap-2"></div>
        </div>
        <div class="mt-4">
          <div class="font-bold text-black mb-2">Restart Confirmations</div>
        <div id="modalResetVoteList" class="flex flex-col gap-2"></div>
        </div>
        <div class="mt-4 flex flex-col sm:flex-row gap-3">
          <label class="label cursor-pointer justify-start gap-4">
            <input id="modal-reset-vote-checkbox" type="checkbox" class="checkbox border-pink-300 [--chkbg:theme(colors.pink.300)] [--chkfg:black]" />
            <span class="label-text text-black">Vote To Restart Game</span>
          </label>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn bg-white text-black border-4 border-pink-200 hover:text-pink-200">Close</button>
          </form>
        </div>
      </div>
    </dialog>
  `;
}

function renderLanding(defaultRoomId = getRecentRoomId() ?? generateRoomId(), invited = false) {
  if (!app) return;
  currentRenderedRoomId = null;
  latestSnapshot = null;
  teardownChatSocket();
  app.className = "bg-transparent w-full min-h-screen sm:w-1/2 mx-auto p-0 sm:p-1 pb-10";
  app.innerHTML = roomChooserMarkup(defaultRoomId, invited);
  bindLandingControls();
}

function renderGameShell() {
  if (!app) return;
  app.className = "bg-transparent w-full min-h-screen sm:w-1/2 mx-auto p-0 sm:p-1 pb-10";
  app.innerHTML = gameMarkup();
  bindChatCollapse();
  bindKeyboardPressEffects();
  bindGameplayInput();
  bindChatSend();
  bindRoomActions();
}

function renderError(message: string) {
  if (!app) return;
  teardownChatSocket();
  app.className = "bg-transparent w-full min-h-screen sm:w-1/2 mx-auto p-4 sm:p-6";
  app.innerHTML = `
    <div class="bg-white/80 border border-red-600 rounded-md p-6 text-center text-black">
      <h1 class="text-xl font-bold text-red-600">Refactor Multiplayer</h1>
      <p class="mt-3">${message}</p>
      <div class="mt-6">
        <a href="../multi_player_refactor/" class="btn bg-black text-pink-300">Back To Refactor</a>
      </div>
    </div>
  `;
}

function getCellClasses(status: string) {
  const base = "word-row w-[56px] h-[56px] sm:w-16 sm:h-16 flex items-center border-2 sm:border-3 justify-center text-3xl sm:text-4xl font-bold";
  switch (status) {
    case "correct":
      return `${base} bg-green-200 border-green-200 text-black`;
    case "present":
      return `${base} bg-yellow-200 border-yellow-200 text-black`;
    case "miss":
      return `${base} bg-slate-500 border-slate-500 text-white`;
    default:
      return `${base} bg-black border-white text-pink-300`;
  }
}

function getKeyboardClasses(letter: string, status: string | undefined) {
  const base = letter === "ENTER"
    ? "kbd bg-black text-pink-200 h-20"
    : letter === "BACKSPACE"
      ? "kbd bg-black text-pink-200 font-bold w-16 sm:w-[73px] h-20"
      : "kbd bg-black text-pink-200 h-20";
  if (status === "correct") {
    return `${base} bg-green-200 text-black`;
  }
  if (status === "present") {
    return `${base} bg-yellow-200 text-black`;
  }
  if (status === "miss") {
    return `${base} bg-slate-500 text-white`;
  }
  return base;
}

function applySnapshot(snapshot: RoomSnapshot, options?: { revealRowIndex?: number | null }) {
  const previousSnapshot = latestSnapshot;
  latestSnapshot = snapshot;
  clearPressedKeyboardHighlights();

  const userTurn = document.getElementById("userTurn");
  if (userTurn) {
    userTurn.textContent = isTerminalStatus(snapshot.status)
      ? "Game Over"
      : snapshot.currentTurn?.username ?? "Waiting...";
  }

  renderPlayerQueue(snapshot);

  snapshot.board.rows.forEach((row, rowIndex) => {
    const shouldAnimateReveal = options?.revealRowIndex === rowIndex;
    row.cells.forEach((cell, colIndex) => {
      const element = document.getElementById(`cell-${rowIndex}-${colIndex}`);
      if (!element) {
        return;
      }

      const previousLetter = previousSnapshot?.board.rows[rowIndex]?.cells[colIndex]?.letter ?? "";
      if (!shouldAnimateReveal) {
        element.className = getCellClasses(cell.status);
        element.innerHTML = cell.letter || "";
      } else {
        element.className = getCellClasses("empty");
        element.innerHTML = cell.letter || "";
      }

      if (cell.letter !== previousLetter && cell.letter) {
        element.classList.add("animate-pulse");
        window.setTimeout(() => element.classList.remove("animate-pulse"), 250);
      }
    });
  });

  const keyboardElements = Array.from(document.querySelectorAll<HTMLElement>(".kbd"));
  keyboardElements.forEach((element) => {
    const keyValue = element.dataset.key?.toUpperCase()
      ?? (element.id === "enter" ? "ENTER" : element.id === "backspace" ? "BACKSPACE" : element.textContent?.trim().toUpperCase() ?? "");
    if (!keyValue) {
      return;
    }
    const status = keyValue === "ENTER" || keyValue === "BACKSPACE" ? undefined : snapshot.board.keyboard[keyValue];
    if (options?.revealRowIndex == null) {
      element.className = getKeyboardClasses(keyValue, status);
      element.style.color = status === "correct" || status === "present" ? "black" : status === "miss" ? "white" : "";
    } else if (keyValue === "ENTER" || keyValue === "BACKSPACE") {
      element.style.color = "";
    }
  });

  if (options?.revealRowIndex != null) {
    revealAnimationChain = revealAnimationChain.then(() => animateRevealRow(snapshot, options.revealRowIndex!));
  }

  highlightCurrentCell(snapshot);
  renderGameStatusPanel(snapshot);
  syncGameOverModal(snapshot);
}

async function fetchRoom(roomId: string) {
  const response = await fetch(`${REFRACTOR_API_URL}/api/rooms/${roomId}`);
  if (!response.ok) {
    throw new Error(`Failed to load room snapshot (${response.status})`);
  }
  return normalizeSnapshot((await response.json()) as RoomSnapshot);
}

async function postJson(url: string, payload?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }

  return normalizeSnapshot((await response.json()) as RoomSnapshot);
}

function captureMembership(roomId: string, username: string, snapshot: RoomSnapshot) {
  const player = snapshot.players.find((candidate) => candidate.username === username);
  if (player) {
    setRoomMembership(roomId, player.playerId);
  }
}

function bindLandingControls() {
  document.getElementById("create-room-btn")?.addEventListener("click", async () => {
    try {
      const usernameInput = document.getElementById("username-input") as HTMLInputElement | null;
      const user = setLocalPlayerUsername(usernameInput?.value ?? "");
      const roomId = generateRoomId();
      const snapshot = await postJson(`${REFRACTOR_API_URL}/api/rooms`, {
        roomId,
        hostUsername: user.username,
      });
      captureMembership(snapshot.roomId, user.username, snapshot);
      setRecentRoomId(snapshot.roomId);
      window.history.replaceState({}, "", `${window.location.pathname}?room=${snapshot.roomId}`);
      renderOrUpdateGame(snapshot);
    } catch (error) {
      renderError(error instanceof Error ? error.message : "Unable to create room");
    }
  });

  document.getElementById("open-room-btn")?.addEventListener("click", async () => {
    try {
      const usernameInput = document.getElementById("username-input") as HTMLInputElement | null;
      const user = setLocalPlayerUsername(usernameInput?.value ?? "");
      const roomId = (document.getElementById("room-id-input") as HTMLInputElement | null)?.value?.trim();
      const invitedRoomId = getRoomId();
      const targetRoomId = roomId || invitedRoomId;
      if (!targetRoomId) {
        throw new Error("Room ID is required");
      }
      const existingMembership = getRoomMembership(targetRoomId);
      const existingSnapshot = await fetchRoom(targetRoomId);
      const membershipStillExists = existingMembership
        ? existingSnapshot.players.some((player) => player.playerId === existingMembership)
        : false;
      const snapshot = membershipStillExists
        ? existingSnapshot
        : await postJson(`${REFRACTOR_API_URL}/api/rooms/${targetRoomId}/join`, {
            username: user.username,
          });
      captureMembership(snapshot.roomId, user.username, snapshot);
      setRecentRoomId(snapshot.roomId);
      window.history.replaceState({}, "", `${window.location.pathname}?room=${snapshot.roomId}`);
      renderOrUpdateGame(snapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to open room";
      if (message.includes("(404)")) {
        showLandingToast("That room does not exist. Click Create Room instead.");
        return;
      }
      if (message.toLowerCase().includes("room is full")) {
        showLandingToast("That room is full.");
        return;
      }
      if (message.toLowerCase().includes("username already exists")) {
        showLandingToast("That username is already taken in this room.");
        return;
      }
      showLandingToast("Unable to join that room right now.");
    }
  });
}

function showLandingToast(message: string) {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = "alert border border-red-500 bg-white text-red-500 shadow-lg";
  toast.innerHTML = `<span class="font-bold">${message}</span>`;
  toastContainer.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, 4000);
}

function showTransientToast(message: string, tone: "info" | "error" = "info", duration = 2500) {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = tone === "error"
    ? "alert border border-red-500 bg-white text-red-500 shadow-lg"
    : "alert border border-pink-300 bg-white text-black shadow-lg";
  toast.innerHTML = `<span class="font-bold">${message}</span>`;
  toastContainer.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, duration);
}

function renderOrUpdateGame(snapshot: RoomSnapshot) {
  const roomChanged = currentRenderedRoomId !== snapshot.roomId;
  if (roomChanged) {
    renderGameShell();
    currentRenderedRoomId = snapshot.roomId;
    connectChat(snapshot.roomId);
    connectGameplay(snapshot.roomId);
    latestSnapshot = null;
  }
  const revealRowIndex = findRevealRowIndex(latestSnapshot, snapshot);
  applySnapshot(snapshot, { revealRowIndex });
  console.log("Multiplayer room word:", snapshot.debugWord);
}

function connectChat(roomId: string) {
  if (activeChatRoomId === roomId && chatSocket && (chatSocket.readyState === WebSocket.OPEN || chatSocket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  teardownChatSocket();
  activeChatRoomId = roomId;
  suppressChatReconnect = false;
  chatReconnectAttempts = 0;
  openChatSocket(roomId, true);
}

function openChatSocket(roomId: string, announceJoin: boolean) {
  const user = ensureLocalPlayer();
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  chatSocket = new WebSocket(`${protocol}://${REFRACTOR_WS_HOST}/ws/chat?room=${roomId}`);

  chatSocket.addEventListener("open", () => {
    chatReconnectAttempts = 0;
    clearChatReconnectTimer();
    if (announceJoin) {
      chatSocket?.send(JSON.stringify({
        type: "join",
        username: user.username,
        userId: user.userId,
        message: `${user.username} joined the room`,
      } satisfies ChatEnvelope));
    } else {
      showTransientToast("Chat reconnected.", "info", 1500);
    }
  });

  chatSocket.addEventListener("message", (event) => {
    const envelope = JSON.parse(event.data) as ChatEnvelope;
    appendChatMessage(envelope);
    maybeShowJoinToast(envelope);
  });

  chatSocket.addEventListener("close", () => {
    if (suppressChatReconnect || !activeChatRoomId || latestSnapshot?.roomId !== activeChatRoomId) {
      return;
    }

    if (chatReconnectAttempts >= MAX_CHAT_RECONNECT_ATTEMPTS) {
      clearChatReconnectTimer();
      chatSocket = null;
      showTransientToast("Chat disconnected. Refresh or rejoin if you want chat back.", "error", 4000);
      return;
    }

    const attemptNumber = chatReconnectAttempts + 1;
    const delay = Math.min(1000 * attemptNumber, 4000);
    clearChatReconnectTimer();
    showTransientToast(`Chat reconnecting... (${attemptNumber}/${MAX_CHAT_RECONNECT_ATTEMPTS})`, "info", 1800);
    chatReconnectTimer = window.setTimeout(() => {
      chatReconnectAttempts += 1;
      if (activeChatRoomId && latestSnapshot?.roomId === activeChatRoomId) {
        openChatSocket(activeChatRoomId, false);
      }
    }, delay);
  });

  chatSocket.addEventListener("error", () => {
    // Retry scheduling is owned by the close handler to avoid duplicate timers.
  });
}

function clearChatReconnectTimer() {
  if (chatReconnectTimer != null) {
    window.clearTimeout(chatReconnectTimer);
    chatReconnectTimer = null;
  }
}

function teardownChatSocket() {
  suppressChatReconnect = true;
  clearChatReconnectTimer();
  if (chatSocket && (chatSocket.readyState === WebSocket.OPEN || chatSocket.readyState === WebSocket.CONNECTING)) {
    chatSocket.close();
  }
  chatSocket = null;
  activeChatRoomId = null;
  chatReconnectAttempts = 0;
}

function connectGameplay(roomId: string) {
  if (gameSocket && gameSocket.readyState === WebSocket.OPEN) {
    const currentUrl = new URL(gameSocket.url);
    if (currentUrl.searchParams.get("room") === roomId) {
      return;
    }
    gameSocket.close();
  }

  const membership = getRoomMembership(roomId);
  if (!membership) {
    return;
  }
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  gameSocket = new WebSocket(`${protocol}://${REFRACTOR_WS_HOST}/ws/game?room=${roomId}&userId=${encodeURIComponent(membership)}`);
  gameSocket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data) as GameEventResponse;
    payload.snapshot = normalizeSnapshot(payload.snapshot);
    renderOrUpdateGame(payload.snapshot);
    if (payload.type === "invalidGuess") {
      window.setTimeout(() => wiggleCurrentRow(payload.snapshot), 0);
    }
    if (payload.pointsAwarded > 0 && payload.scoringUsername) {
      showPointsToast(payload.scoringUsername, payload.pointsAwarded);
    }
  });
}

function findRevealRowIndex(previousSnapshot: RoomSnapshot | null, nextSnapshot: RoomSnapshot) {
  if (!previousSnapshot) {
    return null;
  }

  for (let rowIndex = 0; rowIndex < nextSnapshot.board.rows.length; rowIndex++) {
    const previousRow = previousSnapshot.board.rows[rowIndex];
    const nextRow = nextSnapshot.board.rows[rowIndex];
    const hadOnlyEmptyStatuses = previousRow.cells.every((cell) => cell.status === "empty");
    const nowHasEvaluatedStatuses = nextRow.cells.some((cell) => cell.status !== "empty");
    const sameLetters = nextRow.cells.every((cell, colIndex) => cell.letter === previousRow.cells[colIndex].letter);

    if (hadOnlyEmptyStatuses && nowHasEvaluatedStatuses && sameLetters) {
      return rowIndex;
    }
  }

  return null;
}

async function animateRevealRow(snapshot: RoomSnapshot, rowIndex: number) {
  const row = snapshot.board.rows[rowIndex];
  for (let colIndex = 0; colIndex < row.cells.length; colIndex++) {
    const cell = row.cells[colIndex];
    const element = document.getElementById(`cell-${rowIndex}-${colIndex}`);
    if (!element) {
      continue;
    }

    element.classList.add("box");
    await wait(500);
    element.className = getCellClasses(cell.status);
    element.innerHTML = cell.letter || "";
    element.classList.remove("box");
    updateKeyboardForCell(cell);
  }
}

function updateKeyboardForCell(cell: BoardCell) {
  const keyboardElement = findKeyboardElement(cell.letter);
  if (!keyboardElement) {
    return;
  }
  keyboardElement.className = getKeyboardClasses(cell.letter, cell.status);
  keyboardElement.style.color = cell.status === "correct" || cell.status === "present" ? "black" : cell.status === "miss" ? "white" : "";
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function highlightCurrentCell(snapshot: RoomSnapshot) {
  document.querySelectorAll<HTMLElement>(".current-cell-spinner").forEach((element) => {
    element.classList.remove("current-cell-spinner");
  });
  document.querySelectorAll<HTMLElement>(".current-cell-trace").forEach((element) => {
    element.remove();
  });

  if (isTerminalStatus(snapshot.status)) {
    return;
  }

  const rowIndex = snapshot.board.activeRowIndex;
  const row = snapshot.board.rows[rowIndex];
  if (!row) {
    return;
  }

  const nextEmptyIndex = row.cells.findIndex((cell) => !cell.letter);
  const colIndex = nextEmptyIndex >= 0 ? nextEmptyIndex : row.cells.length - 1;
  const cell = document.getElementById(`cell-${rowIndex}-${colIndex}`);
  if (!cell) {
    return;
  }

  cell.classList.add("current-cell-spinner");
  const trace = document.createElement("span");
  trace.className = "current-cell-trace";
  trace.setAttribute("aria-hidden", "true");
  trace.innerHTML = `
    <svg viewBox="0 0 72 72" preserveAspectRatio="none">
      <rect x="3" y="3" width="66" height="66"></rect>
    </svg>
  `;
  cell.appendChild(trace);
}

function bindKeyboardPressEffects() {
  if (keyboardEffectsBound) {
    return;
  }

  document.addEventListener("mousedown", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.classList.contains("kbd") && isLocalUsersTurn()) {
      target.classList.add("bg-pink-200");
    }
  });

  document.addEventListener("mouseup", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.classList.contains("kbd")) {
      target.classList.remove("bg-pink-200");
    }
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.id === "textMessageInput" || target?.id === "username-input" || target?.id === "room-id-input") {
      return;
    }
    if (!isLocalUsersTurn()) {
      return;
    }
    const normalized = normalizeKeyboardInput(event.key);
    if (!normalized) {
      return;
    }
    findKeyboardElement(normalized)?.classList.add("bg-pink-200");
  });

  document.addEventListener("keyup", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.id === "textMessageInput" || target?.id === "username-input" || target?.id === "room-id-input") {
      return;
    }
    if (!isLocalUsersTurn()) {
      return;
    }
    const normalized = normalizeKeyboardInput(event.key);
    if (!normalized) {
      return;
    }
    findKeyboardElement(normalized)?.classList.remove("bg-pink-200");
  });

  keyboardEffectsBound = true;
}

function bindGameplayInput() {
  if (gameplayInputBound) {
    return;
  }

  document.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.id === "textMessageInput" || target?.id === "username-input" || target?.id === "room-id-input") {
      return;
    }

    const normalized = normalizeKeyboardInput(event.key);
    if (!normalized) {
      return;
    }

    sendGameplayEvent(normalized);
  });

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target?.classList.contains("kbd")) {
      return;
    }

    const normalized = target.dataset.key?.toUpperCase()
      ?? (target.id === "enter" ? "ENTER" : target.id === "backspace" ? "BACKSPACE" : null);
    if (normalized) {
      sendGameplayEvent(normalized);
    }
  });

  gameplayInputBound = true;
}

function sendGameplayEvent(normalized: string) {
  if (!gameSocket || gameSocket.readyState !== WebSocket.OPEN || !latestSnapshot) {
    return;
  }

  const roomId = latestSnapshot.roomId;
  const localMembership = getRoomMembership(roomId);
  if (!localMembership || latestSnapshot.currentTurn?.playerId !== localMembership) {
    return;
  }

  if (normalized === "ENTER") {
    clearPressedKeyboardHighlights();
    gameSocket.send(JSON.stringify({ type: "submit", userId: localMembership, letter: "" } satisfies GameEventPayload));
    return;
  }

  if (normalized === "BACKSPACE") {
    clearPressedKeyboardHighlights();
    gameSocket.send(JSON.stringify({ type: "backspace", userId: localMembership, letter: "" } satisfies GameEventPayload));
    return;
  }

  gameSocket.send(JSON.stringify({ type: "append", userId: localMembership, letter: normalized } satisfies GameEventPayload));
}

function normalizeKeyboardInput(keyValue: string) {
  const upperKey = keyValue.toUpperCase();
  if (upperKey === "BACKSPACE") return "BACKSPACE";
  if (upperKey === "ENTER") return "ENTER";
  if (upperKey.length === 1 && upperKey >= "A" && upperKey <= "Z") return upperKey;
  return null;
}

function findKeyboardElement(normalized: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(".kbd")).find((element) => {
    const dataKey = element.dataset.key?.toUpperCase();
    if (dataKey) {
      return dataKey === normalized;
    }
    return element.id.toUpperCase() === normalized;
  });
}

function clearPressedKeyboardHighlights() {
  document.querySelectorAll<HTMLElement>(".kbd").forEach((element) => {
    element.classList.remove("bg-pink-200");
  });
}

function bindChatSend() {
  if (chatSendBound) {
    return;
  }

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.id === "sendTextBtn") {
      sendChatMessage();
    }
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.id === "textMessageInput" && event.key === "Enter") {
      sendChatMessage();
    }
  });

  chatSendBound = true;
}

function bindRoomActions() {
  if (roomActionsBound) {
    return;
  }

  document.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    if (target.id === "copy-room-link-btn") {
      if (!latestSnapshot) {
        return;
      }

      const link = `${window.location.origin}/multi_player_refactor/?room=${latestSnapshot.roomId}`;
      try {
        await navigator.clipboard.writeText(link);
        const previousText = target.textContent;
        target.textContent = "Copied";
        window.setTimeout(() => {
          target.textContent = previousText ?? "Copy Room Link";
        }, 1200);
      } catch {
        renderError("Unable to copy room link");
      }
      return;
    }

    if (target.id === "update-username-btn") {
      try {
        if (!latestSnapshot || !gameSocket || gameSocket.readyState !== WebSocket.OPEN) {
          return;
        }
        const membership = getRoomMembership(latestSnapshot.roomId);
        if (!membership) {
          return;
        }
        const currentUser = ensureLocalPlayer();
        const nextUsername = window.prompt("Update your username", currentUser.username);
        if (nextUsername == null) {
          return;
        }
        const updatedUser = setLocalPlayerUsername(nextUsername);
        gameSocket.send(JSON.stringify({
          type: "renameUser",
          userId: membership,
          letter: "",
          username: updatedUser.username,
        } satisfies GameEventPayload));
      } catch (error) {
        renderError(error instanceof Error ? error.message : "Unable to update username");
      }
      return;
    }

    if (target.id === "inline-reset-vote-checkbox" || target.id === "modal-reset-vote-checkbox") {
      const checkbox = target as HTMLInputElement;
      try {
        if (!latestSnapshot || !gameSocket || gameSocket.readyState !== WebSocket.OPEN) {
          return;
        }
        const membership = getRoomMembership(latestSnapshot.roomId);
        if (!membership) {
          return;
        }
        gameSocket.send(JSON.stringify({
          type: "resetVote",
          userId: membership,
          letter: "",
          confirmed: checkbox.checked,
        } satisfies GameEventPayload));
      } catch (error) {
        renderError(error instanceof Error ? error.message : "Unable to update reset vote");
      }
    }
  });

  roomActionsBound = true;
}

function sendChatMessage() {
  const input = document.getElementById("textMessageInput") as HTMLInputElement | null;
  const value = input?.value?.trim();
  if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN || !input || !value) {
    return;
  }

  const user = ensureLocalPlayer();
  chatSocket.send(JSON.stringify({
    type: "chat",
    username: user.username,
    userId: user.userId,
    message: value,
  } satisfies ChatEnvelope));
  input.value = "";
}

function appendChatMessage(envelope: ChatEnvelope) {
  const textMessages = document.getElementById("textMessages");
  if (!textMessages) {
    return;
  }

  const user = ensureLocalPlayer();
  const isLocalUser = envelope.userId === user.userId;
  const bubbleClass = envelope.type === "join" || envelope.type === "leave"
    ? "chat-bubble bg-white text-pink-300 border border-pink-300"
    : isLocalUser
      ? "chat-bubble bg-pink-300 text-white"
      : "chat-bubble bg-green-300 text-white";
  const alignment = envelope.type === "join" || envelope.type === "leave" ? "chat chat-center" : isLocalUser ? "chat chat-start" : "chat chat-end";

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="${alignment}">
      <div class="${bubbleClass}"><span class="font-bold">${envelope.username}</span>: ${envelope.message}</div>
    </div>
  `;
  textMessages.appendChild(wrapper);
  textMessages.scrollTo(0, textMessages.scrollHeight);
}

function bindChatCollapse() {
  document.querySelector(".collapse")?.addEventListener("click", () => {
    document.getElementById("sendTextBtn")?.classList.toggle("fadeIn");
  });

  document.getElementById("arrowBar")?.addEventListener("click", (event) => {
    const target = event.target as HTMLInputElement;
    const collapseRoot = target.parentElement;
    if (!collapseRoot) {
      return;
    }

    if (window.innerWidth < 1024) {
      if (collapseRoot.classList.contains("w-24")) {
        collapseRoot.classList.replace("w-24", "w-80");
      } else {
        collapseRoot.classList.replace("w-80", "w-24");
      }
    }

    document.getElementById("arrowUp")?.classList.toggle("hidden");
    document.getElementById("arrowDown")?.classList.toggle("hidden");
  });
}

function wiggleCurrentRow(snapshot: RoomSnapshot) {
  const rowIndex = snapshot.board.activeRowIndex;
  for (let colIndex = 0; colIndex < snapshot.wordLength; colIndex++) {
    const cell = document.getElementById(`cell-${rowIndex}-${colIndex}`);
    cell?.classList.add("animate-wiggle");
    window.setTimeout(() => cell?.classList.remove("animate-wiggle"), 750);
  }
}

function renderGameStatusPanel(snapshot: RoomSnapshot) {
  const panel = document.getElementById("gameStatusPanel");
  if (!panel) {
    return;
  }

  const confirmedPlayers = snapshot.players
    .filter((player) => snapshot.resetConfirmedPlayerIds.includes(player.playerId))
    .map((player) => player.username);
  const localMembership = getRoomMembership(snapshot.roomId);
  const hasConfirmedReset = localMembership ? snapshot.resetConfirmedPlayerIds.includes(localMembership) : false;
  const isTerminal = isTerminalStatus(snapshot.status);
  const title = snapshot.status === "COMPLETED" ? "Solved!" : snapshot.status === "FAILED" ? "Out Of Guesses" : "Restart Game";
  const description = snapshot.status === "COMPLETED"
    ? "The puzzle was solved."
    : snapshot.status === "FAILED"
      ? "The room ran out of rows."
      : "";
  const definitions = isTerminal && snapshot.wordDefinition.length
    ? snapshot.wordDefinition.map((definition) => `<span class="italic">${capitalizeDefinition(definition)}</span>`).join("<br>")
    : "";
  const confirmedList = confirmedPlayers.length ? confirmedPlayers.join(", ") : "No confirmations yet";

  panel.innerHTML = `
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="flex min-w-0 flex-1 flex-col gap-3">
        <div class="text-xl font-bold">${title}</div>
        ${description ? `<div>${description}</div>` : ""}
        ${isTerminal ? `<div><span class="font-bold">Word:</span> ${snapshot.revealedWord ?? "Unknown"}</div>` : ""}
        ${isTerminal ? `<div><div class="font-bold">Definition</div><div>${definitions || "Definition unavailable"}</div></div>` : ""}
        <div>
          <div class="font-bold">Vote To Restart Game</div>
          <div>${confirmedList}</div>
          <div id="inlineResetVoteList" class="mt-2 flex flex-col gap-1"></div>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <label class="label cursor-pointer justify-start gap-4">
            <input id="inline-reset-vote-checkbox" type="checkbox" class="checkbox border-pink-300 bg-white [--chkbg:theme(colors.pink.300)] [--chkfg:black]" ${hasConfirmedReset ? "checked" : ""} />
            <span class="label-text text-black">Vote To Restart Game</span>
          </label>
        </div>
      </div>
      <div class="flex flex-col gap-2 sm:ml-auto sm:w-auto sm:items-end justify-center">
        <button id="copy-room-link-btn" class="btn btn-static btn-sm bg-white px-3 text-black border border-black">Copy Room Link</button>
        <button id="update-username-btn" class="btn btn-static btn-sm bg-white px-3 text-black border border-black">Update Username</button>
        <a href="../multi_player_refactor/" class="btn btn-static btn-sm bg-black text-pink-300">Leave Room</a>
      </div>
    </div>
  `;

  renderResetVoteLists(snapshot);
}

function isTerminalStatus(status: string) {
  return status === "COMPLETED" || status === "FAILED";
}

function isLocalUsersTurn() {
  if (!latestSnapshot) {
    return false;
  }
  const membership = getRoomMembership(latestSnapshot.roomId);
  return Boolean(membership && latestSnapshot.currentTurn?.playerId === membership);
}

function renderPlayerQueue(snapshot: RoomSnapshot) {
  const queueContainer = document.getElementById("playerQueue");
  if (!queueContainer) {
    return;
  }

  const orderedPlayers = [...snapshot.players].sort((left, right) => left.turnOrder - right.turnOrder);
  queueContainer.className = "mt-3 flex w-full max-w-[320px] flex-col gap-2";
  const previousCurrentPlayerId = lastHighlightedPlayerId;

  queueContainer.innerHTML = orderedPlayers.map((player, index) => {
    const isCurrent = snapshot.currentTurn?.playerId === player.playerId;
    const currentIndex = orderedPlayers.findIndex((candidate) => candidate.playerId === snapshot.currentTurn?.playerId);
    const label = index === currentIndex ? "Current" : index === (currentIndex + 1) % orderedPlayers.length ? "Next" : "";
    return `
      <div data-player-pill="${player.playerId}" class="flex w-full items-center justify-between rounded-md border px-4 py-2 transition-all duration-500 ease-out overflow-hidden ${isCurrent ? "border-pink-300 bg-white shadow-sm opacity-100" : "border-black bg-white/70 opacity-70"}">
        <span class="min-w-0 truncate font-bold text-lg p-4 ${isCurrent ? "text-pink-300" : "text-black"}">${player.username}</span>
        <div class="ml-4 flex shrink-0 items-center gap-3">
          <span class="text-xs font-bold text-black p-4">${player.gameScore} game • ${player.totalScore} total</span>
          ${label
            ? `<span class="rounded-full p-4 text-[10px] font-semibold uppercase tracking-[0.18em] ${isCurrent ? "bg-pink-100 text-black" : " text-black"}">${label}</span>`
            : ""}
        </div>
      </div>
    `;
  }).join("");

  const currentPlayerId = snapshot.currentTurn?.playerId ?? null;
  const orderChanged = orderedPlayers.map((player) => player.playerId).join("|") !== lastPlayerOrder.join("|");
  if (!orderChanged && currentPlayerId && previousCurrentPlayerId && currentPlayerId !== previousCurrentPlayerId) {
    const previousPill = document.querySelector<HTMLElement>(`[data-player-pill="${previousCurrentPlayerId}"]`);
    const currentPill = document.querySelector<HTMLElement>(`[data-player-pill="${currentPlayerId}"]`);

    previousPill?.animate(
      [
        { opacity: 1, transform: "scale(1)", filter: "brightness(1)" },
        { opacity: 0.7, transform: "scale(1)", filter: "brightness(0.98)" },
      ],
      {
        duration: 1500,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );

    currentPill?.animate(
      [
        { opacity: 0.7, transform: "scale(1)", filter: "brightness(0.98)" },
        { opacity: 1, transform: "scale(1)", filter: "brightness(1)" },
      ],
      {
        duration: 1500,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );
  }

  if (currentPlayerId && currentPlayerId !== lastHighlightedPlayerId) {
    const currentPill = document.querySelector<HTMLElement>(`[data-player-pill="${currentPlayerId}"]`);
    currentPill?.animate(
      [
        { opacity: 0.3, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: 1500,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );
  }
  lastHighlightedPlayerId = currentPlayerId;
  lastPlayerOrder = orderedPlayers.map((player) => player.playerId);
}

function renderScoreList(snapshot: RoomSnapshot) {
  const sortedPlayers = [...snapshot.players].sort((left, right) => right.gameScore - left.gameScore || right.totalScore - left.totalScore || left.turnOrder - right.turnOrder);
  const markup = sortedPlayers.map((player, index) => `
    <div class="flex items-center justify-between rounded-md border ${index === 0 ? "border-pink-300 bg-white" : "border-black bg-white/70"}">
      <div class="flex items-center gap-3 p-3">
        <span class="text-sm font-bold p-2 ${index === 0 ? "text-pink-300" : "text-black"}">#${index + 1}</span>
        <span class="font-bold text-black">${player.username}</span>
      </div>
      <div class="p-2 text-right">
        <div class="text-sm font-bold text-black">${player.gameScore} game pts</div>
        <div class="text-xs text-black/70">${player.totalScore} total pts</div>
      </div>
    </div>
  `).join("");

  const modalScoreList = document.getElementById("modalScoreList");
  if (modalScoreList) {
    modalScoreList.innerHTML = markup;
  }
}

function renderResetVoteLists(snapshot: RoomSnapshot) {
  const listMarkup = snapshot.players.map((player) => {
    const checked = snapshot.resetConfirmedPlayerIds.includes(player.playerId);
    return `
      <label class="label cursor-default justify-start gap-4">
        <input type="checkbox" class="checkbox border-pink-300 bg-white [--chkbg:theme(colors.pink.300)] [--chkfg:black]" ${checked ? "checked" : ""} disabled />
        <span class="label-text text-black">${player.username}</span>
      </label>
    `;
  }).join("");

  const inlineList = document.getElementById("inlineResetVoteList");
  if (inlineList) {
    inlineList.innerHTML = listMarkup;
  }

  const modalList = document.getElementById("modalResetVoteList");
  if (modalList) {
    modalList.innerHTML = listMarkup;
  }
}

function syncGameOverModal(snapshot: RoomSnapshot) {
  const modal = document.getElementById("gameOverModal") as HTMLDialogElement | null;
  if (!modal) {
    return;
  }

  const modalTitle = document.getElementById("gameOverModalTitle");
  const modalWord = document.getElementById("gameOverWord");
  const modalDefinition = document.getElementById("gameOverDefinition");
  const modalCheckbox = document.getElementById("modal-reset-vote-checkbox") as HTMLInputElement | null;
  const membership = getRoomMembership(snapshot.roomId);

  if (modalTitle) {
    modalTitle.textContent = snapshot.status === "COMPLETED" ? "You got it!" : snapshot.status === "FAILED" ? "Nice try!" : "Restart Game";
  }
  if (modalWord) {
    modalWord.textContent = snapshot.revealedWord ?? snapshot.status;
  }
  if (modalDefinition) {
    modalDefinition.innerHTML = snapshot.wordDefinition.length
      ? snapshot.wordDefinition.map((definition) => `<span class="italic">${capitalizeDefinition(definition)}</span>`).join(" ")
      : "Definition unavailable";
  }
  if (modalCheckbox && membership) {
    modalCheckbox.checked = snapshot.resetConfirmedPlayerIds.includes(membership);
  }

  renderResetVoteLists(snapshot);
  renderScoreList(snapshot);

  const signature = `${snapshot.roomId}:${snapshot.status}:${snapshot.revealedWord ?? ""}`;
  if (isTerminalStatus(snapshot.status) && signature !== lastTerminalSignature) {
    revealAnimationChain = revealAnimationChain.then(async () => {
      if (snapshot.status === "COMPLETED") {
        fireOffConfetti();
      }
      if (!modal.open) {
        modal.showModal();
      }
    });
    lastTerminalSignature = signature;
  }

  if (!isTerminalStatus(snapshot.status)) {
    lastTerminalSignature = null;
    if (modal.open) {
      modal.close();
    }
  }
}

function fireOffConfetti() {
  if (!confetti) {
    return;
  }

  const duration = 15 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      window.clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function maybeShowJoinToast(envelope: ChatEnvelope) {
  if (envelope.type !== "join" && envelope.type !== "leave") {
    return;
  }

  const localUser = ensureLocalPlayer();
  if (envelope.userId === localUser.userId) {
    return;
  }

  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = "alert bg-white border border-pink-300 text-pink-300 shadow-lg";
  toast.innerHTML = `<span>${envelope.type === "join" ? `<span class="text-black">${envelope.username}</span> has entered the game` : `<span class="text-black">${envelope.username}</span> has left the game`}</span>`;
  toastContainer.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, 2750);
}

function showPointsToast(username: string, pointsAwarded: number) {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = "alert border-2 border-pink-300 bg-white text-black shadow-lg";
  toast.innerHTML = `
    <div class="flex items-center">
      <span class="font-bold">${username}&nbsp;</span>
      <span class="text-xl font-extrabold">+</span>
      <span class="text-xl font-extrabold text-green-300">${pointsAwarded}</span>
      <span class="font-bold">&nbsp;points!</span>
    </div>
  `;
  toastContainer.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, 2600);
}

function capitalizeDefinition(definition: string) {
  const trimmed = definition.trim();
  if (!trimmed) {
    return trimmed;
  }
  const normalized = trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
}

async function bootstrap() {
  try {
    const roomId = getRoomId();
    if (!roomId) {
      renderLanding();
      return;
    }

    const user = ensureLocalPlayer();
    const membership = getRoomMembership(roomId);
    const snapshot = await fetchRoom(roomId);
    setRecentRoomId(roomId);

    if (membership) {
      const membershipStillExists = snapshot.players.some((player) => player.playerId === membership);
      if (membershipStillExists) {
        renderOrUpdateGame(snapshot);
        return;
      }
    }

    const usernameAvailable = !snapshot.players.some((player) => player.username.toLowerCase() === user.username.toLowerCase());
    if (usernameAvailable) {
      const joinedSnapshot = await postJson(`${REFRACTOR_API_URL}/api/rooms/${roomId}/join`, {
        username: user.username,
      });
      captureMembership(joinedSnapshot.roomId, user.username, joinedSnapshot);
      renderOrUpdateGame(joinedSnapshot);
      return;
    }

    renderLanding(roomId, true);
    showLandingToast("That room is already using your saved username. Update it to join.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("(404)")) {
      renderLanding(getRoomId() ?? undefined, Boolean(getRoomId()));
      return;
    }
    renderError(message);
  }
}

void bootstrap();
