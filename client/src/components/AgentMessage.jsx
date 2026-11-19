import React from 'react';
import { Loader2 } from 'lucide-react';

const AGENT_CONFIG = {
  evidence: {
    name: 'Evidence Agent',
    icon: '🔍',
    borderColor: 'border-l-blue-400',
    description: 'Analyzing transaction records and dispute evidence...'
  },
  merchant: {
    name: 'Merchant Advocate',
    icon: '🏪',
    borderColor: 'border-l-[#6B7280]',
    description: "Constructing the merchant's position..."
  },
  customer: {
    name: 'Customer Advocate',
    icon: '👤',
    borderColor: 'border-l-emerald-500',
    description: "Constructing the customer's position..."
  },
  judge: {
    name: 'Judge Agent',
    icon: '⚖️',
    borderColor: 'border-l-violet-500',
    description: 'Weighing evidence and reaching a verdict...'
  }
};

/**
 * Accepts two call signatures:
 *   1. <AgentMessage agent="evidence" content={...} isLoading={false} />   (CaseDetail)
 *   2. <AgentMessage output={{ agent, content, ... }} />                    (LiveDispute)
 */
function AgentMessage({ agent, content, isLoading = false, output }) {
  // Normalise: if called with `output` prop (LiveDispute), unpack it
  const resolvedAgent = agent ?? output?.agent;
  const resolvedContent = content ?? output?.content;
  const resolvedLoading = isLoading || output?.isLoading || false;

  const config = AGENT_CONFIG[resolvedAgent];
  if (!config) return null;

  return (
    <div className={`border-l-4 ${config.borderColor} bg-white border border-[#E5E7EB] rounded-r-xl p-4 mb-3 animate-fade-in`}>
      <div className="flex items-start gap-3">
        {/* Agent icon */}
        <div className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0 text-lg">
          {config.icon}
        </div>

        {/* Agent content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-[#111827] text-[13px]">{config.name}</span>
            {resolvedLoading && (
              <Loader2 className="w-3.5 h-3.5 text-[#6B7280] animate-spin" />
            )}
          </div>

          {resolvedLoading ? (
            <p className="text-[13px] text-[#6B7280] italic">{config.description}</p>
          ) : resolvedContent ? (
            <div className="text-[13px] text-[#374151] space-y-2">
              {renderAgentContent(resolvedAgent, resolvedContent)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function renderAgentContent(agent, content) {
  if (!content) return null;

  // Content may arrive as a plain string (from pipeline stream) or as a structured object
  if (typeof content === 'string') {
    return <p className="leading-relaxed">{content}</p>;
  }

  return (
    <>
      {content.summary && (
        <p className="leading-relaxed">{content.summary}</p>
      )}
      {content.position && (
        <p className="leading-relaxed">{content.position}</p>
      )}
      {content.key_facts && content.key_facts.length > 0 && (
        <div className="mt-2">
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Key Facts</span>
          <ul className="mt-1.5 space-y-1.5">
            {content.key_facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-[#374151]">
                <span className="text-[#F97316] mt-0.5 shrink-0">›</span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {content.supporting_points && content.supporting_points.length > 0 && (
        <div className="mt-2">
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Supporting Points</span>
          <ul className="mt-1.5 space-y-1.5">
            {content.supporting_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-[#374151]">
                <span className="text-[#F97316] mt-0.5 shrink-0">›</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default AgentMessage;
export { AGENT_CONFIG };
