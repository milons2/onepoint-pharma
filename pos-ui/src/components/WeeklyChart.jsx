import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
} from 'chart.js';

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip
);

function WeeklyChart({ data }) {
  // Calculate 7-day totals for verification
  const totalSales7D = data.reduce((acc, curr) => acc + curr.sales, 0);
  const totalProfit7D = data.reduce((acc, curr) => acc + curr.profit, 0);

  const labels = data.map(d => {
  // Split the YYYY-MM-DD string to avoid JS timezone shifts
  const [year, month, day] = d.day.split('-');
  const date = new Date(year, month - 1, day); 
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
});

  const chartData = {
    labels,
    datasets: [
      {
        type: 'line',
        label: 'Net Sales (BDT)',
        data: data.map(d => d.sales),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        borderWidth: 3,
        pointRadius: 4,
        tension: 0.3,
      },
      {
        type: 'bar',
        label: 'Net Profit (BDT)',
        data: data.map(d => d.profit),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        hoverBackgroundColor: '#10b981',
        borderRadius: 4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => `${context.dataset.label}: ৳${context.raw.toFixed(2)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (val) => '৳' + val }
      }
    }
  };

  return (
    <div className="chart-container" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>Weekly Performance</h2>
        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>
          <div>7D Sales: <strong>৳{totalSales7D.toLocaleString()}</strong></div>
          <div>7D Profit: <strong>৳{totalProfit7D.toLocaleString()}</strong></div>
        </div>
      </div>
      
      <div style={{ height: '300px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

export default WeeklyChart;