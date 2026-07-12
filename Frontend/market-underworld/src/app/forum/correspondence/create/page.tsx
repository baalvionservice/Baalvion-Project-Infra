
"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  ChevronRight, 
  Mail, 
  X, 
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
  Maximize2
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * @fileOverview Start a conversation page matching XenForo high-fidelity reference.
 */

function StartConversationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const toUser = searchParams.get('to') || 'Soules'
  
  const [headline, setHeadline] = useState('')
  const [recipients, setRecipients] = useState([toUser])

  return (
    <div className="min-h-screen bg-[#edf2f7] pb-20">
      <div className="container mx-auto px-4 pt-10">
        {/* Top Breadcrumbs */}
        <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500 mb-6">
          <span className="text-blue-600 hover:underline cursor-pointer">Correspondence</span>
          <ChevronRight size={14} className="text-gray-400" />
        </div>

        <h1 className="text-2xl font-normal text-[#1a2634] mb-6">Start a conversation</h1>

        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          {/* Form Rows */}
          <div className="divide-y divide-gray-100">
            {/* Recipient Row */}
            <div className="grid grid-cols-[120px_1fr] md:grid-cols-[200px_1fr] items-center">
              <div className="px-6 py-4 text-right bg-gray-50/50 border-r border-gray-100">
                <span className="text-sm font-medium text-black">Recipient:</span>
              </div>
              <div className="px-6 py-4 flex flex-wrap gap-2">
                {recipients.map(user => (
                  <div key={user} className="flex items-center gap-1.5 bg-[#f0f2f5] border border-gray-300 rounded px-2 py-1">
                    <button 
                      onClick={() => setRecipients(prev => prev.filter(u => u !== user))}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                    <span className="text-sm font-medium text-black">{user}</span>
                  </div>
                ))}
                <input 
                  type="text" 
                  className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm font-medium"
                  placeholder={recipients.length === 0 ? "Name..." : ""}
                />
              </div>
            </div>

            {/* Headline Row */}
            <div className="p-0">
              <input 
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Headline"
                className="w-full px-6 py-5 text-xl font-medium text-gray-400 border-none outline-none focus:text-black transition-colors"
              />
            </div>

            {/* Editor Toolbar Row */}
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

            {/* Editor Textarea Row */}
            <div className="p-0 min-h-[300px]">
              <textarea 
                className="w-full h-full min-h-[300px] p-6 text-sm text-gray-700 border-none outline-none resize-none"
                placeholder="Write your message here..."
              />
            </div>

            {/* Options Row */}
            <div className="grid grid-cols-[120px_1fr] md:grid-cols-[200px_1fr]">
              <div className="bg-gray-50/50 border-r border-gray-100" />
              <div className="px-6 py-8 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-[13px] font-medium text-gray-700">Allow participants to add other users to the conversation</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-[13px] font-medium text-gray-700">Close the conversation (no more replies)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="bg-[#f0f2f5] p-4 flex justify-center border-t border-gray-200">
            <button 
              onClick={() => {
                alert("Message Protocol Initialized. Handshaking with node...");
                router.back();
              }}
              className="bg-[#4a5568] hover:bg-[#2d3748] text-white px-8 h-10 rounded flex items-center gap-2 font-bold text-[13px] transition-all shadow-sm"
            >
              <MessageSquare size={16} />
              <span>Start a conversation</span>
            </button>
          </div>
        </div>

        {/* Bottom Breadcrumbs */}
        <div className="flex items-center gap-2 text-[13px] font-medium text-blue-600 hover:underline cursor-pointer mt-8">
          <span>Correspondence</span>
          <ChevronRight size={14} className="text-gray-400" />
        </div>
      </div>
    </div>
  )
}

export default function StartConversationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#edf2f7] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-gray-400">Loading Protocol...</div>}>
      <StartConversationContent />
    </Suspense>
  )
}

function EditorButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="p-2 text-gray-500 hover:bg-gray-200 hover:text-black rounded transition-all">
      {icon}
    </button>
  )
}
