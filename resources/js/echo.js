import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const isSecure = import.meta.env.VITE_REVERB_SCHEME === "https";

window.Echo = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,

    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT),

    wssPort: Number(import.meta.env.VITE_REVERB_PORT),

    forceTLS: isSecure,

    enabledTransports: ["ws", "wss"],
});
