const monthYear = document.getElementById("monthYear");
const calendar = document.getElementById("calendar");
const waitingScreen = document.getElementById("waitingScreen");
let currentDate = new Date();
let tasks = [];

fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    tasks = data;
    renderCalendar(currentDate);
  })
  .catch((error) => console.error("Error fetching JSON data:", error));

function renderCalendar(date) {
  calendar.innerHTML = "";
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const lastDate = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();

  monthYear.innerHTML = date.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  for (let i = 0; i < firstDay; i++) {
    calendar.innerHTML += `<div></div>`;
  }

  for (let i = 1; i <= lastDate; i++) {
    const currentDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const task = tasks.find((task) => task.date === currentDateStr);
    const taskText = task ? `<div class="tooltip">${task.task}</div>` : "";
    const dayClass =
      i === new Date().getDate() &&
      date.getMonth() === new Date().getMonth() &&
      date.getFullYear() === new Date().getFullYear()
        ? "day today"
        : "day";
    calendar.innerHTML += `<div class="${dayClass}">${i}${taskText}</div>`;
  }
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
}

function submitPrompt() {
  const prompt = document.getElementById("aiPrompt").value;
  waitingScreen.style.display = "flex";

  console.log("Submitting prompt:", prompt);

  fetch("/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      waitingScreen.style.display = "none";
      console.log("Received data:", data);
      if (data.response) {
        tasks = data.response;
        renderCalendar(currentDate);
      } else {
        alert("Error generating plan. Please try again.");
      }
    })
    .catch((error) => {
      waitingScreen.style.display = "none";
      console.error("Error:", error);
      alert("Error generating plan. Please try again.");
    });
}
