const apiBase = "http://localhost:5009";

const messageBox = document.getElementById("messageBox");
const logoutBtn = document.getElementById("logoutBtn");
const reloadDataBtn = document.getElementById("reloadDataBtn");

const navLinks = document.querySelectorAll(".nav-link");
const views = document.querySelectorAll(".view");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const bookingsTableBody = document.getElementById("bookingsTableBody");
const bookingDateFilter = document.getElementById("bookingDateFilter");
const todayFilterBtn = document.getElementById("todayFilterBtn");
const clearFilterBtn = document.getElementById("clearFilterBtn");

const workerNameInput = document.getElementById("workerNameInput");
const createWorkerBtn = document.getElementById("createWorkerBtn");
const workersTableBody = document.getElementById("workersTableBody");

const serviceNameInput = document.getElementById("serviceNameInput");
const serviceDurationInput = document.getElementById("serviceDurationInput");
const servicePriceInput = document.getElementById("servicePriceInput");
const serviceWorkerSelect = document.getElementById("serviceWorkerSelect");
const createServiceBtn = document.getElementById("createServiceBtn");
const servicesTableBody = document.getElementById("servicesTableBody");

const adminWorkerSelect = document.getElementById("adminWorkerSelect");
const adminServiceSelect = document.getElementById("adminServiceSelect");
const adminDateInput = document.getElementById("adminDateInput");
const adminLoadSlotsBtn = document.getElementById("adminLoadSlotsBtn");
const adminSlotsContainer = document.getElementById("adminSlotsContainer");
const adminSelectedSlotText = document.getElementById("adminSelectedSlotText");
const adminClientNameInput = document.getElementById("adminClientName");
const adminClientEmailInput = document.getElementById("adminClientEmail");
const adminClientPhoneInput = document.getElementById("adminClientPhone");
const adminCreateBookingBtn = document.getElementById("adminCreateBookingBtn");

let allBookings = [];
let allWorkers = [];
let allServices = [];
let adminSelectedSlotUtc = null;

function ensureAdminAuth() {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn !== "true") {
        window.location.href = "/login.html";
    }
}

function logout() {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminUsername");
    window.location.href = "/login.html";
}

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

function formatDateTime(utcString) {
    return new Date(utcString).toLocaleString();
}

function formatDateOnly(utcString) {
    return new Date(utcString).toISOString().split("T")[0];
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function setDefaultAdminDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    adminDateInput.value = tomorrow.toISOString().split("T")[0];
}

function setActiveView(viewId) {
    views.forEach(view => {
        view.classList.toggle("active", view.id === viewId);
    });

    navLinks.forEach(link => {
        link.classList.toggle("active", link.dataset.view === viewId);
    });

    if (viewId === "bookingsView") {
        pageTitle.textContent = "Rezerwacje";
        pageSubtitle.textContent = "Przeglądaj, twórz i zarządzaj rezerwacjami";
        renderBookings();
    } else if (viewId === "workersView") {
        pageTitle.textContent = "Pracownicy";
        pageSubtitle.textContent = "Zarządzaj pracownikami w systemie";
        renderWorkers();
    } else {
        pageTitle.textContent = "Usługi";
        pageSubtitle.textContent = "Zarządzaj usługami i przypisaniami";
        renderServices();
    }
}

async function loadWorkers() {
    const response = await fetch(`${apiBase}/api/workers`);
    if (!response.ok) {
        throw new Error("Nie udało się załadować pracowników");
    }

    allWorkers = await response.json();
    renderWorkers();
    fillServiceWorkerSelect();
    fillAdminWorkerSelect();
}

async function loadServices() {
    const response = await fetch(`${apiBase}/api/services`);
    if (!response.ok) {
        throw new Error("Nie udało się załadować usług");
    }

    allServices = await response.json();
    renderServices();
}

async function loadBookings() {
    const response = await fetch(`${apiBase}/api/bookings`);
    if (!response.ok) {
        throw new Error("Nie udało się załadować rezerwacji");
    }

    allBookings = await response.json();
    renderBookings();
}

async function reloadAllData() {
    clearMessage();

    try {
        await Promise.all([
            loadBookings(),
            loadWorkers(),
            loadServices()
        ]);
    } catch {
        showMessage("Nie udało się odświeżyć danych.", true);
    }
}

function getFilteredBookings() {
    const selectedDate = bookingDateFilter.value;

    if (!selectedDate) {
        return allBookings;
    }

    return allBookings.filter(booking => formatDateOnly(booking.startTimeUtc) === selectedDate);
}

function renderBookings() {
    const bookings = getFilteredBookings();

    if (!Array.isArray(bookings) || bookings.length === 0) {
        bookingsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-row">Brak rezerwacji dla wybranego filtra.</td>
            </tr>
        `;
        return;
    }

    bookingsTableBody.innerHTML = bookings.map(booking => `
        <tr>
            <td>${escapeHtml(booking.clientName)}</td>
            <td>${escapeHtml(booking.clientEmail)}</td>
            <td>${escapeHtml(booking.clientPhone)}</td>
            <td>${escapeHtml(booking.workerName)}</td>
            <td>${escapeHtml(booking.serviceName)}</td>
            <td>${formatDateTime(booking.startTimeUtc)}</td>
            <td>${formatDateTime(booking.endTimeUtc)}</td>
            <td>
                <button class="table-action-btn danger-btn" data-booking-id="${booking.id}">
                    Anuluj
                </button>
            </td>
        </tr>
    `).join("");

    document.querySelectorAll("[data-booking-id]").forEach(button => {
        button.addEventListener("click", () => {
            deleteBooking(Number(button.dataset.bookingId));
        });
    });
}

function renderWorkers() {
    if (!Array.isArray(allWorkers) || allWorkers.length === 0) {
        workersTableBody.innerHTML = `
            <tr>
                <td colspan="2" class="empty-row">Brak pracowników.</td>
            </tr>
        `;
        return;
    }

    workersTableBody.innerHTML = allWorkers.map(worker => `
        <tr>
            <td>${escapeHtml(worker.name)}</td>
            <td>
                <button class="table-action-btn danger-btn" data-worker-id="${worker.id}">
                    Usuń
                </button>
            </td>
        </tr>
    `).join("");

    document.querySelectorAll("[data-worker-id]").forEach(button => {
        button.addEventListener("click", () => {
            deleteWorker(Number(button.dataset.workerId));
        });
    });
}

function renderServices() {
    if (!Array.isArray(allServices) || allServices.length === 0) {
        servicesTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">Brak usług.</td>
            </tr>
        `;
        return;
    }

    servicesTableBody.innerHTML = allServices.map(service => `
        <tr>
            <td>${escapeHtml(service.name)}</td>
            <td>${service.durationMinutes} min</td>
            <td>${service.price}</td>
            <td>${escapeHtml(service.workerName)}</td>
            <td>
                <button class="table-action-btn danger-btn" data-service-id="${service.id}">
                    Usuń
                </button>
            </td>
        </tr>
    `).join("");

    document.querySelectorAll("[data-service-id]").forEach(button => {
        button.addEventListener("click", () => {
            deleteService(Number(button.dataset.serviceId));
        });
    });
}

function fillServiceWorkerSelect() {
    serviceWorkerSelect.innerHTML = `<option value="">Wybierz pracownika</option>`;

    allWorkers.forEach(worker => {
        const option = document.createElement("option");
        option.value = worker.id;
        option.textContent = worker.name;
        serviceWorkerSelect.appendChild(option);
    });
}

function fillAdminWorkerSelect() {
    adminWorkerSelect.innerHTML = `<option value="">Wybierz pracownika</option>`;

    allWorkers.forEach(worker => {
        const option = document.createElement("option");
        option.value = worker.id;
        option.textContent = worker.name;
        adminWorkerSelect.appendChild(option);
    });
}

function resetAdminBookingUi() {
    adminServiceSelect.innerHTML = '<option value="">Wybierz usługę</option>';
    adminServiceSelect.disabled = true;
    adminSelectedSlotUtc = null;
    adminSelectedSlotText.textContent = "Nie wybrano terminu";
    adminSlotsContainer.className = "slot-list empty-state";
    adminSlotsContainer.innerHTML = "<p>Załaduj terminy, aby zobaczyć dostępne godziny.</p>";
}

async function loadAdminWorkerServices(workerId) {
    try {
        adminServiceSelect.disabled = true;
        adminServiceSelect.innerHTML = '<option value="">Ładowanie...</option>';

        const response = await fetch(`${apiBase}/api/workers/${workerId}/services`);
        if (!response.ok) {
            throw new Error("Nie udało się załadować usług");
        }

        const services = await response.json();

        adminServiceSelect.innerHTML = '<option value="">Wybierz usługę</option>';

        services.forEach(service => {
            const option = document.createElement("option");
            option.value = service.id;
            option.textContent = `${service.name} • ${service.durationMinutes} min • ${service.price}`;
            adminServiceSelect.appendChild(option);
        });

        adminServiceSelect.disabled = false;
    } catch {
        adminServiceSelect.innerHTML = '<option value="">Nie udało się załadować usług</option>';
        showMessage("Nie udało się załadować usług dla wybranego pracownika.", true);
    }
}

async function loadAdminAvailableSlots() {
    clearMessage();
    adminSelectedSlotUtc = null;
    adminSelectedSlotText.textContent = "Nie wybrano terminu";

    const workerId = adminWorkerSelect.value;
    const serviceId = adminServiceSelect.value;
    const dateValue = adminDateInput.value;

    if (!workerId || !serviceId || !dateValue) {
        showMessage("Wybierz pracownika, usługę i datę.", true);
        return;
    }

    const dayUtc = `${dateValue}T00:00:00Z`;

    try {
        const response = await fetch(
            `${apiBase}/api/bookings/available-slots?workerId=${workerId}&serviceId=${serviceId}&dayUtc=${encodeURIComponent(dayUtc)}`
        );

        if (!response.ok) {
            throw new Error("Nie udało się załadować terminów");
        }

        const slots = await response.json();

        if (!Array.isArray(slots) || slots.length === 0) {
            adminSlotsContainer.className = "slot-list empty-state";
            adminSlotsContainer.innerHTML = "<p>Brak dostępnych terminów na wybraną datę.</p>";
            return;
        }

        adminSlotsContainer.className = "slot-list";
        adminSlotsContainer.innerHTML = "";

        slots.forEach(slot => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "slot-btn";
            button.textContent = formatDateTime(slot);

            button.addEventListener("click", () => {
                document.querySelectorAll("#adminSlotsContainer .slot-btn").forEach(btn => {
                    btn.classList.remove("selected");
                });

                button.classList.add("selected");
                adminSelectedSlotUtc = slot;
                adminSelectedSlotText.textContent = formatDateTime(slot);
            });

            adminSlotsContainer.appendChild(button);
        });
    } catch {
        adminSlotsContainer.className = "slot-list empty-state";
        adminSlotsContainer.innerHTML = "<p>Nie udało się załadować terminów.</p>";
        showMessage("Nie udało się załadować dostępnych terminów.", true);
    }
}

async function createAdminBooking() {
    clearMessage();

    const workerId = Number(adminWorkerSelect.value);
    const serviceId = Number(adminServiceSelect.value);
    const clientName = adminClientNameInput.value.trim();
    const clientEmail = adminClientEmailInput.value.trim();
    const clientPhone = adminClientPhoneInput.value.trim();

    if (!workerId || !serviceId || !adminSelectedSlotUtc || !clientName || !clientPhone) {
        showMessage("Uzupełnij imię, telefon i wybierz termin.", true);
        return;
    }

    const payload = {
        clientName,
        clientEmail,
        clientPhone,
        workerId,
        serviceId,
        startTimeUtc: adminSelectedSlotUtc
    };

    try {
        const response = await fetch(`${apiBase}/api/bookings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || "Nie udało się utworzyć rezerwacji.", true);
            return;
        }

        showMessage("Rezerwacja została utworzona.");
        adminClientNameInput.value = "";
        adminClientEmailInput.value = "";
        adminClientPhoneInput.value = "";
        adminSelectedSlotUtc = null;
        adminSelectedSlotText.textContent = "Nie wybrano terminu";

        await reloadAllData();
        await loadAdminAvailableSlots();
    } catch {
        showMessage("Błąd serwera podczas tworzenia rezerwacji.", true);
    }
}

async function createWorker() {
    clearMessage();

    const name = workerNameInput.value.trim();
    if (!name) {
        showMessage("Wpisz imię pracownika.", true);
        return;
    }

    try {
        const response = await fetch(`${apiBase}/api/workers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || "Nie udało się dodać pracownika.", true);
            return;
        }

        workerNameInput.value = "";
        showMessage("Pracownik został dodany.");
        await loadWorkers();
    } catch {
        showMessage("Błąd serwera podczas dodawania pracownika.", true);
    }
}

async function deleteWorker(workerId) {
    const confirmed = confirm("Czy na pewno chcesz usunąć pracownika?");
    if (!confirmed) {
        return;
    }

    clearMessage();

    try {
        const response = await fetch(`${apiBase}/api/workers/${workerId}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || "Nie udało się usunąć pracownika.", true);
            return;
        }

        showMessage("Pracownik został usunięty.");
        await reloadAllData();
    } catch {
        showMessage("Błąd serwera podczas usuwania pracownika.", true);
    }
}

async function createService() {
    clearMessage();

    const name = serviceNameInput.value.trim();
    const durationMinutes = Number(serviceDurationInput.value);
    const price = Number(servicePriceInput.value);
    const workerId = Number(serviceWorkerSelect.value);

    if (!name || !durationMinutes || workerId === 0) {
        showMessage("Uzupełnij nazwę usługi, czas trwania i pracownika.", true);
        return;
    }

    try {
        const response = await fetch(`${apiBase}/api/services`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                durationMinutes,
                price,
                workerId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || "Nie udało się dodać usługi.", true);
            return;
        }

        serviceNameInput.value = "";
        serviceDurationInput.value = "";
        servicePriceInput.value = "";
        serviceWorkerSelect.value = "";

        showMessage("Usługa została dodana.");
        await loadServices();
    } catch {
        showMessage("Błąd serwera podczas dodawania usługi.", true);
    }
}

async function deleteService(serviceId) {
    const confirmed = confirm("Czy na pewno chcesz usunąć usługę?");
    if (!confirmed) {
        return;
    }

    clearMessage();

    try {
        const response = await fetch(`${apiBase}/api/services/${serviceId}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || "Nie udało się usunąć usługi.", true);
            return;
        }

        showMessage("Usługa została usunięta.");
        await loadServices();
    } catch {
        showMessage("Błąd serwera podczas usuwania usługi.", true);
    }
}

async function deleteBooking(bookingId) {
    const confirmed = confirm("Czy na pewno chcesz anulować tę rezerwację?");
    if (!confirmed) {
        return;
    }

    clearMessage();

    try {
        const response = await fetch(`${apiBase}/api/bookings/${bookingId}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || "Nie udało się anulować rezerwacji.", true);
            return;
        }

        showMessage("Rezerwacja została anulowana.");
        await loadBookings();
    } catch {
        showMessage("Błąd serwera podczas anulowania rezerwacji.", true);
    }
}

logoutBtn.addEventListener("click", logout);
reloadDataBtn.addEventListener("click", reloadAllData);

bookingDateFilter.addEventListener("change", renderBookings);

todayFilterBtn.addEventListener("click", () => {
    const today = new Date().toISOString().split("T")[0];
    bookingDateFilter.value = today;
    renderBookings();
});

clearFilterBtn.addEventListener("click", () => {
    bookingDateFilter.value = "";
    renderBookings();
});

createWorkerBtn.addEventListener("click", createWorker);
createServiceBtn.addEventListener("click", createService);

adminWorkerSelect.addEventListener("change", async () => {
    const workerId = adminWorkerSelect.value;
    resetAdminBookingUi();

    if (!workerId) {
        return;
    }

    await loadAdminWorkerServices(workerId);
});

adminLoadSlotsBtn.addEventListener("click", loadAdminAvailableSlots);
adminCreateBookingBtn.addEventListener("click", createAdminBooking);

navLinks.forEach(link => {
    link.addEventListener("click", () => {
        setActiveView(link.dataset.view);
    });
});

async function init() {
    ensureAdminAuth();
    setDefaultAdminDate();

    try {
        await reloadAllData();
    } catch {
        showMessage("Nie udało się uruchomić panelu administratora.", true);
    }
}

init();