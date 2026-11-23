document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.querySelector(".login-form-wrapper form");

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        window.location.assign("index.xhtml");
    });
});