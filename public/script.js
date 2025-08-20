document.addEventListener("DOMContentLoaded", function () {
  // API base URL
  const API_BASE = "http://localhost:5000/api/tasks";

  // DOM Elements
  const showTaskFormBtn = document.getElementById("show-task-form");
  const taskModal = document.getElementById("task-modal");
  const taskForm = document.getElementById("task-form");
  const cancelTaskBtn = document.getElementById("cancel-task");
  const saveTaskBtn = document.getElementById("save-task");
  const searchInput = document.getElementById("search-input");
  const sidebarItems = document.querySelectorAll(".sidebar-item");
  const mainHeading = document.getElementById("main-heading");

  // State variables
  let currentFilter = "all";
  let currentEditId = null;

  // Initialize the app
  async function init() {
    await fetchTasks();
    setupEventListeners();
  }

  // Set up event listeners
  function setupEventListeners() {
    // Show task form modal
    showTaskFormBtn.addEventListener("click", () => {
      currentEditId = null;
      taskForm.reset();
      document.querySelector(".modal-content h2").textContent = "Add New Task";
      saveTaskBtn.textContent = "Add Task";
      toggleModal(true);
    });

    // Cancel task form
    cancelTaskBtn.addEventListener("click", () => toggleModal(false));

    // Submit task form
    taskForm.addEventListener("submit", handleTaskSubmit);

    // Search functionality
    searchInput.addEventListener("input", debounce(fetchTasks, 300));

    // Sidebar filters
    sidebarItems.forEach((item) => {
      item.addEventListener("click", () => {
        sidebarItems.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");

        const filter = item.getAttribute("data-filter");
        currentFilter = filter;

        // Update main heading
        updateMainHeading(filter);

        fetchTasks();
      });
    });

    // Close modal when clicking outside
    taskModal.addEventListener("click", (e) => {
      if (e.target === taskModal) {
        toggleModal(false);
      }
    });
  }

  // Update main heading based on filter
  function updateMainHeading(filter) {
    const headingMap = {
      all: "ALL TASKS",
      high: "HIGH PRIORITY TASKS",
      medium: "MEDIUM PRIORITY TASKS",
      low: "LOW PRIORITY TASKS",
      previous: "PREVIOUS TASKS",
      today: "TODAY'S TASKS",
      upcoming: "UPCOMING TASKS",
      personal: "PERSONAL TASKS",
      professional: "PROFESSIONAL TASKS",
      academics: "ACADEMIC TASKS",
    };

    mainHeading.textContent = headingMap[filter] || "ALL TASKS";
  }

  // Toggle modal visibility
  function toggleModal(show) {
    if (show) {
      taskModal.classList.add("active");
    } else {
      taskModal.classList.remove("active");
    }
  }

  // Debounce function for search
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Handle task form submission
  async function handleTaskSubmit(e) {
    e.preventDefault();

    const formData = {
      title: document.getElementById("task-title").value,
      description: document.getElementById("task-description").value,
      priority: document.getElementById("task-priority").value,
      category: document.getElementById("task-category").value,
      dueDate: document.getElementById("task-date").value || null,
    };

    try {
      if (currentEditId) {
        // Update existing task
        await fetch(`${API_BASE}/${currentEditId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new task
        await fetch(API_BASE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      }

      toggleModal(false);
      await fetchTasks();
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Error saving task. Please try again.");
    }
  }

  // Fetch tasks from API
  async function fetchTasks() {
    try {
      const params = new URLSearchParams();

      // Add filter parameters
      if (currentFilter !== "all") {
        if (["high", "medium", "low"].includes(currentFilter)) {
          params.append("priority", currentFilter);
        } else if (["previous", "today", "upcoming"].includes(currentFilter)) {
          params.append("dateFilter", currentFilter);
        } else if (
          ["personal", "professional", "academics"].includes(currentFilter)
        ) {
          params.append("category", currentFilter);
        }
      }

      // Add search parameter
      if (searchInput.value) {
        params.append("search", searchInput.value);
      }

      const response = await fetch(`${API_BASE}?${params}`);
      const tasks = await response.json();

      renderTasks(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }

  // Render tasks in columns
  function renderTasks(tasks) {
    // Clear all columns
    document.getElementById("todo-tasks").innerHTML = "";
    document.getElementById("doing-tasks").innerHTML = "";
    document.getElementById("done-tasks").innerHTML = "";

    // Update task counts
    document.querySelector('[data-status="todo"] .count').textContent =
      tasks.filter((task) => task.status === "todo").length;
    document.querySelector('[data-status="doing"] .count').textContent =
      tasks.filter((task) => task.status === "doing").length;
    document.querySelector('[data-status="done"] .count').textContent =
      tasks.filter((task) => task.status === "done").length;

    // Render each task
    tasks.forEach((task) => {
      const columnId = `${task.status}-tasks`;
      const taskElement = createTaskElement(task);
      document.getElementById(columnId).appendChild(taskElement);
    });
  }

  // Create a task element
  function createTaskElement(task) {
    const taskElement = document.createElement("div");
    taskElement.className = "task-item";
    taskElement.dataset.id = task._id;

    // Format date if exists
    let dateDisplay = "";
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      dateDisplay = dueDate.toLocaleDateString();

      // Check if task is overdue
      if (dueDate < today && task.status !== "done") {
        dateDisplay = `<span class="overdue">${dateDisplay} (Overdue)</span>`;
      }
    }

    taskElement.innerHTML = `
      <div class="task-title">${task.title}</div>
      ${
        task.description
          ? `<div class="task-description">${task.description}</div>`
          : ""
      }
      ${dateDisplay ? `<div class="task-date">${dateDisplay}</div>` : ""}
      <div class="task-priority ${task.priority}">${task.priority}</div>
      <div class="task-category">${task.category}</div>
      <div class="task-actions">
        <button class="edit-btn"><i class="fas fa-edit"></i></button>
        <button class="delete-btn"><i class="fas fa-trash"></i></button>
        ${
          task.status !== "done"
            ? `<button class="next-btn"><i class="fas fa-arrow-right"></i></button>`
            : ""
        }
      </div>
    `;

    // Add event listeners
    taskElement
      .querySelector(".delete-btn")
      .addEventListener("click", () => deleteTask(task._id));
    taskElement
      .querySelector(".edit-btn")
      .addEventListener("click", () => editTask(task));

    if (task.status !== "done") {
      taskElement
        .querySelector(".next-btn")
        .addEventListener("click", () => moveTask(task));
    }

    return taskElement;
  }

  // Delete a task
  async function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
      });

      await fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Error deleting task. Please try again.");
    }
  }

  // Edit a task
  async function editTask(task) {
    currentEditId = task._id;

    // Fill form with task data
    document.getElementById("task-title").value = task.title;
    document.getElementById("task-description").value = task.description || "";
    document.getElementById("task-priority").value = task.priority;
    document.getElementById("task-category").value = task.category;

    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      document.getElementById("task-date").value = dueDate
        .toISOString()
        .split("T")[0];
    } else {
      document.getElementById("task-date").value = "";
    }

    // Update modal title and button
    document.querySelector(".modal-content h2").textContent = "Edit Task";
    saveTaskBtn.textContent = "Update Task";

    toggleModal(true);
  }

  // Move task to next status
  async function moveTask(task) {
    let newStatus;

    if (task.status === "todo") {
      newStatus = "doing";
    } else if (task.status === "doing") {
      newStatus = "done";
    }

    try {
      await fetch(`${API_BASE}/${task._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      await fetchTasks();
    } catch (error) {
      console.error("Error moving task:", error);
      alert("Error updating task. Please try again.");
    }
  }

  // Initialize the app
  init();
});
