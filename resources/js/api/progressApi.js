import api from './axios';

export async function getProgressLogs() {
    const res = await api.get('/admin/progress-logs');
    return res.data.logs;
}

export async function toggleVisibility(id, isVisible) {
    const res = await api.patch(`/admin/progress-logs/${id}/visibility`, {
        is_visible_to_client: isVisible,
    });
    return res.data;
}