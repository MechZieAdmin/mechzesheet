import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { getStatusColor, getStatusLabel, formatDate } from '../../lib/utils';
import { ClipboardList, Check, X, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface LeaveRequest {
 id: number;
 employeeId: number;
 employeeName: string;
 employeeCode: string;
 department: string;
 leaveTypeName: string;
 startDate: string;
 endDate: string;
 reason: string;
 status: string;
 reviewerComment: string | null;
 reviewedAt: string | null;
 createdAt: string;
}

export default function AdminLeaves() {
 const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
 const [requests, setRequests] = useState<LeaveRequest[]>([]);
 const [loading, setLoading] = useState(true);
 const [reviewModal, setReviewModal] = useState<LeaveRequest | null>(null);

 const fetchRequests = async () => {
 setLoading(true);
 try {
 const endpoint = tab === 'all' ? '/leaves/all' :`/leaves/pending?status=${tab}`;
 const res = await api.get(endpoint);
 setRequests(res.data);
 } catch {
 toast.error('Failed to load leave requests');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => { fetchRequests(); }, [tab]);

 const tabs = [
 { key: 'pending' as const, label: 'Pending', count: requests.length },
 { key: 'approved' as const, label: 'Approved' },
 { key: 'rejected' as const, label: 'Rejected' },
 { key: 'all' as const, label: 'All Requests' },
 ];

 return (
 <div className="space-y-6">
 <div>
 <h1 className="text-2xl font-bold text-white">Leave Management</h1>
 <p className="text-gpt-muted mt-1">Review and manage employee leave requests</p>
 </div>

 {/* Tabs */}
 <div className="flex gap-1 bg-gpt-panel p-1 rounded-xl w-fit">
 {tabs.map((t) => (
 <button
 key={t.key}
 onClick={() => setTab(t.key)}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
 tab === t.key
 ? 'bg-gpt-panel text-white shadow-sm'
 : 'text-gpt-muted hover:text-gpt-muted'
 }`}
 >
 {t.label}
 </button>
 ))}
 </div>

 {/* Leave requests */}
 {loading ? (
 <div className="space-y-4">
 {[...Array(3)].map((_, i) => (
 <div key={i} className="card"><div className="skeleton h-24" /></div>
 ))}
 </div>
 ) : requests.length === 0 ? (
 <div className="card text-center py-12">
 <ClipboardList className="w-12 h-12 text-gpt-muted mx-auto mb-3" />
 <p className="text-gpt-muted font-medium">No {tab} leave requests</p>
 </div>
 ) : (
 <div className="space-y-3">
 {requests.map((req) => (
 <div key={req.id} className="card p-5 hover:shadow-card-hover transition-shadow">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-2">
 <h3 className="font-semibold text-white">{req.employeeName}</h3>
 <span className="font-mono text-xs bg-gpt-panel px-2 py-0.5 rounded">{req.employeeCode}</span>
 <span className="text-xs text-gpt-muted">{req.department}</span>
 </div>
 <div className="flex flex-wrap items-center gap-4 text-sm text-gpt-muted mb-2">
 <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
 {req.leaveTypeName}
 </span>
 <span>{formatDate(req.startDate)} — {formatDate(req.endDate)}</span>
 <span className="text-gpt-muted">
 ({Math.ceil((new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
 </span>
 </div>
 <p className="text-sm text-gpt-muted">{req.reason}</p>
 {req.reviewerComment && (
 <p className="text-sm text-gpt-muted mt-2 flex items-start gap-1.5">
 <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
 <span className="italic">{req.reviewerComment}</span>
 </p>
 )}
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <span className={getStatusColor(req.status)}>{getStatusLabel(req.status)}</span>
 {req.status === 'pending' && (
 <>
 <button
 onClick={() => setReviewModal(req)}
 className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
 title="Review"
 >
 <Check className="w-4 h-4" />
 </button>
 </>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Review Modal */}
 {reviewModal && (
 <LeaveReviewModal
 request={reviewModal}
 onClose={() => setReviewModal(null)}
 onSuccess={() => { setReviewModal(null); fetchRequests(); }}
 />
 )}
 </div>
 );
}

function LeaveReviewModal({
 request,
 onClose,
 onSuccess,
}: {
 request: LeaveRequest;
 onClose: () => void;
 onSuccess: () => void;
}) {
 const [comment, setComment] = useState('');
 const [submitting, setSubmitting] = useState(false);

 const handleReview = async (status: 'approved' | 'rejected') => {
 setSubmitting(true);
 try {
 await api.put(`/leaves/${request.id}/review`, { status, comment });
 toast.success(`Leave request ${status}`);
 onSuccess();
 } catch (err: any) {
 toast.error(err.response?.data?.error || 'Failed to update');
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
 <div className="bg-gpt-panel rounded-xl p-6 max-w-md w-full shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
 <h3 className="text-lg font-semibold mb-4">Review Leave Request</h3>
 <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
 <div><span className="text-gpt-muted">Employee:</span> <span className="font-medium">{request.employeeName}</span></div>
 <div><span className="text-gpt-muted">Type:</span> <span className="font-medium">{request.leaveTypeName}</span></div>
 <div><span className="text-gpt-muted">Dates:</span> <span className="font-medium">{formatDate(request.startDate)} — {formatDate(request.endDate)}</span></div>
 <div><span className="text-gpt-muted">Reason:</span> <span>{request.reason}</span></div>
 </div>
 <div className="mb-4">
 <label className="label">Comment (optional)</label>
 <textarea
 value={comment} onChange={(e) => setComment(e.target.value)}
 placeholder="Add a comment..."
 className="input-field h-20 resize-none"
 />
 </div>
 <div className="flex gap-3 justify-end">
 <button onClick={onClose} className="btn-secondary" disabled={submitting}>Cancel</button>
 <button onClick={() => handleReview('rejected')} className="btn-danger" disabled={submitting}>
 <X className="w-4 h-4" /> Reject
 </button>
 <button onClick={() => handleReview('approved')} className="btn-primary" disabled={submitting}>
 <Check className="w-4 h-4" /> Approve
 </button>
 </div>
 </div>
 </div>
 );
}
