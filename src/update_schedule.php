<?php
// Incluye el archivo de conexión a la base de datos
require_once 'db_connect.php';

// Establece el tipo de contenido de la respuesta como JSON
header('Content-Type: application/json');

try {
    // Obtiene los datos enviados en la solicitud
    $data = json_decode(file_get_contents('php://input'), true);

    // Verifica si se proporcionaron los datos necesarios
    if (!isset($data['schedule_id']) || (!isset($data['new_date']) && !isset($data['new_time']))) {
        throw new Exception('Faltan datos requeridos');
    }

    // Convierte el ID del horario a entero
    $schedule_id = intval($data['schedule_id']);
    $new_date = isset($data['new_date']) ? $data['new_date'] : null;
    $new_time = isset($data['new_time']) ? $data['new_time'] : null;

    // Valida el formato de la fecha y hora si están presentes
    if ($new_date !== null && !preg_match("/^\d{4}-\d{2}-\d{2}$/", $new_date)) {
        throw new Exception('Formato de fecha inválido. Use YYYY-MM-DD');
    }

    if ($new_time !== null && !preg_match("/^(?:2[0-3]|[01][0-9]):[0-5][0-9]$/", $new_time)) {
        throw new Exception('Formato de hora inválido. Use HH:MM');
    }

    // Construye la consulta SQL dinámicamente basada en los campos proporcionados
    $query = "UPDATE schedules SET ";
    $params = array();
    $types = "";

    if ($new_date !== null) {
        $query .= "date = ?, ";
        $params[] = $new_date;
        $types .= "s";
    }

    if ($new_time !== null) {
        $query .= "time = ?, ";
        $params[] = $new_time;
        $types .= "s";
    }

    // Elimina la coma final y agrega la cláusula WHERE
    $query = rtrim($query, ", ") . " WHERE id = ?";
    $params[] = $schedule_id;
    $types .= "i";

    $stmt = $mysqli->prepare($query);
    $stmt->bind_param($types, ...$params);

    if (!$stmt->execute()) {
        throw new Exception("Error al actualizar el horario: " . $mysqli->error);
    }

    if ($stmt->affected_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Horario actualizado exitosamente'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No se realizaron cambios en el horario'
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

// Cierra la declaración preparada si existe
if (isset($stmt)) {
    $stmt->close();
}
// Cierra la conexión a la base de datos
$mysqli->close();
