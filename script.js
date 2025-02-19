const monthYear = document.getElementById("monthYear");
const calendar = document.getElementById("calendar");
let currentDate = new Date();

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
    const dayClass =
      i === new Date().getDate() &&
      date.getMonth() === new Date().getMonth() &&
      date.getFullYear() === new Date().getFullYear()
        ? "day today"
        : "day";
    calendar.innerHTML += `<div class="${dayClass}">${i}</div>`;
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
  alert(`You entered: ${prompt}`);
}

renderCalendar(currentDate);
