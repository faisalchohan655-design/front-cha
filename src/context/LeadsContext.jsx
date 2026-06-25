import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import api from "../services/api";

const LeadsContext =
  createContext();

export const LeadsProvider = ({
  children
}) => {
  const [leads, setLeads] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);

      const res =
        await api.get("/api/leads");

      setLeads(res.data || []);
    } catch (err) {
      setError(
        err.message ||
          "Failed to load leads"
      );
    } finally {
      setLoading(false);
    }
  };

  const createLead = async (
    lead
  ) => {
    try {
      const res =
        await api.post(
          "/api/leads",
          lead
        );

      setLeads((prev) => [
        ...prev,
        res.data
      ]);

      return res.data;
    } catch (err) {
      console.error(err);
    }
  };

  const updateLead = async (
    id,
    data
  ) => {
    try {
      const res =
        await api.put(
          `/api/leads/${id}`,
          data
        );

      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === id
            ? res.data
            : lead
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const deleteLead = async (
    id
  ) => {
    try {
      await api.delete(
        `/api/leads/${id}`
      );

      setLeads((prev) =>
        prev.filter(
          (lead) =>
            lead.id !== id
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const bulkDeleteLeads =
    async (ids) => {
      try {
        await api.delete(
          "/api/leads/bulk",
          {
            data: { ids }
          }
        );

        setLeads((prev) =>
          prev.filter(
            (lead) =>
              !ids.includes(
                lead.id
              )
          )
        );
      } catch (err) {
        console.error(err);
      }
    };

  const saveLeads = async (
    leadsData
  ) => {
    try {
      const res =
        await api.post(
          "/api/leads/bulk",
          {
            leads: leadsData
          }
        );

      await fetchLeads();

      return res.data;
    } catch (err) {
      console.error(err);
    }
  };

  const sendWhatsApp =
    async (
      leadIds,
      message
    ) => {
      return api.post(
        "/api/campaign/send/whatsapp",
        {
          leadIds,
          message
        }
      );
    };

  const sendEmail = async (
    leadIds,
    message
  ) => {
    return api.post(
      "/api/campaign/send/email",
      {
        leadIds,
        message
      }
    );
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <LeadsContext.Provider
      value={{
        leads,
        loading,
        error,
        fetchLeads,
        createLead,
        updateLead,
        deleteLead,
        bulkDeleteLeads,
        saveLeads,
        sendWhatsApp,
        sendEmail
      }}
    >
      {children}
    </LeadsContext.Provider>
  );
};

export const useLeads = () =>
  useContext(LeadsContext);
