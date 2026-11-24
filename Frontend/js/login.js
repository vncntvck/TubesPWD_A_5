document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('loginForm');
    if (!form) return;

    var usernameInput = document.getElementById('username');
    var passwordInput = document.getElementById('password');
    var message = document.getElementById('formMessage');
    var submitButton = form.querySelector('button[type="submit"]');
    var loginEndpoint = new URL('../backend/api/login.php', window.location.href).href;

    function showMessage(text, isError) {
        if (!message) return;

        message.textContent = text;
        message.classList.toggle('is-error', isError);
        message.classList.toggle('is-success', !isError);
        message.setAttribute('role', 'status');
        message.setAttribute('aria-live', 'polite');
    }

    [usernameInput, passwordInput].forEach(function (input) {
        if (!input) return;
        input.addEventListener('input', function () {
            if (message && message.textContent) showMessage('', false);
        });
    });

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        var username = usernameInput.value.trim();
        var password = passwordInput.value;

        if (!username || !password) {
            showMessage('Username dan password wajib diisi.', true);
            return;
        }

        if (submitButton) submitButton.disabled = true;
        showMessage('Sedang masuk...', false);

        try {
            var response = await fetch(loginEndpoint, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            var responseText = await response.text();
            var result;

            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                throw new Error('Server mengembalikan respons yang tidak valid.');
            }

            if (!response.ok) {
                throw new Error(result.pesan || 'Login gagal. Silakan coba lagi.');
            }

            if (result.status !== true) {
                showMessage(result.pesan || 'Username atau password salah.', true);
                return;
            }

            showMessage(result.pesan || 'Login berhasil.', false);
            window.location.assign('index.xhtml');
        } catch (error) {
            console.error('Gagal mengirim login:', error);
            showMessage(error.message || 'Tidak dapat terhubung ke server.', true);
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
});
