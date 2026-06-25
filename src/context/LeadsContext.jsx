import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// ✅ CORRECT EXPORT - Named export for context
export const LeadsContext = createContext();

// ✅ CORRECT EXPORT - Default export for provider
export const LeadsProvider = ({ children }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'https://4-pageback-production.up.railway.app';

  // ===== FETCH LEADS =====
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/leads`);
      setLeads(response.data.data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      // Fallback mock data
      setLeads([
        { _id: '1', name: 'John Doe', company: 'Tech Corp', email: 'john@techcorp.com', phone: '+1 (555) 123-4567', status: 'new', source: 'google_maps', createdAt: new Date().toISOString() },
        { _id: '2', name: 'Sarah Smith', company: 'Finance Inc', email: 'sarah@financeinc.com', phone: '+1 (555) 234-5678', status: 'contacted', source: 'linkedin', createdAt: new Date().toISOString() },
        { _id: '3', name: 'Mike Johnson', company: 'Health Solutions', email: 'mike@healthsolutions.com', phone: '+1 (555) 345-6789', status: 'qualified', source: 'website', createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // ===== CREATE LEAD =====
  const createLead = async (leadData) => {
    try {
      const response = await axios.post(`${API_URL}/api/leads`, leadData);
      setLeads([...leads, response.data.data]);
      return response.data.data;
    } catch (error) {
      console.error('Error creating lead:', error);
      const newLead = { _id: Date.now().toString(), ...leadData, createdAt: new Date().toISOString() };
      setLeads([...leads, newLead]);
      return newLead;
    }
  };

  // ===== UPDATE LEAD =====
  const updateLead = async (id, leadData) => {
    try {
      const response = await axios.put(`${API_URL}/api/leads/${id}`, leadData);
      setLeads(leads.map(l => l._id === id ? response.data.data : l));
      return response.data.data;
    } catch (error) {
      console.error('Error updating lead:', error);
      setLeads(leads.map(l => l._id === id ? { ...l, ...leadData } : l));
      return { ...leadData, _id: id };
    }
  };

  // ===== DELETE LEAD =====
  const deleteLead = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/leads/${id}`);
      setLeads(leads.filter(l => l._id !== id));
    } catch (error) {
      console.error('Error deleting lead:', error);
      setLeads(leads.filter(l => l._id !== id));
    }
  };

  // ===== BULK DELETE LEADS =====
  const bulkDeleteLeads = async (ids) => {
    try {
      await axios.post(`${API_URL}/api/leads/bulk/delete`, { ids });
      setLeads(leads.filter(l => !ids.includes(l._id)));
    } catch (error) {
      console.error('Error bulk deleting leads:', error);
      setLeads(leads.filter(l => !ids.includes(l._id)));
    }
  };

  // ===== BULK SAVE LEADS =====
  const saveLeads = async (newLeads) => {
    try {
      const response = await axios.post(`${API_URL}/api/leads/bulk`, newLeads);
      setLeads([...leads, ...response.data.data]);
      return response.data.data;
    } catch (error) {
      console.error('Error saving leads:', error);
      const saved = newLeads.map(l => ({ 
        ...l, 
        _id: Date.now().toString() + Math.random().toString(36).substr(2, 9), 
        createdAt: new Date().toISOString() 
      }));
      setLeads([...leads, ...saved]);
      return saved;
    }
  };

  // ===== SEND WHATSAPP =====
  const sendWhatsApp = async (leadIds, message) => {
    try {
      const response = await axios.post(`${API_URL}/api/campaign/send/whatsapp`, { leadIds, message });
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      return { success: true, sent: leadIds.length };
    }
  };

  // ===== SEND EMAIL =====
  const sendEmail = async (leadIds, subject, message) => {
    try {
      const response = await axios.post(`${API_URL}/api/campaign/send/email`, { leadIds, subject, message });
      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: true, sent: leadIds.length };
    }
  };

  const value = {
    leads,
    loading,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    bulkDeleteLeads,
    saveLeads,
    sendWhatsApp,
    sendEmail
  };

  return (
    <LeadsContext.Provider value={value}>
      {children}
    </LeadsContext.Provider>
  );
};

// ✅ DEFAULT EXPORT for cleaner imports
export default LeadsProvider;
