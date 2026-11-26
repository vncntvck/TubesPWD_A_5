<?php
function simpanFilePrivat($field, $folder, array $mimeTypes, $batasByte, $wajib = false)
{
    if (!preg_match('/^[a-z_]+$/', $folder)) {
        throw new RuntimeException('Folder penyimpanan tidak valid.');
    }

    $file = $_FILES[$field] ?? null;
    if ($file === null) {
        if ($wajib) {
            throw new InvalidArgumentException('File wajib diunggah.');
        }
        return null;
    }
    if (!is_array($file)) {
        throw new InvalidArgumentException('Data file tidak valid.');
    }
    if (($file['error'] ?? null) === UPLOAD_ERR_NO_FILE) {
        if ($wajib) {
            throw new InvalidArgumentException('File wajib diunggah.');
        }
        return null;
    }
    if (
        !isset($file['error'], $file['tmp_name'], $file['size']) ||
        !is_string($file['tmp_name']) ||
        !is_int($file['size']) ||
        $file['error'] !== UPLOAD_ERR_OK ||
        !is_uploaded_file($file['tmp_name'])
    ) {
        throw new InvalidArgumentException('File gagal diunggah.');
    }
    if ($file['size'] <= 0 || $file['size'] > $batasByte) {
        throw new InvalidArgumentException('Ukuran file melebihi batas.');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    $extension = $mimeTypes[$mime] ?? null;
    if ($extension === null) {
        throw new InvalidArgumentException('Format file tidak didukung.');
    }

    $directory = __DIR__ . '/../private/' . $folder;
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('Folder penyimpanan file tidak dapat dibuat.');
    }

    $filename = bin2hex(random_bytes(16)) . '.' . $extension;
    if (!move_uploaded_file($file['tmp_name'], $directory . DIRECTORY_SEPARATOR . $filename)) {
        throw new RuntimeException('File gagal disimpan.');
    }

    return 'private/' . $folder . '/' . $filename;
}

function hapusFilePrivat($relativePath, $folder)
{
    $pattern = '#^private/' . preg_quote($folder, '#') . '/[a-f0-9]{32}\.(?:jpg|png|pdf)$#';
    if (!is_string($relativePath) || !preg_match($pattern, $relativePath)) {
        return;
    }

    $path = __DIR__ . '/../' . $relativePath;
    if (is_file($path) && !unlink($path)) {
        throw new RuntimeException('File lama tidak dapat dihapus.');
    }
}
?>
