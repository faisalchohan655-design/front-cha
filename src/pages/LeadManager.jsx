import React, { useState, useMemo } from 'react';
import { useLeads } from '../context/LeadsContext'; // ✅ CORRECT IMPORT
import {
  Users, Search, Download, Trash2, Edit, Eye,
  Mail, Brain, Sparkles, Plus, X, Phone,
  Globe, MapPin, Briefcase, Star, Loader
} from 'lucide-react';
import * as XLSX from 'xlsx';

const LeadManager = () => {
  // ✅ Using the custom hook
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
    name: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    location: '',
    industry: '',
    status: 'new'
  });

  // ============================================================
  // AI SCORING
  // ============================================================
  const calculateAIScore = (lead) => {
    let score = 0;

    if (lead?.name) score += 10;
    if (lead?.company) score += 15;
    if (lead?.email) score += 20;
    if (lead?.phone) score += 20;
    if (lead?.website) score += 15;
    if (lead?.location) score += 10;
    if (lead?.industry) score += 10;

    if (lead?.rating) {
      score += Math.min(lead.rating * 4, 20);
    }

    return Math.min(Math.round(score), 100);
  };

  // ============================================================
  // FILTER LEADS (with useMemo optimization)
  // ============================================================
  const getFilteredLeads = () => {
    let filtered = [...leads];
    const search = searchTerm.toLowerCase();

    if (search) {
      filtered = filtered.filter(l =>
        l.name?.toLowerCase().includes(search) ||
        l.company?.toLowerCase().includes(search) ||
        l.email?.toLowerCase().includes(search) ||
        l.phone?.toLowerCase().includes(search) ||
        l.website?.toLowerCase().includes(search) ||
        l.location?.toLowerCase().includes(search) ||
        l.industry?.toLowerCase().includes(search)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(l => l.status === filterStatus);
    }

    if (filterSource !== 'all') {
      filtered = filtered.filter(l => l.source === filterSource);
    }

    return filtered;
  };

  const filteredLeads = useMemo(() => {
    return getFilteredLeads();
  }, [leads, searchTerm, filterStatus, filterSource]);

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading && leads.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // ============================================================
  // VALIDATION HELPERS
  // ============================================================
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return true;
    return /^[0-9+\-\s()]+$/.test(phone);
  };

  const isLeadDuplicate = (email) => {
    return leads.some(
      lead => lead.email?.toLowerCase() === email.toLowerCase()
    );
  };

  // ============================================================
  // EXPORT FUNCTIONS
  // ============================================================
  const escapeCSV = (value) => `"${String(value || '').replace(/"/g, '""')}"`;

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const exportData = filteredLeads.map(l => ({
      Name: l.name || '',
      Company: l.company || '',
      Email: l.email || '',
      Phone: l.phone || '',
      Website: l.website || '',
      Location: l.location || '',
      Industry: l.industry || '',
      Source: l.source || '',
      Status: l.status || '',
      'AI Score': calculateAIScore(l),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    downloadFile(blob, `leads_manager_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Company', 'Email', 'Phone', 'Website', 'Location', 'Industry', 'Source', 'Status', 'AI Score'];
    const csvData = filteredLeads.map(l => [
      escapeCSV(l.name || ''),
      escapeCSV(l.company || ''),
      escapeCSV(l.email || ''),
      escapeCSV(l.phone || ''),
      escapeCSV(l.website || ''),
      escapeCSV(l.location || ''),
      escapeCSV(l.industry || ''),
      escapeCSV(l.source || ''),
      escapeCSV(l.status || ''),
      escapeCSV(calculateAIScore(l))
    ]);
    let csv = headers.join(',') + '\n';
    csvData.forEach(row => { csv += row.join(',') + '\n'; });
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, `leads_manager_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // ============================================================
  // BULK DELETE
  // ============================================================
  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    if (window.confirm(`Delete ${selectedLeads.length} leads?`)) {
      await bulkDeleteLeads(selectedLeads);
      setSelectedLeads([]);
    }
  };

  // ============================================================
  // ADD LEAD
  // ============================================================
  const handleAddLead = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a name');
      return;
    }

    if (!formData.email.trim()) {
      alert('Please enter an email');
      return;
    }

    if (!validateEmail(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      alert('Please enter a valid phone number');
      return;
    }

    if (isLeadDuplicate(formData.email)) {
      alert('A lead with this email already exists');
      return;
    }

    setSubmitting(true);
    try {
      const newLead = {
        name: formData.name,
        company: formData.company || '',
        email: formData.email,
        phone: formData.phone || '',
        website: formData.website || '',
        location: formData.location || '',
        industry: formData.industry || '',
        status: formData.status,
        source: 'manual'
      };
      await createLead(newLead);
      setShowAddModal(false);
      setFormData({ name: '', company: '', email: '', phone: '', website: '', location: '', industry: '', status: 'new' });
      alert('✅ Lead added successfully!');
    } catch (error) {
      console.error('Error adding lead:', error);
      alert('❌ Failed to add lead. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // EDIT LEAD
  // ============================================================
  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name || '',
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      website: lead.website || '',
      location: lead.location || '',
      industry: lead.industry || '',
      status: lead.status || 'new'
    });
    setShowEditModal(true);
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a name');
      return;
    }

    if (!formData.email.trim()) {
      alert('Please enter an email');
      return;
    }

    if (!validateEmail(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      alert('Please enter a valid phone number');
      return;
    }

    setSubmitting(true);
    try {
      await updateLead(selectedLead._id, formData);
      setShowEditModal(false);
      setSelectedLead(null);
      setFormData({ name: '', company: '', email: '', phone: '', website: '', location: '', industry: '', status: 'new' });
      alert('✅ Lead updated successfully!');
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('❌ Failed to update lead. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // VIEW LEAD
  // ============================================================
  const openViewModal = (lead) => {
    setSelectedLead(lead);
    setShowViewModal(true);
  };

  // ============================================================
  // STATUS UPDATE (with validation)
  // ============================================================
  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const lead = leads.find(l => l._id === leadId);

      if (!lead) {
        alert('Lead not found');
        return;
      }

      await updateLead(leadId, {
        ...lead,
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('❌ Failed to update status');
    }
  };

  // ============================================================
  // DELETE LEAD
  // ============================================================
  const handleDeleteLead = async (id) => {
    if (window.confirm('Delete this lead?')) {
      await deleteLead(id);
    }
  };

  // ============================================================
  // SELECT HANDLERS
  // ============================================================
  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l._id));
    }
  };

  const handleSingleSelect = (id) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(leadId => leadId !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  // ============================================================
  // INPUT HANDLER
  // ============================================================
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ============================================================
  // STATUS BADGE
  // ============================================================
  const getStatusBadge = (status) => {
    const classes = {
      new: 'bg-blue-500/20 text-blue-400',
      contacted: 'bg-yellow-500/20 text-yellow-400',
      qualified: 'bg-green-500/20 text-green-400',
      proposal: 'bg-orange-500/20 text-orange-400',
      closed: 'bg-pink-500/20 text-pink-400'
    };
    return classes[status] || 'bg-gray-500/20 text-gray-400';
  };

  // ============================================================
  // STAGES
  // ============================================================
  const stages = [
    { id: 'new', label: 'New', icon: '🆕' },
    { id: 'contacted', label: 'Contacted', icon: '📞' },
    { id: 'qualified', label: 'Qualified', icon: '✅' },
    { id: 'proposal', label: 'Proposal', icon: '📄' },
    { id: 'closed', label: 'Closed', icon: '🏆' },
  ];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="text-purple-400" size={32} />
              Lead Manager
              <span className="text-sm bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1 rounded-full text-white text-xs font-medium">
                {leads.length} Total
              </span>
            </h1>
            <p className="text-gray-400 mt-1 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              AI-powered lead management with smart pipeline
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center gap-2"
            >
              <Plus size={18} /> Add Lead
            </button>
            <button onClick={exportToExcel} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2">
              <Download size={18} /> Excel
            </button>
            <button onClick={exportToCSV} className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-all flex items-center gap-2">
              <Download size={18} /> CSV
            </button>
            {selectedLeads.length > 0 && (
              <button onClick={handleBulkDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all flex items-center gap-2">
                <Trash2 size={18} /> Delete {selectedLeads.length}
              </button>
            )}
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border border-purple-500/20 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[150px] relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads by name, company, email, phone, website, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700/50 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none text-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none text-sm"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none text-sm"
            >
              <option value="all">All Sources</option>
              <option value="google_maps">Google Maps</option>
              <option value="linkedin">LinkedIn</option>
              <option value="website">Website</option>
              <option value="manual">Manual</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-slate-700/50 text-gray-400 hover:bg-slate-600/50'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  viewMode === 'kanban' ? 'bg-purple-600 text-white' : 'bg-slate-700/50 text-gray-400 hover:bg-slate-600/50'
                }`}
              >
                Kanban
              </button>
            </div>
          </div>
        </div>

        {/* LIST VIEW */}
        {viewMode === 'list' ? (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/30">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Name</th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Company</th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Email</th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">AI Score</th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.length === 0 ? (
                    <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-400">No leads found</td></tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const aiScore = calculateAIScore(lead);
                      return (
                        <tr key={lead._id} className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(lead._id)}
                              onChange={() => handleSingleSelect(lead._id)}
                              className="rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-white font-medium">{lead.name || '-'}</td>
                          <td className="px-4 py-3 text-gray-300">{lead.company || '-'}</td>
                          <td className="px-4 py-3 text-gray-300">{lead.email || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-700 rounded-full h-2">
                                <div className={`h-2 rounded-full ${aiScore >= 80 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : aiScore >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-500'}`} style={{ width: `${aiScore}%` }}></div>
                              </div>
                              <span className={`text-sm font-medium ${aiScore >= 80 ? 'text-purple-400' : aiScore >= 60 ? 'text-blue-400' : 'text-gray-400'}`}>{aiScore}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={lead.status || 'new'}
                              onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                              className={`px-2 py-1 rounded-full text-xs border-none outline-none cursor-pointer ${getStatusBadge(lead.status)}`}
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="qualified">Qualified</option>
                              <option value="proposal">Proposal</option>
                              <option value="closed">Closed</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openViewModal(lead)}
                                className="p-1 hover:bg-slate-600 rounded-lg"
                                title="View Lead"
                              >
                                <Eye size={16} className="text-gray-400 hover:text-white" />
                              </button>
                              <button
                                onClick={() => openEditModal(lead)}
                                className="p-1 hover:bg-slate-600 rounded-lg"
                                title="Edit Lead"
                              >
                                <Edit size={16} className="text-gray-400 hover:text-white" />
                              </button>
                              <button
                                onClick={() => handleDeleteLead(lead._id)}
                                className="p-1 hover:bg-red-500/20 rounded-lg"
                                title="Delete Lead"
                              >
                                <Trash2 size={16} className="text-gray-400 hover:text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-between items-center">
              <span className="text-gray-400 text-sm">{filteredLeads.length} of {leads.length} leads</span>
            </div>
          </div>
        ) : (
          /* KANBAN VIEW */
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stages.map((stage) => {
              const stageLeads = filteredLeads.filter(l => l.status === stage.id);
              return (
                <div key={stage.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-4 min-h-[300px]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span>{stage.icon}</span>
                      <h4 className="text-white font-medium">{stage.label}</h4>
                      <span className="bg-slate-700 px-2 py-0.5 rounded-full text-xs text-gray-300">{stageLeads.length}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {stageLeads.map((lead) => (
                      <div key={lead._id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 hover:border-purple-500 transition-colors cursor-pointer" onClick={() => openViewModal(lead)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="text-white text-sm font-medium">{lead.name || 'Unnamed'}</h5>
                            <p className="text-gray-400 text-xs">{lead.company || ''}</p>
                          </div>
                          <Brain size={14} className="text-purple-400" />
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <Mail size={12} /><span className="truncate">{lead.email || 'No email'}</span>
                        </div>
                        <select
                          value={lead.status || 'new'}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(lead._id, e.target.value);
                          }}
                          className="w-full mt-2 bg-slate-800 text-xs text-white rounded px-2 py-1 border border-slate-600 focus:border-purple-500 outline-none"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="proposal">Proposal</option>
                          <option value="closed">Closed</option>
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

      {/* ===== VIEW MODAL ===== */}
      {showViewModal && selectedLead && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-purple-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white text-xl font-bold flex items-center gap-2">
                <Eye size={24} className="text-blue-400" /> Lead Details
              </h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="text-white text-lg font-semibold">{selectedLead.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedLead.status)}`}>
                    {selectedLead.status || 'new'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">AI Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${calculateAIScore(selectedLead) >= 80 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : calculateAIScore(selectedLead) >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-500'}`}
                        style={{ width: `${calculateAIScore(selectedLead)}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${calculateAIScore(selectedLead) >= 80 ? 'text-purple-400' : calculateAIScore(selectedLead) >= 60 ? 'text-blue-400' : 'text-gray-400'}`}>
                      {calculateAIScore(selectedLead)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Company</p>
                  <p className="text-white">{selectedLead.company || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white">{selectedLead.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Phone</p>
                  <p className="text-white">{selectedLead.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Website</p>
                  <p className="text-white">{selectedLead.website || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="text-white">{selectedLead.location || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Industry</p>
                  <p className="text-white">{selectedLead.industry || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Source</p>
                  <p className="text-white">{selectedLead.source || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Created</p>
                  <p className="text-white">{selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString() : '-'}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(selectedLead);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
                >
                  <Edit size={16} /> Edit Lead
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD MODAL ===== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-purple-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white text-xl font-bold flex items-center gap-2">
                <Plus size={24} className="text-green-400" /> Add New Lead
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form className="space-y-4" onSubmit={handleAddLead}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Industry</label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* AI Score Preview */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">AI Score Preview</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${calculateAIScore(formData) >= 80 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : calculateAIScore(formData) >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-500'}`}
                        style={{ width: `${calculateAIScore(formData)}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${calculateAIScore(formData) >= 80 ? 'text-purple-400' : calculateAIScore(formData) >= 60 ? 'text-blue-400' : 'text-gray-400'}`}>
                      {calculateAIScore(formData)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <><Loader size={16} className="animate-spin" /> Saving...</> : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && selectedLead && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-purple-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white text-xl font-bold flex items-center gap-2">
                <Edit size={24} className="text-yellow-400" /> Edit Lead
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form className="space-y-4" onSubmit={handleUpdateLead}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Industry</label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* AI Score */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">AI Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${calculateAIScore(formData) >= 80 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : calculateAIScore(formData) >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-500'}`}
                        style={{ width: `${calculateAIScore(formData)}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${calculateAIScore(formData) >= 80 ? 'text-purple-400' : calculateAIScore(formData) >= 60 ? 'text-blue-400' : 'text-gray-400'}`}>
                      {calculateAIScore(formData)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <><Loader size={16} className="animate-spin" /> Updating...</> : 'Update Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManager;
