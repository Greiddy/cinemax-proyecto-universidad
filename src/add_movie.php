<?php
// Incluye el archivo de conexión a la base de datos
require_once 'db_connect.php';

// Establece el tipo de contenido de la respuesta como JSON
header('Content-Type: application/json');

try {
    // Obtiene los datos enviados en la solicitud
    $data = json_decode(file_get_contents('php://input'), true);

    // Verifica si se proporcionaron todos los datos necesarios
    if (!isset($data['title']) || !isset($data['release_date']) || !isset($data['min_age']) || !isset($data['showtime']) || !isset($data['room']) || !isset($data['show_date'])) {
        throw new Exception('Faltan datos requeridos');
    }

    // Configura la zona horaria a la de Venezuela
    date_default_timezone_set('America/Caracas');

    // Inicia una transacción
    $mysqli->begin_transaction();

    // Prepara la consulta SQL para insertar la película
    $query = "INSERT INTO movies (title, release_date, min_age) VALUES (?, ?, ?)";
    $stmt = $mysqli->prepare($query);
    
    // Convierte la fecha de estreno al formato Y-m-d
    $release_date = date('Y-m-d', strtotime($data['release_date']));
    
    // Vincula los parámetros a la consulta
    $stmt->bind_param('ssi', $data['title'], $release_date, $data['min_age']);
    
    // Ejecuta la consulta
    if (!$stmt->execute()) {
        throw new Exception("Error al crear la película: " . $mysqli->error);
    }

    // Obtiene el ID de la película recién insertada
    $movie_id = $mysqli->insert_id;

    // Prepara la consulta SQL para insertar el horario
    $query = "INSERT INTO schedules (movie_id, date, time, room) VALUES (?, ?, ?, ?)";
    $stmt = $mysqli->prepare($query);
    
    // Convierte la fecha de la función al formato Y-m-d
    $show_date = date('Y-m-d', strtotime($data['show_date']));
    
    // Vincula los parámetros a la consulta
    $stmt->bind_param('isss', $movie_id, $show_date, $data['showtime'], $data['room']);
    
    // Ejecuta la consulta
    if (!$stmt->execute()) {
        throw new Exception("Error al crear el horario: " . $mysqli->error);
    }

    // Confirma la transacción
    $mysqli->commit();
    
    // Devuelve un mensaje de éxito en formato JSON
    echo json_encode([
        'success' => true,
        'message' => 'Película añadida exitosamente',
        'movie_id' => $movie_id,
        'show_date' => $show_date,
        'showtime' => $data['showtime']
    ]);

} catch (Exception $e) {
    // Si ocurre algún error, revierte la transacción
    if (isset($mysqli)) {
        $mysqli->rollback();
    }
    // Devuelve un mensaje de error en formato JSON
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
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

