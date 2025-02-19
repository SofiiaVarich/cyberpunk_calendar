const monthYear = document.getElementById("monthYear");
const calendar = document.getElementById("calendar");
const waitingScreen = document.getElementById("waitingScreen");
let currentDate = new Date();
let tasks = [];

// Initial load of tasks from data.json
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

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendar.innerHTML += `<div></div>`;
  }

  // Add calendar days
  for (let i = 1; i <= lastDate; i++) {
    const currentDateStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
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

async function submitPrompt() {
  const prompt = document.getElementById("aiPrompt").value;
  if (!prompt.trim()) {
    alert("Please enter a goal or task description");
    return;
  }

  waitingScreen.style.display = "flex";

  try {
    const response = await fetch("https://YOUR_CLOUDFLARE_WORKER_URL", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (data.response) {
      tasks = data.response;
    } else if (data.fallback) {
      tasks = data.fallback;
      alert("Using fallback schedule - AI service temporarily unavailable");
    }

    renderCalendar(currentDate);
  } catch (error) {
    console.error("Error:", error);
    alert("Error generating schedule. Please try again later.");
  } finally {
    waitingScreen.style.display = "none";
  }
}
