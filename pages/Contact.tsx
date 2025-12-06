import { Github, Mail, MapPin, Plus, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/apiConfig';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

export const Contact: React.FC = () => {
    const [showCopied, setShowCopied] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [contactInfo, setContactInfo] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userLocation, setUserLocation] = useState<{ city: string; state: string; country: string; lat: number; lon: number } | null>(null);
    const [stateSuggestions, setStateSuggestions] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        Email: '',
        GitHub: '',
        LinkedIn: '',
        city: '',
        state: '',
        country: ''
    });

    // Fetch user's IP-based location
    useEffect(() => {
        const fetchUserLocation = async () => {
            try {
                const response = await fetch('http://ip-api.com/json/?fields=status,city,regionName,country,lat,lon');
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success') {
                        setUserLocation({
                            city: data.city,
                            state: data.regionName,
                            country: data.country,
                            lat: data.lat,
                            lon: data.lon
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user location:', error);
            }
        };

        fetchUserLocation();
    }, []);

    useEffect(() => {
        // Check user auth and fetch contact info
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('user_profile');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);

                // Check authorization from MEMBER collection
                try {
                    const response = await fetch(`${API_URL}/api/member/role/${parsedUser.email}`);
                    if (response.ok) {
                        const data = await response.json();
                        setIsAuthorized(data.authorized);
                    } else {
                        setIsAuthorized(false);
                    }
                } catch (err) {
                    console.error('Failed to check authorization:', err);
                    setIsAuthorized(false);
                }
            } else {
                setUser(null);
                setIsAuthorized(false);
            }
        };

        // Initial check
        checkAuth();

        // Fetch contact info once
        fetchContactInfo();

        // Listen for storage changes (works across tabs)
        window.addEventListener('storage', checkAuth);

        // Poll for changes in same tab (since storage event doesn't fire in same tab)
        const interval = setInterval(checkAuth, 1000);

        return () => {
            window.removeEventListener('storage', checkAuth);
            clearInterval(interval);
        };
    }, []);

    const fetchContactInfo = async () => {
        try {
            const response = await fetch(`${API_URL}/api/contact`);
            if (response.ok) {
                const data = await response.json();
                setContactInfo(data);
            }
        } catch (error) {
            console.error('Failed to fetch contact info:', error);
        }
    };

    const handleCopy = (e: React.MouseEvent) => {
        setCursorPos({ x: e.clientX, y: e.clientY });
        navigator.clipboard.writeText(contactInfo?.Email || 'distilledchild@gmail.com');
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };

    const openModal = () => {
        if (contactInfo) {
            setFormData({
                Email: contactInfo.Email || '',
                GitHub: contactInfo.GitHub || '',
                LinkedIn: contactInfo.LinkedIn || '',
                city: contactInfo.Location?.city || '',
                state: contactInfo.Location?.state || '',
                country: contactInfo.Location?.country || ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setStateSuggestions([]);
    };

    // Lock body scroll when modal is open
    useLockBodyScroll(isModalOpen);

    // Geocode location to get coordinates
    const geocodeLocation = async (city: string, state: string, country: string): Promise<{ lat: number; lon: number } | null> => {
        try {
            // Build search query
            const parts = [city, state, country].filter(Boolean);
            if (parts.length === 0) return null;

            const searchQuery = parts.join(', ');

            // Use Nominatim (OpenStreetMap) geocoding API - free, no key required
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
                {
                    headers: {
                        'User-Agent': 'PersonalWebsite/1.0' // Required by Nominatim
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    return {
                        lat: parseFloat(data[0].lat),
                        lon: parseFloat(data[0].lon)
                    };
                }
            }
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    };

    const handleSave = async () => {
        if (!user || !contactInfo) return;

        try {
            // Always geocode if city/state/country is provided to ensure accurate pin placement
            let finalLatitude = undefined;
            let finalLongitude = undefined;

            if (formData.city || formData.state || formData.country) {
                console.log('Geocoding location...', { city: formData.city, state: formData.state, country: formData.country });
                const coords = await geocodeLocation(formData.city, formData.state, formData.country);

                if (coords) {
                    finalLatitude = coords.lat;
                    finalLongitude = coords.lon;
                    console.log('Geocoded coordinates:', coords);
                } else {
                    console.log('Geocoding failed, coordinates will not be saved');
                }
            }

            const response = await fetch(`${API_URL}/api/contact/${contactInfo._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Email: formData.Email,
                    GitHub: formData.GitHub,
                    LinkedIn: formData.LinkedIn,
                    Location: {
                        city: formData.city,
                        state: formData.state,
                        country: formData.country,
                        latitude: finalLatitude,
                        longitude: finalLongitude
                    },
                    userEmail: user.email
                })
            });

            if (response.ok) {
                fetchContactInfo();
                closeModal();
            }
        } catch (error) {
            console.error('Failed to update contact:', error);
        }
    };

    // US States list for autocomplete
    const US_STATES = [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
        'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
        'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
        'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
        'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
        'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
        'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
    ];

    // Filter state suggestions
    const handleStateInput = (value: string) => {
        setFormData({ ...formData, state: value });
        if (value.length > 0) {
            const filtered = US_STATES.filter(state =>
                state.toLowerCase().startsWith(value.toLowerCase())
            ).slice(0, 5);
            setStateSuggestions(filtered);
        } else {
            setStateSuggestions([]);
        }
    };

    // Get Google Maps embed URL with red marker
    const getMapUrl = () => {
        const hasContactLocation = contactInfo?.Location?.city || contactInfo?.Location?.state || (contactInfo?.Location?.latitude && contactInfo?.Location?.longitude);

        if (hasContactLocation) {
            const { city, state, country, latitude, longitude } = contactInfo.Location;
            if (latitude && longitude) {
                return `https://maps.google.com/maps?q=${latitude},${longitude}&z=12&output=embed`;
            }
            const location = `${city || ''}, ${state || ''}, ${country || ''}`.replace(/^,\s*|\s*,$/g, '');
            return `https://maps.google.com/maps?q=${encodeURIComponent(location)}&z=12&output=embed`;
        } else if (userLocation) {
            // Fallback to user's IP-based location with coordinates to show exact pin
            return `https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lon}&z=12&output=embed`;
        }

        return '';
    };

    // Get display location text
    const getLocationText = () => {
        if (contactInfo?.Location?.city || contactInfo?.Location?.state) {
            const { city, state, country } = contactInfo.Location;
            const parts = [city, state, country].filter(Boolean);
            return parts.join(', ');
        } else if (userLocation) {
            return `${userLocation.city}, ${userLocation.state}, ${userLocation.country}`;
        }
        return 'Loading...';
    };

    return (
        <div className="min-h-screen bg-white pt-32 pb-20 px-6 relative">
            {/* Notification Toast */}
            {showCopied && (
                <div
                    className="fixed z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg animate-fadeIn flex items-center gap-2 pointer-events-none"
                    style={{
                        left: cursorPos.x + 16,
                        top: cursorPos.y - 16
                    }}
                >
                    <span>✨ Email copied to clipboard!</span>
                </div>
            )}

            {/* Edit Button - Only for authorized users */}
            {isAuthorized && (
                <div className="fixed bottom-24 left-6 z-50">
                    <button
                        onClick={openModal}
                        className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-purple-600 transition-all hover:scale-110"
                        title="Edit Contact Info"
                    >
                        <Plus size={28} />
                    </button>
                </div>
            )}

            <div className="max-w-7xl mx-auto animate-fadeIn">
                <h2 className="text-4xl font-bold text-slate-900 mb-16 text-center border-b border-slate-100 pb-8">Get in Touch</h2>

                {/* 2 Column Layout: 50% Contact Cards, 50% Google Map */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Contact Cards */}
                    <div className="space-y-6">
                        <button
                            onClick={handleCopy}
                            className="w-full flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-purple-50 transition-colors group border border-slate-100 hover:border-purple-100 cursor-pointer text-left"
                        >
                            <div className="bg-white p-4 rounded-full shadow-sm text-black group-hover:text-[#9332EA] transition-colors">
                                <Mail size={32} />
                            </div>
                            <div className="ml-6 text-left">
                                <p className="text-sm text-slate-500 group-hover:text-purple-600 uppercase font-bold tracking-wider mb-1 transition-colors">Email</p>
                                <p className="text-xl text-slate-900 font-medium break-all">{contactInfo?.Email || 'Loading...'}</p>
                            </div>
                        </button>

                        <a href={`https://${contactInfo?.GitHub}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-purple-50 transition-colors group border border-slate-100 hover:border-purple-100">
                            <div className="bg-white p-4 rounded-full shadow-sm text-black group-hover:text-black transition-colors">
                                <Github size={32} />
                            </div>
                            <div className="ml-6 text-left">
                                <p className="text-sm text-slate-500 group-hover:text-purple-600 uppercase font-bold tracking-wider mb-1 transition-colors">GitHub</p>
                                <p className="text-xl text-slate-900 font-medium break-all">{contactInfo?.GitHub || 'Loading...'}</p>
                            </div>
                        </a>

                        <a href={`https://${contactInfo?.LinkedIn}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-purple-50 transition-colors group border border-slate-100 hover:border-purple-100">
                            <div className="bg-white p-4 rounded-full shadow-sm text-black group-hover:text-[#2362BC] transition-colors">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            </div>
                            <div className="ml-6 text-left">
                                <p className="text-sm text-slate-500 group-hover:text-purple-600 uppercase font-bold tracking-wider mb-1 transition-colors">LinkedIn</p>
                                <p className="text-xl text-slate-900 font-medium break-all">{contactInfo?.LinkedIn || 'Loading...'}</p>
                            </div>
                        </a>

                        <div className="flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-purple-50 transition-colors group border border-slate-100 hover:border-purple-100">
                            <div className="bg-white p-4 rounded-full shadow-sm text-black group-hover:text-[#DC2726] transition-colors">
                                <MapPin size={32} />
                            </div>
                            <div className="ml-6 text-left">
                                <p className="text-sm text-slate-500 group-hover:text-purple-600 uppercase font-bold tracking-wider mb-1 transition-colors">Location</p>
                                <p className="text-xl text-slate-900 font-medium">
                                    {getLocationText()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Google Map */}
                    <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
                        {(contactInfo?.Location || userLocation) ? (
                            <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={getMapUrl()}
                                title="Location Map"
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <p className="text-slate-400">Loading map...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-2xl font-bold text-slate-900 mb-6">Edit Contact Info</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.Email}
                                    onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">GitHub</label>
                                <input
                                    type="text"
                                    value={formData.GitHub}
                                    onChange={(e) => setFormData({ ...formData, GitHub: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="github.com/username"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn</label>
                                <input
                                    type="text"
                                    value={formData.LinkedIn}
                                    onChange={(e) => setFormData({ ...formData, LinkedIn: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="linkedin.com/in/username"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => handleStateInput(e.target.value)}
                                        onFocus={() => formData.state && handleStateInput(formData.state)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    {stateSuggestions.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {stateSuggestions.map((suggestion, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        setFormData({ ...formData, state: suggestion });
                                                        setStateSuggestions([]);
                                                    }}
                                                    className="px-4 py-2 hover:bg-purple-50 cursor-pointer text-sm"
                                                >
                                                    {suggestion}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={closeModal}
                                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};