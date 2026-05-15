interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  sub?: string;
  color?: string;
}

export default function StatCard({ label, value, unit, icon, sub, color = "text-green-600" }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>
          {value}
          {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
