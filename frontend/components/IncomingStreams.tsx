'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface IncomingStreamData {
    id: string;
    sender: string;
    token: string;
    rate: string;
    accrued: number;
    status: 'Active' | 'Completed' | 'Paused';
}

const mockIncomingStreams: IncomingStreamData[] = [
    { id: '101', sender: 'G...56yA', token: 'USDC', rate: '500/mo', accrued: 125.50, status: 'Active' },
    { id: '102', sender: 'G...Klm9', token: 'XLM', rate: '1000/mo', accrued: 450.00, status: 'Active' },
    { id: '103', sender: 'G...22Pq', token: 'EURC', rate: '200/mo', accrued: 200.00, status: 'Completed' },
    { id: '104', sender: 'G...99Zx', token: 'USDC', rate: '1200/mo', accrued: 0.00, status: 'Paused' },
    { id: '105', sender: 'G...44Tb', token: 'XLM', rate: '300/mo', accrued: 300.00, status: 'Completed' },
];

// ─── Cancel Confirmation Dialog ────────────────────────────────────────────────

interface CancelConfirmDialogProps {
    stream: IncomingStreamData;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (id: string) => void;
    isProcessing: boolean;
}

function CancelConfirmDialog({
    stream,
    isOpen,
    onClose,
    onConfirm,
    isProcessing,
}: CancelConfirmDialogProps) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isProcessing) onClose();
        },
        [isProcessing, onClose],
    );

    useEffect(() => {
        if (!isOpen) return;
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
                onClick={isProcessing ? undefined : onClose}
                aria-hidden="true"
            />

            {/* Dialog */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="cancel-confirm-title"
                aria-describedby="cancel-confirm-description"
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <div className="relative w-full max-w-md animate-in slide-in-from-bottom-4 fade-in-0 duration-300">
                    <div className="rounded-2xl border border-glass-border bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-glass-border">
                            <div>
                                <h2
                                    id="cancel-confirm-title"
                                    className="text-lg font-bold text-foreground"
                                >
                                    Cancel Stream
                                </h2>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    This action cannot be undone.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                aria-label="Close dialog"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-glass-highlight hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div
                                id="cancel-confirm-description"
                                className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"
                            >
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-amber-400">
                                            Are you sure?
                                        </p>
                                        <p className="text-amber-300/80 mt-1">
                                            Cancelling this stream will settle all accrued funds and end the
                                            stream immediately. This is an irreversible on-chain action.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-glass rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Sender</span>
                                    <span className="font-mono text-foreground">{stream.sender}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Token</span>
                                    <span className="text-foreground">{stream.token}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Rate</span>
                                    <span className="text-foreground">{stream.rate}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Accrued</span>
                                    <span className="text-foreground font-bold">{stream.accrued.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 pb-5 pt-1">
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="inline-flex items-center justify-center rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-foreground hover:bg-glass-highlight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Keep Stream
                            </button>
                            <button
                                onClick={() => onConfirm(stream.id)}
                                disabled={isProcessing}
                                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Cancelling…
                                    </>
                                ) : (
                                    'Yes, Cancel Stream'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const IncomingStreams: React.FC = () => {
    const [filter, setFilter] = useState<'All' | 'Active' | 'Completed' | 'Paused'>('All');
    const [dialogStream, setDialogStream] = useState<IncomingStreamData | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const filteredStreams = filter === 'All'
        ? mockIncomingStreams
        : mockIncomingStreams.filter(s => s.status === filter);

    const handleWithdraw = (id: string) => {
        console.log(`Withdrawing funds for stream: ${id}`);
    };

    const handleCancelClick = (stream: IncomingStreamData) => {
        setDialogStream(stream);
    };

    const handleCancelConfirm = async (id: string) => {
        setCancellingId(id);
        try {
            // In a real app, this would call the contract via useStreamOperations
            // await cancelStream({ streamId: id });
            console.log(`Cancelling stream: ${id}`);
            // Simulate async operation while the real contract call is unimplemented
            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (err) {
            console.error('Failed to cancel stream:', err);
        } finally {
            setCancellingId(null);
            setDialogStream(null);
        }
    };

    const handleCloseDialog = () => {
        if (!cancellingId) {
            setDialogStream(null);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilter(e.target.value as 'All' | 'Active' | 'Completed' | 'Paused');
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Cancel Confirmation Dialog */}
            <CancelConfirmDialog
                stream={dialogStream!}
                isOpen={dialogStream !== null}
                onClose={handleCloseDialog}
                onConfirm={handleCancelConfirm}
                isProcessing={cancellingId !== null}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Incoming Streams</h1>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center w-full sm:w-auto">
                    <label htmlFor="statusFilter" className="text-sm font-medium text-gray-500 dark:text-gray-400">Filter Status:</label>
                    <select
                        id="statusFilter"
                        value={filter}
                        onChange={handleFilterChange}
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Paused">Paused</option>
                    </select>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-4">
                {filteredStreams.map((stream) => (
                    <div key={stream.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sender</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{stream.sender}</p>
                            </div>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                ${stream.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                stream.status === 'Completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                                {stream.status}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Token</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100">{stream.token}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Rate</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100">{stream.rate}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Accrued Amount</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{stream.accrued.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                            <button
                                onClick={() => handleWithdraw(stream.id)}
                                className="flex-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md transition-colors font-semibold text-center"
                            >
                                Withdraw
                            </button>
                            {stream.status === 'Active' && (
                                <button
                                    onClick={() => handleCancelClick(stream)}
                                    className="flex-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md transition-colors font-semibold text-center"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {filteredStreams.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No {filter !== 'All' ? filter.toLowerCase() : ''} streams found.
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sender</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Token</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rate</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Accrued Amount</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredStreams.map((stream) => (
                            <tr key={stream.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{stream.sender}</td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{stream.token}</td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{stream.rate}</td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-bold">{stream.accrued.toFixed(2)}</td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${stream.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                            stream.status === 'Completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                                        {stream.status}
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleWithdraw(stream.id)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-md transition-colors"
                                        >
                                            Withdraw
                                        </button>
                                        {stream.status === 'Active' && (
                                            <button
                                                onClick={() => handleCancelClick(stream)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-md transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredStreams.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No {filter !== 'All' ? filter.toLowerCase() : ''} streams found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncomingStreams;