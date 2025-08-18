document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const taskForm = document.querySelector(".add-task");
  const taskInput = document.querySelector("#new-task-input");
  const taskList = document.querySelector(".tasks-container");
  const priorityFilter = document.querySelector(".priority-filter");
  const searchInput = document.querySelector("#search-input");
  const categoryFilter = document.querySelectorAll(
    ".sidebar-item[data-category]"
  );

  // Task array to store all tasks
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  // Initialize the app
  function init() {
    renderTasks();
    setupEventListeners();
  }

  // Set up event listeners
  function setupEventListeners() {
    // Add new task
    taskForm.addEventListener("click", addTask);

    // Filter by priority
    priorityFilter.addEventListener("click", function (e) {
      if (e.target.classList.contains("priority-item")) {
        document
          .querySelector(".priority-item.active")
          .classList.remove("active");
        e.target.classList.add("active");
        renderTasks();
      }
    });

    // Search functionality
    searchInput.addEventListener("input", renderTasks);

    // Filter by category
    categoryFilter.forEach((item) => {
      item.addEventListener("click", function () {
        document
          .querySelector(".sidebar-item.active")
          .classList.remove("active");
        this.classList.add("active");
        renderTasks();
      });
    });
  }

  // Add a new task
  function addTask(e) {
    e.preventDefault();

    const taskText = taskInput.value.trim();
    if (taskText === "") return;

    const newTask = {
      id: Date.now(),
      text: taskText,
      priority: "medium", // default priority
      category: "personal", // default category
      date: new Date().toISOString().split("T")[0], // today's date
      status: "todo", // default status
    };

    tasks.push(newTask);
    saveTasks();
    taskInput.value = "";
    renderTasks();
  }

  // Render tasks based on filters
  function renderTasks() {
    // Get current filters
    const activePriority = document
      .querySelector(".priority-item.active")
      .textContent.toLowerCase();
    const searchTerm = searchInput.value.toLowerCase();
    const activeCategory =
      document.querySelector(".sidebar-item.active[data-category]")?.dataset
        .category || "all";

    // Filter tasks
    let filteredTasks = tasks.filter((task) => {
      const matchesPriority =
        activePriority === "all" || task.priority === activePriority;
      const matchesSearch = task.text.toLowerCase().includes(searchTerm);
      const matchesCategory =
        activeCategory === "all" || task.category === activeCategory;
      return matchesPriority && matchesSearch && matchesCategory;
    });

    // Group by status
    const todoTasks = filteredTasks.filter((task) => task.status === "todo");
    const doingTasks = filteredTasks.filter((task) => task.status === "doing");
    const doneTasks = filteredTasks.filter((task) => task.status === "done");

    // Render each column
    renderColumn("todo", todoTasks);
    renderColumn("doing", doingTasks);
    renderColumn("done", doneTasks);
  }

  // Render a single column
  function renderColumn(status, tasks) {
    const column = document.querySelector(
      `.task-column[data-status="${status}"]`
    );
    const taskContainer = column.querySelector(".task-items");

    // Clear existing tasks
    taskContainer.innerHTML = "";

    // Add each task
    tasks.forEach((task) => {
      const taskElement = document.createElement("div");
      taskElement.className = "task-item";
      taskElement.dataset.id = task.id;
      taskElement.innerHTML = `
                <div class="task-title">${task.text}</div>
                <div class="task-date">${task.date}</div>
                <div class="task-priority ${task.priority}">${
        task.priority
      }</div>
                <div class="task-actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                    ${
                      status !== "done"
                        ? `<button class="next-btn"><i class="fas fa-arrow-right"></i></button>`
                        : ""
                    }
                </div>
            `;

      taskContainer.appendChild(taskElement);

      // Add event listeners to buttons
      taskElement
        .querySelector(".delete-btn")
        .addEventListener("click", () => deleteTask(task.id));
      taskElement
        .querySelector(".edit-btn")
        .addEventListener("click", () => editTask(task.id));
      if (status !== "done") {
        taskElement
          .querySelector(".next-btn")
          .addEventListener("click", () => moveTask(task.id));
      }
    });
  }

  // Delete a task
  function deleteTask(id) {
    tasks = tasks.filter((task) => task.id !== id);
    saveTasks();
    renderTasks();
  }

  // Edit a task
  function editTask(id) {
    const task = tasks.find((task) => task.id === id);
    const newText = prompt("Edit task:", task.text);
    if (newText && newText.trim() !== "") {
      task.text = newText.trim();
      saveTasks();
      renderTasks();
    }
  }

  // Move task to next status
  function moveTask(id) {
    const task = tasks.find((task) => task.id === id);
    if (task.status === "todo") {
      task.status = "doing";
    } else if (task.status === "doing") {
      task.status = "done";
    }
    saveTasks();
    renderTasks();
  }

  // Save tasks to localStorage
  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  // Initialize the app
  init();
});
