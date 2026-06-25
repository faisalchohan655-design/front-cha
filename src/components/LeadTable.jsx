import React from "react";

const statusColors = {
  New: "bg-blue-500",
  Contacted: "bg-yellow-500",
  Qualified: "bg-green-500",
  Proposal: "bg-purple-500",
  Closed: "bg-pink-500"
};

const LeadTable = ({
  leads = [],
  selectedLeads = [],
  onSelectLead,
  onSelectAll
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-white/10">
            <th className="p-3">
              <input
                type="checkbox"
                checked={
                  leads.length > 0 &&
                  selectedLeads.length ===
                    leads.length
                }
                onChange={onSelectAll}
              />
            </th>

            <th className="p-3">Name</th>
            <th className="p-3">Company</th>
            <th className="p-3">Email</th>
            <th className="p-3">
              AI Score
            </th>
            <th className="p-3">
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="border-b border-white/5"
            >
              <td className="p-3">
                <input
                  type="checkbox"
                  checked={selectedLeads.includes(
                    lead.id
                  )}
                  onChange={() =>
                    onSelectLead(
                      lead.id
                    )
                  }
                />
              </td>

              <td className="p-3">
                {lead.name}
              </td>

              <td className="p-3">
                {lead.company}
              </td>

              <td className="p-3">
                {lead.email}
              </td>

              <td className="p-3">
                {lead.aiScore || 0}%
              </td>

              <td className="p-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    statusColors[
                      lead.status
                    ] ||
                    "bg-gray-500"
                  }`}
                >
                  {lead.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {leads.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          No leads found
        </div>
      )}
    </div>
  );
};

export default LeadTable;
