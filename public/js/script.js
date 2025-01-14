// Este script se ejecuta cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Selección de elementos del DOM
    const sidebar = document.querySelector('.sidebar');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainContent = document.querySelector('.main-content');

    // Creación del overlay para el sidebar móvil
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    // Función para alternar la visibilidad del sidebar
    function toggleSidebar(event) {
        if (event) {
            event.stopPropagation();
        }
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.classList.toggle('sidebar-open');
    }

    // Event listener para el botón de menú móvil
    mobileMenuToggle.addEventListener('click', toggleSidebar);

    // Cerrar el sidebar al hacer clic en el overlay
    overlay.addEventListener('click', toggleSidebar);

    // Prevenir que clics fuera del botón abran el sidebar
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('active') && !sidebar.contains(e.target) && e.target !== mobileMenuToggle) {
            toggleSidebar();
        }
    });

    // Cerrar sidebar al hacer clic en un enlace (en móvil)
    const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    });

    // Selección de elementos adicionales del DOM
    const movieSelect = document.getElementById('movie');
    const seatsContainer = document.getElementById('seats');
    const reserveBtn = document.getElementById('reserveBtn');
    const endMovieBtn = document.getElementById('endMovieBtn');
    const reservationsLink = document.getElementById('reservations-link');
    const historyLink = document.getElementById('history-link');
    const schedulesLink = document.getElementById('schedules-link');
    const reservationsContent = document.getElementById('reservations-content');
    const historyContent = document.getElementById('history-content');
    const schedulesContent = document.getElementById('schedules-content');
    const reservationHistory = document.getElementById('reservation-history');
    const movieSchedules = document.getElementById('movie-schedules');
    const addMovieLink = document.getElementById('add-movie-link');
    const addMovieContent = document.getElementById('add-movie-content');
    const addMovieForm = document.getElementById('add-movie-form');
    const movieList = document.getElementById('movie-list');
    let selectedMovie = null;
    let currentReservationId = null;
    const modal = new Modal();

    const validateTicketLink = document.getElementById('validate-ticket-link');
    const validateTicketContent = document.getElementById('validate-ticket-content');
    const validateTicketForm = document.getElementById('validate-ticket-form');
    const validationResult = document.getElementById('validation-result');

    // Función para mostrar errores
    function showError(message) {
        console.error('Error:', message);
        modal.showError(`Error: ${message}. Por favor, intenta de nuevo o contacta al soporte técnico si el problema persiste.`);
    }

    // Función para mostrar el indicador de carga
    function showLoading() {
        seatsContainer.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Cargando asientos...</p>
            </div>
        `;
    }

    // Función para actualizar el contador de asientos seleccionados
    function updateSelectedCount() {
        const selectedSeats = document.querySelectorAll('.seat.selected');
        const validSelectedSeats = Array.from(selectedSeats).filter(seat => 
            seat.getAttribute('data-seat-number') && 
            parseInt(seat.getAttribute('data-seat-number')) > 0
        );
        const count = validSelectedSeats.length;
        
        reserveBtn.textContent = `Reservar ${count} asiento${count !== 1 ? 's' : ''}`;
        reserveBtn.disabled = count === 0;
    }

    // Función para cargar las películas
    async function loadMovies() {
        try {
            const response = await fetch('../src/get_movies.php');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            if (data.success) {
                movieSelect.innerHTML = '<option value="">Selecciona una película</option>';
                movieList.innerHTML = '';
                
                data.movies.forEach(movie => {
                    const option = document.createElement('option');
                    option.value = movie.id;
                    option.textContent = `${movie.title} (${movie.release_date})`;
                    movieSelect.appendChild(option);

                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        ${movie.title} (${movie.release_date})
                        <button class="delete-movie-btn" data-movie-id="${movie.id}">Eliminar</button>
                    `;
                    movieList.appendChild(listItem);
                });

                if (data.movies.length === 0) {
                    showError('No hay películas disponibles');
                }
            } else {
                throw new Error(data.message || 'Error al cargar las películas');
            }
        } catch (error) {
            showError('Error al cargar las películas: ' + error.message);
        }
    }

    // Función para cargar los asientos
    async function loadSeats(movieId) {
        try {
            showLoading();
            const response = await fetch(`../src/get_seats.php?movie_id=${movieId}`);
            const text = await response.text();
        
            let data;
            try {
                data = JSON.parse(text);
            } catch (error) {
                console.error('Error al parsear JSON:', text);
                throw new Error('La respuesta del servidor no es un JSON válido');
            }

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            if (data.success) {
                renderSeats(data.reserved_seats || []);
            } else {
                throw new Error(data.message || 'Error al cargar los asientos');
            }
        } catch (error) {
            console.error('Error completo:', error);
            showError('Error al cargar los asientos: ' + error.message);
        }
    }

    // Función para generar un código QR
    async function generateQRCode(reservationData) {
        const qrData = JSON.stringify(reservationData);
        const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`);
        return response.url;
    }

    // Función para renderizar los asientos
    function renderSeats(reservedSeats) {
        seatsContainer.innerHTML = '';
        
        const seatsGrid = document.createElement('div');
        seatsGrid.className = 'seats-grid';
        
        for (let row = 0; row < 5; row++) {
            const rowElement = document.createElement('div');
            rowElement.className = 'seat-row';
            
            const rowLabel = document.createElement('div');
            rowLabel.className = 'row-label';
            const rowLetter = String.fromCharCode(65 + row);
            rowLabel.textContent = rowLetter;
            rowElement.appendChild(rowLabel);
            
            for (let col = 1; col <= 10; col++) {
                const seatNumber = (row * 10) + col;
                
                const seat = document.createElement('div');
                seat.className = 'seat';
                
                seat.setAttribute('data-row', rowLetter);
                seat.setAttribute('data-col', col.toString());
                seat.setAttribute('data-seat-number', seatNumber.toString());
                
                seat.textContent = col.toString();
                
                if (reservedSeats.some(rs => rs.seat_number === seatNumber)) {
                    seat.classList.add('occupied');
                    seat.title = 'Asiento ocupado - Clic para cancelar';
                    const reservation = reservedSeats.find(rs => rs.seat_number === seatNumber);
                    seat.setAttribute('data-reservation-id', reservation.id);
                } else {
                    seat.classList.add('available');
                    seat.title = `Fila ${rowLetter}, Asiento ${col}`;
                }
                
                rowElement.appendChild(seat);
            }
            
            seatsGrid.appendChild(rowElement);
        }
        
        seatsContainer.appendChild(seatsGrid);
        updateSelectedCount();
    }

    // Event listener para el selector de películas
    movieSelect.addEventListener('change', (e) => {
        selectedMovie = e.target.value;
        if (selectedMovie) {
            loadSeats(selectedMovie);
            endMovieBtn.disabled = false;
        } else {
            seatsContainer.innerHTML = '';
            reserveBtn.disabled = true;
            endMovieBtn.disabled = true;
        }
    });

    // Event listener para el contenedor de asientos
    seatsContainer.addEventListener('click', (e) => {
        const seat = e.target.closest('.seat');
        if (!selectedMovie) {
            modal.showError('Por favor, selecciona una película primero');
            return;
        }
        
        if (seat && seat.classList.contains('occupied')) {
            const reservationId = seat.getAttribute('data-reservation-id');
            modal.showConfirm(
                '¿Deseas cancelar esta reserva?',
                () => cancelReservation(reservationId)
            );
        } else if (seat && !seat.classList.contains('occupied')) {
            seat.classList.toggle('selected');
            seat.classList.toggle('available');
            updateSelectedCount();
        }
    });

    // Event listener para el botón de reserva
    reserveBtn.addEventListener('click', async () => {
        const selectedSeats = document.querySelectorAll('.seat.selected');
        if (selectedSeats.length === 0) {
            modal.showError('Por favor, selecciona al menos un asiento.');
            return;
        }

        const seats = Array.from(selectedSeats)
            .map(seat => {
                const seatNumber = parseInt(seat.getAttribute('data-seat-number'));
                const row = seat.getAttribute('data-row');
                const col = parseInt(seat.getAttribute('data-col'));

                if (!seatNumber || isNaN(seatNumber) || seatNumber <= 0 || !row || !col) {
                    console.error('Datos de asiento inválidos:', { seatNumber, row, col });
                    return null;
                }

                return { number: seatNumber, row, col };
            })
            .filter(seat => seat !== null);

        if (seats.length === 0) {
            modal.showError('Error en los datos de los asientos seleccionados');
            return;
        }

        const seatsList = seats.map(seat => 
            `Fila ${seat.row}, Asiento ${seat.col}`
        ).join('\n');

        modal.showConfirm(
            `¿Deseas reservar los siguientes asientos?\n\n${seatsList}`,
            async () => {
                try {
                    const response = await fetch('../src/reserve.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            movie_id: selectedMovie,
                            seats: seats.map(seat => seat.number)
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();

                    if (data.success) {
                        if (data.is_late_reservation) {
                            const continueReservation = await new Promise(resolve => {
                                modal.showConfirm(
                                    'La función ya ha comenzado. ¿Desea realizar la reserva de todos modos?',
                                    () => resolve(true),
                                    () => resolve(false)
                                );
                            });
                            
                            if (!continueReservation) {
                                return;
                            }
                        }
                        currentReservationId = data.reservation_id;
                        const purchaseDate = new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' });
                        const tickets = await Promise.all(seats.map(async (seat) => {
                            const reservationData = {
                                id: data.reservation_id,
                                movie: data.movie_info.title,
                                seat: `${seat.row}${seat.col}`,
                                room: data.movie_info.room,
                                showtime: data.movie_info.time,
                                showDate: formatDate(data.movie_info.date), 
                                purchaseDate: purchaseDate
                            };
                            const qrCodeUrl = await generateQRCode(reservationData);
                            return {
                                seat: `Fila ${seat.row}, Asiento ${seat.col}`,
                                qrCode: qrCodeUrl,
                                room: data.movie_info.room,
                                showtime: data.movie_info.time,
                                showDate: formatDate(data.movie_info.date),
                                purchaseDate: purchaseDate
                            };
                        }));
                        modal.showSuccess(
                            '¡Reserva exitosa!',
                            () => loadSeats(selectedMovie),
                            {
                                reservationId: data.reservation_id,
                                movieTitle: data.movie_info.title,
                                tickets: tickets
                            }
                        );
                    } else {
                        throw new Error(data.message || 'Error desconocido en la reserva');
                    }
                } catch (error) {
                    console.error('Error completo:', error);
                    modal.showError(`Error en la reserva: ${error.message}. Por favor, intenta de nuevo o contacta al soporte técnico.`);
                    await loadSeats(selectedMovie);
                }
            }
        );
    });

    // Función para cancelar una reserva
    async function cancelReservation(reservationId) {
        try {
            const response = await fetch('../src/remove_reservation.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reservation_id: reservationId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            if (data.success) {
                modal.showSuccess('Reserva cancelada con éxito', () => {
                    loadSeats(selectedMovie);
                });
            } else {
                throw new Error(data.message || 'Error al cancelar la reserva');
            }
        } catch (error) {
            modal.showError('Error al cancelar la reserva: ' + error.message);
        }
    }

    // Función para cargar el historial de reservas
    async function loadReservationHistory() {
        try {
            const response = await fetch('../src/get_reservation_history.php');
            const data = await response.json();

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            if (data.success) {
                renderReservationHistory(data.reservations);
            } else {
                throw new Error(data.message || 'Error al cargar el historial de reservas');
            }
        } catch (error) {
            console.error('Error completo:', error);
            showError('Error al cargar el historial de reservas: ' + error.message);
        }
    }

    // Función para renderizar el historial de reservas
    async function renderReservationHistory(reservations) {
        reservationHistory.innerHTML = '';
    
        if (reservations.length === 0) {
            reservationHistory.innerHTML = '<p>No hay reservas en el historial.</p>';
            return;
        }
    
        for (const reservation of reservations) {
            const reservationElement = document.createElement('div');
            reservationElement.className = 'reservation-item';
        
            const qrCodeUrl = await generateQRCode({
                id: reservation.id,
                movie: reservation.movie_title,
                seats: reservation.seats,
                room: reservation.room,
                showDate: reservation.show_date,
                showTime: reservation.show_time,
                purchaseDate: reservation.reservation_date
            });
        
            reservationElement.innerHTML = `
                <h3>${reservation.movie_title}</h3>
                <p><strong>ID de Reserva:</strong> ${reservation.id}</p>
                <p><strong>Fecha de Reserva:</strong> ${new Date(reservation.reservation_date).toLocaleString('es-VE', { timeZone: 'America/Caracas' })}</p>
                <p><strong>Sala:</strong> ${reservation.room}</p>
                <p><strong>Fecha de Función:</strong> ${formatDate(reservation.show_date)}</p>  
                <p><strong>Hora de Función:</strong> ${reservation.show_time}</p>
                <p><strong>Asientos:</strong> ${reservation.seats.split(',').map(seat => `Fila ${seat[0]}, Asiento ${seat.slice(1)}`).join('; ')}</p>
                <img src="${qrCodeUrl}" alt="QR Code" class="qr-code">
            `;
        
            reservationHistory.appendChild(reservationElement);
        }
    }

    // Función para cargar los horarios de películas
    async function loadMovieSchedules() {
        try {
            const response = await fetch('../src/get_movie_schedules.php');
            const data = await response.json();

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            if (data.success) {
                renderMovieSchedules(data.schedules);
            } else {
                throw new Error(data.message || 'Error al cargar los horarios de películas');
            }
        } catch (error) {
            showError('Error al cargar los horarios de películas: ' + error.message);
        }
    }

    // Función para formatear la fecha
    function formatDate(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    // Función para crear una celda editable
    function createEditableCell(value, type, scheduleId, field) {
        const cell = document.createElement('td');
        cell.textContent = value;
        cell.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = type;
            input.value = value;
            input.addEventListener('blur', () => updateSchedule(scheduleId, field, input.value));
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    updateSchedule(scheduleId, field, input.value);
                }
            });
            cell.textContent = '';
            cell.appendChild(input);
            input.focus();
        });
        return cell;
    }

    // Función para actualizar el horario
    async function updateSchedule(scheduleId, field, newValue) {
        try {
            const response = await fetch('../src/update_schedule.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    schedule_id: scheduleId,
                    new_date: field === 'date' ? newValue : undefined,
                    new_time: field === 'time' ? newValue : undefined,
                }),
            });

            const data = await response.json();

            if (data.success) {
                modal.showSuccess('Horario actualizado exitosamente');
                loadMovieSchedules();
            } else {
                throw new Error(data.message || 'Error al actualizar el horario');
            }
        } catch (error) {
            console.error('Error completo:', error);
        }
    }

    // Función para renderizar los horarios de películas
    function renderMovieSchedules(schedules) {
        console.log('Schedules received:', schedules);
        movieSchedules.innerHTML = '';

        if (schedules.length === 0) {
            movieSchedules.innerHTML = '<p>No hay horarios disponibles.</p>';
            return;
        }

        const scheduleTable = document.createElement('table');
        scheduleTable.className = 'schedule-table';
        scheduleTable.innerHTML = `
            <thead>
                <tr>
                    <th>Película</th>
                    <th>Fecha de Estreno</th>
                    <th>Fecha de Función</th>
                    <th>Hora</th>
                    <th>Sala</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;

        const tableBody = scheduleTable.querySelector('tbody');

        schedules.forEach(schedule => {
            console.log('Processing schedule:', schedule);
            const row = document.createElement('tr');
            row.appendChild(document.createElement('td')).textContent = schedule.movie_title;
            row.appendChild(document.createElement('td')).textContent = formatDate(schedule.release_date);
            row.appendChild(createEditableCell(formatDate(schedule.show_date), 'date', schedule.id, 'date'));
            row.appendChild(createEditableCell(schedule.time, 'time', schedule.id, 'time'));
            row.appendChild(document.createElement('td')).textContent = schedule.room;
            tableBody.appendChild(row);
        });

        movieSchedules.appendChild(scheduleTable);
    }

    // Event listener para el botón de finalizar película
    endMovieBtn.addEventListener('click', async () => {
        if (!selectedMovie) {
            modal.showError('Por favor, selecciona una película primero');
            return;
        }

        modal.showConfirm(
            '¿Estás seguro de que deseas eliminar todas las reservas para esta película?',
            async () => {
                try {
                    const response = await fetch('../src/end_movie.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ movie_id: selectedMovie }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    if (data.success) {
                        modal.showSuccess('Todas las reservas para esta película han sido eliminadas', () => {
                            loadSeats(selectedMovie);
                        });
                    } else {
                        throw new Error(data.message || 'Error al eliminar las reservas');
                    }
                } catch (error) {
                    modal.showError('Error al eliminar las reservas: ' + error.message);
                }
            }
        );
    });

    // Event listeners para los enlaces de navegación
    reservationsLink.addEventListener('click', (e) => {
        e.preventDefault();
        reservationsContent.style.display = 'block';
        historyContent.style.display = 'none';
        schedulesContent.style.display = 'none';
        addMovieContent.style.display = 'none';
        validateTicketContent.style.display = 'none';
        reservationsLink.classList.add('active');
        historyLink.classList.remove('active');
        schedulesLink.classList.remove('active');
        addMovieLink.classList.remove('active');
        validateTicketLink.classList.remove('active');
    });

    historyLink.addEventListener('click', (e) => {
        e.preventDefault();
        reservationsContent.style.display = 'none';
        historyContent.style.display = 'block';
        schedulesContent.style.display = 'none';
        addMovieContent.style.display = 'none';
        validateTicketContent.style.display = 'none';
        reservationsLink.classList.remove('active');
        historyLink.classList.add('active');
        schedulesLink.classList.remove('active');
        addMovieLink.classList.remove('active');
        validateTicketLink.classList.remove('active');
        loadReservationHistory();
    });

    schedulesLink.addEventListener('click', (e) => {
        e.preventDefault();
        reservationsContent.style.display = 'none';
        historyContent.style.display = 'none';
        schedulesContent.style.display = 'block';
        addMovieContent.style.display = 'none';
        validateTicketContent.style.display = 'none';
        reservationsLink.classList.remove('active');
        historyLink.classList.remove('active');
        schedulesLink.classList.add('active');
        addMovieLink.classList.remove('active');
        validateTicketLink.classList.remove('active');
        loadMovieSchedules();
    });

    addMovieLink.addEventListener('click', (e) => {
        e.preventDefault();
        reservationsContent.style.display = 'none';
        historyContent.style.display = 'none';
        schedulesContent.style.display = 'none';
        addMovieContent.style.display = 'block';
        validateTicketContent.style.display = 'none';
        reservationsLink.classList.remove('active');
        historyLink.classList.remove('active');
        schedulesLink.classList.remove('active');
        addMovieLink.classList.add('active');
        validateTicketLink.classList.remove('active');
        loadMovies();
    });

    validateTicketLink.addEventListener('click', (e) => {
        e.preventDefault();
        reservationsContent.style.display = 'none';
        historyContent.style.display = 'none';
        schedulesContent.style.display = 'none';
        addMovieContent.style.display = 'none';
        validateTicketContent.style.display = 'block';
        reservationsLink.classList.remove('active');
        historyLink.classList.remove('active');
        schedulesLink.classList.remove('active');
        addMovieLink.classList.remove('active');
        validateTicketLink.classList.add('active');
    });

    // Event listener para el formulario de añadir película
    addMovieForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const movieData = {
            title: document.getElementById('movie-title').value,
            release_date: document.getElementById('release-date').value,
            showtime: document.getElementById('showtime').value,
            min_age: parseInt(document.getElementById('min-age').value),
            room: document.getElementById('room').value,
            show_date: document.getElementById('show-date').value
        };

        console.log('Datos de la película a añadir:', movieData);

        try {
            const response = await fetch('../src/add_movie.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(movieData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            if (data.success) {
                console.log('Película añadida con éxito. Datos recibidos:', data);
                modal.showSuccess('Película añadida exitosamente', () => {
                    addMovieForm.reset();
                    loadMovies();
                    schedulesLink.click();
                });
            } else {
                throw new Error(data.message || 'Error al añadir la película');
            }
        } catch (error) {
            console.error('Error completo:', error);
            modal.showError('Error al añadir la película: ' + error.message);
        }
    });

    // Función para eliminar una película
    async function deleteMovie(movieId) {
        try {
            const response = await fetch('../src/delete_movie.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ movie_id: movieId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            if (data.success) {
                modal.showSuccess('Película eliminada con éxito', loadMovies);
            } else {
                throw new Error(data.message || 'Error al eliminar la película');
            }
        } catch (error) {
            modal.showError('Error al eliminar la película: ' + error.message);
        }
    }

    // Event listener para eliminar películas
    movieList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-movie-btn')) {
            const movieId = e.target.getAttribute('data-movie-id');
            modal.showConfirm(
                '¿Estás seguro de que deseas eliminar esta película? Esta acción no se puede deshacer.',
                () => deleteMovie(movieId)
            );
        }
    });

    // Función para validar un ticket
    async function validateTicket(ticketId) {
        try {
            const response = await fetch('../src/validate_ticket.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ticket_id: ticketId }),
            });

            const data = await response.json();

            if (data.success) {
                const ticketInfo = data.ticket_info;
                const seatRow = String.fromCharCode(65 + Math.floor((ticketInfo.seat_number - 1) / 10));
                const seatNumber = (ticketInfo.seat_number - 1) % 10 + 1;
            
                validationResult.innerHTML = `
                    <div class="valid-ticket">
                        <h3>Ticket Válido</h3>
                        <p><strong>Película:</strong> ${ticketInfo.title}</p>
                        <p><strong>Fecha:</strong> ${formatDate(ticketInfo.date)}</p>
                        <p><strong>Hora:</strong> ${ticketInfo.time}</p>
                        <p><strong>Sala:</strong> ${ticketInfo.room}</p>
                        <p><strong>Asiento:</strong> Fila ${seatRow}, Asiento ${seatNumber}</p>
                        <pstrong> Fila ${seatRow}, Asiento ${seatNumber}</p>
                        <p><strong>Estado:</strong> ${ticketInfo.validated ? 'Ya validado' : 'Recién validado'}</p>
                        <p class="validation-message">${data.message}</p>
                    </div>
                `;
            } else {
                validationResult.innerHTML = `
                    <div class="invalid-ticket">
                        <h3>Ticket No Válido</h3>
                        <p>${data.message}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error:', error);
            validationResult.innerHTML = `
                <div class="error">
                    <h3>Error</h3>
                    <p>Ocurrió un error al validar el ticket. Por favor, inténtelo de nuevo.</p>
                </div>
            `;
        }
    }

    // Event listener para el formulario de validación de tickets
    validateTicketForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ticketId = document.getElementById('ticket-id').value;
        await validateTicket(ticketId);
    });

    // Carga inicial de películas
    loadMovies();
    reserveBtn.disabled = true;
    endMovieBtn.disabled = true;
});

