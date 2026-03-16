import { useEffect, useState } from 'react';
import { getCoopIssues, resolveIssue } from '@/services/issueService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const AdminHelpdesk = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState(null);

  const fetchIssues = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getCoopIssues();
      setIssues(Array.isArray(res.data) ? res.data : res.data?.content || res.data?.data || []);
    } catch (err) {
      setError('Failed to fetch issues.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleResolve = async (id) => {
    setResolvingId(id);
    setSuccess('');
    setError('');
    try {
      await resolveIssue(id);
      setSuccess('Issue marked as resolved!');
      fetchIssues();
    } catch (err) {
      setError('Failed to resolve issue.');
    }
    setResolvingId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Member Issues Helpdesk</CardTitle>
        </CardHeader>
        <CardContent>
          {success && <div className="mb-3 text-green-600">{success}</div>}
          {error && <div className="mb-3 text-red-600">{error}</div>}
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-md">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Member Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
                ) : issues.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">No issues found.</td></tr>
                ) : (
                  issues.map(issue => (
                    <tr key={issue.id} className="border-b last:border-b-0">
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {new Date(issue.createdAt || issue.issueDate).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{issue.memberName || issue.member?.name || issue.user?.fullName || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{issue.title}</td>
                      <td className="px-4 py-2 text-sm text-gray-700 max-w-xs truncate" title={issue.description}>{issue.description}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${issue.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{issue.status}</span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {issue.status === 'OPEN' ? (
                          <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            disabled={resolvingId === issue.id}
                            onClick={() => handleResolve(issue.id)}
                          >
                            {resolvingId === issue.id ? 'Marking...' : 'Mark as Resolved'}
                          </Button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Separator />
    </div>
  );
};

export default AdminHelpdesk;

