import { usePage, Link, useForm, router } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";



export default function AuthenticatedLayout({ header, children }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const permissions = user.permissions;

    const { post } = useForm();

    // ===== SIDEBAR STATE =====
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // ===== SESSION LOGIC =====
    const [showWarning, setShowWarning] = useState(false);
    const timeoutRef = useRef(null);
    const warningRef = useRef(null);

    const WARNING_TIME = 60 * 1000;

    const getTimeout = () => {
        const role = user?.roles?.[0];
        if (role === "Admin") return 10 * 60 * 1000;
        return 60 * 60 * 1000;
    };

    const autoSave = () => {
        const forms = document.querySelectorAll("form[data-autosave]");
        const unsavedForms = JSON.parse(
            localStorage.getItem("unsaved_forms") || "{}",
        );

        forms.forEach((form) => {
            const formName = form.dataset.autosave;
            const data = {};
            new FormData(form).forEach((value, key) => {
                data[key] = value;
            });
            unsavedForms[formName] = data;
        });

        localStorage.setItem("unsaved_forms", JSON.stringify(unsavedForms));
    };

    const resetTimer = () => {
        setShowWarning(false);
        clearTimeout(timeoutRef.current);
        clearTimeout(warningRef.current);

        const totalTime = getTimeout();

        warningRef.current = setTimeout(() => {
            setShowWarning(true);
        }, totalTime - WARNING_TIME);

        timeoutRef.current = setTimeout(() => {
            autoSave();
            router.visit("/logout", { method: "post" });
        }, totalTime);
    };

    useEffect(() => {
        const events = ["click", "mousemove", "keypress"];
        events.forEach((e) => window.addEventListener(e, resetTimer));
        resetTimer();

        return () => {
            events.forEach((e) => window.removeEventListener(e, resetTimer));
            clearTimeout(timeoutRef.current);
            clearTimeout(warningRef.current);
        };
    }, []);

    // ===== PERMISSION HELPER =====
    const can = (permission) => permissions.includes(permission);

    // ===== YOUR ORIGINAL NAV ITEMS (KEEP YOUR ICONS HERE) =====
    const navigationItems = [
        {
            name: "Dashboard",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                </svg>
            ),
            href: "/dashboard",
            permission: null,
        },
        {
            name: "Products",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                </svg>
            ),
            href: "/products",
            permission: "view products",
        },
        {
            name: "Categories",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 011.414.586 2 2 0 011.414.586L21 13a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-5-5a2 2 0 01-.586-1.414V9a2 2 0 011-1.732V7a2 2 0 01-2-2z"
                    />
                </svg>
            ),
            href: "/categories",
            permission: "manage categories",
        },
        {
            name: "Sales",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            href: "/sales",
            permission: "create sales",
        },
        {
            name: "Purchases",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                </svg>
            ),
            href: "/purchases",
            permission: "create purchases",
        },
        {
            name: "Suppliers",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1"
                    />
                </svg>
            ),
            href: "/suppliers",
            permission: null,
        },
            {
        name: "Stock Adjustment",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6v6l4 2M6 6h12M6 18h12" />
            </svg>
        ),
        href: "/stock-adjustments/create",
        permission: null,
    },

        {
            name: "Analytics",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                </svg>
            ),
            href: "/analytics",
            permission: "view analytics",
        },
        {
            name: "Profit Reports",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                </svg>
            ),
            href: route('profit.index'),
            permission: "view profit reports",
        },
        {
            name: "Users",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>
            ),
            href: "/users",
            permission: "manage users",
        },
    ];

    const visibleNavigationItems = navigationItems.filter(
        (item) => !item.permission || can(item.permission),
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* WARNING */}
            {showWarning && (
                <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded shadow z-50">
                    ⚠ Session expiring in 1 minute!
                    <button
                        onClick={resetTimer}
                        className="ml-3 bg-white text-red-500 px-2 py-1 rounded"
                    >
                        Stay
                    </button>
                </div>
            )}

            {/* ===== SIDEBAR (YOUR EXACT UI) ===== */}
           <aside
    className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 z-20 flex flex-col ${
        sidebarOpen ? "w-64" : "w-20"
    }`}
     >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    {sidebarOpen && (
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
                            <span className="font-semibold text-gray-800">
                                POS System
                            </span>
                        </div>
                    )}

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100"
                    >
                        ☰
                    </button>
                </div>

                {/* Navigation */}
              <nav className="mt-6 flex-1 overflow-y-auto">
                    {visibleNavigationItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition group relative"
                        >
                            <div className="flex items-center justify-center w-8">
                                {item.icon}
                            </div>

                            {sidebarOpen && (
                                <span className="ml-3 text-sm font-medium">
                                    {item.name}
                                </span>
                            )}

                            {!sidebarOpen && (
                                <div className="absolute left-20 hidden group-hover:block bg-gray-900 text-white text-sm px-2 py-1 rounded whitespace-nowrap z-30">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Bottom User */}
                <div className="p-4 border-t border-gray-200">
                    <div
    className={`flex items-center ${
        sidebarOpen ? "justify-between" : "justify-center"
    }`}
>
    {sidebarOpen ? (
        // ✅ FULL USER INFO
        <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                    {user.name?.charAt(0) || "U"}
                </span>
            </div>

            <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                    {user.email}
                </p>
            </div>
        </div>
    ) : (
        // ✅ ONLY ICON WHEN COLLAPSED
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
                {user.name?.charAt(0) || "U"}
            </span>
        </div>
    )}

    {/* LOGOUT */}
  <button
    onClick={() => post("/logout")}
    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
>
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        {/* square (box) */}
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4h10v16H4z"
        />

        {/* arrow exiting left side */}
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 12h6m0 0l-2-2m2 2l-2 2"
        />
    </svg>
</button>
</div>
                </div>
            </aside>

            {/* ===== MAIN ===== */}
            <div
                className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}
            >
                {/* HEADER */}
                <div className="bg-white border-b px-6 py-6">
                    {header ? (
                        header
                    ) : (
                        <h1 className="text-lg font-semibold">
                            Welcome, {user.name}
                        </h1>
                    )}
                </div>

                {/* CONTENT */}
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
