import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const StravaCallback: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            // Parse URL parameters
            const params = new URLSearchParams(location.search);
            const code = params.get('code');
            const error = params.get('error');

            if (error) {
                setStatus('error');
                setErrorMessage('Authorization was denied or failed');
                setTimeout(() => navigate('/interests'), 3000);
                return;
            }

            if (!code) {
                setStatus('error');
                setErrorMessage('No authorization code received');
                setTimeout(() => navigate('/interests'), 3000);
                return;
            }

            try {
                const API_URL = window.location.hostname === 'localhost'
                    ? 'http://localhost:4000'
                    // : 'https://api.distilledchild.space';
                    : 'https://api.distilledchild.space';

                // Exchange code for access token
                const tokenResponse = await fetch(`${API_URL}/api/strava/exchange_token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });

                if (!tokenResponse.ok) {
                    throw new Error('Failed to exchange token');
                }

                const tokenData = await tokenResponse.json();
                const accessToken = tokenData.access_token;

                // Sync activities to database
                const syncResponse = await fetch(`${API_URL}/api/workouts/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessToken })
                });

                if (!syncResponse.ok) {
                    throw new Error('Failed to sync activities');
                }

                const syncData = await syncResponse.json();
                console.log('Sync result:', syncData);

                // Store access token and athlete info for future use
                localStorage.setItem('strava_access_token', accessToken);
                localStorage.setItem('strava_athlete', JSON.stringify(tokenData.athlete));

                setStatus('success');
                setTimeout(() => navigate('/interests/workout'), 1500);

            } catch (err) {
                console.error('Error during Strava callback:', err);
                setStatus('error');
                setErrorMessage('Failed to complete authorization');
                setTimeout(() => navigate('/interests'), 3000);
            }
        };

        handleCallback();
    }, [location, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
            <div className="bg-white p-12 rounded-2xl shadow-xl max-w-md w-full text-center">
                {status === 'processing' && (
                    <>
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing...</h2>
                        <p className="text-slate-600">Connecting to Strava and fetching your activities</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Success!</h2>
                        <p className="text-slate-600">Redirecting to your activities...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Error</h2>
                        <p className="text-slate-600">{errorMessage}</p>
                    </>
                )}
            </div>
        </div>
    );
};
