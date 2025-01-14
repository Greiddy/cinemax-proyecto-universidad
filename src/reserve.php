<?php
// Configura la zona horaria a Venezuela
date_default_timezone_set('America/Caracas');

// Configura los encabezados CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Maneja las solicitudes OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Incluye el archivo de conexión a la base de datos
require_once 'db_connect.php';

// Configura la visualización de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Establece el tipo de contenido de la respuesta como JSON
header('Content-Type: application/json');

try {
    // Obtiene los datos enviados en la solicitud
    $data = json_decode(file_get_contents('php://input'), true);

    // Verifica si se proporcionaron todos los datos necesarios
    if (!isset($data['movie_id']) || !isset($data['seats']) || empty($data['seats'])) {
        throw new Exception('Datos de reserva incompletos');
    }

    // Convierte el ID de película y los números de asientos a enteros
    $movie_id = intval($data['movie_id']);
    $seats = array_map('intval', $data['seats']);

    // Obtiene información de la película y su horario
    $movie_query = "SELECT m.id, m.title, s.room, s.time, s.date 
                    FROM movies m 
                    JOIN schedules s ON m.id = s.movie_id 
                    WHERE m.id = ?";
    $stmt = $mysqli->prepare($movie_query);
    $stmt->bind_param('i', $movie_id);
    $stmt->execute();
    $movie_result = $stmt->get_result();

    if ($movie_result->num_rows === 0) {
        throw new Exception('Película no encontrada');
    }

    $movie_info = $movie_result->fetch_assoc();

    // Valida si la fecha de la función es anterior a la fecha actual
    $current_date = new DateTime('now', new DateTimeZone('America/Caracas'));
    $show_date = new DateTime($movie_info['date'] . ' ' . $movie_info['time'], new DateTimeZone('America/Caracas'));

    $is_late_reservation = false;
    if ($show_date < $current_date) {
        $is_late_reservation = true;
    }

    // Valida que los asientos estén en el rango correcto (1-50)
    foreach ($seats as $seat) {
        if (!is_numeric($seat) || $seat < 1 || $seat > 50) {
            throw new Exception("El asiento número $seat es inválido. Los asientos deben estar entre 1 y 50.");
        }
    }

    error_log("Datos recibidos: " . print_r($data, true));
    $mysqli->begin_transaction();

    // Verifica que los asientos no estén ya reservados
    $seat_list = implode(',', $seats);
    $query = "SELECT seat_number FROM reservations 
              WHERE movie_id = ? AND seat_number IN ($seat_list)";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param('i', $movie_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $reserved = [];
        while ($row = $result->fetch_assoc()) {
            $reserved[] = $row['seat_number'];
        }
        throw new Exception('Los siguientes asientos ya han sido reservados: ' . implode(', ', $reserved));
    }

    // Realiza la reserva
    $query = "INSERT INTO reservations (movie_id, seat_number) VALUES (?, ?)";
    $stmt = $mysqli->prepare($query);

    $reservation_id = null;
    foreach ($seats as $seat) {
        $stmt->bind_param('ii', $movie_id, $seat);
        if (!$stmt->execute()) {
            throw new Exception("Error al reservar el asiento $seat");
        }
        if (!$reservation_id) {
            $reservation_id = $mysqli->insert_id;
        }
    }
    
    $mysqli->commit();
    echo json_encode([
        'success' => true, 
        'message' => 'Reserva exitosa',
        'seats' => $seats,
        'reservation_id' => $reservation_id,
        'movie_info' => [
            'title' => $movie_info['title'],
            'room' => $movie_info['room'],
            'date' => date('d-m-Y', strtotime($movie_info['date'])),
            'time' => $movie_info['time']
        ],
        'is_late_reservation' => $is_late_reservation,
    ]);

} catch (Exception $e) {
    error_log("Error en reserve.php: " . $e->getMessage());
    if (isset($mysqli)) {
        $mysqli->rollback();
    }
    echo json_encode([
        'success' => false,
        'message' => 'Error en el servidor: ' . $e->getMessage()
    ]);
}

// Cierra la declaración preparada si existe
if (isset($stmt)) {
    $stmt->close();
}
// Cierra la conexión a la base de datos si existe
if (isset($mysqli)) {
    $mysqli->close();
}

