interface PageHeaderProps {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ icon, title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
