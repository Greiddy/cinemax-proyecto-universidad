<?php
// Incluye el archivo de conexión a la base de datos
require_once 'db_connect.php';

// Establece el tipo de contenido de la respuesta como JSON
header('Content-Type: application/json');

try {
    // Obtiene los datos enviados en la solicitud
    $data = json_decode(file_get_contents('php://input'), true);

    // Verifica si se proporcionó un ID de película
    if (!isset($data['movie_id'])) {
        throw new Exception('ID de película no proporcionado');
    }

    // Convierte el ID de película a entero
    $movie_id = intval($data['movie_id']);

    // Inicia una transacción
    $mysqli->begin_transaction();

    // Elimina las reservaciones asociadas a la película
    $query = "DELETE FROM reservations WHERE movie_id = ?";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param('i', $movie_id);
    $stmt->execute();

    // Elimina los horarios asociados a la película
    $query = "DELETE FROM schedules WHERE movie_id = ?";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param('i', $movie_id);
    $stmt->execute();

    // Elimina la película
    $query = "DELETE FROM movies WHERE id = ?";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param('i', $movie_id);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        throw new Exception("No se encontró la película especificada");
    }

    // Confirma la transacción
    $mysqli->commit();
    echo json_encode([
        'success' => true,
        'message' => 'Película eliminada con éxito'
    ]);

} catch (Exception $e) {
    // Si ocurre algún error, revierte la transacción
    if (isset($mysqli)) {
        $mysqli->rollback();
    }
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

