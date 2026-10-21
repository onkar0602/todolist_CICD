
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const count = document.getElementById("task-count");
const empty = document.getElementById("empty-message");
const message = document.getElementById("message");

const API = "/api/tasks";

async function request(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
    }

    return data;
}

async function loadTasks() {
    try {
        const tasks = await request(API);
        list.replaceChildren();

        const completed = tasks.filter(task => task.completed).length;
        count.textContent = `${tasks.length} tasks · ${completed} completed`;
        empty.hidden = tasks.length > 0;

        tasks.forEach(task => {
            const item = document.createElement("li");
            item.className = "task-item";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.completed;

            const title = document.createElement("span");
            title.className = "task-title";
            title.textContent = task.title;

            if (task.completed) title.classList.add("completed");

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "delete-button";
            remove.textContent = "Delete";

            checkbox.addEventListener("change", async () => {
                try {
                    await request(`${API}/${task.id}`, { method: "PATCH" });
                    await loadTasks();
                } catch (error) {
                    showError(error);
                }
            });

            remove.addEventListener("click", async () => {
                try {
                    await request(`${API}/${task.id}`, { method: "DELETE" });
                    await loadTasks();
                    message.textContent = "Task deleted.";
                } catch (error) {
                    showError(error);
                }
            });

            item.append(checkbox, title, remove);
            list.appendChild(item);
        });
    } catch (error) {
        showError(error);
    }
}

function showError(error) {
    console.error("To-Do app error:", error);
    message.textContent = error.message;
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const title = input.value.trim();

    if (!title) {
        message.textContent = "Please enter a task.";
        return;
    }

    const button = document.getElementById("add-button");
    button.disabled = true;
    message.textContent = "Adding task...";

    try {
        await request(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title })
        });

        input.value = "";
        message.textContent = "Task added successfully!";
        await loadTasks();
        input.focus();
    } catch (error) {
        showError(error);
    } finally {
        button.disabled = false;
    }
});

loadTasks();
