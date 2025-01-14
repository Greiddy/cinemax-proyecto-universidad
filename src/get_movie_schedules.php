<?php
// Incluye el archivo de conexión a la base de datos
require_once 'db_connect.php';

// Establece el tipo de contenido de la respuesta como JSON
header('Content-Type: application/json');

try {
    // Consulta SQL para obtener los horarios de las películas
    $query = "SELECT m.id, m.title as movie_title, DATE_FORMAT(m.release_date, '%Y-%m-%d') as release_date, 
              DATE_FORMAT(s.date, '%Y-%m-%d') as show_date, s.time, s.room 
              FROM schedules s
              JOIN movies m ON s.movie_id = m.id
              ORDER BY s.date, s.time";
    
    // Ejecuta la consulta
    $result = $mysqli->query($query);
    
    // Verifica si la consulta se ejecutó correctamente
    if (!$result) {
        throw new Exception("Error en la consulta: " . $mysqli->error);
    }
    
    // Array para almacenar los horarios
    $schedules = [];
    // Recorre cada fila del resultado
    while ($row = $result->fetch_assoc()) {
        $schedules[] = [
            'id' => $row['id'],
            'movie_title' => $row['movie_title'],
            'release_date' => $row['release_date'], // Ya está formateado en la consulta SQL
            'show_date' => $row['show_date'], // Ya está formateado en la consulta SQL
            'time' => $row['time'],
            'room' => $row['room']
        ];
    }
    
    // Devuelve los horarios en formato JSON
    echo json_encode([
        'success' => true,
        'schedules' => $schedules
    ]);

} catch (Exception $e) {
    // Registra el error en el log del servidor
    error_log('Error en get_movie_schedules.php: ' . $e->getMessage());
    // Devuelve un mensaje de error en formato JSON
    echo json_encode([
        'success' => false,
        'message' => 'Error al cargar los horarios de películas: ' . $e->getMessage()
    ]);
}

// Cierra la conexión a la base de datos
$mysqli->close();

