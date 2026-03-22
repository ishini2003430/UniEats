import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  X,
  MoreHorizontal,
  Search,
} from "lucide-react";
import api from "../services/api";

function ManageVendors({ onBack }) {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");

  const loadVendors = async () => {
    const res = await api.get("/api/admin/vendors/pending");
    setVendors(res.data);
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const approveVendor = async (id) => {
    await api.put(`/api/admin/vendors/approve/${id}`);
    loadVendors();
  };

  const deleteVendor = async (id) => {
    if (!window.confirm("Reject & delete this vendor?")) return;
    await api.delete(`/api/admin/users/${id}`);
    loadVendors();
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Pending Vendor Registrations
          </h2>
          <p className="text-slate-500">
            Review and approve new vendor applications
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="text-sm text-slate-500">
            Showing {filteredVendors.length} pending
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Applied</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredVendors.map((v) => (
              <tr
                key={v._id}
                className="hover:bg-slate-50 transition"
              >
                <td className="px-6 py-4 font-medium text-slate-900">
                  {v.vendorName}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {v.email}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {v.vendorLocation || "—"}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {new Date(v.createdAt).toLocaleDateString()}
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {/* Approve */}
                    <button
                      onClick={() => approveVendor(v._id)}
                      className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50"
                      title="Approve"
                    >
                      <Check className="w-5 h-5" />
                    </button>

                    {/* Reject */}
                    <button
                      onClick={() => deleteVendor(v._id)}
                      className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50"
                      title="Reject"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredVendors.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-10 text-slate-400"
                >
                  No pending vendors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default ManageVendors;
