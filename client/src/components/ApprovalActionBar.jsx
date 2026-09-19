import { Check, X } from 'lucide-react';

function ApprovalActionBar({ onApprove, onReject, isLoading = false, isActioned = false }) {
  if (isActioned) return null;

  return (
    <div className="animate-fade-in bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 mt-4">
      <p className="text-[13px] text-[#374151] mb-3">
        This verdict requires human review. Please review the reasoning above and take action:
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onApprove}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold
                     hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4" />
          Approve
        </button>
        <button
          onClick={onReject}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-lg text-sm font-semibold
                     hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
          Reject
        </button>
      </div>
    </div>
  );
}

export default ApprovalActionBar;
