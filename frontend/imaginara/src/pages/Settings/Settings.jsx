// src/pages/Settings/Settings.jsx
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Palette } from "lucide-react";
import { ThemeContext } from "../../Context/ThemeContext"; // ensure correct path

const THEMES = [
  "light","dark","cupcake","bumblebee","emerald","corporate",
  "synthwave","retro","cyberpunk","valentine","halloween","garden",
  "forest","aqua","lofi","pastel","fantasy","wireframe","black",
  "luxury","dracula","cmyk","autumn","business","acid","lemonade",
  "night","coffee","winter"
];

const Settings = ({ onLogout }) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useContext(ThemeContext);

  

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-base-200 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Settings</h1>
            <p className="text-sm text-base-content/70">
              Manage your account and preferences
            </p>
          </div>

          {/* Dark Mode Toggle & Delete Account */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <span>Dark Mode</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={theme === "dark"}
                onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
              />
            </label>
            
          </div>
        </div>

        {/* Theme Selection */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Palette size={20} />
            <h2 className="text-lg font-semibold">Theme</h2>
          </div>
          <p className="text-sm text-base-content/70 mb-4">
            Choose a theme for your interface
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                className={`group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${
                  theme === t
                    ? "bg-base-200 ring-2 ring-primary"
                    : "hover:bg-base-200/50"
                }`}
                onClick={() => setTheme(t)}
              >
                <div
                  className="relative h-8 w-full rounded-md overflow-hidden"
                  data-theme={t}
                >
                  <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                    <div className="rounded bg-primary"></div>
                    <div className="rounded bg-secondary"></div>
                    <div className="rounded bg-accent"></div>
                    <div className="rounded bg-neutral"></div>
                  </div>
                </div>
                <span className="text-[11px] font-medium truncate w-full text-center">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Settings;
