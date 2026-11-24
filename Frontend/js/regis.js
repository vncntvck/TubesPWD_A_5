document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('registerForm');
    if (!form) return;

    var message = document.getElementById('formMessage');
    var submitButton = form.querySelector('button[type="submit"]');
    var password = document.getElementById('password');
    var confirmation = document.getElementById('confirm');
    var terms = document.getElementById('terms');
    var toggleConfirmation = document.getElementById('toggleConfirm');

    function showMessage(text, isError) {
        if (!message) return;
        message.textContent = text;
        message.classList.toggle('is-error', isError);
        message.classList.toggle('is-success', !isError);
        message.setAttribute('role', 'status');
        message.setAttribute('aria-live', 'polite');
    }

    if (toggleConfirmation && confirmation) {
        toggleConfirmation.addEventListener('click', function () {
            var shouldShow = confirmation.type === 'password';
            confirmation.type = shouldShow ? 'text' : 'password';
            toggleConfirmation.textContent = shouldShow ? 'Sembunyikan' : 'Lihat';
        });
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        if (confirmation && password.value !== confirmation.value) {
            showMessage('Konfirmasi password tidak cocok.', true);
            confirmation.focus();
            return;
        }

        if (terms && !terms.checked) {
            showMessage('Silakan setujui syarat dan ketentuan terlebih dahulu.', true);
            terms.focus();
            return;
        }

        var formData = new FormData(form);
        var requestData = {
            username: formData.get('username').trim(),
            password: formData.get('password'),
            no_tlp: formData.get('phone').trim(),
            email: formData.get('email').trim()
        };

        if (submitButton) submitButton.disabled = true;
        showMessage('Sedang membuat akun...', false);

        try {
            var response = await fetch('../backend/api/register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            var result = await response.json();

            if (!response.ok) {
                throw new Error(result.pesan || 'Pendaftaran gagal. Silakan coba lagi.');
            }

            if (result.status !== true) {
                showMessage(result.pesan || 'Pendaftaran gagal. Silakan periksa data Anda.', true);
                return;
            }

            form.reset();
            showMessage(result.pesan || 'Pendaftaran berhasil.', false);
        } catch (error) {
            console.error('Gagal mengirim pendaftaran:', error);
            showMessage(error.message || 'Tidak dapat terhubung ke server. Silakan coba lagi.', true);
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
});
