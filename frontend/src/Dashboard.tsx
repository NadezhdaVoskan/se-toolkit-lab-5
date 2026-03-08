import { useState, useEffect, useReducer } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
)

// API Response types
interface ScoreBucket {
  bucket: string
  count: number
}

interface TimelineEntry {
  date: string
  submissions: number
}

interface PassRateEntry {
  task: string
  avg_score: number
  attempts: number
}

interface LabOption {
  id: string
  title: string
}

// Available labs for selection
const LABS: LabOption[] = [
  { id: 'lab-03', title: 'Lab 03 — Backend' },
  { id: 'lab-04', title: 'Lab 04 — Testing' },
]

// Fetch state types
type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; scores: ScoreBucket[]; timeline: TimelineEntry[]; passRates: PassRateEntry[] }
  | { status: 'error'; message: string }

type FetchAction =
  | { type: 'fetch_start' }
  | { type: 'fetch_success'; scores: ScoreBucket[]; timeline: TimelineEntry[]; passRates: PassRateEntry[] }
  | { type: 'fetch_error'; message: string }

function fetchReducer(_state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case 'fetch_start':
      return { status: 'loading' }
    case 'fetch_success':
      return { status: 'success', scores: action.scores, timeline: action.timeline, passRates: action.passRates }
    case 'fetch_error':
      return { status: 'error', message: action.message }
  }
}

interface DashboardProps {
  token: string
  onDisconnect: () => void
}

export default function Dashboard({ token, onDisconnect }: DashboardProps) {
  const [selectedLab, setSelectedLab] = useState<string>(LABS[0]?.id ?? '')
  const [fetchState, dispatch] = useReducer(fetchReducer, { status: 'idle' })

  useEffect(() => {
    if (!token || !selectedLab) return

    dispatch({ type: 'fetch_start' })

    const fetchScores = fetch(`/analytics/scores?lab=${selectedLab}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch scores: HTTP ${res.status}`)
      return res.json() as Promise<ScoreBucket[]>
    })

    const fetchTimeline = fetch(`/analytics/timeline?lab=${selectedLab}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch timeline: HTTP ${res.status}`)
      return res.json() as Promise<TimelineEntry[]>
    })

    const fetchPassRates = fetch(`/analytics/pass-rates?lab=${selectedLab}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch pass rates: HTTP ${res.status}`)
      return res.json() as Promise<PassRateEntry[]>
    })

    Promise.all([fetchScores, fetchTimeline, fetchPassRates])
      .then(([scores, timeline, passRates]) => {
        dispatch({ type: 'fetch_success', scores, timeline, passRates })
      })
      .catch((err: Error) => {
        dispatch({ type: 'fetch_error', message: err.message })
      })
  }, [token, selectedLab])

  // Bar chart data for score distribution
  const scoreChartData = {
    labels: fetchState.status === 'success' ? fetchState.scores.map((s) => s.bucket) : [],
    datasets: [
      {
        label: 'Number of Students',
        data: fetchState.status === 'success' ? fetchState.scores.map((s) => s.count) : [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  }

  // Line chart data for timeline
  const timelineChartData = {
    labels: fetchState.status === 'success' ? fetchState.timeline.map((t) => t.date) : [],
    datasets: [
      {
        label: 'Submissions',
        data: fetchState.status === 'success' ? fetchState.timeline.map((t) => t.submissions) : [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  }

  return (
    <div className="dashboard">
      <header className="app-header">
        <h1>Dashboard</h1>
        <div className="header-controls">
          <select
            value={selectedLab}
            onChange={(e) => setSelectedLab(e.target.value)}
            className="lab-select"
          >
            {LABS.map((lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.title}
              </option>
            ))}
          </select>
          <button className="btn-disconnect" onClick={onDisconnect}>
            Disconnect
          </button>
        </div>
      </header>

      {fetchState.status === 'loading' && <p>Loading dashboard data...</p>}

      {fetchState.status === 'error' && (
        <p className="error-message">Error: {fetchState.message}</p>
      )}

      {fetchState.status === 'success' && (
        <div className="dashboard-content">
          <section className="chart-section">
            <h2>Score Distribution</h2>
            <Bar data={scoreChartData} options={chartOptions} />
          </section>

          <section className="chart-section">
            <h2>Submission Timeline</h2>
            <Line data={timelineChartData} options={chartOptions} />
          </section>

          <section className="table-section">
            <h2>Pass Rates by Task</h2>
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Average Score</th>
                  <th>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {fetchState.passRates.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.task}</td>
                    <td>{entry.avg_score.toFixed(1)}</td>
                    <td>{entry.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  )
}
