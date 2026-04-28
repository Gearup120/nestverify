import { ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react'

export default function FraudScorePanel({ score = 0, flags = [], onAnalyze, analyzing }) {
  const percent = Math.round((score || 0) * 100)

  const getRisk = () => {
    if (percent >= 70) return { label: 'Very high risk', color: 'text-red-600', bar: 'bg-red-500', bg: 'bg-red-50 border-red-100' }
    if (percent >= 45) return { label: 'High risk',      color: 'text-orange-600', bar: 'bg-orange-400', bg: 'bg-orange-50 border-orange-100' }
    if (percent >= 20) return { label: 'Medium risk',    color: 'text-amber-600', bar: 'bg-amber-400', bg: 'bg-amber-50 border-amber-100' }
    return                     { label: 'Low risk',      color: 'text-teal-600',  bar: 'bg-teal-500', bg: 'bg-teal-50 border-teal-100' }
  }

  const risk = getRisk()

  return (
    <div className={`card p-5 border ${risk.bg} space-y-3`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-teal-600" />
          AI fraud score
        </h3>
        <button
          onClick={onAnalyze}
          disabled={analyzing}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-teal-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={11} className={analyzing ? 'animate-spin' : ''} />
          {analyzing ? 'Analyzing...' : 'Re-scan'}
        </button>
      </div>

      {/* Score */}
      <div>
        <div className="flex items-end justify-between mb-1.5">
          <span className={`text-2xl font-serif font-bold ${risk.color}`}>{percent}%</span>
          <span className={`text-xs font-medium ${risk.color}`}>{risk.label}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${risk.bar} rounded-full transition-all duration-500`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Flags */}
      {flags?.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500">Flags detected:</p>
          {flags.map((flag, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700 bg-white/70 rounded px-2 py-1.5">
              <AlertTriangle size={10} className="flex-shrink-0 mt-0.5" />
              {flag}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-teal-600 flex items-center gap-1">
          <ShieldCheck size={11} /> No fraud signals detected.
        </p>
      )}
    </div>
  )
}
