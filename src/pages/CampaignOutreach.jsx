import React, {
  useMemo,
  useState
} from "react";

import {
  Send,
  Mail,
  MessageCircle,
  Download,
  Trash2
} from "lucide-react";

import { useLeads } from "../context/LeadsContext";

import GlassCard from "../components/GlassCard";
import LoadingSpinner from "../components/LoadingSpinner";

import { exportCSV } from "../utils/exportCSV";
import { exportExcel } from "../utils/exportExcel";

export default function CampaignOutreach() {
  const {
    leads,
    loading,
    sendWhatsApp,
    sendEmail,
    bulkDeleteLeads
  } = useLeads();

  const [channel, setChannel] =
    useState("whatsapp");

  const [subject, setSubject] =
    useState("LeadConnect Offer");

  const [message, setMessage] =
    useState(
      "Hi {{name}}, we help {{company}} generate more qualified leads."
    );

  const [search, setSearch] =
    useState("");

  const [selected, setSelected] =
    useState([]);

  const [sending, setSending] =
    useState(false);

  const [stats, setStats] =
    useState({
      sent: 0,
      open: 0,
      click: 0,
      conversion: 0
    });

  const filteredLeads =
    useMemo(() => {
      return leads.filter(
        (lead) =>
          !search ||
          lead.name
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||
          lead.company
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||
          lead.email
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );
    }, [leads, search]);

  const toggleLead = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter(
            (item) =>
              item !== id
          )
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (
      selected.length ===
      filteredLeads.length
    ) {
      setSelected([]);
    } else {
      setSelected(
        filteredLeads.map(
          (lead) => lead._id
        )
      );
    }
  };

  const handleSend =
    async () => {
      if (!selected.length) {
        alert(
          "Select leads first"
        );
        return;
      }

      try {
        setSending(true);

        let response;

        if (
          channel ===
          "whatsapp"
        ) {
          response =
            await sendWhatsApp(
              selected,
              message
            );
        } else {
          response =
            await sendEmail(
              selected,
              subject,
              message
            );
        }

        const sent =
          response.sent || 0;

        setStats({
          sent,
          open:
            Math.round(
              sent * 0.65
            ),
          click:
            Math.round(
              sent * 0.35
            ),
          conversion:
            Math.round(
              sent * 0.12
            )
        });

        alert(
          response.message ||
            "Campaign sent"
        );
      } catch (error) {
        console.error(error);

        alert(
          "Campaign failed"
        );
      } finally {
        setSending(false);
      }
    };

  const deleteSelected =
    async () => {
      if (!selected.length)
        return;

      await bulkDeleteLeads(
        selected
      );

      setSelected([]);
    };

  if (loading)
    return (
      <LoadingSpinner />
    );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Campaign Outreach
      </h1>

      {/* Stats */}

      <div className="grid md:grid-cols-4 gap-4">
        <GlassCard>
          <h3 className="text-gray-400">
            Sent
          </h3>
          <p className="text-3xl font-bold">
            {stats.sent}
          </p>
        </GlassCard>

        <GlassCard>
          <h3 className="text-gray-400">
            Open
          </h3>
          <p className="text-3xl font-bold">
            {stats.open}
          </p>
        </GlassCard>

        <GlassCard>
          <h3 className="text-gray-400">
            Click
          </h3>
          <p className="text-3xl font-bold">
            {stats.click}
          </p>
        </GlassCard>

        <GlassCard>
          <h3 className="text-gray-400">
            Conversion
          </h3>
          <p className="text-3xl font-bold">
            {stats.conversion}
          </p>
        </GlassCard>
      </div>

      {/* Composer */}

      <GlassCard>
        <div className="flex gap-3 mb-5">
          <button
            onClick={() =>
              setChannel(
                "whatsapp"
              )
            }
            className={`px-4 py-2 rounded-xl ${
              channel ===
              "whatsapp"
                ? "gradient-btn"
                : "bg-slate-800"
            }`}
          >
            <MessageCircle
              size={18}
            />
          </button>

          <button
            onClick={() =>
              setChannel(
                "email"
              )
            }
            className={`px-4 py-2 rounded-xl ${
              channel ===
              "email"
                ? "gradient-btn"
                : "bg-slate-800"
            }`}
          >
            <Mail size={18} />
          </button>
        </div>

        {channel ===
          "email" && (
          <input
            value={subject}
            onChange={(e) =>
              setSubject(
                e.target.value
              )
            }
            placeholder="Email Subject"
            className="w-full bg-slate-900 rounded-xl p-3 mb-4"
          />
        )}

        <textarea
          rows="6"
          value={message}
          onChange={(e) =>
            setMessage(
              e.target.value
            )
          }
          className="w-full bg-slate-900 rounded-xl p-4"
        />

        <div className="mt-3 text-sm text-gray-400">
          Available Variables:
          {{name}} | {{company}}
        </div>

        <button
          onClick={handleSend}
          disabled={sending}
          className="gradient-btn px-5 py-3 rounded-xl mt-5 flex gap-2 items-center"
        >
          <Send size={18} />
          {sending
            ? "Sending..."
            : "Send Campaign"}
        </button>
      </GlassCard>

      {/* Leads */}

      <GlassCard>
        <div className="flex flex-col lg:flex-row gap-3 mb-5">
          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search leads..."
            className="bg-slate-900 rounded-xl p-3 flex-1"
          />

          <button
            onClick={() =>
              exportCSV(
                filteredLeads,
                "campaign.csv"
              )
            }
            className="gradient-btn px-4 py-3 rounded-xl"
          >
            <Download
              size={18}
            />
          </button>

          <button
            onClick={() =>
              exportExcel(
                filteredLeads,
                "campaign.xlsx"
              )
            }
            className="gradient-btn px-4 py-3 rounded-xl"
          >
            Excel
          </button>

          <button
            onClick={
              deleteSelected
            }
            className="bg-red-600 px-4 py-3 rounded-xl"
          >
            <Trash2
              size={18}
            />
          </button>
        </div>

        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      selected.length ===
                        filteredLeads.length &&
                      filteredLeads.length >
                        0
                    }
                    onChange={
                      toggleAll
                    }
                  />
                </th>

                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredLeads.map(
                (lead) => (
                  <tr
                    key={
                      lead._id
                    }
                    className="border-b border-white/10"
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(
                          lead._id
                        )}
                        onChange={() =>
                          toggleLead(
                            lead._id
                          )
                        }
                      />
                    </td>

                    <td>
                      {
                        lead.name
                      }
                    </td>

                    <td>
                      {
                        lead.company
                      }
                    </td>

                    <td>
                      {
                        lead.email
                      }
                    </td>

                    <td>
                      {
                        lead.status
                      }
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
