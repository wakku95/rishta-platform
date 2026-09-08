import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Search, ArrowRight } from 'lucide-react';
import { getShortlists } from '../../api/shortlist';
import ProfileCard from '../../components/profile/ProfileCard';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

export default function ShortlistPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    fetchShortlists(page);
  }, [page]);

  const fetchShortlists = async (targetPage = 1) => {
    setLoading(true);
    try {
      const res = await getShortlists({ page: targetPage });
      setProfiles(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      console.error('Failed to load shortlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShortlistChange = (profileCode, isShortlisted) => {
    if (!isShortlisted) {
      // Remove from current view
      setProfiles((prev) => prev.filter((p) => p.profile_code !== profileCode));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-burgundy-50 text-burgundy-800">
              <Bookmark className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-burgundy-900 tracking-tight">
              My Saved Shortlist
            </h1>
          </div>
          <p className="text-sm text-stone-500 font-medium mt-1">
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
      {loading ? (
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
