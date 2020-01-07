const socket = io();

// elements
const $messageForm = document.querySelector("#messageForm");
const $messageFormInput = document.querySelector("input");
const $messageFormBtn = document.querySelector("button");
const $sendLocationBtn = document.querySelector("#sendLocation");
const $messages = document.querySelector("#messages");

// templates
const msgTemplate = document.querySelector("#message-template").innerHTML;
const locationMsgTemplate = document.querySelector("#location-message-template")
  .innerHTML;
const sideBarTemplate = document.querySelector("#sidebarTemplate").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoscroll = () => {
  const $newMessage = $messages.lastElementChild;
  const newMsgStyles = getComputedStyle($newMessage);
  const newMsgMargin = parseInt(newMsgStyles.marginBottom);
  const newMsgHeight = $newMessage.offsetHeight + newMsgMargin;

  const visibleHeight = $messages.offsetHeight;

  const containerHeight = $messages.scrollHeight;
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMsgHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

socket.on("message", ({ username, text, createdAt }) => {
  const html = Mustache.render(msgTemplate, {
    username,
    message: text,
    createdAt: moment(createdAt).format("h:mm a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sideBarTemplate, {
    room,
    users
  });
  document.querySelector("#sidebar").innerHTML = html;
});

socket.on("sendLocation", ({ username, url, createdAt }) => {
  const html = Mustache.render(locationMsgTemplate, {
    username,
    url,
    createdAt: moment(createdAt).format("h:mm a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
});

$messageForm.addEventListener("submit", e => {
  e.preventDefault();
  $messageFormBtn.setAttribute("disabled", "disabled");
  const message = e.target.elements.messageInput.value;
  socket.emit("sendMessage", message, error => {
    $messageFormBtn.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log("Message delivered successfully");
  });
});

$sendLocationBtn.addEventListener("click", e => {
  if (!navigator.geolocation) {
    return alert("geolocation is not supported by your browser");
  }
  $sendLocationBtn.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition(position => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      },
      () => {
        $sendLocationBtn.removeAttribute("disabled");
        console.log("Location details shared");
      }
    );
  });
});
