import React from "react";

import {
  LayoutDashboard,
  Search,
  Megaphone,
  Users,
  Mail
} from "lucide-react";

import { NavLink } from "react-router-dom";

const links = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard
  },
  {
    name: "Lead Finder",
    path: "/finder",
    icon: Search
  },
  {
    name: "Campaigns",
    path: "/campaigns",
    icon: Megaphone
  },
  {
    name: "Lead Manager",
    path: "/manager",
    icon: Users
  },
  {
    name: "Email Extractor",
    path: "/extractor",
    icon: Mail
  }
];

const Sidebar = () => {
  return (
    <aside className="w-72 hidden md:flex flex-col glass border-r border-white/10">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          LeadConnect AI
        </h1>
      </div>

      <nav className="px-4 flex-1">
        {links.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl mb-2 transition ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-pink-600"
                    : "hover:bg-white/10"
                }`
              }
            >
              <Icon size={20} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
