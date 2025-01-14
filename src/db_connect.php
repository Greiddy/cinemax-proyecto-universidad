<?php
// Configuración de encabezados para permitir solicitudes CORS y especificar el tipo de contenido
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de la conexión a la base de datos
$host = 'localhost';
$db   = 'cinema_db';
$user = 'root'; // Cambia esto por tu usuario de MySQL
$pass = ''; // Cambia esto por tu contraseña de MySQL

try {
    // Intenta establecer una conexión con la base de datos
    $mysqli = new mysqli($host, $user, $pass, $db);
    
    // Verifica si hay algún error en la conexión
    if ($mysqli->connect_error) {
        throw new Exception("Error de conexión: " . $mysqli->connect_error);
    }
    
    // Establece el conjunto de caracteres a utf8mb4 para soportar emojis y caracteres especiales
    $mysqli->set_charset("utf8mb4");
    
} catch (Exception $e) {
    // Si ocurre algún error, termina la ejecución y devuelve un mensaje de error en formato JSON
    die(json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]));
}

