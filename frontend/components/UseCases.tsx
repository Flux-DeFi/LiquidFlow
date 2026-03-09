import React from 'react';
import { Card } from './ui/Card';

const useCases = [
    {
        title: 'Real-time Payroll',
        description: 'Stream salaries to employees and contractors every second. Eliminate the "payday" wait and give your team instant liquidity.',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        badge: 'Employee XP',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        title: 'Token Vesting',
        description: 'Automate token releases with custom cliff and vesting schedules. Fully transparent and trustless distribution for teams and investors.',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        badge: 'Governance',
        color: 'from-emerald-500 to-teal-500'
    },
    {
        title: 'Direct Subscriptions',
        description: 'Build recurring revenue models without middlemen. Users stream directly to your treasury with per-second billing.',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        badge: 'Saas/B2B',
        color: 'from-purple-500 to-indigo-500'
    },
    {
        title: 'DeFi Composability',
        description: 'Direct your incoming streams into yield-bearing protocols automatically. Let your money work for you while it flows.',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        badge: 'Yield+',
        color: 'from-orange-500 to-amber-500'
    }
];

export const UseCases = () => {
    return (
        <section id="use-cases" className="py-32 px-6 md:px-12 bg-slate-900/10">
            <div className="mx-auto max-w-7xl">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-black mb-6">Designed for Every Industry</h2>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                        Whether you&apos;re a DAO, a startup, or an enterprise, LiquidFlow provides the infrastructure to modernize your capital allocation.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {useCases.map((useCase, i) => (
                        <div key={i} className="group relative">
                            <div className={`absolute inset-0 bg-gradient-to-br ${useCase.color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500 rounded-[2rem]`}></div>
                            <Card className="h-full p-8 relative z-10 border-white/5 bg-white/5 hover:bg-white/[0.08] transition-all duration-300">
                                <div className={`inline-block p-3 rounded-2xl bg-gradient-to-br ${useCase.color} text-white mb-6 shadow-lg shadow-white/5`}>
                                    {useCase.icon}
                                </div>
                                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">{useCase.badge}</div>
                                <h3 className="text-2xl font-bold mb-4">{useCase.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                                    {useCase.description}
                                </p>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
