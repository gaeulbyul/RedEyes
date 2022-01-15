import App from "./App.svelte";

document.addEventListener("DOMContentLoaded", () => {
    const target = document.getElementById("root");
    new App({
        target,
    });
});
