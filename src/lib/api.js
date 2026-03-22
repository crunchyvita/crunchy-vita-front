// API base URL - adjust this to match your backend URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  console.log(`[API] Making ${options.method || 'GET'} request to: ${url}`);
  
  const defaultHeaders = {};

  // Only set JSON content type when body is not FormData
  if (!(options.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  // Add auth token if available (client-side only)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem("token");
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const config = {
    ...options,
    credentials: 'include', // CRITICAL: Include cookies (guestId, session)
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Try to parse error response
      let errorMessage = "An error occurred";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        // If JSON parsing fails, use status text or status code
        errorMessage = response.statusText || `HTTP ${response.status}` || errorMessage;
      }
      // Ensure errorMessage is always a string and not empty
      if (typeof errorMessage !== 'string' || !errorMessage.trim()) {
        errorMessage = `HTTP ${response.status}: An error occurred`;
      }
      
      // Create error with proper message
      const error = new Error(errorMessage.trim());
      
      // Safely add additional properties
      if (response.status) {
        error.status = response.status;
      }
      if (response.statusText) {
        error.statusText = response.statusText;
      }
      error.url = url; // Include URL for debugging
      
      throw error;
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data;
    } else {
      // Return empty object for non-JSON responses
      return {};
    }
  } catch (error) {
    console.log(`[API] Request to ${url} failed:`, error.message);
    // Re-throw with additional context if it's a network error
    if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      const networkError = new Error('Network error: Unable to connect to server');
      networkError.status = 0;
      networkError.statusText = 'Network Error';
      networkError.url = url;
      throw networkError;
    }
    // Ensure error has a message
    if (!error.message) {
      error.message = 'An unexpected error occurred';
    }
    throw error;
  }
}

// Auth API functions
export const authAPI = {
  // Register user
  register: async (name, email, password) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  // Login user
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Get current user
  getMe: async () => {
    return apiRequest('/auth/me', {
      method: 'GET',
    });
  },

  // Forgot password
  forgotPassword: async (email) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password
  resetPassword: async (resetToken, password) => {
    return apiRequest(`/auth/reset-password/${resetToken}`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
  },

  // Update password
  updatePassword: async (currentPassword, newPassword) => {
    return apiRequest('/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Google OAuth URL
  getGoogleAuthUrl: () => {
    return `${API_URL}/auth/google`;
  },
};

// Product API functions
export const productAPI = {
  list: async () => apiRequest("/products", { method: "GET" }),

  getById: async (id) => apiRequest(`/products/${id}`, { method: "GET" }),

  // Get all available tags (public/shared across all products)
  getAllTags: async () => apiRequest("/products/tags", { method: "GET" }),

  // Search tags for autocomplete (searches across all products)
  searchTags: async (query) => {
    if (!query || !query.trim()) {
      // If no query, return all tags
      return apiRequest("/products/tags", { method: "GET" });
    }
    return apiRequest(`/products/tags/search?q=${encodeURIComponent(query.trim())}`, { method: "GET" });
  },

  create: async (payload) => {
    const formData = new FormData();

    formData.append("name", payload.name);
    formData.append("price", payload.price);
    formData.append("stock", payload.stock);
    
    // Categories can be IDs and/or names
    if (Array.isArray(payload.categoryIds) && payload.categoryIds.length > 0) {
      formData.append("categoryIds", JSON.stringify(payload.categoryIds));
    } else if (payload.category) {
      formData.append("category", payload.category);
    }
    
    formData.append("description", payload.description || "");

    ["width", "height", "depth", "weight"].forEach((field) => {
      if (payload[field] !== undefined) {
        formData.append(field, payload[field] ?? "");
      }
    });

    if (payload.nutrition) {
      formData.append("nutrition", JSON.stringify(payload.nutrition));
    }
    
    // Tags as comma-separated string
    if (payload.tags) {
      formData.append("tags", payload.tags);
    }

    if (payload.showInShop !== undefined) {
      formData.append("showInShop", String(payload.showInShop));
    }

    (payload.files || []).forEach((file) => {
      formData.append("images", file);
    });

    return apiRequest("/products", {
      method: "POST",
      body: formData,
    });
  },
 update: async (id, payload) => {
  // If payload is FormData, use it directly
  if (payload instanceof FormData) {
    return apiRequest(`/products/${id}`, { 
      method: "PUT", 
      body: payload 
    });
  }
  
  // Otherwise, handle as JSON
  return apiRequest(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
},
// Delete product
delete: async (id) => apiRequest(`/products/${id}`, { method: "DELETE" }),

// Delete comment/review (client - own comments only)
deleteComment: async (productId, commentId) => 
  apiRequest(`/reviews/products/${productId}/comments/${commentId}`, { method: "DELETE" }),

// Delete comment/review (admin - any comment)
deleteCommentAsAdmin: async (productId, commentId) => 
  apiRequest(`/reviews/products/${productId}/comments/${commentId}/admin`, { method: "DELETE" }),

// Add rating to product
addRating: async (productId, rating) => 
  apiRequest(`/reviews/products/${productId}/ratings`, {
    method: "POST",
    body: JSON.stringify({ rating }),
  }),

// Add comment to product
addComment: async (productId, content, isAnonymous = false) => 
  apiRequest(`/reviews/products/${productId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content, isAnonymous }),
  }),

// Add review (rating and/or comment) to product
addReview: async (productId, rating, content, isAnonymous = false) => 
  apiRequest(`/reviews/products/${productId}`, {
    method: "POST",
    body: JSON.stringify({ rating, content, isAnonymous }),
  }),
};

// Review API functions
export const reviewAPI = {
  // Add review to a product
  create: async (productId, { rating, content, isAnonymous }) =>
    apiRequest(`/reviews/products/${productId}`, {
      method: "POST",
      body: JSON.stringify({ rating, content, isAnonymous }),
    }),

  // Add rating only
  addRating: async (productId, rating) =>
    apiRequest(`/reviews/products/${productId}/ratings`, {
      method: "POST",
      body: JSON.stringify({ rating }),
    }),

  // Add comment only
  addComment: async (productId, content, isAnonymous = false) =>
    apiRequest(`/reviews/products/${productId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content, isAnonymous }),
    }),

  // Delete own comment (CLIENT)
  deleteOwn: async (productId, commentId) =>
    apiRequest(`/reviews/products/${productId}/comments/${commentId}`, { method: "DELETE" }),

  // Delete any comment (ADMIN)
  deleteAsAdmin: async (productId, commentId) =>
    apiRequest(`/reviews/products/${productId}/comments/${commentId}/admin`, { method: "DELETE" }),

  // List pending comments for moderation (ADMIN)
  listPending: async () => apiRequest(`/reviews/comments/pending`, { method: "GET" }),

  // List approved comments (ADMIN)
  listApproved: async () => apiRequest(`/reviews/comments/approved`, { method: "GET" }),

  // Approve a pending comment (ADMIN)
  approve: async (productId, commentId) =>
    apiRequest(`/reviews/products/${productId}/comments/${commentId}/approve`, { method: "PATCH" }),

  // Reject/delete a pending comment (ADMIN)
  reject: async (productId, commentId) =>
    apiRequest(`/reviews/products/${productId}/comments/${commentId}/reject`, { method: "PATCH" }),
};

// Category API functions
export const categoryAPI = {
  // Get all categories
  list: async () => apiRequest("/categories", { method: "GET" }),

  // Search categories for autocomplete
  search: async (query) => apiRequest(`/categories/search?q=${encodeURIComponent(query)}`, { method: "GET" }),

  // Create new category (admin)
  create: async (payload) => {
    return apiRequest("/categories", {
      method: "POST",
      body: JSON.stringify({ name: payload.name }),
    });
  },

  // Update category (admin)
  update: async (id, payload) => {
    return apiRequest(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name: payload.name }),
    });
  },

  // Delete category (admin)
  remove: async (id) =>
    apiRequest(`/categories/${id}`, {
      method: "DELETE",
    }),
};

// Stock API functions
export const stockAPI = {
  // Get all stocks with product info
  list: async () => apiRequest("/stocks", { method: "GET" }),

  // Get stock for a specific product
  getByProductId: async (productId) =>
    apiRequest(`/products/${productId}/stock`, { method: "GET" }),

  // Update stock (quantity, reserved, alertThreshold)
  update: async (productId, payload) =>
    apiRequest(`/products/${productId}/stock`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  // Adjust quantity (IN/OUT)
  adjustQuantity: async (productId, quantity, type = "IN") =>
    apiRequest(`/products/${productId}/stock`, {
      method: "PUT",
      body: JSON.stringify({ quantity, type }),
    }),

  // Reserve stock for cart
  reserve: async (productId, quantity) =>
    apiRequest(`/products/${productId}/stock/reserve`, {
      method: "POST",
      body: JSON.stringify({ quantity }),
    }),

  // Release reserved stock (cart removal)
  release: async (productId, quantity) =>
    apiRequest(`/products/${productId}/stock/release`, {
      method: "POST",
      body: JSON.stringify({ quantity }),
    }),

  // Finalize reserved stock (checkout)
  finalize: async (productId, quantity) =>
    apiRequest(`/products/${productId}/stock/finalize`, {
      method: "POST",
      body: JSON.stringify({ quantity }),
    }),
};

// Payment API functions
export const paymentAPI = {
  createCheckoutSession: async (payload) =>
    apiRequest('/payment/checkout-session', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createPaymentIntent: async (payload) =>
    apiRequest('/payment/payment-intent', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// Contact/Message API functions
export const messageAPI = {
  list: async () => apiRequest('/contact', { method: 'GET' }),

  getById: async (id) => apiRequest(`/contact/${id}`, { method: 'GET' }),

  updateStatus: async (id, status) =>
    apiRequest(`/contact/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  delete: async (id) => apiRequest(`/contact/${id}`, { method: 'DELETE' }),

  reply: async (id, replyMessage) =>
    apiRequest(`/contact/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message: replyMessage }),
    }),

 
};


// Notification API functions
export const notificationAPI = {
  // Get all notifications for current user
  list: async (limit = 50, isRead = null, excludeContactMessages = true) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (isRead !== null) {
      params.append('isRead', isRead.toString());
    }
    if (excludeContactMessages) {
      params.append('excludeContactMessages', 'true');
    }
    return apiRequest(`/notifications?${params.toString()}`, { method: "GET" });
  },

  // Get unread notification count
  getUnreadCount: async (excludeContactMessages = true) => {
    const params = new URLSearchParams();
    if (excludeContactMessages) {
      params.append('excludeContactMessages', 'true');
    }
    return apiRequest(`/notifications/unread/count?${params.toString()}`, { method: "GET" });
  },

  // Get single notification by ID
  getById: async (id) => 
    apiRequest(`/notifications/${id}`, { method: "GET" }),

  // Mark notification as read
  markAsRead: async (id) =>
    apiRequest(`/notifications/${id}/read`, {
      method: "PUT",
    }),

  // Mark notification as unread
  markAsUnread: async (id) =>
    apiRequest(`/notifications/${id}/unread`, {
      method: "PUT",
    }),

  // Mark all notifications as read
  markAllAsRead: async () =>
    apiRequest("/notifications/read/all", {
      method: "PUT",
    }),

  // Delete notification
  delete: async (id) => 
    apiRequest(`/notifications/${id}`, { method: "DELETE" }),

  // Delete all notifications
  deleteAll: async () =>
    apiRequest("/notifications/all", { method: "DELETE" }),
};

// Blog API functions
export const blogAPI = {
  // Get all blogs (public)
  list: async () => apiRequest("/blogs", { method: "GET" }),

  // Get all blogs (admin)
  listAdmin: async () => apiRequest("/blogs/admin/all", { method: "GET" }),

  // Get single blog by ID (public)
  getById: async (id) => apiRequest(`/blogs/${id}`, { method: "GET" }),

  // Get single blog by ID (admin)
  getByIdAdmin: async (id) => apiRequest(`/blogs/admin/${id}`, { method: "GET" }),

  // Create blog (admin only)
  create: async (payload) => {
    const formData = new FormData();
    
    formData.append("title", payload.title);
    formData.append("content", payload.content);
    
    if (Array.isArray(payload.images)) {
      payload.images.filter(Boolean).forEach((file) => {
        formData.append("images", file);
      });
    }

    if (payload.image) {
      formData.append("image", payload.image);
    }

    return apiRequest("/blogs", {
      method: "POST",
      body: formData,
    });
  },

  // Update blog (admin only)
  update: async (id, payload) => {
    const formData = new FormData();
    
    if (payload.title) formData.append("title", payload.title);
    if (payload.content) formData.append("content", payload.content);
    if (payload.publicationDate) formData.append("publicationDate", payload.publicationDate);
    if (payload.creationDate) formData.append("creationDate", payload.creationDate);
    if (payload.isPublished !== undefined) formData.append("isPublished", payload.isPublished);
    if (payload.isArchived !== undefined) formData.append("isArchived", payload.isArchived);
    if (payload.image) formData.append("image", payload.image);

    return apiRequest(`/blogs/${id}`, {
      method: "PUT",
      body: formData,
    });
  },

  // Delete blog (admin only)
  delete: async (id) => apiRequest(`/blogs/${id}`, { method: "DELETE" }),
};

// SuperAdmin administrator management API functions
export const adminManagementAPI = {
  listAdmins: async () => apiRequest('/users/admins', { method: 'GET' }),

  promoteClientByEmail: async (email) =>
    apiRequest('/users/admins/promote', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  createAdmin: async (payload) =>
    apiRequest('/users/admins', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAdmin: async (id, payload) =>
    apiRequest(`/users/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  resetAdminPassword: async (id, password) =>
    apiRequest(`/users/admins/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    }),

  updateAdminStatus: async (id, isActive) =>
    apiRequest(`/users/admins/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    }),

  deleteAdmin: async (id) =>
    apiRequest(`/users/admins/${id}`, {
      method: 'DELETE',
    }),

  downgradeAdmin: async (id) =>
    apiRequest(`/users/admins/${id}/downgrade`, {
      method: 'PUT',
    }),

  listClients: async () => apiRequest('/users/clients', { method: 'GET' }),

  searchClients: async (query) =>
    apiRequest(`/users/clients/search?query=${encodeURIComponent(query)}`, { method: 'GET' }),

  updateClientStatus: async (id, isActive) =>
    apiRequest(`/users/clients/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    }),
};
