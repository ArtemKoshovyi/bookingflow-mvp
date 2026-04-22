const apiBase = "http://localhost:5009";

const workerSelect = document.getElementById("workerSelect");
const serviceSelect = document.getElementById("serviceSelect");
const dateInput = document.getElementById("dateInput");
const loadSlotsBtn = document.getElementById("loadSlotsBtn");
const slotsContainer = document.getElementById("slotsContainer");
const selectedSlotText = document.getElementById("selectedSlotText");
const clientNameInput = document.getElementById("clientName");
const clientEmailInput = document.getElementById("clientEmail");
const createBookingBtn = document.getElementById("createBookingBtn");
const messageBox = document.getElementById("messageBox");
const refreshDataBtn = document.getElementById("refreshDataBtn");
const reloadBookingsBtn = document.getElementById("reloadBookingsBtn");
const bookingsTableBody = document.getElementById("bookingsTableBody");
const bookingDateFilter = document.getElementById("bookingDateFilter");
const todayFilterBtn = document.getElementById("todayFilterBtn");
const clearFilterBtn = document.getElementById("clearFilterBtn");

const navLinks = document.querySelectorAll(".nav-link");
const views = document.querySelectorAll(".view");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

let selectedSlotUtc = null;
let allBookings = [];

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
    const date = new Date(utcString);
    return date.toLocaleString();
}

function formatDateOnly(utcString) {
    const date = new Date(utcString);
    return date.toISOString().split("T")[0];
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function setActiveView(viewId) {
    views.forEach(view => {
        view.classList.toggle("active", view.id === viewId);
    });

    navLinks.forEach(link => {
        link.classList.toggle("active", link.dataset.view === viewId);
    });

    if (viewId === "bookingView") {
        pageTitle.textContent = "Create Booking";
        pageSubtitle.textContent = "Create and manage client reservations";
    } else {
        pageTitle.textContent = "Bookings";
        pageSubtitle.textContent = "Review and manage all reservations";
        renderBookings();
    }
}

async function loadWorkers() {
    try {
        const response = await fetch(`${apiBase}/api/workers`);
        if (!response.ok) {
            throw new Error("Failed to fetch workers");
        }

        const workers = await response.json();

        workerSelect.innerHTML = '<option value="">Select worker</option>';

        workers.forEach(worker => {
            const option = document.createElement("option");
            option.value = worker.id;
            option.textContent = worker.name;
            workerSelect.appendChild(option);
        });
    } catch (error) {
        showMessage("Failed to load workers.", true);
    }
}

async function loadServices(workerId) {
    try {
        serviceSelect.disabled = true;
        serviceSelect.innerHTML = '<option value="">Loading...</option>';

        const response = await fetch(`${apiBase}/api/workers/${workerId}/services`);
        if (!response.ok) {
            throw new Error("Failed to fetch services");
        }

        const services = await response.json();

        serviceSelect.innerHTML = '<option value="">Select service</option>';

        services.forEach(service => {
            const option = document.createElement("option");
            option.value = service.id;
            option.textContent = `${service.name} • ${service.durationMinutes} min • ${service.price}`;
            serviceSelect.appendChild(option);
        });

        serviceSelect.disabled = false;
    } catch (error) {
        serviceSelect.innerHTML = '<option value="">Failed to load services</option>';
        showMessage("Failed to load services.", true);
    }
}

async function loadAvailableSlots() {
    clearMessage();
    selectedSlotUtc = null;
    selectedSlotText.textContent = "No slot selected";
    slotsContainer.innerHTML = "";

    const workerId = workerSelect.value;
    const serviceId = serviceSelect.value;
    const dateValue = dateInput.value;

    if (!workerId || !serviceId || !dateValue) {
        showMessage("Select worker, service and date first.", true);
        return;
    }

    const dayUtc = `${dateValue}T00:00:00Z`;

    try {
        const response = await fetch(
            `${apiBase}/api/bookings/available-slots?workerId=${workerId}&serviceId=${serviceId}&dayUtc=${encodeURIComponent(dayUtc)}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch slots");
        }

        const slots = await response.json();

        if (!Array.isArray(slots) || slots.length === 0) {
            slotsContainer.className = "slot-list empty-state";
            slotsContainer.innerHTML = "<p>No available slots for selected date.</p>";
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
                document.querySelectorAll(".slot-btn").forEach(btn => btn.classList.remove("selected"));
                button.classList.add("selected");
                selectedSlotUtc = slot;
                selectedSlotText.textContent = formatDateTime(slot);
            });

            slotsContainer.appendChild(button);
        });
    } catch (error) {
        slotsContainer.className = "slot-list empty-state";
        slotsContainer.innerHTML = "<p>Failed to load slots.</p>";
        showMessage("Failed to load available slots.", true);
    }
}

async function createBooking() {
    clearMessage();

    const workerId = Number(workerSelect.value);
    const serviceId = Number(serviceSelect.value);
    const clientName = clientNameInput.value.trim();
    const clientEmail = clientEmailInput.value.trim();

    if (!workerId || !serviceId || !selectedSlotUtc || !clientName || !clientEmail) {
        showMessage("Fill all fields and select a slot.", true);
        return;
    }

    const payload = {
        clientName,
        clientEmail,
        workerId,
        serviceId,
        startTimeUtc: selectedSlotUtc
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
            showMessage(data.message || "Failed to create booking.", true);
            return;
        }

        showMessage("Booking created successfully.");
        clientNameInput.value = "";
        clientEmailInput.value = "";
        selectedSlotUtc = null;
        selectedSlotText.textContent = "No slot selected";

        await loadAvailableSlots();
        await loadBookings();
    } catch (error) {
        showMessage("Server error while creating booking.", true);
    }
}

async function deleteBooking(bookingId) {
    const confirmed = confirm("Are you sure you want to cancel this booking?");
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
            showMessage(data.message || "Failed to delete booking.", true);
            return;
        }

        showMessage("Booking deleted successfully.");
        await loadBookings();
    } catch (error) {
        showMessage("Server error while deleting booking.", true);
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
                <td colspan="7" class="empty-row">No bookings found for selected filter.</td>
            </tr>
        `;
        return;
    }

    bookingsTableBody.innerHTML = bookings.map(booking => `
        <tr>
            <td>${escapeHtml(booking.clientName)}</td>
            <td>${escapeHtml(booking.clientEmail)}</td>
            <td>${escapeHtml(booking.workerName)}</td>
            <td>${escapeHtml(booking.serviceName)}</td>
            <td>${formatDateTime(booking.startTimeUtc)}</td>
            <td>${formatDateTime(booking.endTimeUtc)}</td>
            <td>
                <button class="table-action-btn danger-btn" data-id="${booking.id}">
                    Cancel
                </button>
            </td>
        </tr>
    `).join("");

    document.querySelectorAll(".danger-btn").forEach(button => {
        button.addEventListener("click", () => {
            const bookingId = Number(button.dataset.id);
            deleteBooking(bookingId);
        });
    });
}

async function loadBookings() {
    try {
        const response = await fetch(`${apiBase}/api/bookings`);

        if (!response.ok) {
            throw new Error("Failed to fetch bookings");
        }

        const bookings = await response.json();
        allBookings = bookings;
        renderBookings();
    } catch (error) {
        bookingsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-row">Failed to load bookings.</td>
            </tr>
        `;
        showMessage("Failed to load bookings.", true);
    }
}

function resetUiStateAfterWorkerChange() {
    serviceSelect.innerHTML = '<option value="">Select service</option>';
    serviceSelect.disabled = true;
    selectedSlotUtc = null;
    selectedSlotText.textContent = "No slot selected";
    slotsContainer.className = "slot-list empty-state";
    slotsContainer.innerHTML = "<p>Load slots to see available times.</p>";
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
reloadBookingsBtn.addEventListener("click", loadBookings);

refreshDataBtn.addEventListener("click", async () => {
    clearMessage();
    await loadWorkers();
    await loadBookings();
});

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

navLinks.forEach(link => {
    link.addEventListener("click", () => {
        setActiveView(link.dataset.view);
    });
});

function setDefaultDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split("T")[0];
}

async function init() {
    setDefaultDate();
    await loadWorkers();
    await loadBookings();
}

init();