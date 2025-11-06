import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

const ConnectionStatus = ({ isConnected, connectionError }) => {
  if (isConnected) {
    return (
      <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
        <Wifi className="w-4 h-4" />
        <span className="text-sm font-medium">Connected</span>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
        <AlertCircle className="w-4 h-4" />
        <div className="text-sm">
          <span className="font-medium">Offline</span>
          <div className="text-xs opacity-75">{connectionError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">Connecting...</span>
    </div>
  );
};

export default ConnectionStatus;