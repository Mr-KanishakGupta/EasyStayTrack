// API Base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Helper function to get auth token
const getToken = () => {
    return localStorage.getItem("auth_token");
};

// Helper function to make authenticated requests
const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(error.error || error.message || "Request failed");
    }

    return response.json();
};

// Authentication functions
export const auth = {
    register: async (userData: {
        email: string;
        password: string;
        full_name: string;
        phone: string;
        aadhaar?: string;
        role?: string;
    }) => {
        return authFetch(`${API_URL}/users/register`, {
            method: "POST",
            body: JSON.stringify(userData),
        });
    },

    sendOTP: async (email: string) => {
        return authFetch(`${API_URL}/users/send-otp`, {
            method: "POST",
            body: JSON.stringify({ email }),
        });
    },

    verifyOTP: async (email: string, otp: string) => {
        const data = await authFetch(`${API_URL}/users/verify-otp`, {
            method: "POST",
            body: JSON.stringify({ email, otp }),
        });

        // Store token in localStorage
        if (data.token) {
            localStorage.setItem("auth_token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
        }

        return data;
    },

    resendOTP: async (email: string) => {
        return authFetch(`${API_URL}/users/resend-otp`, {
            method: "POST",
            body: JSON.stringify({ email }),
        });
    },

    getCurrentUser: async () => {
        return authFetch(`${API_URL}/users/me`);
    },

    updateProfile: async (profileData: { full_name?: string; phone?: string }) => {
        return authFetch(`${API_URL}/users/profile`, {
            method: "PUT",
            body: JSON.stringify(profileData),
        });
    },

    logout: () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
    },

    isAuthenticated: () => {
        return !!getToken();
    },

    getUser: () => {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    },
};

// Property functions
export const properties = {
    getAll: async (filters?: {
        location?: string;
        gender_preference?: string;
        min_price?: number;
        max_price?: number;
        owner_id?: string;
    }) => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value.toString());
            });
        }
        return authFetch(`${API_URL}/properties?${params.toString()}`);
    },

    getById: async (id: string) => {
        return authFetch(`${API_URL}/properties/${id}`);
    },

    create: async (formData: FormData) => {
        const token = getToken();
        const headers: Record<string, string> = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/properties`, {
            method: "POST",
            headers,
            body: formData, // FormData for image upload
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: "Request failed" }));
            throw new Error(error.error || "Failed to create property");
        }

        return response.json();
    },

    update: async (id: string, propertyData: any) => {
        return authFetch(`${API_URL}/properties/${id}`, {
            method: "PUT",
            body: JSON.stringify(propertyData),
        });
    },

    addImages: async (id: string, formData: FormData) => {
        const token = getToken();
        const headers: Record<string, string> = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/properties/${id}/images`, {
            method: "PUT",
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: "Request failed" }));
            throw new Error(error.error || "Failed to add images");
        }

        return response.json();
    },

    deleteImage: async (propertyId: string, imageId: string) => {
        return authFetch(`${API_URL}/properties/${propertyId}/images/${imageId}`, {
            method: "DELETE",
        });
    },

    setThumbnail: async (propertyId: string, imageId: string) => {
        return authFetch(`${API_URL}/properties/${propertyId}/thumbnail/${imageId}`, {
            method: "PUT",
        });
    },

    delete: async (id: string) => {
        return authFetch(`${API_URL}/properties/${id}`, {
            method: "DELETE",
        });
    },

    getLocationStats: async () => {
        return authFetch(`${API_URL}/properties/stats/locations`);
    },
};

// Booking functions
export const bookings = {
    getAll: async (filters?: { user_id?: string; property_id?: string; owner_id?: string }) => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
        }
        return authFetch(`${API_URL}/bookings?${params.toString()}`);
    },

    getById: async (id: string) => {
        return authFetch(`${API_URL}/bookings/${id}`);
    },

    create: async (bookingData: {
        property_id: string;
        message?: string;
        phone?: string;
        booking_date?: string;
        duration?: number;
        special_requests?: string;
    }) => {
        return authFetch(`${API_URL}/bookings`, {
            method: "POST",
            body: JSON.stringify(bookingData),
        });
    },

    updateStatus: async (id: string, status: "confirmed" | "rejected") => {
        return authFetch(`${API_URL}/bookings/${id}/status`, {
            method: "PUT",
            body: JSON.stringify({ status }),
        });
    },

    update: async (id: string, bookingData: any) => {
        return authFetch(`${API_URL}/bookings/${id}`, {
            method: "PUT",
            body: JSON.stringify(bookingData),
        });
    },

    delete: async (id: string) => {
        return authFetch(`${API_URL}/bookings/${id}`, {
            method: "DELETE",
        });
    },
};

// Notification functions
export const notifications = {
    getAll: async () => {
        return authFetch(`${API_URL}/notifications`);
    },

    getUnreadCount: async () => {
        return authFetch(`${API_URL}/notifications/unread`);
    },

    markAsRead: async (id: string) => {
        return authFetch(`${API_URL}/notifications/${id}/read`, {
            method: "PUT",
        });
    },

    markAllAsRead: async () => {
        return authFetch(`${API_URL}/notifications/read-all`, {
            method: "PUT",
        });
    },

    delete: async (id: string) => {
        return authFetch(`${API_URL}/notifications/${id}`, {
            method: "DELETE",
        });
    },
};
