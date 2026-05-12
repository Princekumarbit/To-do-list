// Global State
let todoList = [];
let comdoList = [];
let remList = [];
let token = localStorage.getItem('token') || '';
let isSignup = false; // Toggle between login and signup

// API Base
const API_URL = 'http://localhost:5000/api';

// Auth Elements
const authBtn = document.getElementById("auth-btn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginContainer = document.getElementById("login-container");
const todoContainer = document.getElementById("todo-container");
const authError = document.getElementById("auth-error");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const logoutBtn = document.getElementById("logout-btn");

// Todo Elements
const addButton = document.getElementById("add-button")
const todoInput = document.getElementById("todo-input")
const deleteAllButton = document.getElementById("delete-all")
const allTodos = document.getElementById("all-todos");
const deleteSButton = document.getElementById("delete-selected")

// Check Auth on load
if (token) {
    loginContainer.classList.add("hidden");
    todoContainer.classList.remove("hidden");
    fetchTodos();
} else {
    loginContainer.classList.remove("hidden");
    todoContainer.classList.add("hidden");
}

// Helper to bind the toggle button correctly
function bindToggleBtn() {
    const toggleAuthBtn = document.getElementById("toggle-auth-btn");
    if (toggleAuthBtn) {
        toggleAuthBtn.addEventListener("click", () => {
            isSignup = !isSignup;
            if (isSignup) {
                authTitle.innerText = "Create Account";
                authSubtitle.innerText = "Sign up to start organizing";
                authBtn.innerText = "Sign Up";
                document.querySelector('.toggle-auth').innerHTML = `Already have an account? <span id="toggle-auth-btn">Log in</span>`;
            } else {
                authTitle.innerText = "Welcome Back";
                authSubtitle.innerText = "Please login to your To-Do List";
                authBtn.innerText = "Login";
                document.querySelector('.toggle-auth').innerHTML = `Don't have an account? <span id="toggle-auth-btn">Sign up</span>`;
            }
            bindToggleBtn();
        });
    }
}
bindToggleBtn();

// Auth Logic
authBtn.addEventListener("click", async function() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (username === "" || password === "") {
        authError.innerText = "Please enter both username and password.";
        return;
    }

    try {
        const endpoint = isSignup ? '/auth/signup' : '/auth/login';
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (!res.ok) {
            authError.innerText = data.msg || data.error;
            return;
        }

        token = data.token;
        localStorage.setItem('token', token);
        
        authError.innerText = "";
        usernameInput.value = "";
        passwordInput.value = "";
        
        loginContainer.classList.add("hidden");
        todoContainer.classList.remove("hidden");
        fetchTodos();
    } catch (err) {
        authError.innerText = "Server error. Is the backend running?";
    }
});

// Logout Logic
logoutBtn.addEventListener("click", () => {
    token = '';
    localStorage.removeItem('token');
    loginContainer.classList.remove("hidden");
    todoContainer.classList.add("hidden");
    todoList = [];
    addinmain(todoList);
});

// API Helpers
async function apiFetch(endpoint, options = {}) {
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = `Bearer ${token}`;
    if (options.body && !options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(`${API_URL}${endpoint}`, options);
    if (res.status === 401) {
        // Token expired or invalid
        logoutBtn.click();
        throw new Error('Unauthorized');
    }
    return res;
}

// Fetch all todos
async function fetchTodos() {
    try {
        const res = await apiFetch('/todos');
        todoList = await res.json();
        update();
        addinmain(todoList);
    } catch (err) {
        console.error(err);
    }
}

// Add todo
async function add() {
    var value = todoInput.value;
    if (value === '') {
        alert("😮 Task cannot be empty")
        return;
    }
    try {
        const res = await apiFetch('/todos', {
            method: 'POST',
            body: JSON.stringify({ task: value })
        });
        const newTodo = await res.json();
        todoList.push(newTodo);
        todoInput.value = "";
        update();
        addinmain(todoList);
    } catch (err) {
        console.error(err);
    }
}

// Delete individual task
async function deleteTodo(id) {
    try {
        await apiFetch(`/todos/${id}`, { method: 'DELETE' });
        todoList = todoList.filter((ele) => ele._id !== id);
        update();
        addinmain(todoList);
    } catch (err) {
        console.error(err);
    }
}

// Complete individual task
async function completeTodo(id, el) {
    try {
        const res = await apiFetch(`/todos/${id}`, { method: 'PUT' });
        const updatedTodo = await res.json();
        
        todoList.forEach((obj) => {
            if (obj._id === id) {
                obj.complete = updatedTodo.complete;
                if (obj.complete) {
                    el.classList.add("line");
                } else {
                    el.classList.remove("line");
                }
            }
        });
        update();
        addinmain(todoList);
    } catch (err) {
        console.error(err);
    }
}

// Delete all tasks
async function deleteAll() {
    try {
        await apiFetch('/todos/delete-all', { method: 'POST' });
        todoList = [];
        update();
        addinmain(todoList);
    } catch (err) {
        console.error(err);
    }
}

// Delete only completed tasks
async function deleteS() {
    try {
        await apiFetch('/todos/delete-selected', { method: 'POST' });
        todoList = todoList.filter((ele) => !ele.complete);
        update();
        addinmain(todoList);
    } catch (err) {
        console.error(err);
    }
}

// Event listeners for add and delete
addButton.addEventListener("click", add)
deleteAllButton.addEventListener("click", deleteAll)
deleteSButton.addEventListener("click", deleteS)

// Event listner for enter key
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        add();
    }
});

// Event listeners for filters and actions
document.addEventListener('click', (e) => {
    if (e.target.className.split(' ')[0] == 'complete' || e.target.className.split(' ')[0] == 'ci') {
        const id = e.target.closest('li').getAttribute('id');
        const taskEl = e.target.closest('li').querySelector("#task");
        completeTodo(id, taskEl);
    }
    if (e.target.className.split(' ')[0] == 'delete' || e.target.className.split(' ')[0] == 'di') {
        const id = e.target.closest('li').getAttribute('id');
        deleteTodo(id);
    }
    if (e.target.id == "all") {
        viewAll();
    }
    if (e.target.id == "rem") {
        viewRemaining();
    }
    if (e.target.id == "com") {
        viewCompleted();
    }
});

// Updates the remaining, completed and main list stats
function update() {
    comdoList = todoList.filter((ele) => ele.complete);
    remList = todoList.filter((ele) => !ele.complete);
    document.getElementById("r-count").innerText = todoList.length.toString();
    document.getElementById("c-count").innerText = comdoList.length.toString();
}

// Renders the main list
function addinmain(list) {
    allTodos.innerHTML = "";
    list.forEach(element => {
        var x = `<li id="${element._id}" class="todo-item">
            <p id="task" class="${element.complete ? 'line' : ''}">
                ${element.complete ? `<strike>${element.task}</strike>` : element.task}
            </p>
            <div class="todo-actions">
                <button class="complete btn btn-success">
                    <i class=" ci bx bx-check bx-sm"></i>
                </button>
                <button class="delete btn btn-error" >
                    <i class="di bx bx-trash bx-sm"></i>
                </button>
            </div>
        </li>`
        allTodos.innerHTML += x;
    });
}

// Functions for filters
function viewCompleted() { addinmain(comdoList); }
function viewRemaining() { addinmain(remList); }
function viewAll() { addinmain(todoList); }