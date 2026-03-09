"use strict";

import React from 'react';
import { Card } from './ui/Card';

export const ProgrammableLogic = () => {
    return (
        <section id="programmable-logic" className="py-32 px-6 md:px-12 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-accent-tertiary/10 blur-[150px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="mx-auto max-w-7xl">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1">
                        <div className="inline-flex items-center rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm font-bold text-accent mb-6">
                            SMART AUTOMATION
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                            Programmable <br />
                            <span className="text-gradient">Money Logic</span>
                        </h2>
                        <p className="text-lg text-slate-400 mb-10 max-w-xl leading-relaxed">
                            Stop managing payments manually. LiquidFlow allows you to encode complex financial logic directly into your streams. Define triggers, conditions, and automated responses that execute autonomously on-chain.
                        </p>

                        <div className="space-y-6">
                            {[
                                {
                                    title: "If/Then Conditions",
                                    desc: "Trigger streams based on price action, governance votes, or milestone completions."
                                },
                                {
                                    title: "Automated Escalations",
                                    desc: "Adjust stream rates dynamically based on performance metrics or time-based multipliers."
                                },
                                {
                                    title: "Webhook Integrations",
                                    desc: "Connect your on-chain streams to off-chain systems like Slack, Discord, or ERP software."
                                }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center mt-1">
                                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-1">{item.title}</h4>
                                        <p className="text-slate-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 relative">
                        <div className="glass-card p-4 md:p-8 rounded-[2rem] border-white/10 bg-white/5 backdrop-blur-3xl shadow-2xl relative z-10 animate-float">
                            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                </div>
                                <div className="mx-auto text-xs font-mono text-slate-500 uppercase tracking-widest">stream_config.json</div>
                            </div>

                            <pre className="font-mono text-sm md:text-base text-slate-300 leading-relaxed overflow-x-auto">
                                <code>
                                    {`{
  "stream_id": "flow_8829",
  "logic": {
    "trigger": "milestone_reached",
    "condition": {
      "metric": "github_commits",
      "operator": ">=",
      "value": 50
    },
    "action": {
      "type": "increase_rate",
      "multiplier": 1.25,
      "duration": "end_of_month"
    }
  },
  "notifications": ["discord", "webhook"]
}`}
                                </code>
                            </pre>
                        </div>

                        {/* Decorative elements */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 blur-3xl rounded-full"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent-secondary/20 blur-3xl rounded-full"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};
