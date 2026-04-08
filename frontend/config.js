// API Configuration
// Update this value based on your deployment environment
// const API_BASE_URL = 'http://localhost:5000';

const API_BASE_URL = 'https://focus-grid-9hg4.onrender.com';
//https://focus-grid-9hg4.onrender.com

// API Endpoints
const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    ENDPOINTS: {
        AUTH: {
            LOGIN: `${API_BASE_URL}/login`,
            REGISTER: `${API_BASE_URL}/register`,
        },
        DASHBOARD: `${API_BASE_URL}/api/dashboard`,
        TASKS: `${API_BASE_URL}/api/tasks`,
        ROUTINES: `${API_BASE_URL}/api/routines`,
        TIMETABLE: `${API_BASE_URL}/api/timetable`,
        ATTENDANCE: `${API_BASE_URL}/api`,
        SUBJECTS: `${API_BASE_URL}/api`,
        USER: {
            PROFILE: `${API_BASE_URL}/api/user/profile`,
            UPDATE_PROFILE: `${API_BASE_URL}/api/user/update-profile`,
        }
    }
};
