import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  User as UserIcon, 
  Tag, 
  Search, 
  X, 
  Filter, 
  FolderOpen, 
  ArrowLeft,
  BookOpen,
  Image as ImageIcon,
  AlertCircle,
  FileCheck,
  Check
} from "lucide-react";
import { BlogPost, User } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface BlogSectionProps {
  currentUser: User | null;
  currentToken: string | null;
}

const CATEGORIES = ["All", "Ecology", "Healthcare", "Education", "Development", "Technology"];

const IMAGE_PRESETS = [
  { label: "Community Forest (Ecology)", url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=60" },
  { label: "Sponsorship Outreach (Education)", url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60" },
  { label: "Lisa Clinical Unit support (Healthcare)", url: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800&auto=format&fit=crop&q=60" },
  { label: "Strategic Team Building", url: "https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?w=800&auto=format&fit=crop&q=60" }
];

export default function BlogSection({ currentUser, currentToken }: BlogSectionProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  
  // Filtering & Search
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Form (Create / Edit) State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: "",
    category: "Ecology",
    tagsString: ""
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch posts helper
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/posts");
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Failed to load posts from ledger database", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleOpenCreateForm = () => {
    setEditingPost(null);
    setFormData({
      title: "",
      content: "",
      image: IMAGE_PRESETS[0].url,
      category: "Ecology",
      tagsString: "Environment, Community"
    });
    setError(null);
    setEditorOpen(true);
  };

  const handleOpenEditForm = (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      image: post.image,
      category: post.category,
      tagsString: post.tags.join(", ")
    });
    setError(null);
    setEditorOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and content are critical parameters.");
      return;
    }
    setError(null);
    setSuccess(null);

    const payload = {
      title: formData.title,
      content: formData.content,
      image: formData.image || IMAGE_PRESETS[0].url,
      category: formData.category,
      tags: formData.tagsString.split(",").map(t => t.trim()).filter(Boolean)
    };

    try {
      let url = "/api/posts";
      let method = "POST";

      if (editingPost) {
        url = `/api/posts/${editingPost.id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "The gateway rejected the blog record write.");
      }

      setSuccess(editingPost ? "Post compiled and updated." : "Post published successfully.");
      setEditorOpen(false);
      fetchPosts();

      // If we are actively viewing this post, update the displayed modal
      if (selectedPost && selectedPost.id === editingPost?.id) {
        setSelectedPost(data.post);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred writing post to database.");
    }
  };

  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Verify: Are you sure you want to purge this record from the blog matrix?")) {
      return;
    }
    setError(null);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentToken}`
        }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "purge action declined.");
      }
      setSuccess("Record purged from database.");
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
      fetchPosts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Extract all unique tags
  const allTags: string[] = Array.from(new Set(posts.flatMap(p => p.tags)));

  // Filter posts based on query, tag, and category
  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === "All" || post.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesTag = !selectedTag || post.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());
    const matchesSearch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesTag && matchesSearch;
  });

  // Calculate stats
  const totalPostsCount = posts.length;
  const targetCategoryCount = (catName: string) => 
    posts.filter(p => catName === "All" || p.category.toLowerCase() === catName.toLowerCase()).length;

  return (
    <div className="space-y-8" id="blog-section-core">
      {/* Alert Banner Updates */}
      {(error || success) && (
        <div className="max-w-4xl mx-auto space-y-2">
          {error && (
            <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-sm flex items-start gap-2.5" id="blog-error-banner">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs rounded-sm flex items-start gap-2.5 animate-pulse" id="blog-success-banner">
              <FileCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}
        </div>
      )}

      {/* Top Banner Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 p-5 border border-emerald-900/10 rounded-sm" id="blog-search-toolbar">
        {/* Search */}
        <div className="relative w-full md:max-w-md" id="search-input-wrapper">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            placeholder="Search posts, summaries, or authors..."
            id="blog-search-input"
          />
        </div>

        {/* Filter and Actions panel */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end" id="blog-action-toolbar">
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="px-3 py-1.5 bg-indigo-500/15 border border-indigo-400/30 text-indigo-400 text-[10px] font-mono rounded-sm flex items-center gap-1.5 cursor-pointer hover:bg-slate-900"
              id="clear-tag-filter"
            >
              Tag: {selectedTag} <X className="w-3 h-3" />
            </button>
          )}

          {currentUser && (currentUser.role === "admin" || currentUser.role === "author") && (
            <button
              onClick={handleOpenCreateForm}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest rounded-sm transition-all duration-200 cursor-pointer flex items-center gap-2"
              id="btn-trigger-editor"
            >
              <Plus className="w-4 h-4" /> Compose Entry
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8" id="blog-content-layout">
        
        {/* Sidebar categories and tags */}
        <div className="space-y-6 lg:col-span-1" id="blog-sidebar-filters">
          <div className="bg-slate-900/40 border border-emerald-900/15 rounded-sm p-5 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-emerald-400" /> Channels
            </h3>
            <div className="flex flex-col gap-1.5" id="categories-list">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setSelectedTag(null);
                  }}
                  className={`w-full flex items-center justify-between text-left py-2 px-3 rounded-sm text-xs font-medium cursor-pointer transition-all ${
                    activeCategory === cat
                      ? "bg-emerald-500/10 text-emerald-400 border-l-[3px] border-emerald-500 font-bold"
                      : "text-slate-400 hover:bg-slate-900/70 hover:text-slate-100"
                  }`}
                  id={`cat-btn-${cat.toLowerCase()}`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm bg-slate-950 font-normal ${activeCategory === cat ? 'text-emerald-400 border border-emerald-900/30' : 'text-slate-500'}`}>
                    {targetCategoryCount(cat)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags Cloud */}
          {allTags.length > 0 && (
            <div className="bg-slate-900/40 border border-emerald-900/15 rounded-sm p-5 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" /> Core Organizers
              </h3>
              <div className="flex flex-wrap gap-1.5" id="tags-cloud">
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t === selectedTag ? null : t)}
                    className={`text-[10px] font-mono px-2.5 py-1.5 border transition-all cursor-pointer rounded-xs capitalize ${
                      selectedTag === t
                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-950 border-slate-805 text-slate-400 hover:text-slate-100 hover:border-slate-700"
                    }`}
                    id={`tag-btn-${t.toLowerCase()}`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* List of articles */}
        <div className="lg:col-span-3" id="blog-posts-canvas">
          {loading ? (
            <div className="text-center py-20 space-y-3" id="posts-loading-indicator">
              <div className="inline-block w-8 h-8 rounded-full border-t-2 border-emerald-500 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Synchronizing ledger index updates...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-24 bg-slate-900/20 border border-slate-805 rounded-sm px-6" id="empty-posts-alert">
              <BookOpen className="w-10 h-10 text-slate-650 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">No blog records map this matrix slice.</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting tags or expanding your target query parameters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="posts-masonry-grid">
              {filteredPosts.map((post) => (
                <motion.article
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedPost(post)}
                  key={post.id}
                  className="bg-slate-900 border border-slate-850 hover:border-emerald-900/35 overflow-hidden rounded-sm transition-all focus-within:ring-2 focus-within:ring-emerald-500/20 flex flex-col justify-between cursor-pointer"
                  id={`article-card-${post.id}`}
                >
                  <div id="article-header-image" className="relative h-44 overflow-hidden bg-slate-950">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover object-top transition-transform duration-300 hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3.5 left-3.5 bg-slate-950/85 backdrop-blur-sm border border-emerald-900/20 text-emerald-400 text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1.5">
                      {post.category}
                    </div>

                    {/* Author operations button overlay */}
                    {currentUser && (currentUser.role === "admin" || post.author.id === currentUser.id) && (
                      <div className="absolute top-3.5 right-3.5 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenEditForm(post, e)}
                          className="p-1 px-2.5 bg-slate-950/85 hover:bg-emerald-600 hover:text-slate-950 text-slate-350 transition-colors border border-slate-800 rounded-xs"
                          title="Edit Document"
                          id={`btn-short-edit-${post.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeletePost(post.id, e)}
                          className="p-1 px-2.5 bg-slate-950/85 hover:bg-red-600 hover:text-white text-slate-350 transition-colors border border-slate-800 rounded-xs"
                          title="Purge Document"
                          id={`btn-short-del-${post.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4" id="article-payload-meta">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono" id="post-meta-ledger-row">
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3 text-emerald-500" /> {post.author.fullName.split(" ")[0]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-indigo-400" /> {new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-semibold tracking-tight text-slate-100 group-hover:text-emerald-400 line-clamp-2">
                        {post.title}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {post.content}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-950/60 flex items-center justify-between" id="article-footer-links">
                      <div className="flex gap-1">
                        {post.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-[9px] font-mono bg-slate-950 text-slate-500 px-2 py-0.5 rounded-sm">
                            #{t}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold font-mono group-hover:underline">
                        Read Card
                      </span>
                    </div>

                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Editor Compose Panel (Drawer/Overlay) */}
      <AnimatePresence>
        {editorOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-905 border border-slate-805 w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden flex flex-col justify-between"
              id="editor-canvas"
            >
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-850 flex items-center justify-between" id="editor-header">
                <h3 className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                  {editingPost ? "Edit Blog Matrix" : "Institute New Blog Entry"}
                </h3>
                <button
                  onClick={() => setEditorOpen(false)}
                  className="text-slate-400 hover:text-slate-100 cursor-pointer"
                  id="editor-btn-close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePost} className="p-6 space-y-4" id="editor-form-data">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="editor-meta-splits">
                  <div className="space-y-1.5" id="editor-field-category">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Channel Focus
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                    >
                      {CATEGORIES.filter(c => c !== "All").map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5" id="editor-field-tags">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Organizing Tags (Comma Separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tagsString}
                      onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                      placeholder="e.g. Action, Forestry, Sinks"
                    />
                  </div>
                </div>

                <div className="space-y-1.5" id="editor-field-title">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Article Title Line
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                    placeholder="Provide a high-impact narrative title..."
                  />
                </div>

                {/* Cover presets selector */}
                <div className="space-y-2" id="editor-cover-presets">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> Selective Image Presets
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2" id="cover-presets-grid">
                    {IMAGE_PRESETS.map((p) => (
                      <button
                        type="button"
                        key={p.url}
                        onClick={() => setFormData({ ...formData, image: p.url })}
                        className={`p-1 bg-slate-950 border rounded-xs transition-all relative overflow-hidden h-14 ${
                          formData.image === p.url ? "border-emerald-500 ring-2 ring-emerald-500/25" : "border-slate-850 hover:border-slate-700"
                        }`}
                      >
                        <img src={p.url} alt={p.label} className="w-full h-full object-cover rounded-xs" />
                        {formData.image === p.url && (
                          <div className="absolute inset-0 bg-slate-950/65 flex items-center justify-center text-emerald-400">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5" id="editor-field-image-custom">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Or Direct Image URL Link
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm"
                    placeholder="https://images.unsplash.com/... or keep default"
                  />
                </div>

                <div className="space-y-1.5" id="editor-field-content">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Core Document Narrative Content
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full text-xs p-3.5 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/40 leading-relaxed"
                    placeholder="Describe the operational achievements, tree counts, clinic diagnostic installations, or sponsorships in detail..."
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900" id="editor-actions">
                  <button
                    type="button"
                    onClick={() => setEditorOpen(false)}
                    className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider rounded-sm hover:text-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest rounded-sm transition-all duration-200"
                  >
                    {editingPost ? "Verify Update" : "Publish to Ledger"}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expanded article details modal overlay */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-850 w-full max-w-3xl rounded-sm shadow-2xl overflow-hidden"
              id="details-card-canvas"
            >
              <div className="relative h-64 md:h-80 overflow-hidden bg-slate-950" id="details-cover-wrapper">
                <img
                  src={selectedPost.image}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 bg-slate-950/90 border border-emerald-500/20 px-3 py-1 text-[10px] font-mono font-bold uppercase text-emerald-400">
                  {selectedPost.category}
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/95 hover:bg-slate-900 border border-slate-800 hover:text-emerald-400 cursor-pointer"
                  id="details-btn-dismiss"
                >
                  <X className="w-5 h-5 text-slate-300" />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6" id="details-payload">
                
                <div className="space-y-3" id="details-header-blocks">
                  <div className="flex flex-wrap gap-4 items-center text-[11px] text-slate-500 font-mono" id="details-meta-ledger">
                    <span className="flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-emerald-500" /> Author Representative: <span className="text-slate-300">{selectedPost.author.fullName}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Published: <span className="text-slate-300">{new Date(selectedPost.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </span>
                  </div>

                  <h3 className="text-lg md:text-2xl font-light tracking-tight text-slate-100 leading-normal">
                    {selectedPost.title}
                  </h3>
                </div>

                <div className="text-xs md:text-sm text-slate-300 leading-relaxed space-y-4 font-sans whitespace-pre-line" id="details-core-narrative">
                  {selectedPost.content}
                </div>

                <div className="pt-6 border-t border-slate-950/50 flex flex-wrap gap-2 items-center justify-between" id="details-organizers-row">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPost.tags.map(t => (
                      <span key={t} className="text-[10px] font-mono bg-slate-950 text-indigo-400 border border-indigo-950 px-2.5 py-1">
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Context actions for editor */}
                  {currentUser && (currentUser.role === "admin" || selectedPost.author.id === currentUser.id) && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          setSelectedPost(null);
                          handleOpenEditForm(selectedPost, e);
                        }}
                        className="px-3.5 py-1.5 bg-slate-950 hover:bg-emerald-600 hover:text-slate-950 text-slate-350 transition-colors border border-slate-800 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5"
                        id="details-action-edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Modify Segment
                      </button>
                      <button
                        onClick={(e) => {
                          setSelectedPost(null);
                          handleDeletePost(selectedPost.id, e);
                        }}
                        className="px-3.5 py-1.5 bg-slate-950 hover:bg-red-600 hover:text-white text-slate-350 transition-colors border border-slate-800 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5"
                        id="details-action-purge"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Purge Matrix
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
