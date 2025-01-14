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

    // Prepara la consulta SQL para eliminar todas las reservas de la película
    $query = "DELETE FROM reservations WHERE movie_id = ?";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param('i', $movie_id);

    // Ejecuta la consulta
    if (!$stmt->execute()) {
        throw new Exception("Error al eliminar las reservas");
    }

    // Confirma la transacción
    $mysqli->commit();
    
    // Devuelve un mensaje de éxito en formato JSON
    echo json_encode([
        'success' => true,
        'message' => 'Todas las reservas para esta película han sido eliminadas'
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

