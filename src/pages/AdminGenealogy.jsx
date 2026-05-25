import { useEffect, useMemo, useRef, useState } from "react";
import API from "../api";
import GenealogyNodeSimple from "../components/GenealogyNodeSimple";
import UserDetailsCard from "../components/UserDetailsCard";
import ConnectorLine from "../components/ConnectorLine";
import { useDebounce, SearchSuggestions } from "../utils/searchUtils";
import "../styles/GenealogyTree.css";

const DEFAULT_LIMIT = 100;

function AdminGenealogy() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 300);
  const searchWrapperRef = useRef(null);

  const fetchGenealogy = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/admin/genealogy", {
        params: {
          page,
          limit,
          q: searchQuery || undefined,
        },
      });

      const data = res.data || {};
      setUsers(Array.isArray(data.users) ? data.users : []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load genealogy");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenealogy();
  }, [page, searchQuery]);

  // Fetch suggestions as user types
  useEffect(() => {
    if (debouncedSearch.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        const res = await API.get("/admin/genealogy/search", {
          params: { q: debouncedSearch },
        });
        setSuggestions(Array.isArray(res.data) ? res.data : []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    setPage(1);
    setSearchQuery(searchInput.trim());
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (user) => {
    setSearchInput("");
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedUser(user);
  };

  const handleInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  return (
    <div className="genealogy-page">
      <div className="genealogy-header">
        <div>
          <h3>Admin Genealogy</h3>
          <p className="genealogy-meta">
            Total Users: {total}
          </p>
        </div>
        <div className="genealogy-toolbar">
          <div className="genealogy-search genealogy-search-wrapper" ref={searchWrapperRef}>
            <input
              type="text"
              placeholder="Search referral code, name or email"
              value={searchInput}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => searchInput.trim().length >= 2 && setShowSuggestions(true)}
            />
            <button type="button" onClick={handleSearch}>
              Search
            </button>
            <SearchSuggestions
              suggestions={suggestions}
              loading={suggestionsLoading}
              isOpen={showSuggestions}
              onSelect={handleSuggestionSelect}
              highlightText={searchInput}
            />
          </div>
        </div>
      </div>

      {loading && <div className="genealogy-loading">Loading genealogy...</div>}
      {error && <div className="genealogy-error">{error}</div>}

      {!loading && !error && users.length === 0 && (
        <div className="genealogy-empty">No users found.</div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="genealogy-chain">
          {users.map((user, index) => {
            const isSelected = selectedUser && selectedUser._id === user._id;
            return (
              <div key={user._id}>
                <div className="genealogy-chain-item">
                  <GenealogyNodeSimple
                    user={user}
                    onClick={() => setSelectedUser(isSelected ? null : user)}
                  />
                  {index < users.length - 1 && <ConnectorLine />}
                </div>
                {isSelected && (
                  <UserDetailsCard
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="genealogy-pagination">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page <= 1 || loading}
        >
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page >= totalPages || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default AdminGenealogy;
