import { Head, Link } from "@inertiajs/react";

export default function Welcome({ auth }) {
    const features = [
        {
            title: "Stock Management",
            desc: "Track inventory in real time",
            icon: "📦",
        },
        {
            title: "Sales Analytics",
            desc: "Monitor daily performance",
            icon: "📈",
        },
        {
            title: "Smart Reports",
            desc: "Generate business insights",
            icon: "📊",
        },
        {
            title: "AI Forecast",
            desc: "Predict future demand",
            icon: "✨",
        },
    ];

    return (
        <>
            <Head title="Welcome - Small Shop Inventory" />

            <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
                {/* Background Effects */}
                <div className="absolute inset-0">
                    <div className="absolute top-[-120px] left-[-120px] h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-3xl"></div>
                    <div className="absolute bottom-[-150px] right-[-120px] h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl"></div>
                </div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

                <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
                    {/* Top Badge */}
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-sm font-medium text-slate-200">
                            Modern Inventory Solution
                        </span>
                    </div>

                    {/* Hero */}
                    <div className="mx-auto max-w-5xl text-center">
                        <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-7xl">
                            Manage Your
                            <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                                Shop Smarter
                            </span>
                        </h1>

                        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
                            Powerful inventory management designed for modern
                            businesses. Track stock, monitor sales, and grow
                            with confidence.
                        </p>

                        {/* Buttons */}
                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            {auth.user ? (
                                <Link
                                    href="/dashboard"
                                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 font-semibold text-white shadow-2xl shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/40"
                                >
                                    <span className="relative z-10">
                                        Enter Dashboard
                                    </span>

                                    <div className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-300 group-hover:translate-y-0"></div>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-8 py-4 font-semibold text-white shadow-2xl shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/40"
                                    >
                                        <span className="relative z-10">
                                            Sign In
                                        </span>

                                        <div className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-300 group-hover:translate-y-0"></div>
                                    </Link>

                                    <Link
                                        href="/register"
                                        className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 font-semibold text-slate-200 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-white/25 hover:bg-white/10"
                                    >
                                        Create Account
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {[
                            { number: "10K+", label: "Products" },
                            { number: "24/7", label: "Access" },
                            { number: "99%", label: "Accuracy" },
                            { number: "AI", label: "Powered" },
                        ].map((stat, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-center backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
                            >
                                <h3 className="text-2xl font-bold text-white">
                                    {stat.number}
                                </h3>
                                <p className="mt-1 text-sm text-slate-400">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Features */}
                    <div className="mt-16 grid w-full max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-blue-400/30 hover:bg-white/10"
                            >
                                {/* Glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-cyan-400/0 to-indigo-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

                                <div className="relative z-10">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-3xl shadow-lg">
                                        {feature.icon}
                                    </div>

                                    <h3 className="mb-2 text-lg font-bold text-white">
                                        {feature.title}
                                    </h3>

                                    <p className="text-sm leading-relaxed text-slate-400">
                                        {feature.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-20 text-center">
                        <p className="text-sm tracking-[0.3em] text-slate-500 uppercase">
                            Built for Modern Businesses
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
