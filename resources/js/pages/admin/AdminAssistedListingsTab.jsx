import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Edit, FileText, CheckCircle, 
  XCircle, Filter, FileSearch, ShieldCheck, UserPlus 
} from 'lucide-react';
import CreateAssistedListingModal from './CreateAssistedListingModal';
import ListingConversionModal from './ListingConversionModal';
import AssistedListingDetailView from './AssistedListingDetailView';

export default function AdminAssistedListingsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Data fetching state
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [convertingListing, setConvertingListing] = useState(null);
  const [viewingListing, setViewingListing] = useState(null);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        search: searchTerm,
        status: statusFilter
      }).toString();
      const res = await axios.get(`/api/admin/listings?${queryParams}`);
      setData(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const mutate = fetchListings;

  const getStatusBadge = (status) => {
    switch(status) {
      case 'published': return <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400">Published</span>;
      case 'draft': return <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-500/20 text-amber-400">Draft</span>;
      case 'unpublished': return <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-500/20 text-slate-400">Unpublished</span>;
      case 'converted': return <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400">Converted</span>;
      default: return <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-500/20 text-slate-400">{status}</span>;
    }
  };

  const handleUnpublish = async (listingId) => {
    if (!window.confirm("Are you sure you want to unpublish this listing? It will no longer be visible to users.")) return;
    try {
      await axios.post(`/api/admin/listings/${listingId}/unpublish`);
      mutate();
    } catch (err) {
      alert("Failed to unpublish listing.");
    }
  };

  const handleDelete = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing permanently? This cannot be undone.")) return;
    try {
      await axios.delete(`/api/admin/listings/${listingId}`);
      mutate();
    } catch (err) {
      alert("Failed to delete listing.");
    }
  };

  if (viewingListing) {
    return (
      <AssistedListingDetailView 
        listing={viewingListing} 
        onClose={() => setViewingListing(null)}
        onUpdated={() => {
            mutate();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-navy-800/50 p-4 rounded-2xl border border-white/5">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by code, name, phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-navy-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 bg-navy-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 appearance-none transition"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
              <option value="converted">Converted</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-sm font-bold transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Create New Listing
        </button>
      </div>

      <div className="bg-navy-800/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-navy-900/80 text-slate-400 text-xs uppercase font-semibold border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Listing Code</th>
                <th className="px-6 py-4">Name / Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Consent</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!data && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
                      Loading listings...
                    </div>
                  </td>
                </tr>
              )}
              
              {data && data.data.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <FileSearch className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p>No listings found matching your criteria.</p>
                  </td>
                </tr>
              )}

              {data && data.data.map((listing) => (
                <tr key={listing.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-6 py-4 font-mono font-medium text-amber-400">
                    {listing.listing_code}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{listing.full_name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{listing.contact_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(listing.listing_status)}
                  </td>
                  <td className="px-6 py-4">
                    {listing.consent_given_at ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> Given
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 text-xs">
                        <XCircle className="w-3.5 h-3.5" /> Not Given
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => setViewingListing(listing)}
                        className="text-slate-400 hover:text-amber-400 transition"
                        title="Manage / View Detail"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditingListing(listing)}
                        className="text-slate-400 hover:text-white transition"
                        title="Edit Listing"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {listing.listing_status === 'published' && (
                        <button 
                          onClick={() => handleUnpublish(listing.id)}
                          className="text-amber-400/70 hover:text-amber-400 transition"
                          title="Unpublish"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      {listing.listing_status !== 'converted' && (
                        <button 
                          onClick={() => setConvertingListing(listing)}
                          className="text-blue-400/70 hover:text-blue-400 transition"
                          title="Convert to Account"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.meta && data.meta.last_page > 1 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 bg-navy-900 border border-white/10 rounded-lg text-sm text-slate-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {data.meta.current_page} of {data.meta.last_page}
            </span>
            <button 
              disabled={page === data.meta.last_page}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 bg-navy-900 border border-white/10 rounded-lg text-sm text-slate-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateAssistedListingModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            mutate();
          }}
        />
      )}

      {editingListing && (
        <CreateAssistedListingModal 
          isOpen={!!editingListing} 
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onSuccess={() => {
            setEditingListing(null);
            mutate();
          }}
        />
      )}

      {convertingListing && (
        <ListingConversionModal 
          isOpen={!!convertingListing}
          listing={convertingListing}
          onClose={() => setConvertingListing(null)}
          onSuccess={() => {
            setConvertingListing(null);
            mutate();
          }}
        />
      )}
    </div>
  );
}
