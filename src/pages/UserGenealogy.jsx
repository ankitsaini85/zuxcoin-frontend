import { useEffect, useRef, useState } from "react";
import API from "../api";
import SEOHelmet from "../components/SEOHelmet";
import Navbar from "../components/Navbar";
import GenealogyNodeSimple from "../components/GenealogyNodeSimple";
import UserDetailsCard from "../components/UserDetailsCard";
import ConnectorLine from "../components/ConnectorLine";
import { useDebounce, SearchSuggestions } from "../utils/searchUtils";
import "../styles/GenealogyTree.css";

const DEFAULT_LIMIT = 100;

function UserGenealogy() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 300);
  const searchInputRef = useRef(null);
  const searchWrapperRef = useRef(null);
  const youRef = useRef(null);

  const fetchGenealogy = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/user/genealogy", {
        params: {
          page,
          limit,
          q: searchQuery || undefined,
        },
      });

      const data = res.data || {};
      setUsers(Array.isArray(data.users) ? data.users : []);
      setTotalPages(data.totalPages || 1);
      setCurrentUserId(data.currentUserId || null);
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
        const res = await API.get("/user/genealogy/search", {
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

  useEffect(() => {
    if (youRef.current) {
      youRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [users, currentUserId]);

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
    <>
      <SEOHelmet 
        title="Genealogy Tree - ZUX Coin | Referral Network & Team Structure"
        description="View your referral genealogy tree on ZUX Coin. See your downline network and track referral performance."
        keywords="genealogy, referral tree, network, downline, referrals, team structure"
        url="https://zuxcoin.in/genealogy"
      />
      <Navbar />
      <div className="genealogy-page">
        <div className="genealogy-header">
          <div>
            <h3>View My Genealogy</h3>
            <p className="genealogy-meta">Chain from your position downward</p>
          </div>
          <div className="genealogy-toolbar">
            <div className="genealogy-search genealogy-search-wrapper" ref={searchWrapperRef}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name or email"
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
          <div className="genealogy-empty">No users in your chain yet.</div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="genealogy-chain">
            {users.map((user, index) => {
              const isYou = currentUserId && user._id === currentUserId;
              const isSelected = selectedUser && selectedUser._id === user._id;
              return (
                <div key={user._id}>
                  <div
                    className="genealogy-chain-item"
                    ref={isYou ? youRef : null}
                  >
                    <GenealogyNodeSimple
                      user={user}
                      isYou={isYou}
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
    </>
  );
}

export default UserGenealogy;
