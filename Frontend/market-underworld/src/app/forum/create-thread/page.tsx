"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronRight, 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  ImageIcon, 
  Smile, 
  List, 
  ListOrdered, 
  AlignLeft, 
  Undo2, 
  Redo2, 
  Code,
  Eye,
  MessageSquare,
  Eraser,
  Type,
  Palette,
  MoreHorizontal,
  Quote,
  Table,
  Maximize2,
  ArrowLeft,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FORUM_CATEGORIES } from '@/lib/mock-forum-data'

export default function CreateThreadPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(FORUM_CATEGORIES[0])

  return (
    <div className="min-h-screen bg-[#edf2f7] pb-20">
      <div className="container mx-auto px-4 pt-10">
        <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500 mb-6">
          <span className="text-blue-600 hover:underline cursor-pointer">Forums</span>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-blue-600 hover:underline cursor-pointer">General Discussion</span>
          <ChevronRight size={14} className="text-gray-400" />
        </div>

        <h1 className="text-2xl font-normal text-[#1a2634] mb-6">Post a new thread</h1>

        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {/* Title Row */}
            <div className="p-0">
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Thread title..."
                className="w-full px-6 py-5 text-xl font-medium text-gray-400 border-none outline-none focus:text-black transition-colors"
              />
            </div>

            {/* Category Row */}
            <div className="grid grid-cols-[120px_1fr] md:grid-cols-[200px_1fr] items-center">
              <div className="px-6 py-4 text-right bg-gray-50/50 border-r border-gray-100">
                <span className="text-sm font-medium text-black">Category:</span>
              </div>
              <div className="px-6 py-4">
                <div className="relative max-w-xs">
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded h-10 px-4 text-sm font-medium text-black outline-none focus:border-blue-400 appearance-none"
                  >
                    {FORUM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="bg-[#fcfcfc] border-y border-gray-200 px-4 py-2 flex flex-wrap items-center gap-1">
              <EditorButton icon={<Eraser size={16} />} />
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <EditorButton icon={<Bold size={16} />} />
              <EditorButton icon={<Italic size={16} />} />
              <EditorButton icon={<Type size={16} />} />
              <EditorButton icon={<Palette size={16} />} />
              <EditorButton icon={<MoreHorizontal size={16} />} />
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <EditorButton icon={<List size={16} />} />
              <EditorButton icon={<ListOrdered size={16} />} />
              <EditorButton icon={<AlignLeft size={16} />} />
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <EditorButton icon={<LinkIcon size={16} />} />
              <EditorButton icon={<ImageIcon size={16} />} />
              <EditorButton icon={<Smile size={16} />} />
              <EditorButton icon={<Quote size={16} />} />
              <EditorButton icon={<Code size={16} />} />
              <EditorButton icon={<Table size={16} />} />
              <EditorButton icon={<Undo2 size={16} />} />
              <EditorButton icon={<Redo2 size={16} />} />
              <EditorButton icon={<Maximize2 size={16} />} />
              <div className="ml-auto flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 text-xs font-bold text-gray-700 transition-all">
                  <Eye size={14} /> Preview
                </button>
              </div>
            </div>

            {/* Writing Area */}
            <div className="p-0 min-h-[400px]">
              <textarea 
                className="w-full h-full min-h-[400px] p-6 text-sm text-gray-700 border-none outline-none resize-none"
                placeholder="Content of the thread..."
              />
            </div>

            {/* Action Footer */}
            <div className="bg-[#f0f2f5] p-4 flex justify-end gap-3 border-t border-gray-200">
              <button 
                onClick={() => router.back()}
                className="bg-white border border-gray-300 text-gray-700 px-6 h-10 rounded font-bold text-[13px] hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert("Thread Protocol Initialized. Syncing with regional node...");
                  router.back();
                }}
                className="bg-[#4a5568] hover:bg-[#2d3748] text-white px-8 h-10 rounded flex items-center gap-2 font-bold text-[13px] transition-all shadow-sm"
              >
                <MessageSquare size={16} />
                <span>Post Thread</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditorButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="p-2 text-gray-500 hover:bg-gray-200 hover:text-black rounded transition-all">
      {icon}
    </button>
  )
}