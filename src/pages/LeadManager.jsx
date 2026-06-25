import React, { useState, useMemo } from 'react';
import { useLeads } from '../context/LeadsContext';
import {
  Users, Search, Download, Trash2, Edit, Eye,
  Mail, Brain, Sparkles, Plus, X, Phone, Loader
} from 'lucide-react';
import * as XLSX from 'xlsx';

const LeadManager = () => {
  const { leads, loading, createLead, updateLead, deleteLead, bulkDeleteLeads } = useLeads();
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', company: '', email: '', phone: '', website: '', location: '', industry: '', status: 'new'
  });

  const calculateAIScore = (lead) => {
    let score = 0;
    if (lead?.name) score += 10;
    if (lead?.company) score += 15;
    if (lead?.email) score += 20;
    if (lead?.phone) score += 20;
    if (lead?.website) score += 15;
    if (lead?.location) score += 10;
    if (lead?.industry) score += 10;
    return Math.min(Math.round(score), 100);
  };

  const getFilteredLeads = () => {
    let filtered = [...leads];
    const search = searchTerm.toLowerCase();
    if (search) {
      filtered = filtered.filter(l =>
        l.name?.toLowerCase().includes(search) ||
        l.company?.toLowerCase().includes(search) ||
        l.email?.toLowerCase().includes(search)
      );
    }
    if (filterStatus !== 'all') filtered = filtered.filter(l => l.status === filterStatus);
    if (filterSource !== 'all') filtered = filtered.filter(l => l.source === filterSource);
    return filtered;
  };

  const filteredLeads = useMemo(() => getFilteredLeads(), [leads, searchTerm, filterStatus, filterSource]);

  if (loading && leads.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => !phone || /^[0-9+\-\s()]+$/.test(phone);
  const isDuplicate = (email) => leads.some(l => l.email?.toLowerCase() === email.toLowerCase());

  const exportToExcel = () => {
    const data = filteredLeads.map(l => ({ Name: l.name, Company: l.company, Email: l.email, Phone: l.phone, Status: l.status, 'AI Score': calculateAIScore(l) }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, `leads_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Company', 'Email', 'Phone', 'Status', 'AI Score'];
    const rows = filteredLeads.map(l => [l.name, l.company, l.email, l.phone, l.status, calculateAIScore(l)]);
    let csv = headers.join(',') + '\n';
    rows.forEach(r => csv += r.join(',') + '\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Enter name');
    if (!formData.email.trim()) return alert('Enter email');
    if (!validateEmail(formData.email)) return alert('Invalid email');
    if (formData.phone && !validatePhone(formData.phone)) return alert('Invalid phone');
    if (isDuplicate(formData.email)) return alert('Email already exists');

    setSubmitting(true);
    try {
      await createLead({ ...formData, source: 'manual' });
      setShowAddModal(false);
      setFormData({ name: '', company: '', email: '', phone: '', website: '', location: '', industry: '', status: 'new' });
      alert('✅ Lead added!');
    } catch (error) {
      alert('❌ Failed to add lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Enter name');
    if (!formData.email.trim()) return alert('Enter email');
    if (!validateEmail(formData.email)) return alert('Invalid email');

    setSubmitting(true);
    try {
      await updateLead(selectedLead._id, formData);
      setShowEditModal(false);
      alert('✅ Lead updated!');
    } catch (error) {
      alert('❌ Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const lead = leads.find(l => l._id === id);
      if (!lead) return alert('Lead not found');
      await updateLead(id, { ...lead, status });
    } catch (error) {
      alert('❌ Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this lead?')) await deleteLead(id);
  };

  const handleBulkDelete = async () => {
    if (!selectedLeads.length) return;
    if (window.confirm(`Delete ${selectedLeads.length} leads?`)) {
      await bulkDeleteLeads(selectedLeads);
      setSelectedLeads([]);
    }
  };

  const getStatusBadge = (status) => {
    const map = { new: 'bg-blue-500/20 text-blue-400', contacted: 'bg-yellow-500/20 text-yellow-400', qualified: 'bg-green-500/20 text-green-400', proposal: 'bg-orange-500/20 text-orange-400', closed: 'bg-pink-500/20 text-pink-400' };
    return map[status] || 'bg-gray-500/20 text-gray-400';
  };

  const stages = [
    { id: 'new', label: 'New', icon: '🆕' },
    { id: 'contacted', label: 'Contacted', icon: '📞' },
    { id: 'qualified', label: 'Qualified', icon: '✅' },
    { id: 'proposal', label: 'Proposal', icon: '📄' },
    { id: 'closed', label: 'Closed', icon: '🏆' },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="text-purple-400" size={32} />
              Lead Manager
              <span className="text-sm bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1 rounded-full text-white text-xs font-medium">
                {leads.length} Total
              </span>
            </h1>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setShowAddModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> Add</button>
            <button onClick={exportToExcel} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Download size={18} /> Excel</button>
            <button onClick={exportToCSV} className="bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Download size={18} /> CSV</button>
            {selectedLeads.length > 0 && (
              <button onClick={handleBulkDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Trash2 size={18} /> Delete {selectedLeads.length}</button>
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border border-purple-500/20 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[150px] relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-700/50 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none">
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="closed">Closed</option>
            </select>
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none">
              <option value="all">All Sources</option>
              <option value="google_maps">Google Maps</option>
              <option value="linkedin">LinkedIn</option>
              <option value="manual">Manual</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setViewMode('list')} className={`px-3 py-2 rounded-lg ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-slate-700/50 text-gray-400'}`}>List</button>
              <button onClick={() => setViewMode('kanban')} className={`px-3 py-2 rounded-lg ${viewMode === 'kanban' ? 'bg-purple-600 text-white' : 'bg-slate-700/50 text-gray-400'}`}>Kanban</button>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/30">
                  <tr>
                    <th className="px-4 py-3"><input type="checkbox" checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0} onChange={() => { if (selectedLeads.length === filteredLeads.length) setSelectedLeads([]); else setSelectedLeads(filteredLeads.map(l => l._id)); }} className="rounded border-slate-600 bg-slate-700 text-purple-500" /></th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Name</th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Company</th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Email</th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Score</th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const score = calculateAIScore(lead);
                    return (
                      <tr key={lead._id} className="border-t border-slate-700 hover:bg-slate-700/30">
                        <td className="px-4 py-3"><input type="checkbox" checked={selectedLeads.includes(lead._id)} onChange={() => { if (selectedLeads.includes(lead._id)) setSelectedLeads(selectedLeads.filter(id => id !== lead._id)); else setSelectedLeads([...selectedLeads, lead._id]); }} className="rounded border-slate-600 bg-slate-700 text-purple-500" /></td>
                        <td className="px-4 py-3 text-white">{lead.name || '-'}</td>
                        <td className="px-4 py-3 text-gray-300">{lead.company || '-'}</td>
                        <td className="px-4 py-3 text-gray-300">{lead.email || '-'}</td>
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-16 bg-slate-700 rounded-full h-2"><div className={`h-2 rounded-full ${score >= 80 ? 'bg-purple-500' : score >= 60 ? 'bg-blue-500' : 'bg-gray-500'}`} style={{ width: `${score}%` }}></div></div><span className={`text-sm ${score >= 80 ? 'text-purple-400' : score >= 60 ? 'text-blue-400' : 'text-gray-400'}`}>{score}%</span></div></td>
                        <td className="px-4 py-3">
                          <select value={lead.status || 'new'} onChange={(e) => handleStatusChange(lead._id, e.target.value)} className={`px-2 py-1 rounded-full text-xs border-none outline-none cursor-pointer ${getStatusBadge(lead.status)}`}>
                            <option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="proposal">Proposal</option><option value="closed">Closed</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button onClick={() => { setSelectedLead(lead); setShowViewModal(true); }} className="p-1 hover:bg-slate-600 rounded"><Eye size={16} className="text-gray-400" /></button>
                          <button onClick={() => { setSelectedLead(lead); setFormData({ name: lead.name, company: lead.company, email: lead.email, phone: lead.phone, website: lead.website, location: lead.location, industry: lead.industry, status: lead.status }); setShowEditModal(true); }} className="p-1 hover:bg-slate-600 rounded"><Edit size={16} className="text-gray-400" /></button>
                          <button onClick={() => handleDelete(lead._id)} className="p-1 hover:bg-red-500/20 rounded"><Trash2 size={16} className="text-gray-400 hover:text-red-400" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-700 text-gray-400 text-sm">{filteredLeads.length} of {leads.length} leads</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stages.map((stage) => {
              const stageLeads = filteredLeads.filter(l => l.status === stage.id);
              return (
                <div key={stage.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-4 min-h-[300px]">
                  <div className="flex items-center gap-2 mb-4"><span>{stage.icon}</span><h4 className="text-white font-medium">{stage.label}</h4><span className="bg-slate-700 px-2 py-0.5 rounded-full text-xs text-gray-300">{stageLeads.length}</span></div>
                  <div className="space-y-2">
                    {stageLeads.map((lead) => (
                      <div key={lead._id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 hover:border-purple-500 cursor-pointer" onClick={() => { setSelectedLead(lead); setShowViewModal(true); }}>
                        <div className="flex justify-between"><div><h5 className="text-white text-sm font-medium">{lead.name || 'Unnamed'}</h5><p className="text-gray-400 text-xs">{lead.company || ''}</p></div><Brain size={14} className="text-purple-400" /></div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400"><Mail size={12} /><span className="truncate">{lead.email || 'No email'}</span></div>
                        <select value={lead.status || 'new'} onChange={(e) => { e.stopPropagation(); handleStatusChange(lead._id, e.target.value); }} className="w-full mt-2 bg-slate-800 text-xs text-white rounded px-2 py-1 border border-slate-600 focus:border-purple-500 outline-none" onClick={(e) => e.stopPropagation()}>
                          <option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="proposal">Proposal</option><option value="closed">Closed</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedLead && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-purple-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h3 className="text-white text-xl font-bold"><Eye size={24} className="inline text-blue-400 mr-2" />Lead Details</h3><button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button></div>
            <div className="space-y-4">
              <div className="flex justify-between"><div><p className="text-sm text-gray-400">Name</p><p className="text-white text-lg font-semibold">{selectedLead.name}</p></div><div><p className="text-sm text-gray-400">Status</p><span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedLead.status)}`}>{selectedLead.status}</span></div></div>
              <div className="bg-slate-700/30 rounded-lg p-4"><div className="flex justify-between"><span className="text-sm text-gray-400">AI Score</span><div className="flex items-center gap-2"><div className="w-32 bg-slate-700 rounded-full h-2"><div className={`h-2 rounded-full ${calculateAIScore(selectedLead) >= 80 ? 'bg-purple-500' : calculateAIScore(selectedLead) >= 60 ? 'bg-blue-500' : 'bg-gray-500'}`} style={{ width: `${calculateAIScore(selectedLead)}%` }}></div></div><span className={`text-sm font-medium ${calculateAIScore(selectedLead) >= 80 ? 'text-purple-400' : calculateAIScore(selectedLead) >= 60 ? 'text-blue-400' : 'text-gray-400'}`}>{calculateAIScore(selectedLead)}%</span></div></div></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-400">Company</p><p className="text-white">{selectedLead.company || '-'}</p></div>
                <div><p className="text-sm text-gray-400">Email</p><p className="text-white">{selectedLead.email || '-'}</p></div>
                <div><p className="text-sm text-gray-400">Phone</p><p className="text-white">{selectedLead.phone || '-'}</p></div>
                <div><p className="text-sm text-gray-400">Website</p><p className="text-white">{selectedLead.website || '-'}</p></div>
                <div><p className="text-sm text-gray-400">Location</p><p className="text-white">{selectedLead.location || '-'}</p></div>
                <div><p className="text-sm text-gray-400">Industry</p><p className="text-white">{selectedLead.industry || '-'}</p></div>
                <div><p className="text-sm text-gray-400">Source</p><p className="text-white">{selectedLead.source || '-'}</p></div>
                <div><p className="text-sm text-gray-400">Created</p><p className="text-white">{selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString() : '-'}</p></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button onClick={() => { setShowViewModal(false); setFormData({ name: selectedLead.name, company: selectedLead.company, email: selectedLead.email, phone: selectedLead.phone, website: selectedLead.website, location: selectedLead.location, industry: selectedLead.industry, status: selectedLead.status }); setShowEditModal(true); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"><Edit size={16} /> Edit</button>
                <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-purple-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h3 className="text-white text-xl font-bold"><Plus size={24} className="inline text-green-400 mr-2" />Add New Lead</h3><button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button></div>
            <form onSubmit={handleAddLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-400 block mb-1">Name *</label><input type="text" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none" required /></div>
                <div><label className="text-sm text-gray-400 block mb-1">Company</label><input type="text" name="company" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-400 block mb-1">Email *</label><input type="email" name="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none" required /></div>
                <div><label className="text-sm text-gray-400 block mb-1">Phone</label><input type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-400 block mb-1">Website</label><input type="url" name="website" value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none" /></div>
                <div><label className="text-sm text-gray-400 block mb-1">Location</label><input type="text" name="location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-400 block mb-1">Industry</label><input type="text" name="industry" value={formData.industry} onChange={(e) => setFormData({...formData, industry: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none" /></div>
                <div><label className="text-sm text-gray-400 block mb-1">Status</label><select name="status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none">
                  <option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="proposal">Proposal</option><option value="closed">Closed</option>
                </select></div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4"><div className="flex justify-between"><span className="text-sm text-gray-400">AI Score Preview</span><div className="flex items-center gap-2"><div className="w-32 bg-slate-700 rounded-full h-2"><div className={`h-2 rounded-full ${calculateAIScore(formData) >= 80 ? 'bg-purple-500' : calculateAIScore(formData) >= 60 ? 'bg-blue-500' : 'bg-gray-500'}`} style={{ width: `${calculateAIScore(formData)}%` }}></div></div><span className={`text-sm font-medium ${calculateAIScore(formData) >= 80 ? 'text-purple-400' : calculateAIScore(formData) >= 60 ? 'text-blue-400' : 'text-gray-400'}`}>{calculateAIScore(formData)}%</span></div></div></div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">{submitting ? <><Loader size={16} className="animate-spin" /> Saving...</> : 'Save Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedLead && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-purple-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h3 className="text-white text-xl font-bold"><Edit size={24} className="inline text-yellow-400 mr-2" />Edit Lead</h3><button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button></div>
            <form onSubmit={handleUpdateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-400 block mb-1">Name *</label><input type="text" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none" required /></div>
                <div><label className="text-sm text-gray-400 block mb-1">Company</label><input type="text" name="company" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-400 block mb-1">Email *</label><input type="email" name="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none" required /></div>
                <div><label className="text-sm text-gray-400 block mb-1">Phone</label><input type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-400 block mb-1">Website</label><input type="url" name="website" value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none" /></div>
                <div><label className="text-sm text-gray-400 block mb-1">Location</label><input type="text" name="location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-400 block mb-1">Industry</label><input type="text" name="industry" value={formData.industry} onChange={(e) => setFormData({...formData, industry: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none" /></div>
                <div><label className="text-sm text-gray-400 block mb-1">Status</label><select name="status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none">
                  <option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="proposal">Proposal</option><option value="closed">Closed</option>
                </select></div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4"><div className="flex justify-between"><span className="text-sm text-gray-400">AI Score</span><div className="flex items-center gap-2"><div className="w-32 bg-slate-700 rounded-full h-2"><div className={`h-2 rounded-full ${calculateAIScore(formData) >= 80 ? 'bg-purple-500' : calculateAIScore(formData) >= 60 ? 'bg-blue-500' : 'bg-gray-500'}`} style={{ width: `${calculateAIScore(formData)}%` }}></div></div><span className={`text-sm font-medium ${calculateAIScore(formData) >= 80 ? 'text-purple-400' : calculateAIScore(formData) >= 60 ? 'text-blue-400' : 'text-gray-400'}`}>{calculateAIScore(formData)}%</span></div></div></div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">{submitting ? <><Loader size={16} className="animate-spin" /> Updating...</> : 'Update Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManager;
