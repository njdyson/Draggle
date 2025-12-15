<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$db = getDb();
// Use a dedicated table name to avoid clashing with any legacy schema
$table = 'boards_app';

ensureBoardsTable($db, $table);

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? '';
        if (!$id) {
            respond(400, ['error' => 'Missing board id']);
        }
        $stmt = $db->prepare("SELECT data FROM {$table} WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            respond(404, ['error' => 'Board not found']);
        }
        $payload = json_decode($row['data'], true);
        respond(200, $payload ?: []);
        break;

    case 'POST':
        $payload = readJsonBody();
        $id = !empty($payload['boardId']) ? $payload['boardId'] : generateUuid();
        $payload['boardId'] = $id;
        persistBoard($db, $table, $id, $payload, false);
        respond(200, ['boardId' => $id]);
        break;

    case 'PUT':
        $id = $_GET['id'] ?? '';
        if (!$id) {
            respond(400, ['error' => 'Missing board id']);
        }
        $payload = readJsonBody();
        $payload['boardId'] = $id;
        persistBoard($db, $table, $id, $payload, true);
        respond(200, ['boardId' => $id]);
        break;
    case 'DELETE':
        $id = $_GET['id'] ?? '';
        if (!$id) {
            respond(400, ['error' => 'Missing board id']);
        }
        $stmt = $db->prepare("DELETE FROM {$table} WHERE id = :id");
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) {
            respond(404, ['error' => 'Board not found']);
        }
        respond(200, ['deleted' => true, 'boardId' => $id]);
        break;

    default:
        respond(405, ['error' => 'Method not allowed']);
}

function readJsonBody() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if ($data === null) {
        respond(400, ['error' => 'Invalid JSON payload']);
    }
    return $data;
}

function persistBoard(PDO $db, $table, $id, array $payload, $isUpdate) {
    $title = $payload['boardTitle'] ?? '';
    $settings = $payload['settings'] ?? [];
    $background = $settings['background'] ?? null;
    $opacity = isset($settings['opacity']) ? $settings['opacity'] : null;
    $fontSize = isset($settings['fontSize']) ? $settings['fontSize'] : null;
    $showTitle = isset($settings['showTitle']) ? (int)$settings['showTitle'] : null;
    $json = json_encode($payload);

    if ($isUpdate) {
        $sql = "UPDATE {$table} SET title = :title, background = :background, opacity = :opacity, font_size = :font_size, show_title = :show_title, data = :data, updated_at = NOW() WHERE id = :id";
    } else {
        $sql = "INSERT INTO {$table} (id, title, background, opacity, font_size, show_title, data, created_at, updated_at) VALUES (:id, :title, :background, :opacity, :font_size, :show_title, :data, NOW(), NOW()) ON DUPLICATE KEY UPDATE title = VALUES(title), background = VALUES(background), opacity = VALUES(opacity), font_size = VALUES(font_size), show_title = VALUES(show_title), data = VALUES(data), updated_at = NOW()";
    }

    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':id' => $id,
        ':title' => $title,
        ':background' => $background,
        ':opacity' => $opacity,
        ':font_size' => $fontSize,
        ':show_title' => $showTitle,
        ':data' => $json,
    ]);
}

function ensureBoardsTable(PDO $db, $table) {
    $db->exec("CREATE TABLE IF NOT EXISTS {$table} (
        id CHAR(36) NOT NULL PRIMARY KEY,
        title TEXT,
        background VARCHAR(255),
        opacity DECIMAL(3,2),
        font_size INT,
        show_title TINYINT(1),
        data LONGTEXT NOT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
}

function generateUuid() {
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function respond($status, array $payload) {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}
