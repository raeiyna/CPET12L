document.addEventListener("DOMContentLoaded", () => {
  
  const addBtn = document.getElementById("addAdminBtn");
  const modal = document.getElementById("adminModal");
  const cancelBtn = document.getElementById("adminCancelBtn");
  const form = document.getElementById("adminForm");
  const modalTitle = document.getElementById("adminModalTitle");
  const tableBody = document.querySelector("#adminTable tbody");
  const searchInput = document.getElementById("adminSearch");
  
  const doctorSelect = document.getElementById("adminDoctor");
  const dateInput = document.getElementById("adminDate");
  const timeSelect = document.getElementById("adminTime");

  let editingRow = null; 
  let appointments = []; 
  let currentPage = 1;
  let itemsPerPage = 15;
  let sortColumn = 'date';
  let sortDirection = 'asc'; 
  

  updateSummaryCards();
  renderTable();

  addBtn.addEventListener("click", () => openModal("Add Appointment"));
  cancelBtn.addEventListener("click", closeModal);
  
  window.addEventListener("click", e => { 
    if (e.target === modal) closeModal(); 
  });

  form.addEventListener("submit", handleFormSubmit);

  doctorSelect.addEventListener("change", updateAvailableTimes);
  dateInput.addEventListener("change", updateAvailableTimes);

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentPage = 1; 
      renderTable();
    });
  }

  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      handleFilter(btn, filterButtons);
      currentPage = 1;
      renderTable();
    });
  });

  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    const filteredData = getFilteredAppointments();
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });

  document.getElementById("itemsPerPage").addEventListener("change", (e) => {
    itemsPerPage = e.target.value === 'all' ? Infinity : parseInt(e.target.value);
    currentPage = 1; 
    renderTable();
  });

  document.querySelectorAll("th.sortable").forEach(th => {
    th.addEventListener("click", () => {
      const column = th.dataset.sort;
      
      if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortDirection = 'asc';
      }
      
      document.querySelectorAll("th.sortable").forEach(header => {
        header.classList.remove('asc', 'desc');
      });
      th.classList.add(sortDirection);
      
      currentPage = 1;
      renderTable();
    });
  });


  function openModal(title, appointmentData = null) {
    modalTitle.textContent = title;
    modal.classList.add("show");

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.setAttribute("min", `${yyyy}-${mm}-${dd}`);

    if (appointmentData) {
      document.getElementById("adminPetName").value = appointmentData.petName;
      document.getElementById("adminBreed").value = appointmentData.breed;
      document.getElementById("adminOwner").value = appointmentData.owner;
      document.getElementById("adminDoctor").value = appointmentData.doctor;
      document.getElementById("adminService").value = appointmentData.service;
      document.getElementById("adminDate").value = appointmentData.date;
      document.getElementById("adminTime").value = appointmentData.time;
      document.getElementById("adminNotes").value = appointmentData.notes || '';
      
      setTimeout(() => updateAvailableTimes(), 0);
    }
  }


  function closeModal() {
    modal.classList.remove("show");
    form.reset();
    editingRow = null; 
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const petName = capitalizeWords(document.getElementById("adminPetName").value.trim());
    const breed = capitalizeWords(document.getElementById("adminBreed").value.trim());
    const owner = capitalizeWords(document.getElementById("adminOwner").value.trim());
    const doctor = document.getElementById("adminDoctor").value.trim();
    const service = document.getElementById("adminService").value.trim();
    const date = document.getElementById("adminDate").value;
    const time = document.getElementById("adminTime").value;
    const notes = document.getElementById("adminNotes").value.trim();

    const selectedDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    if (selectedDateTime < oneHourLater) {
      alert("You can only book an appointment at least 1 hour after the current time.");
      return;
    }

    const hasOverlap = checkOverlappingAppointment(doctor, date, time, editingRow);
    if (hasOverlap) {
      alert(`Dr. ${doctor} already has an appointment at this time. Please select a different time slot.`);
      return;
    }

    if (editingRow !== null) {
      const existingStatus = appointments[editingRow].status;
      
      appointments[editingRow] = {
        petName, 
        breed, 
        owner, 
        doctor, 
        service, 
        date, 
        time, 
        status: existingStatus,
        notes 
      };
    } else {
      const appointment = { 
        petName, 
        breed, 
        owner, 
        doctor, 
        service, 
        date, 
        time, 
        status: "Pending", 
        notes 
      };
      
      appointments.push(appointment);
    }

    updateSummaryCards();
    closeModal();
    renderTable();
  }


  function checkOverlappingAppointment(doctor, date, time, excludeIndex = null) {
    const selectedMinutes = timeToMinutes(time);

    for (let i = 0; i < appointments.length; i++) {
      if (i === excludeIndex) continue;

      const apt = appointments[i];

      if (apt.doctor === doctor && apt.date === date) {
        const aptMinutes = timeToMinutes(apt.time);
        const timeDifference = Math.abs(selectedMinutes - aptMinutes);
        
        if (timeDifference < 60) {
          return true;
        }
      }
    }

    return false;
  }

  function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function updateAvailableTimes() {
    const selectedDoctor = doctorSelect.value;
    const selectedDate = dateInput.value;

    for (const opt of timeSelect.options) {
      opt.disabled = false;
      opt.style.color = "";
    }

    if (!selectedDoctor || !selectedDate) return;

    appointments.forEach((apt, index) => {
      if (index === editingRow) return;

      if (apt.doctor === selectedDoctor && apt.date === selectedDate) {
        disableOverlappingTimes(apt.time);
      }
    });
  }

  function disableOverlappingTimes(bookedTime) {
    const bookedMinutes = timeToMinutes(bookedTime);

    for (const opt of timeSelect.options) {
      if (!opt.value) continue;

      const optMinutes = timeToMinutes(opt.value);
      const timeDifference = Math.abs(optMinutes - bookedMinutes);

      if (timeDifference < 60) {
        opt.disabled = true;
        opt.style.color = "#ccc";
      }
    }
  }

  function renderTable() {
    tableBody.innerHTML = '';

    let data = getFilteredAppointments();
    data = sortAppointments(data);

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pageData = data.slice(startIndex, endIndex);

    pageData.forEach((appointment) => {
      const actualIndex = appointments.indexOf(appointment);
      const row = createTableRow(appointment, actualIndex);
      tableBody.appendChild(row);
    });

    updatePaginationUI(totalItems, startIndex, endIndex, totalPages);

    if (totalItems === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="10" style="text-align: center; padding: 30px; color: #999;">No appointments found</td>';
      tableBody.appendChild(emptyRow);
    }
  }

  function getFilteredAppointments() {
    let filtered = [...appointments];

    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(apt => {
        return (
          apt.petName.toLowerCase().includes(searchTerm) ||
          apt.breed.toLowerCase().includes(searchTerm) ||
          apt.owner.toLowerCase().includes(searchTerm) ||
          apt.doctor.toLowerCase().includes(searchTerm) ||
          apt.service.toLowerCase().includes(searchTerm) ||
          apt.notes.toLowerCase().includes(searchTerm)
        );
      });
    }

    const activeFilter = document.querySelector(".filter-btn.active");
    const statusFilter = activeFilter?.dataset.status?.toLowerCase() || 'all';
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status.toLowerCase() === statusFilter);
    }

    return filtered;
  }

  function sortAppointments(data) {
    return data.sort((a, b) => {
      let aVal, bVal;

      if (sortColumn === 'date') {
        aVal = new Date(`${a.date}T${a.time}`);
        bVal = new Date(`${b.date}T${b.time}`);
      } else if (sortColumn === 'time') {
        aVal = timeToMinutes(a.time);
        bVal = timeToMinutes(b.time);
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  function createTableRow(appointment, index) {
    const row = document.createElement("tr");
    row.dataset.index = index;
    
    row.innerHTML = `
      <td>${appointment.petName}</td>
      <td>${appointment.breed}</td>
      <td>${appointment.owner}</td>
      <td>${appointment.doctor}</td>
      <td>${appointment.service}</td>
      <td>${appointment.date}</td>
      <td>${appointment.time}</td>
      <td>
        <select class="status-dropdown">
          <option value="Pending" ${appointment.status === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Confirmed" ${appointment.status === "Confirmed" ? "selected" : ""}>Confirmed</option>
          <option value="Completed" ${appointment.status === "Completed" ? "selected" : ""}>Completed</option>
          <option value="Cancelled" ${appointment.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
        </select>
      </td>
      <td>${appointment.notes || ''}</td>
      <td><button class="btn edit-btn">Edit</button></td>
    `;

    const statusDropdown = row.querySelector(".status-dropdown");
    const editBtn = row.querySelector(".edit-btn");

    if (appointment.status !== "Pending") {
      editBtn.style.display = "none";
      if (appointment.status === "Completed" || appointment.status === "Cancelled") {
        statusDropdown.disabled = true;
      }
    }

    attachStatusChangeWithIndex(statusDropdown, editBtn, index);
    editBtn.addEventListener("click", () => handleEditWithIndex(index));

    return row;
  }

  function updatePaginationUI(totalItems, startIndex, endIndex, totalPages) {
    document.getElementById("showingStart").textContent = totalItems > 0 ? startIndex + 1 : 0;
    document.getElementById("showingEnd").textContent = endIndex;
    document.getElementById("totalRecords").textContent = totalItems;

    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled = currentPage === totalPages || totalPages === 0;

    renderPageNumbers(totalPages);
  }

  function renderPageNumbers(totalPages) {
    const pageNumbersDiv = document.getElementById("pageNumbers");
    pageNumbersDiv.innerHTML = '';

    if (totalPages <= 1) return;

    const maxVisible = 7;
    let pages = [];

    if (totalPages <= maxVisible) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      if (currentPage <= 3) {
        pages = [1, 2, 3, 4, '...', totalPages];
      } else if (currentPage >= totalPages - 2) {
        pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
      }
    }

    pages.forEach(page => {
      const pageBtn = document.createElement('div');
      if (page === '...') {
        pageBtn.className = 'page-number ellipsis';
        pageBtn.textContent = '...';
      } else {
        pageBtn.className = 'page-number';
        if (page === currentPage) {
          pageBtn.classList.add('active');
        }
        pageBtn.textContent = page;
        pageBtn.addEventListener('click', () => {
          currentPage = page;
          renderTable();
        });
      }
      pageNumbersDiv.appendChild(pageBtn);
    });
  }

  function addRow(appointment) {
    appointments.push(appointment);
  }

  function updateRow(row, appointment) {
    const index = parseInt(row.dataset.index);
    if (index >= 0 && appointments[index]) {
      Object.assign(appointments[index], appointment);
    }
  }

  function handleEditWithIndex(index) {
    const appointment = appointments[index];
    if (!appointment) return;

    if (appointment.status !== "Pending") {
      alert("Only appointments with 'Pending' status can be edited.");
      return;
    }

    editingRow = index; 
    openModal("Edit Appointment", appointment);
  }

  function attachStatusChangeWithIndex(dropdown, editBtn, index) {
    updateDropdownColor(dropdown);

    dropdown.addEventListener("change", () => {
      const newStatus = dropdown.value;

      if (newStatus === "Cancelled" || newStatus === "Completed") {
        const confirmAction = confirm("Are you sure you want to confirm this action? This cannot be undone.");
        if (!confirmAction) {
          dropdown.value = appointments[index].status;
          updateDropdownColor(dropdown);
          return;
        }
      }

      appointments[index].status = newStatus;

      if (newStatus === "Pending") {
        editBtn.style.display = "inline-block";
      } else {
        editBtn.style.display = "none";
      }

      if (newStatus === "Cancelled" || newStatus === "Completed") {
        dropdown.disabled = true;
      }

      updateDropdownColor(dropdown);
      updateSummaryCards();
    });
  }

  function updateDropdownColor(dropdown) {
    const status = dropdown.value;
    let bg = "";

    switch (status) {
      case "Pending":
        bg = "#ffb74d";
        break;
      case "Confirmed":
        bg = "#4caf50";
        break;
      case "Completed":
        bg = "#2196f3";
        break;
      case "Cancelled":
        bg = "#f44336";
        break;
      default:
        bg = "gray";
    }

    dropdown.style.backgroundColor = bg;
    dropdown.style.color = "white";
  }

  function updateSummaryCards() {
    let total = appointments.length;
    let pending = 0;
    let confirmed = 0;
    let cancelled = 0;

    appointments.forEach(apt => {
      if (apt.status === "Pending") pending++;
      if (apt.status === "Confirmed") confirmed++;
      if (apt.status === "Cancelled") cancelled++;
    });

    document.getElementById("totalAppointments").textContent = total;
    document.getElementById("pendingAppointments").textContent = pending;
    document.getElementById("confirmedAppointments").textContent = confirmed;
    document.getElementById("cancelledAppointments").textContent = cancelled;
  }

  function handleFilter(btn, filterButtons) {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }

  function capitalizeWords(text) {
    return text.replace(/\b\w/g, char => char.toUpperCase());
  }
});
