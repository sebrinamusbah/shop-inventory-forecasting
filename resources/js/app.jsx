import "../css/app.css";
import "./bootstrap";
import "./echo";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createInertiaApp({
    title: (title) => `${title} - ${appName}`,

    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx"),
        ).then((page) => {
            // Only apply layout to protected pages
            const protectedPages = [
                "Dashboard",
                "Products/Index",
                "Sale/Index",
                "Sale/Create",
                "Sale/Show",
                "Users/Index",
                "Categories/Index",
                "Orders/Index",
            ];

            if (protectedPages.includes(name)) {
                page.default.layout =
                    page.default.layout ||
                    ((page) => (
                        <AuthenticatedLayout>{page}</AuthenticatedLayout>
                    ));
            }

            return page;
        }),

    setup({ el, App, props }) {
        // Optional: Axios interceptor (kept safe)
        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (
                    error.response?.status === 401 ||
                    error.response?.status === 419
                ) {
                    window.location.href = "/login";
                }

                return Promise.reject(error);
            },
        );

        const root = createRoot(el);
        root.render(<App {...props} />);
    },

    progress: {
        color: "#4B5563",
    },
});
