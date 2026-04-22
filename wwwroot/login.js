const apiBase = window.location.origin;

const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const messageBox = document.getElementById("messageBox");

function showMessage(text, isError = false) {
    messageBox.innerHTML = `
        <div class="message ${isError ? "error" : "success"}">
            ${text}
        </div>
    `;
}

function clearMessage() {
    messageBox.innerHTML = "";
}

async function login() {
    clearMessage();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showMessage("Enter username and password.", true);
        return;
    }

    try {
        const response = await fetch(`${apiBase}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || "Login failed.", true);
            return;
        }

        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminUsername", data.username);

        window.location.href = "/admin.html";
    } catch (error) {
        showMessage("Server error during login.", true);
    }
}

loginBtn.addEventListener("click", login);

passwordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        login();
    }
});