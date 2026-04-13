import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { LIGHT, DARK } from "../../utils/constants";
import { NavItem } from "../../types";

export default function DashboardLayout() {
  const [dark, setDark] = useState(false);
  const C = dark ? DARK : LIGHT;

  const nav: NavItem[] = [
    { key: "Dashboard", icon: "M3 3h7v7H3z" },
    { key: "Goals", icon: "M12 20V10" },
    { key: "Focus", icon: "M5 12h14" },
  ];

  const [page, setPage] = useState("Dashboard");

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        nav={nav}
        page={page}
        setPage={setPage}
        dark={dark}
        setDark={setDark}
        C={C}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Navbar C={C} />

        <div style={{ flex: 1, padding: 20 }}>
          <h1>{page}</h1>
        </div>
      </div>
    </div>
  );
}