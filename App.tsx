
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useSearchParams } from 'react-router-dom';
import { Dna, Mail, Github, MapPin } from 'lucide-react';
import { ThreeDNA } from './components/ThreeDNA';
import { ChatBot } from './components/ChatBot';
import { Research } from './pages/Research';
import { io, Socket } from 'socket.io-client';

const Home: React.FC = () => (
  <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
    {/* 3D Background Layer - Z index 0 */}
    <ThreeDNA />

    {/* Content Overlay - Z index 10, Pointer Events None allows clicking through to Canvas */}
    <div className="relative z-10 text-center space-y-4 px-4 pointer-events-none select-none mt-[-5vh]">
      <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight drop-shadow-2xl">
        <span className="text-white">Computational </span>
        <br className="md:hidden" />
        <span
          className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-green-400 to-purple-400 animate-gradient pr-2"
          style={{
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Biology
        </span>
      </h1>
      <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
        unraveling the 3D genome, one interaction at a time.
      </p>
    </div>

    {/* Instruction Text - Centered and Animated */}
    <div className="absolute bottom-9 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none hidden md:block">
      <p className="text-lg md:text-xl text-white font-light animate-double-blink">
        Drag or Zoom to interact
      </p>
    </div>
  </div>
);

const About: React.FC = () => (
  <div className="min-h-screen bg-white pt-32 pb-20 px-6 animate-fadeIn">
    <div className="max-w-4xl mx-auto">
      <h2 className="text-4xl font-bold text-slate-900 mb-12 flex items-center gap-3 border-b border-slate-100 pb-6">
        {/* <span className="text-green-600"><Dna size={36} /></span> */}
        About Me
      </h2>

      <div className="prose prose-xl text-slate-600 leading-relaxed">
        <p className="mb-8">
          I completed my <strong>Ph.D. in Computational Biology</strong> at <a href="https://www.uthsc.edu" target="_blank" rel="noopener noreferrer">the University of Tennessee Health Science Center (UTHSC)</a> in September 2025. My research lies at the intersection of genomics and data science, focusing specifically on <strong>3D chromatin architecture</strong>, <strong>promoter–enhancer interactions</strong>, and the integration of <strong>Hi-C</strong> data with <strong>GWAS</strong> findings to understand the regulatory mechanisms underlying complex traits.
        </p>

        <p className="mb-8">
          My academic journey is driven by a passion for decoding the non-coding genome. I specialize in developing and applying computational pipelines to map 3D genomic structures, enabling the identification of long-range regulatory loops that control gene expression.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Research Interests</h3>
            <ul className="space-y-3 text-base">
              <li>• 3D Genomics </li>
              <li>• Single-cell sequencing for cancer research</li>
              <li>• Structural Variant Analysis</li>
            </ul>
          </div>
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Hobbies</h3>
            <ul className="space-y-3 text-base">
              <li>• Riding a bike</li>
              <li>• Camping</li>
              <li>• Traveling</li>
            </ul>
          </div>
        </div>

        <p>
          Looking forward, I aspire to leverage my expertise in a dynamic environment within the <strong>Pharmaceutical or IT industry</strong>, contributing to drug discovery and precision medicine through advanced computational strategies.
        </p>
      </div>
    </div>
  </div>
);

const Tech: React.FC = () => {
  const [selectedPost, setSelectedPost] = React.useState<number | null>(null);

  // Content defined in reverse chronological order (Newest first)
  const postsContent = [
    {
      title: "Rapid Prototyping with Google AI Studio",
      category: "AI Tools",
      desc: "Google AI Studio offers a streamlined interface for prompt engineering and model tuning. Learn how to effectively test system instructions before deploying to production.",
      fullContent: "Google AI Studio provides an intuitive platform for rapid prototyping of AI applications. With its streamlined interface, developers can quickly iterate on prompt engineering strategies and fine-tune models without extensive setup.\n\nKey features include:\n• Real-time prompt testing and validation\n• System instruction optimization\n• Model comparison tools\n• Seamless deployment pipeline\n\nThis tool is particularly valuable for bioinformatics applications where precise prompt engineering can significantly impact the quality of genomic data analysis and interpretation.",
    },
    {
      title: "Optimizing with Gemini Nano & Flash",
      category: "Models",
      desc: "Exploring the 'nano banana' (Gemini 2.5 Flash Image) series for efficient, on-device compatible multimodal tasks. A look at balancing latency and token costs in bioinformatics apps.",
      fullContent: "The Gemini Nano and Flash models represent a breakthrough in efficient AI processing. These lightweight models are designed for on-device compatibility while maintaining impressive performance across multimodal tasks.\n\nPerformance Characteristics:\n• Ultra-low latency for real-time applications\n• Reduced token costs for large-scale processing\n• Multimodal capabilities (text, image, code)\n• Optimized for edge computing scenarios\n\nIn bioinformatics, these models excel at processing genomic sequences, analyzing microscopy images, and generating insights from complex datasets without requiring constant cloud connectivity.",
    },
    {
      title: "Advanced Genomic Data Visualization",
      category: "Visualization",
      desc: "Modern genomic research demands sophisticated visualization techniques to make sense of complex 3D chromatin structures and regulatory networks.",
      fullContent: "Modern genomic research demands sophisticated visualization techniques to make sense of complex 3D chromatin structures and regulatory networks.\n\nVisualization Approaches:\n• Interactive 3D genome browsers\n• Hi-C contact map rendering\n• Chromatin loop visualization\n• Multi-omics data integration\n• Real-time data exploration\n\nBy leveraging advanced rendering techniques and WebGL, we can create immersive visualizations that help researchers identify patterns in chromatin architecture and understand the spatial organization of the genome.",
    },
    {
      title: "Google Antigravity: A Physics Metaphor?",
      category: "Experimental",
      desc: "A playful look at 'Google Antigravity'—often an easter egg, but metaphorically representing how we defy the weight of massive genomic datasets using cloud computing.",
      fullContent: "The concept of 'Google Antigravity' serves as a powerful metaphor for modern computational biology. Just as antigravity would defy physical constraints, cloud computing allows us to transcend the limitations of local hardware.\n\nCloud Computing Advantages:\n• Massive parallel processing capabilities\n• Elastic scaling for variable workloads\n• Distributed storage for petabyte-scale datasets\n• Global collaboration infrastructure\n• Cost-effective resource allocation\n\nIn genomics, this 'antigravity' effect enables researchers to analyze entire populations' worth of sequencing data, run complex simulations, and collaborate across continents—tasks that would be impossible with traditional computing infrastructure.",
    },
  ];

  // Fixed Color Themes Order: Blue -> Green -> Pink -> Purple
  const colorThemes = [
    { color: "bg-blue-50", textColor: "text-blue-700", borderColor: "border-blue-100", hoverBorderColor: "hover:border-blue-200", hoverColor: "group-hover:text-blue-600" },
    { color: "bg-green-50", textColor: "text-green-700", borderColor: "border-green-100", hoverBorderColor: "hover:border-green-200", hoverColor: "group-hover:text-green-600" },
    { color: "bg-pink-50", textColor: "text-pink-700", borderColor: "border-pink-100", hoverBorderColor: "hover:border-pink-200", hoverColor: "group-hover:text-pink-600" },
    { color: "bg-purple-50", textColor: "text-purple-700", borderColor: "border-purple-100", hoverBorderColor: "hover:border-purple-200", hoverColor: "group-hover:text-purple-600" },
  ];

  // Combine content with themes
  const posts = postsContent.map((post, i) => ({
    ...post,
    ...colorThemes[i % colorThemes.length]
  }));

  return (
    <div className="h-screen bg-white pt-24 pb-4 px-6 flex flex-col overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center border-b border-slate-100 pb-4 flex-shrink-0">Tech Blog</h2>

        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
          {/* Sidebar TOC - Visible on all screens, but styling changes? 
              User said: "When width is reduced further, show only TOC".
          */}
          <div className="lg:w-64 flex-shrink-0 space-y-3 overflow-y-auto pr-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sticky top-0 bg-white py-2">Latest Posts</h3>
            {posts.map((post, i) => (
              <div
                key={i}
                onClick={() => setSelectedPost(i)}
                className={`
                  group cursor-pointer transition-all duration-200
                  bg-slate-50 px-4 py-3 rounded-lg border border-slate-200
                  hover:${post.color} hover:${post.borderColor}
                `}
              >
                <p className={`
                  text-sm font-medium text-slate-600 truncate
                  group-hover:${post.textColor}
                `}>
                  {post.title}
                </p>
              </div>
            ))}
          </div>

          {/* Grid - Hidden on very small screens (< 640px), 1 col on medium, 2 cols on large */}
          <div className="hidden sm:grid flex-1 grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
            {posts.map((post, i) => (
              <div key={i} className="group bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
                {/* Compact Header */}
                <div className={`${post.color} py-3 px-6 flex flex-col justify-center flex-shrink-0`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${post.textColor} bg-white/80 w-fit px-2 py-1 rounded-md`}>
                    {post.category}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col min-h-0">
                  <h3 className="text-lg font-bold text-slate-800 mb-2 transition-colors line-clamp-1">
                    {post.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed flex-1 line-clamp-3">
                    {post.desc}
                  </p>
                  <button
                    onClick={() => setSelectedPost(i)}
                    className={`mt-4 text-xs font-bold text-slate-900 ${post.hoverColor} transition-colors self-start flex items-center gap-1`}
                  >
                    Read Article &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Popup */}
      {selectedPost !== null && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modalBackdrop"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl animate-modalContent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`${posts[selectedPost].color} p-8`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${posts[selectedPost].textColor} bg-white/80 w-fit px-3 py-1.5 rounded-md`}>
                {posts[selectedPost].category}
              </span>
              <h2 className="text-3xl font-bold text-slate-900 mt-4">
                {posts[selectedPost].title}
              </h2>
            </div>
            <div className="p-8 overflow-y-auto max-h-[calc(80vh-200px)]">
              <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
                {posts[selectedPost].fullContent}
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Contact: React.FC = () => (
  <div className="min-h-screen bg-white pt-32 pb-20 px-6 flex flex-col items-center">
    <div className="max-w-2xl w-full animate-fadeIn">
      <h2 className="text-4xl font-bold text-slate-900 mb-16 text-center border-b border-slate-100 pb-8">Get in Touch</h2>

      <div className="space-y-8">
        <a href="mailto:distilledchild@gmail.com" className="flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors group border border-slate-100 hover:border-blue-100">
          <div className="bg-white p-4 rounded-full shadow-sm text-slate-700 group-hover:text-blue-600 transition-colors">
            <Mail size={32} />
          </div>
          <div className="ml-6 text-left">
            <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Email</p>
            <p className="text-xl text-slate-900 font-medium break-all">distilledchild@gmail.com</p>
          </div>
        </a>

        <a href="https://github.com/distilledchild" target="_blank" rel="noopener noreferrer" className="flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-green-50 transition-colors group border border-slate-100 hover:border-green-100">
          <div className="bg-white p-4 rounded-full shadow-sm text-slate-700 group-hover:text-green-600 transition-colors">
            <Github size={32} />
          </div>
          <div className="ml-6 text-left">
            <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">GitHub</p>
            <p className="text-xl text-slate-900 font-medium break-all">github.com/distilledchild</p>
          </div>
        </a>

        <a href="https://www.linkedin.com/in/pkim11/" target="_blank" rel="noopener noreferrer" className="flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-pink-50 transition-colors group border border-slate-100 hover:border-pink-100">
          <div className="bg-white p-4 rounded-full shadow-sm text-slate-700 group-hover:text-pink-600 transition-colors">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </div>
          <div className="ml-6 text-left">
            <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">LinkedIn</p>
            <p className="text-xl text-slate-900 font-medium break-all">linkedin.com/in/distilledchild</p>
          </div>
        </a>

        <a href="https://www.google.com/maps/place/Memphis,+TN" target="_blank" rel="noopener noreferrer" className="flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-purple-50 transition-colors group cursor-default border border-slate-100 hover:border-purple-100">
          <div className="bg-white p-4 rounded-full shadow-sm text-slate-700 group-hover:text-purple-600 transition-colors">
            <MapPin size={32} />
          </div>
          <div className="ml-6 text-left">
            <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Location</p>
            <p className="text-xl text-slate-900 font-medium">Memphis, TN, USA</p>
          </div>
        </a>


      </div>
    </div>
  </div>
);

// Liquid Crystal Tab Component - 95% of original size
const LiquidTab = ({ to, label, active, colorClass, badgeCount }: { to: string; label: string; active: boolean; colorClass: string; badgeCount?: number }) => (
  <Link
    to={to}
    className={`
      relative px-3 md:px-5 py-2 md:py-3 rounded-full transition-all duration-200 group overflow-hidden
      font-extrabold tracking-tighter hover:scale-105
      ${colorClass}
    `}
    style={{ fontSize: 'clamp(1.5rem, 3.8vw, 2.28rem)' }}
  >
    {/* Content with Floating Animation */}
    <span className="relative z-10 block transition-transform duration-300 ease-out group-hover:-translate-y-2 flex items-center gap-2">
      {label}
      {badgeCount !== undefined && (
        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
          {badgeCount}
        </span>
      )}
    </span>
  </Link>
);

const Layout: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Owner Queue State
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get('admin') === 'true';
  const [queueCount, setQueueCount] = useState<number | null>(null);

  useEffect(() => {
    if (isAdmin) {
      const socket = io('https://personal-web-2025-production.up.railway.app');

      socket.on('connect', () => {
        socket.emit('register_owner');
      });

      socket.on('queue_update', (data: { count: number }) => {
        setQueueCount(data.count);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isAdmin]);

  return (
    <div className="min-h-screen font-sans text-slate-900">
      {/* Branding Logo - Visible on ALL pages top left */}
      <div className="fixed top-0 left-0 z-50 p-4 md:p-8 flex items-center">
        <Link to="/" className="font-extrabold tracking-tighter flex items-center text-slate-900" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.4rem)' }}>
          <span className="text-green-500">Distilled</span>
          <span className="text-purple-500">Child</span>
        </Link>
      </div>

      {/* Hamburger Menu Button - Mobile Only */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-0 right-0 z-50 p-6 lg:hidden pointer-events-auto"
        aria-label="Toggle menu"
      >
        <div className="w-8 h-8 flex flex-col justify-center items-center gap-1.5">
          <span className={`w-full h-0.5 bg-slate-900 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-full h-0.5 bg-slate-900 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-full h-0.5 bg-slate-900 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-modalBackdrop"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="fixed top-20 right-4 bg-white rounded-3xl shadow-2xl p-6 animate-modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-4">
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-extrabold text-blue-500 hover:text-blue-300 transition-colors px-4 py-2">
                About
              </Link>
              <Link to="/research" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-extrabold text-teal-500 hover:text-teal-300 transition-colors px-4 py-2">
                Research
              </Link>
              <Link to="/tech" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-extrabold text-pink-500 hover:text-pink-300 transition-colors px-4 py-2">
                Tech
              </Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-extrabold text-purple-500 hover:text-purple-300 transition-colors px-4 py-2">
                Contact
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar - Desktop Only */}
      <nav className="fixed top-0 right-0 w-full z-50 p-[0.9rem] md:p-[1.8rem] justify-end pointer-events-none hidden lg:flex">
        <div className="pointer-events-auto flex gap-3 items-center bg-white/0 backdrop-blur-none">
          <LiquidTab
            to="/about"
            label="About"
            active={location.pathname === '/about'}
            colorClass="text-blue-500 hover:text-blue-300"
          />
          <LiquidTab
            to="/research"
            label="Research"
            active={location.pathname === '/research'}
            colorClass="text-teal-500 hover:text-teal-300"
          />
          <LiquidTab
            to="/tech"
            label="Tech"
            active={location.pathname === '/tech'}
            colorClass="text-pink-500 hover:text-pink-300"
          />
          <LiquidTab
            to="/contact"
            label="Contact"
            active={location.pathname === '/contact'}
            colorClass="text-purple-500 hover:text-purple-300"
            badgeCount={queueCount !== null ? queueCount : undefined}
          />
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/research" element={<Research />} />
        <Route path="/tech" element={<Tech />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      <ChatBot />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout />
    </Router>
  );
};

export default App;
