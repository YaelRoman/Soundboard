import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import BoardCard from "../components/BoardCard";
import TagChip from "../components/TagChip";
import styles from "./Explore.module.css";

const PAGE_SIZE = 20;

export default function Explore() {
  const [boards,      setBoards]      = useState([]);
  const [total,       setTotal]       = useState(0);
  const [pages,       setPages]       = useState(1);
  const [page,        setPage]        = useState(1);
  const [allTags,     setAllTags]     = useState([]);
  const [search,      setSearch]      = useState("");
  const [debouncedQ,  setDebouncedQ]  = useState("");
  const [activeTags,  setActiveTags]  = useState([]);
  const [loading,     setLoading]     = useState(true);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Load tags once
  useEffect(() => {
    api.getTags()
      .then(data => setAllTags(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Load boards
  useEffect(() => {
    setLoading(true);
    api.getBoards({ page, size: PAGE_SIZE, q: debouncedQ || undefined, tags: activeTags.length ? activeTags : undefined })
      .then(data => {
        setBoards(data?.items  ?? []);
        setTotal(data?.total   ?? 0);
        setPages(data?.pages   ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, debouncedQ, activeTags]);

  const toggleTag = useCallback(tag => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    setPage(1);
  }, []);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={"font-display " + styles.title}>Explore</h1>
        <p className={styles.sub}>{total} boards</p>
      </div>

      {/* Search */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.searchInput}
            placeholder="Search boards…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch("")}>×</button>
          )}
        </div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className={styles.tagRow}>
          {allTags.map(t => (
            <TagChip
              key={t} tag={t}
              active={activeTags.includes(t)}
              onClick={() => toggleTag(t)}
            />
          ))}
          {activeTags.length > 0 && (
            <button className={styles.clearTags} onClick={() => setActiveTags([])}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : boards.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>◉</span>
          <p>No boards found</p>
          {(search || activeTags.length > 0) && (
            <button className={styles.clearTags} onClick={() => { setSearch(""); setActiveTags([]); }}>
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {boards.map((b, i) => (
            <div key={b.id} style={{ animationDelay: `${i * 40}ms` }}>
              <BoardCard board={b} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            ← Prev
          </button>
          <span className={"font-orbitron " + styles.pageInfo}>
            {page} / {pages}
          </span>
          <button className={styles.pageBtn} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
