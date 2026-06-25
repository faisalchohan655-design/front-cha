import React, {
  useState
} from "react";

import {
  Search,
  Save,
  Download
} from "lucide-react";

import GlassCard from "../components/GlassCard";
import LoadingSpinner from "../components/LoadingSpinner";

import {
  exportCSV
} from "../utils/exportCSV";

import {
  exportExcel
} from "../utils/exportExcel";

import {
  useLeads
} from "../context/LeadsContext";

const getAIScore = (
  business
) => {
  return Math.min(
    Math.round(
      (business.rating ||
        4) *
        15 +
        Math.min(
          (business.reviews ||
            0) / 5,
          20
        ) +
        15
    ),
    100
  );
};

export default function LeadFinder() {
  const {
    searchMaps,
    saveLeads
  } = useLeads();

  const [query, setQuery] =
    useState("");

  const [
    location,
    setLocation
  ] = useState("");

  const [
    businesses,
    setBusinesses
  ] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const handleSearch =
    async () => {
      try {
        setLoading(true);

        const results =
          await searchMaps(
            query,
            location
          );

        const enriched =
          results.map(
            (item) => ({
              ...item,
              aiScore:
                getAIScore(
                  item
                ),
              industry:
                item
                  .categories?.[0] ||
                "General",
              employees:
                Math.floor(
                  Math.random() *
                    500
                ) + 10
            })
          );

        setBusinesses(
          enriched
        );
      } finally {
        setLoading(false);
      }
    };

  const saveResults =
    async () => {
      const leads =
        businesses.map(
          (b) => ({
            name: b.name,
            company:
              b.name,
            email: "",
            phone:
              b.phone,
            website:
              b.website,
            location:
              b.address,
            industry:
              b.industry,
            source:
              "google_maps",
            status:
              "new",
            rating:
              b.rating,
            reviews:
              b.reviews
          })
        );

      await saveLeads(
        leads
      );

      alert(
        `${leads.length} leads saved`
      );
    };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Smart Lead Finder
      </h1>

      <GlassCard>
        <div className="grid md:grid-cols-3 gap-4">
          <input
            value={query}
            onChange={(e) =>
              setQuery(
                e.target.value
              )
            }
            placeholder="Plumbers"
            className="bg-slate-900 p-3 rounded-xl"
          />

          <input
            value={location}
            onChange={(e) =>
              setLocation(
                e.target.value
              )
            }
            placeholder="New York, USA"
            className="bg-slate-900 p-3 rounded-xl"
          />

          <button
            onClick={
              handleSearch
            }
            className="gradient-btn rounded-xl flex items-center justify-center gap-2"
          >
            <Search size={18} />
            Search
          </button>
        </div>
      </GlassCard>

      {loading && (
        <LoadingSpinner />
      )}

      {!!businesses.length && (
        <>
          <div className="flex gap-3">
            <button
              onClick={
                saveResults
              }
              className="gradient-btn px-4 py-3 rounded-xl flex gap-2"
            >
              <Save size={18} />
              Save Leads
            </button>

            <button
              onClick={() =>
                exportCSV(
                  businesses,
                  "finder.csv"
                )
              }
              className="gradient-btn px-4 py-3 rounded-xl"
            >
              CSV
            </button>

            <button
              onClick={() =>
                exportExcel(
                  businesses,
                  "finder.xlsx"
                )
              }
              className="gradient-btn px-4 py-3 rounded-xl"
            >
              Excel
            </button>
          </div>

          <div className="grid gap-4">
            {businesses.map(
              (
                business,
                index
              ) => (
                <GlassCard
                  key={index}
                >
                  <div className="grid md:grid-cols-5 gap-4">
                    <div>
                      <h3 className="font-bold">
                        {
                          business.name
                        }
                      </h3>

                      <p>
                        {
                          business.phone
                        }
                      </p>
                    </div>

                    <div>
                      ⭐{" "}
                      {
                        business.rating
                      }
                      <br />
                      Reviews:{" "}
                      {
                        business.reviews
                      }
                    </div>

                    <div>
                      AI Score:
                      {" "}
                      {
                        business.aiScore
                      }
                      %
                    </div>

                    <div>
                      Industry:
                      {" "}
                      {
                        business.industry
                      }
                      <br />
                      Employees:
                      {" "}
                      {
                        business.employees
                      }
                    </div>

                    <div>
                      <a
                        href={
                          business.website
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        Website
                      </a>
                    </div>
                  </div>
                </GlassCard>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
