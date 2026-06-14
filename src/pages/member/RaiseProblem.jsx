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

  const isLegacy = localStorage.getItem("designMode") === "legacy";

  if (isLegacy) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Report a Problem</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Submit any issues or concerns to cooperative administrators.
          </p>
        </div>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="pb-3 border-b dark:border-gray-800">
            <CardTitle className="text-gray-900 dark:text-white">New Issue Ticket</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {success && (
              <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-950/20 p-3.5 text-sm font-medium text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50">
                {success}
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/20 p-3.5 text-sm font-medium text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                {error}
              </div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">Problem Title</Label>
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
                <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-800 dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white"
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
        <Separator className="dark:bg-gray-800" />
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="pb-3 border-b dark:border-gray-800">
            <CardTitle className="text-gray-900 dark:text-white">My Reported Problems</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="flex h-20 items-center justify-center text-gray-500 dark:text-gray-400">Loading issues...</div>
            ) : myIssues.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No problems reported yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 dark:border-gray-800 rounded-md">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-650 dark:text-gray-400">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-650 dark:text-gray-400">Title</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-650 dark:text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myIssues.map(issue => (
                      <tr key={issue.id} className="border-b dark:border-gray-800 last:border-b-0">
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(issue.createdAt || issue.issueDate).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{issue.title}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            issue.status === 'RESOLVED' 
                              ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' 
                              : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400'
                          }`}>{issue.status}</span>
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
  }

  // ─── Modernized Render ────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-950 dark:text-white tracking-tight">Report a Problem</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Submit any issues or concerns to cooperative administrators.
        </p>
      </div>

      <Card className="border border-gray-150 dark:border-gray-800 rounded-xl shadow-xs bg-white dark:bg-gray-900">
        <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800">
          <CardTitle className="text-base font-bold text-gray-950 dark:text-white">New Issue Ticket</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {success && (
            <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-3.5 text-xs font-semibold text-emerald-700 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/55">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/25 p-3.5 text-xs font-semibold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/55">
              {error}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold text-gray-800 dark:text-gray-300">Problem Title</Label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="Brief summary of the issue..."
                className="rounded-xl border-gray-250 dark:border-gray-800 focus-visible:ring-emerald-500/25 text-xs h-9.5 text-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold text-gray-800 dark:text-gray-300">Description</Label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-250 dark:border-gray-800 bg-transparent dark:bg-gray-950 px-3.5 py-2.5 text-xs outline-none transition-all focus-visible:ring-2 focus-visible:ring-emerald-500/25 focus-visible:border-emerald-500 placeholder:text-gray-400 text-gray-900 dark:text-white"
                placeholder="Please describe the problem in detail so we can resolve it."
                rows={5}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs px-6 font-bold text-xs h-9.5" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting Ticket...' : 'Submit Issue'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator className="my-6 dark:bg-gray-800" />

      {/* Reported Problems Card */}
      <Card className="border border-gray-150 dark:border-gray-800 rounded-xl shadow-xs bg-white dark:bg-gray-900">
        <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800">
          <CardTitle className="text-base font-bold text-gray-950 dark:text-white">My Ticket History</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-0">
          {loading ? (
            <div className="flex h-24 items-center justify-center text-sm text-gray-400 dark:text-gray-500">Loading issues...</div>
          ) : myIssues.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No problems reported yet.</div>
          ) : (
            <>
              {/* Desktop view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                  <thead className="bg-gray-50/75 dark:bg-gray-800/70">
                    <tr>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Date</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Title</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-800">
                    {myIssues.map(issue => (
                      <tr key={issue.id} className="hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 transition-colors">
                        <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(issue.createdAt || issue.issueDate).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-gray-900 dark:text-gray-100">{issue.title}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                            issue.status === 'RESOLVED' 
                              ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 ring-green-600/10 dark:ring-green-500/20' 
                              : 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 ring-yellow-600/10 dark:ring-yellow-500/20'
                          }`}>
                            {issue.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                {myIssues.map(issue => (
                  <div key={issue.id} className="p-4 space-y-2 dark:bg-gray-900">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{issue.title}</p>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                        issue.status === 'RESOLVED' 
                          ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 ring-green-600/10 dark:ring-green-500/20' 
                          : 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 ring-yellow-600/10 dark:ring-yellow-500/20'
                      }`}>
                        {issue.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      {new Date(issue.createdAt || issue.issueDate).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RaiseProblem;

