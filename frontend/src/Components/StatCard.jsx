// components/StatCard.jsx
function StatCard({ title, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <div className="stat-info">
          <h3>{title}</h3>
          <p>{value}</p>
        </div>
        <div className={`stat-icon ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

export default StatCard;