<?php
// Incluye el archivo de conexión a la base de datos
require_once 'db_connect.php';

// Establece el tipo de contenido de la respuesta como JSON
header('Content-Type: application/json');

try {
    // Obtiene los datos enviados en la solicitud
    $data = json_decode(file_get_contents('php://input'), true);

    // Verifica si se proporcionó un ID de ticket
    if (!isset($data['ticket_id'])) {
        throw new Exception('ID de ticket no proporcionado');
    }

    // Convierte el ID de ticket a entero
    $ticket_id = intval($data['ticket_id']);

    // Consulta SQL para obtener la información del ticket
    $query = "SELECT r.id, m.title, s.date, s.time, s.room, r.seat_number, r.validated 
              FROM reservations r
              JOIN movies m ON r.movie_id = m.id
              JOIN schedules s ON m.id = s.movie_id
              WHERE r.id = ?";
    
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param('i', $ticket_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Ticket no válido o no encontrado'
        ]);
    } else {
        $ticket_info = $result->fetch_assoc();
    
        if ($ticket_info['validated']) {
            echo json_encode([
                'success' => true,
                'message' => 'Ticket válido, pero ya ha sido validado anteriormente',
                'ticket_info' => $ticket_info
            ]);
        } else {
            // Marcar el ticket como validado
            $update_query = "UPDATE reservations SET validated = 1 WHERE id = ?";
            $update_stmt = $mysqli->prepare($update_query);
            $update_stmt->bind_param('i', $ticket_id);
            $update_stmt->execute();
        
            $ticket_info['validated'] = true;
        
            echo json_encode([
                'success' => true,
                'message' => 'Ticket válido y marcado como validado',
                'ticket_info' => $ticket_info
            ]);
        }
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al validar el ticket: ' . $e->getMessage()
    ]);
}

// Cierra la declaración preparada si existe
if (isset($stmt)) {
    $stmt->close();
}
if (isset($update_stmt)) {
    $update_stmt->close();
}
// Cierra la conexión a la base de datos
$mysqli->close();

