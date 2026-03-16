import api from './api';

export const raiseIssue = async (payload) => await api.post('/issues', payload);
export const getMyIssues = async () => await api.get('/issues/my-issues');
export const getCoopIssues = async () => await api.get('/issues/coop');
export const resolveIssue = async (id) => await api.patch(`/issues/${id}/resolve`);
