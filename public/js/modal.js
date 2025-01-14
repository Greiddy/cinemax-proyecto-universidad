// Clase Modal para manejar la creación y gestión de ventanas modales
class Modal {
    constructor() {
        this.modalContainer = null;
        this.init();
    }

    // Inicializa el contenedor modal si aún no existe
    init() {
        if (!this.modalContainer) {
            this.modalContainer = document.createElement('div');
            this.modalContainer.className = 'modal-container';
            document.body.appendChild(this.modalContainer);
        }
    }

    // Muestra un modal con el contenido y opciones especificadas
    show({ title, message, type = 'info', buttons = [], extraContent = null }) {
        const modal = document.createElement('div');
        modal.className = `modal modal-${type}`;
        
        // Construye el contenido HTML del modal
        const content = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${message}
                    ${extraContent ? extraContent : ''}
                </div>
                <div class="modal-footer">
                    ${buttons.map(btn => `
                        <button class="modal-button ${btn.class || ''}" data-action="${btn.action}">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        modal.innerHTML = content;
        this.modalContainer.appendChild(modal);

        // Agrega evento para cerrar el modal
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.close(modal));

        // Agrega eventos a los botones del modal
        buttons.forEach(btn => {
            const button = modal.querySelector(`[data-action="${btn.action}"]`);
            button.addEventListener('click', () => {
                if (btn.callback) btn.callback();
                this.close(modal);
            });
        });

        // Muestra el modal con una animación suave
        requestAnimationFrame(() => {
            modal.classList.add('modal-show');
        });
    }

    // Cierra el modal con una animación suave
    close(modal) {
        modal.classList.remove('modal-show');
        modal.addEventListener('transitionend', () => {
            modal.remove();
        });
    }

    // Muestra un modal de éxito, con opción de mostrar detalles de reserva
    showSuccess(message, callback, data = null) {
        let extraContent = '';
        if (data) {
            extraContent = `
                <div class="reservation-details">
                    <h4>Detalles de la Reserva</h4>
                    <p><strong>ID de Reserva:</strong> ${data.reservationId}</p>
                    <p><strong>Película:</strong> ${data.movieTitle}</p>
                    <div class="tickets-container">
                        ${data.tickets.map(ticket => `
                            <div class="ticket">
                                <p><strong>Asiento:</strong> ${ticket.seat}</p>
                                <p><strong>Sala:</strong> ${ticket.room}</p>
                                <p><strong>Fecha de función:</strong> ${new Date(ticket.showDate).toLocaleDateString()}</p>
                                <p><strong>Hora de función:</strong> ${ticket.showtime}</p>
                                <p><strong>Fecha de compra:</strong> ${ticket.purchaseDate}</p>
                                <div class="qr-code">
                                    <img src="${ticket.qrCode}" alt="QR Code para Reserva">
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="modal-button print-tickets">Imprimir Tickets</button>
                </div>
            `;
        }

        this.show({
            title: 'Éxito',
            message,
            type: 'success',
            buttons: [{
                text: 'Cerrar',
                action: 'close',
                class: 'success',
                callback
            }],
            extraContent
        });

        // Agrega evento para imprimir tickets si hay datos de reserva
        if (data) {
            const printBtn = this.modalContainer.querySelector('.print-tickets');
            printBtn.addEventListener('click', () => {
                this.printTickets(data);
            });
        }
    }

    // Muestra un modal de error
    showError(message, callback) {
        this.show({
            title: 'Error',
            message,
            type: 'error',
            buttons: [{
                text: 'Cerrar',
                action: 'close',
                class: 'error',
                callback
            }]
        });
    }

    // Muestra un modal de confirmación con opciones para confirmar o cancelar
    showConfirm(message, onConfirm, onCancel) {
        this.show({
            title: 'Confirmar',
            message,
            type: 'confirm',
            buttons: [
                {
                    text: 'Cancelar',
                    action: 'cancel',
                    class: 'secondary',
                    callback: onCancel
                },
                {
                    text: 'Confirmar',
                    action: 'confirm',
                    class: 'primary',
                    callback: onConfirm
                }
            ]
        });
    }

    // Abre una nueva ventana para imprimir los tickets
    printTickets(data) {
        const ticketWindow = window.open('', '_blank');
        ticketWindow.document.write(`
            <html>
            <head>
                <title>Tickets de Reserva</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .ticket { 
                        border: 2px solid #000; 
                        padding: 20px; 
                        max-width: 300px; 
                        margin: 20px auto; 
                        page-break-after: always; 
                    }
                    .qr-code { 
                        text-align: center; 
                        margin-top: 20px;
                    }
                    .qr-code img { 
                        max-width: 200px; 
                    }
                    .ticket-info {
                        margin-bottom: 15px;
                    }
                    .ticket-info p {
                        margin: 5px 0;
                    }
                </style>
            </head>
            <body>
                ${data.tickets.map(ticket => `
                    <div class="ticket">
                        <h2>Ticket de Reserva</h2>
                        <div class="ticket-info">
                            <p><strong>ID de Reserva:</strong> ${data.reservationId}</p>
                            <p><strong>Película:</strong> ${data.movieTitle}</p>
                            <p><strong>Asiento:</strong> ${ticket.seat}</p>
                            <p><strong>Sala:</strong> ${ticket.room}</p>
                            <p><strong>Fecha de función:</strong> ${new Date(ticket.showDate).toLocaleDateString()}</p>
                            <p><strong>Hora de función:</strong> ${ticket.showtime}</p>
                            <p><strong>Fecha de compra:</strong> ${ticket.purchaseDate}</p>
                        </div>
                        <div class="qr-code">
                            <img src="${ticket.qrCode}" alt="QR Code para Reserva">
                            <p>Muestra este QR code al ingresar al cine</p>
                        </div>
                    </div>
                `).join('')}
            </body>
            </html>
        `);
        ticketWindow.document.close();
        ticketWindow.print();
    }
}

