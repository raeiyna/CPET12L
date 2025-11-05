document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addBtn");
  const modal = document.getElementById("modal");
  const cancelBtn = document.getElementById("cancelBtn");
  const form = document.getElementById("appointmentForm");
  const modalTitle = document.getElementById("modalTitle");
  const upcomingTableBody = document.querySelector("#upcomingTable tbody");
  const pastTableBody = document.querySelector("#pastTable tbody");

  const receiptPopup = document.getElementById("receiptPopup");
  const closeReceiptBtn = document.getElementById("closeReceiptBtn");
  const receiptPetName = document.getElementById("receiptPetName");
  const receiptService = document.getElementById("receiptService");
  const receiptApptDate = document.getElementById("receiptApptDate");
  const receiptApptTime = document.getElementById("receiptApptTime");
  const receiptVet = document.getElementById("receiptVet");
  const receiptStatus = document.getElementById("receiptStatus");
  const receiptDate = document.getElementById("receiptDate");

  let editRow = null;

  const dateInput = document.getElementById("date");
  const today = new Date().toISOString().split("T")[0];
  dateInput.setAttribute("min", today);

  addBtn.addEventListener("click", () => {
    modalTitle.textContent = "Book New Appointment";
    form.reset();
    editRow = null;
    modal.classList.add("show");
    modal.classList.remove("hidden");
  });

  cancelBtn.addEventListener("click", closeModal);
  window.addEventListener("click", e => {
    if (e.target === modal) closeModal();
  });

  function closeModal() {
    modal.classList.remove("show");
    setTimeout(() => modal.classList.add("hidden"), 300);
  }

	form.addEventListener("submit", e => {
	  e.preventDefault();

	  let petName = document.getElementById("petName").value.trim();
	  const service = document.getElementById("service").value.trim();
	  const date = document.getElementById("date").value;
	  const timeValue = document.getElementById("time").value;
	  const vet = document.getElementById("vet") ? document.getElementById("vet").value.trim() : "Not assigned";

	  if (!petName || !service || !date || !timeValue) {
		alert("Please fill in all fields.");
		return;
	  }

	  const selectedDateTime = new Date(`${date}T${timeValue}`);
	  const now = new Date();
	  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); 

	  if (selectedDateTime < now) {
		alert("You cannot book an appointment in the past.");
		return;
	  }

	  if (selectedDateTime < oneHourLater) {
		alert("Appointments must be booked at least 1 hour in advance.");
		return;
	  }

	  petName = petName.charAt(0).toUpperCase() + petName.slice(1).toLowerCase();

	  const time = formatTime(timeValue);
	  const status = editRow ? editRow.cells[5].textContent : "Pending";
	  const appointment = { petName, service, date, time, vet, status };

	  if (editRow) {
		updateRow(editRow, appointment);
	  } else {
		addRow(appointment);
		showReceipt(appointment);
	  }

	  closeModal();
	  form.reset();
	});

	function addRow({ petName, service, date, time, vet, status }) {
	  const row = document.createElement("tr");
	  row.innerHTML = `
		<td>${petName}</td>
		<td>${service}</td>
		<td>${vet}</td>
		<td>${date}</td>
		<td>${time}</td>
		<td><span class="status ${status.toLowerCase()}">${status}</span></td>
		<td class="action-col"></td>
	  `;

	  const actionCell = row.querySelector(".action-col");

	  const selectedDateTime = new Date(`${date}T${to24Hour(time)}`);
	  const now = new Date();

	  if (selectedDateTime < now) {
		const label = status.toLowerCase() === "cancelled" ? "Cancelled" : "Done";
		row.cells[5].innerHTML = `<span class="status ${label.toLowerCase()}">${label}</span>`;
		pastTableBody.appendChild(row);
	  } else {
		actionCell.innerHTML = `
		  <button class="btn edit-btn">Edit</button>
		  <button class="btn cancel-btn">Cancel</button>
		`;
		attachRowActions(row);
		upcomingTableBody.appendChild(row);
	  }
	}


  function updateRow(row, { petName, service, date, time, vet, status }) {
    row.cells[0].textContent = petName;
    row.cells[1].textContent = service;
    row.cells[2].textContent = vet;
    row.cells[3].textContent = date;
    row.cells[4].textContent = time;
    row.cells[5].innerHTML = `<span class="status ${status.toLowerCase()}">${status}</span>`;
  }

  function attachRowActions(row) {
    const editBtn = row.querySelector(".edit-btn");
    const cancelBtn = row.querySelector(".cancel-btn");

    editBtn.addEventListener("click", () => {
      editRow = row;
      document.getElementById("petName").value = row.cells[0].textContent;
      document.getElementById("service").value = row.cells[1].textContent;
      document.getElementById("vet").value = row.cells[2].textContent;
      document.getElementById("date").value = row.cells[3].textContent;
      document.getElementById("time").value = to24Hour(row.cells[4].textContent);

      modalTitle.textContent = "Edit Appointment";
      modal.classList.add("show");
      modal.classList.remove("hidden");
    });

    cancelBtn.addEventListener("click", () => {
      if (confirm("Cancel this appointment?")) {
        setStatus(row, "Cancelled");
        row.querySelector(".edit-btn").remove();
        row.querySelector(".cancel-btn").remove();
        pastTableBody.appendChild(row);
      }
    });
  }

  function setStatus(row, status) {
    row.cells[5].innerHTML = `<span class="status ${status.toLowerCase()}">${status}</span>`;
  }

  function showReceipt({ petName, service, date, time, vet, status }) {
    receiptPetName.textContent = petName;
    receiptService.textContent = service;
    receiptApptDate.textContent = date;
    receiptApptTime.textContent = time;
    receiptVet.textContent = vet;
    receiptStatus.textContent = status;
    receiptDate.textContent = new Date().toLocaleDateString();

    receiptPopup.classList.add("show");
    receiptPopup.classList.remove("hidden");
  }

  closeReceiptBtn.addEventListener("click", () => {
    receiptPopup.classList.remove("show");
    setTimeout(() => receiptPopup.classList.add("hidden"), 300);
  });

  function formatTime(time24) {
    if (!time24) return "";
    let [h, m] = time24.split(":").map(Number);
    const modifier = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${modifier}`;
  }

  function to24Hour(time12) {
    if (!time12.includes(" ")) return time12;
    let [time, modifier] = time12.split(" ");
    let [h, m] = time.split(":").map(Number);
    if (modifier.toUpperCase() === "PM" && h !== 12) h += 12;
    if (modifier.toUpperCase() === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
  

});
