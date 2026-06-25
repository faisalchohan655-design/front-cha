import React, {
  useMemo,
  useState
} from "react";

import {
  Users,
  Flame,
  Target,
  TrendingUp,
  Download,
  Trash2
} from "lucide-react";

import { useLeads } from "../context/LeadsContext";

import StatCard from "../components/StatCard";
import GlassCard from "../components/GlassCard";
import LeadTable from "../components/LeadTable";
import LoadingSpinner from "../components/LoadingSpinner";

import { exportCSV } from "../utils/exportCSV";
import { exportExcel } from "../utils/exportExcel";

const getAIScore = (lead) => {
  const rating = lead.rating || 4;
  const reviews = lead.reviews || 0;

  return Math.min(
    Math.round(
      rating * 15 +
        Math.min(
          reviews / 5,
          20
        ) +
        15
    ),
    100
  );
};

export default function Dashboard() {
  const {
    leads,
    loading,
    bulkDeleteLeads
  } = useLeads();

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("all");

  const [
    selectedLeads,
    setSelectedLeads
  ] = useState([]);

  const filteredLeads =
    useMemo(() => {
      return leads.filter(
        (lead) => {
          const searchMatch =
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
              );

          const statusMatch =
            status === "all"
              ? true
              : lead.status ===
                status;

          return (
            searchMatch &&
            statusMatch
          );
        }
      );
    }, [
      leads,
      search,
      status
    ]);

  const totalLeads =
    leads.length;

  const hotLeads =
    leads.filter(
      (lead) =>
        getAIScore(
          lead
        ) >= 80
    ).length;

  const avgScore =
    Math.round(
      leads.reduce(
        (sum, lead) =>
          sum +
          getAIScore(
            lead
          ),
        0
      ) /
        (leads.length ||
          1)
    );

  const conversionRate =
    Math.round(
      (leads.filter(
        (lead) =>
          lead.status ===
          "closed"
      ).length /
        (leads.length ||
          1)) *
        100
    );

  const toggleLead = (
    id
  ) => {
    setSelectedLeads(
      (prev) =>
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
      selectedLeads.length ===
      filteredLeads.length
    ) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(
        filteredLeads.map(
          (lead) =>
            lead._id
        )
      );
    }
  };

  const handleBulkDelete =
    async () => {
      if (
        !selectedLeads.length
      )
        return;

      await bulkDeleteLeads(
        selectedLeads
      );

      setSelectedLeads([]);
    };

  if (loading)
    return (
      <LoadingSpinner />
    );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Leads"
          value={totalLeads}
          icon={Users}
        />

        <StatCard
          title="Hot Leads"
          value={hotLeads}
          icon={Flame}
        />

        <StatCard
          title="AI Score Avg"
          value={`${avgScore}%`}
          icon={Target}
        />

        <StatCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={TrendingUp}
        />
      </div>

      <GlassCard>
        <div className="flex flex-col lg:flex-row gap-4 justify-between mb-5">
          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search leads..."
            className="bg-slate-900 p-3 rounded-xl flex-1"
          />

          <select
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value
              )
            }
            className="bg-slate-900 p-3 rounded-xl"
          >
            <option value="all">
              All Status
            </option>

            <option value="new">
              New
            </option>

            <option value="contacted">
              Contacted
            </option>

            <option value="qualified">
              Qualified
            </option>

            <option value="proposal">
              Proposal
            </option>

            <option value="closed">
              Closed
            </option>
          </select>

          <button
            onClick={() =>
              exportCSV(
                filteredLeads,
                "leads.csv"
              )
            }
            className="gradient-btn px-4 py-3 rounded-xl"
          >
            <Download size={18} />
          </button>

          <button
            onClick={() =>
              exportExcel(
                filteredLeads,
                "leads.xlsx"
              )
            }
            className="gradient-btn px-4 py-3 rounded-xl"
          >
            Excel
          </button>

          <button
            onClick={
              handleBulkDelete
            }
            className="bg-red-600 px-4 py-3 rounded-xl"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <LeadTable
          leads={filteredLeads.map(
            (lead) => ({
              ...lead,
              aiScore:
                getAIScore(
                  lead
                )
            })
          )}
          selectedLeads={
            selectedLeads
          }
          onSelectLead={
            toggleLead
          }
          onSelectAll={
            toggleAll
          }
        />
      </GlassCard>
    </div>
  );
}
