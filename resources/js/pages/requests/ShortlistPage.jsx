import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Search, ArrowRight } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getShortlists } from '../../api/shortlist';
import ProfileCard from '../../components/profile/ProfileCard';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

export default function ShortlistPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: shortlistResponse, isLoading } = useQuery({
    queryKey: ['shortlists', page],
    queryFn: () => getShortlists({ page }),
  });

  const profiles = shortlistResponse?.data || [];
  const meta = shortlistResponse?.meta || null;

  const handleShortlistChange = (profileCode, isShortlisted) => {
    if (!isShortlisted) {
      // Optimistically remove from cached view
      queryClient.setQueryData(['shortlists', page], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).filter((p) => p.profile_code !== profileCode),
        };
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-750">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-magenta-950/60 text-magenta-400 border border-magenta-500/30">
              <Bookmark className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Saved Shortlist
            </h1>
          </div>
          <p className="text-sm text-slate-400 font-normal mt-1">
            Private bookmarks of candidate profiles you are considering. Candidates are never notified.
          </p>
        </div>

        <Link to="/search">
          <Button variant="secondary" size="sm" icon={Search} className="font-bold">
            Discover Candidates
          </Button>
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20">
          <LoadingState text="Loading your shortlisted candidates..." />
        </div>
      ) : profiles.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={Bookmark}
            title="Your shortlist is empty"
            description="You have not bookmarked any candidate profiles yet. Browse candidates and click the bookmark icon to save them here privately."
            action={
              <Link to="/search">
                <Button variant="primary" icon={Search}>
                  Browse Candidates Now
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.profile_code}
                profile={profile}
                isInitiallyShortlisted={true}
                onShortlistChange={handleShortlistChange}
              />
            ))}
          </div>

          {meta && meta.last_page > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination
                currentPage={meta.current_page}
                totalPages={meta.last_page}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
