<?php
// Incluye el archivo de conexión a la base de datos
require_once 'db_connect.php';

// Establece el tipo de contenido de la respuesta como JSON
header('Content-Type: application/json');

try {
    // Verifica si se proporcionó un ID de película
    if (!isset($_GET['movie_id'])) {
        throw new Exception('ID de película no proporcionado');
    }

    // Convierte el ID de película a entero
    $movie_id = intval($_GET['movie_id']);
    
    // Verifica si el ID de película es válido
    if ($movie_id <= 0) {
        throw new Exception('ID de película inválido');
    }

    // Prepara la consulta SQL para obtener los asientos reservados
    $query = "SELECT id, seat_number FROM reservations WHERE movie_id = ?";
    $stmt = $mysqli->prepare($query);
    if (!$stmt) {
        throw new Exception('Error al preparar la consulta: ' . $mysqli->error);
    }
    
    // Vincula el parámetro a la consulta
    $stmt->bind_param('i', $movie_id);
    
    // Ejecuta la consulta
    if (!$stmt->execute()) {
        throw new Exception('Error al ejecutar la consulta: ' . $stmt->error);
    }
    
    // Obtiene el resultado de la consulta
    $result = $stmt->get_result();
    $reserved_seats = [];
    
    // Recorre cada fila del resultado
    while ($row = $result->fetch_assoc()) {
        $reserved_seats[] = [
            'id' => intval($row['id']),
            'seat_number' => intval($row['seat_number'])
        ];
    }

    // Devuelve los asientos reservados en formato JSON
    echo json_encode([
        'success' => true,
        'reserved_seats' => $reserved_seats
    ]);

} catch (Exception $e) {
    // Registra el error en el log del servidor
    error_log('Error en get_seats.php: ' . $e->getMessage());
    // Devuelve un mensaje de error en formato JSON
    echo json_encode([
        'success' => false,
        'message' => 'Error al cargar los asientos: ' . $e->getMessage()
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

