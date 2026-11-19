import { Link, useLocation } from 'react-router-dom';
import { Scale, LayoutDashboard, BarChart3, MessageSquare } from 'lucide-react';

function Navbar() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const linkClass = (path) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-[#111827] text-white'
        : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
    }`;

  return (
    <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-[#111827] leading-none">Nyaya</h1>
              <p className="text-[10px] text-[#6B7280] tracking-wide">AI DISPUTE RESOLUTION</p>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <Link to="/" className={linkClass('/')}>
              <MessageSquare className="w-4 h-4" />
              AI Assistant
            </Link>
            <Link to="/cases" className={linkClass('/cases')}>
              <LayoutDashboard className="w-4 h-4" />
              Case Queue
            </Link>
            <Link to="/impact" className={linkClass('/impact')}>
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
