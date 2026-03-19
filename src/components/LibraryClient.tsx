'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BookMarked, Trash2, FolderPlus, FolderOpen, ChevronDown,
  Check, Eye, Calendar, Loader2, Plus, X, Tag,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/context/AuthContext'
import { MODEL_DISPLAY_NAMES } from '@/types/database'
import type { SavedPrompt, PromptCollection, Generation } from '@/types/database'

// Sort option
type SortBy = 'saved_at' | 'views_count' | 'prompt'

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Saved prompt card ─────────────────────────────────────────────────────────

function LibraryCard({
  saved,
  selected,
  onToggleSelect,
  onDelete,
}: {
  saved: SavedPrompt & { generation?: Generation }
  selected: boolean
  onToggleSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const gen = saved.generation
  const src = gen?.output_image_url_min ?? gen?.output_image_url ?? ''

  return (
    <div className={`relative group bg-zinc-900 border rounded-xl overflow-hidden transition-all duration-200
      ${selected ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-zinc-800 hover:border-zinc-700'}`}>

      {/* Select checkbox */}
      <button
        onClick={() => onToggleSelect(saved.id)}
        className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150
          ${selected ? 'bg-violet-600 border-violet-600' : 'bg-black/50 border-zinc-600 opacity-0 group-hover:opacity-100'}`}
        aria-label={selected ? 'Deselect' : 'Select'}
      >
        {selected && <Check className="w-3.5 h-3.5 text-white" />}
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(saved.id)}
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-150"
        aria-label="Remove from library"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Thumbnail */}
      <Link href={gen ? `/image/${gen.job_set_id}` : '#'}>
        <div className="relative w-full aspect-[4/5] bg-zinc-800">
          {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-zinc-800" />}
          {src && (
            <Image
              src={src}
              alt={gen?.prompt?.slice(0, 60) ?? 'Saved prompt'}
              fill
              className={`object-cover transition-all duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-105`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized loading="lazy"
              onLoad={() => setImgLoaded(true)}
            />
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        {gen?.model && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-600/15 text-violet-400 border border-violet-600/20">
            {MODEL_DISPLAY_NAMES[gen.model] ?? gen.model}
          </span>
        )}
        <p className="text-xs text-zinc-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(saved.saved_at)}
        </p>
        {gen?.views_count != null && (
          <p className="text-xs text-zinc-600 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {gen.views_count.toLocaleString()} views
          </p>
        )}
        {saved.notes && (
          <p className="text-xs text-zinc-400 italic leading-snug line-clamp-2">{saved.notes}</p>
        )}
        {saved.tags && saved.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {saved.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 flex items-center gap-0.5">
                <Tag className="w-2.5 h-2.5" />{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── New collection modal ──────────────────────────────────────────────────────

function NewCollectionModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <h3 className="text-base font-bold text-white mb-4">New collection</h3>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onCreate(name.trim())}
          placeholder="Collection name"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm text-zinc-400 border border-zinc-700 hover:border-zinc-500 transition-colors">Cancel</button>
          <button
            onClick={() => name.trim() && onCreate(name.trim())}
            disabled={!name.trim()}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main library client ───────────────────────────────────────────────────────

export default function LibraryClient() {
  const { user, openAuth } = useAuth()
  const [savedPrompts, setSavedPrompts] = useState<(SavedPrompt & { generation?: Generation })[]>([])
  const [collections, setCollections] = useState<PromptCollection[]>([])
  const [activeCollection, setActiveCollection] = useState<string | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortBy>('saved_at')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  const supabase = createClient()

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [savedRes, collectionsRes] = await Promise.all([
      supabase
        .from('saved_prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false }),
      supabase
        .from('prompt_collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
    ])

    const saved = (savedRes.data ?? []) as SavedPrompt[]
    setCollections((collectionsRes.data ?? []) as PromptCollection[])

    if (saved.length === 0) { setSavedPrompts([]); setLoading(false); return }

    // Fetch full generation records
    const ids = saved.map(s => s.job_set_id)
    const { data: genData } = await supabase
      .from('generations')
      .select('*')
      .in('job_set_id', ids)

    const genMap = new Map((genData as Generation[] ?? []).map(g => [g.job_set_id, g]))
    const enriched = saved.map(s => ({ ...s, generation: genMap.get(s.job_set_id) }))
    setSavedPrompts(enriched)
    setLoading(false)
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData() }, [loadData])

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from('saved_prompts').delete().eq('id', id)
    setSavedPrompts(prev => prev.filter(s => s.id !== id))
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleBulkDelete = useCallback(async () => {
    setBulkLoading(true)
    await supabase.from('saved_prompts').delete().in('id', [...selectedIds])
    setSavedPrompts(prev => prev.filter(s => !selectedIds.has(s.id)))
    setSelectedIds(new Set())
    setBulkLoading(false)
  }, [selectedIds]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateCollection = useCallback(async (name: string) => {
    if (!user) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('prompt_collections')
      .insert({ user_id: user.id, name })
      .select('*')
      .single()
    if (data) setCollections(prev => [...prev, data as PromptCollection])
    setShowNewCollection(false)
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  // Filter + sort
  const filtered = savedPrompts
    .filter(s => activeCollection === 'all' || s.collection_id === activeCollection)
    .sort((a, b) => {
      if (sortBy === 'views_count') return (b.generation?.views_count ?? 0) - (a.generation?.views_count ?? 0)
      if (sortBy === 'prompt') return (a.generation?.prompt ?? '').localeCompare(b.generation?.prompt ?? '')
      return new Date(b.saved_at ?? 0).getTime() - new Date(a.saved_at ?? 0).getTime()
    })

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <BookMarked className="w-12 h-12 text-zinc-700" />
        <p className="text-zinc-400 font-medium">Sign in to access your library</p>
        <button onClick={() => openAuth('login')} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors">
          Sign in
        </button>
      </div>
    )
  }

  return (
    <div>
      {showNewCollection && (
        <NewCollectionModal onClose={() => setShowNewCollection(false)} onCreate={handleCreateCollection} />
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar — collections */}
        <aside className="lg:w-52 shrink-0">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Collections</p>
              <button
                onClick={() => setShowNewCollection(true)}
                className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                title="New collection"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <nav className="py-1">
              {[
                { id: 'all' as const, name: 'All saved', icon: BookMarked, count: savedPrompts.length },
                ...collections.map(c => ({ id: c.id, name: c.name, icon: FolderOpen, count: savedPrompts.filter(s => s.collection_id === c.id).length })),
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveCollection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors
                    ${activeCollection === item.id ? 'text-white bg-violet-600/15 border-r-2 border-violet-500' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left truncate">{item.name}</span>
                  <span className="text-xs text-zinc-600">{item.count}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main grid */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <p className="text-sm text-zinc-400">
              {filtered.length} prompt{filtered.length !== 1 ? 's' : ''}
            </p>

            {/* Sort */}
            <div className="relative ml-auto">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortBy)}
                className="appearance-none bg-zinc-900 border border-zinc-700 rounded-lg pl-3 pr-8 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
              >
                <option value="saved_at">Date saved</option>
                <option value="views_count">Views</option>
                <option value="prompt">Alphabetical</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/30 text-red-400 border border-red-800/40 hover:bg-red-900/50 transition-colors"
              >
                {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete {selectedIds.size} selected
              </button>
            )}

            <button
              onClick={() => setShowNewCollection(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-white transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              New folder
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center bg-zinc-900 border border-zinc-800 rounded-xl">
              <BookMarked className="w-12 h-12 text-zinc-700" />
              <p className="text-zinc-400 font-medium">
                {activeCollection === 'all' ? 'No saved prompts yet' : 'No prompts in this collection'}
              </p>
              <p className="text-zinc-600 text-sm max-w-xs">
                {activeCollection === 'all'
                  ? 'Browse images and click the bookmark icon to save prompts you like.'
                  : 'Save prompts and assign them to this collection.'}
              </p>
              <Link href="/browse" className="mt-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors">
                Browse images
              </Link>
            </div>
          )}

          {/* Grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(saved => (
                <LibraryCard
                  key={saved.id}
                  saved={saved}
                  selected={selectedIds.has(saved.id)}
                  onToggleSelect={toggleSelect}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
