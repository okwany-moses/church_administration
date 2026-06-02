import { useState, useEffect } from "react";
import { 
  HeartPulse, 
  Leaf, 
  Sparkles, 
  GraduationCap, 
  Megaphone, 
  TrendingUp, 
  Users, 
  ChevronRight, 
  Quote, 
  Menu, 
  X, 
  CheckCircle, 
  ShieldCheck, 
  Award, 
  Phone, 
  Mail, 
  BookOpen,
  Settings,
  MonitorCog
} from "lucide-react";
import ImpactGallery from "./components/ImpactGallery";
import RegistrationForm from "./components/RegistrationForm";
import AuthInterface from "./components/AuthInterface";
import BlogSection from "./components/BlogSection";
import LogoCustomizer, { LogoSettingsType } from "./components/LogoCustomizer";
import { Pillar, ExecutiveLeader, User } from "./types";

const ORGANIZATIONAL_PILLARS: Pillar[] = [
  {
    id: "youth",
    title: "Youth Development & Solution Modules",
    description: "Developing permanent solution-oriented workshops, tech-sensitizations, and mentorship accelerators. Articulating young minds on the table of active leadership.",
    iconName: "sparkles"
  },
  {
    id: "hospitals",
    title: "Support for Lisa Hospitals",
    description: "Actively sponsoring machinery, clinic outreaches, and subsidizing medical care under our flagship partner's banner: 'LISA HOSPITALS — YOUR HEALTH, OUR PRIORITY'.",
    iconName: "pulse"
  },
  {
    id: "ads",
    title: "Corporate Advertising Space",
    description: "Integrating brand spaces within active community outreach frameworks. Empowering businesses to advertise while driving real Corporate Social Responsibility.",
    iconName: "megaphone"
  },
  {
    id: "education",
    title: "Education Funding Schemes",
    description: "Directly sponsoring school fees, uniforms, and learning kits for orphans and vulnerable children in secondary and higher institutions.",
    iconName: "education"
  },
  {
    id: "trees",
    title: "Active Tree Planting Campaigns",
    description: "Coordinating massive reforestation drives and soil rehabilitation projects. Engaging local schools to foster direct student environmental custodianship.",
    iconName: "leaf"
  }
];

const EXECUTIVE_LEADERS: ExecutiveLeader[] = [
  {
    name: "Mr. Wycliffe Obondo",
    role: "Managing Director",
    motto: "Transforming Potential into Tangible Impact",
    bio: "Mr. Wycliffe Obondo is a strategic innovator guiding the operational mechanics of the network. He is dedicated to creating permanent solution-oriented modules that empower young leaders and bridge gaps in corporate and healthcare partnerships, particularly aligning our environmental and hospital initiatives.",
    imagePath: "/images/md_wycliffe_obondo_1780342033132.jpg",
    signature: "W. Obondo"
  },
  {
    name: "Mr. Vitalis Ogendo",
    role: "CEO & General Director",
    motto: "Strategic Alliances for Transformed Communities",
    bio: "Mr. Vitalis Ogendo steers the macro-strategic alliances of the Network. By bringing Voicecommedia's digital leverage together with Lisa Hospitals' health stewardship, he ensures our field campaigns have the policy backing, executive funding, and systemic visibility to empower thousands of young innovators across the continent.",
    imagePath: "/images/ceo_vitalis_ogendo_1780341721126.jpg",
    signature: "V. Ogendo"
  },
  {
    name: "Socrates Hongo Sigu",
    role: "ICT Officer",
    motto: "Innovating Through Digital Excellence",
    bio: "Socrates Hongo Sigu manages the technical infrastructure and digital systems of the Network. He is responsible for maintaining secure ledger systems, optimizing technical solution modules, and ensuring digital visibility for our multi-sectoral alliances.",
    imagePath: "/images/ict_socrates_hongo_sigu.jpg",
    signature: "S. Hongo"
  }
];

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const [showCustomizer, setShowCustomizer] = useState(false);
  const [logoSettings, setLogoSettings] = useState<LogoSettingsType>({
    logoUrl: "/images/logo.jpg",
    blendMode: "normal",
    hueFilter: "original",
    invert: false,
    height: 48, // Increased default size
    placement: "left",
    glow: true
  });

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  // Initialize Auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem("vyin_session_token");
    const storedUser = localStorage.getItem("vyin_session_user");
    if (token && storedUser) {
      setCurrentToken(token);
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Stale login profile purged", e);
        localStorage.removeItem("vyin_session_token");
        localStorage.removeItem("vyin_session_user");
        setCurrentToken(null);
        setCurrentUser(null);
      }
    }
  }, []);

  const handleAuthChange = (token: string | null, user: User | null) => {
    setCurrentToken(token);
    setCurrentUser(user);
  };

  // Simple scroll spy logic
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "pillars", "gallery", "blog", "leadership", "join"];
      const scrollPos = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToElement = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const renderPillarIcon = (name: string) => {
    const defaultClasses = "w-6 h-6 text-emerald-400";
    switch (name) {
      case "pulse":
        return <HeartPulse className={defaultClasses} id="pillar-icon-pulse" />;
      case "leaf":
        return <Leaf className={defaultClasses} id="pillar-icon-leaf" />;
      case "sparkles":
        return <Sparkles className={defaultClasses} id="pillar-icon-sparkles" />;
      case "education":
        return <GraduationCap className={defaultClasses} id="pillar-icon-education" />;
      case "megaphone":
        return <Megaphone className={defaultClasses} id="pillar-icon-megaphone" />;
      default:
        return <TrendingUp className={defaultClasses} id="pillar-icon-default" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 via-slate-950 to-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950" id="application-layout-shell">
      
      {/* 1. Global Shell Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-900/55 backdrop-blur-md border-b border-emerald-900/30 transition-all duration-300" id="navigation-header">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 pl-0 pr-4 sm:pl-0 sm:pr-6 lg:pl-0 lg:pr-8">
            
            {/* Logo Group */}
            <div
              className="flex items-center gap-4 cursor-pointer group" 
              onClick={() => scrollToElement("hero")}
              id="header-logo-group"
            >
              {!imageErrors['main-logo'] ? (
                <img
                  src="/images/logo.jpg"
                  alt="VYIN Brand Logo"
                  onError={() => handleImageError('main-logo')}
                  style={{ 
                    height: `${logoSettings.height}px`,
                    mixBlendMode: logoSettings.blendMode as any,
                    filter: `${logoSettings.invert ? "invert(1) " : ""}${
                      logoSettings.hueFilter === "grayscale" ? "grayscale(100%)" 
                      : logoSettings.hueFilter === "monochrome-white" ? "brightness(0) invert(1)" 
                      : logoSettings.hueFilter === "emerald" ? "sepia(1) saturate(5) hue-rotate(90deg)" : ""
                    } brightness(1.1) contrast(1.1)`
                  }}
                  className={`w-auto object-contain transition-all duration-300 group-hover:scale-105 ${
                    logoSettings.glow ? "drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]" : ""
                  }`}
                />
              ) : (
                <Sparkles className="h-9 w-9 text-emerald-400" />
              )}
              
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-mono">THE VISIONARY</span>
                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-emerald-400 font-display group-hover:text-emerald-300 transition-colors duration-200">
                  YOUNG INNOVATORS NETWORK
                </h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-mono mt-0.5">
                  Alliance with <span className="text-slate-300 font-semibold">Voicecommedia</span>
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-medium uppercase tracking-widest" id="desktop-navbar">
              {[
                { id: "hero", label: "Mission" },
                { id: "pillars", label: "Pillars" },
                { id: "gallery", label: "Impact" },
                { id: "blog", label: "News & Blog" },
                { id: "leadership", label: "Leadership" }
              ].map((item) => (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => scrollToElement(item.id)}
                  className={`transition-colors duration-200 cursor-pointer ${
                    activeSection === item.id || (item.id === "hero" && activeSection === "hero")
                      ? "text-emerald-400 font-bold"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              {currentUser?.role === "admin" && (
                <button
                  onClick={() => setShowCustomizer(true)}
                  className="p-2 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Brand Customizer"
                >
                  <MonitorCog className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => scrollToElement("join")}
                id="header-cta-button"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest rounded-sm transition-all duration-200 cursor-pointer"
              >
                Join Network
              </button>
            </nav>

            {/* Mobile menu Toggle Button */}
            <div className="flex items-center lg:hidden" id="mobile-menu-control-wrapper">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                id="btn-mobile-menu-toggle"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Dropdown Panels */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-6 space-y-2 animate-fade-in" id="mobile-dropdown-menu">
            {[
              { id: "hero", label: "Home" },
              { id: "pillars", label: "Pillars of Impact" },
              { id: "gallery", label: "Our Impact Gallery" },
              { id: "blog", label: "News & Blog" },
              { id: "leadership", label: "Executive Leadership" },
              { id: "join", label: "Affiliate Roster Signup" }
            ].map((item) => (
              <button
                key={item.id}
                id={`mobile-nav-link-${item.id}`}
                onClick={() => scrollToElement(item.id)}
                className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-display font-medium transition-all ${
                  activeSection === item.id
                    ? "bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500 pl-3"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Layout Body */}
      <main className="flex-1" id="main-content-flow">

        {/* 2. Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-36" id="hero">
          
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none" id="hero-ambient-gradients">
            <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
            <div className="absolute bottom-[20%] right-[5%] w-[450px] h-[450px] rounded-full bg-indigo-500/5 blur-[130px]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center space-y-8" id="hero-inner-container">
            
            {/* Tagline Indicator Label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/50 border border-emerald-900/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest" id="hero-badge">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Global Vision & Development Alliance
            </div>

            {/* Strategic Mission Header */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-light text-slate-100 tracking-tight leading-[1.15] max-w-5xl mx-auto text-balance" id="hero-headline">
              Articulating <span className="italic text-emerald-400 font-medium">young minds</span> on the table of development.
            </h1>

            {/* Detailed Brand Synopsis */}
            <p className="text-xs sm:text-sm md:text-base text-slate-450 max-w-3xl mx-auto leading-relaxed tracking-wide" id="hero-subhead">
              The Visionary Young Innovators Network coordinates systemic, solution-oriented modules in strategic alliance with Voicecommedia. We actively fund educational tracks, advance local tree-planting buffers, and support Lisa Hospitals.
            </p>

            {/* Support Highlight Box */}
            <div className="inline-flex items-center gap-3 px-5 py-3.5 bg-slate-900 border-l-2 border-emerald-500 max-w-xl mx-auto backdrop-blur-sm" id="hero-hospital-support-ribbon">
              <span className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <HeartPulse className="w-5 h-5 animate-pulse" />
              </span>
              <div className="text-left">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Supporting Healthcare Alliance</p>
                <p className="text-xs font-semibold text-slate-200">LISA HOSPITALS — YOUR HEALTH, OUR PRIORITY</p>
              </div>
            </div>

            {/* Call To Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4" id="hero-cta-group">
              <button
                onClick={() => scrollToElement("join")}
                id="hero-cta-primary"
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest rounded-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
              >
                Join Network <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollToElement("pillars")}
                id="hero-cta-secondary"
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 border border-emerald-950/40 text-slate-400 hover:text-slate-100 font-semibold rounded-sm transition-all duration-300 cursor-pointer text-xs uppercase tracking-widest"
              >
                Our 5 Pillars
              </button>
            </div>

          </div>
        </section>

        {/* 3. The 5 Pillars Section */}
        <section className="py-24 border-t border-emerald-900/10 bg-slate-950/40 relative" id="pillars">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            {/* Section Headings */}
            <div className="text-center space-y-3" id="pillars-title-block">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">Strategic Vectors</span>
              <h2 className="text-2xl md:text-4xl font-display font-light text-slate-100 tracking-tight">Organizational Pillars</h2>
              <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
                Discover the direct action sectors that define the Visionary Young Innovators Network developmental mandate.
              </p>
            </div>

            {/* Responsive Pillars Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4" id="pillars-grid">
              {ORGANIZATIONAL_PILLARS.map((pillar) => (
                <div
                  key={pillar.id}
                  id={`pillar-card-${pillar.id}`}
                  className="group p-6 bg-slate-900/50 hover:bg-slate-900/80 border-l-2 border-emerald-500 border-y border-r border-emerald-950/10 rounded-sm hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Icon base container */}
                    <div className="p-2.5 bg-slate-950 rounded-sm border border-emerald-900/30 w-fit text-emerald-400" id={`pillar-icon-box-${pillar.id}`}>
                      {renderPillarIcon(pillar.iconName)}
                    </div>
                    {/* Header */}
                    <h3 className="text-sm font-semibold tracking-wide text-slate-100 group-hover:text-emerald-400 transition-colors duration-200">
                      {pillar.title}
                    </h3>
                    {/* Description copy */}
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                  
                  {/* Subtle link indicator */}
                  <div className="pt-4 border-t border-slate-950 mt-5 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Authorized Vector</span>
                    <span 
                      onClick={() => scrollToElement("join")}
                      className="text-emerald-500 group-hover:text-emerald-400 flex items-center gap-1 cursor-pointer font-semibold uppercase tracking-wider text-[10px]"
                    >
                      Support <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* 4. Strategic Impact Gallery Section */}
        <section className="py-24 border-y border-slate-850 relative" id="gallery">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            {/* Header copy */}
            <div className="text-center space-y-3" id="gallery-title-wrapper">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">Tactical Deployments</span>
              <h2 className="text-3xl md:text-5xl font-display font-semibold text-slate-100 tracking-tight">Impact & Media Gallery</h2>
              <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto">
                Explore a state-driven records registry containing real environmental campaigns, medical drives, and team assemblies.
              </p>
            </div>

            {/* Render Stateful Impact Component */}
            <ImpactGallery />

          </div>
        </section>

        {/* 4.5. News & Blog Section with secure Auth & Blog interface */}
        <section className="py-24 border-b border-emerald-900/10 bg-slate-905 relative" id="blog">
          {/* Subtle Accent Ambient Background Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none" id="blog-ambient-gradients">
            <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-emerald-500/4 blur-[120px]" />
            <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-indigo-500/4 blur-[110px]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative" id="blog-inner-container">
            
            {/* Section Headings */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-950" id="blog-header-block">
              <div className="space-y-3 text-left" id="blog-text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-900/80 border border-emerald-950/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest" id="blog-indicator-badge">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  System Ledger News Stream
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-light text-slate-100 tracking-tight">VYIN News & Narrative Matrix</h2>
                <p className="text-xs text-slate-400 max-w-xl leading-normal">
                  Track operations logs, reforestation milestones, clinic sponsor equipment timelines, and academic development achievements.
                </p>
              </div>

              {/* Secure authorization component portal */}
              <div className="w-full md:max-w-md" id="auth-portal-wrapper">
                <AuthInterface 
                  onAuthChange={handleAuthChange} 
                  currentUser={currentUser} 
                  currentToken={currentToken} 
                />
              </div>
            </div>

            {/* Core state-managed blog dashboard component */}
            <BlogSection 
              currentUser={currentUser} 
              currentToken={currentToken} 
            />

          </div>
        </section>

        {/* 5. Executive Leadership displays */}
        <section className="py-24 bg-slate-950/30" id="leadership">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            
            {/* Title Section */}
            <div className="text-center space-y-3" id="leadership-headings">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">Strategic Leadership</span>
              <h2 className="text-2xl md:text-4xl font-display font-light text-slate-100 tracking-tight">Executive Management</h2>
              <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
                Guided by visionary minds committed to durable developmental blueprints and community welfare structures.
              </p>
            </div>

            {/* Leaders Grid (Dual Profile Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="leadership-grid">
              {EXECUTIVE_LEADERS.map((leader, index) => (
                <div 
                  key={index} 
                  id={`leader-card-${index}`}
                  className="flex flex-col md:flex-row bg-slate-900/50 rounded-sm border border-slate-850 hover:border-emerald-500/20 transition-all duration-300"
                >
                  
                  {/* Photo Profile / Fallback Area */}
                  <div className="relative w-full md:w-48 bg-slate-950 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-850">
                    <div className="w-24 h-24 bg-slate-900 rounded-full border-2 border-emerald-500 overflow-hidden flex items-center justify-center shadow-inner relative group/avatar">
                      {leader.imagePath && !imageErrors[`leader-${index}`] ? (
                        <img 
                          src={leader.imagePath} 
                          alt={leader.name}
                          referrerPolicy="no-referrer"
                          onError={() => handleImageError(`leader-${index}`)}
                          className="w-full h-full object-cover object-top grayscale group-hover/avatar:grayscale-0 transition-all duration-500"
                        />
                      ) : (
                        <Users className="w-10 h-10 text-slate-400" id={`leader-icon-${index}`} />
                      )}
                    </div>
                    <div className="text-center mt-4">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">{leader.role}</span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">{leader.signature}</span>
                    </div>
                  </div>

                  {/* Profile Biographies */}
                  <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-4" id={`leader-body-${index}`}>
                    <div className="space-y-3">
                      <Quote className="w-6 h-6 text-emerald-500/20" id={`leader-quote-icon-${index}`} />
                      <h3 className="font-display font-bold text-lg text-slate-100">{leader.name}</h3>
                      
                      {leader.motto && (
                        <p className="text-[10px] font-mono font-medium tracking-wide text-emerald-400 italic">
                          "{leader.motto}"
                        </p>
                      )}
                      
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {leader.bio}
                      </p>
                    </div>

                    <div className="pt-3.5 border-t border-slate-950 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Active Registry
                      </span>
                      <span>Verified Strategic Officer</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Project Update Segment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2" id="project-update-info-block">
              <div className="p-5 bg-slate-900/60 border border-emerald-900/10 rounded-sm">
                <span className="text-xs text-emerald-400 font-mono block mb-2 font-semibold uppercase tracking-wider">01 / Tree Campaigns</span>
                <p className="text-xs text-slate-400 leading-normal">2,400+ Seedlings planted this quarter across 5 counties.</p>
              </div>
              <div className="p-5 bg-slate-900/60 border border-emerald-900/10 rounded-sm">
                <span className="text-xs text-emerald-400 font-mono block mb-2 font-semibold uppercase tracking-wider">02 / Medical Support</span>
                <p className="text-xs text-slate-400 leading-normal">Lisa Hospital Pediatric Wing expansion sponsorship active.</p>
              </div>
              <div className="p-5 bg-slate-900/60 border border-emerald-900/10 rounded-sm">
                <span className="text-xs text-emerald-400 font-mono block mb-2 font-semibold uppercase tracking-wider">03 / Scholarship Matrix</span>
                <p className="text-xs text-slate-400 leading-normal">12 Vulnerable students matched with education sponsors.</p>
              </div>
            </div>

            {/* General Alliance quote banner */}
            <div className="p-8 md:p-10 rounded-sm bg-slate-900 border border-emerald-900/10 text-center space-y-4" id="strategic-statement-banner">
              <span className="text-[10px] font-mono tracking-widest text-emerald-500 uppercase font-bold">Joint Strategic Alliance Statement</span>
              <p className="text-md text-slate-350 italic font-display max-w-4xl mx-auto leading-relaxed">
                "Our alliance with Voicecommedia is not a mere advertising campaign; it is a permanent infrastructure network. By channeling corporate advertising space into direct school sponsorships and supporting Lisa Hospitals' clinic equipment, we are proving that structural growth and health access can survive sustainably in local youth cadres."
              </p>
              <div className="h-px bg-slate-950 w-24 mx-auto my-2" />
              <p className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                Authorized by: Joint Office of the MD and CEO — Voicecommedia & VYIN
              </p>
            </div>

          </div>
        </section>

        {/* 6. Membership Enrolment form Section */}
        <section className="py-24 border-t border-emerald-900/10 bg-slate-950/60 relative" id="join">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            {/* Header label */}
            <div className="text-center space-y-3" id="join-titles">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">Co-Create Our Future</span>
              <h2 className="text-2xl md:text-4xl font-display font-light text-slate-100 tracking-tight">Initiate Active Enrollment</h2>
              <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
                State your primary developmental focus, submit credentials safely, and let our system automatically map you to active committees.
              </p>
            </div>

            {/* Embedded registration form */}
            <RegistrationForm />

          </div>
        </section>

        {/* Brand Customizer Overlay */}
        {showCustomizer && (
          <LogoCustomizer 
            onClose={() => setShowCustomizer(false)}
            currentSettings={logoSettings}
            onSettingsChange={setLogoSettings}
            currentToken={currentToken}
            isAdmin={currentUser?.role === "admin"}
          />
        )}

      </main>

      {/* 7. Footer showing Lisa Hospital motto */}
      <footer className="bg-slate-950 border-t border-emerald-900/10 font-mono" id="global-footer">
        
        {/* High-Impact Hospital Alliance Ribbon */}
        <div className="bg-emerald-600 text-slate-950 py-3.5 px-4 text-center font-mono text-[10px] md:text-xs font-bold tracking-widest uppercase" id="hospital-belt-banner">
          Proudly Supporting: LISA HOSPITALS — YOUR HEALTH, OUR PRIORITY
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8" id="footer-inner">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-emerald-990/10 text-center md:text-left text-xs text-slate-500" id="footer-cols">
            
            {/* Col 1 */}
            <div className="space-y-2" id="footer-col-1-brand">
              <span className="text-slate-300 uppercase tracking-widest font-bold text-[10px]">Strategic Operations Office</span>
              <p className="max-w-md leading-relaxed text-[11px]">
                The Visionary Young Innovators Network, in technical coordination with Voicecommedia, scales tree-planting buffers, education sponsorships, and local clinical logistics.
              </p>
            </div>

            {/* Col 2 */}
            <div className="space-y-2 md:text-right" id="footer-col-2-metadata">
              <span className="text-slate-300 uppercase tracking-widest font-bold text-[10px]">Registry Ledger</span>
              <p className="leading-relaxed text-[11px]">
                System Host: Cloud Run Container Core<br />
                Security Framework: Active TLS Routing
              </p>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center text-slate-650 text-[10px]" id="footer-bottom-bar">
            <span>
              &copy; {new Date().getFullYear()} THE VISIONARY YOUNG INNOVATORS NETWORK. ALL RIGHTS REGISTERED.
            </span>
            <div className="flex gap-4" id="footer-legal-links">
              <span className="hover:text-slate-400 cursor-pointer">Security Ledger</span>
              <span className="hover:text-slate-400 cursor-pointer">Terms & Conditions</span>
              <span className="hover:text-slate-500 flex items-center gap-1.5 justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Status: Secure Record Routing
              </span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
