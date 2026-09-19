import { FileText, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import CaseListItem from '../components/CaseListItem';
import StatCard from '../components/StatCard';
import { useDisputeStore } from '../store/disputeStore';

import { ImagesBadge } from '@/components/ui/images-badge';
import { motion } from 'motion/react';

export function Dashboard() {
  const { disputes } = useDisputeStore();

  const stats = {
    total: disputes.length,
    pending: disputes.filter(d => d.status === 'PENDING').length,
    resolved: disputes.filter(d => d.status === 'APPROVED' || d.status === 'OVERRIDDEN').length,
    escalated: disputes.filter(d => d.status === 'ESCALATED').length,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}
      >

        {/* Header */}
        <motion.div variants={itemVariants} style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Dispute Cases Queue</h1>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              Review and resolve payment disputes with AI-powered multi-agent analysis
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center justify-center">
            <ImagesBadge
              text="Nyaya Dispute Resolution AI"
              images={[
                "https://cdn.worldvectorlogo.com/logos/paytm.svg",
                "https://assets.aceternity.com/pro/agenforce-2.webp",
                "https://assets.aceternity.com/pro/agenforce-3.webp",
              ]}
            />
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={itemVariants} style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
          <StatCard icon={FileText}      label="Total Cases" value={stats.total}     subtext="All filed disputes"     accent="total"     />
          <StatCard icon={Clock}         label="Pending"     value={stats.pending}   subtext="Awaiting resolution"    accent="pending"   />
          <StatCard icon={CheckCircle2}  label="Resolved"    value={stats.resolved}  subtext="Successfully closed"    accent="resolved"  />
          <StatCard icon={AlertTriangle} label="Escalated"   value={stats.escalated} subtext="Needs human review"     accent="escalated" />
        </motion.div>

        {/* Cases */}
        <motion.div variants={itemVariants}>
          {disputes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
              <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: 13 }}>No cases found</p>
            </div>
          ) : (
            disputes.map(c => <CaseListItem key={c.id} caseData={c} />)
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
