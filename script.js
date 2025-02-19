const monthYear = document.getElementById("monthYear");
const calendar = document.getElementById("calendar");
const waitingScreen = document.getElementById("waitingScreen");

// Application State
let currentDate = new Date();
let tasks = [];

// Constants
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const API_ENDPOINT = "https://cyberpunk-calendar.YOUR_SUBDOMAIN.workers.dev/ai"; // Update this with your Cloudflare worker URL

/**
 * Initialize the calendar application
 */
function initializeCalendar() {
  // Load initial tasks from data.json
  fetch("/data.json")
    .then((response) => {
      if (!response.ok) throw new Error("Failed to load initial data");
      return response.json();
    })
    .then((data) => {
      tasks = data;
      renderCalendar(currentDate);
      console.log("Calendar initialized successfully");
    })
    .catch((error) => {
      console.error("Initialization error:", error);
      alert("Failed to load calendar data. Please refresh the page.");
    });
}

/**
 * Render the calendar with current tasks
 * @param {Date} date - The date to center the calendar on
 */
function renderCalendar(date) {
  try {
    calendar.innerHTML = "";

    // Get first day and last date of month
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const lastDate = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();

    // Update header
    monthYear.innerHTML = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    // Add empty cells for days before start of month
    for (let i = 0; i < firstDay; i++) {
      calendar.innerHTML += `<div></div>`;
    }

    // Add calendar days
    for (let i = 1; i <= lastDate; i++) {
      const currentDateStr = formatDate(
        new Date(date.getFullYear(), date.getMonth(), i),
      );
      const task = tasks.find((task) => task.date === currentDateStr);

      const isToday = isCurrentDay(i, date);
      const dayClass = isToday ? "day today" : "day";
      const taskText = task ? `<div class="tooltip">${task.task}</div>` : "";

      calendar.innerHTML += `
                <div class="${dayClass}" data-date="${currentDateStr}">
                    ${i}${taskText}
                </div>`;
    }
  } catch (error) {
    console.error("Render error:", error);
    alert("Error displaying calendar. Please refresh the page.");
  }
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Check if given day is current day
 * @param {number} day
 * @param {Date} date
 * @returns {boolean}
 */
function isCurrentDay(day, date) {
  const today = new Date();
  return (
    day === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Navigate to previous month
 */
function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
}

/**
 * Navigate to next month
 */
function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
}

/**
 * Handle AI prompt submission
 */
async function submitPrompt() {
  const promptInput = document.getElementById("aiPrompt");
  const prompt = promptInput.value.trim();

  if (!prompt) {
    alert("Please enter a goal or task description");
    return;
  }

  // Show loading screen
  waitingScreen.style.display = "flex";

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Update tasks with AI response or fallback
    if (data.response) {
      tasks = data.response;
      console.log("AI schedule generated successfully");
    } else if (data.fallback) {
      tasks = data.fallback;
      console.warn("Using fallback schedule");
      alert("AI service temporarily unavailable. Using default schedule.");
    }

    // Clear input and render updated calendar
    promptInput.value = "";
    renderCalendar(currentDate);
  } catch (error) {
    console.error("AI Processing error:", error);
    alert(`Failed to generate schedule: ${error.message}`);
    // Load fallback data if AI fails
    fetch("/data.json")
      .then((response) => response.json())
      .then((data) => {
        tasks = data;
        renderCalendar(currentDate);
        alert("Using default schedule as fallback.");
      });
  } finally {
    waitingScreen.style.display = "none";
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeCalendar();

  // Add keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prevMonth();
    if (e.key === "ArrowRight") nextMonth();
  });
});
