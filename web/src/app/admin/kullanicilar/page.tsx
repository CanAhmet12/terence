"use client";

import { useState } from "react";
import { Search, MoreVertical, UserCheck, UserX } from "lucide-react";

const mockUsers = [
  { id: 1, name: "Ahmet Yılmaz", email: "ahmet@mail.com", role: "Öğrenci", status: "aktif", joinDate: "15 Oca 2025" },
  { id: 2, name: "Zeynep Kaya", email: "zeynep@mail.com", role: "Öğretmen", status: "aktif", joinDate: "10 Oca 2025" },
  { id: 3, name: "Mehmet Demir", email: "mehmet@mail.com", role: "Öğrenci", status: "pasif", joinDate: "5 Oca 2025" },
];

export default function AdminKullanicilarPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  return (
    <div className="p-8 lg:p-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kullanıcı Yönetimi</h1>
          <p className="text-slate-600 mt-1">Öğrenci ve öğretmen yönetimi</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim veya e-posta ara..."
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Tüm Roller</option>
          <option value="student">Öğrenci</option>
          <option value="teacher">Öğretmen</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Kullanıcı</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">E-posta</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Rol</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Durum</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Kayıt</th>
              <th className="w-12 p-4"></th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold">
                      {u.name[0]}
                    </div>
                    <span className="font-medium text-slate-900">{u.name}</span>
                  </div>
                </td>
                <td className="p-4 text-slate-600">{u.email}</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {u.role}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    u.status === "aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-4 text-slate-500 text-sm">{u.joinDate}</td>
                <td className="p-4">
                  <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
