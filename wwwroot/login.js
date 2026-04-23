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

function clearAdminStorage() {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminUsername");
    localStorage.removeItem("businessId");
    localStorage.removeItem("businessSlug");
    localStorage.removeItem("businessName");
}

async function login() {
    clearMessage();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showMessage("Wpisz login i hasło.", true);
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

        let data = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            showMessage(data?.message || "Logowanie nie powiodło się.", true);
            return;
        }

        if (!data || !data.businessId) {
            showMessage("Serwer nie zwrócił businessId.", true);
            return;
        }

        clearAdminStorage();

        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminUsername", data.username ?? username);
        localStorage.setItem("businessId", String(data.businessId));
        localStorage.setItem("businessSlug", data.slug ?? "");
        localStorage.setItem("businessName", data.businessName ?? "");

        window.location.href = "/admin.html";
    } catch {
        showMessage("Błąd serwera podczas logowania.", true);
    }
}

loginBtn.addEventListener("click", login);

passwordInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        login();
    }
});