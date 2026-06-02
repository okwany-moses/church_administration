import { useState } from "react";
import { HeartPulse, Trees, Users, Award, ExternalLink, Image as ImageIcon } from "lucide-react";
import { GalleryItem } from "../types";

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "1",
    title: "Mr. Wycliffe Obondo",
    category: "team-projects",
    description: "Managing Director driving strategic vision, permanent solution-oriented operations, and youth development workshops.",
    imagePath: "/images/md_wycliffe_obondo_1780342033132.jpg",
    fallbackIcon: "award"
  },
  {
    id: "2",
    title: "Chief Executive Officer",
    category: "team-projects",
    description: "Our active CEO establishing institutional partnerships, community health models, and environmental alliances.",
    imagePath: "/images/ceo_vitalis_ogendo_1780341721126.jpg",
    fallbackIcon: "users"
  },
  {
    id: "3",
    title: "Lisa Hospital ICU Expansion",
    category: "lisa-hospital",
    description: "Supporting community physical welfare with key medical logistics, supporting Lisa Hospitals motto: Your Health, Our Priority.",
    imagePath: "/images/hospital-1.jpg",
    fallbackIcon: "hospital"
  },
  {
    id: "4",
    title: "Local Outreach Clinic Visit",
    category: "lisa-hospital",
    description: "Collaborative health sensitization drives providing screening equipment and care items to vulnerable outpatient groups.",
    imagePath: "/images/hospital-2.jpg",
    fallbackIcon: "hospital"
  },
  {
    id: "5",
    title: "Core Environmental Cadre",
    category: "tree-planting",
    description: "Dedicated tree planting team coordinating seedbeds, planting sites, and green belt monitoring networks.",
    imagePath: "/images/tree-planting-team.jpg",
    fallbackIcon: "trees"
  },
  {
    id: "6",
    title: "Student Seedling Handover",
    category: "tree-planting",
    description: "Providing thousands of high-yield indigenous saplings directly to schools to inspire proactive youth conservation.",
    imagePath: "/images/students-seedlings.jpg",
    fallbackIcon: "trees"
  },
  {
    id: "7",
    title: "Community Planting Drive",
    category: "tree-planting",
    description: "Active community soil protection campaigns raising thousands of trees to fight microclimate degradation.",
    imagePath: "/images/planting-action.jpg",
    fallbackIcon: "trees"
  },
  {
    id: "8",
    title: "Core Network Assembly",
    category: "team-projects",
    description: "Annual planning assembly of The Visionary Young Innovators Network, unifying strategy under alliance frameworks.",
    imagePath: "/images/team-group.jpg",
    fallbackIcon: "users"
  },
  {
    id: "9",
    title: "Socrates Hongo Sigu",
    category: "team-projects",
    description: "ICT Officer overseeing digital infrastructure, network security, and technological solution integration.",
    imagePath: "/images/ict_socrates_hongo_sigu.jpg",
    fallbackIcon: "award"
  }
];

export default function ImpactGallery() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const tabs = [
    { id: "all", label: "All Works" },
    { id: "lisa-hospital", label: "Lisa Hospital Support" },
    { id: "tree-planting", label: "Tree Planting" },
    { id: "team-projects", label: "Team & Projects" }
  ];

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  const filteredItems = activeTab === "all" 
    ? GALLERY_ITEMS 
    : GALLERY_ITEMS.filter(item => item.category === activeTab);

  const renderFallbackIcon = (type: string) => {
    switch (type) {
      case "hospital":
        return <HeartPulse className="w-12 h-12 text-emerald-400" id="fallback-icon-hospital" />;
      case "trees":
        return <Trees className="w-12 h-12 text-emerald-400" id="fallback-icon-trees" />;
      case "users":
        return <Users className="w-12 h-12 text-emerald-400" id="fallback-icon-users" />;
      default:
        return <Award className="w-12 h-12 text-emerald-400" id="fallback-icon-award" />;
    }
  };

  return (
    <div className="space-y-8" id="impact-gallery-container">
      {/* State-driven Tab Filter Header */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-5 border-b border-emerald-900/10" id="gallery-tabs-row">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`gallery-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${
              activeTab === tab.id
                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : "bg-slate-900/50 text-slate-450 hover:text-slate-100 hover:bg-slate-900 border-slate-800"
            } rounded-sm`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="gallery-grid">
        {filteredItems.map((item) => {
          const hasError = imageErrors[item.id];
          return (
            <div
              key={item.id}
              id={`gallery-card-${item.id}`}
              className="group relative flex flex-col justify-between bg-slate-900 border border-slate-850 hover:border-emerald-500/30 transition-all duration-300 h-[380px] rounded-sm"
            >
              {/* Image Preview Window */}
              <div className="relative h-48 w-full bg-slate-950 overflow-hidden flex items-center justify-center border-b border-emerald-950/20">
                {!hasError ? (
                  <img
                    src={item.imagePath}
                    alt={item.title}
                    onError={() => handleImageError(item.id)}
                    referrerPolicy="no-referrer"
s worked for the e                    className="w-full h-full object-cover object-top group-hover:scale-102 transition-transform duration-500"
                    id={`gallery-img-${item.id}`}
                  />
                ) : (
                  /* Gorgeous vector placeholders */
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-850 flex flex-col items-center justify-center p-4 text-center">
                    <div className="p-3 bg-emerald-500/10 rounded-full mb-2 border border-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                      {renderFallbackIcon(item.fallbackIcon)}
                    </div>
                    <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-slate-500" /> Preview Active Media
                    </span>
                  </div>
                )}
                
                {/* Category badge overlay */}
                <span className="absolute top-3 right-3 text-[9px] font-mono tracking-wider font-semibold uppercase bg-slate-900/90 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-sm backdrop-blur-sm">
                  {item.category.replace("-", " ")}
                </span>
              </div>

              {/* Description Body text */}
              <div className="p-5 flex-1 flex flex-col justify-between" id={`gallery-body-${item.id}`}>
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-sm text-slate-100 tracking-tight group-hover:text-emerald-400 transition-colors duration-200">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-slate-950 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Registered Element</span>
                  <span className="text-emerald-500 font-semibold uppercase tracking-wider text-[9px] flex items-center gap-1 hover:text-emerald-400 cursor-pointer">
                    Read Impact <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800" id="gallery-empty-state">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-display font-medium">No system records available under this filter.</p>
        </div>
      )}
    </div>
  );
}
