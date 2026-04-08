(function () {
    const TOKEN_KEY = 'focusGridToken';
    const USER_KEY = 'focusGridUser';
    const LEGACY_USER_ID_KEY = 'user_id';

    function getPathname() {
        return (window.location && window.location.pathname) || '';
    }

    function getPageName() {
        const pathname = getPathname();
        const parts = pathname.split('/').filter(Boolean);
        return parts.length ? parts[parts.length - 1].toLowerCase() : '';
    }

    function isAuthPage() {
        const page = getPageName();
        return page === 'login.html' || page === 'reg.html';
    }

    function isFeaturePage() {
        return getPathname().includes('/features/');
    }

    function isProtectedPage() {
        return isFeaturePage() && !isAuthPage();
    }

    function getLoginPath() {
        const pathname = getPathname();
        if (pathname.includes('/features/start/')) return 'login.html';
        if (pathname.includes('/features/')) return '../start/login.html';
        return 'features/start/login.html';
    }

    function getDashboardPath() {
        const pathname = getPathname();
        if (pathname.includes('/features/start/')) return 'dashboard.html';
        if (pathname.includes('/features/')) return '../start/dashboard.html';
        return 'features/start/dashboard.html';
    }

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function getCurrentUser() {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;

        try {
            return JSON.parse(raw);
        } catch (error) {
            console.error('Invalid saved user session:', error);
            return null;
        }
    }

    function getUserId() {
        const user = getCurrentUser();
        if (user && user.id) return Number(user.id);

        const legacyUserId = localStorage.getItem(LEGACY_USER_ID_KEY);
        return legacyUserId ? Number(legacyUserId) : null;
    }

    function hasSession() {
        return Boolean(getToken() && getUserId());
    }

    function setSession(token, user) {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            if (user.id) localStorage.setItem(LEGACY_USER_ID_KEY, String(user.id));
        }
    }

    function clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(LEGACY_USER_ID_KEY);
    }

    function redirectToLogin() {
        window.location.replace(getLoginPath());
    }

    function redirectToDashboard() {
        window.location.replace(getDashboardPath());
    }

    function requireAuth() {
        if (!hasSession()) {
            clearSession();
            redirectToLogin();
            return false;
        }
        return true;
    }

    function redirectIfAuthenticated() {
        if (hasSession()) {
            redirectToDashboard();
            return true;
        }
        return false;
    }

    function attachLogoutHandlers() {
        document.addEventListener('click', (event) => {
            const target = event.target.closest('[data-auth-logout]');
            if (!target) return;

            event.preventDefault();
            clearSession();
            redirectToLogin();
        });
    }

    function patchFetchWithAuthHeader() {
        if (window.__focusGridFetchWrapped) return;
        if (typeof window.fetch !== 'function') return;

        const originalFetch = window.fetch.bind(window);

        window.fetch = async function (input, init = {}) {
            const token = getToken();
            const requestInit = { ...init };
            const baseHeaders = input instanceof Request ? input.headers : undefined;
            const headers = new Headers(requestInit.headers || baseHeaders || {});

            if (token && !headers.has('Authorization')) {
                headers.set('Authorization', `Bearer ${token}`);
            }

            requestInit.headers = headers;

            let response;
            if (input instanceof Request) {
                response = await originalFetch(new Request(input, requestInit));
            } else {
                response = await originalFetch(input, requestInit);
            }

            if (response.status === 401 && isProtectedPage()) {
                clearSession();
                redirectToLogin();
            }

            return response;
        };

        window.__focusGridFetchWrapped = true;
    }

    window.FocusGridAuth = {
        getToken,
        getCurrentUser,
        getUserId,
        hasSession,
        setSession,
        clearSession,
        requireAuth,
        redirectIfAuthenticated,
        redirectToLogin,
        redirectToDashboard
    };

    patchFetchWithAuthHeader();
    attachLogoutHandlers();

    if (isProtectedPage()) {
        requireAuth();
    } else if (isAuthPage()) {
        redirectIfAuthenticated();
    }
})();
