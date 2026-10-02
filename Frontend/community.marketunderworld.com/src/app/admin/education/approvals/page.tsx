"use client";

import React, { useState } from 'react';
import { GraduationCap, Search, CheckCircle, XCircle, Clock, PlayCircle, User } from 'lucide-react';

const MOCK_COURSES = [
  { id: "CRS-5501", teacher: "HackMaster_v2", title: "Advanced SQL Injection & WAF Bypass", category: "Hacking", lessons: 24, duration: "8h 30m", price: "$299", submittedDate: "2026-10-02", status: "Awaiting Review", thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&h=180&fit=crop" },
  { id: "CRS-5502", teacher: "CryptoTrader_Pro", title: "Dark Market Trading Strategies 2026", category: "Finance", lessons: 18, duration: "6h 15m", price: "$199", submittedDate: "2026-10-01", status: "Awaiting Review", thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&h=180&fit=crop" },
  { id: "CRS-5503", teacher: "OSINT_Detective", title: "Open Source Intelligence Masterclass", category: "OSINT", lessons: 32, duration: "12h 00m", price: "$399", submittedDate: "2026-09-30", status: "Approved", thumbnail: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=300&h=180&fit=crop" },
];

function statusClass(status: string) {
  if (status === 'Awaiting Review') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  if (status === 'Approved') return 'bg-green-500/10 text-green-400 border border-green-500/20';
  if (status === 'Rejected') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  return 'bg-white/10 text-gray-400';
}

export default function CourseApprovals() {
  const [courses, setCourses] = useState(MOCK_COURSES);

  const approve = (id: string) => setCourses(courses.map(c => c.id === id ? { ...c, status: "Approved" } : c));
  const reject = (id: string) => setCourses(courses.map(c => c.id === id ? { ...c, status: "Rejected" } : c));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-fuchsia-500" />
            Course Approvals
          </h1>
          <p className="text-sm text-gray-400 mt-1">Review and approve or reject new courses submitted by teachers before they go live.</p>
        </div>
      </div>

      <div className="bg-[#121217] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search courses or teachers..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/50"
            />
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {courses.map(course => (
            <div key={course.id} className="p-6 hover:bg-white/[0.02] transition-colors">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-48 h-28 rounded-xl overflow-hidden shrink-0 bg-white/5">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-[10px] font-bold uppercase rounded">
                          {course.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusClass(course.status)}`}>
                          {course.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{course.title}</h3>
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-400">
                        <User className="w-3.5 h-3.5" />
                        <span>{course.teacher}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-black text-green-400">{course.price}</div>
                      <div className="text-xs text-gray-500 mt-1">Submitted {course.submittedDate}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <PlayCircle className="w-4 h-4 text-fuchsia-400" />
                      {course.lessons} lessons
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Clock className="w-4 h-4 text-blue-400" />
                      {course.duration}
                    </div>

                    <div className="ml-auto flex gap-3">
                      <button
                        onClick={() => reject(course.id)}
                        disabled={course.status !== 'Awaiting Review'}
                        className="flex items-center gap-2 h-9 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-xl text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                      <button
                        onClick={() => approve(course.id)}
                        disabled={course.status !== 'Awaiting Review'}
                        className="flex items-center gap-2 h-9 px-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve & Publish
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
