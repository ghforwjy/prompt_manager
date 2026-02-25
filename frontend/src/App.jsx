import { useState, useEffect } from 'react'
import { Settings, Search, Plus, Copy, Edit, Trash2, X } from 'lucide-react'

const API_BASE = '/api'

function App() {
  const [prompts, setPrompts] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState(null)

  useEffect(() => {
    fetchPrompts()
    fetchCategories()
    fetchTags()
  }, [])

  const fetchPrompts = async () => {
    try {
      const res = await fetch(`${API_BASE}/prompts`)
      const data = await res.json()
      setPrompts(data)
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`)
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchTags = async () => {
    try {
      const res = await fetch(`${API_BASE}/tags`)
      const data = await res.json()
      setTags(data)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      const res = await fetch(`${API_BASE}/prompts?${params}`)
      const data = await res.json()
      setPrompts(data)
    } catch (error) {
      console.error('Failed to search prompts:', error)
    }
  }

  const handleCopy = async (promptId) => {
    try {
      const res = await fetch(`${API_BASE}/prompts/${promptId}/copy`, { method: 'POST' })
      if (res.ok) {
        fetchPrompts()
        alert('复制成功')
      }
    } catch (error) {
      console.error('Failed to copy prompt:', error)
    }
  }

  const handleDelete = async (promptId) => {
    if (!confirm('确定要删除这个提示词吗？')) return
    try {
      const res = await fetch(`${API_BASE}/prompts/${promptId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchPrompts()
        if (selectedPrompt?.id === promptId) {
          setSelectedPrompt(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error)
    }
  }

  const handleCopyContent = () => {
    if (selectedPrompt) {
      navigator.clipboard.writeText(selectedPrompt.content)
      alert('内容已复制到剪贴板')
    }
  }

  const promptsByCategory = categories.map(cat => ({
    category: cat,
    prompts: prompts.filter(p => p.category_id === cat.id)
  })).filter(item => item.prompts.length > 0 || searchQuery === '')

  return (
    <div className="flex h-screen bg-background">
      {/* 左侧面板 - 搜索结果 */}
      <div className="w-80 bg-surface flex flex-col border-r border-border">
        <div className="p-4 space-y-4">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Settings size={18} />
            管理分类和标签
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {promptsByCategory.map(({ category, prompts }) => (
            <div key={category.id} className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">{category.name}</h3>
              <div className="space-y-2">
                {prompts.map(prompt => (
                  <div
                    key={prompt.id}
                    onClick={() => setSelectedPrompt(prompt)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedPrompt?.id === prompt.id
                        ? 'bg-surface-hover'
                        : 'hover:bg-surface-hover/50'
                    }`}
                  >
                    <p className="text-sm text-gray-200 mb-2">{prompt.title}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {prompt.tags?.map(tag => (
                        <span
                          key={tag.id}
                          className="px-2 py-0.5 text-xs bg-background text-muted-foreground rounded"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {prompts.length === 0 && (
                  <p className="text-sm text-muted">暂无提示词</p>
                )}
              </div>
            </div>
          ))}
          {prompts.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">
              暂无搜索结果
            </p>
          )}
        </div>
      </div>

      {/* 右侧面板 - 提示词详情 */}
      <div className="flex-1 flex flex-col p-8">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 搜索提示词..."
              className="flex-1 h-11 bg-surface-hover rounded-lg px-4 text-sm text-gray-200 placeholder-muted outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              className="w-20 h-11 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              搜索
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-20 h-11 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              新建
            </button>
          </div>
        </form>

        <div className="flex-1 overflow-y-auto">
          {selectedPrompt ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-100">{selectedPrompt.title}</h1>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">分类：</span>
                  <span className="px-3 py-1 bg-surface-hover text-primary rounded text-sm">
                    {categories.find(c => c.id === selectedPrompt.category_id)?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">标签：</span>
                  <div className="flex gap-2">
                    {selectedPrompt.tags?.map(tag => (
                      <span
                        key={tag.id}
                        className="px-3 py-1 bg-surface-hover text-muted-foreground rounded text-sm"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm text-muted">提示词内容</span>
                <div className="bg-surface-hover rounded-xl p-6">
                  <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {selectedPrompt.content}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleCopyContent}
                  className="flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Copy size={16} />
                  复制
                </button>
                <button
                  onClick={() => setEditingPrompt(selectedPrompt)}
                  className="flex items-center gap-2 h-9 px-4 bg-surface-hover text-muted-foreground rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors"
                >
                  <Edit size={16} />
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(selectedPrompt.id)}
                  className="flex items-center gap-2 h-9 px-4 bg-surface-hover text-destructive rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors"
                >
                  <Trash2 size={16} />
                  删除
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>选择一个提示词查看详情</p>
            </div>
          )}
        </div>
      </div>

      {/* 设置弹窗 */}
      {showSettings && (
        <SettingsModal
          categories={categories}
          tags={tags}
          onClose={() => setShowSettings(false)}
          onRefresh={() => {
            fetchCategories()
            fetchTags()
            fetchPrompts()
          }}
        />
      )}

      {/* 新建弹窗 */}
      {showCreateModal && (
        <CreatePromptModal
          categories={categories}
          tags={tags}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchPrompts()
            setShowCreateModal(false)
          }}
        />
      )}

      {/* 编辑弹窗 */}
      {editingPrompt && (
        <EditPromptModal
          prompt={editingPrompt}
          categories={categories}
          tags={tags}
          onClose={() => setEditingPrompt(null)}
          onSuccess={() => {
            fetchPrompts()
            const updated = prompts.find(p => p.id === editingPrompt.id)
            if (updated) setSelectedPrompt(updated)
            setEditingPrompt(null)
          }}
        />
      )}
    </div>
  )
}

function SettingsModal({ categories, tags, onClose, onRefresh }) {
  const [newCategory, setNewCategory] = useState('')
  const [newTag, setNewTag] = useState('')
  const [localCategories, setLocalCategories] = useState(categories)
  const [localTags, setLocalTags] = useState(tags)

  useEffect(() => {
    setLocalCategories(categories)
    setLocalTags(tags)
  }, [categories, tags])

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory })
      })
      if (res.ok) {
        setNewCategory('')
        const res = await fetch(`${API_BASE}/categories`)
        const data = await res.json()
        setLocalCategories(data)
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to add category:', error)
    }
  }

  const handleDeleteCategory = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setLocalCategories(localCategories.filter(c => c.id !== id))
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  const handleAddTag = async () => {
    if (!newTag.trim()) return
    try {
      const res = await fetch(`${API_BASE}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTag })
      })
      if (res.ok) {
        setNewTag('')
        const res = await fetch(`${API_BASE}/tags`)
        const data = await res.json()
        setLocalTags(data)
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to add tag:', error)
    }
  }

  const handleDeleteTag = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/tags/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setLocalTags(localTags.filter(t => t.id !== id))
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to delete tag:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl w-[500px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-white">管理分类和标签</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-6 overflow-y-auto max-h-[60vh]">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">分类</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="新分类名称"
                className="flex-1 h-9 bg-background rounded px-3 text-sm text-gray-200 placeholder-muted outline-none"
              />
              <button
                onClick={handleAddCategory}
                className="px-4 h-9 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90"
              >
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {localCategories.map(cat => (
                <span
                  key={cat.id}
                  className="flex items-center gap-1 px-3 py-1 bg-background text-muted-foreground rounded text-sm"
                >
                  {cat.name}
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-destructive hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">标签</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="新标签名称"
                className="flex-1 h-9 bg-background rounded px-3 text-sm text-gray-200 placeholder-muted outline-none"
              />
              <button
                onClick={handleAddTag}
                className="px-4 h-9 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90"
              >
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {localTags.map(tag => (
                <span
                  key={tag.id}
                  className="flex items-center gap-1 px-3 py-1 bg-background text-muted-foreground rounded text-sm"
                >
                  {tag.name}
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="text-destructive hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreatePromptModal({ categories, tags, onClose, onSuccess }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [selectedTags, setSelectedTags] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !categoryId) return
    
    try {
      const res = await fetch(`${API_BASE}/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category_id: categoryId,
          tag_ids: selectedTags
        })
      })
      if (res.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create prompt:', error)
    }
  }

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl w-[600px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-white">新建提示词</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <div>
            <label className="block text-sm text-gray-300 mb-2">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 bg-background rounded-lg px-4 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="提示词标题"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">分类</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full h-10 bg-background rounded-lg px-4 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-primary/50"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">标签</label>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <span className="text-sm text-muted-foreground">请先创建标签</span>
              ) : (
                tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-surface-hover'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full bg-background rounded-lg p-4 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="提示词内容..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 bg-surface-hover text-muted-foreground rounded-lg text-sm font-medium hover:bg-opacity-80"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditPromptModal({ prompt, categories, tags, onClose, onSuccess }) {
  const [title, setTitle] = useState(prompt.title)
  const [content, setContent] = useState(prompt.content)
  const [categoryId, setCategoryId] = useState(prompt.category_id)
  const [selectedTags, setSelectedTags] = useState(prompt.tags?.map(t => t.id) || [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !categoryId) return
    
    try {
      const res = await fetch(`${API_BASE}/prompts/${prompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category_id: categoryId,
          tag_ids: selectedTags
        })
      })
      if (res.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to update prompt:', error)
    }
  }

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl w-[600px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-white">编辑提示词</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <div>
            <label className="block text-sm text-gray-300 mb-2">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 bg-background rounded-lg px-4 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">分类</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full h-10 bg-background rounded-lg px-4 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-primary/50"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">标签</label>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <span className="text-sm text-muted-foreground">请先创建标签</span>
              ) : (
                tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-surface-hover'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full bg-background rounded-lg p-4 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 bg-surface-hover text-muted-foreground rounded-lg text-sm font-medium hover:bg-opacity-80"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App
