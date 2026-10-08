import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { facultyApi } from '../api/faculties';
import { HostDepartment, Faculty } from '../types';
import { Layout } from '../components/layout/Layout';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  Search,
  BookOpen,
  Mail,
  Phone,
  Building,
  UserCheck,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Filter,
  CheckCircle2,
  Calendar,
  Eye,
  LayoutGrid,
  Table as TableIcon,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const DEPARTMENTS: { code: HostDepartment | 'ALL'; label: string; full: string }[] = [
  { code: 'ALL', label: 'All Depts', full: 'All Campus Departments' },
  { code: 'IT', label: 'IT', full: 'Information Technology' },
  { code: 'CE', label: 'CE', full: 'Computer Engineering' },
  { code: 'ENTC', label: 'ENTC', full: 'Electronics & Telecommunication' },
  { code: 'ECE', label: 'ECE', full: 'Electronics & Computer Engineering' },
  { code: 'AIDS', label: 'AI&DS', full: 'Artificial Intelligence & Data Science' },
  { code: 'BSE', label: 'BSE', full: 'Basic Sciences & Applied Engineering' },
];

export const FacultyDirectory: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [selectedDept, setSelectedDept] = useState<HostDepartment | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'department' | 'designation'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Fetch full faculty list
  const { data: faculties, isLoading } = useQuery({
    queryKey: ['faculties-directory', selectedDept],
    queryFn: () => facultyApi.getAllFaculties(selectedDept === 'ALL' ? undefined : selectedDept),
  });

  const filtered = useMemo(() => {
    let list = faculties || [];
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter((f) => {
        return (
          f.name.toLowerCase().includes(q) ||
          f.email.toLowerCase().includes(q) ||
          (f.phone && f.phone.includes(q)) ||
          f.department.toLowerCase().includes(q) ||
          (f.designation && f.designation.toLowerCase().includes(q))
        );
      });
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'department') return a.department.localeCompare(b.department);
      if (sortBy === 'designation') return (a.designation || '').localeCompare(b.designation || '');
      return a.name.localeCompare(b.name);
    });
  }, [faculties, searchTerm, sortBy]);

  const copyDetails = (f: Faculty) => {
    const text = `${f.name} (${f.department}) - Email: ${f.email}${f.phone ? ` | Phone: ${f.phone}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(f.id);
    toast.success(`Copied contact details for ${f.name}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Table View Columns aligned with DataTable component
  const columns: Column<Faculty>[] = [
    {
      header: 'Faculty Member',
      render: (f) => (
        <div>
          <p className="font-semibold text-slate-900 text-sm">{f.name}</p>
          <p className="text-[11px] text-slate-500 font-medium">{f.designation || 'Faculty Member'}</p>
        </div>
      ),
    },
    {
      header: 'Department',
      render: (f) => (
        <Badge variant={f.department === 'IT' || f.department === 'CE' ? 'purple' : 'info'}>
          {f.department}
        </Badge>
      ),
    },
    {
      header: 'Official Email',
      render: (f) => (
        <a
          href={`mailto:${f.email.split(';')[0].trim()}`}
          className="font-mono text-xs text-indigo-600 hover:text-indigo-800 hover:underline block truncate max-w-[220px]"
          title={f.email}
        >
          {f.email}
        </a>
      ),
    },
    {
      header: 'Phone / Intercom',
      render: (f) =>
        f.phone ? (
          <a
            href={`tel:${f.phone}`}
            className="font-mono text-xs font-semibold text-slate-800 hover:text-indigo-600 block"
          >
            {f.phone}
          </a>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Gate Assistance</span>
        ),
    },
    {
      header: 'Location',
      render: (f) => (
        <span className="text-xs text-slate-500">
          {f.cabinLocation || `${f.department} Department Building`}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (f) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              copyDetails(f);
            }}
            title="Copy Contact"
          >
            {copiedId === f.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFaculty(f);
            }}
            title="View Details Card"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
          </Button>
        </div>
      ),
    },
  ];

  const content = (
    <div className="space-y-6">
      {/* Page Header aligned with Vehicles / Gates / Visitors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <button
                onClick={() => navigate('/')}
                className="p-1 rounded hover:bg-slate-200 text-slate-600 transition"
                title="Back to Home"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 font-heading">
              <BookOpen className="w-5 h-5 text-indigo-700" /> Faculty & Staff Directory
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Search host faculty, HODs, official contacts, and campus departments before gate check-in.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-[2px] bg-white p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-[2px] transition ${
                viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-[2px] transition ${
                viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {!isAuthenticated && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/login')}
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="relative md:col-span-6 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            )}
          </div>

          {/* Department Select Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value as HostDepartment | 'ALL')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-medium text-slate-700 outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="ALL">All departments</option>
              {DEPARTMENTS.filter(d => d.code !== 'ALL').map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label} — {d.full}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Select Dropdown */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'department' | 'designation')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-medium text-slate-700 outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="name">Sort by name</option>
              <option value="department">Sort by department</option>
              <option value="designation">Sort by designation</option>
            </select>
          </div>
        </div>

        {/* Subline: Showing X of Y professors */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-900">{filtered.length}</strong> of{' '}
            <strong className="text-slate-900">{faculties?.length || 0}</strong> professors
          </span>

          {/* Quick Department Tags */}
          <div className="hidden sm:flex items-center gap-1">
            {DEPARTMENTS.map((dept) => {
              const isSelected = selectedDept === dept.code;
              return (
                <button
                  key={dept.code}
                  onClick={() => setSelectedDept(dept.code)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded transition shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={dept.full}
                >
                  {dept.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          emptyTitle="No faculty members found"
          emptyDescription={`No records matched "${searchTerm}". Try choosing another department or clearing search terms.`}
        />
      ) : (
        /* Grid View using standard clean cards */
        isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 bg-white border border-slate-200 rounded-[4px] p-5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-[4px] p-8 space-y-2">
            <Building className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-slate-800">No faculty members found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find anyone matching "{searchTerm}". Check your spelling or choose another department filter above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((f) => {
              const deptMeta: Record<string, { bg: string; text: string; avatarBg: string; avatarText: string }> = {
                IT: { bg: 'bg-indigo-50', text: 'text-indigo-700', avatarBg: 'bg-indigo-100', avatarText: 'text-indigo-800' },
                CE: { bg: 'bg-sky-50', text: 'text-sky-700', avatarBg: 'bg-sky-100', avatarText: 'text-sky-800' },
                ENTC: { bg: 'bg-purple-50', text: 'text-purple-700', avatarBg: 'bg-purple-100', avatarText: 'text-purple-800' },
                ECE: { bg: 'bg-blue-50', text: 'text-blue-700', avatarBg: 'bg-blue-100', avatarText: 'text-blue-800' },
                AIDS: { bg: 'bg-emerald-50', text: 'text-emerald-700', avatarBg: 'bg-emerald-100', avatarText: 'text-emerald-800' },
                BSE: { bg: 'bg-amber-50', text: 'text-amber-700', avatarBg: 'bg-amber-100', avatarText: 'text-amber-800' },
              };
              const theme = deptMeta[f.department] || { bg: 'bg-slate-100', text: 'text-slate-700', avatarBg: 'bg-slate-200', avatarText: 'text-slate-800' };

              // Clean Initials
              const initials = f.name
                .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Asst\.\s*Prof\.)\s*/i, '')
                .split(' ')
                .filter(Boolean)
                .map(n => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'FC';

              const deptFullName = DEPARTMENTS.find(d => d.code === f.department)?.full || f.department;

              return (
                <div
                  key={f.id}
                  className="bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-sm transition-all duration-200 p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Circular Avatar + Name + Title */}
                    <div className="flex items-center gap-3.5 mb-3.5">
                      <div className={`w-11 h-11 rounded-full ${theme.avatarBg} ${theme.avatarText} font-semibold text-xs flex items-center justify-center shrink-0`}>
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-slate-900 leading-snug truncate" title={f.name}>
                          {f.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
                          {f.designation || 'Faculty Member'}
                        </p>
                      </div>
                    </div>

                    {/* Middle Info Row: Department / Specialization */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{deptFullName}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${theme.bg} ${theme.text}`}>
                          {f.department} Department
                        </span>
                        {f.cabinLocation && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-slate-200/80 text-slate-600 truncate max-w-[180px]">
                            {f.cabinLocation}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Divider & Action Row */}
                  <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium truncate max-w-[140px]">
                      {f.department}
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => copyDetails(f)}
                        className="text-slate-400 hover:text-slate-600 text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copy contact details"
                      >
                        {copiedId === f.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setSelectedFaculty(f)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors cursor-pointer"
                      >
                        View profile
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modal with clean inspection card */}
      <Modal
        isOpen={!!selectedFaculty}
        onClose={() => setSelectedFaculty(null)}
        title="Faculty Profile"
        subtitle="Institutional Directory Information"
        maxWidth="md"
      >
        {selectedFaculty && (() => {
          const deptMeta: Record<string, { bg: string; text: string; avatarBg: string; avatarText: string }> = {
            IT: { bg: 'bg-indigo-50', text: 'text-indigo-700', avatarBg: 'bg-indigo-600', avatarText: 'text-white' },
            CE: { bg: 'bg-sky-50', text: 'text-sky-700', avatarBg: 'bg-sky-600', avatarText: 'text-white' },
            ENTC: { bg: 'bg-purple-50', text: 'text-purple-700', avatarBg: 'bg-purple-600', avatarText: 'text-white' },
            ECE: { bg: 'bg-blue-50', text: 'text-blue-700', avatarBg: 'bg-blue-600', avatarText: 'text-white' },
            AIDS: { bg: 'bg-emerald-50', text: 'text-emerald-700', avatarBg: 'bg-emerald-600', avatarText: 'text-white' },
            BSE: { bg: 'bg-amber-50', text: 'text-amber-700', avatarBg: 'bg-amber-600', avatarText: 'text-white' },
          };
          const theme = deptMeta[selectedFaculty.department] || { bg: 'bg-slate-100', text: 'text-slate-700', avatarBg: 'bg-slate-700', avatarText: 'text-white' };
          const cleanEmail = selectedFaculty.email ? selectedFaculty.email.split(';')[0].trim() : '';

          const initials = selectedFaculty.name
            .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Asst\.\s*Prof\.)\s*/i, '')
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'FC';

          const deptFullName = DEPARTMENTS.find(d => d.code === selectedFaculty.department)?.full || selectedFaculty.department;

          return (
            <div className="space-y-4 font-sans">
              {/* Header Profile Identity Card */}
              <div className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-4 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full ${theme.avatarBg} ${theme.avatarText} font-semibold text-base flex items-center justify-center shrink-0 shadow-xs`}>
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-slate-900 leading-snug truncate m-0">
                      {selectedFaculty.name}
                    </h4>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${theme.bg} ${theme.text} shrink-0`}>
                      {selectedFaculty.department}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-indigo-700 m-0 mt-0.5">
                    {selectedFaculty.designation || 'Faculty Member'}
                  </p>
                  <p className="text-xs text-slate-500 m-0 mt-0.5">
                    Department of {deptFullName}
                  </p>
                </div>
              </div>

              {/* Contact Information Fields */}
              <div className="space-y-2.5">
                {/* Official Email */}
                <div className="p-3 bg-slate-50/80 border border-slate-200/90 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 shadow-2xs">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">Official Email</span>
                      <a
                        href={`mailto:${cleanEmail}`}
                        className="text-sm font-medium text-slate-800 hover:text-indigo-600 truncate block mt-0.5 transition-colors"
                      >
                        {cleanEmail}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(cleanEmail);
                      toast.success('Email copied to clipboard');
                    }}
                    className="p-1.5 rounded hover:bg-white text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    title="Copy email"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                {/* Phone Number */}
                <div className="p-3 bg-slate-50/80 border border-slate-200/90 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 shadow-2xs">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">Phone Number</span>
                      {selectedFaculty.phone ? (
                        <a
                          href={`tel:${selectedFaculty.phone}`}
                          className="text-sm font-semibold text-slate-900 hover:text-indigo-600 block mt-0.5 tracking-normal transition-colors"
                        >
                          {selectedFaculty.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic block mt-0.5">Assistance via Main Security Gate</span>
                      )}
                    </div>
                  </div>
                  {selectedFaculty.phone && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedFaculty.phone!);
                        toast.success('Phone copied to clipboard');
                      }}
                      className="p-1.5 rounded hover:bg-white text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title="Copy phone"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Cabin / Location */}
                <div className="p-3 bg-slate-50/80 border border-slate-200/90 rounded-lg flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 shadow-2xs">
                    <Building className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">Campus Location / Cabin</span>
                    <span className="text-xs font-medium text-slate-800 block mt-0.5">
                      {selectedFaculty.cabinLocation || `${selectedFaculty.department} Department Building, PICT Pune Campus`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button variant="outline" size="sm" onClick={() => setSelectedFaculty(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    copyDetails(selectedFaculty);
                    setSelectedFaculty(null);
                  }}
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                >
                  Copy Full Details
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );

  // If user is authenticated, wrap with standard Layout (Sidebar + Topbar)
  // If public visitor, wrap with clean institutional header
  if (isAuthenticated) {
    return <Layout>{content}</Layout>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Institutional Topbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="CampusAccess" className="h-8 w-auto object-contain" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 border-l border-slate-200 pl-3">
              PICT Access Terminal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium transition"
            >
              Home
            </button>
            <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
              Sign in
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
        {content}
      </main>
    </div>
  );
};

export default FacultyDirectory;
