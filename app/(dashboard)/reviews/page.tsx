"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star, Search, Loader, MessageSquare, TrendingUp, ThumbsUp, Reply, X, Send,
} from 'lucide-react';
import apiClient from '@/lib/api/api-client';

interface Review {
  id: string;
  customer: string;
  customerAvatar: string | null;
  rating: number;
  comment: string;
  status: 'published' | 'flagged' | 'responded';
  date: string;
  bookingId: string;
  serviceName: string;
  providerReply: string | null;
  helpfulCount: number;
}

const STATUS_CONFIG: Record<Review['status'], { label: string; bg: string; text: string }> = {
  published: { label: 'Pending Reply', bg: 'bg-amber-100', text: 'text-amber-700' },
  responded: { label: 'Responded', bg: 'bg-green-100', text: 'text-green-700' },
  flagged: { label: 'Needs Attention', bg: 'bg-red-100', text: 'text-red-700' },
};

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'responded' | 'flagged'>('all');
  const [replyingTo, setReplyingTo] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['provider-reviews'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/reviews/provider/me');
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
      } catch { return []; }
    },
  });

  const replyMutation = useMutation({
    mutationFn: async (payload: { reviewId: string; reply: string }) => {
      await apiClient.post(`/reviews/${payload.reviewId}/reply`, { reply: payload.reply });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-reviews'] });
      setReplyingTo(null);
      setReplyText('');
    },
  });

  const filtered = reviews.filter((r) => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.id.toLowerCase().includes(q) ||
      r.customer.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q) ||
      r.serviceName.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2) : '0.00';
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }));
  const pendingReply = reviews.filter((r) => r.status === 'published').length;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo || !replyText.trim()) return;
    replyMutation.mutate({ reviewId: replyingTo.id, reply: replyText });
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center space-x-3">
        <Star className="w-8 h-8 text-amber-500" />
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Customer Reviews</h1>
          <p className="text-slate-400 mt-1">See what customers are saying and respond to their feedback.</p>
        </div>
      </div>

      {/* Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl flex items-center gap-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-amber-400">{avgRating}</div>
            <StarRating rating={Math.round(Number(avgRating))} size={14} />
            <div className="text-[10px] text-slate-400 mt-1">{reviews.length} reviews</div>
          </div>
          <div className="flex-1 space-y-1">
            {ratingDistribution.map((d) => (
              <div key={d.star} className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 w-3">{d.star}</span>
                <Star size={10} className="fill-amber-400 text-amber-400" />
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Pending Reply</span>
            <MessageSquare size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pendingReply}</div>
          <p className="text-[10px] text-slate-500 mt-1">Customers awaiting your response</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Helpful Votes</span>
            <ThumbsUp size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {reviews.reduce((s, r) => s + r.helpfulCount, 0)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Across all reviews</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, service, comment..."
            className="w-full pl-9 pr-4 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        </div>
        <div className="flex gap-2">
          {(['all', 'published', 'responded', 'flagged'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {f === 'all' ? 'All' : STATUS_CONFIG[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center space-x-2">
            <Loader className="animate-spin text-amber-400" />
            <span className="text-sm text-slate-400">Loading reviews...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center text-slate-500">
            No reviews match this filter.
          </div>
        ) : (
          filtered.map((review) => {
            const sc = STATUS_CONFIG[review.status];
            return (
              <div key={review.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-sm font-bold text-slate-300">
                      {review.customer.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-100 text-sm">{review.customer}</h3>
                        <StarRating rating={review.rating} />
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {review.serviceName} • Booking {review.bookingId} • {review.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
                    <ThumbsUp size={11} /> {review.helpfulCount}
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed pl-12">&ldquo;{review.comment}&rdquo;</p>

                {review.providerReply && (
                  <div className="pl-12 border-l-2 border-emerald-600 ml-2">
                    <div className="bg-emerald-900/40 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Your Reply</p>
                      <p className="text-xs text-slate-300">{review.providerReply}</p>
                    </div>
                  </div>
                )}

                {!review.providerReply && (
                  <div className="pl-12">
                    <button
                      onClick={() => { setReplyingTo(review); setReplyText(''); }}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
                    >
                      <Reply size={12} /> Reply to review
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reply Modal */}
      {replyingTo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReplyingTo(null)}>
          <form onSubmit={handleSendReply} className="bg-slate-800 rounded-xl max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Reply size={18} className="text-emerald-400" />
                Reply to {replyingTo.customer}
              </h2>
              <button type="button" onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <StarRating rating={replyingTo.rating} size={12} />
                  <span className="text-[10px] text-slate-400">{replyingTo.date}</span>
                </div>
                <p className="text-xs text-slate-600 italic">&ldquo;{replyingTo.comment}&rdquo;</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Your Response</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Thank the customer, address concerns, or clarify any issues..."
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-900 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
            </div>
            <div className="p-5 border-t border-slate-700 flex gap-2 justify-end">
              <button type="button" onClick={() => setReplyingTo(null)} className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-slate-700/50">Cancel</button>
              <button type="submit" disabled={replyMutation.isPending || !replyText.trim()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50">
                {replyMutation.isPending ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                Send Reply
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
