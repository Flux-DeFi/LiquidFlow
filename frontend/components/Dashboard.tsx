import React from 'react';
import { downloadCSV } from '../utils/csvExport';

interface StreamData extends Record<string, unknown> {
    id: string;
    date: string;
    recipient: string;
    amount: number;
    token: string;
    status: 'Active' | 'Completed' | 'Cancelled';
    deposited: number;
    withdrawn: number;
}

const mockStreams: StreamData[] = [
    { id: '1', date: '2023-10-25', recipient: 'G...ABCD', amount: 500, token: 'USDC', status: 'Completed', deposited: 500, withdrawn: 500 },
    { id: '2', date: '2023-10-26', recipient: 'G...EFGH', amount: 1200, token: 'XLM', status: 'Active', deposited: 1200, withdrawn: 600 },
    { id: '3', date: '2023-10-27', recipient: 'G...IJKL', amount: 300, token: 'EURC', status: 'Cancelled', deposited: 300, withdrawn: 150 },
    { id: '4', date: '2023-10-28', recipient: 'G...MNOP', amount: 1000, token: 'USDC', status: 'Completed', deposited: 1000, withdrawn: 1000 },
    { id: '5', date: '2023-10-29', recipient: 'G...QRST', amount: 750, token: 'USDC', status: 'Active', deposited: 750, withdrawn: 250 },
];

const Dashboard: React.FC = () => {
    const handleExport = () => {
        downloadCSV(mockStreams, 'flowfi-stream-history.csv');
    };

    const handleTopUp = (streamId: string) => {
        const amount = prompt(`Enter amount to add to stream ${streamId}:`);
        if (amount && parseFloat(amount) > 0) {
            console.log(`Adding ${amount} funds to stream ${streamId}`);
            // TODO: Integrate with Soroban contract's top_up_stream function
            alert(`Successfully added ${amount} to stream ${streamId}`);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Stream History</h1>
                <button
                    onClick={handleExport}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded shadow transition-colors w-full sm:w-auto"
                >
                    Export CSV
                </button>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-4">
                {mockStreams.map((stream) => (
                    <div key={stream.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{stream.date}</p>
                            </div>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                ${stream.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                stream.status === 'Completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                {stream.status}
                            </span>
                        </div>
                        
                        <div className="space-y-2">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Recipient</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{stream.recipient}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Deposited</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stream.deposited} {stream.token}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Withdrawn</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{stream.withdrawn} {stream.token}</p>
                                </div>
                            </div>
                            
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Token</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{stream.token}</p>
                            </div>
                        </div>
                        
                        {stream.status === 'Active' && (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => handleTopUp(stream.id)}
                                    className="w-full text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md transition-colors font-semibold text-center"
                                >
                                    Add Funds
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recipient</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deposited</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Withdrawn</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Token</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {mockStreams.map((stream) => (
                            <tr key={stream.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{stream.date}</td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{stream.recipient}</td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-semibold">{stream.deposited} {stream.token}</td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{stream.withdrawn} {stream.token}</td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{stream.token}</td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${stream.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                            stream.status === 'Completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                        {stream.status}
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {stream.status === 'Active' && (
                                        <button
                                            onClick={() => handleTopUp(stream.id)}
                                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-md transition-colors font-semibold"
                                        >
                                            Add Funds
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
