<?php
// Incluye el archivo de conexión a la base de datos
require_once 'db_connect.php';

try {
    // Consulta SQL para obtener todas las películas ordenadas por fecha de estreno descendente
    $query = "SELECT id, title, release_date FROM movies ORDER BY release_date DESC";
    $result = $mysqli->query($query);
    
    // Verifica si la consulta se ejecutó correctamente
    if (!$result) {
        throw new Exception("Error en la consulta: " . $mysqli->error);
    }
    
    // Array para almacenar las películas
    $movies = [];
    // Recorre cada fila del resultado
    while ($row = $result->fetch_assoc()) {
        $movies[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'release_date' => date('d/m/Y', strtotime($row['release_date'])) // Formatea la fecha
        ];
    }
    
    // Devuelve las películas en formato JSON
    echo json_encode([
        'success' => true,
        'movies' => $movies
    ]);
    
} catch (Exception $e) {
    // Si ocurre algún error, devuelve un mensaje de error en formato JSON
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

// Cierra la conexión a la base de datos
$mysqli->close();

