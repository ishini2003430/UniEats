import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Trash2,
  Store,
  Search,
  Filter,
} from "lucide-react";
import api from "../services/api";

function ManageActiveVendors({ onBack }) {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");

  const loadVendors = async () => {
    const res = await api.get("/api/admin/vendors/active");
    setVendors(res.data);
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const deleteVendor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) return;
    await api.delete(`/api/admin/users/${id}`);
    loadVendors();
  };

  const filteredVendors = vendors.filter((v) =>
    v.vendorName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Active Vendors
            </h2>
            <p className="text-slate-500 text-sm">
              Manage approved vendor accounts
            </p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button className="flex items-center px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 text-sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>

        {/* Table */}
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredVendors.map((v) => (
              <tr
                key={v._id}
                className="hover:bg-slate-50 transition"
              >
                <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-500" />
                  {v.vendorName || "Unnamed Vendor"}
                </td>

                <td className="px-6 py-4 text-slate-500">
                  {v.email}
                </td>

                <td className="px-6 py-4 text-slate-500">
                  {v.vendorLocation || "—"}
                </td>

                <td className="px-6 py-4">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </td>

                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => deleteVendor(v._id)}
                    className="p-2 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {filteredVendors.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-10 text-slate-400"
                >
                  No active vendors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default ManageActiveVendors;
