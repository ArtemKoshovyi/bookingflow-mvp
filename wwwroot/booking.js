const apiBase = window.location.origin;

let businessId = null;
let selectedSlotUtc = null;

const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get("slug");

const workerSelect = document.getElementById("workerSelect");
const serviceSelect = document.getElementById("serviceSelect");
const dateInput = document.getElementById("dateInput");
const loadSlotsBtn = document.getElementById("loadSlotsBtn");
const slotsContainer = document.getElementById("slotsContainer");
const selectedSlotText = document.getElementById("selectedSlotText");
const clientNameInput = document.getElementById("clientName");
const clientEmailInput = document.getElementById("clientEmail");
const clientPhoneInput = document.getElementById("clientPhone");
const createBookingBtn = document.getElementById("createBookingBtn");
const messageBox = document.getElementById("messageBox");

function getHeaders(includeJson = true) {
    const headers = {
        "X-Business-Id": businessId
    };

    if (includeJson) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
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

function formatDateTime(dateString) {
    if (!dateString) return "";

    const normalized =
        /Z$|[+\-]\d{2}:\d{2}$/.test(dateString)
            ? dateString
            : `${dateString}Z`;

    return new Date(normalized).toLocaleString("pl-PL");
}

async function loadBusiness() {
    if (!slug) {
        throw new Error("Missing slug");
    }

    const response = await fetch(`${apiBase}/api/public/business/${slug}`);

    if (!response.ok) {
        throw new Error("Nie udało się załadować danych firmy");
    }

    const data = await response.json();
    businessId = data.id;
}

async function loadWorkers() {
    try {
        const response = await fetch(`${apiBase}/api/workers`, {
            headers: getHeaders(false)
        });

        if (!response.ok) {
            throw new Error("Nie udało się załadować pracowników");
        }

        const workers = await response.json();

        workerSelect.innerHTML = `<option value="">Wybierz pracownika</option>`;

        workers.forEach(worker => {
            const option = document.createElement("option");
            option.value = worker.id;
            option.textContent = worker.name;
            workerSelect.appendChild(option);
        });
    } catch {
        showMessage("Nie udało się załadować pracowników.", true);
    }
}

async function loadServices(workerId) {
    try {
        serviceSelect.disabled = true;
        serviceSelect.innerHTML = `<option value="">Ładowanie...</option>`;

        const response = await fetch(`${apiBase}/api/workers/${workerId}/services`, {
            headers: getHeaders(false)
        });

        if (!response.ok) {
            throw new Error("Nie udało się załadować usług");
        }

        const services = await response.json();

        serviceSelect.innerHTML = `<option value="">Wybierz usługę</option>`;

        services.forEach(service => {
            const option = document.createElement("option");
            option.value = service.id;

            const priceText = service.price === 0
                ? "Za darmo"
                : `${service.price} zł`;

            option.textContent = `${service.name} • ${service.durationMinutes} min • ${priceText}`;
            serviceSelect.appendChild(option);
        });

        serviceSelect.disabled = false;
    } catch {
        serviceSelect.innerHTML = `<option value="">Nie udało się załadować usług</option>`;
        showMessage("Nie udało się załadować usług.", true);
    }
}

async function loadAvailableSlots() {
    clearMessage();
    selectedSlotUtc = null;
    selectedSlotText.textContent = "Nie wybrano terminu";

    const workerId = workerSelect.value;
    const serviceId = serviceSelect.value;
    const dateValue = dateInput.value;

    if (!workerId || !serviceId || !dateValue) {
        showMessage("Wybierz pracownika, usługę i datę.", true);
        return;
    }

    const dayUtc = `${dateValue}T00:00:00Z`;

    try {
        const response = await fetch(
            `${apiBase}/api/bookings/available-slots?workerId=${workerId}&serviceId=${serviceId}&dayUtc=${encodeURIComponent(dayUtc)}`,
            {
                headers: getHeaders(false)
            }
        );

        if (!response.ok) {
            throw new Error("Nie udało się załadować terminów");
        }

        const slots = await response.json();

        if (!Array.isArray(slots) || slots.length === 0) {
            slotsContainer.className = "slot-list empty-state";
            slotsContainer.innerHTML = `<p>Brak dostępnych terminów na wybraną datę.</p>`;
            return;
        }

        slotsContainer.className = "slot-list";
        slotsContainer.innerHTML = "";

        slots.forEach(slot => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "slot-btn";
            button.textContent = formatDateTime(slot);

            button.addEventListener("click", () => {
                document.querySelectorAll(".slot-btn").forEach(btn => {
                    btn.classList.remove("selected");
                });

                button.classList.add("selected");
                selectedSlotUtc = slot;
                selectedSlotText.textContent = formatDateTime(slot);
            });

            slotsContainer.appendChild(button);
        });
    } catch {
        slotsContainer.className = "slot-list empty-state";
        slotsContainer.innerHTML = `<p>Nie udało się załadować terminów.</p>`;
        showMessage("Nie udało się załadować dostępnych terminów.", true);
    }
}

async function createBooking() {
    clearMessage();

    const workerId = Number(workerSelect.value);
    const serviceId = Number(serviceSelect.value);
    const clientName = clientNameInput.value.trim();
    const clientEmail = clientEmailInput.value.trim();
    const clientPhone = clientPhoneInput.value.trim();

    if (!workerId || !serviceId || !selectedSlotUtc || !clientName || !clientPhone) {
        showMessage("Uzupełnij imię, telefon i wybierz termin.", true);
        return;
    }

    const payload = {
        clientName,
        clientEmail,
        clientPhone,
        workerId,
        serviceId,
        startTimeUtc: selectedSlotUtc
    };

    try {
        const response = await fetch(`${apiBase}/api/bookings`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || "Nie udało się utworzyć rezerwacji.", true);
            return;
        }

        document.querySelector(".public-panel").style.display = "none";
        document.getElementById("successView").style.display = "block";

        document.getElementById("successDate").textContent = formatDateTime(selectedSlotUtc);

        const selectedService = serviceSelect.options[serviceSelect.selectedIndex].text;
        const selectedWorker = workerSelect.options[workerSelect.selectedIndex].text;

        document.getElementById("successService").textContent = selectedService;
        document.getElementById("successWorker").textContent = selectedWorker;

        clientNameInput.value = "";
        clientEmailInput.value = "";
        clientPhoneInput.value = "";
        selectedSlotUtc = null;
        selectedSlotText.textContent = "Nie wybrano terminu";

        await loadAvailableSlots();
    } catch {
        showMessage("Błąd serwera podczas tworzenia rezerwacji.", true);
    }
}

function resetUiStateAfterWorkerChange() {
    serviceSelect.innerHTML = `<option value="">Wybierz usługę</option>`;
    serviceSelect.disabled = true;
    selectedSlotUtc = null;
    selectedSlotText.textContent = "Nie wybrano terminu";
    slotsContainer.className = "slot-list empty-state";
    slotsContainer.innerHTML = `<p>Załaduj terminy, aby je zobaczyć.</p>`;
}

workerSelect.addEventListener("change", async () => {
    const workerId = workerSelect.value;
    resetUiStateAfterWorkerChange();

    if (!workerId) {
        return;
    }

    await loadServices(workerId);
});

loadSlotsBtn.addEventListener("click", loadAvailableSlots);
createBookingBtn.addEventListener("click", createBooking);

function setDefaultDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split("T")[0];
}

async function init() {
    try {
        setDefaultDate();
        await loadBusiness();
        await loadWorkers();
    } catch {
        showMessage("Nie udało się załadować strony rezerwacji.", true);
    }
}

init();