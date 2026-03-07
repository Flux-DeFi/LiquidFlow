import React, { useState } from 'react';
import { Button } from './ui/Button';
import { ModeToggle } from './ModeToggle';

export const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md md:px-12 border-b border-glass-border bg-background/50">
            <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <svg className="h-6 w-6 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <span className="text-2xl font-black tracking-tighter text-white">FlowFi</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-8 text-sm font-semibold text-slate-400 md:flex">
                <a href="#features" className="transition-colors hover:text-accent">Features</a>
                <a href="#how-it-works" className="transition-colors hover:text-accent">Process</a>
                <a href="#faq" className="transition-colors hover:text-accent">FAQ</a>
                <a href="#" className="transition-colors hover:text-accent">Ecosystem</a>
                <ModeToggle />
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-4">
                <Button variant="ghost">Log In</Button>
                <Button variant="primary" glow size="md">
                    Connect Wallet
                </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition-colors"
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-md border-b border-glass-border md:hidden">
                    <div className="flex flex-col p-6 space-y-4">
                        <a href="#features" className="text-sm font-semibold text-slate-400 hover:text-accent transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm font-semibold text-slate-400 hover:text-accent transition-colors">Process</a>
                        <a href="#faq" className="text-sm font-semibold text-slate-400 hover:text-accent transition-colors">FAQ</a>
                        <a href="#" className="text-sm font-semibold text-slate-400 hover:text-accent transition-colors">Ecosystem</a>
                        <div className="pt-2">
                            <ModeToggle />
                        </div>
                        <div className="flex flex-col space-y-3 pt-4 border-t border-glass-border">
                            <Button variant="ghost" className="w-full justify-center">Log In</Button>
                            <Button variant="primary" glow size="md" className="w-full justify-center">
                                Connect Wallet
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};
