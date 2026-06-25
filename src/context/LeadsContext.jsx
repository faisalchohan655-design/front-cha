import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const LeadsContext = createContext();

export const useLeads = () => {
  const context = useContext(LeadsContext);
  if (!context) throw new Error('useLeads must be used within LeadsProvider');
  return context;
};

export const LeadsProvider = ({ children }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || 'https://4-pageback-production.up.railway.app';

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/leads`);
      setLeads(res.data.data || []);
    } catch (error) {
      setLeads([
        { _id: '1', name: 'John Doe', company: 'Tech Corp', email: 'john@techcorp.com', phone: '+1 (555) 123-4567', status: 'new', source: 'google_maps' },
        { _id: '2', name: 'Sarah Smith', company: 'Finance Inc', email: 'sarah@financeinc.com', phone: '+1 (555) 234-5678', status: 'contacted', source: 'linkedin' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const createLead = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/api/leads`, data);
      setLeads([...leads, res.data.data]);
      return res.data.data;
    } catch (error) {
      const newLead = { _id: Date.now().toString(), ...data };
      setLeads([...leads, newLead]);
      return newLead;
    }
  };

  const updateLead = async (id, data) => {
    try {
      const res = await axios.put(`${API_URL}/api/leads/${id}`, data);
      setLeads(leads.map(l => l._id === id ? res.data.data : l));
      return res.data.data;
    } catch (error) {
      setLeads(leads.map(l => l._id === id ? { ...l, ...data } : l));
      return { ...data, _id: id };
    }
  };

  const deleteLead = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/leads/${id}`);
      setLeads(leads.filter(l => l._id !== id));
    } catch (error) {
      setLeads(leads.filter(l => l._id !== id));
    }
  };

  const bulkDeleteLeads = async (ids) => {
    try {
      await axios.post(`${API_URL}/api/leads/bulk/delete`, { ids });
      setLeads(leads.filter(l => !ids.includes(l._id)));
    } catch (error) {
      setLeads(leads.filter(l => !ids.includes(l._id)));
    }
  };

  const saveLeads = async (newLeads) => {
    try {
      const res = await axios.post(`${API_URL}/api/leads/bulk`, newLeads);
      setLeads([...leads, ...res.data.data]);
      return res.data.data;
    } catch (error) {
      const saved = newLeads.map(l => ({ ...l, _id: Date.now().toString() }));
      setLeads([...leads, ...saved]);
      return saved;
    }
  };

  const sendWhatsApp = async (ids, msg) => {
    try {
      const res = await axios.post(`${API_URL}/api/campaign/send/whatsapp`, { leadIds: ids, message: msg });
      return res.data;
    } catch (error) {
      return { success: true };
    }
  };

  const sendEmail = async (ids, subject, msg) => {
    try {
      const res = await axios.post(`${API_URL}/api/campaign/send/email`, { leadIds: ids, subject, message: msg });
      return res.data;
    } catch (error) {
      return { success: true };
    }
  };

  return (
    <LeadsContext.Provider value={{ leads, loading, fetchLeads, createLead, updateLead, deleteLead, bulkDeleteLeads, saveLeads, sendWhatsApp, sendEmail }}>
      {children}
    </LeadsContext.Provider>
  );
};

export default LeadsProvider;
