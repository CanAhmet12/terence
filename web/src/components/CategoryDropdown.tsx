"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";
import type { Course } from "@/lib/api";

export interface FilterState {
  selectedCourses: number[];
  contentType: "all" | "video" | "pdf";
  status: "all" | "not_started" | "in_progress" | "completed";
}

interface CategoryDropdownProps {
  courses: Course[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  className?: string;
}

export function CategoryDropdown({
  courses,
  filters,
  onFilterChange,
  className = "",
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCourse = (courseId: number) => {
    const newSelected = filters.selectedCourses.includes(courseId)
      ? filters.selectedCourses.filter((id) => id !== courseId)
      : [...filters.selectedCourses, courseId];

    onFilterChange({ ...filters, selectedCourses: newSelected });
  };

  const handleClearAll = () => {
    onFilterChange({
      selectedCourses: [],
      contentType: "all",
      status: "all",
    });
    setSearchQuery("");
  };

  const handleApply = () => {
    setIsOpen(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.selectedCourses.length > 0) count++;
    if (filters.contentType !== "all") count++;
    if (filters.status !== "all") count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>Filtreler</span>
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right animate-in fade-in slide-in-from-top-2 rounded-xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Filtreler</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto p-4">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ders ara..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Courses */}
            <div className="mb-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                Dersler
              </h4>
              <div className="space-y-1">
                {filteredCourses.length === 0 ? (
                  <p className="py-2 text-center text-sm text-slate-400">Ders bulunamadı</p>
                ) : (
                  filteredCourses.map((course) => (
                    <label
                      key={course.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-slate-50"
                    >
                      <div className="relative flex h-5 w-5 items-center justify-center">
                        <input
                          type="checkbox"
                          checked={filters.selectedCourses.includes(course.id)}
                          onChange={() => toggleCourse(course.id)}
                          className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-slate-300 transition-colors checked:border-indigo-600 checked:bg-indigo-600 hover:border-slate-400"
                        />
                        <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                      </div>
                      <span className="flex-1 text-sm text-slate-700">{course.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Content Type */}
            <div className="mb-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                İçerik Tipi
              </h4>
              <div className="flex gap-2">
                {[
                  { value: "all", label: "Tümü" },
                  { value: "video", label: "Video" },
                  { value: "pdf", label: "PDF" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() =>
                      onFilterChange({
                        ...filters,
                        contentType: value as FilterState["contentType"],
                      })
                    }
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      filters.contentType === value
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                İlerleme Durumu
              </h4>
              <div className="space-y-1">
                {[
                  { value: "all", label: "Tümü" },
                  { value: "not_started", label: "Başlanmadı" },
                  { value: "in_progress", label: "Devam Ediyor" },
                  { value: "completed", label: "Tamamlandı" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() =>
                      onFilterChange({
                        ...filters,
                        status: value as FilterState["status"],
                      })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${
                      filters.status === value
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex gap-2">
              <button
                onClick={handleClearAll}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Temizle
              </button>
              <button
                onClick={handleApply}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
