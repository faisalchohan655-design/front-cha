import React, { useContext, useState } from 'react';
import { LeadsContext } from '../context/LeadsContext';
import {
  Users, Search, Download, Trash2, Edit, Eye,
  Mail, Brain, Sparkles, Plus, X, Phone
} from 'lucide-react';
import * as XLSX from 'xlsx';

const LeadManager = () => {
  const { leads, deleteLead, bulkDeleteLeads } = useContext(LeadsContext);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'new'
  });

  const calculateAIScore = (lead) => {
    let score = 30;
    if (lead.company) score += 15;
    if (lead.email) score += 10;
    if (lead.phone) score += 10;
    if (lead.website) score += 5;
    if (lead.location) score += 5;
    if (lead.status === 'qualified') score += 15;
    if (lead.status === 'proposal') score += 10;
    return Math.min(score, 100);
  };

  const getFilteredLeads = () => {
    let filtered = [...leads];
    if (searchTerm) {
      filtered = filtered.filter(l =>
        l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const filteredLeads = getFilteredLeads();

  const exportToExcel = () => {
    const exportData = filteredLeads.map(l => ({
      Name: l.name || '',
      Company: l.company || '',
      Email: l.email || '',
      Phone: l.phone || '',
      Status: l.status || '',
      'AI Score': calculateAIScore(l),
      Source: l.source || '',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, `leads_manager_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Company', 'Email', 'Phone', 'Status', 'AI Score', 'Source'];
    const csvData = filteredLeads.map(l => [
      l.name || '', l.company || '', l.email || '', 
      l.phone || '', l.status || '', calculateAIScore(l), l.source || ''
    ]);
    let csv = headers.join(',') + '\n';
    csvData.forEach(row => { csv += row.join(',') + '\n'; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_manager_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    if (window.confirm(`Delete ${selectedLeads.length} leads?`)) {
      await bulkDeleteLeads(selectedLeads);
      setSelectedLeads([]);
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    const { createLead } = useContext(LeadsContext);
    await createLead(formData);
    setShowAddModal(false);
    setFormData({ name: '', company: '', email: '', phone: '', status: 'new' });
    alert('Lead added successfully!');
  };

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

  const stages = [
    { id: 'new', label: 'New', icon: '🆕' },
    { id: 'contacted', label: 'Contacted', icon: '📞' },
    { id: 'qualified', label: 'Qualified', icon: '✅' },
    { id: 'proposal', label: 'Proposal', icon: '📄' },
    { id: 'closed', label: 'Closed', icon: '🏆' },
  ];

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border border-purple-500/20 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[150px] relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
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
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(lead.status)}`}>
                              {lead.status || 'new'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button className="p-1 hover:bg-slate-600 rounded-lg"><Eye size={16} className="text-gray-400 hover:text-white" /></button>
                              <button className="p-1 hover:bg-slate-600 rounded-lg"><Edit size={16} className="text-gray-400 hover:text-white" /></button>
                              <button onClick={() => { if (window.confirm('Delete this lead?')) deleteLead(lead._id); }} className="p-1 hover:bg-red-500/20 rounded-lg"><Trash2 size={16} className="text-gray-400 hover:text-red-400" /></button>
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
                      <div key={lead._id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 hover:border-purple-500 transition-colors">
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
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-purple-500/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white text-xl font-bold">Add New Lead</h3>
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
                  <label className="text-sm text-gray-400 block mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
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
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all">
                  Save Lead
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
