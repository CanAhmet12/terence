<?php
header("Content-Type: application/json");
echo json_encode([
    "input_stream" => file_get_contents("php://input"),
    "post" => $_POST,
    "server_content_type" => $_SERVER["CONTENT_TYPE"] ?? "not set",
    "server_content_length" => $_SERVER["CONTENT_LENGTH"] ?? "not set",
    "request_method" => $_SERVER["REQUEST_METHOD"] ?? "not set",
]);