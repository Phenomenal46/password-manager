function Landing({ onLoginClick }) {
    return (
        <div className="min-h-screen w-full bg-linear-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100">
            {/* Sticky navbar: fixed to top while scrolling */}
            <header className="sticky top-0 z-50 mx-auto w-full max-w-6xl px-6 pt-6">
                <nav className="flex items-center justify-between rounded-2xl border border-white/15 bg-slate-900/80 px-5 py-4 backdrop-blur">
                    {/* Use one brand asset everywhere for consistency */}
                    <div className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
                        <img src="/cyber_neon.svg" alt="VaultX logo" className="h-8 w-8" />
                        <span>VaultX</span>
                    </div>

                    {/* Navbar links with increased text size + smooth scroll (prevents URL hash issues with back/forward) */}
                    <div className="hidden md:flex items-center gap-7 text-base text-slate-200/90">
                        <button 
                            onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}
                            className="hover:text-white hover:cursor-pointer transition"
                        >
                            Features
                        </button>
                        <button 
                            onClick={() => document.querySelector('#security')?.scrollIntoView({ behavior: 'smooth' })}
                            className="hover:text-white hover:cursor-pointer transition"
                        >
                            Security
                        </button>
                        <button 
                            onClick={() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                            className="hover:text-white hover:cursor-pointer transition"
                        >
                            How it works
                        </button>
                    </div>

                    <button
                        onClick={onLoginClick}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-500 hover:cursor-pointer"
                    >
                        Log In
                    </button>
                </nav>
            </header>

            <main className="mx-auto w-full max-w-6xl px-6 pt-20 pb-16 text-center">
                {/* Updated tagline: emphasizes zero-trust architecture where server has zero knowledge */}
                <p className="text-base font-semibold tracking-wide text-blue-200/90">
                    ZERO-TRUST ARCHITECTURE • SERVER-BLIND ENCRYPTION
                </p>
                <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold leading-tight sm:text-6xl">
                    Manage your passwords securely with client-side encryption.
                </h1>
                <p className="mx-auto mt-6 max-w-3xl text-base md:text-xl leading-relaxed text-slate-200/90">
                    VaultX encrypts your credentials in the browser before storage. Your passwords stay private,
                    and only you can decrypt them with your master password.
                </p>

                <div className="mt-10 flex justify-center gap-4">
                    <button
                        onClick={onLoginClick}
                        className="rounded-xl bg-white px-6 py-3 text-lg font-semibold text-slate-900 hover:bg-slate-100 hover:cursor-pointer"
                    >
                        Get Started
                    </button>
                    {/* Smooth scroll instead of hash link to prevent browser navigation issues */}
                    <button
                        onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}
                        className="rounded-xl border border-white/50 px-6 py-3 text-lg font-semibold text-white hover:bg-white/10 hover:cursor-pointer"
                    >
                        Learn More
                    </button>
                </div>

                <section id="features" className="mt-24 grid gap-6 md:grid-cols-3 text-left">
                    <article className="rounded-xl border border-white/15 bg-white/5 p-6">
                        <h2 className="text-2xl font-semibold">Client-side encryption</h2>
                        <p className="mt-2 text-base text-slate-200/85">Passwords are encrypted in your browser before they are saved.</p>
                    </article>
                    <article id="security" className="rounded-xl border border-white/15 bg-white/5 p-6">
                        <h2 className="text-2xl font-semibold">Secure authentication</h2>
                        <p className="mt-2 text-base text-slate-200/85">JWT tokens with httpOnly cookies protect your session across requests.</p>
                    </article>
                    <article id="how-it-works" className="rounded-xl border border-white/15 bg-white/5 p-6">
                        <h2 className="text-2xl font-semibold">Simple vault experience</h2>
                        <p className="mt-2 text-base text-slate-200/85">Add, edit, copy, and manage credentials with a minimal clean UI.</p>
                    </article>
                </section>
            </main>

            {/* Enhanced footer with tech stack, GitHub, and copyright */}
            <footer className="border-t border-white/10 py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-300/90">
                        <div className="flex items-center gap-2">
                            <img src="/cyber_neon.svg" alt="VaultX logo" className="h-8 w-8" />
                            <span className="font-semibold">VaultX</span>
                        </div>
                        <div className="text-center">
                            <p className="text-base">Built with React, Node.js, Express, MongoDB & Web Crypto API</p>
                            <p className="mt-1 text-sm text-slate-400">End-to-end encrypted • Zero-trust architecture</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Clickable GitHub icon; replace href with your actual repository URL */}
                            <a href="https://github.com/Phenomenal46/password-manager" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:cursor-pointer transition" title="Open GitHub">
                                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                                    <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.42-4.04-1.42-.55-1.37-1.33-1.73-1.33-1.73-1.09-.73.08-.72.08-.72 1.2.09 1.84 1.22 1.84 1.22 1.07 1.82 2.8 1.29 3.49.99.11-.76.42-1.29.76-1.59-2.66-.3-5.46-1.31-5.46-5.84 0-1.29.47-2.35 1.23-3.18-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.21a11.6 11.6 0 0 1 6 0c2.3-1.53 3.3-1.21 3.3-1.21.65 1.65.24 2.87.12 3.17.77.83 1.23 1.89 1.23 3.18 0 4.54-2.8 5.53-5.48 5.83.43.36.82 1.08.82 2.19v3.24c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
                                </svg>
                            </a>
                            <span>•</span>
                            <span>&copy; 2026</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Landing;