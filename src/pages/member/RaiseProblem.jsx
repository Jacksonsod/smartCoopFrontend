import { useEffect, useState } from 'react';
import { raiseIssue, getMyIssues } from '@/services/issueService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const RaiseProblem = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await getMyIssues();
      setMyIssues(extractList(res?.data));
    } catch {
      setMyIssues([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await raiseIssue({ title, description });
      setSuccess('Your problem has been submitted successfully!');
      setTitle('');
      setDescription('');
      fetchIssues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit problem.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report a Problem</CardTitle>
        </CardHeader>
        <CardContent>
          {success && <div className="mb-3 text-green-600">{success}</div>}
          {error && <div className="mb-3 text-red-600">{error}</div>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="title">Problem Title</Label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="Enter problem title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Describe your problem"
                rows={4}
              />
            </div>
            <div className="flex items-center justify-end gap-3 mt-4">
              <Button type="submit" className="bg-emerald-600 text-white" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>My Reported Problems</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-20 items-center justify-center text-gray-500">Loading issues...</div>
          ) : myIssues.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">No problems reported yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-md">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Title</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myIssues.map(issue => (
                    <tr key={issue.id} className="border-b last:border-b-0">
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {new Date(issue.createdAt || issue.issueDate).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{issue.title}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${issue.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{issue.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RaiseProblem;

