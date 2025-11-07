import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSharing } from '../hooks/useSharing.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import Loading from '../components/ui/Loading.jsx';
import { FileText, User, Calendar, Download, CheckCircle, XCircle } from 'lucide-react';

const SharedNotes = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, isInitialized } = useAuth();
  const { getShareByToken, acceptShare, loading: shareLoading, error } = useSharing();

  const [share, setShare] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (token && isInitialized) {
      loadShare();
    }
  }, [token, isInitialized]);

  const loadShare = async () => {
    try {
      const response = await getShareByToken(token);
      setShare(response.data.data);
    } catch (error) {
      console.error('Failed to load share:', error);
    }
  };

  const handleAcceptShare = async () => {
    console.log('Accept share clicked - isAuthenticated:', isAuthenticated, 'user:', user);
    
    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate('/login', { state: { from: `/shared/${token}` } });
      return;
    }

    setIsAccepting(true);
    try {
      const result = await acceptShare(token);
      console.log('Share accepted successfully:', result);
      setAccepted(true);
      setTimeout(() => {
        navigate('/'); // Redirect to dashboard after acceptance
      }, 2000);
    } catch (error) {
      console.error('Failed to accept share:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  // Show loading while checking auth or loading share
  if (authLoading || !isInitialized || shareLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  if (error || !share) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Share Not Found</h2>
          <p className="text-gray-600 mb-6">
            This share link may have expired or been deleted.
          </p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600 mb-6">
            The note has been added to your collection.
          </p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isExpired = share.isExpired?.() || 
    (share.expiresAt && new Date() > new Date(share.expiresAt)) ||
    (share.maxAccesses && share.accessCount >= share.maxAccesses);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">Shared Note</h1>
                <p className="text-primary-100">
                  You've been invited to access a note
                </p>
              </div>
              <FileText className="w-12 h-12 text-primary-200" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Note Info */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {share.note?.title}
              </h2>
              <p className="text-gray-600">
                Shared by <strong>{share.sharedBy?.username}</strong>
              </p>
            </div>

            {/* Share Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Permission: <strong className="capitalize">{share.permission}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {share.expiresAt 
                    ? `Expires: ${new Date(share.expiresAt).toLocaleDateString()}`
                    : 'No expiration'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Download className="w-4 h-4" />
                <span>Accessed {share.accessCount} times</span>
              </div>
              {share.lastAccessed && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Last accessed: {new Date(share.lastAccessed).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Expired Warning */}
            {isExpired && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5" />
                  <span>This share link has expired and is no longer accessible.</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {!isExpired && (
                <Button
                  variant="primary"
                  onClick={handleAcceptShare}
                  loading={isAccepting}
                  disabled={isExpired}
                  className="flex-1"
                >
                  {isAuthenticated ? 'Add to My Notes' : 'Login to Accept'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate('/')}
              >
                {isExpired ? 'Go to Dashboard' : 'Cancel'}
              </Button>
            </div>

            {/* Preview (optional) */}
            {share.note?.content && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Preview</h3>
                <div 
                  className="prose max-w-none bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-48 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: share.note.content }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedNotes;