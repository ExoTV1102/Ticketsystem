document.addEventListener('DOMContentLoaded', () => {
    const fromSelect = document.getElementById('from-station');
    const toSelect = document.getElementById('to-station');
    const searchForm = document.getElementById('search-form');
    const resultsSection = document.getElementById('results-section');
    const resultsList = document.getElementById('results-list');
    const modal = document.getElementById('booking-modal');
    const closeModal = document.querySelector('.close-modal');
    const bookingForm = document.getElementById('booking-form');
    const modalDetails = document.getElementById('modal-connection-details');
    const bookingConnectionId = document.getElementById('booking-connection-id');
    const bookingsList = document.getElementById('bookings-list');

    // Fetch stations on load
    fetch('/api/stations')
        .then(res => res.json())
        .then(data => {
            if (data.message === 'success') {
                data.data.forEach(station => {
                    const option = document.createElement('option');
                    option.value = station.id;
                    option.textContent = station.name;
                    fromSelect.appendChild(option.cloneNode(true));
                    toSelect.appendChild(option);
                });
            }
        })
        .catch(err => console.error('Fehler beim Laden der Stationen:', err));

    // Load bookings
    loadBookings();

    function loadBookings() {
        fetch('/api/bookings')
            .then(res => res.json())
            .then(data => {
                if (data.message === 'success' && data.data.length > 0) {
                    bookingsList.innerHTML = '';
                    data.data.forEach(booking => {
                        const item = document.createElement('div');
                        item.className = 'result-item';
                        item.innerHTML = `
                            <div class="result-info">
                                <h4>${booking.from_station_name} nach ${booking.to_station_name}</h4>
                                <p>${booking.departure_time} - ${booking.arrival_time}</p>
                                <p style="font-size: 0.8rem; color: #818cf8;">Fahrgast: ${booking.passenger_name}</p>
                            </div>
                            <div style="display: flex; align-items: center;">
                                <span class="price-tag">€${booking.price.toFixed(2)}</span>
                            </div>
                        `;
                        bookingsList.appendChild(item);
                    });
                } else {
                    bookingsList.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Keine Tickets gefunden.</p>';
                }
            })
            .catch(err => console.error('Fehler beim Laden der Buchungen:', err));
    }

    // Handle search
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fromId = fromSelect.value;
        const toId = toSelect.value;

        if (fromId === toId) {
            alert("Start und Ziel dürfen nicht identisch sein.");
            return;
        }

        fetch(`/api/connections?from=${fromId}&to=${toId}`)
            .then(res => res.json())
            .then(data => {
                resultsList.innerHTML = '';
                if (data.message === 'success' && data.data.length > 0) {
                    resultsSection.classList.remove('hidden');
                    data.data.forEach(conn => {
                        const item = document.createElement('div');
                        item.className = 'result-item';
                        item.innerHTML = `
                            <div class="result-info">
                                <h4>${conn.departure_time} - ${conn.arrival_time}</h4>
                                <p>${conn.from_station_name} nach ${conn.to_station_name}</p>
                            </div>
                            <div style="display: flex; align-items: center;">
                                <span class="price-tag">€${conn.price.toFixed(2)}</span>
                                <button class="book-btn" data-id="${conn.id}" data-details="${conn.departure_time} ab ${conn.from_station_name}">Buchen</button>
                            </div>
                        `;
                        resultsList.appendChild(item);
                    });

                    // Add event listeners to new book buttons
                    document.querySelectorAll('.book-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const id = e.target.getAttribute('data-id');
                            const details = e.target.getAttribute('data-details');
                            openModal(id, details);
                        });
                    });
                } else {
                    resultsSection.classList.remove('hidden');
                    resultsList.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Keine Verbindungen gefunden.</p>';
                }
            })
            .catch(err => console.error('Fehler bei der Suche:', err));
    });

    // Modal logic
    function openModal(connectionId, details) {
        bookingConnectionId.value = connectionId;
        modalDetails.textContent = `Buchung für: ${details}`;
        modal.classList.remove('hidden');
    }

    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    const successModal = document.getElementById('success-modal');
    const successMessage = document.getElementById('success-message');
    const closeSuccessBtn = document.getElementById('close-success-btn');

    closeSuccessBtn.addEventListener('click', () => {
        successModal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.classList.add('hidden');
        }
    });

    // Handle booking
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const connectionId = bookingConnectionId.value;
        const passengerName = document.getElementById('passenger-name').value;

        fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                connection_id: connectionId,
                passenger_name: passengerName
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.message === 'success') {
                    modal.classList.add('hidden');
                    bookingForm.reset();

                    // Show success modal
                    successMessage.textContent = `Vielen Dank, ${passengerName}. Ihre Ticket-ID ist #${data.data.id}.`;
                    successModal.classList.remove('hidden');

                    loadBookings(); // Refresh bookings list
                } else {
                    alert('Buchung fehlgeschlagen: ' + data.error);
                }
            })
            .catch(err => console.error('Fehler bei der Buchung:', err));
    });
});
