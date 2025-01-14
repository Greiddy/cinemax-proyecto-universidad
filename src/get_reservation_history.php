<?php
// Incluye el archivo de conexión a la base de datos
require_once 'db_connect.php';

// Establece el tipo de contenido de la respuesta como JSON
header('Content-Type: application/json');

try {
    // Consulta SQL para obtener el historial de reservas
    $query = "SELECT r.id, r.reserved_at, m.title as movie_title, s.room, s.date as show_date, s.time as show_time, 
              GROUP_CONCAT(CONCAT(CHAR(64 + ((r.seat_number - 1) DIV 10) + 1), ((r.seat_number - 1) % 10) + 1) ORDER BY r.seat_number ASC SEPARATOR ',') as seats
              FROM reservations r
              JOIN movies m ON r.movie_id = m.id
              JOIN schedules s ON m.id = s.movie_id
              GROUP BY r.id, r.reserved_at, m.title, s.room, s.date, s.time
              ORDER BY r.reserved_at DESC";
    
    $result = $mysqli->query($query);
    
    if (!$result) {
        throw new Exception("Error en la consulta: " . $mysqli->error);
    }
    
    $reservations = [];
    while ($row = $result->fetch_assoc()) {
        $reservations[] = [
            'id' => $row['id'],
            'reservation_date' => $row['reserved_at'],
            'movie_title' => $row['movie_title'],
            'room' => $row['room'],
            'show_date' => $row['show_date'],
            'show_time' => $row['show_time'],
            'seats' => $row['seats']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'reservations' => $reservations
    ]);

} catch (Exception $e) {
    error_log('Error en get_reservation_history.php: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error al cargar el historial de reservas: ' . $e->getMessage()
    ]);
}

// Cierra la conexión a la base de datos
$mysqli->close();

