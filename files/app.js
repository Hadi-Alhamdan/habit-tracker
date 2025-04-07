document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

  const pages = document.querySelectorAll(".page");
  const navButtons = document.querySelectorAll("header nav button[data-page]");
  const dailyLogPage = document.getElementById("daily-log-page");
  const statsPage = document.getElementById("stats-page");
  const editItemsPage = document.getElementById("edit-items-page");
  const dataManagementPage = document.getElementById("data-management-page");

  // Daily Log Elements
  const dateInput = document.getElementById("log-date");
  const dailyLogContent = document.getElementById("daily-log-content");
  const finalScoreDisplay = document.getElementById("final-score-value");
  // *** CORRECTED ID HERE ***
  const saveLogButton = document.getElementById("save-daily-log");

  // Edit Habits Elements
  const addHabitForm = document.getElementById("add-habit-form");
  const habitsList = document.getElementById("habits-list");
  const editHabitModal = document.getElementById("edit-habit-modal");
  const editHabitForm = document.getElementById("edit-habit-modal-form");
  const editHabitIdInput = document.getElementById("edit-habit-id");
  const editHabitNameInput = document.getElementById("edit-habit-name");
  const editHabitWeightInput = document.getElementById("edit-habit-weight");
  const editHabitDescInput = document.getElementById("edit-habit-desc");
  const saveHabitChangesButton = document.getElementById("save-habit-changes");
  const cancelHabitEditButton = document.getElementById("cancel-habit-edit");

  // Stats Elements
  const statsRangeSelector = document.getElementById("stats-range-selector");
  const statsPresetButtons = statsRangeSelector?.querySelectorAll(
    ".stats-range-presets button[data-range]"
  );
  const statsCustomRangeDiv = statsRangeSelector?.querySelector(
    ".stats-range-custom"
  );
  const statsStartDateInput = document.getElementById("stats-start-date");
  const statsEndDateInput = document.getElementById("stats-end-date");
  const statsApplyCustomBtn = document.getElementById(
    "stats-apply-custom-range"
  );
  // *** CORRECTED IDs HERE ***
  const dailyScoreChartCtx = document
    .getElementById("daily-score-chart")
    ?.getContext("2d");
  const singleHabitChartCtx = document
    .getElementById("single-habit-chart")
    ?.getContext("2d");
  // *** CORRECTED ID HERE ***
  const habitStatsSelector = document.getElementById("habit-stats-selector");
  const overallStreakDisplay = document.getElementById("overall-streak-value");
  const habitStreakDisplay = document.getElementById("habit-streak-value");
  const dailyScoreChartTitle = document.getElementById(
    "daily-score-chart-title"
  );
  const habitPerfChartTitle = document.getElementById("habit-perf-chart-title");

  // Data Management Elements
  const exportButton = document.getElementById("export-data");
  const importButton = document.getElementById("import-data");
  const importFile = document.getElementById("import-file");
  const deleteButton = document.getElementById("delete-all-data");

  // Chart.js Instances
  let dailyScoreChartInstance = null;
  let singleHabitChartInstance = null;

  // Local Storage Keys
  const LOCAL_STORAGE_KEYS = {
    habits: "habitsData_v2",
    dailyLogs: "dailyLogsData_v2",
    appState: "appStateData_v2",
  };

  // Chart Colors (Catppuccin Macchiato) - Assuming this is correct
  const chartColors = {
    rosewater: "#f4dbd6",
    pink: "#f0c6c6",
    mauve: "#c6a0f6",
    red: "#ed8796",
    maroon: "#ee99a0",
    peach: "#f5a97f",
    yellow: "#eed49f",
    green: "#a6da95",
    teal: "#8bd5ca",
    sky: "#91d7e3",
    sapphire: "#7dc4e4",
    blue: "#8aadf4",
    lavender: "#b7bdf8",
    text: "#cad3f5",
    subtle: "#a5adce",
    overlay: "#939ab7",
    surface0: "#363a4f",
    surface1: "#494d64",
    surface2: "#5b6078",
    base: "#24273a",
    mantle: "#1e2030",
    crust: "#181926",
    // Backgrounds with alpha
    mauve_bg: "rgba(198, 160, 246, 0.25)",
    blue_bg: "rgba(138, 173, 244, 0.25)",
    green_bg: "rgba(166, 218, 149, 0.25)",
    grid: "rgba(73, 77, 100, 0.4)", // surface1 with alpha
  };

  // == APPLICATION STATE == (Keep the rest of your JS code the same)
  // ... rest of your app.js code ...

  // =========================================================================
  // == APPLICATION STATE
  // =========================================================================
  let habits = []; // Array of habit objects
  let dailyLogs = {}; // Object keyed by date string 'YYYY-MM-DD'
  let appState = { currentStreak: 0, lastScoreDate: null }; // Overall app state
  let currentStatsRange = { type: "30d", start: null, end: null }; // '7d', '30d', '90d', '365d', 'custom'

  // =========================================================================
  // == INITIALIZATION & UTILITIES
  // =========================================================================
  function init() {
    console.log("App Initializing (v3.3 - Stats Range Fixes)...");
    if (!dailyScoreChartCtx || !singleHabitChartCtx) {
      console.error("Chart canvas context not found.");
    }
    loadData();
    setupEventListeners();
    setDefaultDate();
    renderApp();
    console.log("App Initialization Complete.");
  }
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
  function formatDate(date) {
    try {
      const d = new Date(date);
      const offset = d.getTimezoneOffset();
      const adjustedDate = new Date(d.getTime() - offset * 60 * 1000);
      return adjustedDate.toISOString().split("T")[0];
    } catch (e) {
      console.error("Error formatting date:", date, e);
      return new Date().toISOString().split("T")[0];
    }
  }
  function setDefaultDate() {
    if (dateInput) {
      dateInput.value = formatDate(new Date());
    } else {
      console.error("Date input element not found.");
    }
  }

  // =========================================================================
  // == DATA MANAGEMENT
  // =========================================================================
  function safeJsonParse(key, defaultValue) {
    const item = localStorage.getItem(key);
    if (item === null || item === undefined) return defaultValue;
    try {
      return JSON.parse(item);
    } catch (error) {
      console.error(
        `Error parsing localStorage key "${key}":`,
        error,
        "Raw:",
        item
      );
      localStorage.removeItem(key);
      return defaultValue;
    }
  }
  function loadData() {
    console.log("Loading data...");
    habits = safeJsonParse(LOCAL_STORAGE_KEYS.habits, []);
    dailyLogs = safeJsonParse(LOCAL_STORAGE_KEYS.dailyLogs, {});
    appState = safeJsonParse(LOCAL_STORAGE_KEYS.appState, {
      currentStreak: 0,
      lastScoreDate: null,
    });
    let dataChanged = false;
    if (!Array.isArray(habits)) {
      habits = [];
      dataChanged = true;
      console.warn("Habits reset.");
    }
    habits = habits
      .map((h) => {
        if (typeof h !== "object" || h === null) return null;
        const sanitized = {
          id: typeof h.id === "string" && h.id ? h.id : generateId(),
          name: typeof h.name === "string" ? h.name.trim() : "Untitled Habit",
          description:
            typeof h.description === "string" ? h.description.trim() : "",
          weight: typeof h.weight === "number" && h.weight >= 0 ? h.weight : 10,
          isActive: typeof h.isActive === "boolean" ? h.isActive : true,
          createdDate:
            typeof h.createdDate === "string"
              ? h.createdDate
              : formatDate(new Date()),
          archivedDate:
            typeof h.archivedDate === "string" || h.archivedDate === null
              ? h.archivedDate
              : null,
        };
        const originalSubset = {
          id: h.id,
          name: h.name,
          description: h.description,
          weight: h.weight,
          isActive: h.isActive,
          createdDate: h.createdDate,
          archivedDate: h.archivedDate,
        };
        const sanitizedSubsetForCompare = { ...sanitized };
        if (
          JSON.stringify(originalSubset) !==
          JSON.stringify(sanitizedSubsetForCompare)
        ) {
          dataChanged = true;
        }
        return sanitized;
      })
      .filter((h) => h !== null);
    if (
      typeof dailyLogs !== "object" ||
      dailyLogs === null ||
      Array.isArray(dailyLogs)
    ) {
      dailyLogs = {};
      dataChanged = true;
      console.warn("DailyLogs reset.");
    }
    Object.entries(dailyLogs).forEach(([date, log]) => {
      if (typeof log !== "object" || log === null) {
        delete dailyLogs[date];
        dataChanged = true;
        console.warn(`Removed invalid log entry for date: ${date}`);
        return;
      }
      if (log.dailyTasks && !log.tasks) {
        console.log(`Migrating 'dailyTasks' to 'tasks' for log date ${date}`);
        if (Array.isArray(log.dailyTasks)) {
          log.tasks = log.dailyTasks.map((dt) => ({
            id: generateId(),
            name: typeof dt === "string" ? dt : dt.taskId || "Migrated Task",
            description: dt.description || "",
            assigned: typeof dt.assigned === "boolean" ? dt.assigned : false,
            done: typeof dt.done === "boolean" ? dt.done : false,
          }));
        } else {
          log.tasks = [];
        }
        delete log.dailyTasks;
        dataChanged = true;
      }
      const originalLogJson = JSON.stringify(log);
      log.focusedHours =
        typeof log.focusedHours === "number" && log.focusedHours >= 0
          ? log.focusedHours
          : 0;
      log.distractedHours =
        typeof log.distractedHours === "number" && log.distractedHours >= 0
          ? log.distractedHours
          : 0;
      log.isBreakDay =
        typeof log.isBreakDay === "boolean" ? log.isBreakDay : false;
      log.completedHabitIds = Array.isArray(log.completedHabitIds)
        ? log.completedHabitIds.filter((id) => typeof id === "string")
        : [];
      log.tasks = Array.isArray(log.tasks) ? log.tasks : [];
      log.finalScore =
        typeof log.finalScore === "number" ? log.finalScore : null;
      log.streakContinued =
        typeof log.streakContinued === "boolean" || log.streakContinued === null
          ? log.streakContinued
          : null;
      log.tasks = log.tasks
        .map((task) => {
          if (typeof task !== "object" || task === null) return null;
          return {
            id: typeof task.id === "string" && task.id ? task.id : generateId(),
            name:
              typeof task.name === "string"
                ? task.name.trim()
                : "Untitled Task",
            description:
              typeof task.description === "string"
                ? task.description.trim()
                : "",
            assigned:
              typeof task.assigned === "boolean" ? task.assigned : false,
            done: typeof task.done === "boolean" ? task.done : false,
          };
        })
        .filter((task) => task !== null);
      if (JSON.stringify(log) !== originalLogJson) {
        dataChanged = true;
      }
    });
    if (
      typeof appState !== "object" ||
      appState === null ||
      Array.isArray(appState)
    ) {
      appState = { currentStreak: 0, lastScoreDate: null };
      dataChanged = true;
      console.warn("AppState reset.");
    }
    appState.currentStreak =
      typeof appState.currentStreak === "number" && appState.currentStreak >= 0
        ? appState.currentStreak
        : 0;
    appState.lastScoreDate =
      typeof appState.lastScoreDate === "string" ||
      appState.lastScoreDate === null
        ? appState.lastScoreDate
        : null;
    if (dataChanged) {
      console.log("Data potentially changed. Resaving...");
      saveData();
    }
    console.log("Data loaded.", {
      habits: habits.length,
      logs: Object.keys(dailyLogs).length,
    });
  }
  function saveData() {
    console.log("Saving data...");
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.habits, JSON.stringify(habits));
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.dailyLogs,
        JSON.stringify(dailyLogs)
      );
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.appState,
        JSON.stringify(appState)
      );
      console.log("Data saved.");
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }

  // =========================================================================
  // == UI RENDERING & NAVIGATION
  // =========================================================================
  function renderApp() {
    console.log("Rendering App UI...");
    const activePageId =
      document.querySelector(".page.active")?.id || "daily-log-page";
    showPage(activePageId.replace("-page", ""));
  }
  function showPage(pageId) {
    console.log(`Switching to page: ${pageId}`);
    let pageFound = false;
    pages.forEach((page) => {
      const isActive = page.id === `${pageId}-page`;
      page.classList.toggle("active", isActive);
      if (isActive) pageFound = true;
    });
    if (!pageFound) {
      console.warn(`Page ID "${pageId}" not found, defaulting.`);
      pageId = "daily-log";
      pages.forEach((p) =>
        p.classList.toggle("active", p.id === "daily-log-page")
      );
    }
    updateNavigation(pageId);
    const currentLogDate = dateInput?.value || formatDate(new Date());
    if (pageId !== "stats") {
      if (dailyScoreChartInstance) {
        dailyScoreChartInstance.destroy();
        dailyScoreChartInstance = null;
      }
      if (singleHabitChartInstance) {
        singleHabitChartInstance.destroy();
        singleHabitChartInstance = null;
      }
    }
    switch (pageId) {
      case "daily-log":
        renderDailyLogPage(currentLogDate);
        updateFinalScoreDisplay(currentLogDate);
        break;
      case "stats":
        renderStatsPage();
        setupStatsRangeListeners(); // Re-attach listeners specific to stats page
        updateStatsRangeUI(); // Ensure UI reflects current state when page loads
        break;
      case "edit-items":
        renderEditPage();
        break;
      case "data-management":
        if (importFile) importFile.value = "";
        break;
      default:
        console.warn(`Unknown page target: ${pageId}`);
    }
  }
  function updateNavigation(activePageId) {
    navButtons.forEach((button) =>
      button.classList.toggle("active", button.dataset.page === activePageId)
    );
    // Example of handling other nav links if needed
    // const goalsLink = document.querySelector("header nav a.nav-link");
    // if (goalsLink) goalsLink.classList.remove("active");
  }
  function renderDailyLogPage(dateStr) {
    console.log(`Rendering Daily Log for: ${dateStr}`);
    if (!dailyLogContent) {
      console.error("Daily log container missing.");
      return;
    }
    const logData = dailyLogs[dateStr] || {
      focusedHours: 0,
      distractedHours: 0,
      isBreakDay: false,
      completedHabitIds: [],
      tasks: [],
      finalScore: null,
      streakContinued: null,
    };
    const tasksForDay = Array.isArray(logData.tasks) ? logData.tasks : [];
    const completedHabits = Array.isArray(logData.completedHabitIds)
      ? logData.completedHabitIds
      : [];
    const activeHabits = Array.isArray(habits)
      ? habits.filter((h) => h.isActive)
      : [];
    let habitsHtml =
      activeHabits.length > 0
        ? activeHabits
            .map(
              (habit) =>
                `<div class="daily-log-item habit-item"><input type="checkbox" id="habit-${
                  habit.id
                }-${dateStr}" data-habit-id="${habit.id}" ${
                  completedHabits.includes(habit.id) ? "checked" : ""
                }><label for="habit-${habit.id}-${dateStr}">${
                  habit.name
                } <span class="habit-weight">(W: ${
                  habit.weight
                })</span></label></div>`
            )
            .join("")
        : '<p class="empty-message">No active habits defined.</p>';
    let tasksHtml =
      tasksForDay.length > 0
        ? tasksForDay.map((task) => renderDailyTaskItem(task, dateStr)).join("")
        : '<p class="empty-message">No tasks added.</p>';
    dailyLogContent.innerHTML = `<div class="log-inputs-container"><div class="log-input-group"><label for="focused-hours-${dateStr}">Focused:</label><input type="number" id="focused-hours-${dateStr}" data-log-prop="focusedHours" value="${
      logData.focusedHours
    }" min="0" step="0.1" title="Focused Hours"></div><div class="log-input-group"><label for="distracted-hours-${dateStr}">Distracted:</label><input type="number" id="distracted-hours-${dateStr}" data-log-prop="distractedHours" value="${
      logData.distractedHours
    }" min="0" step="0.1" title="Distracted Hours"></div><div class="log-input-group break-day-control"><input type="checkbox" id="is-break-day-${dateStr}" data-log-prop="isBreakDay" ${
      logData.isBreakDay ? "checked" : ""
    }><label for="is-break-day-${dateStr}" title="Mark planned break day. Streak won't break/increase.">Break Day</label></div></div><h3>Habits</h3><div class="daily-log-section">${habitsHtml}</div><hr><h3>Tasks for ${dateStr}</h3><div id="daily-tasks-list" class="daily-log-section">${tasksHtml}</div><form id="add-daily-task-form"><h4>Add New Task</h4><input type="text" id="new-daily-task-name" placeholder="Task Name (Required)" required><textarea id="new-daily-task-desc" placeholder="Description (Optional)"></textarea><button type="submit">Add Task</button></form>`;
    if (!dailyLogs[dateStr]) {
      console.log(`Creating log entry in memory for ${dateStr}.`);
      dailyLogs[dateStr] = { ...logData };
    }
  }
  function renderDailyTaskItem(task, dateStr) {
    if (!task || typeof task !== "object" || !task.id) return "";
    return `<div class="daily-log-item task-item" data-task-id="${
      task.id
    }"><span class="task-details">${task.name || "Unnamed Task"}${
      task.description ? `<small>${task.description}</small>` : ""
    }</span><div class="task-controls"><div class="task-checkboxes"><label for="task-assigned-${
      task.id
    }-${dateStr}"><input type="checkbox" id="task-assigned-${
      task.id
    }-${dateStr}" data-task-prop="assigned" ${
      task.assigned ? "checked" : ""
    }> Assigned</label><label for="task-done-${
      task.id
    }-${dateStr}"><input type="checkbox" id="task-done-${
      task.id
    }-${dateStr}" data-task-prop="done" ${
      task.done ? "checked" : ""
    }> Done</label></div><button class="delete-task-btn" data-action="delete-task" title="Delete Task">×</button></div></div>`;
  }
  function updateFinalScoreDisplay(dateStr) {
    if (!finalScoreDisplay) return;
    const log = dailyLogs[dateStr];
    const scoreText =
      log && typeof log.finalScore === "number"
        ? log.finalScore.toFixed(1)
        : "--";
    finalScoreDisplay.textContent = scoreText;
  }

  // --- NEW: Function to close the edit modal ---
  function closeEditHabitModal() {
    if (editHabitModal && editHabitForm) {
      editHabitModal.style.display = "none"; // Hide the modal
      editHabitForm.reset(); // Clear the form fields
      editHabitIdInput.value = ""; // Clear the hidden ID
    }
  }

  // --- NEW: Function to handle saving habit changes ---
  function handleSaveHabitChanges(event) {
    event.preventDefault(); // Prevent default form submission

    const habitId = editHabitIdInput.value;
    const newName = editHabitNameInput.value.trim();
    const newWeight = parseFloat(editHabitWeightInput.value);
    const newDescription = editHabitDescInput.value.trim();

    // Validation
    if (!newName) {
      alert("Habit name cannot be empty.");
      editHabitNameInput.focus();
      return;
    }
    if (isNaN(newWeight) || newWeight < 0) {
      alert("Weight must be a non-negative number.");
      editHabitWeightInput.focus();
      return;
    }
    if (!habitId) {
      alert("Error: Habit ID is missing. Cannot save changes.");
      console.error("Habit ID missing from edit form.");
      return;
    }

    // Find the habit in the main habits array
    const habitIndex = habits.findIndex((h) => h.id === habitId);
    if (habitIndex === -1) {
      alert("Error: Could not find the habit to update.");
      console.error(`Habit with ID ${habitId} not found during save.`);
      closeEditHabitModal(); // Close modal even if error occurs
      return;
    }

    // Update the habit object directly in the array
    habits[habitIndex].name = newName;
    habits[habitIndex].weight = newWeight;
    habits[habitIndex].description = newDescription;

    console.log(`Updated habit "${newName}" (ID: ${habitId})`);

    // Save all data
    saveData();

    // Close the modal
    closeEditHabitModal();

    // Re-render the necessary parts of the UI
    renderEditPage(); // Refresh the habits list

    // Also refresh other pages that might display habit info
    if (
      dailyLogPage &&
      dailyLogPage.classList.contains("active") &&
      dateInput
    ) {
      console.log("Refreshing daily log page after habit edit.");
      renderDailyLogPage(dateInput.value);
    }
    if (statsPage && statsPage.classList.contains("active")) {
      console.log("Refreshing stats page after habit edit.");
      // Need to repopulate selector in case name changed, then re-render charts
      populateHabitStatsSelector();
      // Re-render both charts as weight change affects daily score, name affects habit chart title/data
      renderDailyScoreChart();
      renderSingleHabitChart(); // This will use the potentially updated name/data
    }
  }

  function renderEditPage() {
    console.log("Rendering Edit Habits Page...");
    if (!habitsList) {
      console.error("Habits list container missing.");
      return;
    }
    if (!Array.isArray(habits)) {
      habitsList.innerHTML = "<li>Error loading habits.</li>";
      return;
    }
    const sortedHabits = [...habits].sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return a.name.localeCompare(b.name);
    });
    if (sortedHabits.length === 0) {
      habitsList.innerHTML =
        '<li class="empty-message">No habits defined yet.</li>';
      return;
    }
    habitsList.innerHTML = sortedHabits
      .map(
        (habit) =>
          `<li data-habit-id="${habit.id}" class="${
            habit.isActive ? "habit-active" : "habit-inactive"
          }"><span class="habit-info"><strong>${
            habit.name
          }</strong><span class="habit-meta">(Weight: ${habit.weight}, ${
            habit.isActive
              ? "Active"
              : `Inactive since ${habit.archivedDate || "N/A"}`
          })</span>${
            habit.description ? `<small>${habit.description}</small>` : ""
          }</span><span class="controls"><button data-action="toggle-active" title="${
            habit.isActive ? "Deactivate" : "Activate"
          } Habit">${
            habit.isActive ? "Deactivate" : "Activate"
          }</button><button data-action="edit" title="Edit Habit">Edit</button><button data-action="delete" class="danger" title="Delete Habit">Delete</button></span></li>` // REMOVED 'disabled' from edit button
      )
      .join("");
  }
  function renderStatsPage() {
    console.log(
      `Rendering Stats Page for range type: ${currentStatsRange.type}`
    );
    if (!statsPage || !dailyScoreChartCtx || !singleHabitChartCtx) {
      console.error("Stats elements missing.");
      if (statsPage) statsPage.innerHTML = "<p>Error loading stats.</p>";
      return;
    }
    if (dailyScoreChartInstance) {
      dailyScoreChartInstance.destroy();
      dailyScoreChartInstance = null;
    }
    if (singleHabitChartInstance) {
      singleHabitChartInstance.destroy();
      singleHabitChartInstance = null;
    }
    updateChartTitles();
    renderDailyScoreChart();
    populateHabitStatsSelector();
    renderSingleHabitChart();
    updateOverallStreakDisplay();
  }

  // =========================================================================
  // == CHARTING FUNCTIONS
  // =========================================================================
  function getChartDateRange() {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date(today);
    switch (currentStatsRange.type) {
      case "7d":
        startDate.setDate(today.getDate() - 6);
        break;
      case "90d":
        startDate.setDate(today.getDate() - 89);
        break;
      case "365d":
        startDate.setFullYear(today.getFullYear() - 1);
        startDate.setDate(startDate.getDate() + 1);
        break;
      case "custom":
        try {
          startDate = new Date(currentStatsRange.start + "T00:00:00");
          endDate = new Date(currentStatsRange.end + "T23:59:59");
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
            throw new Error();
        } catch (e) {
          console.error("Invalid custom date range. Falling back to 30d.");
          currentStatsRange = { type: "30d", start: null, end: null };
          updateStatsRangeUI(); // Update UI to reflect fallback
          startDate = new Date();
          endDate = new Date(today);
          startDate.setDate(today.getDate() - 29);
        }
        break;
      case "30d":
      default:
        startDate.setDate(today.getDate() - 29);
        break;
    }
    return { startDate, endDate };
  }
  function generateChartLabelsAndLoop(callback) {
    const { startDate, endDate } = getChartDateRange();
    const labels = [];
    const loopData = [];
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    while (currentDate <= endDate) {
      const dateStr = formatDate(currentDate);
      labels.push(dateStr);
      loopData.push(callback(dateStr));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return { labels, data: loopData };
  }
  function updateChartTitles() {
    let rangeDescription = "Selected Range";
    const { startDate, endDate } = getChartDateRange();
    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);
    switch (currentStatsRange.type) {
      case "7d":
        rangeDescription = "Last 7 Days";
        break;
      case "30d":
        rangeDescription = "Last 30 Days";
        break;
      case "90d":
        rangeDescription = "Last 90 Days";
        break;
      case "365d":
        rangeDescription = "Last Year";
        break;
      case "custom":
        rangeDescription = `${startStr} to ${endStr}`;
        break;
    }
    if (dailyScoreChartTitle)
      dailyScoreChartTitle.textContent = `Daily Score (${rangeDescription})`;
    if (habitPerfChartTitle)
      habitPerfChartTitle.textContent = `Habit Performance (${rangeDescription})`;
  }
  function renderDailyScoreChart() {
    console.log("Rendering Daily Score Chart (range)...");
    if (!dailyScoreChartCtx) return;
    const { labels, data: scores } = generateChartLabelsAndLoop((dateStr) => {
      const log = dailyLogs[dateStr];
      return log && typeof log.finalScore === "number" ? log.finalScore : null;
    });
    if (dailyScoreChartInstance) {
      dailyScoreChartInstance.destroy();
      dailyScoreChartInstance = null;
    }
    try {
      dailyScoreChartInstance = new Chart(dailyScoreChartCtx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Final Day Score",
              data: scores,
              borderColor: chartColors.mauve,
              backgroundColor: chartColors.mauve_bg,
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 6,
              pointBackgroundColor: chartColors.mauve,
              spanGaps: true,
              borderWidth: 2.5,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              min: 0,
              suggestedMax: 105,
              grid: { color: chartColors.grid, drawTicks: false },
              ticks: { color: chartColors.subtle, padding: 10 },
              border: { display: false },
            },
            x: {
              grid: { color: chartColors.grid, drawTicks: false },
              ticks: {
                color: chartColors.subtle,
                maxRotation: 0,
                autoSkipPadding: 20,
                padding: 10,
              },
              border: { display: false },
            },
          },
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: { color: chartColors.text },
            },
            tooltip: {
              backgroundColor: chartColors.crust,
              titleColor: chartColors.text,
              bodyColor: chartColors.subtle,
              borderColor: chartColors.surface1,
              borderWidth: 1,
              padding: 10,
              cornerRadius: 4,
              displayColors: false,
            },
          },
          interaction: { mode: "index", intersect: false },
        },
      });
      console.log("Daily Score Chart Rendered.");
    } catch (error) {
      console.error("Error rendering Daily Score Chart:", error);
      if (dailyScoreChartCtx.canvas.parentNode) {
        dailyScoreChartCtx.canvas.parentNode.innerHTML =
          "<p>Error rendering chart.</p>";
      }
    }
  }
  function populateHabitStatsSelector() {
    console.log("Attempting to populate selector. Habits available:", habits); // testing
    if (!habitStatsSelector) return;
    const currentSelection = habitStatsSelector.value;
    habitStatsSelector.innerHTML =
      '<option value="">-- Select Habit --</option>';
    if (Array.isArray(habits) && habits.length > 0) {
      const sortedHabits = [...habits].sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return a.name.localeCompare(b.name);
      });
      sortedHabits.forEach((habit) => {
        const option = document.createElement("option");
        option.value = habit.id;
        option.textContent = `${habit.name} ${
          habit.isActive ? "" : "(Inactive)"
        }`;
        option.disabled = !habit.isActive; // Maybe allow selecting inactive? Keep as is for now.
        habitStatsSelector.appendChild(option);
      });
      // Try to restore previous selection if it still exists
      if (habits.some((h) => h.id === currentSelection)) {
        habitStatsSelector.value = currentSelection;
      }
    }
    if (habitStreakDisplay) habitStreakDisplay.textContent = "--";
  }
  function renderSingleHabitChart() {
    if (!habitStatsSelector || !singleHabitChartCtx) {
      console.log("Elements missing for habit chart.");
      if (singleHabitChartCtx) {
        if (singleHabitChartInstance) {
          singleHabitChartInstance.destroy();
          singleHabitChartInstance = null;
        }
        singleHabitChartCtx.clearRect(
          0,
          0,
          singleHabitChartCtx.canvas.width,
          singleHabitChartCtx.canvas.height
        );
      }
      if (habitStreakDisplay) habitStreakDisplay.textContent = "--";
      return;
    }
    const selectedHabitId = habitStatsSelector.value;
    console.log(
      `Rendering habit chart ID: ${selectedHabitId || "None"} (range)`
    );
    if (habitStreakDisplay) habitStreakDisplay.textContent = "--";
    if (singleHabitChartInstance) {
      singleHabitChartInstance.destroy();
      singleHabitChartInstance = null;
    }
    if (!selectedHabitId) {
      // Clear canvas if no habit is selected
      singleHabitChartCtx.clearRect(
        0,
        0,
        singleHabitChartCtx.canvas.width,
        singleHabitChartCtx.canvas.height
      );
      return;
    }
    const habit = habits.find((h) => h.id === selectedHabitId);
    if (!habit) {
      console.warn("Selected habit not found.");
      singleHabitChartCtx.clearRect(
        0,
        0,
        singleHabitChartCtx.canvas.width,
        singleHabitChartCtx.canvas.height
      );
      return;
    }
    const { labels, data: completionData } = generateChartLabelsAndLoop(
      (dateStr) => {
        const log = dailyLogs[dateStr];
        // Consider a day completed if logged and not a break day and habit ID is present
        const wasCompleted =
          log &&
          !log.isBreakDay &&
          Array.isArray(log.completedHabitIds) &&
          log.completedHabitIds.includes(selectedHabitId);
        return wasCompleted ? 1 : 0;
      }
    );
    // Calculate current streak for this specific habit
    let currentHabitStreak = 0;
    let checkDate = new Date(); // Start from today
    while (true) {
      const checkDateStr = formatDate(checkDate);
      const log = dailyLogs[checkDateStr];
      const completed =
        log &&
        Array.isArray(log.completedHabitIds) &&
        log.completedHabitIds.includes(selectedHabitId);
      const isBreak = log && log.isBreakDay;

      if (completed && !isBreak) {
        currentHabitStreak++;
        checkDate.setDate(checkDate.getDate() - 1); // Go back one day
      } else {
        // Stop if missed, or if it was a break day (break days don't count towards streak)
        break;
      }
    }
    if (habitStreakDisplay)
      habitStreakDisplay.textContent = `${currentHabitStreak} day${
        currentHabitStreak === 1 ? "" : "s"
      }`;
    try {
      singleHabitChartInstance = new Chart(singleHabitChartCtx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: `${habit.name} Completion`,
              data: completionData,
              borderColor: chartColors.blue,
              backgroundColor: chartColors.blue_bg,
              fill: true,
              tension: 0.4, // Smoothed line
              pointRadius: 3,
              pointHoverRadius: 6,
              pointBackgroundColor: chartColors.blue,
              stepped: false, // Use smoothed line, not steps
              borderWidth: 2.5,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              min: 0,
              max: 1.1, // Allow slight overshoot visually
              grid: { color: chartColors.grid, drawTicks: false },
              ticks: {
                color: chartColors.subtle,
                stepSize: 1,
                padding: 10,
                callback: (value) => {
                  if (value === 1) return "Done";
                  if (value === 0) return "Missed";
                  return ""; // Hide intermediate values if any
                },
              },
              border: { display: false },
            },
            x: {
              grid: { color: chartColors.grid, drawTicks: false },
              ticks: {
                color: chartColors.subtle,
                maxRotation: 0,
                autoSkipPadding: 20,
                padding: 10,
              },
              border: { display: false },
            },
          },
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }, // Legend is redundant here
            tooltip: {
              backgroundColor: chartColors.crust,
              titleColor: chartColors.text,
              bodyColor: chartColors.subtle,
              borderColor: chartColors.surface1,
              borderWidth: 1,
              padding: 10,
              cornerRadius: 4,
              displayColors: false,
              callbacks: {
                label: (context) =>
                  context.raw === 1 ? "Completed" : "Missed / Break Day", // Clarify tooltip
              },
            },
          },
          interaction: { mode: "index", intersect: false },
        },
      });
      console.log(`Habit Chart Rendered for ${habit.name}.`);
    } catch (error) {
      console.error("Error rendering Habit Chart:", error);
      if (singleHabitChartCtx.canvas.parentNode) {
        singleHabitChartCtx.canvas.parentNode.innerHTML =
          "<p>Error rendering chart.</p>";
      }
    }
  }
  function updateOverallStreakDisplay() {
    if (!overallStreakDisplay) return;
    const streak = appState.currentStreak || 0;
    overallStreakDisplay.textContent = `${streak} day${
      streak === 1 ? "" : "s"
    }`;
  }

  // =========================================================================
  // == CALCULATIONS
  // =========================================================================
  function calculateRoutinePoints(completedHabitIds) {
    if (!Array.isArray(completedHabitIds)) return 0;
    let points = 0;
    completedHabitIds.forEach((habitId) => {
      const habit = habits.find((h) => h.id === habitId);
      if (habit && habit.isActive) {
        points += typeof habit.weight === "number" ? habit.weight : 0;
      }
    });
    return Math.min(points, 100); // Cap at 100
  }
  function calculateTimeManagementPoints(focusedHours, distractedHours) {
    const netFocus = Math.max(0, (focusedHours || 0) - (distractedHours || 0));
    // Using an exponential decay curve - approaches 100 as netFocus increases.
    // Adjusted divisor (e.g., 8) determines how quickly it approaches max.
    const points = 100 * (1 - Math.exp(-netFocus / 8));
    return Math.max(0, Math.min(points, 100)); // Ensure 0-100 range
  }
  function calculateTaskPoints(tasksForDay) {
    if (!Array.isArray(tasksForDay)) return 0;
    const assignedTasks = tasksForDay.filter((t) => t.assigned);
    if (assignedTasks.length === 0) {
      // If no tasks were assigned for the day, maybe return 0 or a neutral score?
      // Returning 0 implies no points earned from tasks.
      return 0;
    }
    const doneAndAssignedTasks = assignedTasks.filter((t) => t.done);
    const numAssigned = assignedTasks.length;
    const numDone = doneAndAssignedTasks.length;
    const points = (numDone / numAssigned) * 100;
    return Math.max(0, Math.min(points, 100)); // Ensure 0-100 range
  }
  function calculateFinalDayScore(logData, dateStr) {
    if (!logData || typeof logData !== "object") return 0;
    const routinePts = calculateRoutinePoints(logData.completedHabitIds);
    const timePts = calculateTimeManagementPoints(
      logData.focusedHours,
      logData.distractedHours
    );
    const taskPts = calculateTaskPoints(logData.tasks);
    // Weighted average: Habits 45%, Time 10%, Tasks 45%
    const baseScore = routinePts * 0.45 + timePts * 0.1 + taskPts * 0.45;

    // Calculate Streak Bonus (if date is provided)
    let streakBonus = 0;
    const MAX_BONUS_POINTS = 10;
    const DAYS_PER_BONUS_POINT = 7; // Earn 1 bonus point per week of streak

    if (dateStr) {
      let streakEnteringToday = 0;
      const currentLogDate = new Date(dateStr);
      let checkDate = new Date(currentLogDate);
      checkDate.setDate(checkDate.getDate() - 1); // Start checking from yesterday

      while (true) {
        const checkDateStr = formatDate(checkDate);
        const prevLog = dailyLogs[checkDateStr];

        if (
          prevLog &&
          !prevLog.isBreakDay &&
          typeof prevLog.finalScore === "number" &&
          prevLog.finalScore >= 60
        ) {
          // Successful non-break day found, increment streak and continue checking
          streakEnteringToday++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (prevLog && prevLog.isBreakDay) {
          // Break day found, skip it and continue checking
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // No log found, or failed day found, stop counting streak
          break;
        }
      }

      if (streakEnteringToday > 0) {
        streakBonus = Math.min(
          MAX_BONUS_POINTS,
          Math.floor(streakEnteringToday / DAYS_PER_BONUS_POINT)
        );
        if (streakBonus > 0) {
          console.log(
            `Applying streak bonus: +${streakBonus} (Streak entering today: ${streakEnteringToday})`
          );
        }
      }
    } else {
      console.warn("Date string not provided for streak bonus calculation.");
    }

    const finalScoreWithBonus = baseScore + streakBonus;
    const finalClampedScore = Math.max(0, Math.min(finalScoreWithBonus, 100)); // Clamp final score between 0 and 100

    // Log if clamping occurred significantly
    if (finalClampedScore === 100 && finalScoreWithBonus > 100) {
      console.log(
        `Score calculated as ${finalScoreWithBonus.toFixed(2)}, clamped to 100.`
      );
    } else if (baseScore > 0 && finalClampedScore === 0) {
      console.log(
        `Score calculated as ${finalScoreWithBonus.toFixed(2)}, clamped to 0.`
      );
    }

    return finalClampedScore;
  }
  function updateStreak(dateStr, logData) {
    if (!logData || typeof logData !== "object") {
      console.error(`Cannot update streak for ${dateStr}: Invalid log data.`);
      return;
    }
    if (!appState) {
      console.error("Cannot update streak: App state invalid.");
      return;
    }

    // If it's a break day, the streak is neither broken nor continued. It's frozen.
    if (logData.isBreakDay) {
      console.log(
        `Streak Update (${dateStr}): Break Day. Streak frozen at ${appState.currentStreak}.`
      );
      logData.streakContinued = null; // Indicate neither continued nor broken
      updateOverallStreakDisplay(); // Ensure display reflects potentially frozen streak
      return;
    }

    // Ensure finalScore is calculated if it's missing
    if (typeof logData.finalScore !== "number") {
      logData.finalScore = calculateFinalDayScore(logData, dateStr);
      if (typeof logData.finalScore !== "number") {
        console.warn(
          `Cannot update streak for ${dateStr}, invalid score calculated. Treating as failure.`
        );
        logData.streakContinued = false;
        appState.currentStreak = 0;
        // Don't update lastScoreDate on failure
        updateOverallStreakDisplay();
        return;
      }
    }

    const finalScore = logData.finalScore;
    const todaySuccess = finalScore >= 60;
    const currentLogDate = new Date(dateStr);

    // Find the date of the *last relevant* score (skipping break days)
    let previousRelevantDateStr = null;
    let checkDate = new Date(currentLogDate);
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1); // Go back one day
      const checkDateStr = formatDate(checkDate);
      const prevLog = dailyLogs[checkDateStr];

      if (!prevLog) {
        // Reached beginning of logs or a gap
        break;
      } else if (!prevLog.isBreakDay) {
        // Found the last non-break day, this is the relevant one
        previousRelevantDateStr = checkDateStr;
        break;
      }
      // If it was a break day, continue loop
    }

    // Get the date of the last *successful* score from appState
    const lastSuccessfulDate = appState.lastScoreDate;

    // Check if today's success is consecutive to the last recorded success
    // (meaning the last successful day was indeed the previous relevant day)
    const isConsecutiveSuccess =
      todaySuccess && lastSuccessfulDate === previousRelevantDateStr;

    if (todaySuccess) {
      if (isConsecutiveSuccess) {
        // Consecutive success, increment streak
        appState.currentStreak = (appState.currentStreak || 0) + 1;
      } else {
        // First success after a break/failure, or start of tracking
        appState.currentStreak = 1;
      }
      // Update the last successful date to today
      appState.lastScoreDate = dateStr;
      logData.streakContinued = true;
      console.log(
        `Streak Update (${dateStr}): Success (Score ${finalScore.toFixed(
          1
        )}). New Streak: ${appState.currentStreak}. Last Success: ${
          appState.lastScoreDate
        }`
      );
    } else {
      // Failed today
      logData.streakContinued = false;
      // Check if the streak *was* active yesterday (i.e., last success was previous relevant day)
      if (lastSuccessfulDate === previousRelevantDateStr) {
        console.log(
          `Streak Update (${dateStr}): Failed (Score ${finalScore.toFixed(
            1
          )}). Streak broken. Resetting to 0.`
        );
        appState.currentStreak = 0;
      } else {
        // Streak was already broken or non-existent before today
        console.log(
          `Streak Update (${dateStr}): Failed (Score ${finalScore.toFixed(
            1
          )}). Streak was already 0 or gap.`
        );
        appState.currentStreak = 0; // Ensure it's 0
      }
      // Don't update lastScoreDate on failure
    }

    updateOverallStreakDisplay();
  }

  // =========================================================================
  // == EVENT LISTENERS & HANDLERS
  // =========================================================================
  function setupEventListeners() {
    console.log("Setting up general listeners...");
    navButtons.forEach((button) =>
      button.addEventListener("click", () => {
        if (button.dataset.page) showPage(button.dataset.page);
      })
    );
    if (dateInput) dateInput.addEventListener("change", handleDateChange);
    else console.warn("Date input missing.");
    if (dailyLogContent) {
      // Use event delegation for inputs inside the dynamic content
      dailyLogContent.addEventListener("change", handleDailyLogInputChange);
      dailyLogContent.addEventListener("submit", handleAddDailyTask);
      dailyLogContent.addEventListener("click", handleDailyTaskActions);
    } else {
      console.error("Daily log container missing.");
    }
    if (saveLogButton)
      saveLogButton.addEventListener("click", handleSaveDailyLog);
    else console.warn("Save log button missing.");
    if (addHabitForm) addHabitForm.addEventListener("submit", handleAddHabit);
    else console.warn("Add habit form missing.");
    if (habitsList)
      habitsList.addEventListener("click", handleHabitListActions);
    else console.warn("Habits list container missing.");
    if (habitStatsSelector)
      habitStatsSelector.addEventListener("change", renderSingleHabitChart);
    else console.warn("Habit stats selector missing.");
    if (exportButton) exportButton.addEventListener("click", handleExportData);
    else console.warn("Export button missing.");
    if (importButton && importFile)
      importButton.addEventListener("click", handleImportData);
    else console.warn("Import elements missing.");
    if (deleteButton)
      deleteButton.addEventListener("click", handleDeleteAllData);
    else console.warn("Delete button missing.");

    if (editHabitModal && cancelHabitEditButton && editHabitForm) {
      // Close modal when clicking Cancel button
      cancelHabitEditButton.addEventListener("click", closeEditHabitModal);

      // Close modal when clicking on the overlay background
      editHabitModal.addEventListener("click", (event) => {
        // Check if the click is directly on the overlay, not the content inside
        if (event.target === editHabitModal) {
          closeEditHabitModal();
        }
      });

      // Handle the form submission for saving changes
      editHabitForm.addEventListener("submit", handleSaveHabitChanges);
    } else {
      console.warn(
        "Edit habit modal elements missing, listeners not attached."
      );
    }

    // Note: Stats range listeners are attached *when the stats page is shown*
    // via setupStatsRangeListeners() called within showPage().
    console.log("General listeners setup.");
  }
  function setupStatsRangeListeners() {
    if (!statsRangeSelector) {
      console.warn("Stats range selector missing. Cannot attach listeners.");
      return;
    }
    console.log("Setting up Stats Range listeners...");

    // Use event delegation on the container for preset buttons
    const presetContainer = statsRangeSelector.querySelector(
      ".stats-range-presets"
    );
    if (presetContainer) {
      // Remove previous listener if any, to prevent duplicates
      presetContainer.removeEventListener("click", handleStatsPresetClick);
      presetContainer.addEventListener("click", handleStatsPresetClick);
    } else {
      console.warn("Preset button container not found.");
    }

    // Listener for the "Apply" button for custom range
    if (statsApplyCustomBtn) {
      statsApplyCustomBtn.removeEventListener("click", handleStatsApplyCustom);
      statsApplyCustomBtn.addEventListener("click", handleStatsApplyCustom);
    } else {
      console.warn("Apply custom range button not found.");
    }

    // Listeners for changes in the date inputs themselves
    if (statsStartDateInput) {
      statsStartDateInput.removeEventListener(
        "change",
        handleCustomDateInputChange
      );
      statsStartDateInput.addEventListener(
        "change",
        handleCustomDateInputChange
      );
    } else {
      console.warn("Stats start date input not found.");
    }
    if (statsEndDateInput) {
      statsEndDateInput.removeEventListener(
        "change",
        handleCustomDateInputChange
      );
      statsEndDateInput.addEventListener("change", handleCustomDateInputChange);
    } else {
      console.warn("Stats end date input not found.");
    }

    console.log("Stats range listeners attached.");
  }
  function handleStatsPresetClick(event) {
    const button = event.target.closest("button[data-range]");
    if (!button) return; // Click wasn't on a button or its child

    const range = button.dataset.range;

    if (range === "custom-toggle") {
      // User clicked the "Custom" button itself
      toggleCustomRangeInput(true); // Toggle visibility
      if (
        statsCustomRangeDiv?.style.display === "flex" &&
        currentStatsRange.type !== "custom"
      ) {
        // If opening custom panel AND not already in custom mode, set default dates and make it the current type
        setDefaultCustomDates();
        currentStatsRange = {
          type: "custom",
          start: statsStartDateInput?.value || null,
          end: statsEndDateInput?.value || null,
        };
        updateStatsRangeUI(); // Update button appearance
        renderStatsPage(); // Redraw charts for the new default custom range
      } else if (
        statsCustomRangeDiv?.style.display === "none" &&
        currentStatsRange.type === "custom"
      ) {
        // If closing custom panel AND was in custom mode, revert to default (e.g., 30d)
        console.log("Custom panel closed by user, reverting state to 30d.");
        currentStatsRange = { type: "30d", start: null, end: null };
        updateStatsRangeUI();
        renderStatsPage();
      } else {
        // Just toggling visibility, but state might already match, only update UI
        updateStatsRangeUI();
      }
    } else {
      // User clicked a preset button (7d, 30d, etc.)
      console.log(`Preset range selected: ${range}`);
      currentStatsRange = { type: range, start: null, end: null };
      if (statsCustomRangeDiv) statsCustomRangeDiv.style.display = "none"; // Hide custom inputs
      updateStatsRangeUI(); // Update button appearance
      renderStatsPage(); // Redraw charts for the preset range
    }
  }
  function handleStatsApplyCustom() {
    if (!statsStartDateInput || !statsEndDateInput) return;
    const startDateStr = statsStartDateInput.value;
    const endDateStr = statsEndDateInput.value;

    if (!startDateStr || !endDateStr) {
      alert("Please select both start and end dates for the custom range.");
      return;
    }

    // Basic date validation
    const startDate = new Date(startDateStr + "T00:00:00");
    const endDate = new Date(endDateStr + "T00:00:00");

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      alert("Invalid date format selected.");
      return;
    }

    if (startDate > endDate) {
      alert("Start date cannot be after end date.");
      return;
    }

    console.log(`Applying custom range: ${startDateStr} to ${endDateStr}`);
    currentStatsRange = {
      type: "custom",
      start: startDateStr,
      end: endDateStr,
    };
    updateStatsRangeUI(); // Update button states
    renderStatsPage(); // Render charts with the applied custom range
  }
  function handleCustomDateInputChange() {
    // When a custom date input changes, we just need to update the UI state
    // to reflect that the "Custom" button might need to stay active, but
    // we don't re-render the charts until "Apply" is clicked.
    console.log("Custom date input changed, updating UI state.");
    updateStatsRangeUI();
  }
  function toggleCustomRangeInput(userInitiated = false) {
    if (!statsCustomRangeDiv) return;
    const isHidden = statsCustomRangeDiv.style.display === "none";
    statsCustomRangeDiv.style.display = isHidden ? "flex" : "none";

    // Logic for reverting if closed is now handled in handleStatsPresetClick
  }
  function setDefaultCustomDates() {
    if (!statsStartDateInput || !statsEndDateInput) return;
    const today = new Date();
    const endDateStr = formatDate(today);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 29); // Default to last 30 days
    const startDateStr = formatDate(startDate);
    statsStartDateInput.value = startDateStr;
    statsEndDateInput.value = endDateStr;
    console.log(`Default custom dates set: ${startDateStr} to ${endDateStr}`);
  }

  // --- CORRECTED updateStatsRangeUI ---
  function updateStatsRangeUI() {
    if (!statsPresetButtons || !statsRangeSelector) {
      // Check selector existence too
      console.warn("Cannot update stats range UI - elements missing.");
      return;
    }

    const isCustomModeActive = currentStatsRange.type === "custom";

    // Ensure the custom date input section visibility matches the mode
    if (statsCustomRangeDiv) {
      statsCustomRangeDiv.style.display = isCustomModeActive ? "flex" : "none";
    }

    // Update active state for all buttons (presets + custom toggle)
    statsPresetButtons.forEach((btn) => {
      const range = btn.dataset.range;
      let isActive = false; // Default to inactive

      if (range === "custom-toggle") {
        // The "Custom" toggle button is active if the current mode is 'custom'
        isActive = isCustomModeActive;
      } else {
        // A preset button ('7d', '30d', etc.) is active if its range matches the current mode type
        isActive = range === currentStatsRange.type;
      }

      // Apply or remove the .active class
      btn.classList.toggle("active", isActive);
    });

    // If in custom mode, ensure the date inputs reflect the current state's start/end dates
    if (isCustomModeActive) {
      if (statsStartDateInput) {
        statsStartDateInput.value = currentStatsRange.start || ""; // Use stored start date or empty string
      }
      if (statsEndDateInput) {
        statsEndDateInput.value = currentStatsRange.end || ""; // Use stored end date or empty string
      }
      // Optional: if start/end are null, maybe call setDefaultCustomDates?
      // if (!currentStatsRange.start || !currentStatsRange.end) {
      //     setDefaultCustomDates();
      //     // If defaulting dates, also update currentStatsRange
      //     currentStatsRange.start = statsStartDateInput?.value || null;
      //     currentStatsRange.end = statsEndDateInput?.value || null;
      // }
    }
  }
  // --- END OF CORRECTION ---

  function handleDateChange() {
    if (!dateInput) return;
    const newDate = dateInput.value;
    if (!newDate) {
      // Handle case where date input might be cleared (e.g., in some browsers)
      console.warn("Date cleared, resetting to default.");
      setDefaultDate();
      // Optionally re-render, but setDefaultDate's change event might trigger it
      return;
    }
    console.log(`Date changed: ${newDate}`);
    renderDailyLogPage(newDate);
    updateFinalScoreDisplay(newDate);
  }
  function handleDailyLogInputChange(event) {
    const target = event.target;
    const dateStr = dateInput?.value;
    if (!dateStr) {
      console.error("Cannot handle log input: Date not selected.");
      return;
    }

    // Ensure log entry exists for the date
    if (!dailyLogs[dateStr]) {
      console.log(`Initializing log entry for ${dateStr} on input change.`);
      dailyLogs[dateStr] = {
        focusedHours: 0,
        distractedHours: 0,
        isBreakDay: false,
        completedHabitIds: [],
        tasks: [],
        finalScore: null,
        streakContinued: null,
      };
    }
    let logData = dailyLogs[dateStr];

    try {
      // Handle number inputs for hours
      if (target.matches('input[type="number"][data-log-prop]')) {
        const prop = target.dataset.logProp;
        if (prop === "focusedHours" || prop === "distractedHours") {
          const value = parseFloat(target.value);
          logData[prop] = isNaN(value) || value < 0 ? 0 : value;
          console.log(`${prop} for ${dateStr} set to ${logData[prop]}`);
        }
      }
      // Handle habit checkboxes
      else if (target.matches('input[type="checkbox"][data-habit-id]')) {
        const habitId = target.dataset.habitId;
        if (!Array.isArray(logData.completedHabitIds))
          logData.completedHabitIds = []; // Ensure array exists
        if (target.checked) {
          if (!logData.completedHabitIds.includes(habitId)) {
            logData.completedHabitIds.push(habitId);
            console.log(`Habit ${habitId} marked complete for ${dateStr}`);
          }
        } else {
          logData.completedHabitIds = logData.completedHabitIds.filter(
            (id) => id !== habitId
          );
          console.log(`Habit ${habitId} marked incomplete for ${dateStr}`);
        }
      }
      // Handle task property checkboxes (assigned/done)
      else if (target.matches('input[type="checkbox"][data-task-prop]')) {
        const taskItem = target.closest(".task-item[data-task-id]");
        if (!taskItem) return;
        const taskId = taskItem.dataset.taskId;
        const prop = target.dataset.taskProp; // 'assigned' or 'done'
        if (!Array.isArray(logData.tasks)) logData.tasks = []; // Ensure array exists
        const task = logData.tasks.find((t) => t.id === taskId);
        if (task && (prop === "assigned" || prop === "done")) {
          task[prop] = target.checked;
          console.log(
            `Task ${taskId} property '${prop}' set to ${target.checked} for ${dateStr}`
          );
        } else {
          console.warn(
            `Task ${taskId} not found or invalid property ${prop} for ${dateStr}`
          );
        }
      }
      // Handle break day checkbox
      else if (
        target.matches('input[type="checkbox"][data-log-prop="isBreakDay"]')
      ) {
        logData.isBreakDay = target.checked;
        console.log(`isBreakDay for ${dateStr} set to ${logData.isBreakDay}`);
      }

      // Note: We don't save or recalculate score on every input change.
      // This happens when the user clicks "Save Progress".
    } catch (error) {
      console.error("Error handling log input change:", error, target);
    }
  }
  function handleAddDailyTask(event) {
    // Ensure the event originated from the correct form submission
    if (!event.target.matches("#add-daily-task-form")) return;
    event.preventDefault(); // Prevent default form submission

    const dateStr = dateInput?.value;
    if (!dateStr) {
      alert("Please select a date before adding tasks.");
      return;
    }

    const nameInput = document.getElementById("new-daily-task-name");
    const descInput = document.getElementById("new-daily-task-desc");
    if (!nameInput || !descInput) {
      console.error("Task form input elements not found.");
      alert("Error: Could not find task input fields.");
      return;
    }

    const name = nameInput.value.trim();
    const description = descInput.value.trim();

    if (!name) {
      alert("Task name is required.");
      nameInput.focus();
      return;
    }

    // Ensure log entry and tasks array exist
    if (!dailyLogs[dateStr]) {
      dailyLogs[dateStr] = {
        focusedHours: 0,
        distractedHours: 0,
        isBreakDay: false,
        completedHabitIds: [],
        tasks: [],
        finalScore: null,
        streakContinued: null,
      };
    }
    if (!Array.isArray(dailyLogs[dateStr].tasks)) {
      dailyLogs[dateStr].tasks = [];
    }

    const newTask = {
      id: generateId(),
      name,
      description,
      assigned: true, // Default to assigned
      done: false, // Default to not done
    };

    dailyLogs[dateStr].tasks.push(newTask);
    console.log(`Task "${name}" added to log for ${dateStr}`);

    // Re-render the daily log section to show the new task and clear the form
    renderDailyLogPage(dateStr); // This will also clear the form implicitly
  }
  function handleDailyTaskActions(event) {
    // Check if the click was on a delete button within a task item
    const deleteButton = event.target.closest(
      'button[data-action="delete-task"]'
    );
    if (!deleteButton) return; // Click wasn't on a delete button

    const taskItem = deleteButton.closest(".task-item[data-task-id]");
    if (!taskItem) {
      console.warn("Could not find parent task item for delete button.");
      return;
    }

    const taskId = taskItem.dataset.taskId;
    const dateStr = dateInput?.value;
    if (!dateStr) {
      console.error("Cannot delete task: Date not selected.");
      return;
    }

    if (!dailyLogs[dateStr] || !Array.isArray(dailyLogs[dateStr].tasks)) {
      console.warn(
        `Cannot delete task ${taskId}: No tasks found for ${dateStr}.`
      );
      return;
    }

    const taskIndex = dailyLogs[dateStr].tasks.findIndex(
      (t) => t.id === taskId
    );

    if (taskIndex > -1) {
      const taskName = dailyLogs[dateStr].tasks[taskIndex].name;
      // Remove the task from the array
      dailyLogs[dateStr].tasks.splice(taskIndex, 1);
      console.log(
        `Task "${taskName}" (ID: ${taskId}) deleted from log for ${dateStr}`
      );

      // Re-render the daily log page to reflect the deletion
      renderDailyLogPage(dateStr);
      // Optionally, save immediately after deletion or wait for explicit save
      // saveData(); // Uncomment if immediate save on deletion is desired
    } else {
      console.warn(`Task ID ${taskId} not found in log for ${dateStr}.`);
    }
  }
  function handleSaveDailyLog() {
    const dateStr = dateInput?.value;
    if (!dateStr) {
      alert("Please select a date to save.");
      return;
    }

    let logData = dailyLogs[dateStr];

    // If no log data exists yet (e.g., user changed date but didn't interact)
    // try to create it from current form state.
    if (!logData) {
      console.log(
        `No existing log for ${dateStr}. Attempting to create from inputs.`
      );
      try {
        const focusedInput = document.getElementById(
          `focused-hours-${dateStr}`
        );
        const distractedInput = document.getElementById(
          `distracted-hours-${dateStr}`
        );
        const breakDayInput = document.getElementById(
          `is-break-day-${dateStr}`
        );

        logData = {
          focusedHours: focusedInput ? parseFloat(focusedInput.value) || 0 : 0,
          distractedHours: distractedInput
            ? parseFloat(distractedInput.value) || 0
            : 0,
          isBreakDay: breakDayInput ? breakDayInput.checked : false,
          completedHabitIds: [], // Assume no habits checked if log didn't exist
          tasks: [], // Assume no tasks if log didn't exist
          finalScore: null,
          streakContinued: null,
        };
        // Note: This doesn't capture dynamically checked habits/tasks if logData was null.
        // It's better if interaction creates the logData object via handleDailyLogInputChange.
        dailyLogs[dateStr] = logData;
        console.log("Created new log data structure based on inputs.");
      } catch (e) {
        alert("Error reading form data to create log entry.");
        console.error("Error creating log entry on save:", e);
        return;
      }
    }

    console.log(`Saving progress for ${dateStr}...`);

    // Recalculate the final score based on the latest state
    logData.finalScore = calculateFinalDayScore(logData, dateStr);
    console.log(
      `Calculated score for ${dateStr}: ${logData.finalScore.toFixed(2)}`
    );

    // Update the overall streak based on this score and date
    updateStreak(dateStr, logData);

    // Save all data (habits, logs, appState) to localStorage
    saveData();

    // Update the score display on the page
    updateFinalScoreDisplay(dateStr);

    // If the stats page is currently active, refresh it to reflect saved data
    if (statsPage && statsPage.classList.contains("active")) {
      renderStatsPage();
    }

    console.log(
      `Saved data for ${dateStr}! Score: ${logData.finalScore.toFixed(
        1
      )}, Current Streak: ${appState.currentStreak}`
    );

    // Provide visual feedback on the save button
    if (saveLogButton) {
      const originalText = saveLogButton.textContent;
      saveLogButton.textContent = "Saved!";
      saveLogButton.disabled = true;
      setTimeout(() => {
        saveLogButton.textContent = originalText;
        saveLogButton.disabled = false;
      }, 1500); // Revert after 1.5 seconds
    }
  }
  function handleAddHabit(event) {
    event.preventDefault();
    const nameInput = document.getElementById("new-habit-name");
    const weightInput = document.getElementById("new-habit-weight");
    const descInput = document.getElementById("new-habit-desc");
    if (!nameInput || !weightInput || !descInput) {
      alert("Habit form input elements are missing.");
      return;
    }
    const name = nameInput.value.trim();
    const weight = parseFloat(weightInput.value);
    const description = descInput.value.trim();
    if (!name) {
      alert("Habit name is required.");
      nameInput.focus();
      return;
    }
    if (isNaN(weight) || weight < 0) {
      alert("Weight must be a non-negative number.");
      weightInput.focus();
      return;
    }
    // Check for duplicate names (case-insensitive)
    if (habits.some((h) => h.name.toLowerCase() === name.toLowerCase())) {
      if (
        !confirm(
          `A habit named "${name}" already exists. Add another one anyway?`
        )
      ) {
        return; // User cancelled
      }
    }
    const newHabit = {
      id: generateId(),
      name,
      description,
      weight,
      isActive: true, // New habits are active by default
      createdDate: formatDate(new Date()),
      archivedDate: null,
    };
    if (!Array.isArray(habits)) habits = []; // Ensure habits is an array
    habits.push(newHabit);
    console.log("Added new habit:", newHabit);
    saveData(); // Save the updated habits list
    renderEditPage(); // Refresh the habits list display
    addHabitForm.reset(); // Clear the form

    // If currently on the daily log page, refresh it to show the new habit option
    if (
      dailyLogPage &&
      dailyLogPage.classList.contains("active") &&
      dateInput
    ) {
      renderDailyLogPage(dateInput.value);
    }
    // If currently on the stats page, refresh the habit selector
    if (statsPage && statsPage.classList.contains("active")) {
      populateHabitStatsSelector();
      renderSingleHabitChart(); // Re-render chart (might be blank if new habit selected)
    }
  }
  function handleHabitListActions(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const listItem = button.closest("li[data-habit-id]");
    if (!listItem) return;

    const habitId = listItem.dataset.habitId;
    const action = button.dataset.action;

    if (!Array.isArray(habits)) return;

    const habitIndex = habits.findIndex((h) => h.id === habitId);
    if (habitIndex === -1) {
      console.warn(`Habit with ID ${habitId} not found for action ${action}.`);
      return;
    }
    const habit = habits[habitIndex];

    if (action === "delete") {
      // ... (keep existing delete logic) ...
      if (
        confirm(
          `Are you sure you want to permanently delete the habit "${habit.name}"? This cannot be undone.`
        )
      ) {
        habits.splice(habitIndex, 1);
        console.log(`Deleted habit "${habit.name}" (ID: ${habitId})`);
        saveData();
        renderEditPage();
        if (
          dailyLogPage &&
          dailyLogPage.classList.contains("active") &&
          dateInput
        ) {
          renderDailyLogPage(dateInput.value);
        }
        if (statsPage && statsPage.classList.contains("active")) {
          renderStatsPage();
        }
      }
    } else if (action === "toggle-active") {
      // ... (keep existing toggle logic) ...
      habit.isActive = !habit.isActive;
      habit.archivedDate = habit.isActive ? null : formatDate(new Date());
      console.log(
        `Toggled habit "${habit.name}" (ID: ${habitId}) active status to: ${habit.isActive}`
      );
      saveData();
      renderEditPage();
      if (
        dailyLogPage &&
        dailyLogPage.classList.contains("active") &&
        dateInput
      ) {
        renderDailyLogPage(dateInput.value);
      }
      if (statsPage && statsPage.classList.contains("active")) {
        populateHabitStatsSelector();
        renderSingleHabitChart();
      }
    } else if (action === "edit") {
      // --- NEW: Open the edit modal ---
      console.log(`Opening edit modal for habit ID: ${habitId}`);
      if (editHabitModal && editHabitForm) {
        // Populate the modal form with current habit data
        editHabitIdInput.value = habit.id;
        editHabitNameInput.value = habit.name;
        editHabitWeightInput.value = habit.weight;
        editHabitDescInput.value = habit.description || "";

        // Show the modal
        editHabitModal.style.display = "flex"; // Use flex to enable centering
      } else {
        console.error("Edit modal elements not found!");
        alert("Could not open the edit form. Modal elements missing.");
      }
    }
  }
  function handleExportData() {
    console.log("Preparing data for export...");
    try {
      const dataToExport = {
        version: 2.1, // Current version of the data structure
        exportDate: new Date().toISOString(),
        habits: habits,
        dailyLogs: dailyLogs,
        appState: appState,
      };
      const dataStr = JSON.stringify(dataToExport, null, 2); // Pretty print JSON
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `habit-tracker-data_v${dataToExport.version}_${formatDate(
        new Date() // Use formatted date for filename
      )}.json`;
      document.body.appendChild(a); // Append link to body
      a.click(); // Programmatically click the link to trigger download
      document.body.removeChild(a); // Remove the link
      URL.revokeObjectURL(url); // Release the object URL
      console.log("Export download initiated.");
    } catch (error) {
      console.error("Error during data export:", error);
      alert(
        "An error occurred while exporting data. Check the console for details."
      );
    }
  }
  function handleImportData() {
    if (!importFile || !importFile.files || importFile.files.length === 0) {
      alert("Please select a JSON file to import.");
      return;
    }
    const file = importFile.files[0];
    if (file.type !== "application/json") {
      alert("Invalid file type. Please select a '.json' file.");
      importFile.value = ""; // Clear the input
      return;
    }
    console.log(`Starting import from file: ${file.name}`);
    const reader = new FileReader();

    reader.onload = function (event) {
      let importedData;
      try {
        importedData = JSON.parse(event.target.result);
        console.log("Successfully parsed imported JSON data.");

        // Basic validation of the imported structure
        if (typeof importedData !== "object" || importedData === null)
          throw new Error("Imported data is not a valid object.");
        if (
          !importedData.habits ||
          !importedData.dailyLogs ||
          !importedData.appState
        )
          throw new Error(
            "Imported file is missing required sections (habits, dailyLogs, appState)."
          );
        if (!Array.isArray(importedData.habits))
          throw new Error("Imported 'habits' section is not an array.");
        if (
          typeof importedData.dailyLogs !== "object" ||
          Array.isArray(importedData.dailyLogs)
        )
          throw new Error("Imported 'dailyLogs' section is not an object.");
        if (
          typeof importedData.appState !== "object" ||
          Array.isArray(importedData.appState)
        )
          throw new Error("Imported 'appState' section is not an object.");

        console.log("Basic structure validation passed.");

        // Version Check (Optional but recommended)
        const importVersion = importedData.version || "unknown"; // Handle missing version property
        if (importVersion !== 2.1 && importVersion !== 2) {
          // Allow importing slightly older v2
          console.warn(
            `Importing data from a different version (${importVersion}). Current app version is 2.1.`
          );
          if (
            !confirm(
              `Warning: The file you are importing is from version ${importVersion}, while the app expects version 2.1. There might be compatibility issues. Continue importing anyway?`
            )
          ) {
            console.log("Import cancelled by user due to version mismatch.");
            importFile.value = ""; // Clear the input
            return;
          }
        }

        // Final Confirmation
        if (
          confirm(
            "WARNING: This will overwrite ALL your current habit data, logs, and streaks. This action cannot be undone. Are you absolutely sure you want to import this file?"
          )
        ) {
          console.log("User confirmed data overwrite.");
          // Replace current data with imported data
          habits = importedData.habits;
          dailyLogs = importedData.dailyLogs;
          appState = importedData.appState;

          console.log(
            "Data replaced. Running post-import validation and saving..."
          );
          // Run loadData again to potentially sanitize/migrate imported data if needed
          loadData(); // This also handles saving if changes were made during load
          // No need to call saveData() explicitly if loadData handles it

          alert("Data successfully imported!");
          setDefaultDate(); // Reset date input
          renderApp(); // Re-render the entire application UI
          importFile.value = ""; // Clear the file input
        } else {
          console.log("Import cancelled by user at final confirmation.");
          importFile.value = ""; // Clear the input
        }
      } catch (error) {
        console.error("Import process failed:", error);
        alert(
          `Import failed: ${error.message}. Please ensure the file is valid JSON and has the correct structure. Check console for details.`
        );
        importFile.value = ""; // Clear the input
      }
    };

    reader.onerror = function () {
      console.error("Error reading the selected file.");
      alert("Import failed: Could not read the selected file.");
      importFile.value = ""; // Clear the input
    };

    reader.readAsText(file); // Start reading the file content as text
  }
  function handleDeleteAllData() {
    if (
      confirm(
        "DANGER ZONE!\n\nAre you absolutely sure you want to delete ALL your habits, logs, and streak data? This action is permanent and cannot be undone!"
      )
    ) {
      // Extra confirmation step
      if (
        prompt(
          "To confirm deletion, please type the word 'DELETE' in all caps:"
        ) === "DELETE"
      ) {
        console.log(
          "User confirmed deletion. Deleting all application data..."
        );

        // Clear data from localStorage
        localStorage.removeItem(LOCAL_STORAGE_KEYS.habits);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.dailyLogs);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.appState);

        // Reset in-memory state variables
        habits = [];
        dailyLogs = {};
        appState = { currentStreak: 0, lastScoreDate: null };
        currentStatsRange = { type: "30d", start: null, end: null }; // Reset stats view state too

        // Destroy any active Chart instances
        if (dailyScoreChartInstance) {
          dailyScoreChartInstance.destroy();
          dailyScoreChartInstance = null;
        }
        if (singleHabitChartInstance) {
          singleHabitChartInstance.destroy();
          singleHabitChartInstance = null;
        }

        alert("All application data has been deleted.");
        console.log("All data deleted successfully.");

        // Reset UI
        setDefaultDate();
        renderApp(); // Re-render the app (should show empty states)
      } else {
        console.log("Deletion cancelled: Incorrect confirmation text entered.");
        alert("Deletion cancelled. Confirmation text did not match.");
      }
    } else {
      console.log("Deletion cancelled by user.");
    }
  }

  // =========================================================================
  // == START THE APPLICATION
  // =========================================================================
  init();
}); // End DOMContentLoaded
